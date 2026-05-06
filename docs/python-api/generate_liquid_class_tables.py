#!/usr/bin/env python3
"""Generate liquid class definition tables from shared-data JSON.

Reads the latest JSON definition for each liquid class (water, ethanol_80,
glycerol_50) from shared-data and writes Aspirate, Dispense, and Multi-Dispense
tables in the mixed markdown/HTML format used by the mkdocs documentation.

Usage:
    python generate_liquid_class_tables.py
"""

import json
import re
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
DEFINITIONS_BASE = (
    REPO_ROOT
    / "shared-data"
    / "liquid-class"
    / "definitions"
    / "1"
)
OUTPUT_DIR = SCRIPT_DIR / "docs" / "liquid-class-tables"

# Source directory name (under definitions/1/) -> output filename (under OUTPUT_DIR).
LIQUID_CLASSES = [
    ("water", "aqueous.md"),
    ("ethanol_80", "volatile.md"),
    ("glycerol_50", "viscous.md"),
]

# ---------------------------------------------------------------------------
# Display constants
# ---------------------------------------------------------------------------
# Pipettes in the order they should appear as tabs.
PIPETTE_ORDER = [
    "flex_1channel_50",
    "flex_8channel_50",
    "flex_1channel_1000",
    "flex_8channel_1000",
    "flex_96channel_200",
    "flex_96channel_1000",
]

PIPETTE_DISPLAY_NAME = {
    "flex_1channel_50": "1-ch. 50 µL",
    "flex_8channel_50": "8-ch. 50 µL",
    "flex_1channel_1000": "1-ch. 1000 µL",
    "flex_8channel_1000": "8-ch. 1000 µL",
    "flex_96channel_200": "96-ch. 200 µL",
    "flex_96channel_1000": "96-ch. 1000 µL",
}

# Indentation (4 spaces per level, matching existing docs style).
I1 = "    "  # tab content level
I2 = I1 * 2  # <thead> / <tbody>
I3 = I1 * 3  # <tr>
I4 = I1 * 4  # <th> / <td>
I5 = I1 * 5  # <ul>
I6 = I1 * 6  # <li>


# ---------------------------------------------------------------------------
# JSON helpers
# ---------------------------------------------------------------------------
def get_latest_definition(definitions_dir: Path) -> dict:
    """Load the highest-numbered JSON file from the given definitions directory."""
    json_files = sorted(definitions_dir.glob("*.json"), key=lambda p: int(p.stem))
    if not json_files:
        raise FileNotFoundError(f"No JSON files found in {definitions_dir}")
    with open(json_files[-1]) as f:
        return json.load(f)


def tip_capacity(tiprack: str) -> int:
    """Extract numeric µL capacity from a tiprack URI.

    Example: 'opentrons/opentrons_flex_96_tiprack_50ul/1' → 50
    """
    m = re.search(r"_(\d+)ul/", tiprack)
    return int(m.group(1)) if m else 0


def is_filter(tiprack: str) -> bool:
    return "filter" in tiprack


# ---------------------------------------------------------------------------
# Number / value formatters
# ---------------------------------------------------------------------------
def n(val) -> str:
    """Format a number: remove trailing zeros, avoid scientific notation."""
    result = f"{val:g}"
    if "e" in result or "E" in result:
        # Fall back to fixed-point for very small values
        result = f"{val:.10f}".rstrip("0").rstrip(".")
    return result


def speed_cell(val) -> str:
    return f"{n(val)} mm/sec"


def delay_cell(delay_obj: dict) -> str:
    if delay_obj["enable"]:
        return f"{n(delay_obj['params']['duration'])} sec"
    return "\u2014"


def blowout_cell(blowout_obj: dict) -> str:
    """Format blowout: em dash if disabled, else 'Into trash/destination at X µL/sec'."""
    if not blowout_obj["enable"]:
        return "\u2014"
    loc = blowout_obj["params"]["location"]
    rate = blowout_obj["params"]["flowRate"]
    return f"Into {loc} at {n(rate)} \u00b5L/sec"


def flow_rate_cell(entries: list):
    """Format flow-rate-by-volume entries.

    Consecutive entries with the same rate are merged into ranges (e.g.
    "1–9.9 µL: 22 µL/sec").  Returns a *str* for a single resulting group
    or a *list[str]* for multiple groups (the list signals <ul>/<li>).
    """
    if len(entries) == 1:
        return f"{n(entries[0][1])} \u00b5L/sec"
    ranges = _merge_ranges(entries)
    if len(ranges) == 1:
        start, end, rate = ranges[0]
        if start == end:
            return f"{n(rate)} \u00b5L/sec"
        return f"{n(start)}\u2013{n(end)} \u00b5L: {n(rate)} \u00b5L/sec"
    items = []
    for start, end, rate in ranges:
        if start == end:
            items.append(f"{n(start)} \u00b5L: {n(rate)} \u00b5L/sec")
        else:
            items.append(
                f"{n(start)}\u2013{n(end)} \u00b5L: {n(rate)} \u00b5L/sec"
            )
    return items


def _merge_ranges(entries: list) -> list:
    """Merge consecutive entries with the same value into (start, end, val)."""
    if not entries:
        return []
    ranges = []
    s, v = entries[0]
    e = s
    for vol, val in entries[1:]:
        if val == v:
            e = vol
        else:
            ranges.append((s, e, v))
            s, e, v = vol, vol, val
    ranges.append((s, e, v))
    return ranges


def by_volume_cell(entries: list, unit: str = "\u00b5L"):
    """Format a by-volume field (air gap, push out, conditioning, disposal).

    Consecutive same-value entries are merged into ranges.  Returns *str* for
    a single resulting group or *list[str]* for multiple groups.
    """
    ranges = _merge_ranges(entries)
    if len(ranges) == 1:
        return f"{n(ranges[0][2])} {unit}"
    items = []
    for start, end, val in ranges:
        if start == end:
            items.append(f"{n(start)} \u00b5L: {n(val)} {unit}")
        else:
            items.append(
                f"{n(start)}\u2013{n(end)} \u00b5L: {n(val)} {unit}"
            )
    return items


def correction_cell(entries: list):
    """Format correction-by-volume: em dash when all zeros."""
    if all(val == 0.0 for _, val in entries):
        return "\u2014"
    return by_volume_cell(entries, "\u00b5L")


# ---------------------------------------------------------------------------
# Row builders — one per transfer section
# ---------------------------------------------------------------------------
def aspirate_rows(tips: list) -> list:
    asps = [t["aspirate"] for t in tips]
    rows = []

    rows.append((
        "Submerge speed",
        [speed_cell(a["submerge"]["speed"]) for a in asps],
    ))

    fr = [a["flowRateByVolume"] for a in asps]
    label = (
        "Aspirate flow rate by volume"
        if any(len(f) > 1 for f in fr)
        else "Aspirate flow rate"
    )
    rows.append((label, [flow_rate_cell(f) for f in fr]))

    rows.append((
        "Correction by volume",
        [correction_cell(a["correctionByVolume"]) for a in asps],
    ))
    rows.append((
        "Delay after aspirating",
        [delay_cell(a["delay"]) for a in asps],
    ))
    rows.append((
        "Retract speed",
        [speed_cell(a["retract"]["speed"]) for a in asps],
    ))
    rows.append((
        "Delay after retracting",
        [delay_cell(a["retract"]["delay"]) for a in asps],
    ))
    rows.append((
        "Air gap by volume",
        [by_volume_cell(a["retract"]["airGapByVolume"]) for a in asps],
    ))
    return rows


def dispense_rows(tips: list) -> list:
    disps = [t["singleDispense"] for t in tips]
    rows = []

    rows.append((
        "Submerge speed",
        [speed_cell(d["submerge"]["speed"]) for d in disps],
    ))

    fr = [d["flowRateByVolume"] for d in disps]
    label = (
        "Dispense flow rate by volume"
        if any(len(f) > 1 for f in fr)
        else "Dispense flow rate"
    )
    rows.append((label, [flow_rate_cell(f) for f in fr]))

    rows.append((
        "Correction by volume",
        [correction_cell(d["correctionByVolume"]) for d in disps],
    ))
    rows.append((
        "Delay after dispensing",
        [delay_cell(d["delay"]) for d in disps],
    ))
    rows.append((
        "Retract speed",
        [speed_cell(d["retract"]["speed"]) for d in disps],
    ))
    rows.append((
        "Delay after retracting",
        [delay_cell(d["retract"]["delay"]) for d in disps],
    ))
    rows.append((
        "Blowout",
        [blowout_cell(d["retract"]["blowout"]) for d in disps],
    ))
    rows.append((
        "Push out by volume",
        [by_volume_cell(d["pushOutByVolume"]) for d in disps],
    ))
    rows.append((
        "Air gap by volume",
        [by_volume_cell(d["retract"]["airGapByVolume"]) for d in disps],
    ))
    return rows


def multi_dispense_rows(tips: list) -> list:
    mds = [t["multiDispense"] for t in tips]
    rows = []

    rows.append((
        "Submerge speed",
        [speed_cell(m["submerge"]["speed"]) for m in mds],
    ))

    fr = [m["flowRateByVolume"] for m in mds]
    label = (
        "Dispense flow rate by volume"
        if any(len(f) > 1 for f in fr)
        else "Dispense flow rate"
    )
    rows.append((label, [flow_rate_cell(f) for f in fr]))

    rows.append((
        "Correction by volume",
        [correction_cell(m["correctionByVolume"]) for m in mds],
    ))
    rows.append((
        "Conditioning by volume",
        [by_volume_cell(m["conditioningByVolume"]) for m in mds],
    ))
    rows.append((
        "Disposal by volume",
        [by_volume_cell(m["disposalByVolume"]) for m in mds],
    ))
    rows.append((
        "Delay after dispensing",
        [delay_cell(m["delay"]) for m in mds],
    ))
    rows.append((
        "Retract speed",
        [speed_cell(m["retract"]["speed"]) for m in mds],
    ))
    rows.append((
        "Delay after retracting",
        [delay_cell(m["retract"]["delay"]) for m in mds],
    ))
    rows.append((
        "Blowout",
        [blowout_cell(m["retract"]["blowout"]) for m in mds],
    ))
    rows.append((
        "Air gap by volume",
        [by_volume_cell(m["retract"]["airGapByVolume"]) for m in mds],
    ))
    return rows


# ---------------------------------------------------------------------------
# HTML rendering
# ---------------------------------------------------------------------------
def render_cell(value) -> str:
    """Render a <td> cell — simple string or <ul> list."""
    if isinstance(value, list):
        li_lines = "\n".join(f"{I6}<li>{item}</li>" for item in value)
        return f"{I4}<td>\n{I5}<ul>\n{li_lines}\n{I5}</ul>\n{I4}</td>"
    return f"{I4}<td>{value}</td>"


def render_table(tab_name: str, capacities: list, rows: list) -> str:
    """Render one pipette tab with its HTML table."""
    lines = [f'=== "{tab_name}"', ""]
    lines.append(f"{I1}<table>")

    # Header
    lines.append(f"{I2}<thead>")
    lines.append(f"{I3}<tr>")
    lines.append(f"{I4}<th>Behavior</th>")
    for cap in capacities:
        lines.append(f"{I4}<th>{cap} \u00b5L</th>")
    lines.append(f"{I3}</tr>")
    lines.append(f"{I2}</thead>")

    # Body
    lines.append(f"{I2}<tbody>")
    for label, cells in rows:
        lines.append(f"{I3}<tr>")
        lines.append(f"{I4}<td>{label}</td>")
        for cell in cells:
            lines.append(render_cell(cell))
        lines.append(f"{I3}</tr>")
    lines.append(f"{I2}</tbody>")

    lines.append(f"{I1}</table>")
    return "\n".join(lines)


def render_section(
    section_title: str,
    section_key: str,
    pipettes_data: list,
    row_func,
) -> str:
    """Render a full ### section with tabs for every pipette."""
    parts = [f"### {section_title}", ""]

    for _model, tab_name, capacities, tips in pipettes_data:
        # For multi-dispense, skip tips whose multiDispense is null/missing.
        if section_key == "multiDispense":
            valid = [
                (cap, t)
                for cap, t in zip(capacities, tips)
                if t.get("multiDispense") is not None
            ]
            if not valid:
                continue
            caps = [v[0] for v in valid]
            filtered_tips = [v[1] for v in valid]
        else:
            caps = capacities
            filtered_tips = tips

        table = render_table(tab_name, caps, row_func(filtered_tips))
        parts.append(table)
        parts.append("")

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def generate_tables(data: dict) -> str:
    """Build Aspirate, Dispense, and Multi-dispense table sections from definition data."""
    by_model = {p["pipetteModel"]: p for p in data["byPipette"]}

    pipettes_data = []
    for model in PIPETTE_ORDER:
        if model not in by_model:
            continue
        p = by_model[model]
        tab_name = PIPETTE_DISPLAY_NAME.get(model, model)

        non_filter = sorted(
            [
                (tip_capacity(t["tiprack"]), t)
                for t in p["byTipType"]
                if not is_filter(t["tiprack"])
            ],
            key=lambda x: x[0],
        )
        if not non_filter:
            continue
        caps = [cap for cap, _ in non_filter]
        tips = [t for _, t in non_filter]
        pipettes_data.append((model, tab_name, caps, tips))

    version = data["version"]
    version_statement = (
        f"Values below are taken from version {version}"
        f" of the liquid class definition.\n"
    )

    sections = [
        version_statement,
        render_section("Aspirate", "aspirate", pipettes_data, aspirate_rows),
        render_section("Dispense", "singleDispense", pipettes_data, dispense_rows),
        render_section(
            "Multi-dispense", "multiDispense", pipettes_data, multi_dispense_rows
        ),
    ]
    return "\n".join(sections)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for source_name, output_name in LIQUID_CLASSES:
        definitions_dir = DEFINITIONS_BASE / source_name
        data = get_latest_definition(definitions_dir)
        content = generate_tables(data)
        output_path = (OUTPUT_DIR / output_name).resolve()

        # Only write when content has changed, so that mkdocs serve
        # doesn't detect a file-system change and enter a rebuild loop.
        if not output_path.exists() or output_path.read_text(encoding="utf-8") != content:
            output_path.write_text(content, encoding="utf-8")


# ---------------------------------------------------------------------------
# MkDocs hook — called automatically during `mkdocs build` / `mkdocs serve`
# when this file is listed under the `hooks` key in mkdocs.yml.
# ---------------------------------------------------------------------------
def on_pre_build(**kwargs):
    main()


if __name__ == "__main__":
    main()
