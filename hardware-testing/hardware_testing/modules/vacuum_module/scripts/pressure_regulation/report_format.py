"""Resolve HTML/PDF report outputs and write print-friendly PDFs.

HTML remains the live Chart.js page. PDFs are generated with matplotlib
(already a hardware-testing host dependency) so charts render without a
browser. Dark HTML styling is not used here — PDFs are meant to print.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

FORMAT_HTML = "html"
FORMAT_PDF = "pdf"
FORMAT_BOTH = "both"
FORMAT_CHOICES = (FORMAT_HTML, FORMAT_PDF, FORMAT_BOTH)

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


def infer_format(output: Path, explicit: Optional[str] = None) -> str:
    """Return html/pdf/both from ``--format`` or the output suffix."""
    if explicit:
        if explicit not in FORMAT_CHOICES:
            raise ValueError(f"format must be one of {FORMAT_CHOICES}, got {explicit!r}")
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


def writes_html(fmt: str) -> bool:
    """Return True if ``fmt`` should produce HTML."""
    return fmt in (FORMAT_HTML, FORMAT_BOTH)


def writes_pdf(fmt: str) -> bool:
    """Return True if ``fmt`` should produce PDF."""
    return fmt in (FORMAT_PDF, FORMAT_BOTH)


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


def write_single_run_pdf(data: dict[str, Any], path: Path) -> Path:
    """Write a single-run hold-test PDF (summary table + pressure/error)."""
    plt, pdf_pages = _mpl()
    path.parent.mkdir(parents=True, exist_ok=True)
    runs = data.get("runs", [])
    with pdf_pages(path) as pdf:
        _savefig(plt, pdf, _single_summary_figure(plt, data, runs))
        _savefig(plt, pdf, _overlay_figure(plt, runs, "current_mbar", "Gauge pressure (mbar)"))
        _savefig(
            plt,
            pdf,
            _overlay_figure(
                plt, runs, "error_mbar", "Error (mbar)", ylim=(-20.0, 20.0)
            ),
        )
    return path


def write_compare_pdf(runs: list[dict[str, Any]], path: Path) -> Path:
    """Write a multi-run comparison PDF (index + per-target charts)."""
    plt, pdf_pages = _mpl()
    path.parent.mkdir(parents=True, exist_ok=True)
    targets = sorted({t for run in runs for t in run.get("targets", [])})
    with pdf_pages(path) as pdf:
        _savefig(plt, pdf, _compare_index_figure(plt, runs))
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


def _run_label(run: dict[str, Any]) -> str:
    return str(run.get("run_name") or run.get("_dir") or "")


def _single_summary_figure(plt: Any, data: dict[str, Any], runs: list[dict[str, Any]]) -> Any:
    fig, ax = plt.subplots(figsize=(11.0, 8.5))
    ax.axis("off")
    fig.suptitle("Vacuum module pressure hold", fontsize=16, fontweight="bold")
    meta_lines = [
        f"Status: {data.get('status', '')}    "
        f"Run: {data.get('run_name', '')}    "
        f"{data.get('timestamp', '')}",
        str(data.get("firmware", "")),
        f"Waste: {data.get('waste_detection', '')}    "
        f"Hold: {data.get('duration_s')}s    "
        f"Sample: {data.get('sample_period_s')}s",
    ]
    fig.text(0.08, 0.88, "\n".join(meta_lines), fontsize=9, va="top", family="monospace")
    headers = [
        "Target",
        "Status",
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
        if stats.get("n"):
            table_rows.append(
                [
                    f"{run.get('target_mbar')}",
                    str(run.get("status", "")),
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
        ax.plot(xs, ys, color=color, linewidth=1.2, label=f"{run.get('target_mbar')} mbar")
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


def _compare_index_figure(plt: Any, runs: list[dict[str, Any]]) -> Any:
    fig, ax = plt.subplots(figsize=(11.0, 8.5))
    ax.axis("off")
    fig.suptitle("Pressure hold controller comparison", fontsize=16, fontweight="bold")
    headers = ["Name", "Status", "Timestamp", "Firmware"]
    rows = [
        [
            _run_label(run),
            str(run.get("status", "")),
            str(run.get("timestamp", "")),
            str(run.get("firmware", ""))[:72],
        ]
        for run in runs
    ] or [["—", "", "", ""]]
    table = ax.table(cellText=rows, colLabels=headers, loc="upper center", cellLoc="left")
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1.0, 1.3)
    ax.set_title("Runs (sorted by name)", pad=16)
    return fig


def _compare_target_figure(plt: Any, runs: list[dict[str, Any]], target: float) -> Any:
    fig, axes = plt.subplots(3, 1, figsize=(11.0, 8.5), height_ratios=[0.7, 1.2, 1.2])
    fig.suptitle(f"Target {target} mbar", fontsize=14, fontweight="bold")
    headers = ["Run", "Mean |err|", "p2p", "Stdev", "N"]
    rows = []
    for run in runs:
        hold = next(
            (item for item in run.get("runs", []) if item.get("target_mbar") == target),
            None,
        )
        stats = (hold or {}).get("stats") or {}
        if stats.get("n"):
            rows.append(
                [
                    _run_label(run),
                    f"{stats['mean_abs_err']:.2f}",
                    f"{stats.get('p2p', float('nan')):.2f}",
                    f"{stats['stdev_err']:.2f}",
                    str(stats["n"]),
                ]
            )
        else:
            rows.append([_run_label(run), "—", "—", "—", "0"])
    axes[0].axis("off")
    table = axes[0].table(
        cellText=rows or [["—", "—", "—", "—", "—"]],
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
                (item for item in run.get("runs", []) if item.get("target_mbar") == target),
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
                label=_run_label(run),
            )
        if y_key == "current_mbar":
            ax.axhline(target, color="#6b7280", linestyle="--", linewidth=0.9, label="target")
        ax.set_xlabel("t (s)")
        ax.set_ylabel(ylabel)
        if ylim is not None:
            ax.set_ylim(*ylim)
        ax.grid(True, alpha=0.3)
        ax.legend(fontsize=7, loc="best")
    fig.tight_layout()
    return fig
