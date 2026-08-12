#!/usr/bin/env python3
"""Build an HTML and/or PDF report from vacuum pressure hold results."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from hardware_testing.modules.vacuum_module.scripts.pressure_regulation import (
        hold_results as _hold_results,
    )
    from hardware_testing.modules.vacuum_module.scripts.pressure_regulation import (
        report_format as _report_format,
    )
except ImportError:
    import hold_results as _hold_results  # type: ignore[no-redef,import-not-found]
    import report_format as _report_format  # type: ignore[no-redef,import-not-found]

load_results = _hold_results.load_results


_WAITING_HTML = (
    "<!DOCTYPE html><html><body style='background:#0f1419;color:#e7ecf3;"
    "font-family:system-ui;padding:2rem'><h1>Waiting for data…</h1>"
    "<meta http-equiv='refresh' content='3'></body></html>"
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build an HTML and/or PDF report from vacuum pressure hold results"
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("results.json"),
        help="Input results path (.json, .csv, or a run directory; default: results.json)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("index.html"),
        help="Output path (default: index.html). Suffix .pdf selects PDF if --format omitted.",
    )
    parser.add_argument(
        "--format",
        dest="fmt",
        choices=list(_report_format.FORMAT_CHOICES),
        default=None,
        help="Report format: html, pdf, or both (default: from --output suffix, else html)",
    )
    args = parser.parse_args()

    src = args.input
    fmt = _report_format.infer_format(args.output, args.fmt)
    paths = _report_format.output_paths(args.output, fmt)
    if not src.exists():
        written = []
        if "html" in paths:
            paths["html"].write_text(_WAITING_HTML)
            written.append(paths["html"])
        if "pdf" in paths:
            _report_format.write_waiting_pdf(paths["pdf"])
            written.append(paths["pdf"])
        print(f"No data yet; wrote placeholder {', '.join(str(p) for p in written)}")
        return 0

    data = load_results(src)
    series_js = []
    stats_rows = []
    for run in data.get("runs", []):
        samples = run.get("samples", [])
        t = [s["t_s"] for s in samples]
        c = [s["current_mbar"] for s in samples]
        e = [s["error_mbar"] for s in samples]
        target = run["target_mbar"]
        series_js.append(
            {
                "target": target,
                "t": t,
                "current": c,
                "error": e,
                "stats": run.get("stats", {}),
                "status": run.get("status", ""),
            }
        )
        st = run.get("stats", {})
        status = run.get("status", "")
        if st.get("n", 0):
            stats_rows.append(
                f"<tr><td>{target}</td><td>{status}</td>"
                f"<td>{st['mean_abs_err']:.2f}</td>"
                f"<td>{st['mean_err']:.2f}</td><td>{st['stdev_err']:.2f}</td>"
                f"<td>{st['p95_abs_err']:.2f}</td><td>{st['max_abs_err']:.2f}</td>"
                f"<td>{st['n']}</td></tr>"
            )
        else:
            stats_rows.append(
                f"<tr><td>{target}</td><td>{status}</td>"
                f"<td colspan='6'>{st.get('note', 'no steady data')}</td></tr>"
            )

    payload = json.dumps(series_js)
    status = data.get("status", "unknown")
    current = data.get("current_target_mbar")
    meta = {
        "firmware": data.get("firmware", ""),
        "timestamp": data.get("timestamp", ""),
        "waste": data.get("waste_detection", ""),
        "duration_s": data.get("duration_s"),
        "sample_period_s": data.get("sample_period_s"),
        "status": status,
        "current_target": current,
        "n_targets": len(data.get("targets", [])),
        "n_complete": sum(
            1 for r in data.get("runs", []) if r.get("status") == "complete"
        ),
    }
    refresh = "3" if status == "running" else "30"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="{refresh}" />
  <title>Vacuum Pressure Hold Test (live)</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    :root {{
      color-scheme: dark;
      --bg: #0f1419; --panel: #1a2332; --text: #e7ecf3; --muted: #9aa7b8;
      --accent: #5b9fd4; --border: #2a3545; --good: #3ecf8e;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: var(--bg); color: var(--text); line-height: 1.45;
    }}
    header {{
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, #152033, var(--bg));
    }}
    h1 {{ margin: 0 0 0.35rem; font-size: 1.35rem; }}
    .meta {{ color: var(--muted); font-size: 0.9rem; }}
    main {{ padding: 1rem 1.5rem 2rem; max-width: 1280px; margin: 0 auto; }}
    .panel {{
      background: var(--panel); border: 1px solid var(--border);
      border-radius: 12px; padding: 1rem; margin: 1rem 0;
    }}
    table {{ width: 100%; border-collapse: collapse; font-size: 0.9rem; }}
    th, td {{ text-align: left; padding: 0.45rem 0.55rem; border-bottom: 1px solid var(--border); }}
    th {{ color: var(--muted); font-weight: 600; }}
    .chart-wrap {{ position: relative; height: 380px; }}
    h2 {{ margin: 0 0 0.75rem; font-size: 1.05rem; }}
    .pill {{
      display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px;
      background: #243247; color: var(--accent); font-size: 0.8rem; margin: 0.15rem 0.35rem 0.15rem 0;
    }}
    .pill.running {{ color: var(--good); }}
  </style>
</head>
<body>
  <header>
    <h1>Vacuum module pressure hold — 0 to −800 mbar @ 50 mbar / 2 min</h1>
    <div class="meta">
      <span class="pill {'running' if status == 'running' else ''}">{meta['status']}</span>
      <span class="pill">progress {meta['n_complete']}/{meta['n_targets']}</span>
      <span class="pill">current target {meta['current_target']}</span>
      <span class="pill">hold {meta['duration_s']}s</span>
      <span class="pill">auto-refresh {refresh}s</span>
      <div style="margin-top:0.5rem">{meta['firmware']}</div>
      <div>{meta['waste']} · {meta['timestamp']}</div>
    </div>
  </header>
  <main>
    <div class="panel">
      <h2>Steady-state summary (last ~30s while pump enabled)</h2>
      <table>
        <thead>
          <tr>
            <th>Target</th><th>Status</th><th>Mean |err|</th><th>Mean err</th>
            <th>Stdev</th><th>P95 |err|</th><th>Max |err|</th><th>N</th>
          </tr>
        </thead>
        <tbody>
          {''.join(stats_rows) if stats_rows else '<tr><td colspan="8">waiting…</td></tr>'}
        </tbody>
      </table>
    </div>
    <div class="panel">
      <h2>Gauge pressure vs time (per target run)</h2>
      <div class="chart-wrap"><canvas id="pressureChart"></canvas></div>
    </div>
    <div class="panel">
      <h2>Error vs time (current − commanded target)</h2>
      <div class="chart-wrap"><canvas id="errorChart"></canvas></div>
    </div>
  </main>
  <script>
    const runs = {payload};
    const colors = [
      '#5b9fd4','#3ecf8e','#f0b429','#e36bae','#a78bfa',
      '#f97316','#22d3ee','#f43f5e','#84cc16','#c084fc',
      '#38bdf8','#fb7185','#a3e635','#e879f9','#2dd4bf',
      '#fbbf24','#60a5fa'
    ];
    const pressureDatasets = [];
    const errorDatasets = [];
    runs.forEach((run, i) => {{
      const color = colors[i % colors.length];
      const alpha = run.status === 'running' ? 1 : 0.85;
      pressureDatasets.push({{
        label: `${{run.target}} mbar`,
        data: run.t.map((x, j) => ({{x, y: run.current[j]}})),
        borderColor: color, backgroundColor: color, borderWidth: 1.4,
        pointRadius: 0, tension: 0.12, border: alpha,
      }});
      pressureDatasets.push({{
        label: `tgt ${{run.target}}`,
        data: run.t.map((x) => ({{x, y: run.target}})),
        borderColor: color, borderDash: [5, 4], borderWidth: 1,
        pointRadius: 0, opacity: 0.7,
      }});
      errorDatasets.push({{
        label: `err ${{run.target}}`,
        data: run.t.map((x, j) => ({{x, y: run.error[j]}})),
        borderColor: color, backgroundColor: color, borderWidth: 1.3,
        pointRadius: 0, tension: 0.12,
      }});
    }});
    const common = {{
      responsive: true, maintainAspectRatio: false,
      interaction: {{ mode: 'nearest', intersect: false }},
      scales: {{
        x: {{
          type: 'linear',
          title: {{ display: true, text: 'Time within run (s)', color: '#9aa7b8' }},
          ticks: {{ color: '#9aa7b8' }}, grid: {{ color: '#2a3545' }},
        }},
        y: {{ ticks: {{ color: '#9aa7b8' }}, grid: {{ color: '#2a3545' }} }},
      }},
      plugins: {{ legend: {{ labels: {{ color: '#e7ecf3', boxWidth: 12 }} }} }},
    }};
    new Chart(document.getElementById('pressureChart'), {{
      type: 'line', data: {{ datasets: pressureDatasets }},
      options: {{
        ...common,
        scales: {{
          ...common.scales,
          y: {{
            ...common.scales.y,
            title: {{ display: true, text: 'Gauge pressure (mbar)', color: '#9aa7b8' }},
          }},
        }},
      }},
    }});
    new Chart(document.getElementById('errorChart'), {{
      type: 'line', data: {{ datasets: errorDatasets }},
      options: {{
        ...common,
        scales: {{
          ...common.scales,
          y: {{
            ...common.scales.y,
            title: {{ display: true, text: 'Error (mbar)', color: '#9aa7b8' }},
            min: -20, max: 20,
          }},
        }},
      }},
    }});
  </script>
</body>
</html>
"""
    written = []
    if "html" in paths:
        paths["html"].write_text(html)
        written.append(paths["html"])
    if "pdf" in paths:
        _report_format.write_single_run_pdf(data, paths["pdf"])
        written.append(paths["pdf"])
    print(
        f"Wrote {', '.join(str(path.resolve()) for path in written)} "
        f"status={status} runs={len(series_js)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

