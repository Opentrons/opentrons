import json
import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


DATA_PATH = Path("/Users/yew/opentrons/oring_analysis_data.json")
OUT_DIR = Path("/Users/yew/opentrons/oring_data_google_slides")
W, H = 1600, 900

C = {
    "blue": "#2168D3",
    "blue2": "#174EA6",
    "cyan": "#0891B2",
    "green": "#16A34A",
    "yellow": "#FBBF24",
    "orange": "#F59E0B",
    "red": "#DC2626",
    "purple": "#7C3AED",
    "ink": "#2F3437",
    "gray": "#687384",
    "light": "#F6F9FC",
    "line": "#D9E2EF",
    "pale_blue": "#EAF2FF",
    "pale_red": "#FEF2F2",
    "pale_orange": "#FFF7ED",
    "pale_green": "#ECFDF5",
    "white": "#FFFFFF",
}

ORDER = ["0624A04", "1217A05", "0311A04", "0624A01", "0624A05"]
COLOR_BY_SHORT = {
    "0624A04": C["orange"],
    "1217A05": C["purple"],
    "0311A04": C["green"],
    "0624A01": C["cyan"],
    "0624A05": C["red"],
}
RISK_BY_SHORT = {
    "0624A05": "High",
    "0624A04": "High",
    "1217A05": "High",
    "0624A01": "Monitor",
    "0311A04": "Low",
}


def short_id(sample_id):
    for s in ORDER:
        if s in sample_id:
            return s
    return sample_id[-7:]


def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size=size, index=0)
            except TypeError:
                return ImageFont.truetype(path, size=size)
            except Exception:
                pass
    return ImageFont.load_default()


F = {
    "xs": font(14),
    "sm": font(18),
    "body": font(22),
    "body2": font(25),
    "h3": font(28),
    "h2": font(36),
    "h1": font(52),
    "hero": font(64),
}


def text_len(draw, text, f):
    return draw.textlength(str(text), font=f)


def is_cjk(ch):
    return "\u4e00" <= ch <= "\u9fff" or "\u3040" <= ch <= "\u30ff" or "\uac00" <= ch <= "\ud7af"


def wrap_text(draw, text, f, max_w):
    lines = []
    for para in str(text).split("\n"):
        if not para:
            lines.append("")
            continue
        cur = ""
        tokens = []
        buf = ""
        for ch in para:
            if is_cjk(ch):
                if buf:
                    tokens.append(buf)
                    buf = ""
                tokens.append(ch)
            elif ch.isspace():
                if buf:
                    tokens.append(buf)
                    buf = ""
                tokens.append(ch)
            else:
                buf += ch
        if buf:
            tokens.append(buf)
        for token in tokens:
            trial = cur + token
            if cur and text_len(draw, trial, f) > max_w:
                lines.append(cur.rstrip())
                cur = token.lstrip()
            else:
                cur = trial
        if cur:
            lines.append(cur.rstrip())
    return lines


def draw_text(draw, text, xy, f, fill=C["ink"], max_w=None, line_gap=7, anchor=None, align="left"):
    x, y = xy
    if max_w is None:
        draw.text((x, y), str(text), font=f, fill=fill, anchor=anchor)
        return y + f.size
    lines = wrap_text(draw, text, f, max_w)
    for line in lines:
        tx = x
        if align == "center":
            tx = x + (max_w - text_len(draw, line, f)) / 2
        elif align == "right":
            tx = x + max_w - text_len(draw, line, f)
        draw.text((tx, y), line, font=f, fill=fill)
        y += f.size + line_gap
    return y


def panel(draw, xyxy, fill=C["white"], outline=C["line"], radius=12, width=2):
    draw.rounded_rectangle(xyxy, radius=radius, fill=fill, outline=outline, width=width)


def footer(draw, idx):
    draw.text((70, 860), f"P1000H O-ring Data Analysis | 2026-06-04 | {idx}/13", font=F["xs"], fill=C["gray"])


def header(draw, title, subtitle, idx):
    draw.text((70, 34), title, font=F["h2"], fill=C["blue"])
    if subtitle:
        draw_text(draw, subtitle, (70, 82), F["sm"], fill=C["gray"], max_w=1180, line_gap=4)
    draw.text((1415, 38), "Opentrons", font=F["body"], fill=C["blue"], anchor="ra")
    draw.line((70, 125, 1530, 125), fill=C["line"], width=2)
    footer(draw, idx)


def new_slide(idx, title=None, subtitle=None):
    img = Image.new("RGB", (W, H), C["white"])
    draw = ImageDraw.Draw(img)
    if title:
        header(draw, title, subtitle, idx)
    return img, draw


def kcycles(v):
    if not isinstance(v, (int, float)):
        return "-"
    return "0" if v == 0 else f"{round(v / 1000)}k"


def pct_life(v):
    return f"{v * 100:.1f}%" if isinstance(v, (int, float)) else str(v)


def nfmt(v, d=3):
    return f"{v:.{d}f}" if isinstance(v, (int, float)) else str(v)


def draw_table(draw, x, y, col_w, row_h, headers, rows, font_size=18, header_fill=C["blue"], shade=True):
    fh = font(font_size)
    fhead = font(font_size)
    cx = x
    for i, h in enumerate(headers):
        draw.rectangle((cx, y, cx + col_w[i], y + row_h), fill=header_fill)
        draw_text(draw, h, (cx + 8, y + 8), fhead, fill=C["white"], max_w=col_w[i] - 16, line_gap=2)
        cx += col_w[i]
    for r, row in enumerate(rows):
        cy = y + row_h * (r + 1)
        cx = x
        fill = "#FFFFFF" if r % 2 == 0 or not shade else "#F8FBFF"
        for i, value in enumerate(row):
            draw.rectangle((cx, cy, cx + col_w[i], cy + row_h), fill=fill, outline=C["line"], width=1)
            draw_text(draw, value, (cx + 8, cy + 7), fh, fill=C["ink"], max_w=col_w[i] - 16, line_gap=2)
            cx += col_w[i]


def draw_metric(draw, xyxy, label, value, color=C["blue"], note=None):
    panel(draw, xyxy, fill=C["white"])
    x1, y1, x2, y2 = xyxy
    draw.text((x1 + 18, y1 + 14), label, font=F["sm"], fill=C["gray"])
    draw.text((x1 + 18, y1 + 44), value, font=F["h2"], fill=color)
    if note:
        draw_text(draw, note, (x1 + 18, y1 + 92), F["xs"], fill=C["gray"], max_w=x2 - x1 - 36, line_gap=2)


def line_chart(draw, samples, x, y, w, h, metric, y_max, title, ref=None, ref_label=None):
    draw.text((x, y - 38), title, font=F["h3"], fill=C["ink"])
    px, py = x + 60, y + 25
    pw, ph = w - 85, h - 95
    draw.rectangle((px, py, px + pw, py + ph), outline=C["line"], width=1)
    step = 2 if y_max <= 10 else 4
    t = 0
    while t <= y_max:
        yy = py + ph - (t / y_max) * ph
        draw.line((px, yy, px + pw, yy), fill=C["line"], width=1)
        draw.text((x + 18, yy - 9), str(t), font=F["xs"], fill=C["gray"])
        t += step
    for t in [0, 260000, 520000, 820000, 1020000]:
        xx = px + (t / 1020000) * pw
        draw.line((xx, py + ph, xx, py + ph + 8), fill=C["gray"], width=1)
        draw.text((xx - 20, py + ph + 14), kcycles(t), font=F["xs"], fill=C["gray"])
    if ref is not None:
        yy = py + ph - (ref / y_max) * ph
        for i in range(0, int(pw), 16):
            draw.line((px + i, yy, min(px + i + 8, px + pw), yy), fill=C["red"], width=2)
        draw.text((px + pw - 115, yy - 25), ref_label or str(ref), font=F["xs"], fill=C["red"])
    for sample in samples:
        pts = []
        for r in sample["records"]:
            if isinstance(r.get(metric), (int, float)):
                pts.append((px + (r["cycles"] / 1020000) * pw, py + ph - (r[metric] / y_max) * ph, r))
        color = sample["color"]
        for a, b in zip(pts, pts[1:]):
            draw.line((a[0], a[1], b[0], b[1]), fill=color, width=4)
        for p in pts:
            if p[2]["cycles"] in [0, 520000, 1020000] or p[2] == sample["summary"]["max_cv"] or p[2] == sample["summary"]["max_worst"]:
                draw.ellipse((p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5), fill=color, outline=C["white"], width=2)
    lx, ly = x + 65, y + h - 28
    for sample in samples:
        draw.rectangle((lx, ly + 2, lx + 18, ly + 14), fill=sample["color"])
        draw.text((lx + 25, ly), sample["short"], font=F["xs"], fill=C["gray"])
        lx += 155


def bar_chart(draw, values, x, y, w, h, y_max, title, ref=None):
    draw.text((x, y - 36), title, font=F["h3"], fill=C["ink"])
    px, py = x + 58, y + 22
    pw, ph = w - 78, h - 85
    draw.rectangle((px, py, px + pw, py + ph), outline=C["line"], width=1)
    step = 2 if y_max <= 10 else 4
    t = 0
    while t <= y_max:
        yy = py + ph - (t / y_max) * ph
        draw.line((px, yy, px + pw, yy), fill=C["line"], width=1)
        draw.text((x + 18, yy - 9), str(t), font=F["xs"], fill=C["gray"])
        t += step
    if ref is not None:
        yy = py + ph - (ref / y_max) * ph
        draw.line((px, yy, px + pw, yy), fill=C["red"], width=2)
    gap = pw / len(values)
    bw = gap * 0.52
    for i, item in enumerate(values):
        val = item["value"]
        bh = max(2, (val / y_max) * ph)
        bx = px + i * gap + (gap - bw) / 2
        by = py + ph - bh
        draw.rounded_rectangle((bx, by, bx + bw, py + ph), radius=7, fill=item["color"])
        label = f"{val:.3f}" if val < 10 else f"{val:.1f}"
        draw.text((bx + bw / 2, by - 23), label, font=F["xs"], fill=item["color"], anchor="ma")
        draw.text((bx + bw / 2, py + ph + 14), item["label"], font=F["xs"], fill=C["ink"], anchor="ma")


def grouped_plate_chart(draw, samples, x, y, w, h):
    draw.text((x, y - 36), "Latest 1020k plate-level CV", font=F["h3"], fill=C["ink"])
    px, py = x + 60, y + 20
    pw, ph = w - 85, h - 86
    y_max = 8
    draw.rectangle((px, py, px + pw, py + ph), outline=C["line"], width=1)
    for t in range(0, y_max + 1, 2):
        yy = py + ph - (t / y_max) * ph
        draw.line((px, yy, px + pw, yy), fill=C["line"], width=1)
        draw.text((x + 20, yy - 9), str(t), font=F["xs"], fill=C["gray"])
    group_w = pw / len(samples)
    for i, sample in enumerate(samples):
        latest = sample["summary"]["latest"]
        nums = [v for v in latest["plates"] if isinstance(v, (int, float))]
        for j, v in enumerate(nums):
            bw = group_w * 0.18
            bx = px + i * group_w + group_w * 0.14 + j * bw * 1.18
            bh = max(2, (v / y_max) * ph)
            by = py + ph - bh
            draw.rectangle((bx, by, bx + bw, py + ph), fill=sample["color"])
        draw.text((px + i * group_w + group_w / 2, py + ph + 14), sample["short"], font=F["xs"], fill=C["ink"], anchor="ma")
    draw.text((px + pw - 260, py + ph + 42), "Note: latest node has plate1-3 only; plate4/5 = #DIV/0!", font=F["xs"], fill=C["red"])


def sample_by_short(samples, sid):
    return next(s for s in samples if s["short"] == sid)


def save(img, idx):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"slide{idx:02d}.png"
    img.save(path, "PNG")
    return str(path)


def main():
    data = json.loads(DATA_PATH.read_text())
    samples = []
    for s in data["samples"]:
        ss = dict(s)
        ss["short"] = short_id(s["id"])
        ss["color"] = COLOR_BY_SHORT[ss["short"]]
        samples.append(ss)
    samples.sort(key=lambda s: ORDER.index(s["short"]))

    paths = []

    # 1
    img, draw = new_slide(1)
    draw.rectangle((0, 0, 435, H), fill=C["blue"])
    draw.rectangle((435, 0, 448, H), fill=C["orange"])
    draw.text((70, 125), "报告类型", font=F["body"], fill="#DCEBFF")
    draw_text(draw, "数据分析\n趋势 / 异常节点\nplate-level 口径\n逐台证据链", (70, 180), F["h2"], fill=C["white"], max_w=300, line_gap=7)
    draw.text((530, 150), "P1000H O-ring", font=F["hero"], fill=C["ink"])
    draw.text((530, 235), "数据分析报告", font=F["hero"], fill=C["ink"])
    draw_text(draw, "Data-focused analysis of aspiration behavior and optical CV\n1,020,000 cycles / 392.3% life", (535, 345), F["h3"], fill=C["gray"], max_w=830)
    draw.text((535, 700), "SZ ENG | 2026-06-04", font=F["body"], fill=C["gray"])
    footer(draw, 1)
    paths.append(save(img, 1))

    # 2
    img, draw = new_slide(2, "1. 数据范围与分析口径", "分析主线：O-ring 密封状态 -> 吸水稳定性 / LOW %D -> optical CV；本版不展开 Pressure 测试结果。")
    rows = [
        ["样本数量", "5 台 production P1KH 96-channel P1000H"],
        ["测试类型", "1000 uL cycles / O-ring 相关性能观察"],
        ["Cycle 记录", "每台 15 条 cycle row，其中 10 条具有可分析 CV 数值"],
        ["最新节点", "1,020,000 cycles / 392.3% life / Finish x5"],
        ["关键字段", "overall CV、plate1-5 CV、worst-channel CV、LOW %D / fail / note"],
        ["口径限制", "1020k 仅 plate1-3 有效，plate4/5 为 #DIV/0!，不可直接与 5-plate 节点等权比较"],
    ]
    draw_table(draw, 85, 180, [220, 1120], 72, ["项目", "数据口径"], rows, font_size=21)
    draw_metric(draw, (95, 700, 385, 820), "Samples", "5", C["blue"], "5 台均到 1020k")
    draw_metric(draw, (420, 700, 710, 820), "Cycle", "1020k", C["green"], "392.3% life")
    draw_metric(draw, (745, 700, 1035, 820), "Numeric rows", "50", C["orange"], "5 x 10 CV rows")
    draw_metric(draw, (1070, 700, 1420, 820), "Latest plates", "3 valid", C["red"], "plate4/5 = #DIV/0!")
    paths.append(save(img, 2))

    # 3
    img, draw = new_slide(3, "2. 指标定义与判读方式", "先看趋势，再看异常节点，再看 latest plate-level；每台给出独立证据链。")
    defs = [
        ["Overall CV", "跨全部有效 dispenses 的 optical CV；用于观察整体吸水/光学一致性趋势。"],
        ["Plate CV", "plate1-5 独立 CV；用于判断异常是否集中在单 plate 或跨 plate 扩散。"],
        ["Worst-channel CV", "单通道最差 CV；用于识别局部吸水异常、LOW %D 或局部 O-ring 密封失效。"],
        ["LOW %D / fail note", "直接吸水不足或运行异常记录，是判断 O-ring 影响吸水结果的重要证据。"],
        ["Evidence strength", "按 CV 突变、LOW %D/aspiration fail、latest 是否复现、是否跨 plate 四类证据综合评分。"],
    ]
    draw_table(draw, 85, 180, [275, 1040], 78, ["指标", "分析用途"], defs, font_size=20)
    panel(draw, (95, 665, 1505, 820), fill=C["pale_blue"], outline="#BED7FF")
    draw.text((125, 695), "数据分析顺序", font=F["h3"], fill=C["blue"])
    draw_text(draw, "1) Cycle 趋势定位突变节点  ->  2) plate-level 确认集中/扩散  ->  3) 结合 LOW %D / fail note 建立 O-ring 对吸水与 optical CV 的影响链  ->  4) 给出每台风险等级与复测建议", (125, 740), F["body"], fill=C["ink"], max_w=1340, line_gap=5)
    paths.append(save(img, 3))

    # 4
    img, draw = new_slide(4, "3. Overall CV 趋势分析", "0624A05 在最新节点升高至 6.839；0624A01 在 65k-520k 长时间高位；A04/1217A05 在 520k 有明显异常峰。")
    line_chart(draw, samples, 95, 210, 980, 520, "cv", 10, "CV Trend by cycle", ref=5, ref_label="watch line")
    rows = []
    for s in samples:
        m = s["summary"]["max_cv"]
        rows.append([s["short"], kcycles(m["cycles"]), nfmt(m["cv"]), nfmt(s["summary"]["latest"]["cv"]), RISK_BY_SHORT[s["short"]]])
    draw_table(draw, 1100, 205, [108, 96, 86, 88, 84], 55, ["Unit", "Max@cycle", "Max CV", "Latest", "Risk"], rows, font_size=16)
    panel(draw, (1100, 560, 1535, 755), fill=C["pale_orange"], outline="#FED7AA")
    draw_text(draw, "读数重点：\n0624A05 的异常在 latest 复现，说明不是早期 transient；0624A01 曾在 195k-520k 高 CV，但 latest 下降，需要重点确认是否因新口径仅测 3 plate 导致风险被低估。", (1120, 585), F["body"], fill=C["ink"], max_w=395, line_gap=6)
    paths.append(save(img, 4))

    # 5
    img, draw = new_slide(5, "4. Worst-channel CV 趋势分析", "worst-channel 更接近“局部吸水/密封”问题，A01、A04、A05、1217A05 均出现过高峰。")
    line_chart(draw, samples, 95, 210, 930, 520, "worst", 14, "Worst-channel CV Trend", ref=7, ref_label="high local risk")
    rows = []
    for s in samples:
        m = s["summary"]["max_worst"]
        rows.append([s["short"], kcycles(m["cycles"]), nfmt(m["worst"]), m.get("note") or "-"])
    draw_table(draw, 1045, 205, [90, 80, 82, 280], 62, ["Unit", "Peak", "Worst", "Evidence"], rows, font_size=15)
    panel(draw, (1045, 610, 1515, 752), fill=C["pale_red"], outline="#FECACA")
    draw_text(draw, "与 O-ring 相关的强证据来自“局部通道异常 + LOW %D/吸水不足 + CV 同步升高”。单看 overall CV 会低估局部失效。", (1065, 635), F["body"], fill=C["ink"], max_w=430, line_gap=6)
    paths.append(save(img, 5))

    # 6
    img, draw = new_slide(6, "5. 最新 1020k plate-level 分析", "最新节点仅 plate1-3 有效：0624A05 与 A04 的 plate1-3 均显著高于其余样本。")
    grouped_plate_chart(draw, samples, 95, 205, 850, 500)
    rows = []
    for s in samples:
        latest = s["summary"]["latest"]
        pvals = [nfmt(v) if isinstance(v, (int, float)) else str(v) for v in latest["plates"]]
        rows.append([s["short"], nfmt(latest["cv"]), pvals[0], pvals[1], pvals[2], str(latest["numeric_plate_count"]), "P4/P5 #DIV/0!"])
    draw_table(draw, 990, 190, [90, 70, 70, 70, 70, 45, 130], 57, ["Unit", "CV", "P1", "P2", "P3", "N", "Remark"], rows, font_size=14)
    paths.append(save(img, 6))

    # 7
    img, draw = new_slide(7, "6. 异常节点时间线", "将 CV 高峰、worst-channel 高峰、LOW %D 与 fail note 放在同一时间轴，判断是否形成因果链。")
    events = [
        ["100k", "0624A04", "F1 LOW %D in plate5；worst=7.850"],
        ["195k", "0624A01", "H1 LOW %D plate2；G12 LOW %D plate3；worst=13.397"],
        ["260k", "0624A04", "A5 LOW %D plate4；CV=4.214"],
        ["455k", "1217A05", "C5/C7 吸水少，记录 FAIL"],
        ["520k", "0624A04", "漏油 / 背板内油 / sensor error；CV=5.642"],
        ["520k", "1217A05", "CV=6.195，worst=7.419 峰值"],
        ["520k", "0624A01", "overall CV 峰值 8.406"],
        ["1020k", "0624A05", "latest CV=6.839；plate1-3 均高"],
        ["1020k", "0624A04", "latest CV=4.379；plate1-3 均约 4.3-4.4"],
    ]
    draw_table(draw, 90, 175, [135, 150, 1050], 58, ["Cycle", "Unit", "异常证据"], events, font_size=19)
    panel(draw, (100, 735, 1500, 820), fill=C["pale_blue"], outline="#BED7FF")
    draw_text(draw, "分析含义：O-ring 风险不是只看最终是否 Finish，而是看吸水异常、局部 worst-channel、overall/plate CV 是否在相同节点互相支撑。", (125, 760), F["body"], fill=C["ink"], max_w=1310)
    paths.append(save(img, 7))

    # 8
    img, draw = new_slide(8, "7. 逐台数据矩阵", "每台移液器单独列出 latest、峰值、异常证据与风险等级，便于后续复测和拆解验证。")
    rows = []
    for s in samples:
        latest = s["summary"]["latest"]
        max_cv = s["summary"]["max_cv"]
        max_w = s["summary"]["max_worst"]
        notes = "; ".join([n["note"] for n in s.get("notes", []) if n.get("note")][:2]) or "-"
        rows.append([
            s["short"],
            nfmt(latest["cv"]),
            f"{kcycles(max_cv['cycles'])} / {nfmt(max_cv['cv'])}",
            f"{kcycles(max_w['cycles'])} / {nfmt(max_w['worst'])}",
            notes,
            RISK_BY_SHORT[s["short"]],
        ])
    draw_table(draw, 70, 175, [118, 110, 195, 210, 650, 110], 82, ["Unit", "Latest CV", "Max CV", "Max worst", "Evidence note", "Risk"], rows, font_size=18)
    paths.append(save(img, 8))

    # 9
    img, draw = new_slide(9, "8. Case Analysis - 0624A05", "关键点：早中期整体稳定，但 latest 1020k 直接跃升至 6.839，且 plate1-3 全部高 CV。")
    s = sample_by_short(samples, "0624A05")
    line_chart(draw, [s], 95, 225, 700, 430, "cv", 8, "0624A05 overall CV", ref=5)
    vals = [{"label": f"P{i+1}", "value": v, "color": s["color"]} for i, v in enumerate(s["summary"]["latest"]["plates"]) if isinstance(v, (int, float))]
    bar_chart(draw, vals, 850, 225, 590, 430, 8, "Latest plate CV", ref=5)
    panel(draw, (95, 690, 1500, 805), fill=C["pale_red"], outline="#FECACA")
    draw_text(draw, "数据判断：0624A05 的异常是 latest 复现型，并且不是单 plate 孤立点，plate1/2/3 均在 6.7-6.9；这更符合吸水一致性或密封状态整体劣化对 optical CV 的影响。建议优先拆检 O-ring 状态并复测 5 plate。", (125, 718), F["body"], fill=C["ink"], max_w=1325, line_gap=6)
    paths.append(save(img, 9))

    # 10
    img, draw = new_slide(10, "9. Case Analysis - 0624A04 / 1217A05", "A04 有 LOW %D + 漏油/sensor error 记录；1217A05 有明确 C5/C7 吸水少 FAIL。")
    a04 = sample_by_short(samples, "0624A04")
    a05 = sample_by_short(samples, "1217A05")
    line_chart(draw, [a04], 95, 225, 610, 390, "cv", 7, "0624A04 CV")
    line_chart(draw, [a05], 790, 225, 610, 390, "cv", 7, "1217A05 CV")
    panel(draw, (95, 650, 720, 815), fill=C["pale_orange"], outline="#FED7AA")
    draw_text(draw, "0624A04：100k/260k 出现 LOW %D；520k 记录漏油、背板内都是油并造成 sensor error；latest CV=4.379 且 only 3 plates。证据链较强。", (120, 675), F["body"], fill=C["ink"], max_w=575, line_gap=5)
    panel(draw, (790, 650, 1415, 815), fill="#F5F3FF", outline="#DDD6FE")
    draw_text(draw, "1217A05：455k C5/C7 吸水少 FAIL；520k CV=6.195 与 worst=7.419 同步高峰。latest 降至 1.487，但仍需确认问题是否被维修/状态变化掩盖。", (815, 675), F["body"], fill=C["ink"], max_w=575, line_gap=5)
    paths.append(save(img, 10))

    # 11
    img, draw = new_slide(11, "10. Case Analysis - 0624A01 / 0311A04", "A01 曾长时间高 CV 并伴随 LOW %D；0311A04 整体最稳定，可作为相对基线。")
    a01 = sample_by_short(samples, "0624A01")
    g04 = sample_by_short(samples, "0311A04")
    line_chart(draw, [a01, g04], 95, 225, 900, 430, "cv", 10, "A01 vs 0311A04 CV comparison", ref=5)
    rows = [
        ["0624A01", "65k-520k", "CV 4.757 -> 8.406，195k 有 H1/G12 LOW %D", "Monitor"],
        ["0311A04", "0-1020k", "CV 0.552-1.957，未见非 Pressure fail/note", "Low"],
    ]
    draw_table(draw, 1030, 225, [125, 125, 330, 100], 88, ["Unit", "Range", "Data behavior", "Risk"], rows, font_size=17)
    panel(draw, (1030, 530, 1510, 700), fill=C["pale_green"], outline="#BBF7D0")
    draw_text(draw, "对照意义：0311A04 提供同一测试口径下的低波动参考；A01 的中期波动明显偏离该参考，但 latest 降低，需要通过完整 5-plate 复测确认是否恢复。", (1055, 558), F["body"], fill=C["ink"], max_w=430, line_gap=6)
    paths.append(save(img, 11))

    # 12
    img, draw = new_slide(12, "11. O-ring 证据强度矩阵", "把吸水异常、CV 突变、worst-channel、latest 复现四类证据转化为数据化评分。")
    scores = {
        "0624A05": [0, 3, 1, 3],
        "0624A04": [3, 2, 3, 2],
        "1217A05": [3, 2, 2, 1],
        "0624A01": [2, 3, 3, 1],
        "0311A04": [0, 0, 1, 0],
    }
    rows = []
    values = []
    for sid in ORDER:
        total = sum(scores[sid])
        rows.append([sid, *map(str, scores[sid]), str(total), RISK_BY_SHORT[sid]])
        values.append({"label": sid, "value": total, "color": COLOR_BY_SHORT[sid]})
    draw_table(draw, 90, 180, [120, 140, 130, 150, 150, 95, 110], 65, ["Unit", "吸水异常", "CV突变", "Worst高峰", "Latest复现", "Total", "Risk"], rows, font_size=18)
    bar_chart(draw, values, 220, 620, 1050, 210, 12, "Evidence score", ref=6)
    panel(draw, (1285, 605, 1510, 810), fill=C["light"], outline=C["line"])
    draw_text(draw, "评分说明：0=无证据，1=弱证据，2=中等证据，3=强证据。该评分用于排序复测优先级，不替代拆解验证。", (1305, 630), F["sm"], fill=C["ink"], max_w=185, line_gap=5)
    paths.append(save(img, 12))

    # 13
    img, draw = new_slide(13, "12. 数据补充与最终判定建议", "最终判定应建立在完整 5-plate 复测、O-ring 拆检记录、同条件复测一致性之上。")
    left = [
        ["Priority", "Unit", "需要补充的数据"],
        ["P0", "0624A05", "1020k 完整 5 plate 复测；拆检 O-ring 压缩/磨损/润滑；复测前后 CV 对比"],
        ["P0", "0624A04", "漏油位置确认；清洁/更换 O-ring 后复测；验证 LOW %D 是否消失"],
        ["P1", "1217A05", "C5/C7 通道吸水复测；确认 455k FAIL 是否复现"],
        ["P1", "0624A01", "完整 5-plate 复测；确认中期高 CV 是否已恢复"],
        ["P2", "0311A04", "作为相对基线保留，复测频率可低于高风险样本"],
    ]
    draw_table(draw, 85, 180, [120, 130, 1050], 65, left[0], left[1:], font_size=18)
    panel(draw, (95, 650, 735, 820), fill=C["pale_blue"], outline="#BED7FF")
    draw_text(draw, "数据化判定规则：若更换/复位 O-ring 后 LOW %D 消失且 CV 回落，并且同通道/同 plate 不再复现，则可把 O-ring 作为主要影响因素。", (125, 680), F["body"], fill=C["ink"], max_w=585, line_gap=6)
    panel(draw, (790, 650, 1500, 820), fill=C["pale_red"], outline="#FECACA")
    draw_text(draw, "当前数据下的排序：0624A05 与 0624A04 需要优先处理；1217A05/A01 需要复测确认；0311A04 暂作稳定对照。结论来自数据链，而非单一 Finish 状态。", (820, 680), F["body"], fill=C["ink"], max_w=645, line_gap=6)
    paths.append(save(img, 13))

    manifest = OUT_DIR / "manifest.txt"
    manifest.write_text("\n".join(paths) + "\n")
    print("\n".join(paths))


if __name__ == "__main__":
    main()
