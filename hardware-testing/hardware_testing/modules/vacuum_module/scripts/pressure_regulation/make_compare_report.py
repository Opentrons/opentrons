#!/usr/bin/env python3
"""Build multi-run comparison HTML from saved sweep result files."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from hardware_testing.modules.vacuum_module.scripts.pressure_regulation import (
        hold_results as _hold_results,
    )
except ImportError:
    import hold_results as _hold_results  # type: ignore[no-redef,import-not-found]

load_runs_dir = _hold_results.load_runs_dir


def run_label(run: dict) -> str:
    """Display name: prefer run_name, else folder; always fall back to _dir."""
    return str(run.get("run_name") or run.get("_dir") or "")


def load_runs(runs_dir: Path) -> list[dict]:
    """Load results under runs_dir, sorted alphabetically by run name."""
    return load_runs_dir(runs_dir)


def main(args) -> int:
    runs_dir = args.runs_dir
    out = args.output
    runs = load_runs(runs_dir)
    if not runs:
        out.write_text("<html><body><h1>No runs yet</h1></body></html>")
        print("no runs")
        return 0

    # Summary table rows
    targets = sorted({t for r in runs for t in r.get("targets", [])})
    header = "<tr><th>Target</th>" + "".join(
        f"<th>{run_label(r)}<br/><small>mean|err| / p2p / stdev</small></th>"
        for r in runs
    ) + "</tr>"

    body_rows = []
    for tgt in targets:
        cells = [f"<td>{tgt}</td>"]
        best_abs = None
        vals = []
        for r in runs:
            run = next((x for x in r.get("runs", []) if x.get("target_mbar") == tgt), None)
            st = (run or {}).get("stats") or {}
            if st.get("n"):
                s = f"{st['mean_abs_err']:.2f} / {st.get('p2p', float('nan')):.2f} / {st['stdev_err']:.2f}"
                vals.append(st["mean_abs_err"])
            else:
                s = "—"
                vals.append(None)
            cells.append(f"<td data-v='{vals[-1]}'>{s}</td>")
        # highlight best mean_abs
        finite = [v for v in vals if v is not None]
        best = min(finite) if finite else None
        row = "<tr>"
        for i, c in enumerate(cells):
            if i > 0 and vals[i - 1] is not None and best is not None and abs(vals[i - 1] - best) < 1e-9:
                c = c.replace("<td", "<td style='background:#1a3d2e;color:#3ecf8e'", 1)
            row += c
        row += "</tr>"
        body_rows.append(row)

    # Series payload for charts: one chart per target, lines = runs (alpha by name)
    chart_payload = []
    for tgt in targets:
        series = []
        for r in runs:
            run = next((x for x in r.get("runs", []) if x.get("target_mbar") == tgt), None)
            if not run:
                continue
            samples = run.get("samples", [])
            series.append({
                "name": run_label(r),
                "t": [s["t_s"] for s in samples],
                "current": [s["current_mbar"] for s in samples],
                "error": [s["error_mbar"] for s in samples],
            })
        series.sort(key=lambda s: s["name"].casefold())
        chart_payload.append({"target": tgt, "series": series})

    meta_rows = "".join(
        f"<tr><td>{run_label(r)}</td>"
        f"<td>{r.get('status')}</td><td>{r.get('timestamp')}</td>"
        f"<td>{r.get('firmware','')[:80]}</td></tr>"
        for r in runs
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pressure hold comparison</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    :root {{ color-scheme: dark; --bg:#0f1419; --panel:#1a2332; --text:#e7ecf3; --muted:#9aa7b8; --border:#2a3545; --accent:#5b9fd4; }}
    body {{ margin:0; font-family: system-ui, sans-serif; background:var(--bg); color:var(--text); }}
    header {{ padding:1.2rem 1.5rem; border-bottom:1px solid var(--border); }}
    main {{ padding:1rem 1.5rem 2rem; max-width:1400px; margin:0 auto; }}
    .panel {{ background:var(--panel); border:1px solid var(--border); border-radius:12px; padding:1rem; margin:1rem 0; }}
    table {{ width:100%; border-collapse:collapse; font-size:0.88rem; }}
    th, td {{ padding:0.4rem 0.5rem; border-bottom:1px solid var(--border); text-align:left; }}
    th {{ color:var(--muted); }}
    .chart-wrap {{ height:280px; position:relative; margin-bottom:0.5rem; }}
    h1 {{ margin:0 0 0.4rem; font-size:1.3rem; }}
    h2 {{ margin:0 0 0.7rem; font-size:1.05rem; }}
    .muted {{ color:var(--muted); font-size:0.9rem; }}
  </style>
</head>
<body>
  <header>
    <h1>Pressure hold controller comparison</h1>
    <div class="muted">Runs and chart series are sorted alphabetically by run name (use a sequence prefix like <code>23_…</code>). Green cells = best mean |error| for that target.</div>
  </header>
  <main>
    <div class="panel">
      <h2>Runs</h2>
      <table>
        <thead><tr><th>Name</th><th>Status</th><th>Timestamp</th><th>Firmware</th></tr></thead>
        <tbody>{meta_rows}</tbody>
      </table>
    </div>
    <div class="panel">
      <h2>Steady-state metrics (last ~30s)</h2>
      <table>
        <thead>{header}</thead>
        <tbody>{''.join(body_rows)}</tbody>
      </table>
    </div>
    <div id="charts"></div>
  </main>
  <script>
    const charts = {json.dumps(chart_payload)};
    const colors = ['#5b9fd4','#3ecf8e','#f0b429','#e36bae','#a78bfa','#f97316'];
    const root = document.getElementById('charts');
    charts.forEach((block, bi) => {{
      const panel = document.createElement('div');
      panel.className = 'panel';
      panel.innerHTML = `<h2>Target ${{block.target}} mbar — pressure</h2>
        <div class="chart-wrap"><canvas id="p${{bi}}"></canvas></div>
        <h2>Target ${{block.target}} mbar — error</h2>
        <div class="chart-wrap"><canvas id="e${{bi}}"></canvas></div>`;
      root.appendChild(panel);
      const pSets = block.series.map((s, i) => ({{
        label: s.name,
        data: s.t.map((x, j) => ({{x, y: s.current[j]}})),
        borderColor: colors[i % colors.length],
        borderWidth: 1.5, pointRadius: 0, tension: 0.12,
      }}));
      pSets.push({{
        label: 'target',
        data: (block.series[0] ? block.series[0].t : []).map(x => ({{x, y: block.target}})),
        borderColor: '#9aa7b8', borderDash: [6,4], borderWidth: 1, pointRadius: 0,
      }});
      const eSets = block.series.map((s, i) => ({{
        label: s.name + ' err',
        data: s.t.map((x, j) => ({{x, y: s.error[j]}})),
        borderColor: colors[i % colors.length],
        borderWidth: 1.4, pointRadius: 0, tension: 0.12,
      }}));
      const common = {{
        responsive: true, maintainAspectRatio: false,
        scales: {{
          x: {{ type: 'linear', title: {{ display: true, text: 't (s)', color: '#9aa7b8' }}, ticks: {{ color: '#9aa7b8' }}, grid: {{ color: '#2a3545' }} }},
          y: {{ ticks: {{ color: '#9aa7b8' }}, grid: {{ color: '#2a3545' }} }},
        }},
        plugins: {{ legend: {{ labels: {{ color: '#e7ecf3', boxWidth: 12 }} }} }},
      }};
      new Chart(document.getElementById('p'+bi), {{ type: 'line', data: {{ datasets: pSets }}, options: common }});
      new Chart(document.getElementById('e'+bi), {{
        type: 'line', data: {{ datasets: eSets }},
        options: {{ ...common, scales: {{ ...common.scales, y: {{ ...common.scales.y, min: -25, max: 25 }} }} }},
      }});
    }});
  </script>
</body>
</html>
"""
    out.write_text(html)
    print(f"Wrote {out.resolve()} with {len(runs)} runs")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Build multi-run comparison HTML from saved sweep result files"
    )
    parser.add_argument(
        "--runs-dir",
        type=Path,
        default=Path("runs"),
        help="Directory of run folders with results.json or results.csv (default: runs)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("compare.html"),
        help="Output HTML path (default: compare.html)",
    )
    args = parser.parse_args()
    raise SystemExit(main(args))
