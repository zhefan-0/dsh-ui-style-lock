/** 风格校验引擎：把每种风格的“不可协商项”翻译成可执行检查。 */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function luminance([r, g, b]) {
  const channel = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function colorTokens(value) {
  const text = String(value);
  if (/url\(/i.test(text)) return [];
  const out = [];
  for (const hex of text.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) {
    if (hex.length === 4 || hex.length === 7) out.push(hexToRgb(hex));
  }
  for (const rgb of text.match(/rgba?\(([^)]+)\)/gi) ?? []) {
    const parts = rgb.replace(/^rgba?\(|\)$/gi, '').split(/[,\s/]+/).filter(Boolean).map(Number);
    const alpha = parts.length >= 4 ? parts[3] : 1;
    if (alpha < 0.3) continue;
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) out.push(parts.slice(0, 3));
  }
  return out;
}

const clamp = (text, max = 150) => (text.length > max ? `${text.slice(0, max - 3)}...` : text);

function push(list, rule, severity, evidence, hint) {
  list.push({ rule, severity, evidence: clamp(String(evidence).trim()), hint });
}

/** 页面底色：只看 html / body / :root / .page / .app / .shell / main 上的背景声明。 */
function rootBackground(src) {
  let found = null;
  for (const block of src.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = block[1].trim();
    if (!/(?:^|[\s,>~+])(?:html|body|:root|\.page|\.app|\.shell|main)(?=$|[\s,.:#[{])/i.test(selector)) continue;
    const decl = /(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i.exec(block[2]);
    if (decl) found = decl[1].trim();
  }
  return found;
}

function shadowLengths(value) {
  const clean = String(value)
    .replace(/#[0-9a-fA-F]{3,8}\b/g, ' ')
    .replace(/\b(?:rgba?|hsla?)\([^)]*\)/gi, ' ');
  return clean.split(/\s+/)
    .filter((token) => /^-?\d+(?:\.\d+)?(?:px|rem|em)?$/.test(token))
    .map((token) => parseFloat(token));
}

const SMOOTH_GRADIENT = /(?<!repeating-)(?:\blinear-gradient|\bradial-gradient|\bconic-gradient)\([^;}]*/gi;

export function reviewStyle(style, source) {
  const src = String(source ?? '');
  const cfg = style.review;
  const violations = [];

  /* 1. 底色明暗 */
  const rootBg = rootBackground(src);
  if (!rootBg) {
    push(violations, 'root-background', 'warn', '未找到 html/body/:root 的背景声明',
      '给页面根节点显式声明底色，风格锁要靠它判断明暗基调。');
  } else {
    const tokens = colorTokens(rootBg);
    if (tokens.length === 0) {
      push(violations, 'root-background', 'warn', `background: ${rootBg}`, '根节点底色需为可解析的颜色值。');
    }
    for (const rgb of tokens) {
      const lum = luminance(rgb);
      if (cfg.bg === 'light' && lum < 0.45) {
        push(violations, 'tone-too-dark', 'error', `background: ${rootBg}`,
          `「${style.zh}」是浅色基调，页面底色亮度需 ≥ 0.45。`);
        break;
      }
      if (cfg.bg === 'dark' && lum > 0.25) {
        push(violations, 'tone-too-light', 'error', `background: ${rootBg}`,
          `「${style.zh}」要求深色基调，页面底色亮度需 ≤ 0.25。`);
        break;
      }
    }
  }

  /* 2. 圆角 */
  for (const m of src.matchAll(/border-radius\s*:\s*([^;"'}]+)/gi)) {
    const value = m[1].trim();
    const px = /(\d+(?:\.\d+)?)px/.exec(value);
    const numeric = px ? Number(px[1]) : (/%|em|rem/.test(value) ? Infinity : 0);
    if (numeric > cfg.radiusMax) {
      push(violations, 'radius', 'error', `border-radius: ${value}`,
        `「${style.zh}」圆角上限 ${cfg.radiusMax}px。`);
    }
  }

  /* 3. 阴影 */
  for (const m of src.matchAll(/box-shadow\s*:\s*([^;"'}]+)/gi)) {
    const value = m[1].trim();
    const lengths = shadowLengths(value);
    const blur = lengths.length >= 3 ? Math.abs(lengths[2]) : 0;
    if (cfg.shadow === 'no-shadow') {
      push(violations, 'shadow', 'error', `box-shadow: ${value}`, `「${style.zh}」不使用投影。`);
    } else if (cfg.shadow === 'no-hard' && blur === 0) {
      push(violations, 'shadow', 'error', `box-shadow: ${value}`, `「${style.zh}」不允许硬阴影（模糊为 0）。`);
    } else if (cfg.shadow === 'hard' && blur > 0) {
      push(violations, 'shadow', 'error', `box-shadow: ${value}`, `「${style.zh}」只允许硬阴影，模糊必须为 0。`);
    }
  }

  /* 4. 模糊 / 毛玻璃 */
  const hasBlur = /backdrop-filter\s*:[^;"']*blur\(|filter\s*:\s*[^;"']*blur\(/i.test(src);
  if (cfg.blur === 'forbid' && hasBlur) {
    push(violations, 'blur', 'error', 'backdrop-filter / filter: blur', `「${style.zh}」不使用模糊与毛玻璃。`);
  }
  if (cfg.blur === 'require' && !/backdrop-filter\s*:[^;"']*blur\(/i.test(src)) {
    push(violations, 'blur', 'error', '缺少 backdrop-filter', '玻璃拟态必须给玻璃层加 backdrop-filter: blur(12px) 以上。');
  }

  /* 5. 渐变 */
  const gradients = [...src.matchAll(SMOOTH_GRADIENT)];
  if (cfg.gradient === 'forbid' && gradients.length > 0) {
    push(violations, 'gradient', 'error', gradients[0][0], `「${style.zh}」禁止平滑渐变。`);
  }
  if (cfg.gradient === 'require' && gradients.length === 0 && !/repeating-linear-gradient\(/i.test(src)) {
    push(violations, 'gradient', 'error', '未使用渐变', `「${style.zh}」需要渐变质感。`);
  }

  /* 6. 最小字号 */
  let smallest = null;
  for (const m of src.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/gi)) {
    const size = Number(m[1]);
    if (smallest === null || size < smallest) smallest = size;
  }
  if (smallest !== null && smallest < cfg.minFont) {
    push(violations, 'font-size', 'warn', `font-size: ${smallest}px`, `「${style.zh}」最小字号 ${cfg.minFont}px。`);
  }

  /* 7. 配色一致度 */
  const hits = cfg.palette.filter((hex) => new RegExp(hex, 'i').test(src)).length;
  if (hits < 3) {
    push(violations, 'palette', 'warn', `命中 ${hits}/${cfg.palette.length} 个规定色`,
      '请直接使用该风格的色板，不要自创配色。');
  }

  /* 8. 风格专属的前置条件与禁例 */
  for (const item of cfg.require ?? []) {
    let ok = false;
    try { ok = new RegExp(item.re, 'i').test(src); } catch { ok = false; }
    if (!ok) push(violations, 'missing-required', 'error', `缺少：${item.label}`, item.hint);
  }
  for (const item of cfg.forbid ?? []) {
    let hit = null;
    try { hit = new RegExp(item.re, 'i').exec(src); } catch { hit = null; }
    if (hit) push(violations, 'forbidden', 'error', `${item.label}：${hit[0]}`, item.hint);
  }

  const errors = violations.filter((v) => v.severity === 'error').length;
  const warns = violations.filter((v) => v.severity === 'warn').length;
  return {
    pass: errors === 0 && warns === 0,
    score: Math.max(0, 100 - errors * 25 - warns * 5),
    errors,
    warns,
    violations,
  };
}

export function renderReview(style, result) {
  const lines = [
    `style: ${style.id}（${style.zh}）`,
    `pass: ${result.pass}   score: ${result.score}/100   errors: ${result.errors}   warns: ${result.warns}`,
  ];
  if (result.violations.length === 0) {
    lines.push('', '✓ 未发现违规，符合该风格的全部硬性约束。');
  } else {
    lines.push('');
    for (const v of result.violations) {
      lines.push(`[${v.severity}] ${v.rule}: ${v.evidence}`);
      lines.push(`      → ${v.hint}`);
    }
  }
  return lines.join('\n');
}
