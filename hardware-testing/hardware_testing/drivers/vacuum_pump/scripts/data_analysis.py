import pandas as pd
import plotly.graph_objs as go
import os
import webbrowser
import argparse
import re
from glob import glob
from pathlib import Path
from typing import Sequence
from pathlib import Path


def _extract_label(path: str | Path) -> str:
    base = Path(path).name
    m = re.search(r"(\d+)\s*mbar", base, flags=re.IGNORECASE)
    return f"{m.group(1)} mbar" if m else base


def build_overlay_figure(file_paths: Sequence[str | Path]) -> go.Figure:
    traces: list[go.Scattergl] = []
    dataframes: list[tuple[str, pd.DataFrame]] = []
    base_dir = Path(r"C:\Users\cfern\Documents\Github\opentrons\hardware-testing\hardware_testing\drivers\vacuum_pump\scripts\wetrun_acroprep")
    missing_paths: list[str] = []

    for p in file_paths:
        # Resolve relative paths against this script's directory
        p_path = Path(p)
        path = p_path if p_path.is_absolute() else (base_dir / p_path)
        if not path.exists():
            missing_paths.append(str(path))
            continue
        try:
            # Read with BOM-safe UTF-8 to handle Excel-exported CSVs
            df = pd.read_csv(path, encoding="utf-8-sig")
            # Normalize column names (trim spaces)
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
        fig = go.Figure()
        fig.update_layout(title="No data found", template="plotly_dark")
        return fig

    print(f"Loaded {len(dataframes)} file(s):")
    for label, df in dataframes:
        print(f"  ✓ {label}")
        # Choose which series to overlay for this file; prefer *_FILTERED columns (case-insensitive)
        upper_cols = [c.upper() for c in df.columns]
        # value_cols = [col for col, up in zip(df.columns, upper_cols) if up.endswith("_FILTERED")]
        value_cols = [col for col, up in zip(df.columns, upper_cols) if up.endswith("_ROC")]

        # Fallback: all numeric columns except common time columns
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

        # Find a timestamp-like column
        ts_candidates = [c for c in df.columns if c.lower() in ("timestamp", "time", "datetime")]
        ts_col = ts_candidates[0] if ts_candidates else df.columns[0]
        for c in value_cols:
            if c in df.columns:
                # Coerce Y to numeric to avoid silent string plotting
                y = pd.to_numeric(df[c], errors="coerce")
                x = df[ts_col]
                traces.append(
                    go.Scattergl(
                        x=x,
                        y=y,
                        mode="lines+markers",
                        marker={"size": 4},
                        name=f"{label} {c.replace('_', ' ')}",
                    )
                )

    fig = go.Figure(data=traces)
    fig.update_layout(
        title={"text": "Vacuum Pressure RT"},
        xaxis={"title": {"text": "Time (mins)"}},
        yaxis={"title": {"text": "Pressure (mbar)"}},
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
        help="Directory containing CSV files to plot (includes all *.csv in this folder)",
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
    return parser

if __name__ == "__main__":
    parser = build_arg_parser()
    args = parser.parse_args()

    # Build the file list from --dir, explicit files, or defaults
    if args.dir:
        dir_path = Path(args.dir)
        file_list = sorted([p for p in dir_path.glob("*.csv")])
        if not file_list:
            print(f"No CSV files found in directory: {dir_path}")
    elif args.files:
        expanded: list[Path] = []
        for f in args.files:
            f_path = Path(f)
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

    fig = build_overlay_figure(file_list)
    out_path = Path(args.out).absolute()
    fig.write_html(str(out_path), include_plotlyjs="cdn", auto_open=False)
    print(f"Wrote: {out_path}")
    if not args.no_open:
        webbrowser.open_new_tab(out_path.resolve().as_uri())

