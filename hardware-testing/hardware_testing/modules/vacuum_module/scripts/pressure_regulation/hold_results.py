"""Load and save vacuum pressure hold-test results as JSON or CSV.

JSON is the canonical nested document used by the live HTML reports.
CSV is a long-form sidecar (one row per sample) plus a per-target summary,
matching the other vacuum-module bench scripts.

CSV files are rewritten atomically from the in-memory result (same as JSON).
Metadata lives in ``# key=value`` comments at the top of the samples file so
live status can stay consistent without a separate append cursor.
"""
from __future__ import annotations

import csv
import io
import json
import os
import statistics
from pathlib import Path
from typing import Any, Iterable, Optional

DEFAULT_OUT_STEM = Path("/tmp/vacuum_pressure_hold_results")
DEFAULT_JSON_PATH = DEFAULT_OUT_STEM.with_suffix(".json")
DEFAULT_CSV_PATH = DEFAULT_OUT_STEM.with_suffix(".csv")

OUTPUT_JSON = "json"
OUTPUT_CSV = "csv"
OUTPUT_BOTH = "both"
OUTPUT_CHOICES = (OUTPUT_JSON, OUTPUT_CSV, OUTPUT_BOTH)

SAMPLE_COLUMNS = [
    "run_name",
    "target_mbar",
    "t_s",
    "current_mbar",
    "commanded_target_mbar",
    "error_mbar",
    "enabled",
    "duration_remaining_s",
    "abs_a",
    "abs_b",
    "atm",
    "vent",
    "run_status",
]

SUMMARY_COLUMNS = [
    "run_name",
    "target_mbar",
    "duration_s",
    "status",
    "n",
    "mean_current",
    "mean_err",
    "mean_abs_err",
    "stdev_err",
    "p95_abs_err",
    "max_abs_err",
    "note",
]

META_KEYS = (
    "run_name",
    "firmware",
    "kp",
    "ki",
    "kd",
    "duration_s",
    "sample_period_s",
    "waste_detection",
    "status",
    "current_target_mbar",
    "timestamp",
    "targets",
)

_INT_META = frozenset({"duration_s"})
_FLOAT_META = frozenset({"kp", "ki", "kd", "sample_period_s", "current_target_mbar"})
_PREFERRED_RUN_FILES = (
    "results.json",
    "vacuum_pressure_hold_results.json",
    "results.csv",
    "vacuum_pressure_hold_results.csv",
)


def summary_path_for(csv_path: Path) -> Path:
    """Return the sibling summary CSV path for a samples CSV."""
    return csv_path.with_name(f"{csv_path.stem}_summary.csv")


def writes_json(output: str) -> bool:
    """Return True if ``output`` should produce a JSON file."""
    return output in (OUTPUT_JSON, OUTPUT_BOTH)


def writes_csv(output: str) -> bool:
    """Return True if ``output`` should produce CSV files."""
    return output in (OUTPUT_CSV, OUTPUT_BOTH)


def steady_stats(samples: list[dict[str, Any]], duration_s: int) -> dict[str, Any]:
    """Compute last-30s steady-state stats while the pump is enabled."""
    steady = [
        s
        for s in samples
        if s["t_s"] >= (duration_s - 30)
        and s["t_s"] < duration_s
        and s["enabled"] == 1
    ]
    if not steady:
        return {"n": 0, "note": "no steady samples (pump stopped early?)"}
    errs = [s["error_mbar"] for s in steady]
    currents = [s["current_mbar"] for s in steady]
    return {
        "n": len(steady),
        "mean_current": statistics.mean(currents),
        "mean_err": statistics.mean(errs),
        "mean_abs_err": statistics.mean(abs(e) for e in errs),
        "stdev_err": statistics.stdev(errs) if len(errs) > 1 else 0.0,
        "p95_abs_err": sorted(abs(e) for e in errs)[int(0.95 * (len(errs) - 1))],
        "max_abs_err": max(abs(e) for e in errs),
    }


def write_json(result: dict[str, Any], path: Path) -> Path:
    """Atomically write the nested hold-test JSON document."""
    _atomic_write_text(path, json.dumps(result))
    return path


def write_csv(
    result: dict[str, Any],
    csv_path: Path,
    summary_path: Optional[Path] = None,
) -> list[Path]:
    """Atomically write samples and summary CSVs from a result document.

    Args:
        result: Hold-test result document.
        csv_path: Samples CSV path.
        summary_path: Summary CSV path. Defaults to ``<stem>_summary.csv``.

    Returns:
        Paths that were written (samples, then summary).
    """
    if summary_path is None:
        summary_path = summary_path_for(csv_path)
    _atomic_write_text(csv_path, _samples_csv_text(result))
    _atomic_write_text(summary_path, _summary_csv_text(result))
    return [csv_path, summary_path]


def write_results(
    result: dict[str, Any],
    output: str = OUTPUT_JSON,
    json_path: Optional[Path] = None,
    csv_path: Optional[Path] = None,
    summary_path: Optional[Path] = None,
) -> list[Path]:
    """Write hold-test results in the requested format(s).

    Args:
        result: Hold-test result document.
        output: One of ``json``, ``csv``, or ``both``.
        json_path: JSON output path. Defaults to
            ``/tmp/vacuum_pressure_hold_results.json``.
        csv_path: Samples CSV path. Defaults to
            ``/tmp/vacuum_pressure_hold_results.csv``.
        summary_path: Summary CSV path. Defaults next to ``csv_path``.

    Returns:
        Paths that were written.

    Raises:
        ValueError: If ``output`` is not a supported format.
    """
    if output not in OUTPUT_CHOICES:
        raise ValueError(f"output must be one of {OUTPUT_CHOICES}, got {output!r}")
    written: list[Path] = []
    if writes_json(output):
        written.append(write_json(result, json_path or DEFAULT_JSON_PATH))
    if writes_csv(output):
        written.extend(
            write_csv(result, csv_path or DEFAULT_CSV_PATH, summary_path=summary_path)
        )
    return written


def load_json(path: Path) -> dict[str, Any]:
    """Load a hold-test JSON document."""
    return json.loads(path.read_text())


def load_csv(path: Path, summary_path: Optional[Path] = None) -> dict[str, Any]:
    """Load a hold-test document from a samples CSV (and optional summary).

    Args:
        path: Samples CSV path (``# key=value`` comments + header + rows).
        summary_path: Optional summary CSV. Defaults to the sibling
            ``*_summary.csv``. If missing, stats are recomputed from samples.

    Returns:
        Nested result document matching the JSON schema.
    """
    if summary_path is None:
        candidate = summary_path_for(path)
        summary_path = candidate if candidate.exists() else None
    text = path.read_text()
    meta = _parse_meta_comments(text)
    samples_by_target = _read_sample_rows(text)
    summary_by_target = _read_summary_rows(summary_path) if summary_path else {}
    return _assemble_result(meta, samples_by_target, summary_by_target)


def load_results(path: Path) -> dict[str, Any]:
    """Load a hold-test document from a JSON file, CSV file, or run directory.

    Directories prefer ``results.json``, then the longer JSON name, then the
    matching CSV names.

    Raises:
        FileNotFoundError: If ``path`` does not exist or a directory has no
            recognizable results file.
        ValueError: If the file suffix is not ``.json`` or ``.csv``.
    """
    if path.is_dir():
        found = discover_run_file(path)
        if found is None:
            raise FileNotFoundError(f"no hold-test results in {path}")
        return load_results(found)
    if not path.exists():
        raise FileNotFoundError(path)
    suffix = path.suffix.lower()
    if suffix == ".json":
        return load_json(path)
    if suffix == ".csv":
        return load_csv(path)
    raise ValueError(f"unsupported hold-test file type: {path}")


def discover_run_file(run_dir: Path) -> Optional[Path]:
    """Return the preferred results file in a run folder, if any."""
    for name in _PREFERRED_RUN_FILES:
        candidate = run_dir / name
        if candidate.exists():
            return candidate
    return None


def load_runs_dir(runs_dir: Path) -> list[dict[str, Any]]:
    """Load every run folder under ``runs_dir``.

    Each loaded document gets ``_dir`` set to the folder name. Missing
    ``run_name`` falls back to that folder name. Results are sorted
    case-insensitively by ``run_name``.
    """
    runs: list[dict[str, Any]] = []
    if not runs_dir.exists():
        return runs
    for child in sorted(runs_dir.iterdir(), key=lambda p: p.name.casefold()):
        if not child.is_dir():
            continue
        found = discover_run_file(child)
        if found is None:
            continue
        data = load_results(found)
        data["_dir"] = child.name
        if not data.get("run_name"):
            data["run_name"] = child.name
        runs.append(data)
    runs.sort(key=lambda r: str(r.get("run_name") or r.get("_dir") or "").casefold())
    return runs


def _atomic_write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = str(path) + ".tmp"
    with open(tmp, "w", newline="") as handle:
        handle.write(text)
    os.replace(tmp, path)


def _format_meta_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple)):
        return ",".join(str(item) for item in value)
    return str(value)


def _parse_meta_value(key: str, raw: str) -> Any:
    if raw == "":
        return None
    if key == "targets":
        return [float(part) for part in raw.split(",") if part != ""]
    if key in _INT_META:
        return int(float(raw))
    if key in _FLOAT_META:
        return float(raw)
    return raw


def _parse_meta_comments(text: str) -> dict[str, Any]:
    meta: dict[str, Any] = {}
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped.startswith("#"):
            continue
        body = stripped[1:].strip()
        if "=" not in body:
            continue
        key, raw = body.split("=", 1)
        key = key.strip()
        if key in META_KEYS:
            meta[key] = _parse_meta_value(key, raw.strip())
    return meta


def _samples_csv_text(result: dict[str, Any]) -> str:
    buf = io.StringIO()
    for key in META_KEYS:
        if key not in result:
            continue
        buf.write(f"# {key}={_format_meta_value(result[key])}\n")
    writer = csv.DictWriter(buf, fieldnames=SAMPLE_COLUMNS, lineterminator="\n")
    writer.writeheader()
    run_name = result.get("run_name", "")
    for run in result.get("runs", []):
        run_status = run.get("status", "")
        target = run.get("target_mbar")
        for sample in run.get("samples", []):
            writer.writerow(
                {
                    "run_name": run_name,
                    "target_mbar": target,
                    "t_s": sample.get("t_s"),
                    "current_mbar": sample.get("current_mbar"),
                    "commanded_target_mbar": sample.get("target_mbar"),
                    "error_mbar": sample.get("error_mbar"),
                    "enabled": sample.get("enabled"),
                    "duration_remaining_s": sample.get("duration_remaining_s"),
                    "abs_a": sample.get("abs_a"),
                    "abs_b": sample.get("abs_b"),
                    "atm": sample.get("atm"),
                    "vent": sample.get("vent"),
                    "run_status": run_status,
                }
            )
    return buf.getvalue()


def _summary_cell(stats: dict[str, Any], key: str) -> Any:
    if key == "n":
        return stats.get("n", 0)
    if key == "note":
        return stats.get("note", "")
    if not stats.get("n"):
        return ""
    return stats.get(key, "")


def _summary_csv_text(result: dict[str, Any]) -> str:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=SUMMARY_COLUMNS, lineterminator="\n")
    writer.writeheader()
    run_name = result.get("run_name", "")
    for run in result.get("runs", []):
        stats = run.get("stats") or {}
        writer.writerow(
            {
                "run_name": run_name,
                "target_mbar": run.get("target_mbar"),
                "duration_s": run.get("duration_s", result.get("duration_s")),
                "status": run.get("status", ""),
                "n": _summary_cell(stats, "n"),
                "mean_current": _summary_cell(stats, "mean_current"),
                "mean_err": _summary_cell(stats, "mean_err"),
                "mean_abs_err": _summary_cell(stats, "mean_abs_err"),
                "stdev_err": _summary_cell(stats, "stdev_err"),
                "p95_abs_err": _summary_cell(stats, "p95_abs_err"),
                "max_abs_err": _summary_cell(stats, "max_abs_err"),
                "note": _summary_cell(stats, "note"),
            }
        )
    return buf.getvalue()


def _to_float(value: str) -> Optional[float]:
    if value == "":
        return None
    return float(value)


def _to_int(value: str) -> Optional[int]:
    if value == "":
        return None
    return int(float(value))


def _csv_data_lines(text: str) -> Iterable[str]:
    for line in text.splitlines():
        if line.startswith("#"):
            continue
        yield line


def _read_sample_rows(text: str) -> dict[float, list[dict[str, Any]]]:
    reader = csv.DictReader(_csv_data_lines(text))
    by_target: dict[float, list[dict[str, Any]]] = {}
    for row in reader:
        raw_target = row.get("target_mbar", "")
        if raw_target == "":
            continue
        target = float(raw_target)
        sample = {
            "t_s": float(row["t_s"]),
            "current_mbar": float(row["current_mbar"]),
            "target_mbar": float(row["commanded_target_mbar"]),
            "error_mbar": float(row["error_mbar"]),
            "enabled": _to_int(row.get("enabled", "")) or 0,
            "duration_remaining_s": _to_int(row.get("duration_remaining_s", "")) or 0,
            "abs_a": float(row["abs_a"]),
            "abs_b": float(row["abs_b"]),
            "atm": float(row["atm"]),
            "vent": _to_int(row.get("vent", "")) or 0,
            "_run_status": row.get("run_status", ""),
        }
        by_target.setdefault(target, []).append(sample)
    return by_target


def _read_summary_rows(path: Path) -> dict[float, dict[str, Any]]:
    by_target: dict[float, dict[str, Any]] = {}
    with path.open(newline="") as handle:
        for row in csv.DictReader(handle):
            raw_target = row.get("target_mbar", "")
            if raw_target == "":
                continue
            target = float(raw_target)
            n = _to_int(row.get("n", "")) or 0
            stats: dict[str, Any] = {"n": n}
            if n:
                for key in (
                    "mean_current",
                    "mean_err",
                    "mean_abs_err",
                    "stdev_err",
                    "p95_abs_err",
                    "max_abs_err",
                ):
                    parsed = _to_float(row.get(key, ""))
                    if parsed is not None:
                        stats[key] = parsed
            note = row.get("note", "")
            if note:
                stats["note"] = note
            by_target[target] = {
                "duration_s": _to_int(row.get("duration_s", "")),
                "status": row.get("status", ""),
                "stats": stats,
            }
    return by_target


def _target_order(
    meta: dict[str, Any],
    samples_by_target: dict[float, list[dict[str, Any]]],
    summary_by_target: dict[float, dict[str, Any]],
) -> list[float]:
    targets = meta.get("targets")
    if isinstance(targets, list) and targets:
        return [float(t) for t in targets]
    seen: list[float] = []
    for target in list(samples_by_target) + list(summary_by_target):
        if target not in seen:
            seen.append(target)
    return seen


def _assemble_result(
    meta: dict[str, Any],
    samples_by_target: dict[float, list[dict[str, Any]]],
    summary_by_target: dict[float, dict[str, Any]],
) -> dict[str, Any]:
    duration_s = int(meta.get("duration_s") or 0)
    runs: list[dict[str, Any]] = []
    for target in _target_order(meta, samples_by_target, summary_by_target):
        samples = samples_by_target.get(target, [])
        summary = summary_by_target.get(target, {})
        run_duration = summary.get("duration_s") or duration_s
        status = summary.get("status") or ""
        if not status and samples:
            status = str(samples[-1].get("_run_status") or "")
        stats = summary.get("stats")
        if not stats:
            stats = (
                steady_stats(samples, int(run_duration))
                if samples
                else {"n": 0, "note": "no steady samples (pump stopped early?)"}
            )
        clean_samples = []
        for sample in samples:
            cleaned = dict(sample)
            cleaned.pop("_run_status", None)
            clean_samples.append(cleaned)
        runs.append(
            {
                "target_mbar": target,
                "duration_s": run_duration,
                "stats": stats,
                "samples": clean_samples,
                "status": status or ("complete" if clean_samples else ""),
            }
        )
    result = dict(meta)
    if "targets" not in result:
        result["targets"] = [run["target_mbar"] for run in runs]
    result["runs"] = runs
    return result
