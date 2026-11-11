/**
 * Client half of the "ui-style-lock" bundle.
 *
 * 两个面板：
 *   styleLab  —— 风格图鉴：10 种被锁定的视觉语言，含色板与硬约束；
 *   styleDemo —— 清新像素风的中控台示例页（验收样本）。
 *
 * 经典脚本：没有 import/export，React 由模块表提供。
 */
window.__ModuleLoader__.load({
  id: 'dsh-ui-style-lock',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useState } = React;

    const PACKAGE = 'dsh-ui-style-lock';
    /** 图鉴面板 id，同时是 main 槽的 key。 */
    const PANEL_ID = 'styleLab';
    /** 示例面板 id。 */
    const DEMO_ID = 'styleDemo';
    const I18N_NS = PACKAGE;

    const ZH = { '风格锁': '风格锁', '像素示例': '像素示例' };
    const EN = { '风格锁': 'Style Lock', '像素示例': 'Pixel Sample' };

    let translate = null;
    const T = (key) => (translate === null ? key : translate(key));

    /* ── 图鉴数据：与 presets.js 保持同步（展示字段） ────────────────────── */
    const CATALOG = [
      {
        i: '01', id: 'minimalism', zh: '极简主义', en: 'Minimalism',
        tag: '留白、清晰层级、功能优先',
        sw: ['#FFFFFF', '#F7F7F5', '#111111', '#6B6B6B', '#1A6EFF'],
        locks: ['8px 网格留白', '最多两级字重', '1px 分隔线'],
      },
      {
        i: '02', id: 'glassmorphism', zh: '玻璃拟态', en: 'Glassmorphism',
        tag: '半透明磨砂、分层景深',
        sw: ['#E9F1F7', '#FFFFFF', '#1B2A36', '#6C8CFF', '#B9D7F2'],
        locks: ['必须 backdrop-filter', '圆角 12–16', '玻璃 ≤40% 面积'],
      },
      {
        i: '03', id: 'bento', zh: 'Bento 网格', en: 'Bento Grid',
        tag: '非对称卡片分区、尺寸按重要性分级',
        sw: ['#F4F1EA', '#FFFFFF', '#171717', '#FF6B4A', '#BFE3C0'],
        locks: ['必须 display:grid', '禁止全等分', 'gap 16px'],
      },
      {
        i: '04', id: 'typography', zh: '大字排版', en: 'Big & Expressive Type',
        tag: '字体即结构，标题承担冲击力',
        sw: ['#F3EFE6', '#111111', '#FF3D00', '#8A8578', '#DCD5C4'],
        locks: ['标题 ≥56px', '行高 ≤1.05', '每屏一个巨型短语'],
      },
      {
        i: '05', id: 'scrollytelling', zh: '滚动叙事', en: 'Scrollytelling',
        tag: '滚动位置驱动场景、固定画面与揭示',
        sw: ['#0B0D10', '#E8E6E1', '#FF5A36', '#6E7681', '#1A1F26'],
        locks: ['sticky / scroll 驱动', '每章一个场景', 'reduced-motion 降级'],
      },
      {
        i: '06', id: 'craft', zh: '手作过程感', en: 'Creative Process',
        tag: '手绘痕迹、拼贴、纸纹与未完成感',
        sw: ['#F2EAD9', '#1F1B16', '#C8553D', '#6B8F71', '#FFF8E7'],
        locks: ['纸感底色', '至少一处旋转', '错位硬阴影'],
      },
      {
        i: '07', id: 'dark-luxe', zh: '暗黑奢华', en: 'Dark / Luxe',
        tag: '深色背景 + 精细色阶，克制的高级感',
        sw: ['#0A0A0B', '#16161A', '#C9A227', '#E8E6E1', '#8A8A93'],
        locks: ['三层深色色阶', '金色 <5%', '禁纯黑白'],
      },
      {
        i: '08', id: 'motion', zh: '微交互动效', en: 'Motion',
        tag: '按钮反馈、页面过渡，100–400ms',
        sw: ['#FAFAFA', '#FFFFFF', '#111111', '#7C5CFF', '#E6E4EC'],
        locks: ['过渡 100–400ms', '三态必须齐', '只动 transform'],
      },
      {
        i: '09', id: 'retro-pixel', zh: '复古像素 / Y2K', en: 'Retro / Y2K',
        tag: '8-bit 像素、CRT 荧光、铬色硬分段',
        sw: ['#0E0B1A', '#1A1430', '#E9E4FF', '#FF2E88', '#38E8C8'],
        locks: ['圆角 0', '硬阴影 0 模糊', '8px 像素网格'],
      },
      {
        i: '10', id: 'brutalism', zh: '新粗野主义', en: 'Neo-Brutalism',
        tag: '高对比、硬边框、无修饰的冲击',
        sw: ['#FFE94A', '#FFFFFF', '#000000', '#FF5CA8', '#4D5BFF'],
        locks: ['3–4px 黑描边', '6px 硬阴影', '荧光色块拼接'],
      },
    ];

    /* ══ 面板一：风格图鉴 ═══════════════════════════════════════════════ */

    const WL_CSS = `
.wl-root {
  height: 100%; min-height: 100%; overflow: auto;
  background: var(--dsw-alias-bg-base, #ffffff);
  color: var(--dsw-alias-label-primary, #1a1a1a);
  font-family: inherit; font-size: 13px; line-height: 1.55;
}
.wl-wrap { max-width: 1180px; margin: 0 auto; padding: 28px 32px 44px; display: flex; flex-direction: column; gap: 18px; }
.wl-head { display: flex; flex-direction: column; gap: 4px; }
.wl-title { font-size: 20px; font-weight: 600; letter-spacing: .01em; }
.wl-sub { font-size: 13px; color: var(--dsw-alias-label-secondary, #666); }
.wl-hint {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  padding: 10px 12px; font-size: 12px; line-height: 1.7;
  border: 1px solid var(--dsw-alias-border-l1, #e6e6e6);
  background: var(--dsw-alias-bg-layer-1, #fafafa);
  border-radius: 8px;
  color: var(--dsw-alias-label-secondary, #666);
}
.wl-hint b { color: var(--dsw-alias-label-primary, #1a1a1a); font-weight: 600; }
.wl-code {
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  background: var(--dsw-alias-bg-layer-2, #f0f0f0);
  border-radius: 4px; padding: 1px 6px;
  color: var(--dsw-alias-label-primary, #1a1a1a);
}
.wl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 14px; }
.wl-card {
  display: flex; flex-direction: column; gap: 10px;
  padding: 14px 15px; border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l1, #e6e6e6);
  background: var(--dsw-alias-bg-layer-1, #fafafa);
}
.wl-card:hover { border-color: var(--dsw-alias-border-l2, #d0d0d0); }
.wl-chead { display: flex; align-items: flex-start; gap: 10px; }
.wl-num {
  flex: 0 0 auto; min-width: 26px; text-align: center;
  font-family: ui-monospace, Consolas, monospace; font-size: 11px; font-weight: 600;
  padding: 2px 4px; border-radius: 4px;
  background: var(--dsw-alias-bg-layer-2, #ececec);
  color: var(--dsw-alias-label-secondary, #666);
}
.wl-name { margin: 0; font-size: 14px; font-weight: 600; }
.wl-en { margin: 0; font-size: 11px; color: var(--dsw-alias-label-secondary, #666); letter-spacing: .02em; }
.wl-tag { margin: 0; font-size: 12px; color: var(--dsw-alias-label-secondary, #666); }
.wl-sw { display: flex; gap: 0; border-radius: 4px; overflow: hidden; border: 1px solid var(--dsw-alias-border-l1, #e6e6e6); }
.wl-sw i { display: block; flex: 1 1 0; height: 26px; }
.wl-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.wl-chip {
  font-size: 11px; padding: 2px 7px; border-radius: 999px;
  border: 1px solid var(--dsw-alias-border-l1, #e6e6e6);
  color: var(--dsw-alias-label-secondary, #666);
  background: var(--dsw-alias-bg-base, #fff);
}
.wl-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 2px; }
.wl-use { font-size: 11px; color: var(--dsw-alias-label-secondary, #666); }
.wl-doc {
  margin-top: 4px; padding-top: 14px; border-top: 1px solid var(--dsw-alias-border-l1, #e6e6e6);
  display: flex; flex-direction: column; gap: 6px;
  font-size: 12px; color: var(--dsw-alias-label-secondary, #666);
}
.wl-doc b { color: var(--dsw-alias-label-primary, #1a1a1a); }
`;

    function StyleCard({ item }) {
      return h('article', { className: 'wl-card' }, [
        h('div', { key: 'h', className: 'wl-chead' }, [
          h('span', { key: 'n', className: 'wl-num' }, item.i),
          h('div', { key: 't' }, [
            h('h3', { key: 'z', className: 'wl-name' }, item.zh),
            h('p', { key: 'e', className: 'wl-en' }, item.en),
          ]),
        ]),
        h('p', { key: 'tag', className: 'wl-tag' }, item.tag),
        h('div', { key: 'sw', className: 'wl-sw', 'aria-hidden': true },
          item.sw.map((hex, idx) => h('i', { key: idx, style: { background: hex }, title: hex }))),
        h('div', { key: 'chips', className: 'wl-chips' },
          item.locks.map((lock) => h('span', { key: lock, className: 'wl-chip' }, lock))),
        h('div', { key: 'foot', className: 'wl-foot' }, [
          h('code', { key: 'c', className: 'wl-code' }, `/style ${item.i}`),
          h('span', { key: 'u', className: 'wl-use' }, item.id),
        ]),
      ]);
    }

    function Catalog() {
      return h('div', { className: 'wl-root' }, [
        h('style', { key: 'css', dangerouslySetInnerHTML: { __html: WL_CSS } }),
        h('div', { key: 'wrap', className: 'wl-wrap' }, [
          h('header', { key: 'head', className: 'wl-head' }, [
            h('div', { key: 't', className: 'wl-title' }, '风格锁 · 风格图鉴'),
            h('div', { key: 's', className: 'wl-sub' },
              '10 种视觉语言。选定的风格会进入系统提示，约束每一次页面生成，并在交付前被自动校验。'),
          ]),
          h('div', { key: 'hint', className: 'wl-hint' }, [
            h('span', { key: 'a' }, [h('b', { key: 'b1' }, '切换：'), '在输入框输入 ', h('code', { key: 'c1', className: 'wl-code' }, '/style 03'), '，或直接对我说「切换到 Bento」。']),
            h('span', { key: 'b' }, [h('b', { key: 'b2' }, '生效：'), '写入状态文件，所有会话共用；新会话立即按新风格执行。']),
            h('span', { key: 'c' }, [h('b', { key: 'b3' }, '回执：'), '出现在对话流里。空白新会话会显示欢迎页，发第一条消息后即可看到该行。']),
          ]),
          h('div', { key: 'grid', className: 'wl-grid' }, CATALOG.map((item) => h(StyleCard, { key: item.id, item }))),
          h('div', { key: 'doc', className: 'wl-doc' }, [
            h('span', { key: 'a' }, [h('b', { key: 'x' }, '为什么是“锁”而不是“建议”：'), '风格规范不依赖模型自觉——提示段固定约束、契约提供色板与配方、review 用正则规则逐条判违规。']),
            h('span', { key: 'b' }, [h('b', { key: 'y' }, '叠加关系：'), '滚动叙事与微交互偏“手法”，可作为增量加到其他风格上；其余八种是完整皮肤。']),
            h('span', { key: 'c' }, [h('b', { key: 'z' }, '自定义：'), '第 11 种风格只需在 presets.js 里加一条数据（色板 + 形状 + review 规则）。']),
          ]),
        ]),
      ]);
    }

    /* ══ 面板二：清新像素中控台示例 ═════════════════════════════════════ */

    const C = {
      cream: '#FBF6E9',
      paper: '#FFFDF6',
      ink: '#2E3B45',
      soft: '#5C6B75',
      line: '#E9E2CE',
      sand: '#E3DAC4',
      mint: '#B7E9C8',
      sky: '#C3E4F6',
      sun: '#FFE29A',
      coral: '#FFB3A6',
      mintInk: '#2F7D57',
      skyInk: '#2A6E96',
      sunInk: '#8A6206',
      coralInk: '#B8432C',
    };

    const TONE_FILL = { mint: C.mint, sky: C.sky, sun: C.sun, coral: C.coral };
    const TONE_INK = { mint: C.mintInk, sky: C.skyInk, sun: C.sunInk, coral: C.coralInk };

    const CSS = `
.psl-root {
  height: 100%;
  min-height: 100%;
  overflow: auto;
  box-sizing: border-box;
  background-color: ${C.cream};
  color: ${C.ink};
  font-family: ui-monospace, "Cascadia Mono", "Consolas", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.45;
  background-image:
    repeating-linear-gradient(0deg, rgba(46, 59, 69, .05) 0 1px, transparent 1px 8px),
    repeating-linear-gradient(90deg, rgba(46, 59, 69, .05) 0 1px, transparent 1px 8px);
}
.psl-root *,
.psl-root *::before,
.psl-root *::after { box-sizing: border-box; }
.psl-pad { padding: 16px 18px 24px; display: flex; flex-direction: column; gap: 14px; min-height: 100%; }

/* 顶栏 */
.psl-top {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 10px 14px;
  background-color: ${C.paper};
  border: 3px solid ${C.ink};
  box-shadow: 5px 5px 0 ${C.sand};
}
.psl-logo {
  width: 38px; height: 38px; flex: 0 0 auto;
  display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr);
  gap: 1px; padding: 3px;
  border: 2px solid ${C.ink};
  background-color: ${C.paper};
}
.psl-logo i { display: block; background-color: transparent; }
.psl-logo i[data-on="1"] { background-color: ${C.mint}; }
.psl-logo i[data-on="2"] { background-color: ${C.sky}; }
.psl-logo i[data-on="3"] { background-color: ${C.sun}; }
.psl-ident { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.psl-name { font-size: 16px; font-weight: 700; letter-spacing: .16em; }
.psl-sub { font-size: 10px; letter-spacing: .14em; color: ${C.soft}; }
.psl-spacer { flex: 1 1 auto; }
.psl-clock { display: flex; flex-direction: column; align-items: flex-end; gap: 0; }
.psl-time { font-size: 20px; font-weight: 700; letter-spacing: .1em; font-variant-numeric: tabular-nums; }
.psl-date { font-size: 10px; letter-spacing: .12em; color: ${C.soft}; }
.psl-chips { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.psl-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 8px; font-size: 11px; letter-spacing: .06em; white-space: nowrap;
  border: 2px solid ${C.ink};
  background-color: ${C.paper};
}
.psl-led { display: inline-block; width: 8px; height: 8px; background-color: ${C.mint}; }
.psl-led[data-tone="sky"] { background-color: ${C.sky}; }
.psl-led[data-tone="sun"] { background-color: ${C.sun}; }
.psl-led[data-tone="coral"] { background-color: ${C.coral}; }
.psl-led[data-live="1"] { animation: psl-blink 2.4s steps(1, end) infinite; }
.psl-pal { display: inline-flex; align-items: center; gap: 4px; }
.psl-swatch { width: 12px; height: 12px; border: 2px solid ${C.ink}; }

/* 侧导轨 */
.psl-shell { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 14px; align-items: start; }
.psl-rail {
  display: flex; flex-direction: column; gap: 8px; padding: 8px;
  background-color: ${C.paper};
  border: 3px solid ${C.ink};
  box-shadow: 5px 5px 0 ${C.sand};
}
.psl-nav {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 7px 2px;
  border: 2px solid transparent;
  background-color: transparent;
  color: ${C.soft};
  cursor: pointer;
  font: inherit; font-size: 10px; letter-spacing: .06em; line-height: 1.1;
}
.psl-nav:hover { background-color: #F2EEDF; border-color: ${C.ink}; color: ${C.ink}; }
.psl-nav[data-active="1"] { background-color: ${C.mint}; border-color: ${C.ink}; color: ${C.ink}; box-shadow: 3px 3px 0 ${C.ink}; }
.psl-nav:focus-visible { outline: 3px solid ${C.skyInk}; outline-offset: 2px; }

/* 栅格与卡片 */
.psl-body { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.psl-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 14px; }
.psl-card {
  display: flex; flex-direction: column; gap: 10px; min-width: 0;
  padding: 12px;
  background-color: ${C.paper};
  border: 3px solid ${C.ink};
  box-shadow: 5px 5px 0 ${C.sand};
}
.psl-cardhead {
  display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
  padding-bottom: 6px;
  border-bottom: 2px solid ${C.line};
}
.psl-cardtitle { font-size: 12px; font-weight: 700; letter-spacing: .12em; }
.psl-cardhint { font-size: 10px; letter-spacing: .1em; color: ${C.soft}; }

/* KPI */
.psl-kpi { grid-column: span 3; gap: 8px; }
.psl-kpil { font-size: 10px; letter-spacing: .14em; color: ${C.soft}; }
.psl-kpirow { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
.psl-kpiv { font-size: 28px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
.psl-kpiu { font-size: 11px; color: ${C.soft}; margin-left: 3px; }
.psl-delta { font-size: 11px; letter-spacing: .06em; white-space: nowrap; }
.psl-spark { display: flex; align-items: flex-end; gap: 2px; height: 24px; }
.psl-spark i { flex: 1 1 0; min-height: 2px; }

/* 柱状图 */
.psl-chart { grid-column: span 8; }
.psl-bars {
  display: flex; align-items: flex-end; gap: 4px;
  height: 132px; padding-top: 4px;
  border-bottom: 2px solid ${C.ink};
}
.psl-bar { flex: 1 1 0; min-height: 3px; border: 2px solid ${C.ink}; border-bottom: 0; }
.psl-bar:hover { filter: brightness(1.06); }
.psl-xaxis { display: flex; gap: 4px; font-size: 10px; color: ${C.soft}; letter-spacing: .04em; }
.psl-xaxis span { flex: 1 1 0; text-align: left; }

/* 分段环 */
.psl-gauge { grid-column: span 4; align-items: center; }
.psl-ring { position: relative; width: 178px; height: 178px; margin: 2px auto 0; }
.psl-seg {
  position: absolute; left: 50%; top: 50%;
  width: 7px; height: 18px;
  margin-left: -3.5px; margin-top: -9px;
  border: 1px solid ${C.ink};
  background-color: ${C.line};
}
.psl-ringcenter {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
}
.psl-ringv { font-size: 30px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
.psl-ringu { font-size: 10px; letter-spacing: .14em; color: ${C.soft}; }
.psl-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; }
.psl-stat { border: 2px solid ${C.ink}; padding: 6px; display: flex; flex-direction: column; gap: 2px; }
.psl-statk { font-size: 10px; letter-spacing: .1em; color: ${C.soft}; }
.psl-statv { font-size: 12px; font-weight: 700; }

/* 设备矩阵 */
.psl-devices { grid-column: span 7; }
.psl-devgrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.psl-dev { display: flex; flex-direction: column; gap: 7px; padding: 8px; border: 2px solid ${C.ink}; background-color: ${C.paper}; }
.psl-devhead { display: flex; align-items: center; gap: 6px; min-width: 0; }
.psl-devname { font-size: 11px; font-weight: 700; letter-spacing: .04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.psl-devrow { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: ${C.soft}; letter-spacing: .06em; }
.psl-track { height: 10px; border: 2px solid ${C.ink}; background-color: ${C.paper}; }
.psl-fill { height: 100%; }

/* 告警 */
.psl-alerts { grid-column: span 5; }
.psl-alert { display: flex; align-items: flex-start; gap: 8px; padding: 8px; border: 2px solid ${C.ink}; background-color: ${C.paper}; }
.psl-alert[data-acked="1"] { opacity: .62; }
.psl-sev { flex: 0 0 auto; padding: 1px 5px; border: 2px solid ${C.ink}; font-size: 10px; font-weight: 700; letter-spacing: .06em; }
.psl-alerttext { flex: 1 1 auto; font-size: 11.5px; line-height: 1.4; }
.psl-alertmeta { display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; font-size: 10px; color: ${C.soft}; letter-spacing: .06em; }
.psl-btn {
  border: 2px solid ${C.ink}; background-color: ${C.mint};
  box-shadow: 3px 3px 0 ${C.ink};
  padding: 3px 8px; font: inherit; font-size: 10px; letter-spacing: .06em;
  cursor: pointer; white-space: nowrap;
}
.psl-btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 ${C.ink}; }
.psl-btn[disabled] { background-color: ${C.paper}; color: ${C.soft}; box-shadow: 2px 2px 0 ${C.line}; cursor: default; }
.psl-btn:focus-visible { outline: 3px solid ${C.skyInk}; outline-offset: 2px; }

/* 日志 */
.psl-log { grid-column: span 12; }
.psl-logbody { display: flex; flex-direction: column; gap: 3px; padding: 8px; border: 2px solid ${C.ink}; background-color: #F4F1E4; }
.psl-line { display: grid; grid-template-columns: 66px 46px minmax(0, 1fr); gap: 8px; align-items: baseline; font-size: 11.5px; }
.psl-lvt { font-size: 10px; font-weight: 700; letter-spacing: .08em; }
.psl-caret { display: inline-block; width: 9px; height: 13px; border-bottom: 3px solid ${C.ink}; vertical-align: -2px; animation: psl-caret 1.1s steps(1, end) infinite; }

/* 页脚 */
.psl-foot { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 2px; font-size: 10px; letter-spacing: .08em; color: ${C.soft}; }
.psl-beat { display: inline-flex; gap: 2px; align-items: center; }
.psl-beat i { width: 4px; height: 10px; background-color: ${C.mint}; }
.psl-beat i:nth-child(3n) { background-color: ${C.sky}; }
.psl-beat i:nth-child(4n) { background-color: ${C.sun}; }

@keyframes psl-blink { 0%, 100% { opacity: 1; } 50% { opacity: .22; } }
@keyframes psl-caret { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }

@media (max-width: 1180px) {
  .psl-kpi { grid-column: span 3; }
  .psl-chart { grid-column: span 12; }
  .psl-gauge { grid-column: span 6; }
  .psl-devices { grid-column: span 12; }
  .psl-alerts { grid-column: span 6; }
}
@media (max-width: 900px) {
  .psl-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .psl-kpi { grid-column: span 3; }
  .psl-chart, .psl-gauge, .psl-devices, .psl-alerts, .psl-log { grid-column: span 6; }
  .psl-devgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .psl-shell { grid-template-columns: minmax(0, 1fr); }
  .psl-rail { flex-direction: row; overflow-x: auto; }
  .psl-kpi { grid-column: span 6; }
  .psl-devgrid { grid-template-columns: minmax(0, 1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .psl-led[data-live="1"], .psl-caret { animation: none; }
}
`;

    const LOGO = [
      0, 0, 1, 0,
      1, 1, 1, 1,
      0, 2, 3, 0,
      0, 0, 1, 0,
    ];

    const NAV = [
      { id: 'overview', label: '总览', glyph: 'overview' },
      { id: 'devices', label: '设备', glyph: 'devices' },
      { id: 'alerts', label: '告警', glyph: 'alerts' },
      { id: 'logs', label: '日志', glyph: 'logs' },
      { id: 'settings', label: '设置', glyph: 'settings' },
    ];

    const GLYPHS = {
      overview: [
        1, 1, 0, 0,
        1, 1, 0, 0,
        0, 0, 1, 1,
        0, 0, 1, 1,
      ],
      devices: [
        1, 1, 1, 1,
        1, 0, 0, 1,
        1, 0, 0, 1,
        1, 1, 1, 1,
      ],
      alerts: [
        0, 0, 1, 0,
        0, 1, 1, 1,
        0, 0, 1, 0,
        0, 0, 1, 0,
      ],
      logs: [
        1, 1, 1, 0,
        0, 1, 0, 0,
        0, 1, 1, 1,
        0, 1, 0, 0,
      ],
      settings: [
        0, 1, 1, 0,
        1, 0, 0, 1,
        1, 0, 0, 1,
        0, 1, 1, 0,
      ],
    };

    const KPIS = [
      { key: 'online', label: '在线设备', value: '128', unit: '台', delta: '+6', dir: 'up', tone: 'mint', spark: [3, 4, 4, 6, 5, 7, 6, 8, 7, 9] },
      { key: 'load', label: '系统负载', value: '62', unit: '%', delta: '+4', dir: 'up', tone: 'sky', spark: [5, 4, 6, 5, 7, 6, 8, 7, 6, 8] },
      { key: 'temp', label: '环境温度', value: '23.4', unit: '°C', delta: '-0.8', dir: 'down', tone: 'sun', spark: [6, 7, 6, 5, 6, 5, 4, 5, 4, 3] },
      { key: 'alarm', label: '活动告警', value: '03', unit: '条', delta: '-2', dir: 'down', tone: 'coral', spark: [7, 6, 6, 5, 4, 5, 3, 3, 2, 2] },
    ];

    const LOAD_24H = [32, 28, 24, 22, 20, 26, 34, 48, 56, 62, 58, 54, 60, 66, 72, 68, 64, 58, 52, 46, 40, 36, 30, 26];

    const DEVICES = [
      { name: '东区水泵 A1', load: 72, status: '运行中', tone: 'mint' },
      { name: '冷机 C-03', load: 88, status: '高负载', tone: 'sun' },
      { name: '配电柜 P2', load: 41, status: '运行中', tone: 'mint' },
      { name: '空压机 K-07', load: 15, status: '待机', tone: 'sky' },
      { name: '除尘塔 D-1', load: 63, status: '运行中', tone: 'mint' },
      { name: '备用发电机', load: 0, status: '离线', tone: 'coral' },
    ];

    const ALERTS = [
      { id: 'a1', level: '高', tone: 'coral', text: '冷机 C-03 排气温度 71°C，超过阈值 68°C', minutes: 18 },
      { id: 'a2', level: '中', tone: 'sun', text: '东区水泵 A1 振动值 4.2mm/s，接近预警线', minutes: 42 },
      { id: 'a3', level: '低', tone: 'sky', text: '配电柜 P2 通信重连 2 次，链路已恢复', minutes: 63 },
    ];

    const LOGS = [
      { level: 'INFO', tone: 'sky', text: '调度器已同步 128 台设备的运行参数', minutes: 1 },
      { level: 'WARN', tone: 'sun', text: '冷机 C-03 排气温度持续升高，触发二级告警', minutes: 2 },
      { level: 'INFO', tone: 'sky', text: '数据采集代理推入 1,024 条遥测记录', minutes: 5 },
      { level: 'OK', tone: 'mint', text: '配电柜 P2 链路恢复，重连耗时 840ms', minutes: 8 },
      { level: 'INFO', tone: 'sky', text: '夜间巡检完成，报告 #R-2291 已归档', minutes: 12 },
      { level: 'INFO', tone: 'sky', text: '值班交接完成：早班 3 人，待办 3 条', minutes: 17 },
    ];

    const pad2 = (n) => String(n).padStart(2, '0');
    const fmtClock = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    const fmtHM = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

    function StyleTag() {
      return h('style', { dangerouslySetInnerHTML: { __html: CSS } });
    }

    function Glyph({ kind, size }) {
      const cells = GLYPHS[kind] ?? GLYPHS.overview;
      const rects = [];
      for (let i = 0; i < cells.length; i += 1) {
        if (cells[i] === 1) {
          rects.push(h('rect', { key: i, x: i % 4, y: Math.floor(i / 4), width: 1, height: 1, fill: 'currentColor' }));
        }
      }
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 4 4',
        shapeRendering: 'crispEdges',
        'aria-hidden': true,
        focusable: false,
        style: { display: 'block' },
      }, rects);
    }

    function Led({ tone, live }) {
      return h('span', { className: 'psl-led', 'data-tone': tone ?? 'mint', 'data-live': live ? '1' : '0' });
    }

    function useClock() {
      const [now, setNow] = useState(() => new Date());
      useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
      }, []);
      return now;
    }

    function TopBar({ now }) {
      const date = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} 周${WEEKDAYS[now.getDay()]}`;
      return h('header', { className: 'psl-top' }, [
        h('div', { key: 'logo', className: 'psl-logo', 'aria-hidden': true },
          LOGO.map((v, i) => h('i', { key: i, 'data-on': v ? String(v) : '0' }))),
        h('div', { key: 'ident', className: 'psl-ident' }, [
          h('div', { key: 'n', className: 'psl-name' }, 'NOVA 中控台'),
          h('div', { key: 's', className: 'psl-sub' }, 'FACILITY CONTROL · 主控台 / 东区'),
        ]),
        h('div', { key: 'sp', className: 'psl-spacer' }),
        h('div', { key: 'clock', className: 'psl-clock' }, [
          h('div', { key: 't', className: 'psl-time' }, fmtClock(now)),
          h('div', { key: 'd', className: 'psl-date' }, date),
        ]),
        h('div', { key: 'chips', className: 'psl-chips' }, [
          h('span', { key: 'c1', className: 'psl-chip' }, [h(Led, { key: 'l', live: true }), '链路 正常']),
          h('span', { key: 'c2', className: 'psl-chip' }, [h(Led, { key: 'l', tone: 'sky' }), '同步 在线']),
          h('span', { key: 'c3', className: 'psl-chip' }, [
            h('span', { key: 'p', className: 'psl-pal' }, [
              h('i', { key: 1, className: 'psl-swatch', style: { background: C.mint } }),
              h('i', { key: 2, className: 'psl-swatch', style: { background: C.sky } }),
              h('i', { key: 3, className: 'psl-swatch', style: { background: C.sun } }),
              h('i', { key: 4, className: 'psl-swatch', style: { background: C.coral } }),
            ]),
            '清新像素风',
          ]),
        ]),
      ]);
    }

    function Rail({ current, onSelect }) {
      return h('nav', { className: 'psl-rail', 'aria-label': '主导航' },
        NAV.map((item) => h('button', {
          key: item.id,
          type: 'button',
          className: 'psl-nav',
          'data-active': item.id === current ? '1' : '0',
          'aria-current': item.id === current ? 'page' : undefined,
          onClick: () => onSelect(item.id),
        }, [h(Glyph, { key: 'g', kind: item.glyph, size: 18 }), h('span', { key: 'l' }, item.label)])));
    }

    function KpiCard({ item }) {
      const peak = Math.max(...item.spark, 1);
      return h('section', { className: 'psl-card psl-kpi' }, [
        h('div', { key: 'l', className: 'psl-kpil' }, item.label),
        h('div', { key: 'r', className: 'psl-kpirow' }, [
          h('div', { key: 'v', className: 'psl-kpiv' }, [item.value, h('span', { key: 'u', className: 'psl-kpiu' }, item.unit)]),
          h('div', { key: 'd', className: 'psl-delta', style: { color: TONE_INK[item.tone] } },
            `${item.dir === 'up' ? '▲' : '▼'} ${item.delta}`),
        ]),
        h('div', { key: 's', className: 'psl-spark', 'aria-hidden': true },
          item.spark.map((v, i) => h('i', { key: i, style: { height: `${Math.round((v / peak) * 100)}%`, background: TONE_FILL[item.tone] } }))),
      ]);
    }

    function LoadChart({ now }) {
      const max = Math.max(...LOAD_24H);
      return h('section', { className: 'psl-card psl-chart' }, [
        h('div', { key: 'head', className: 'psl-cardhead' }, [
          h('div', { key: 't', className: 'psl-cardtitle' }, '24 小时负载'),
          h('div', { key: 'h', className: 'psl-cardhint' }, '峰值 72% · 均值 46%'),
        ]),
        h('div', { key: 'bars', className: 'psl-bars', role: 'img', 'aria-label': '24 小时负载柱状图' },
          LOAD_24H.map((v, i) => h('i', {
            key: i,
            className: 'psl-bar',
            style: {
              height: `${Math.round((v / max) * 100)}%`,
              background: v === max ? C.sun : i % 2 === 0 ? C.sky : C.mint,
            },
          }))),
        h('div', { key: 'x', className: 'psl-xaxis' },
          LOAD_24H.map((_, i) => h('span', { key: i }, i % 4 === 0 ? `${pad2(i)}:00` : ''))),
        h('div', { key: 'foot', className: 'psl-cardhint' },
          `当前 ${fmtHM(now)} 采样 · 数据源 遥测网关 / 东区`),
      ]);
    }

    function Gauge() {
      const max = 80;
      const value = 71;
      const total = 24;
      const filled = Math.round((value / max) * total);
      const segs = [];
      for (let i = 0; i < total; i += 1) {
        const angle = -135 + i * (270 / (total - 1));
        const on = i < filled;
        const tone = !on ? C.line : i < 15 ? C.sky : i < 20 ? C.sun : C.coral;
        segs.push(h('i', {
          key: i,
          className: 'psl-seg',
          style: { transform: `rotate(${angle}deg) translateY(-68px)`, background: tone },
        }));
      }
      return h('section', { className: 'psl-card psl-gauge' }, [
        h('div', { key: 'head', className: 'psl-cardhead' }, [
          h('div', { key: 't', className: 'psl-cardtitle' }, '排气温度'),
          h('div', { key: 'h', className: 'psl-cardhint' }, '冷机 C-03'),
        ]),
        h('div', { key: 'ring', className: 'psl-ring' }, [
          ...segs,
          h('div', { key: 'c', className: 'psl-ringcenter' }, [
            h('div', { key: 'v', className: 'psl-ringv' }, '71'),
            h('div', { key: 'u', className: 'psl-ringu' }, '°C / 上限 80'),
          ]),
        ]),
        h('div', { key: 'stats', className: 'psl-stats' }, [
          h('div', { key: 'a', className: 'psl-stat' }, [
            h('div', { key: 'k', className: 'psl-statk' }, '阈值'),
            h('div', { key: 'v', className: 'psl-statv' }, '68 °C'),
          ]),
          h('div', { key: 'b', className: 'psl-stat' }, [
            h('div', { key: 'k', className: 'psl-statk' }, '状态'),
            h('div', { key: 'v', className: 'psl-statv', style: { color: C.coralInk } }, '预警'),
          ]),
          h('div', { key: 'c', className: 'psl-stat' }, [
            h('div', { key: 'k', className: 'psl-statk' }, '10 分钟'),
            h('div', { key: 'v', className: 'psl-statv', style: { color: C.sunInk } }, '+3.2 °C'),
          ]),
        ]),
      ]);
    }

    function Devices() {
      return h('section', { className: 'psl-card psl-devices' }, [
        h('div', { key: 'head', className: 'psl-cardhead' }, [
          h('div', { key: 't', className: 'psl-cardtitle' }, '设备矩阵'),
          h('div', { key: 'h', className: 'psl-cardhint' }, '6 / 128 关键设备'),
        ]),
        h('div', { key: 'g', className: 'psl-devgrid' }, DEVICES.map((dev) => h('article', { key: dev.name, className: 'psl-dev' }, [
          h('div', { key: 'h', className: 'psl-devhead' }, [
            h(Led, { key: 'l', tone: dev.tone, live: dev.load > 0 }),
            h('span', { key: 'n', className: 'psl-devname', title: dev.name }, dev.name),
          ]),
          h('div', { key: 't', className: 'psl-track' },
            h('div', { key: 'f', className: 'psl-fill', style: { width: `${dev.load}%`, background: TONE_FILL[dev.tone] } })),
          h('div', { key: 'r', className: 'psl-devrow' }, [
            h('span', { key: 's', style: { color: TONE_INK[dev.tone] } }, dev.status),
            h('span', { key: 'v' }, `${dev.load}%`),
          ]),
        ]))),
      ]);
    }

    function Alerts({ now }) {
      const [acked, setAcked] = useState(() => []);
      return h('section', { className: 'psl-card psl-alerts' }, [
        h('div', { key: 'head', className: 'psl-cardhead' }, [
          h('div', { key: 't', className: 'psl-cardtitle' }, '实时告警'),
          h('div', { key: 'h', className: 'psl-cardhint' }, `${ALERTS.length - acked.length} 条待处理`),
        ]),
        ...ALERTS.map((alert) => {
          const done = acked.indexOf(alert.id) >= 0;
          const time = new Date(now.getTime() - alert.minutes * 60000);
          return h('article', { key: alert.id, className: 'psl-alert', 'data-acked': done ? '1' : '0' }, [
            h('span', { key: 'sev', className: 'psl-sev', style: { background: TONE_FILL[alert.tone] } }, alert.level),
            h('div', { key: 'body', className: 'psl-alerttext' }, [
              h('div', { key: 't' }, alert.text),
              h('div', { key: 'm', className: 'psl-alertmeta' }, [
                h('span', { key: 'a' }, `东区 · ${fmtHM(time)}`),
                h('span', { key: 'b' }, done ? '已确认' : '待确认'),
              ]),
            ]),
            h('button', {
              key: 'btn',
              type: 'button',
              className: 'psl-btn',
              disabled: done,
              onClick: () => setAcked((prev) => (prev.indexOf(alert.id) >= 0 ? prev : prev.concat(alert.id))),
            }, done ? '已处理' : '确认'),
          ]);
        }),
      ]);
    }

    function Logs({ now }) {
      return h('section', { className: 'psl-card psl-log' }, [
        h('div', { key: 'head', className: 'psl-cardhead' }, [
          h('div', { key: 't', className: 'psl-cardtitle' }, '运行日志'),
          h('div', { key: 'h', className: 'psl-cardhint' }, 'tail -f /var/log/nova/gateway.log'),
        ]),
        h('div', { key: 'body', className: 'psl-logbody' },
          LOGS.map((line) => {
            const time = fmtClock(new Date(now.getTime() - line.minutes * 60000));
            return h('div', { key: `${line.minutes}-${line.text}`, className: 'psl-line' }, [
              h('span', { key: 't', style: { color: C.soft } }, time),
              h('span', { key: 'l', className: 'psl-lvt', style: { color: TONE_INK[line.tone] } }, line.level),
              h('span', { key: 'x' }, line.text),
            ]);
          }).concat([
            h('div', { key: 'cursor', className: 'psl-line' }, [
              h('span', { key: 't', style: { color: C.soft } }, '        '),
              h('span', { key: 'l' }),
              h('span', { key: 'x' }, h('span', { className: 'psl-caret' })),
            ]),
          ])),
      ]);
    }

    function Footer() {
      return h('footer', { className: 'psl-foot' }, [
        h('span', { key: 'a' }, 'NOVA FACILITY OS v2.4.1 · 节点 cn-east-03'),
        h('span', { key: 'b' }, '运行 42 天 06:12 · 采样间隔 5s'),
        h('span', { key: 'c', className: 'psl-beat' }, [
          h('span', { key: 'lbl' }, '心跳'),
          ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => h('i', { key: i })),
        ]),
      ]);
    }

    function PixelDemo() {
      const now = useClock();
      const [nav, setNav] = useState('overview');
      return h('div', { className: 'psl-root' }, [
        h(StyleTag, { key: 'css' }),
        h('div', { key: 'pad', className: 'psl-pad' }, [
          h(TopBar, { key: 'top', now }),
          h('div', { key: 'shell', className: 'psl-shell' }, [
            h(Rail, { key: 'rail', current: nav, onSelect: setNav }),
            h('div', { key: 'body', className: 'psl-body' }, [
              h('div', { key: 'grid1', className: 'psl-grid' }, KPIS.map((k) => h(KpiCard, { key: k.key, item: k }))),
              h('div', { key: 'grid2', className: 'psl-grid' }, [
                h(LoadChart, { key: 'chart', now }),
                h(Gauge, { key: 'gauge' }),
              ]),
              h('div', { key: 'grid3', className: 'psl-grid' }, [
                h(Devices, { key: 'devices' }),
                h(Alerts, { key: 'alerts', now }),
              ]),
              h('div', { key: 'grid4', className: 'psl-grid' }, h(Logs, { key: 'logs', now })),
              h(Footer, { key: 'foot' }),
            ]),
          ]),
        ]),
      ]);
    }

    /* ── 侧栏图标 ───────────────────────────────────────────────────────── */

    function PixelGlyph({ size }) {
      const out = [];
      for (let i = 0; i < LOGO.length; i += 1) {
        if (LOGO[i] === 0) continue;
        out.push(h('rect', {
          key: i,
          x: i % 4,
          y: Math.floor(i / 4),
          width: 1,
          height: 1,
          fill: LOGO[i] === 1 ? C.mint : LOGO[i] === 2 ? C.sky : C.sun,
        }));
      }
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 4 4',
        shapeRendering: 'crispEdges',
        'aria-hidden': true,
        focusable: false,
        style: { display: 'block' },
      }, out);
    }

    function CatalogGlyph({ size }) {
      const blocks = [
        { x: 0, y: 0, w: 2, h: 2, fill: 'currentColor' },
        { x: 2, y: 0, w: 2, h: 1, fill: 'currentColor', opacity: 0.55 },
        { x: 2, y: 1, w: 2, h: 3, fill: 'currentColor', opacity: 0.75 },
        { x: 0, y: 2, w: 2, h: 2, fill: 'currentColor', opacity: 0.55 },
      ];
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 4 4',
        shapeRendering: 'crispEdges',
        'aria-hidden': true,
        focusable: false,
        style: { display: 'block' },
      }, blocks.map((b, i) => h('rect', { key: i, x: b.x, y: b.y, width: b.w, height: b.h, fill: b.fill, opacity: b.opacity ?? 1 })));
    }

    /* ── 注册 ───────────────────────────────────────────────────────────── */

    function installI18n(ctx) {
      const locale = ctx.get('locale');
      if (!locale) return;
      try {
        ctx.effect(() => locale.register(I18N_NS, { zh: ZH, en: EN }), `${PACKAGE}: locale`);
        translate = locale.bind(I18N_NS);
      } catch {
        translate = null;
      }
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        installI18n(ctx);
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 60,
          label: () => T('风格锁'),
        }, CatalogGlyph));
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, Catalog));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: DEMO_ID,
          order: 61,
          label: () => T('像素示例'),
        }, PixelGlyph));
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: DEMO_ID,
        }, PixelDemo));
      },
    };
  },
});
