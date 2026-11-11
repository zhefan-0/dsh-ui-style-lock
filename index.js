/**
 * Host half of the "ui-style-lock" bundle.
 *
 * 三种力度，从弱到强：
 *   1. 系统提示段：把“当前风格 + 必做流程”钉进每一轮上下文；
 *   2. ui_style 工具：返回完整契约（色板/形状/版式/禁例），并做可执行的 review；
 *   3. 状态持久化：/style 或 ui_style(use) 切换后写入 state.json，跨会话生效。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PRESETS, STYLE_IDS, findStyle, contractOf } from './presets.js';
import { reviewStyle, renderReview } from './engine.js';

/** 状态就放在插件包里：随插件走、可备份、可手动删（删掉即回到默认风格）。 */
const STATE_FILE = fileURLToPath(new URL('./.state.json', import.meta.url));

function statePath() {
  return STATE_FILE;
}

let active = PRESETS[0];

function loadActive() {
  try {
    const raw = JSON.parse(readFileSync(statePath(), 'utf8'));
    const style = findStyle(raw?.style);
    if (style) active = style;
  } catch {
    /* 首次运行没有状态文件：用默认风格 */
  }
}

function saveActive(style) {
  active = style;
  try {
    writeFileSync(statePath(), JSON.stringify({ style: style.id, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

const SHORT = PRESETS.map((s) => `${String(s.index).padStart(2, '0')} ${s.zh}`).join(' · ');

function promptText() {
  return [
    `## 视觉风格锁：${active.zh} · ${active.en}（强制）`,
    '',
    `${active.tagline}。本会话所有网页、界面、仪表盘、可视化产物都必须使用这套风格，除非用户在本轮明确指定其他风格；默认的深色科技风视为违规。`,
    '',
    '1. 写任何 HTML/CSS/界面代码之前，先调用 `ui_style`（action="contract"）读取完整规范；不得凭印象配色。',
    '2. 交付之前调用 `ui_style`（action="review"，html=完整源码）自检；必须 pass=true 且 score=100，否则按提示修正后重测。',
    `3. 这套风格的硬约束：${active.locks.join('；')}。`,
    '4. 用户点名另一种风格时，先 `ui_style`（action="use", style="<id>"）切换，再按新契约生成。',
    `5. 可用风格：${SHORT}。用户说“换风格/查看风格”时用 action="list"。`,
  ].join('\n');
}

function listText() {
  const lines = ['视觉风格锁 · 可用风格', ''];
  for (const s of PRESETS) {
    const mark = s.id === active.id ? '▶' : ' ';
    lines.push(`${mark} ${String(s.index).padStart(2, '0')}  ${s.zh}（${s.id}）— ${s.tagline}`);
  }
  lines.push('', `当前：${active.zh}（${active.id}）`, '切换：/style 03 或 ui_style({ action: "use", style: "bento" })');
  return lines.join('\n');
}

export function apply(ctx) {
  loadActive();

  ctx.effect(() => ctx.systemPrompt.section({
    name: 'ui-style-lock',
    order: 900,
    text: () => promptText(),
  }), 'ui-style-lock: prompt section');

  ctx.effect(() => ctx.tools.register({
    name: 'ui_style',
    description:
      '视觉风格锁。action="list" 列出全部 10 种风格；action="contract" 返回当前风格的完整规范'
      + '（色板、形状、版式、动效、禁例）；action="review" 校验一段 HTML/CSS 是否合规并给出 score 与违规清单；'
      + 'action="use" 切换全局风格（跨会话生效）。任何界面类产物都必须先读 contract，交付前用 review 自检到 score=100。',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'contract', 'review', 'use'], description: '要执行的动作' },
        style: { type: 'string', enum: STYLE_IDS, description: '风格 id；review 时用于指定按哪种风格校验，use 时为要切换到的风格' },
        html: { type: 'string', description: 'action="review" 时传入完整的 HTML/CSS 源码' },
      },
      required: ['action'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          style: { type: 'string' },
          text: { type: 'string' },
          pass: { type: 'boolean' },
          score: { type: 'number' },
        },
      },
      render: (_args, value) => [{ type: 'text', text: String(value?.text ?? '') }],
    },
    async execute(args) {
      const input = args ?? {};
      const target = input.style ? findStyle(input.style) : active;

      if (input.action === 'list') {
        return { action: 'list', style: active.id, text: listText() };
      }

      if (input.action === 'contract') {
        if (!target) throw new Error(`未知风格：${input.style}`);
        return { action: 'contract', style: target.id, text: contractOf(target) };
      }

      if (input.action === 'review') {
        if (typeof input.html !== 'string' || input.html.trim() === '') {
          throw new Error('action="review" 需要 html 字符串');
        }
        if (!target) throw new Error(`未知风格：${input.style}`);
        const result = reviewStyle(target, input.html);
        return {
          action: 'review',
          style: target.id,
          pass: result.pass,
          score: result.score,
          text: renderReview(target, result),
        };
      }

      if (input.action === 'use') {
        if (!target) throw new Error(`未知风格：${input.style}`);
        const saved = saveActive(target);
        return {
          action: 'use',
          style: target.id,
          text: [
            `已切换为「${target.zh}」（${target.id}）。`,
            saved ? '已写入状态文件，跨会话生效。' : '状态写入失败，仅本进程内生效。',
            '',
            `硬约束：${target.locks.join('；')}。`,
            '下一步调用 ui_style({ action: "contract" }) 读取完整规范。',
          ].join('\n'),
        };
      }

      throw new Error('action 只能是 list / contract / review / use');
    },
  }), 'ui-style-lock: ui_style tool');

  const commands = ctx.get('commands');
  if (commands) {
    ctx.effect(() => commands.register({
      name: 'style',
      description: '切换视觉风格锁（10 种风格）',
      input: { hint: '编号或 id，留空查看全部' },
      async handler(invocation) {
        const arg = String(invocation?.rawInput ?? '').trim();
        if (!arg) return { kind: 'success', text: listText() };
        const style = findStyle(arg);
        if (!style) {
          return { kind: 'error', text: `未知风格：${arg}\n\n${listText()}` };
        }
        saveActive(style);
        return {
          kind: 'success',
          text: `✅ 已切换：${style.zh}（${style.id}）\n${style.tagline}。硬约束：${style.locks.join('；')}。`,
        };
      },
    }), 'ui-style-lock: /style command');
  }
}

export const inject = ['systemPrompt', 'tools'];
