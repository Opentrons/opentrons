"""Tests for hold-test HTML/PDF report format selection."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from hardware_testing.modules.vacuum_module.scripts.pressure_regulation.hold_results import (
    steady_stats,
)
from hardware_testing.modules.vacuum_module.scripts.pressure_regulation.report_format import (
    FORMAT_BOTH,
    FORMAT_HTML,
    FORMAT_PDF,
    infer_format,
    output_paths,
    write_compare_pdf,
    write_single_run_pdf,
    write_waiting_pdf,
)


def test_infer_format_from_suffix() -> None:
    """A .pdf output path selects PDF when --format is omitted."""
    assert infer_format(Path("index.html")) == FORMAT_HTML
    assert infer_format(Path("index.pdf")) == FORMAT_PDF


def test_explicit_format_wins() -> None:
    """--format overrides the output suffix."""
    assert infer_format(Path("index.html"), FORMAT_PDF) == FORMAT_PDF
    assert infer_format(Path("index.pdf"), FORMAT_BOTH) == FORMAT_BOTH


def test_output_paths_both() -> None:
    """--format both writes sibling html and pdf paths."""
    paths = output_paths(Path("/tmp/index.html"), FORMAT_BOTH)
    assert paths[FORMAT_HTML] == Path("/tmp/index.html")
    assert paths[FORMAT_PDF] == Path("/tmp/index.pdf")


def test_rejects_unknown_format() -> None:
    """Unknown --format values raise ValueError."""
    with pytest.raises(ValueError, match="format must be one of"):
        infer_format(Path("index.html"), "docx")


def _result() -> dict[str, Any]:
    samples = [
        {
            "t_s": t,
            "current_mbar": -50.0 + (t - 5.0),
            "target_mbar": -50.0,
            "error_mbar": t - 5.0,
            "enabled": 1,
            "duration_remaining_s": 0,
            "abs_a": 960.0,
            "abs_b": 961.0,
            "atm": 1010.0,
            "vent": 0,
        }
        for t in (1.0, 5.0, 9.0)
    ]
    return {
        "run_name": "unit",
        "firmware": "FW:test",
        "targets": [-50.0],
        "duration_s": 10,
        "sample_period_s": 0.5,
        "waste_detection": "disabled",
        "status": "complete",
        "timestamp": "2026-08-12T00:00:00Z",
        "runs": [
            {
                "target_mbar": -50.0,
                "duration_s": 10,
                "status": "complete",
                "stats": steady_stats(samples, 10),
                "samples": samples,
            }
        ],
    }


def test_write_single_run_pdf(tmp_path: Path) -> None:
    """Single-run PDF is a non-empty %PDF file."""
    path = tmp_path / "index.pdf"
    write_single_run_pdf(_result(), path)
    data = path.read_bytes()
    assert data.startswith(b"%PDF")
    assert path.stat().st_size > 500


def test_write_compare_pdf(tmp_path: Path) -> None:
    """Compare PDF is a non-empty %PDF file."""
    result = _result()
    result["_dir"] = "01_unit"
    path = tmp_path / "compare.pdf"
    write_compare_pdf([result], path)
    data = path.read_bytes()
    assert data.startswith(b"%PDF")
    assert path.stat().st_size > 500


def test_write_waiting_pdf(tmp_path: Path) -> None:
    """Placeholder PDF is a valid PDF."""
    path = tmp_path / "wait.pdf"
    write_waiting_pdf(path)
    assert path.read_bytes().startswith(b"%PDF")
