"""Build HTML and/or PDF reports from vacuum pressure hold-test results."""
from __future__ import annotations

import argparse
import html as html_lib
import json
from pathlib import Path
from typing import Any, Optional

try:
    from hardware_testing.modules.vacuum_module.scripts.pressure_regulation import (
        hold_results as _hold_results,
    )
except ImportError:
    import hold_results as _hold_results  # type: ignore[no-redef,import-not-found]

FORMAT_HTML = "html"
FORMAT_PDF = "pdf"
FORMAT_BOTH = "both"
FORMAT_CHOICES = (FORMAT_HTML, FORMAT_PDF, FORMAT_BOTH)
DEFAULT_REPORT_TITLE = "Vacuum module pressure report"

_LINE_COLORS = (
    "#1d4ed8",
    "#047857",
    "#b45309",
    "#be185d",
    "#6d28d9",
    "#c2410c",
    "#0e7490",
    "#4d7c0f",
)


_WAITING_HTML = (
    "<!DOCTYPE html><html><body style='background:#0f1419;color:#e7ecf3;"
    "font-family:system-ui;padding:2rem'><h1>Waiting for data…</h1>"
    "{refresh_meta}</body></html>"
)


def run_label(run: dict[str, Any]) -> str:
    """Display name: prefer run_name, else folder; always fall back to _dir."""
    return str(run.get("run_name") or run.get("_dir") or "")


def _fmt_trip_t(run: dict[str, Any] | None) -> str:
    if run is None or run.get("trip_t_s") is None:
        return "—"
    return f"{run['trip_t_s']}"


def _refresh_meta(enabled: bool, status: Optional[str] = None) -> str:
    if not enabled:
        return ""
    seconds = "3" if status in (None, "running") else "30"
    return f'<meta http-equiv="refresh" content="{seconds}" />'


def _y_at_or_before(
    samples: list[dict[str, Any]], t: float, key: str
) -> Optional[float]:
    y: Optional[float] = None
    for sample in samples:
        ts = sample.get("t_s")
        val = sample.get(key)
        if ts is None or val is None:
            continue
        if ts <= t:
            y = float(val)
        else:
            break
    return y


def add_report_arguments(parser: argparse.ArgumentParser) -> None:
    """Add single-run report arguments to ``parser``."""
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("results.json"),
        help="Input results path (.json, .csv, or a run directory; default: results.json)",
    )
    _add_output_format_args(parser, Path("index.html"))


def add_compare_arguments(parser: argparse.ArgumentParser) -> None:
    """Add multi-run compare arguments to ``parser``."""
    parser.add_argument(
        "--runs-dir",
        type=Path,
        default=Path("runs"),
        help="Directory of run folders with results.json or results.csv (default: runs)",
    )
    _add_output_format_args(parser, Path("compare.html"))


def run_report(args: argparse.Namespace) -> int:
    """Build a single-run HTML and/or PDF report from ``args``."""
    src = args.input
    fmt = infer_format(args.output, args.fmt)
    paths = output_paths(args.output, fmt)
    if not src.exists():
        written = []
        if "html" in paths:
            paths["html"].write_text(
                _WAITING_HTML.format(refresh_meta=_refresh_meta(args.refresh))
            )
            written.append(paths["html"])
        if "pdf" in paths:
            write_waiting_pdf(paths["pdf"])
            written.append(paths["pdf"])
        print(f"No data yet; wrote placeholder {', '.join(str(p) for p in written)}")
        return 0

    data = _hold_results.load_results(src)
    series_js = []
    stats_rows = []
    waste_enabled = bool(data.get("waste_detection_enabled")) or str(
        data.get("waste_detection", "")
    ).startswith("enabled")
    for run in data.get("runs", []):
        samples = run.get("samples", [])
        t = [s["t_s"] for s in samples]
        c = [s.get("current_mbar") for s in samples]
        e = [s.get("error_mbar") for s in samples]
        target = run["target_mbar"]
        series_js.append(
            {
                "target": target,
                "t": t,
                "current": c,
                "error": e,
                "stats": run.get("stats", {}),
                "status": run.get("status", ""),
                "tripped": run.get("tripped"),
                "trip_t_s": run.get("trip_t_s"),
                "expect_trip": run.get("expect_trip"),
                "pass": run.get("pass"),
            }
        )
        st = run.get("stats", {})
        status = run.get("status", "")
        waste_cells = (
            f"<td>{run.get('bottle') or '—'}</td>"
            f"<td>{run.get('expect_trip')}</td>"
            f"<td>{run.get('tripped')}</td>"
            f"<td>{run.get('trip_t_s') if run.get('trip_t_s') is not None else '—'}</td>"
            f"<td>{run.get('pass')}</td>"
            if waste_enabled
            else ""
        )
        if st.get("n", 0):
            stats_rows.append(
                f"<tr><td>{target}</td><td>{status}</td>{waste_cells}"
                f"<td>{st['mean_abs_err']:.2f}</td>"
                f"<td>{st['mean_err']:.2f}</td><td>{st['stdev_err']:.2f}</td>"
                f"<td>{st['p95_abs_err']:.2f}</td><td>{st['max_abs_err']:.2f}</td>"
                f"<td>{st['n']}</td></tr>"
            )
        else:
            colspan = 6 if not waste_enabled else 6
            stats_rows.append(
                f"<tr><td>{target}</td><td>{status}</td>{waste_cells}"
                f"<td colspan='{colspan}'>{st.get('note', 'no steady data')}</td></tr>"
            )

    payload = json.dumps(series_js)
    status = data.get("status", "unknown")
    current = data.get("current_target_mbar")
    meta = {
        "firmware": data.get("firmware", ""),
        "timestamp": data.get("timestamp", ""),
        "waste": data.get("waste_detection", ""),
        "bottle": data.get("bottle"),
        "expect_trip": data.get("expect_trip"),
        "g_sealed_max": data.get("g_sealed_max"),
        "duration_s": data.get("duration_s"),
        "sample_period_s": data.get("sample_period_s"),
        "status": status,
        "current_target": current,
        "n_targets": len(data.get("targets", [])),
        "n_complete": sum(
            1 for r in data.get("runs", []) if r.get("status") == "complete"
        ),
        "waste_enabled": waste_enabled,
    }
    refresh = bool(args.refresh)
    refresh_seconds = "3" if status == "running" else "30"
    refresh_meta = _refresh_meta(refresh, status)
    refresh_pill = (
        f'<span class="pill">auto-refresh {refresh_seconds}s</span>' if refresh else ""
    )
    heading = html_lib.escape(str(args.title or DEFAULT_REPORT_TITLE))
    page_title = heading + (" (live)" if refresh else "")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  {refresh_meta}
  <title>{page_title}</title>
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
    <h1>{heading}</h1>
    <div class="meta">
      <span class="pill {'running' if status == 'running' else ''}">{meta['status']}</span>
      <span class="pill">progress {meta['n_complete']}/{meta['n_targets']}</span>
      <span class="pill">current target {meta['current_target']}</span>
      <span class="pill">hold {meta['duration_s']}s</span>
      {refresh_pill}
      <div style="margin-top:0.5rem">{meta['firmware']}</div>
      <div>{meta['waste']} · bottle={meta['bottle']} · expect_trip={meta['expect_trip']} · G={meta['g_sealed_max']} · {meta['timestamp']}</div>
    </div>
  </header>
  <main>
    <div class="panel">
      <h2>Steady-state summary (last ~30s while pump enabled)</h2>
      <table>
        <thead>
          <tr>
            <th>Target</th><th>Status</th>
            {('<th>Bottle</th><th>Expect trip</th><th>Tripped</th><th>Trip t</th><th>Waste pass</th>' if waste_enabled else '')}
            <th>Mean |err|</th><th>Mean err</th>
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
        write_single_run_pdf(
            data, paths["pdf"], title=str(args.title or DEFAULT_REPORT_TITLE)
        )
        written.append(paths["pdf"])
    print(
        f"Wrote {', '.join(str(path.resolve()) for path in written)} "
        f"status={status} runs={len(series_js)}"
    )
    return 0


def run_compare(args: argparse.Namespace) -> int:
    """Build a multi-run comparison HTML and/or PDF from ``args``."""
    runs_dir = args.runs_dir
    fmt = infer_format(args.output, args.fmt)
    paths = output_paths(args.output, fmt)
    runs = _hold_results.load_runs_dir(runs_dir)
    if not runs:
        written = []
        if "html" in paths:
            paths["html"].write_text(
                "<html><body><h1>No runs yet</h1>"
                f"{_refresh_meta(args.refresh)}</body></html>"
            )
            written.append(paths["html"])
        if "pdf" in paths:
            write_waiting_pdf(paths["pdf"], "No runs yet")
            written.append(paths["pdf"])
        print(f"no runs; wrote {', '.join(str(p) for p in written)}")
        return 0

    # Summary table rows
    targets = sorted({t for r in runs for t in r.get("targets", [])})
    header = (
        "<tr><th>Target</th>"
        + "".join(
            f"<th>{run_label(r)}<br/><small>mean|err| / p2p / stdev</small></th>"
            for r in runs
        )
        + "</tr>"
    )

    body_rows = []
    for tgt in targets:
        cells = [f"<td>{tgt}</td>"]
        vals = []
        for r in runs:
            run = next(
                (x for x in r.get("runs", []) if x.get("target_mbar") == tgt), None
            )
            st = (run or {}).get("stats") or {}
            waste_bit = ""
            if run is not None and (
                run.get("tripped") is not None or run.get("pass") is not None
            ):
                waste_bit = (
                    f"<br/><small>trip={run.get('tripped')} "
                    f"Trip t={_fmt_trip_t(run)} "
                    f"expect={run.get('expect_trip')} "
                    f"pass={run.get('pass')}</small>"
                )
            if st.get("n"):
                s = (
                    f"{st['mean_abs_err']:.2f} / "
                    f"{st.get('p2p', float('nan')):.2f} / "
                    f"{st['stdev_err']:.2f}{waste_bit}"
                )
                vals.append(st["mean_abs_err"])
            else:
                s = f"—{waste_bit}" if waste_bit else "—"
                vals.append(None)
            cells.append(f"<td data-v='{vals[-1]}'>{s}</td>")
        # highlight best mean_abs
        finite = [v for v in vals if v is not None]
        best = min(finite) if finite else None
        row = "<tr>"
        for i, c in enumerate(cells):
            if (
                i > 0
                and vals[i - 1] is not None
                and best is not None
                and abs(vals[i - 1] - best) < 1e-9
            ):
                c = c.replace("<td", "<td style='background:#1a3d2e;color:#3ecf8e'", 1)
            row += c
        row += "</tr>"
        body_rows.append(row)

    # Series payload for charts: one chart per target, lines = runs (alpha by name)
    chart_payload = []
    for tgt in targets:
        series = []
        for r in runs:
            run = next(
                (x for x in r.get("runs", []) if x.get("target_mbar") == tgt), None
            )
            if not run:
                continue
            samples = run.get("samples", [])
            trip_t = run.get("trip_t_s")
            series.append(
                {
                    "name": run_label(r),
                    "t": [s["t_s"] for s in samples],
                    "current": [s["current_mbar"] for s in samples],
                    "error": [s["error_mbar"] for s in samples],
                    "trip_t_s": trip_t,
                    "trip_current": (
                        _y_at_or_before(samples, float(trip_t), "current_mbar")
                        if trip_t is not None
                        else None
                    ),
                    "trip_error": (
                        _y_at_or_before(samples, float(trip_t), "error_mbar")
                        if trip_t is not None
                        else None
                    ),
                }
            )
        series.sort(key=lambda s: str(s["name"]).casefold())
        chart_payload.append({"target": tgt, "series": series})

    meta_rows = "".join(
        f"<tr><td>{run_label(r)}</td>"
        f"<td>{r.get('status')}</td><td>{r.get('timestamp')}</td>"
        f"<td>{r.get('waste_detection', '')}</td>"
        f"<td>{r.get('bottle')}</td>"
        f"<td>{r.get('expect_trip')}</td>"
        f"<td>{r.get('g_sealed_max')}</td>"
        f"<td>{r.get('firmware', '')[:80]}</td></tr>"
        for r in runs
    )

    heading = html_lib.escape(str(args.title or DEFAULT_REPORT_TITLE))
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  {_refresh_meta(args.refresh)}
  <title>{heading}</title>
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
    <h1>{heading}</h1>
    <div class="muted">Runs and chart series are sorted alphabetically by run name (use a sequence prefix like <code>23_…</code>). Green cells = best mean |error| for that target.</div>
  </header>
  <main>
    <div class="panel">
      <h2>Runs</h2>
      <table>
        <thead><tr><th>Name</th><th>Status</th><th>Timestamp</th><th>Waste</th><th>Bottle</th><th>Expect trip</th><th>G</th><th>Firmware</th></tr></thead>
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
      const seriesDataset = (s, i, yKey, tripYKey, label) => {{
        const color = colors[i % colors.length];
        const data = s.t.map((x, j) => ({{x, y: s[yKey][j]}}));
        const radii = data.map(() => 0);
        const fills = data.map(() => color);
        if (s.trip_t_s != null && s[tripYKey] != null) {{
          data.push({{x: s.trip_t_s, y: s[tripYKey]}});
          radii.push(2);
          fills.push('#ef4444');
        }}
        return {{
          label,
          data,
          borderColor: color,
          backgroundColor: color,
          borderWidth: 1.5,
          tension: 0.12,
          pointRadius: radii,
          pointHoverRadius: radii.map(r => r ? 2 : 0),
          pointBackgroundColor: fills,
          pointBorderColor: fills,
        }};
      }};
      const pSets = block.series.map((s, i) => seriesDataset(s, i, 'current', 'trip_current', s.name));
      pSets.push({{
        label: 'target',
        data: (block.series[0] ? block.series[0].t : []).map(x => ({{x, y: block.target}})),
        borderColor: '#9aa7b8', borderDash: [6,4], borderWidth: 1, pointRadius: 0,
      }});
      const eSets = block.series.map((s, i) => seriesDataset(s, i, 'error', 'trip_error', s.name + ' err'));
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
    written = []
    if "html" in paths:
        paths["html"].write_text(html)
        written.append(paths["html"])
    if "pdf" in paths:
        write_compare_pdf(
            runs, paths["pdf"], title=str(args.title or DEFAULT_REPORT_TITLE)
        )
        written.append(paths["pdf"])
    print(
        f"Wrote {', '.join(str(path.resolve()) for path in written)} with {len(runs)} runs"
    )
    return 0


def _add_output_format_args(
    parser: argparse.ArgumentParser, default_output: Path
) -> None:
    parser.add_argument(
        "--output",
        type=Path,
        default=default_output,
        help=(
            f"Output path (default: {default_output}). "
            "Suffix .pdf selects PDF if --format omitted."
        ),
    )
    parser.add_argument(
        "--format",
        dest="fmt",
        choices=list(FORMAT_CHOICES),
        default=None,
        help="Report format: html, pdf, or both (default: from --output suffix, else html)",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Embed an HTML auto-refresh meta tag (off by default)",
    )
    parser.add_argument(
        "--title",
        default=DEFAULT_REPORT_TITLE,
        help=f"Report heading (default: {DEFAULT_REPORT_TITLE})",
    )


def infer_format(output: Path, explicit: Optional[str] = None) -> str:
    """Return html/pdf/both from ``--format`` or the output suffix."""
    if explicit:
        if explicit not in FORMAT_CHOICES:
            raise ValueError(
                f"format must be one of {FORMAT_CHOICES}, got {explicit!r}"
            )
        return explicit
    if output.suffix.lower() == ".pdf":
        return FORMAT_PDF
    return FORMAT_HTML


def output_paths(output: Path, fmt: str) -> dict[str, Path]:
    """Map a format to html/pdf paths sharing ``output``'s stem."""
    fmt = infer_format(output, fmt)
    stem = output.with_suffix("")
    paths: dict[str, Path] = {}
    if fmt in (FORMAT_HTML, FORMAT_BOTH):
        paths[FORMAT_HTML] = stem.with_suffix(".html")
    if fmt in (FORMAT_PDF, FORMAT_BOTH):
        paths[FORMAT_PDF] = stem.with_suffix(".pdf")
    return paths


def write_waiting_pdf(path: Path, message: str = "Waiting for data…") -> Path:
    """Write a one-page PDF placeholder."""
    plt, pdf_pages = _mpl()
    path.parent.mkdir(parents=True, exist_ok=True)
    with pdf_pages(path) as pdf:
        fig, ax = plt.subplots(figsize=(11.0, 8.5))
        ax.axis("off")
        ax.text(0.5, 0.5, message, ha="center", va="center", fontsize=18)
        pdf.savefig(fig, bbox_inches="tight")
        plt.close(fig)
    return path


def write_single_run_pdf(
    data: dict[str, Any], path: Path, title: str = DEFAULT_REPORT_TITLE
) -> Path:
    """Write a single-run hold-test PDF (summary table + pressure/error)."""
    plt, pdf_pages = _mpl()
    path.parent.mkdir(parents=True, exist_ok=True)
    runs = data.get("runs", [])
    with pdf_pages(path) as pdf:
        _savefig(plt, pdf, _single_summary_figure(plt, data, runs, title=title))
        _savefig(
            plt,
            pdf,
            _overlay_figure(plt, runs, "current_mbar", "Gauge pressure (mbar)"),
        )
        _savefig(
            plt,
            pdf,
            _overlay_figure(
                plt, runs, "error_mbar", "Error (mbar)", ylim=(-20.0, 20.0)
            ),
        )
    return path


def write_compare_pdf(
    runs: list[dict[str, Any]], path: Path, title: str = DEFAULT_REPORT_TITLE
) -> Path:
    """Write a multi-run comparison PDF (index + per-target charts)."""
    plt, pdf_pages = _mpl()
    path.parent.mkdir(parents=True, exist_ok=True)
    targets = sorted({t for run in runs for t in run.get("targets", [])})
    with pdf_pages(path) as pdf:
        _savefig(plt, pdf, _compare_index_figure(plt, runs, title=title))
        for target in targets:
            _savefig(plt, pdf, _compare_target_figure(plt, runs, target))
    return path


def _mpl() -> tuple[Any, Any]:
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from matplotlib.backends.backend_pdf import PdfPages
    except ImportError as exc:
        raise RuntimeError(
            "PDF reports require matplotlib on the host "
            "(hardware-testing dev extra). Install with: pip install matplotlib"
        ) from exc
    return plt, PdfPages


def _savefig(plt: Any, pdf: Any, fig: Any) -> None:
    pdf.savefig(fig, bbox_inches="tight")
    plt.close(fig)


def _single_summary_figure(
    plt: Any,
    data: dict[str, Any],
    runs: list[dict[str, Any]],
    title: str = DEFAULT_REPORT_TITLE,
) -> Any:
    fig, ax = plt.subplots(figsize=(11.0, 8.5))
    ax.axis("off")
    fig.suptitle(title, fontsize=16, fontweight="bold")
    meta_lines = [
        f"Status: {data.get('status', '')}    "
        f"Run: {data.get('run_name', '')}    "
        f"{data.get('timestamp', '')}",
        str(data.get("firmware", "")),
        f"Waste: {data.get('waste_detection', '')}    "
        f"Bottle: {data.get('bottle')}    "
        f"Expect trip: {data.get('expect_trip')}    "
        f"G: {data.get('g_sealed_max')}",
        f"Hold: {data.get('duration_s')}s    "
        f"Sample: {data.get('sample_period_s')}s",
    ]
    fig.text(
        0.08, 0.88, "\n".join(meta_lines), fontsize=9, va="top", family="monospace"
    )
    headers = [
        "Target",
        "Status",
        "Bottle",
        "Expect",
        "Tripped",
        "Trip t",
        "Pass",
        "Mean |err|",
        "Mean err",
        "Stdev",
        "P95 |err|",
        "Max |err|",
        "N",
    ]
    table_rows = []
    for run in runs:
        stats = run.get("stats") or {}
        waste_cols = [
            str(run.get("bottle") or "—"),
            str(run.get("expect_trip")),
            str(run.get("tripped")),
            ("—" if run.get("trip_t_s") is None else f"{run.get('trip_t_s')}"),
            str(run.get("pass")),
        ]
        if stats.get("n"):
            table_rows.append(
                [
                    f"{run.get('target_mbar')}",
                    str(run.get("status", "")),
                    *waste_cols,
                    f"{stats['mean_abs_err']:.2f}",
                    f"{stats['mean_err']:.2f}",
                    f"{stats['stdev_err']:.2f}",
                    f"{stats['p95_abs_err']:.2f}",
                    f"{stats['max_abs_err']:.2f}",
                    str(stats["n"]),
                ]
            )
        else:
            table_rows.append(
                [
                    f"{run.get('target_mbar')}",
                    str(run.get("status", "")),
                    *waste_cols,
                    stats.get("note", "no steady data"),
                    "",
                    "",
                    "",
                    "",
                    str(stats.get("n", 0)),
                ]
            )
    if not table_rows:
        table_rows = [["—"] * len(headers)]
    table = ax.table(
        cellText=table_rows,
        colLabels=headers,
        loc="center",
        cellLoc="center",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1.0, 1.35)
    ax.set_title("Steady-state summary (last ~30s while pump enabled)", pad=24)
    return fig


def _overlay_figure(
    plt: Any,
    runs: list[dict[str, Any]],
    y_key: str,
    ylabel: str,
    ylim: Optional[tuple[float, float]] = None,
) -> Any:
    fig, ax = plt.subplots(figsize=(11.0, 6.5))
    for i, run in enumerate(runs):
        samples = run.get("samples") or []
        if not samples:
            continue
        color = _LINE_COLORS[i % len(_LINE_COLORS)]
        xs = [s["t_s"] for s in samples]
        ys = [s[y_key] for s in samples]
        ax.plot(
            xs, ys, color=color, linewidth=1.2, label=f"{run.get('target_mbar')} mbar"
        )
        if y_key == "current_mbar":
            ax.plot(
                xs,
                [run.get("target_mbar")] * len(xs),
                color=color,
                linestyle="--",
                linewidth=0.9,
                alpha=0.7,
            )
    ax.set_xlabel("Time within run (s)")
    ax.set_ylabel(ylabel)
    ax.set_title(ylabel)
    if ylim is not None:
        ax.set_ylim(*ylim)
    ax.grid(True, alpha=0.3)
    if runs:
        ax.legend(fontsize=8, ncol=2, loc="best")
    fig.tight_layout()
    return fig


def _compare_index_figure(
    plt: Any, runs: list[dict[str, Any]], title: str = DEFAULT_REPORT_TITLE
) -> Any:
    fig, ax = plt.subplots(figsize=(11.0, 8.5))
    ax.axis("off")
    fig.suptitle(title, fontsize=16, fontweight="bold")
    headers = ["Name", "Status", "Timestamp", "Firmware"]
    rows = [
        [
            run_label(run),
            str(run.get("status", "")),
            str(run.get("timestamp", "")),
            str(run.get("firmware", ""))[:72],
        ]
        for run in runs
    ] or [["—", "", "", ""]]
    table = ax.table(
        cellText=rows, colLabels=headers, loc="upper center", cellLoc="left"
    )
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1.0, 1.3)
    ax.set_title("Runs (sorted by name)", pad=16)
    return fig


def _compare_target_figure(plt: Any, runs: list[dict[str, Any]], target: float) -> Any:
    fig, axes = plt.subplots(3, 1, figsize=(11.0, 8.5), height_ratios=[0.7, 1.2, 1.2])
    fig.suptitle(f"Target {target} mbar", fontsize=14, fontweight="bold")
    headers = ["Run", "Mean |err|", "p2p", "Stdev", "N", "Trip t"]
    rows = []
    for run in runs:
        hold = next(
            (item for item in run.get("runs", []) if item.get("target_mbar") == target),
            None,
        )
        stats = (hold or {}).get("stats") or {}
        trip_t = _fmt_trip_t(hold)
        if stats.get("n"):
            rows.append(
                [
                    run_label(run),
                    f"{stats['mean_abs_err']:.2f}",
                    f"{stats.get('p2p', float('nan')):.2f}",
                    f"{stats['stdev_err']:.2f}",
                    str(stats["n"]),
                    trip_t,
                ]
            )
        else:
            rows.append([run_label(run), "—", "—", "—", "0", trip_t])
    axes[0].axis("off")
    table = axes[0].table(
        cellText=rows or [["—", "—", "—", "—", "—", "—"]],
        colLabels=headers,
        loc="center",
        cellLoc="center",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1.0, 1.25)

    for ax, y_key, ylabel, ylim in (
        (axes[1], "current_mbar", "Gauge pressure (mbar)", None),
        (axes[2], "error_mbar", "Error (mbar)", (-25.0, 25.0)),
    ):
        for i, run in enumerate(runs):
            hold = next(
                (
                    item
                    for item in run.get("runs", [])
                    if item.get("target_mbar") == target
                ),
                None,
            )
            samples = (hold or {}).get("samples") or []
            if not samples:
                continue
            color = _LINE_COLORS[i % len(_LINE_COLORS)]
            xs = [s["t_s"] for s in samples]
            ax.plot(
                xs,
                [s[y_key] for s in samples],
                color=color,
                linewidth=1.2,
                label=run_label(run),
            )
            trip_t_s = (hold or {}).get("trip_t_s")
            if trip_t_s is not None:
                trip_y = _y_at_or_before(samples, float(trip_t_s), y_key)
                if trip_y is not None:
                    ax.scatter(
                        [float(trip_t_s)],
                        [trip_y],
                        facecolors="#dc2626",
                        edgecolors=color,
                        linewidths=1.4,
                        s=8,
                        zorder=5,
                    )
        if y_key == "current_mbar":
            ax.axhline(
                target, color="#6b7280", linestyle="--", linewidth=0.9, label="target"
            )
        ax.set_xlabel("t (s)")
        ax.set_ylabel(ylabel)
        if ylim is not None:
            ax.set_ylim(*ylim)
        ax.grid(True, alpha=0.3)
        ax.legend(fontsize=7, loc="best")
    fig.tight_layout()
    return fig
