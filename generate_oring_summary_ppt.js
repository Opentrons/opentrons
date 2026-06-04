const pptxgen = require('pptxgenjs');
const fs = require('fs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Codex';
pptx.company = 'Opentrons';
pptx.subject = 'P1000H O-ring performance summary report';
pptx.title = 'P1000H O-ring Performance Summary Report';
pptx.lang = 'zh-CN';
pptx.theme = {
  headFontFace: 'Arial',
  bodyFontFace: 'Arial',
  lang: 'zh-CN',
};

const OUT = '/Users/yew/opentrons/P1000H_Oring_performance_summary_report_2026-06-04.pptx';

const C = {
  blue: '2168D3',
  blueDark: '174EA6',
  cyan: '0E7490',
  green: '16A34A',
  yellow: 'FBBF24',
  orange: 'F59E0B',
  red: 'DC2626',
  ink: '2F3437',
  gray: '687384',
  light: 'F5F8FC',
  line: 'D9E2EF',
  paleBlue: 'EAF2FF',
  paleRed: 'FEF2F2',
  paleOrange: 'FFF7ED',
  paleGreen: 'ECFDF5',
};

const pipettes = [
  {
    id: 'P1KHV3620250624A04',
    short: '0624A04',
    risk: 'High',
    color: C.orange,
    latestCv: 4.379,
    latestWorst: 1.585,
    maxCv: 5.642,
    maxWorst: 11.204,
    aspiration: 'F1 LOW %D @100k; A5 LOW %D @260k',
    optical: 'Latest CV 4.379; historical max CV 5.642',
    inference: '密封/润滑异常风险高；520k 油漏与传感器报错需闭环',
    action: '检查 O-ring 污染、润滑量、密封面和压缩变形；复测 optical',
  },
  {
    id: 'P1KHV3620241217A05',
    short: '1217A05',
    risk: 'High',
    color: C.orange,
    latestCv: 1.487,
    latestWorst: 2.308,
    maxCv: 6.195,
    maxWorst: 7.419,
    aspiration: '175% / 455k explicit fail; C5/C7 low aspiration',
    optical: 'Historical max CV 6.195; latest CV improved',
    inference: '局部通道 O-ring 密封不足或装配偏差风险高',
    action: '重点复测 C5/C7；拆检对应通道 O-ring 与活塞密封面',
  },
  {
    id: 'P1KHV3620250311A04',
    short: '0311A04',
    risk: 'Low',
    color: C.green,
    latestCv: 0.677,
    latestWorst: 1.052,
    maxCv: 1.957,
    maxWorst: 3.158,
    aspiration: 'No non-pressure LOW %D / fail note found',
    optical: 'Latest CV 0.677; best/stablest optical trend',
    inference: '可作为 O-ring 表现稳定的对照样本',
    action: '作为 reference unit；保留常规寿命后复测',
  },
  {
    id: 'P1KHV3620250624A01',
    short: '0624A01',
    risk: 'Monitor',
    color: C.yellow,
    latestCv: 1.633,
    latestWorst: 3.046,
    maxCv: 8.406,
    maxWorst: 13.397,
    aspiration: 'H1 LOW %D and G12 LOW %D @195k',
    optical: 'Historical max CV 8.406; latest CV 1.633 improved',
    inference: '阶段性密封/污染/测试状态异常，当前需观察',
    action: '复测 H1/G12；确认 latest improvement 是否可重复',
  },
  {
    id: 'P1KHV3620250624A05',
    short: '0624A05',
    risk: 'High',
    color: C.red,
    latestCv: 6.839,
    latestWorst: 3.150,
    maxCv: 6.839,
    maxWorst: 8.334,
    aspiration: 'No explicit LOW %D note; optical suggests unstable dispense',
    optical: 'Latest / max CV 6.839; plate 1-3 all high',
    inference: '整体吸液/排液一致性下降风险最高；优先按 O-ring 风险处理',
    action: '优先更换 O-ring 前后对比复测；检查磨损、压缩永久变形、润滑',
  },
];

function title(slide, text, subtitle, idx) {
  slide.addText(text, {
    x: 0.55, y: 0.32, w: 9.6, h: 0.38,
    fontFace: 'Arial', fontSize: 19, bold: true, color: C.blue, margin: 0,
    fit: 'shrink',
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.55, y: 0.75, w: 10.8, h: 0.26,
      fontSize: 10.5, color: C.gray, margin: 0,
      fit: 'shrink',
    });
  }
  slide.addText('Opentrons', {
    x: 11.1, y: 0.33, w: 1.55, h: 0.25,
    fontSize: 13, bold: true, color: C.blue, align: 'right', margin: 0,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.55, y: 1.08, w: 11.85, h: 0,
    line: { color: C.line, width: 1 },
  });
  footer(slide, idx);
}

function footer(slide, idx) {
  slide.addText(`P1000H O-ring Performance Summary | 2026-06-04 | ${idx}/9`, {
    x: 0.55, y: 7.16, w: 5.2, h: 0.14,
    fontSize: 6.5, color: C.gray, margin: 0,
  });
}

function addBullets(slide, lines, x, y, w, h, opts = {}) {
  slide.addText(lines.join('\n'), {
    x, y, w, h,
    fontSize: opts.fontSize || 14,
    color: opts.color || C.ink,
    bold: opts.bold || false,
    margin: opts.margin ?? 0.03,
    fit: 'shrink',
    valign: 'top',
    paraSpaceAfterPt: opts.paraSpaceAfterPt ?? 5,
    breakLine: false,
  });
}

function label(slide, txt, x, y, w, color = C.blue) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 0.32,
    rectRadius: 0.05,
    fill: { color },
    line: { color },
  });
  slide.addText(txt, {
    x: x + 0.05, y: y + 0.075, w: w - 0.1, h: 0.12,
    fontSize: 8.8, color: 'FFFFFF', bold: true, align: 'center', margin: 0,
    fit: 'shrink',
  });
}

function panel(slide, x, y, w, h, fill = 'FFFFFF', line = C.line) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.07,
    fill: { color: fill },
    line: { color: line, width: 1 },
  });
}

function riskTag(slide, txt, x, y, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 0.72, h: 0.28,
    rectRadius: 0.05,
    fill: { color },
    line: { color },
  });
  slide.addText(txt, {
    x, y: y + 0.055, w: 0.72, h: 0.1,
    fontSize: 7.8, bold: true, color: 'FFFFFF',
    align: 'center', margin: 0, fit: 'shrink',
  });
}

function addBarChart(slide, x, y, w, h, values, max, chartTitle, yLabel) {
  slide.addText(chartTitle, {
    x, y: y - 0.3, w, h: 0.22,
    fontSize: 13, bold: true, color: C.ink, margin: 0,
  });
  const plotX = x + 0.4;
  const plotY = y + 0.2;
  const plotW = w - 0.65;
  const plotH = h - 0.75;
  for (let t = 0; t <= max; t += 2) {
    const yy = plotY + plotH - (t / max) * plotH;
    slide.addShape(pptx.ShapeType.line, {
      x: plotX, y: yy, w: plotW, h: 0,
      line: { color: C.line, width: 0.6 },
    });
    slide.addText(String(t), {
      x: x + 0.02, y: yy - 0.07, w: 0.25, h: 0.1,
      fontSize: 7.2, color: C.gray, margin: 0, align: 'right',
    });
  }
  const barW = plotW / values.length * 0.55;
  const gap = plotW / values.length * 0.45;
  values.forEach((d, i) => {
    const bh = (d.value / max) * plotH;
    const bx = plotX + i * (barW + gap) + gap * 0.45;
    const by = plotY + plotH - bh;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: bx, y: by, w: barW, h: bh,
      rectRadius: 0.04,
      fill: { color: d.color },
      line: { color: d.color },
    });
    slide.addText(d.value.toFixed(d.value >= 10 ? 1 : 3), {
      x: bx - 0.08, y: by - 0.22, w: barW + 0.16, h: 0.12,
      fontSize: 7.6, bold: true, color: d.color, align: 'center', margin: 0,
      fit: 'shrink',
    });
    slide.addText(d.label, {
      x: bx - 0.16, y: plotY + plotH + 0.14, w: barW + 0.32, h: 0.16,
      fontSize: 8, bold: true, color: C.ink, align: 'center', margin: 0,
      fit: 'shrink',
    });
  });
  slide.addText(yLabel, {
    x: x, y: plotY + plotH / 2 - 0.1, w: 0.24, h: 0.12,
    fontSize: 8, bold: true, color: C.gray, rotate: 270, margin: 0,
  });
}

function addTable(slide, x, y, colWs, rowH, headers, rows, opts = {}) {
  const headerFill = opts.headerFill || C.blue;
  let cx = x;
  headers.forEach((h, i) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: cx, y, w: colWs[i], h: rowH,
      fill: { color: headerFill },
      line: { color: headerFill, width: 0.5 },
    });
    slide.addText(h, {
      x: cx + 0.05, y: y + 0.08, w: colWs[i] - 0.1, h: rowH - 0.12,
      fontSize: opts.headerFontSize || 8.5,
      bold: true,
      color: 'FFFFFF',
      margin: 0,
      fit: 'shrink',
      valign: 'mid',
    });
    cx += colWs[i];
  });
  rows.forEach((r, ri) => {
    const yy = y + rowH + ri * rowH;
    cx = x;
    colWs.forEach((cw, ci) => {
      const fill = ri % 2 === 0 ? 'FFFFFF' : 'F7FBFF';
      slide.addShape(pptx.ShapeType.rect, {
        x: cx, y: yy, w: cw, h: rowH,
        fill: { color: fill },
        line: { color: C.line, width: 0.5 },
      });
      slide.addText(String(r[ci] ?? ''), {
        x: cx + 0.05, y: yy + 0.08, w: cw - 0.1, h: rowH - 0.12,
        fontSize: opts.fontSize || 7.8,
        bold: opts.boldCols?.includes(ci) || false,
        color: opts.colorCols?.[ci] || C.ink,
        margin: 0,
        fit: 'shrink',
        valign: 'mid',
        breakLine: false,
      });
      cx += cw;
    });
  });
}

// 1. Cover
{
  const s = pptx.addSlide();
  s.background = { color: 'FFFFFF' };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 3.75, h: 7.5, fill: { color: C.blue }, line: { color: C.blue } });
  s.addShape(pptx.ShapeType.rect, { x: 3.75, y: 0, w: 0.08, h: 7.5, fill: { color: C.orange }, line: { color: C.orange } });
  s.addText('P1000H O-ring', { x: 4.45, y: 1.28, w: 6.4, h: 0.48, fontSize: 30, bold: true, color: C.ink, margin: 0 });
  s.addText('性能测试汇总报告', { x: 4.45, y: 1.86, w: 6.4, h: 0.55, fontSize: 32, bold: true, color: C.ink, margin: 0 });
  s.addText('影响路径：吸水一致性与 Optical CV\nData cut: 1,020,000 cycles / 392.3% life', {
    x: 4.48, y: 2.72, w: 6.3, h: 0.58, fontSize: 15, color: C.gray, margin: 0, fit: 'shrink',
  });
  s.addText('报告目的', { x: 0.55, y: 1.0, w: 1.7, h: 0.2, fontSize: 12, bold: true, color: 'DCEBFF', margin: 0 });
  s.addText('从 O-ring 密封性能角度\n解释吸水异常\n与光学波动\n并给出逐台风险分层', {
    x: 0.55, y: 1.42, w: 2.65, h: 1.55, fontSize: 15.5, bold: true, color: 'FFFFFF', margin: 0, breakLine: false, fit: 'shrink',
  });
  s.addText('SZ ENG | 2026-06-04', { x: 4.48, y: 5.9, w: 3.4, h: 0.24, fontSize: 12, color: C.gray, margin: 0 });
  footer(s, 1);
}

// 2. Executive summary
{
  const s = pptx.addSlide();
  title(s, 'Executive Summary / 结论摘要', 'O-ring 风险集中在 A05、A04、1217A05；0311A04 可作为稳定对照。', 2);
  panel(s, 0.75, 1.35, 3.65, 1.25, C.paleRed, 'FECACA');
  panel(s, 4.75, 1.35, 3.65, 1.25, C.paleOrange, 'FED7AA');
  panel(s, 8.75, 1.35, 3.65, 1.25, C.paleGreen, 'BBF7D0');
  s.addText('最高优先级', { x: 1.0, y: 1.62, w: 2.4, h: 0.2, fontSize: 13, bold: true, color: C.red, margin: 0 });
  s.addText('0624A05\n最新 CV 6.839，plate 1-3 全高', { x: 1.0, y: 1.92, w: 3.0, h: 0.36, fontSize: 12.5, bold: true, color: C.ink, margin: 0, fit: 'shrink' });
  s.addText('高风险闭环', { x: 5.0, y: 1.62, w: 2.4, h: 0.2, fontSize: 13, bold: true, color: C.orange, margin: 0 });
  s.addText('0624A04 / 1217A05\nLOW %D、吸水少、油漏事件', { x: 5.0, y: 1.92, w: 3.0, h: 0.36, fontSize: 12.5, bold: true, color: C.ink, margin: 0, fit: 'shrink' });
  s.addText('稳定对照', { x: 9.0, y: 1.62, w: 2.4, h: 0.2, fontSize: 13, bold: true, color: C.green, margin: 0 });
  s.addText('0311A04\nlatest CV 0.677，无非 Pressure fail note', { x: 9.0, y: 1.92, w: 3.05, h: 0.36, fontSize: 12.5, bold: true, color: C.ink, margin: 0, fit: 'shrink' });
  addBullets(s, [
    '主要判断：完成 1,020,000 cycles 不等于 O-ring 性能无异常通过。',
    '直接证据包括：LOW %D、C5/C7 吸水少、latest / historical Optical CV 升高、worst-channel CV 峰值。',
    'O-ring 相关推断：密封不足、压缩永久变形、润滑/污染异常会导致吸水量偏差，并最终反映为 optical CV 波动。',
    '建议采用“更换 O-ring 前后对比复测”确认因果关系，而不是仅凭 CV 直接判定 O-ring 为唯一原因。',
  ], 0.85, 3.0, 11.4, 2.6, { fontSize: 15 });
}

// 3. Mechanism chain
{
  const s = pptx.addSlide();
  title(s, 'O-ring 对吸水与 Optical 的影响链路', '本页为工程机理推断，用于解释为什么密封性能会影响吸水和光学结果。', 3);
  const nodes = [
    ['O-ring 状态', '磨损 / 压缩变形\n润滑不足 / 污染\n装配偏差', C.blue],
    ['密封与摩擦', '微漏气\n滑动阻力变化\n通道间差异', C.cyan],
    ['吸水表现', '吸水少\nLOW %D\n气泡 / 残液风险', C.orange],
    ['Optical 结果', 'CV 升高\nworst-channel CV 升高\nplate 间一致性下降', C.red],
    ['报告结论', '按通道定位\nO-ring 拆检\n更换前后复测', C.green],
  ];
  nodes.forEach((n, i) => {
    const x = 0.65 + i * 2.48;
    panel(s, x, 1.82, 1.92, 2.35, i === 0 ? C.paleBlue : 'FFFFFF', C.line);
    s.addText(n[0], { x: x + 0.15, y: 2.08, w: 1.62, h: 0.22, fontSize: 13, bold: true, color: n[2], align: 'center', margin: 0 });
    s.addText(n[1], { x: x + 0.16, y: 2.62, w: 1.6, h: 0.85, fontSize: 11.5, bold: true, color: C.ink, align: 'center', valign: 'mid', margin: 0, fit: 'shrink' });
    if (i < nodes.length - 1) {
      s.addShape(pptx.ShapeType.chevron, { x: x + 1.98, y: 2.75, w: 0.36, h: 0.42, fill: { color: C.line }, line: { color: C.line } });
    }
  });
  addBullets(s, [
    '关键解释：O-ring 不一定直接造成 optical 读数异常，但会先影响气密性和吸/排液稳定性。',
    '当吸水量偏小或通道间吸水不一致时，光学读数会表现为 LOW %D、CV 高、worst-channel CV 高。',
    '因此，本报告将 O-ring 风险判定建立在“吸水现象 + optical CV + 通道定位”的组合证据上。',
  ], 0.95, 4.85, 11.0, 1.1, { fontSize: 13.2 });
}

// 4. Optical evidence
{
  const s = pptx.addSlide();
  title(s, '总体 Optical 证据：latest CV 与历史峰值', 'A05 最新 CV 明显偏高；A04 / A01 的历史峰值提示曾出现通道一致性失控。', 4);
  addBarChart(s, 0.72, 1.55, 5.75, 4.8, pipettes.map(p => ({ label: p.short, value: p.latestCv, color: p.color })), 8, 'Latest Optical CV @ 1,020,000 cycles', 'CV');
  addBarChart(s, 6.95, 1.55, 5.65, 4.8, pipettes.map(p => ({ label: p.short, value: p.maxWorst, color: p.color })), 14, 'Historical Max Worst-channel CV', 'CV');
  s.addText('读法：latest CV 反映寿命终点状态；max worst-channel CV 反映历史上是否出现过通道级异常峰值。', {
    x: 0.85, y: 6.45, w: 11.2, h: 0.22,
    fontSize: 11.2, color: C.gray, margin: 0, fit: 'shrink',
  });
}

// 5. Aspiration evidence
{
  const s = pptx.addSlide();
  title(s, '吸水与 LOW %D 证据：O-ring 风险的直接观察窗口', 'O-ring 密封不足更容易先表现为吸水偏低或个别通道不稳定，再传导到 optical CV。', 5);
  const rows = [
    ['0624A04', 'F1 LOW %D @100k; A5 LOW %D @260k', '520k 油漏 / 背板有油 / sensor error', '密封污染或润滑异常需优先排查'],
    ['1217A05', 'C5/C7 low aspiration @175% / 455k', '明确 fail 记录', '局部通道 O-ring 装配或磨损风险'],
    ['0624A01', 'H1 LOW %D; G12 LOW %D @195k', 'latest optical 已改善', '阶段性异常，需确认可重复性'],
    ['0624A05', '未见明确 LOW %D note', 'latest CV 6.839，plate 1-3 全高', '整体一致性风险，需用吸水复测验证'],
    ['0311A04', '未见非 Pressure fail / LOW %D note', 'latest CV 0.677', '稳定参考样本'],
  ];
  addTable(s, 0.55, 1.42, [1.15, 3.25, 2.6, 4.25], 0.72, ['Unit', '吸水/LOW %D 现象', '相关光学或事件', 'O-ring 解读'], rows, { fontSize: 8.2, headerFontSize: 9, boldCols: [0] });
  s.addText('注意：LOW %D / low aspiration 是 O-ring 相关风险的强证据，但仍需拆检或更换前后复测才能证明 O-ring 为唯一根因。', {
    x: 0.65, y: 6.5, w: 11.5, h: 0.25,
    fontSize: 11.2, color: C.gray, margin: 0, fit: 'shrink',
  });
}

// 6. Per-pipette matrix
{
  const s = pptx.addSlide();
  title(s, '逐台 O-ring 风险评估矩阵', '风险排序综合了吸水现象、latest optical、历史峰值和通道定位信息。', 6);
  const rows = pipettes.map(p => [
    p.short,
    p.risk,
    `Latest CV ${p.latestCv.toFixed(3)}; worst ${p.latestWorst.toFixed(3)}`,
    p.aspiration,
    p.inference,
  ]);
  addTable(s, 0.45, 1.22, [1.1, 0.9, 2.3, 3.25, 4.75], 0.72, ['Unit', 'Risk', 'Optical', '吸水/LOW %D', 'O-ring 风险解读'], rows, {
    fontSize: 7.7,
    headerFontSize: 8.5,
    boldCols: [0, 1],
  });
  pipettes.forEach((p, i) => {
    const yy = 1.22 + 0.72 + i * 0.72 + 0.22;
    riskTag(s, p.risk, 1.58, yy, p.color);
  });
  s.addText('优先级：A05 先复测确认整体 optical 偏高；A04 / 1217A05 按吸水异常和事件记录做通道拆检；A01 监控；0311A04 做 reference。', {
    x: 0.55, y: 6.55, w: 11.6, h: 0.22,
    fontSize: 10.8, color: C.gray, margin: 0, fit: 'shrink',
  });
}

// 7. High risk detail
{
  const s = pptx.addSlide();
  title(s, '高风险样机拆解：需要证明 O-ring 与结果异常的因果关系', '三台样机的风险类型不同：A05 偏整体一致性，A04 偏污染/事件，1217A05 偏局部通道。', 7);
  const cards = [
    {
      title: '0624A05 | 整体 optical 偏高',
      color: C.red,
      body: ['Latest / max CV 6.839', 'plate 1-3 均高', '优先做 O-ring 更换前后对比'],
    },
    {
      title: '0624A04 | LOW %D + 油漏事件',
      color: C.orange,
      body: ['F1 / A5 LOW %D history', '520k 油漏与 sensor error', '检查润滑、污染、密封面'],
    },
    {
      title: '1217A05 | 局部通道吸水少',
      color: C.orange,
      body: ['175% explicit fail', 'C5/C7 low aspiration', '按通道拆检 O-ring / 活塞'],
    },
  ];
  cards.forEach((c, i) => {
    const x = 0.75 + i * 4.05;
    panel(s, x, 1.55, 3.45, 3.55, i === 0 ? C.paleRed : C.paleOrange, i === 0 ? 'FECACA' : 'FED7AA');
    label(s, c.title, x + 0.25, 1.85, 2.95, c.color);
    addBullets(s, c.body.map(v => `• ${v}`), x + 0.35, 2.45, 2.75, 1.45, { fontSize: 13, bold: true });
    s.addShape(pptx.ShapeType.line, { x: x + 0.3, y: 4.25, w: 2.85, h: 0, line: { color: c.color, width: 1 } });
    s.addText('结论：按 O-ring 风险样机处理，先复测再定根因。', {
      x: x + 0.35, y: 4.45, w: 2.7, h: 0.32,
      fontSize: 10.5, color: C.ink, bold: true, margin: 0, fit: 'shrink',
    });
  });
  s.addText('高风险不等于 O-ring 已被证明失效；但这些样机最值得做 O-ring 拆检与更换前后 A/B 复测。', {
    x: 0.8, y: 6.05, w: 11.2, h: 0.28,
    fontSize: 13.5, color: C.ink, bold: true, align: 'center', margin: 0,
  });
}

// 8. Verification plan
{
  const s = pptx.addSlide();
  title(s, '建议验证计划：把 O-ring 假设变成可证明结论', '验证应同时覆盖物理状态、吸水表现、光学结果和通道定位。', 8);
  const steps = [
    ['1', '拆检与外观', '观察磨损、划伤、污染、缺口、润滑状态；记录对应通道。'],
    ['2', '尺寸与材料', '测 O-ring 截面/内径、硬度、压缩永久变形；与新件对比。'],
    ['3', '更换前后复测', '同一台、同一通道、同一 protocol，对比吸水量、LOW %D、Optical CV。'],
    ['4', '通道定向验证', '优先 C5/C7、F1/A5、H1/G12；A05 增加全通道 optical repeat。'],
    ['5', '密封辅助验证', 'Pressure / leak 可作为辅助证据，帮助确认密封而不是光学算法问题。'],
  ];
  steps.forEach((st, i) => {
    const y = 1.35 + i * 0.9;
    s.addShape(pptx.ShapeType.ellipse, { x: 0.85, y, w: 0.44, h: 0.44, fill: { color: C.blue }, line: { color: C.blue } });
    s.addText(st[0], { x: 0.85, y: y + 0.095, w: 0.44, h: 0.12, fontSize: 9, bold: true, color: 'FFFFFF', align: 'center', margin: 0 });
    s.addText(st[1], { x: 1.55, y: y + 0.02, w: 2.1, h: 0.2, fontSize: 14, bold: true, color: C.ink, margin: 0 });
    s.addText(st[2], { x: 3.55, y: y + 0.02, w: 8.4, h: 0.24, fontSize: 12.6, color: C.ink, margin: 0, fit: 'shrink' });
  });
  panel(s, 0.85, 6.2, 11.2, 0.55, C.paleBlue, 'BFDBFE');
  s.addText('最终判定标准建议：更换 O-ring 后，异常通道 LOW %D 消失、Optical CV 下降并可重复，才可支持 O-ring 为主要原因。', {
    x: 1.05, y: 6.37, w: 10.75, h: 0.15,
    fontSize: 11.5, color: C.blueDark, bold: true, align: 'center', margin: 0, fit: 'shrink',
  });
}

// 9. Final conclusion
{
  const s = pptx.addSlide();
  title(s, 'Final Conclusion / 最终总结', '本报告把 O-ring 作为解释吸水与 optical 波动的核心工程假设，并给出样机处理优先级。', 9);
  panel(s, 0.85, 1.4, 5.45, 3.6, C.paleBlue, 'BFDBFE');
  panel(s, 6.75, 1.4, 5.45, 3.6, 'FFFFFF', C.line);
  s.addText('结论', { x: 1.15, y: 1.72, w: 1.8, h: 0.24, fontSize: 16, bold: true, color: C.blue, margin: 0 });
  addBullets(s, [
    '• A05、A04、1217A05 应作为 O-ring 高风险样机。',
    '• A01 当前结果改善，但历史 LOW %D 和高 CV 需要继续监控。',
    '• 0311A04 是当前最适合作为稳定 reference 的样机。',
    '• 不建议仅以完成 cycles 判定 O-ring 通过。',
  ], 1.15, 2.2, 4.75, 1.85, { fontSize: 14.5, bold: true });
  s.addText('下一步', { x: 7.05, y: 1.72, w: 1.8, h: 0.24, fontSize: 16, bold: true, color: C.blue, margin: 0 });
  addBullets(s, [
    '1. 0624A05：优先复测 optical，并做 O-ring 更换前后对比。',
    '2. 0624A04：追溯油漏/污染/润滑状态，拆检 F1/A5 相关通道。',
    '3. 1217A05：按 C5/C7 定向拆检，确认局部密封问题。',
    '4. 将吸水、optical 和 seal/leak 结果合并到最终 acceptance。',
  ], 7.05, 2.2, 4.75, 1.85, { fontSize: 13.5 });
  s.addText('报告口径：当前结论是基于吸水/LOW %D/Optical CV 现象对 O-ring 风险的工程判断；根因仍需通过拆检和更换前后复测确认。', {
    x: 0.95, y: 5.85, w: 11.2, h: 0.4,
    fontSize: 14, bold: true, color: C.ink, align: 'center', margin: 0, fit: 'shrink',
  });
}

pptx.writeFile({ fileName: OUT }).then(() => {
  console.log(OUT);
});
