#!/usr/bin/env python3
"""Convert vacuum pressure hold-test results between JSON and CSV."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from hardware_testing.modules.vacuum_module.scripts.pressure_regulation import (
        hold_results as _hold_results,
    )
except ImportError:
    import hold_results as _hold_results  # type: ignore[no-redef,import-not-found]

load_results = _hold_results.load_results
write_csv = _hold_results.write_csv
write_json = _hold_results.write_json


def _default_output(src: Path) -> Path:
    suffix = src.suffix.lower()
    if suffix == ".json":
        return src.with_suffix(".csv")
    if suffix == ".csv":
        return src.with_suffix(".json")
    if src.is_dir():
        return src / "results.json"
    raise ValueError(f"cannot infer output path from {src}")


def main() -> int:
    """Convert a hold-test results file to the other format."""
    parser = argparse.ArgumentParser(
        description=(
            "Convert hold-test results between JSON and CSV. "
            "JSON -> CSV writes samples plus a sibling *_summary.csv. "
            "CSV -> JSON rebuilds the nested document (stats from the "
            "summary file, or recomputed from samples)."
        )
    )
    parser.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Input .json, .csv, or a run directory",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output path (default: same stem with the other suffix)",
    )
    args = parser.parse_args()
    src: Path = args.input
    if not src.exists():
        print(f"input not found: {src}", file=sys.stderr)
        return 1
    try:
        dest = args.output if args.output is not None else _default_output(src)
        data = load_results(src)
        if dest.suffix.lower() == ".csv":
            written = write_csv(data, dest)
        elif dest.suffix.lower() == ".json":
            written = [write_json(data, dest)]
        else:
            raise ValueError(f"output suffix must be .json or .csv, got {dest}")
    except (OSError, ValueError) as exc:
        print(f"convert failed: {exc}", file=sys.stderr)
        return 1
    print(f"Wrote {', '.join(str(path) for path in written)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
