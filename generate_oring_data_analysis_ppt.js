const fs = require('fs');
const pptxgen = require('pptxgenjs');

const DATA = JSON.parse(fs.readFileSync('/Users/yew/opentrons/oring_analysis_data.json', 'utf8'));
const OUT = '/Users/yew/opentrons/P1000H_Oring_data_analysis_report_2026-06-04.pptx';

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Codex';
pptx.company = 'Opentrons';
pptx.subject = 'P1000H O-ring data analysis report';
pptx.title = 'P1000H O-ring Data Analysis Report';
pptx.lang = 'zh-CN';
pptx.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial', lang: 'zh-CN' };

const C = {
  blue: '2168D3',
  blue2: '174EA6',
  cyan: '0891B2',
  green: '16A34A',
  yellow: 'FBBF24',
  orange: 'F59E0B',
  red: 'DC2626',
  purple: '7C3AED',
  ink: '2F3437',
  gray: '687384',
  light: 'F6F9FC',
  line: 'D9E2EF',
  paleBlue: 'EAF2FF',
  paleRed: 'FEF2F2',
  paleOrange: 'FFF7ED',
  paleGreen: 'ECFDF5',
};

const COLOR_BY_SHORT = {
  '0624A04': C.orange,
  '1217A05': C.purple,
  '0311A04': C.green,
  '0624A01': C.cyan,
  '0624A05': C.red,
};

const RISK_BY_SHORT = {
  '0624A05': 'High',
  '0624A04': 'High',
  '1217A05': 'High',
  '0624A01': 'Monitor',
  '0311A04': 'Low',
};

const ORDER = ['0624A04', '1217A05', '0311A04', '0624A01', '0624A05'];
const samples = DATA.samples
  .map(s => ({ ...s, short: shortId(s.id), color: COLOR_BY_SHORT[shortId(s.id)] || C.blue }))
  .sort((a, b) => ORDER.indexOf(a.short) - ORDER.indexOf(b.short));

function shortId(id) {
  if (id.includes('0624A04')) return '0624A04';
  if (id.includes('1217A05')) return '1217A05';
  if (id.includes('0311A04')) return '0311A04';
  if (id.includes('0624A01')) return '0624A01';
  if (id.includes('0624A05')) return '0624A05';
  return id.slice(-7);
}

function num(v, d = 3) {
  return typeof v === 'number' ? v.toFixed(d) : String(v ?? '-');
}

function kcycles(v) {
  if (typeof v !== 'number') return '-';
  return v === 0 ? '0' : `${Math.round(v / 1000)}k`;
}

function pctLife(v) {
  return typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : String(v ?? '-');
}

function title(slide, text, subtitle, idx) {
  slide.addText(text, { x: 0.55, y: 0.31, w: 10.2, h: 0.35, fontSize: 18.5, bold: true, color: C.blue, margin: 0, fit: 'shrink' });
  if (subtitle) slide.addText(subtitle, { x: 0.55, y: 0.73, w: 11.25, h: 0.24, fontSize: 10.5, color: C.gray, margin: 0, fit: 'shrink' });
  slide.addText('Opentrons', { x: 11.05, y: 0.34, w: 1.55, h: 0.22, fontSize: 12.5, bold: true, color: C.blue, align: 'right', margin: 0 });
  slide.addShape(pptx.ShapeType.line, { x: 0.55, y: 1.05, w: 11.85, h: 0, line: { color: C.line, width: 1 } });
  footer(slide, idx);
}

function footer(slide, idx) {
  slide.addText(`P1000H O-ring Data Analysis | 2026-06-04 | ${idx}/13`, { x: 0.55, y: 7.16, w: 5.2, h: 0.13, fontSize: 6.5, color: C.gray, margin: 0 });
}

function panel(slide, x, y, w, h, fill = 'FFFFFF', line = C.line) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { color: line, width: 0.8 } });
}

function addText(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontSize: opts.fontSize || 11.5,
    bold: opts.bold || false,
    color: opts.color || C.ink,
    margin: opts.margin ?? 0.04,
    fit: 'shrink',
    breakLine: false,
    valign: opts.valign || 'top',
    align: opts.align || 'left',
    paraSpaceAfterPt: opts.paraSpaceAfterPt ?? 3,
  });
}

function addBullets(slide, lines, x, y, w, h, opts = {}) {
  addText(slide, lines.join('\n'), x, y, w, h, { fontSize: opts.fontSize || 12.5, color: opts.color, bold: opts.bold, paraSpaceAfterPt: 5 });
}

function addTable(slide, x, y, widths, rowH, headers, rows, opts = {}) {
  let cx = x;
  headers.forEach((h, i) => {
    slide.addShape(pptx.ShapeType.rect, { x: cx, y, w: widths[i], h: rowH, fill: { color: opts.headerFill || C.blue }, line: { color: opts.headerFill || C.blue, width: 0.5 } });
    addText(slide, h, cx + 0.04, y + 0.06, widths[i] - 0.08, rowH - 0.08, { fontSize: opts.headerFontSize || 7.9, color: 'FFFFFF', bold: true, margin: 0.01, valign: 'mid' });
    cx += widths[i];
  });
  rows.forEach((r, ri) => {
    const yy = y + rowH + ri * rowH;
    cx = x;
    widths.forEach((w, ci) => {
      slide.addShape(pptx.ShapeType.rect, { x: cx, y: yy, w, h: rowH, fill: { color: ri % 2 === 0 ? 'FFFFFF' : 'F8FBFF' }, line: { color: C.line, width: 0.45 } });
      addText(slide, String(r[ci] ?? ''), cx + 0.04, yy + 0.055, w - 0.08, rowH - 0.08, { fontSize: opts.fontSize || 7.2, bold: opts.boldCols?.includes(ci), margin: 0.01, valign: 'mid' });
      cx += w;
    });
  });
}

function riskColor(risk) {
  if (risk === 'High') return C.red;
  if (risk === 'Monitor') return C.yellow;
  return C.green;
}

function addRiskPill(slide, risk, x, y, w = 0.75) {
  const c = riskColor(risk);
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.25, rectRadius: 0.045, fill: { color: c }, line: { color: c } });
  addText(slide, risk, x, y + 0.045, w, 0.08, { fontSize: 7.0, color: 'FFFFFF', bold: true, align: 'center', margin: 0 });
}

function lineChart(slide, x, y, w, h, metric, chartTitle, yMax, opts = {}) {
  addText(slide, chartTitle, x, y - 0.31, w, 0.2, { fontSize: 12.7, bold: true, margin: 0 });
  const plotX = x + 0.45;
  const plotY = y + 0.2;
  const plotW = w - 0.7;
  const plotH = h - 0.65;
  const maxCycle = 1020000;
  for (let t = 0; t <= yMax; t += opts.yStep || 2) {
    const yy = plotY + plotH - (t / yMax) * plotH;
    slide.addShape(pptx.ShapeType.line, { x: plotX, y: yy, w: plotW, h: 0, line: { color: C.line, width: 0.45 } });
    addText(slide, String(t), x + 0.08, yy - 0.065, 0.25, 0.09, { fontSize: 6.5, color: C.gray, align: 'right', margin: 0 });
  }
  const ticks = [0, 260000, 520000, 820000, 1020000];
  ticks.forEach(t => {
    const xx = plotX + (t / maxCycle) * plotW;
    slide.addShape(pptx.ShapeType.line, { x: xx, y: plotY + plotH, w: 0, h: 0.05, line: { color: C.gray, width: 0.45 } });
    addText(slide, kcycles(t), xx - 0.16, plotY + plotH + 0.09, 0.34, 0.09, { fontSize: 6.5, color: C.gray, align: 'center', margin: 0 });
  });
  if (opts.refLine) {
    const yy = plotY + plotH - (opts.refLine / yMax) * plotH;
    slide.addShape(pptx.ShapeType.line, { x: plotX, y: yy, w: plotW, h: 0, line: { color: C.red, width: 0.9, dash: 'dash' } });
    addText(slide, opts.refLabel || String(opts.refLine), plotX + plotW - 0.9, yy - 0.16, 0.9, 0.12, { fontSize: 7.0, color: C.red, bold: true, align: 'right', margin: 0 });
  }
  samples.forEach((s, si) => {
    const pts = s.records.filter(r => typeof r[metric] === 'number').map(r => ({
      x: plotX + (r.cycles / maxCycle) * plotW,
      y: plotY + plotH - (r[metric] / yMax) * plotH,
      raw: r,
    }));
    for (let i = 1; i < pts.length; i++) {
      slide.addShape(pptx.ShapeType.line, { x: pts[i - 1].x, y: pts[i - 1].y, w: pts[i].x - pts[i - 1].x, h: pts[i].y - pts[i - 1].y, line: { color: s.color, width: 1.1 } });
    }
    pts.forEach((p, i) => {
      if (i === 0 || i === pts.length - 1 || p.raw.cycles === s.summary.max_cv.cycles || p.raw.cycles === s.summary.max_worst.cycles) {
        slide.addShape(pptx.ShapeType.ellipse, { x: p.x - 0.035, y: p.y - 0.035, w: 0.07, h: 0.07, fill: { color: s.color }, line: { color: 'FFFFFF', width: 0.4 } });
      }
    });
  });
  // Legend
  samples.forEach((s, i) => {
    const lx = x + 0.5 + (i % 5) * 1.0;
    const ly = y + h - 0.13;
    slide.addShape(pptx.ShapeType.rect, { x: lx, y: ly, w: 0.12, h: 0.07, fill: { color: s.color }, line: { color: s.color } });
    addText(slide, s.short, lx + 0.16, ly - 0.015, 0.75, 0.09, { fontSize: 6.9, color: C.gray, margin: 0 });
  });
}

function barChart(slide, x, y, w, h, values, max, chartTitle, opts = {}) {
  addText(slide, chartTitle, x, y - 0.3, w, 0.2, { fontSize: 12.7, bold: true, margin: 0 });
  const plotX = x + 0.42;
  const plotY = y + 0.18;
  const plotW = w - 0.58;
  const plotH = h - 0.62;
  for (let t = 0; t <= max; t += opts.step || 2) {
    const yy = plotY + plotH - (t / max) * plotH;
    slide.addShape(pptx.ShapeType.line, { x: plotX, y: yy, w: plotW, h: 0, line: { color: C.line, width: 0.45 } });
    addText(slide, String(t), x + 0.06, yy - 0.06, 0.25, 0.09, { fontSize: 6.4, color: C.gray, align: 'right', margin: 0 });
  }
  if (opts.refLine) {
    const yy = plotY + plotH - (opts.refLine / max) * plotH;
    slide.addShape(pptx.ShapeType.line, { x: plotX, y: yy, w: plotW, h: 0, line: { color: C.red, width: 0.9, dash: 'dash' } });
  }
  const stepW = plotW / values.length;
  const bw = stepW * 0.58;
  values.forEach((d, i) => {
    const bh = (d.value / max) * plotH;
    const bx = plotX + i * stepW + (stepW - bw) / 2;
    const by = plotY + plotH - bh;
    slide.addShape(pptx.ShapeType.roundRect, { x: bx, y: by, w: bw, h: Math.max(0.02, bh), rectRadius: 0.035, fill: { color: d.color }, line: { color: d.color } });
    addText(slide, d.value.toFixed(d.value >= 10 ? 1 : 3), bx - 0.09, by - 0.18, bw + 0.18, 0.1, { fontSize: 6.8, color: d.color, bold: true, align: 'center', margin: 0 });
    addText(slide, d.label, bx - 0.16, plotY + plotH + 0.1, bw + 0.32, 0.12, { fontSize: 6.8, color: C.ink, bold: true, align: 'center', margin: 0 });
  });
}

function getLatestPlateRows() {
  return samples.map(s => {
    const latest = s.summary.latest;
    return [
      s.short,
      num(latest.cv),
      latest.plates.map(v => typeof v === 'number' ? num(v, 3) : String(v)).join(' / '),
      String(latest.numeric_plate_count),
      latest.note || '-',
    ];
  });
}

function findSample(short) {
  return samples.find(s => s.short === short);
}

// 1 Cover
{
  const s = pptx.addSlide();
  s.background = { color: 'FFFFFF' };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 3.65, h: 7.5, fill: { color: C.blue }, line: { color: C.blue } });
  s.addShape(pptx.ShapeType.rect, { x: 3.65, y: 0, w: 0.08, h: 7.5, fill: { color: C.orange }, line: { color: C.orange } });
  addText(s, 'P1000H O-ring', 4.4, 1.22, 6.7, 0.45, { fontSize: 30, bold: true, margin: 0 });
  addText(s, '数据分析报告', 4.4, 1.78, 6.7, 0.55, { fontSize: 34, bold: true, margin: 0 });
  addText(s, 'Data-focused analysis of aspiration behavior and optical CV\n1,020,000 cycles / 392.3% life', 4.43, 2.65, 6.7, 0.55, { fontSize: 15, color: C.gray, margin: 0 });
  addText(s, '报告类型', 0.55, 1.0, 1.7, 0.2, { fontSize: 12, color: 'DCEBFF', bold: true, margin: 0 });
  addText(s, '数据分析\n趋势 / 异常节点\nplate-level 口径\n逐台证据链', 0.55, 1.45, 2.45, 1.55, { fontSize: 19, color: 'FFFFFF', bold: true, margin: 0 });
  addText(s, 'SZ ENG | 2026-06-04', 4.43, 5.85, 3.8, 0.24, { fontSize: 12, color: C.gray, margin: 0 });
  footer(s, 1);
}

// 2 Scope and dataset
{
  const s = pptx.addSlide();
  title(s, '1. 数据范围与分析口径', '本报告以吸水/LOW %D 与 Optical CV 为主分析对象，Pressure 仅作为密封辅助背景，不作为主判定。', 2);
  const rows = [
    ['样本数量', '5 台 production P1KH 96-channel P1000H'],
    ['测试类型', '1000 uL cycles / O-ring 相关性能观察'],
    ['Cycle 记录', '每台 15 条 cycle row，其中 10 条具有可分析 CV 数值'],
    ['最新节点', '1,020,000 cycles / 392.3% life / Finish x5'],
    ['关键数据字段', 'CV across all dispenses、plate1-5 CV、worst-channel CV、LOW %D / fail / note'],
    ['重要口径变化', '1020k 最新节点仅 plate1-3 有效，plate4/5 为 #DIV/0!'],
  ];
  addTable(s, 0.75, 1.35, [2.1, 9.4], 0.55, ['字段', '数据口径'], rows, { fontSize: 10, headerFontSize: 10.5, boldCols: [0] });
  panel(s, 0.8, 5.45, 11.45, 0.75, C.paleBlue, 'BFDBFE');
  addText(s, '分析原则：把 O-ring 作为“影响吸水一致性和 optical CV 的工程假设”，用数据证明风险等级；不把推断当作已确认根因。', 1.05, 5.7, 10.9, 0.18, { fontSize: 13, bold: true, color: C.blue2, align: 'center', margin: 0 });
}

// 3 Metrics
{
  const s = pptx.addSlide();
  title(s, '2. 指标定义：哪些数据能说明 O-ring 风险', 'O-ring 不直接产生 optical 数值；它通过密封和摩擦影响吸/排液稳定性，再反映到光学。', 3);
  const rows = [
    ['直接现象', 'LOW %D / low aspiration', '吸水偏少或通道局部吸液不足，是最接近 O-ring 密封问题的观察项'],
    ['直接现象', 'Optical CV across all dispenses', '总体分液一致性；升高提示通道间或 plate 间波动增加'],
    ['直接现象', 'Worst-channel CV', '用于定位单通道或少数通道的异常峰值'],
    ['数据质量', '有效 plate 数', 'latest 1020k 只测 3 盘，不能与历史 5 盘口径完全等价'],
    ['工程推断', 'O-ring 风险', '当 LOW %D、CV 峰值和通道定位同时出现时，O-ring 风险等级上升'],
  ];
  addTable(s, 0.65, 1.28, [1.35, 2.55, 7.65], 0.68, ['类别', '指标', '分析意义'], rows, { fontSize: 9.2, headerFontSize: 9.5, boldCols: [0, 1] });
  addBullets(s, [
    '• 本报告优先看“数据模式”：是否整体偏高、是否局部通道异常、是否伴随 LOW %D / fail note。',
    '• O-ring 结论必须通过拆检或更换前后复测确认；当前报告给出的是数据支持强弱。',
  ], 0.85, 5.55, 11.1, 0.75, { fontSize: 12.5, bold: true });
}

// 4 CV trend
{
  const s = pptx.addSlide();
  title(s, '3. CV Trend：不同样机的波动模式不同', 'A05 是 late-stage spike；A01 是 early/mid-stage high 后改善；A04 在 195k-520k 和 latest 均偏高。', 4);
  lineChart(s, 0.62, 1.55, 11.85, 4.65, 'cv', 'CV across all dispenses by cycle', 9, { yStep: 1, refLine: 5, refLabel: 'CV 5 reference' });
  const rows = samples.map(s => [s.short, num(s.summary.latest.cv), `${kcycles(s.summary.max_cv.cycles)} / ${num(s.summary.max_cv.cv)}`, `${s.summary.records_with_cv}`]);
  addTable(s, 0.78, 6.25, [1.2, 1.6, 2.4, 1.3], 0.32, ['Unit', 'Latest CV', 'Max CV point', 'N'], rows, { fontSize: 7.5, headerFontSize: 7.7, boldCols: [0] });
}

// 5 Worst channel
{
  const s = pptx.addSlide();
  title(s, '4. Worst-channel CV：通道级异常峰值定位', 'Worst-channel CV 能帮助识别局部密封/吸液不稳定，而不是只看总体 CV。', 5);
  lineChart(s, 0.62, 1.55, 11.85, 4.65, 'worst', 'Worst-channel CV by cycle', 14, { yStep: 2 });
  const rows = samples.map(s => [s.short, `${kcycles(s.summary.max_worst.cycles)} / ${num(s.summary.max_worst.worst)}`, `${kcycles(s.summary.latest.cycles)} / ${num(s.summary.latest.worst)}`, RISK_BY_SHORT[s.short]]);
  addTable(s, 0.78, 6.25, [1.2, 2.8, 2.8, 1.3], 0.32, ['Unit', 'Max worst-channel', 'Latest worst-channel', 'Risk'], rows, { fontSize: 7.5, headerFontSize: 7.7, boldCols: [0, 3] });
}

// 6 Latest plate-level
{
  const s = pptx.addSlide();
  title(s, '5. Latest 1020k Plate-level 分析', '最新节点只包含 plate1-3；A05 的三个有效 plate 均在 6.7-6.9，表现为整体性偏高。', 6);
  const latestVals = samples.map(s => ({ label: s.short, value: s.summary.latest.cv, color: s.color }));
  barChart(s, 0.65, 1.62, 5.7, 3.65, latestVals, 8, 'Latest CV comparison', { step: 1, refLine: 5 });
  const rows = getLatestPlateRows();
  addTable(s, 6.65, 1.38, [0.95, 1.0, 3.1, 0.7, 1.45], 0.48, ['Unit', 'Latest CV', 'Plate1 / Plate2 / Plate3 / Plate4 / Plate5', 'Valid', 'Note'], rows, { fontSize: 7.0, headerFontSize: 7.2, boldCols: [0] });
  panel(s, 0.85, 5.65, 11.1, 0.62, C.paleOrange, 'FED7AA');
  addText(s, '数据口径风险：latest 1020k 与早期 5-plate 数据不完全可比。A05 的异常仍然成立，因为 3 个有效 plate 同时偏高；但其他样机的 latest CV 应谨慎横向比较。', 1.05, 5.86, 10.7, 0.16, { fontSize: 10.7, bold: true, color: C.ink, align: 'center', margin: 0 });
}

// 7 Anomaly timeline
{
  const s = pptx.addSlide();
  title(s, '6. 异常节点时间线：吸水/LOW %D 与 optical 峰值的关系', '异常并非只在终点出现；A04、A01、1217A05 的关键证据集中在中早期。', 7);
  const timeline = [
    ['100k', '0624A04', 'F1 LOW %D in plate5', '吸水异常'],
    ['195k', '0624A01', 'H1 LOW %D plate2; G12 LOW %D plate3; worst CV 13.397', '吸水 + 通道峰值'],
    ['260k', '0624A04', 'A5 LOW %D plate4; CV 4.214', '吸水异常'],
    ['455k / 175%', '1217A05', 'Explicit fail; C5/C7 aspirate less', '明确吸水 fail'],
    ['520k', '0624A04', 'Oil leak / sensor error; CV 5.642; worst 11.204', '事件 + 光学峰值'],
    ['520k', '0624A01', 'Max CV 8.406', '光学峰值'],
    ['1020k', '0624A05', 'Latest CV 6.839; plate1-3 all high', '终点整体偏高'],
    ['1020k', 'All', 'Only 3 valid plates; plate4/5 #DIV/0!', '数据口径变化'],
  ];
  addTable(s, 0.55, 1.25, [1.05, 1.1, 7.4, 2.0], 0.52, ['Cycle', 'Unit', 'Observed data / note', 'Evidence type'], timeline, { fontSize: 8.2, headerFontSize: 8.6, boldCols: [0, 1, 3] });
  addText(s, '分析重点：O-ring 风险不是只由某一个 CV 数值决定，而是由“吸水异常 + 通道定位 + CV 峰值 + 事件记录”共同决定。', 0.75, 6.0, 11.1, 0.28, { fontSize: 12.8, bold: true, align: 'center', margin: 0 });
}

// 8 Summary matrix
{
  const s = pptx.addSlide();
  title(s, '7. 逐台数据矩阵：latest、peak、异常记录并列比较', '这一页是样机级数据总表，供后续 review 和 root-cause 排查使用。', 8);
  const rows = samples.map(s => [
    s.short,
    RISK_BY_SHORT[s.short],
    num(s.summary.latest.cv),
    `${kcycles(s.summary.max_cv.cycles)} / ${num(s.summary.max_cv.cv)}`,
    `${kcycles(s.summary.max_worst.cycles)} / ${num(s.summary.max_worst.worst)}`,
    s.notes.length ? s.notes.map(n => `${kcycles(n.cycles)} ${n.note || n.failed_channels}`).join('; ') : '-',
  ]);
  addTable(s, 0.45, 1.2, [0.9, 0.75, 1.0, 1.55, 1.85, 6.4], 0.69, ['Unit', 'Risk', 'Latest CV', 'Max CV', 'Max worst CV', 'Notes / fail evidence'], rows, { fontSize: 7.2, headerFontSize: 7.5, boldCols: [0, 1] });
  samples.forEach((sample, i) => addRiskPill(s, RISK_BY_SHORT[sample.short], 1.38, 1.2 + 0.69 + i * 0.69 + 0.21, 0.65));
}

// 9 A05 detail
{
  const s = pptx.addSlide();
  const sample = findSample('0624A05');
  title(s, '8. Case Analysis - 0624A05：late-stage optical spike', 'A05 的关键不是历史 LOW %D，而是终点三个有效 plate 同时出现高 CV。', 9);
  lineChart(s, 0.65, 1.45, 5.8, 3.8, 'cv', 'CV trend - all units, A05 highlighted by final spike', 9, { yStep: 1, refLine: 5 });
  const rows = sample.records.filter(r => typeof r.cv === 'number').map(r => [kcycles(r.cycles), pctLife(r.life), num(r.cv), num(r.worst), r.note || '-']);
  addTable(s, 6.7, 1.25, [0.75, 0.85, 0.75, 0.9, 2.8], 0.36, ['Cycle', 'Life', 'CV', 'Worst', 'Note'], rows, { fontSize: 6.4, headerFontSize: 6.7, boldCols: [0] });
  panel(s, 0.85, 5.55, 11.05, 0.68, C.paleRed, 'FECACA');
  addText(s, 'Data read: latest CV 6.839 is also max CV, with plate1/2/3 = 6.743 / 6.944 / 6.898. This is a repeatable plate-level pattern at the latest point, not a single plate outlier.', 1.05, 5.78, 10.65, 0.16, { fontSize: 10.2, bold: true, color: C.ink, align: 'center', margin: 0 });
}

// 10 A04 and 1217 detail
{
  const s = pptx.addSlide();
  title(s, '9. Case Analysis - A04 / 1217A05：吸水异常与局部通道风险', 'A04 有 LOW %D + oil leak event；1217A05 有明确 C5/C7 low aspiration fail。', 10);
  const a04 = findSample('0624A04');
  const a1217 = findSample('1217A05');
  const rows = [
    ['0624A04', '100k', 'F1 LOW %D in plate5', '早期吸水异常'],
    ['0624A04', '260k', 'A5 LOW %D plate4', '重复 LOW %D'],
    ['0624A04', '520k', 'Oil leak / sensor error; max CV 5.642; max worst 11.204', '事件 + optical peak'],
    ['0624A04', '1020k', 'Latest CV 4.379; only 3 valid plates', '终点仍偏高'],
    ['1217A05', '455k / 175%', 'Explicit fail; C5/C7 aspirate less', '明确吸水 fail'],
    ['1217A05', '520k', 'Max CV 6.195; max worst 7.419', 'optical peak'],
    ['1217A05', '1020k', 'Latest CV 1.487; worst 2.308', '终点改善但历史 fail 保留'],
  ];
  addTable(s, 0.55, 1.22, [1.05, 1.05, 6.55, 2.6], 0.5, ['Unit', 'Cycle', 'Data evidence', 'Interpretation'], rows, { fontSize: 8.1, headerFontSize: 8.5, boldCols: [0, 1] });
  addBarChartForTwo(s, 0.85, 5.25, 10.9, 1.1, [
    { label: 'A04 latest CV', value: a04.summary.latest.cv, color: a04.color },
    { label: 'A04 max worst', value: a04.summary.max_worst.worst, color: a04.color },
    { label: '1217 latest CV', value: a1217.summary.latest.cv, color: a1217.color },
    { label: '1217 max worst', value: a1217.summary.max_worst.worst, color: a1217.color },
  ]);
}

// Helper used only after declaration in slide 10.
function addBarChartForTwo(slide, x, y, w, h, values) {
  const max = Math.max(...values.map(v => v.value)) * 1.15;
  const stepW = w / values.length;
  values.forEach((d, i) => {
    const bw = stepW * 0.52;
    const bh = (d.value / max) * h;
    const bx = x + i * stepW + (stepW - bw) / 2;
    const by = y + h - bh;
    slide.addShape(pptx.ShapeType.roundRect, { x: bx, y: by, w: bw, h: bh, rectRadius: 0.035, fill: { color: d.color }, line: { color: d.color } });
    addText(slide, num(d.value, 2), bx, by - 0.18, bw, 0.12, { fontSize: 8, color: d.color, bold: true, align: 'center', margin: 0 });
    addText(slide, d.label, bx - 0.12, y + h + 0.08, bw + 0.24, 0.12, { fontSize: 7.0, color: C.gray, bold: true, align: 'center', margin: 0 });
  });
}

// 11 A01/0311 contrast
{
  const s = pptx.addSlide();
  title(s, '10. Case Analysis - A01 / 0311A04：恢复型与稳定型对照', 'A01 历史波动大但 latest 改善；0311A04 的 optical 表现稳定，可作为参考样本。', 11);
  const a01 = findSample('0624A01');
  const a0311 = findSample('0311A04');
  lineChart(s, 0.65, 1.5, 5.8, 3.8, 'cv', 'CV trend: A01 recovery vs 0311A04 stable baseline', 9, { yStep: 1, refLine: 5 });
  const rows = [
    ['0624A01', '65k-520k', 'CV 4.757 → 8.406 high band', '历史波动明显'],
    ['0624A01', '195k', 'H1 LOW %D; G12 LOW %D; worst 13.397', '吸水异常 + 通道峰值'],
    ['0624A01', '1020k', 'Latest CV 1.633; worst 3.046', '已改善但需确认可重复'],
    ['0311A04', '0-1020k', 'Latest CV 0.677; max CV 1.957', '整体稳定'],
    ['0311A04', '195k', 'Max worst 3.158', '低幅通道峰值，可接受作 reference'],
  ];
  addTable(s, 6.75, 1.35, [1.0, 1.1, 3.9, 2.0], 0.54, ['Unit', 'Cycle', 'Data', 'Read'], rows, { fontSize: 8.0, headerFontSize: 8.3, boldCols: [0, 1] });
  panel(s, 0.85, 5.65, 11.0, 0.55, C.paleBlue, 'BFDBFE');
  addText(s, `A01 max CV ${num(a01.summary.max_cv.cv)} vs latest ${num(a01.summary.latest.cv)}; 0311A04 latest ${num(a0311.summary.latest.cv)}. 数据上 A01 是“恢复型”，0311A04 是“稳定型”。`, 1.05, 5.84, 10.55, 0.12, { fontSize: 10.5, bold: true, color: C.blue2, align: 'center', margin: 0 });
}

// 12 Evidence strength
{
  const s = pptx.addSlide();
  title(s, '11. O-ring 证据强度矩阵', '区分“直接数据证据”和“O-ring 根因推断”，避免把相关性直接写成因果。', 12);
  const rows = [
    ['0624A05', '强：latest CV 6.839; 3 个有效 plate 同时高', '弱：无明确 LOW %D note', '中高：整体一致性下降，需更换前后复测'],
    ['0624A04', '强：F1/A5 LOW %D; max worst 11.204', '强：油漏/传感器事件', '高：污染/润滑/密封面异常需拆检'],
    ['1217A05', '强：C5/C7 low aspiration fail', '中：520k CV peak', '高：局部 O-ring 或通道装配风险'],
    ['0624A01', '中：H1/G12 LOW %D; historical CV high', '中：latest 改善', '中：阶段性异常，需 repeatability'],
    ['0311A04', '弱：无异常 note; CV 稳定', '弱', '低：reference sample'],
  ];
  addTable(s, 0.55, 1.25, [1.0, 3.65, 2.65, 4.05], 0.68, ['Unit', 'Optical / aspiration evidence', 'Supporting event', 'O-ring inference strength'], rows, { fontSize: 7.6, headerFontSize: 8.1, boldCols: [0] });
  addText(s, '根因确认标准：拆检发现 O-ring 异常，且更换后对应通道 LOW %D / CV 异常显著改善并可重复。', 0.8, 6.15, 11.0, 0.25, { fontSize: 12.5, bold: true, align: 'center', margin: 0 });
}

// 13 Next data
{
  const s = pptx.addSlide();
  title(s, '12. 数据补充与最终判定建议', '当前数据足以分层风险，但最终 O-ring performance 判定还需要补充验证数据。', 13);
  const rows = [
    ['1', 'O-ring 拆检数据', '磨损、划伤、污染、润滑状态、压缩永久变形', '把 optical/吸水异常与实物状态关联'],
    ['2', '更换前后 A/B 数据', '同台同通道，替换 O-ring 前后 CV、LOW %D、吸水量变化', '验证 O-ring 是否为主要原因'],
    ['3', '通道定位复测', 'C5/C7、F1/A5、H1/G12、A05 全通道 repeat', '确认异常是否固定在通道或 plate'],
    ['4', '统一 plate 口径', 'latest 节点补齐 5 plate 或明确 3 plate 标准', '解决历史与 latest 可比性问题'],
    ['5', '最终 acceptance 规则', 'Optical + aspiration + seal/leak 三类指标合并判定', '避免只按 cycles 或单一 CV 给出 PASS'],
  ];
  addTable(s, 0.65, 1.25, [0.5, 2.2, 5.1, 3.7], 0.64, ['#', 'Data needed', '具体内容', 'Purpose'], rows, { fontSize: 8.3, headerFontSize: 8.7, boldCols: [0, 1] });
  panel(s, 0.85, 5.85, 11.0, 0.65, C.paleOrange, 'FED7AA');
  addText(s, '建议最终报告结论写法：A05/A04/1217A05 为 O-ring performance 高风险样机；A01 为监控样机；0311A04 为稳定对照。根因需以拆检 + 更换前后复测闭环。', 1.05, 6.08, 10.6, 0.16, { fontSize: 10.5, bold: true, color: C.ink, align: 'center', margin: 0 });
}

pptx.writeFile({ fileName: OUT }).then(() => console.log(OUT));
