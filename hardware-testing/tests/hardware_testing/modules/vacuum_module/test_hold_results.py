"""Tests for vacuum pressure hold-test JSON/CSV conversion."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from hardware_testing.modules.vacuum_module.scripts.pressure_regulation.hold_results import (
    OUTPUT_BOTH,
    OUTPUT_CSV,
    OUTPUT_JSON,
    load_results,
    load_runs_dir,
    steady_stats,
    summary_path_for,
    write_results,
)


def _sample(
    t_s: float, current: float, target: float, enabled: int = 1
) -> dict[str, Any]:
    return {
        "t_s": t_s,
        "current_mbar": current,
        "target_mbar": target,
        "error_mbar": round(current - target, 3),
        "enabled": enabled,
        "duration_remaining_s": max(0, int(10 - t_s)),
        "abs_a": 1000.0 + current,
        "abs_b": 1001.0 + current,
        "atm": 1010.2,
        "vent": 0 if enabled else 1,
    }


def _result() -> dict[str, Any]:
    duration_s = 10
    samples = [
        _sample(0.5, -2.1, -50.0),
        _sample(1.0, -40.0, -50.0),
        _sample(8.0, -51.2, -50.0),
        _sample(9.0, -50.4, -50.0),
        _sample(10.5, -2.0, 0.0, enabled=0),
    ]
    run = {
        "target_mbar": -50.0,
        "duration_s": duration_s,
        "stats": steady_stats(samples, duration_s),
        "samples": samples,
        "status": "complete",
    }
    return {
        "run_name": "unit",
        "firmware": "FW:test HW:vm SerialNo:ABC",
        "targets": [-50.0],
        "kp": 13.1,
        "ki": 4.59,
        "kd": 0.15,
        "duration_s": duration_s,
        "sample_period_s": 0.5,
        "waste_detection": "disabled (M127 E0)",
        "runs": [run],
        "status": "complete",
        "current_target_mbar": None,
        "timestamp": "2026-07-30T19:29:37Z",
    }


def _assert_same_result(original: dict[str, Any], loaded: dict[str, Any]) -> None:
    for key in (
        "run_name",
        "firmware",
        "targets",
        "kp",
        "ki",
        "kd",
        "duration_s",
        "sample_period_s",
        "waste_detection",
        "status",
        "timestamp",
    ):
        assert loaded[key] == original[key]
    assert loaded["current_target_mbar"] is None
    assert len(loaded["runs"]) == len(original["runs"])
    for src_run, dst_run in zip(original["runs"], loaded["runs"]):
        assert dst_run["target_mbar"] == src_run["target_mbar"]
        assert dst_run["duration_s"] == src_run["duration_s"]
        assert dst_run["status"] == src_run["status"]
        assert dst_run["samples"] == src_run["samples"]
        src_stats = src_run["stats"]
        dst_stats = dst_run["stats"]
        assert dst_stats["n"] == src_stats["n"]
        if src_stats["n"]:
            for stat_key in (
                "mean_current",
                "mean_err",
                "mean_abs_err",
                "stdev_err",
                "p95_abs_err",
                "max_abs_err",
            ):
                assert dst_stats[stat_key] == pytest.approx(src_stats[stat_key])


def test_json_round_trip(tmp_path: Path) -> None:
    """JSON write/load preserves the document."""
    result = _result()
    path = tmp_path / "results.json"
    write_results(result, OUTPUT_JSON, json_path=path)
    _assert_same_result(result, load_results(path))


def test_csv_round_trip(tmp_path: Path) -> None:
    """CSV write/load rebuilds metadata, samples, and stats."""
    result = _result()
    path = tmp_path / "results.csv"
    written = write_results(result, OUTPUT_CSV, csv_path=path)
    assert path in written
    assert summary_path_for(path) in written
    _assert_same_result(result, load_results(path))


def test_json_to_csv_to_json(tmp_path: Path) -> None:
    """JSON -> CSV -> JSON is lossless for the fields we store."""
    result = _result()
    json_path = tmp_path / "results.json"
    csv_path = tmp_path / "results.csv"
    write_results(result, OUTPUT_JSON, json_path=json_path)
    from_json = load_results(json_path)
    write_results(from_json, OUTPUT_CSV, csv_path=csv_path)
    _assert_same_result(result, load_results(csv_path))


def test_csv_without_summary_recomputes_stats(tmp_path: Path) -> None:
    """Samples CSV alone is enough to rebuild stats."""
    result = _result()
    csv_path = tmp_path / "results.csv"
    write_results(result, OUTPUT_CSV, csv_path=csv_path)
    summary_path_for(csv_path).unlink()
    loaded = load_results(csv_path)
    _assert_same_result(result, loaded)


def test_write_both(tmp_path: Path) -> None:
    """--output both writes JSON, samples CSV, and summary CSV."""
    result = _result()
    json_path = tmp_path / "out.json"
    csv_path = tmp_path / "out.csv"
    written = write_results(
        result, OUTPUT_BOTH, json_path=json_path, csv_path=csv_path
    )
    assert written == [json_path, csv_path, summary_path_for(csv_path)]
    _assert_same_result(result, load_results(json_path))
    _assert_same_result(result, load_results(csv_path))


def test_load_run_directory_prefers_json(tmp_path: Path) -> None:
    """A run folder with both formats loads JSON first."""
    result = _result()
    run_dir = tmp_path / "23_unit"
    run_dir.mkdir()
    write_results(
        result,
        OUTPUT_BOTH,
        json_path=run_dir / "results.json",
        csv_path=run_dir / "results.csv",
    )
    loaded = load_results(run_dir)
    _assert_same_result(result, loaded)


def test_load_runs_dir_csv_only(tmp_path: Path) -> None:
    """Compare-report loader finds CSV-only run folders."""
    result = _result()
    run_dir = tmp_path / "01_csv_only"
    run_dir.mkdir()
    write_results(result, OUTPUT_CSV, csv_path=run_dir / "results.csv")
    (tmp_path / "empty").mkdir()
    runs = load_runs_dir(tmp_path)
    assert len(runs) == 1
    assert runs[0]["_dir"] == "01_csv_only"
    _assert_same_result(result, runs[0])


def test_empty_steady_window_round_trips(tmp_path: Path) -> None:
    """A target with no steady samples keeps the note through CSV."""
    result = _result()
    result["runs"][0]["samples"] = [_sample(10.5, -2.0, -50.0, enabled=0)]
    result["runs"][0]["stats"] = steady_stats(
        result["runs"][0]["samples"], result["duration_s"]
    )
    assert result["runs"][0]["stats"]["n"] == 0
    csv_path = tmp_path / "empty.csv"
    write_results(result, OUTPUT_CSV, csv_path=csv_path)
    loaded = load_results(csv_path)
    assert loaded["runs"][0]["stats"]["n"] == 0
    assert "note" in loaded["runs"][0]["stats"]


def test_rejects_unknown_output(tmp_path: Path) -> None:
    """Unknown --output values raise ValueError."""
    with pytest.raises(ValueError, match="output must be one of"):
        write_results(_result(), "parquet", json_path=tmp_path / "x.json")


_ARCHIVE = (
    Path(__file__).resolve().parents[4]
    / "hardware_testing"
    / "modules"
    / "vacuum_module"
    / "scripts"
    / "pressure_regulation"
    / "runs"
    / "02_test_run"
    / "results.json"
)


@pytest.mark.skipif(not _ARCHIVE.exists(), reason="archived results.json not present")
def test_archived_json_csv_round_trip(tmp_path: Path) -> None:
    """An existing sweep JSON survives JSON -> CSV -> JSON."""
    original = load_results(_ARCHIVE)
    csv_path = tmp_path / "results.csv"
    write_results(original, OUTPUT_CSV, csv_path=csv_path)
    loaded = load_results(csv_path)
    assert len(loaded["runs"]) == len(original["runs"])
    for src_run, dst_run in zip(original["runs"], loaded["runs"]):
        assert dst_run["target_mbar"] == src_run["target_mbar"]
        assert len(dst_run["samples"]) == len(src_run["samples"])
        assert dst_run["samples"] == src_run["samples"]
        assert dst_run["stats"]["n"] == src_run["stats"]["n"]


def test_convert_cli_json_to_csv(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """convert_hold_results.py writes CSV next to a JSON input."""
    from hardware_testing.modules.vacuum_module.scripts.pressure_regulation.convert_hold_results import (  # noqa: E501
        main,
    )

    src = tmp_path / "results.json"
    write_results(_result(), OUTPUT_JSON, json_path=src)
    monkeypatch.setattr("sys.argv", ["convert_hold_results.py", "--input", str(src)])
    assert main() == 0
    loaded = load_results(tmp_path / "results.csv")
    _assert_same_result(_result(), loaded)
