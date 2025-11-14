import pandas as pd
import plotly.graph_objs as go  # type: ignore[import]
from plotly.subplots import make_subplots  # type: ignore[import]
from plotly.colors import qualitative as qc  # type: ignore[import]
import numpy as np
import webbrowser
import argparse
import re
from glob import glob
from pathlib import Path
from typing import Sequence
import plotly.io as pio  # type: ignore[import]


def _extract_label(path: str | Path) -> str:
    base = Path(path).name
    m = re.search(r"(\d+)\s*mbar", base, flags=re.IGNORECASE)
    return f"{m.group(1)} mbar" if m else base


def build_overlay_figure(
    file_paths: Sequence[str | Path],
    show_roc: bool = True,
    roc_only: bool = False,
    show_stats_table: bool = True,
    max_seconds: float | None = 100.0,
    group_legend: bool = True,
    hide_pressure_legend: bool = False,
    hide_roc_legend: bool = False,
    color_by: str = "trace",  # 'trace' (all unique) or 'label' (same per label)
    channels: str = "both",  # 'both' | 'pa' | 'pb'
) -> go.Figure:
    dataframes: list[tuple[str, pd.DataFrame]] = []
    base_dir = Path(r"C:\Users\cfern\Documents\Github\opentrons\hardware-testing\hardware_testing\drivers\vacuum_pump\scripts\wetrun_acroprep")
    missing_paths: list[str] = []

    # Figure with secondary y-axis and a table row
    fig = make_subplots(
        rows=2,
        cols=1,
        specs=[[{"secondary_y": True}], [{"type": "table"}]],
        row_heights=[0.82, 0.18],
        shared_xaxes=False,
        vertical_spacing=0.08,
    )

    stats_rows: list[dict] = []

    # Resolve and read files
    for p in file_paths:
        p_path = Path(p)
        path = p_path if p_path.is_absolute() else (base_dir / p_path)
        if not path.exists():
            missing_paths.append(str(path))
            continue
        try:
            df = pd.read_csv(path, encoding="utf-8-sig")
            df.columns = df.columns.str.strip()
            dataframes.append((_extract_label(path), df))
        except Exception:
            missing_paths.append(str(path))
            continue

    if missing_paths:
        print("Warning: missing/unreadable files:")
        for mp in missing_paths:
            print(f"  - {mp}")

    if not dataframes:
        fig.update_layout(title="No data found", template="plotly_dark")
        return fig

    print(f"Loaded {len(dataframes)} file(s):")

    # Color assignment helpers
    palette = (
        qc.Plotly
        + qc.D3
        + qc.Set3
        + qc.Alphabet
        + qc.Bold
        + qc.Safe
        + qc.Dark24
        + qc.Light24
    )
    trace_idx = 0
    label_to_color: dict[str, str] = {}
    label_idx = 0

    def next_color() -> str:
        nonlocal trace_idx
        c = palette[trace_idx % len(palette)]
        trace_idx += 1
        return c

    def color_for_label(label: str) -> str:
        nonlocal label_idx
        if label not in label_to_color:
            label_to_color[label] = palette[label_idx % len(palette)]
            label_idx += 1
        return label_to_color[label]
    for label, df in dataframes:
        print(f"  ✓ {label}")
        upper_cols = [c.upper() for c in df.columns]
        col_upper_map = {c: u for c, u in zip(df.columns, upper_cols)}
        value_cols = [col for col, up in zip(df.columns, upper_cols) if up.endswith("_FILTERED")]

        if not value_cols:
            exclude = {"TIMESTAMP", "TIME", "DATETIME", "DATE"}
            for col in df.columns:
                if col.upper() in exclude:
                    continue
                try:
                    pd.to_numeric(df[col])
                    value_cols.append(col)
                except Exception:
                    continue

        # Channel filter for PA/PB
        chan = channels.lower().strip()
        if chan in ("pa", "pb"):
            needle = "PA" if chan == "pa" else "PB"
            value_cols = [c for c in value_cols if needle in col_upper_map.get(c, "")]

        ts_candidates = [c for c in df.columns if c.lower() in ("timestamp", "time", "datetime")]
        ts_col = ts_candidates[0] if ts_candidates else df.columns[0]

        # Normalize time to seconds from start for consistent cutoff
        x_raw = df[ts_col]
        x_num = pd.to_numeric(x_raw, errors="coerce")
        x_seconds = None
        if x_num.notna().sum() >= max(3, int(0.8 * len(x_raw))):
            x_seconds = (x_num - x_num.iloc[0]).astype(float)
        else:
            x_dt = pd.to_datetime(x_raw, errors="coerce")
            if x_dt.notna().sum() >= max(3, int(0.8 * len(x_raw))):
                x_seconds = (x_dt - x_dt.iloc[0]).dt.total_seconds()

        # Build a cutoff mask if we have seconds and a positive max_seconds
        if max_seconds is not None and max_seconds > 0 and x_seconds is not None:
            time_mask = (x_seconds <= max_seconds)
        else:
            # No cutoff or unable to compute seconds: keep all rows
            time_mask = pd.Series(True, index=df.index)

        # Pressure traces (unless ROC-only)
        if not roc_only:
            for c in value_cols:
                if c in df.columns:
                    y = pd.to_numeric(df[c], errors="coerce")
                    # Apply cutoff mask if available
                    y = y[time_mask]
                    x = df[ts_col][time_mask]
                    # Build customdata for rich hover
                    npts = len(y)
                    sec_vals = (
                        x_seconds[time_mask].to_numpy() if x_seconds is not None else np.full(npts, np.nan)
                    )
                    ts_vals = x.to_numpy()
                    col_clean = c.replace("_", " ")
                    custom = np.column_stack([
                        np.full(npts, label),
                        np.full(npts, col_clean),
                        sec_vals,
                        ts_vals,
                    ])
                    # Choose color strategy
                    color = next_color() if color_by == "trace" else color_for_label(label)
                    fig.add_trace(
                        go.Scattergl(
                            x=x,
                            y=y,
                            mode="lines+markers",
                            marker={"size": 4, "color": color},
                            line={"color": color},
                            name=f"{label} {c.replace('_', ' ')}",
                            legendgroup=(label if group_legend else None),
                            showlegend=(not hide_pressure_legend),
                            customdata=custom,
                            hovertemplate=(
                                "%{customdata[0]} %{customdata[1]}<br>"
                                "t: %{customdata[2]:.2f} s<br>"
                                "P: %{y:.2f} mbar<br>"
                                "time: %{customdata[3]}<extra></extra>"
                            ),
                        ),
                        row=1,
                        col=1,
                        secondary_y=False,
                    )

        # ROC trace (always if roc_only, else when show_roc)
        if (show_roc or roc_only) and len(df) > 2:
            roc_col = None
            filtered = [col for col, up in zip(df.columns, upper_cols) if up.endswith("_FILTERED")]
            # Apply channel filter to ROC selection first
            if chan in ("pa", "pb"):
                needle = "PA" if chan == "pa" else "PB"
                filtered = [c for c in filtered if needle in col_upper_map.get(c, "")]
            if filtered:
                roc_col = filtered[0]
            else:
                pa_like = [col for col, up in zip(df.columns, upper_cols) if ("PA" in up or "PRESSURE" in up)]
                if chan in ("pa", "pb"):
                    needle = "PA" if chan == "pa" else "PB"
                    pa_like = [c for c in pa_like if needle in col_upper_map.get(c, "")]
                if pa_like:
                    roc_col = pa_like[0]
            if not roc_col and value_cols:
                roc_col = value_cols[0]

            if roc_col and roc_col in df.columns:
                y_num = pd.to_numeric(df[roc_col], errors="coerce")
                if x_seconds is not None and y_num.notna().sum() >= 3:
                    # mask valid samples and apply cutoff
                    mask = x_seconds.notna() & y_num.notna()
                    if max_seconds is not None and max_seconds > 0:
                        mask = mask & (x_seconds <= max_seconds)
                    xs = x_seconds[mask].to_numpy()
                    ys = y_num[mask].to_numpy()
                    dpdt = np.gradient(ys, xs, edge_order=1)
                    ts_vals = df[ts_col][mask].to_numpy()
                    npts = dpdt.shape[0]
                    roc_name = roc_col.replace("_", " ")
                    custom = np.column_stack([
                        np.full(npts, label),
                        np.full(npts, roc_name),
                        xs,  # seconds
                        ts_vals,
                    ])
                    color = next_color() if color_by == "trace" else color_for_label(label)
                    fig.add_trace(
                        go.Scattergl(
                            x=df[ts_col][mask],
                            y=dpdt,
                            mode="lines+markers",
                            line={"color": color, "dash": "dot"},
                            name=f"{label} dP/dt ({roc_col.replace('_', ' ')})",
                            legendgroup=(label if group_legend else None),
                            showlegend=(not hide_roc_legend),
                            marker={"color": color},
                            customdata=custom,
                            hovertemplate=(
                                "%{customdata[0]} dP/dt (%{customdata[1]})<br>"
                                "t: %{customdata[2]:.2f} s<br>"
                                "dP/dt: %{y:.2f} mbar/s<br>"
                                "time: %{customdata[3]}<extra></extra>"
                            ),
                        ),
                        row=1,
                        col=1,
                        secondary_y=True,
                    )

                    # Stats for table (pressure range and dP/dt range)
                    stats_rows.append(
                        {
                            "Label": label,
                            "Column": roc_col,
                            "P_min": float(np.nanmin(ys)) if ys.size else float("nan"),
                            "P_max": float(np.nanmax(ys)) if ys.size else float("nan"),
                            "dPdt_min": float(np.nanmin(dpdt)) if dpdt.size else float("nan"),
                            "dPdt_max": float(np.nanmax(dpdt)) if dpdt.size else float("nan"),
                        }
                    )

    # Summary table
    if show_stats_table and stats_rows:
        header = ["Label", "Pressure Col", "P min (mbar)", "P max (mbar)", "dP/dt min", "dP/dt max"]
        col_label = [r["Label"] for r in stats_rows]
        col_col = [r["Column"] for r in stats_rows]
        col_pmin = [f"{r['P_min']:.2f}" for r in stats_rows]
        col_pmax = [f"{r['P_max']:.2f}" for r in stats_rows]
        col_dpmin = [f"{r['dPdt_min']:.2f}" for r in stats_rows]
        col_dpmax = [f"{r['dPdt_max']:.2f}" for r in stats_rows]
        fig.add_trace(
            go.Table(
                header=dict(values=header, fill_color="#1f2937", font=dict(color="white")),
                cells=dict(values=[col_label, col_col, col_pmin, col_pmax, col_dpmin, col_dpmax], fill_color="#111827", font=dict(color="white")),
            ),
            row=2,
            col=1,
        )
    # Titles
    if roc_only:
        fig.update_layout(
            title={"text": "Vacuum Pressure ROC"},
            xaxis={"title": {"text": "Time (Seconds)"}},
            yaxis={"title": {"text": "Pressure (mbar)"}},
            yaxis2={"title": {"text": "dP/dt (mbar/s)"}},
            uirevision="static",
            hovermode="x unified",
        )
    else:
        fig.update_layout(
            title={"text": f'{args.chart_title}'},
            xaxis={"title": {"text": "Time (Seconds)"}},
            yaxis={"title": {"text": "Pressure (mbar)"}},
            yaxis2={"title": {"text": "dP/dt (mbar/s)"}},
            uirevision="static",
            hovermode="x unified",
        )
    return fig


# Define your CSVs here so both the callback and __main__ can use them
FILES: list[str] = [
    "vacuum_test_10-28-25_17-19-300uL-800mbar-liquid-T1-AcroPrep Advance 96-well filter plate - 0.2µm, 350uL.csv",
    "vacuum_test_10-28-25_17-26-300uL-700mbar-liquid-T1-AcroPrep Advance 96-well filter plate - 0.2µm, 350uL.csv",
    "vacuum_test_10-28-25_17-30-300uL-600mbar-liquid-T1-AcroPrep Advance 96-well filter plate - 0.2µm, 350uL.csv",
    "vacuum_test_10-28-25_17-33-300uL-500mbar-liquid-T1-AcroPrep Advance 96-well filter plate - 0.2µm, 350uL.csv",
    "vacuum_test_10-28-25_17-39-300uL-400mbar-liquid-T1-AcroPrep Advance 96-well filter plate - 0.2µm, 350uL.csv",
]


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Plot multiple vacuum CSV files on one graph (static).")
    parser.add_argument(
        "files",
        nargs="*",
        help="CSV file paths to plot (default: built-in FILES list)",
    )
    parser.add_argument(
        "--dir",
        type=str,
        help="Directory containing CSV files to plot (includes all *.csv in this folder)",
    )
    parser.add_argument(
        "--chart-title",
        type=str,
        default='Vacuum Pressure',
        help="Name the Chart Name",
    )
    parser.add_argument(
        "--out",
        default="vacuum_overlay.html",
        help="Output HTML file to write the plot to (default: vacuum_overlay.html)",
    )
    parser.add_argument(
        "--no-open",
        action="store_true",
        help="Do not auto-open the generated HTML in a browser",
    )
    parser.add_argument(
        "--no-roc",
        action="store_true",
        help="Disable dP/dt overlay on secondary y-axis",
    )
    parser.add_argument(
        "--roc-only",
        action="store_true",
        help="Show only the dP/dt overlay (no pressure traces)",
    )
    parser.add_argument(
        "--no-stats",
        action="store_true",
        help="Disable summary stats table at the bottom of the plot",
    )
    parser.add_argument(
        "--tmax",
        type=float,
        default=100.0,
        help="Cut plot to this many seconds from start (<=0 disables cut). Default: 100.0",
    )
    parser.add_argument(
        "--channels",
        choices=["both", "pa", "pb"],
        default="both",
        help="Choose which channels to plot: both (default), pa, or pb.",
    )
    parser.add_argument(
        "--no-group-legend",
        action="store_true",
        help="Do not group traces by file in the legend (each curve toggles independently).",
    )
    parser.add_argument(
        "--hide-pressure-legend",
        action="store_true",
        help="Hide pressure traces from the legend.",
    )
    parser.add_argument(
        "--hide-roc-legend",
        action="store_true",
        help="Hide dP/dt traces from the legend.",
    )
    parser.add_argument(
        "--color-by",
        choices=["trace", "label"],
        default="trace",
        help="Color assignment: per trace (all unique) or per label (same color for all traces of a label).",
    )
    parser.add_argument(
        "--no-hover-table",
        action="store_true",
        help="Disable the dynamic hover table (default now shows table above chart and hides popup).",
    )
    return parser

if __name__ == "__main__":
    parser = build_arg_parser()
    args = parser.parse_args()

    # Build the file list from --dir, explicit files, or defaults
    if args.dir:
        dir_path = Path(args.dir)
        print(dir_path)
        file_list = sorted([p for p in dir_path.glob("*.csv")])
        print(file_list)
        if not file_list:
            print(f"No CSV files found in directory: {dir_path}")
    elif args.files:
        expanded: list[Path] = []
        for f in args.files:
            f_path = Path(f)
            print(f_path)
            if f_path.is_dir():
                expanded.extend(sorted([p for p in f_path.glob("*.csv")]))
            else:
                matches = glob(f)
                expanded.extend([Path(m) for m in matches] if matches else [f_path])
        file_list = expanded
    else:
        file_list = [Path(p) for p in FILES]

    if not file_list:
        print("Nothing to plot: no files resolved. Provide --dir or file paths.")
        raise SystemExit(2)

    fig = build_overlay_figure(
        file_list,
        show_roc=not args.no_roc,
        roc_only=args.roc_only,
        show_stats_table=not args.no_stats,
        max_seconds=(None if args.tmax is not None and args.tmax <= 0 else args.tmax),
        group_legend=(not args.no_group_legend),
        hide_pressure_legend=args.hide_pressure_legend,
        hide_roc_legend=args.hide_roc_legend,
        color_by=args.color_by,
        channels=args.channels,
    )
    out_path = Path(args.out).absolute()

    if not args.no_hover_table:
        # Default behavior: show dynamic hover table ABOVE the chart, hide popup, add controls.
        html_str: str = pio.to_html(fig, include_plotlyjs="cdn", full_html=True)
        inject: str = r'''
<style>
/* Hide default Plotly hover box but keep events */
.hoverlayer { display: none !important; }
#hover-banner { color:#93c5fd; font-weight:600; margin: 6px 0; }
#hover-controls { margin: 6px 0; }
#hover-controls button { background:#374151; color:#fff; border:0; padding:6px 10px; margin-right:8px; border-radius:4px; cursor:pointer; }
#hover-controls button:hover { background:#4b5563; }
#hover-table-wrapper { font-family: Inter, system-ui, sans-serif; margin-bottom: 10px; }
#hover-table { border-collapse: collapse; width: 100%; }
#hover-table thead th { background: #9dd3ff; color:#0f172a; padding: 6px 10px; text-align: left; font-weight:600; }
#hover-table tbody td { padding: 6px 10px; border-top: 1px solid #94a3b8; }
#hover-table tbody tr:nth-child(odd) { background:#ffffff; }
#hover-table tbody tr:nth-child(even) { background:#e6f9ff; }
</style>
<script>
document.addEventListener('DOMContentLoaded', function(){
    function init(){
      var gd = document.getElementsByClassName('js-plotly-plot')[0];
      if (!gd){ setTimeout(init,50); return; }
      var wrapper = document.createElement('div');
      wrapper.id = 'hover-table-wrapper';
      // Collect trace names for header (exclude those without y data)
      var names = [];
      for (var i=0;i<gd.data.length;i++){ var d = gd.data[i]; if (d.y && d.name){ names.push(d.name); } }
      var headerCells = ['t (s)','Timestamp'].concat(names);
      var headerHtml = headerCells.map(function(h){ return '<th>'+h+'</th>'; }).join('');
      wrapper.innerHTML = '\n'
        + '<div id="hover-banner">Hover table mode ON (popup disabled)</div>'
        + '<div id="hover-controls">'
        + '  <button id="hover-clear">Clear</button>'
        + '  <button id="hover-copy">Copy CSV</button>'
        + '</div>'
        + '<table id="hover-table">\n'
        + '  <thead><tr>'+headerHtml+'</tr></thead>'
        + '  <tbody id="hover-table-body"></tbody>'
        + '</table>';
      gd.parentNode.insertBefore(wrapper, gd);
      var body = document.getElementById('hover-table-body');
      function toFixedMaybe(x){ var n = Number(x); if (!isFinite(n)) return ''; return n.toFixed(2); }
      function appendRow(points){
        if (!points || !points.length) return;
        // Map name-> value at this hover
        var map = {}; var sec=''; var ts='';
        for (var i=0;i<points.length;i++){ var p=points[i]; map[p.data.name]= (p.y!=null? toFixedMaybe(p.y):''); if (i===0){ var cd=p.customdata||[]; sec = (cd[2]!=null? toFixedMaybe(cd[2]):''); ts = (cd[3]!=null? cd[3]:''); } }
        var rowVals = [sec, ts];
        for (var j=0;j<names.length;j++){ rowVals.push(map[names[j]] || ''); }
        var rowHtml = '<tr>'+ rowVals.map(function(v){ return '<td>'+v+'</td>'; }).join('') + '</tr>';
        body.innerHTML += rowHtml;
      }
      function clearTable(){ body.innerHTML=''; }
      function copyCSV(){
        var rows = body.querySelectorAll('tr');
        var out = [headerCells.join(',')];
        rows.forEach(function(r){
          var cells = r.querySelectorAll('td');
          var vals = Array.prototype.map.call(cells, function(td){ var txt=(td.textContent||'').replace(/\"/g,'""'); return '"'+txt+'"'; });
          out.push(vals.join(','));
        });
        var csv = out.join('\n');
        if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(csv); }
        else { var ta=document.createElement('textarea'); ta.value=csv; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(e){} document.body.removeChild(ta); }
      }
      gd.on('plotly_hover', function(e){ appendRow(e.points); });
      var btnClear = document.getElementById('hover-clear');
      var btnCopy = document.getElementById('hover-copy');
      if (btnClear) btnClear.addEventListener('click', clearTable);
      if (btnCopy) btnCopy.addEventListener('click', copyCSV);
    }
    init();
});
</script>
'''
        html_out = html_str.replace('</body>', inject + '\n</body>')  # type: ignore[reportUnboundVariable]
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(html_out)
    else:
        fig.write_html(str(out_path), include_plotlyjs="cdn", auto_open=False)
    print(f"Wrote: {out_path}")
    if not args.no_open:
        webbrowser.open_new_tab(out_path.resolve().as_uri())

