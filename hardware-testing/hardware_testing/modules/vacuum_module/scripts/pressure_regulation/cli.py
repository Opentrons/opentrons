#!/usr/bin/env python3
"""Host CLI for vacuum pressure hold-test reports and conversion."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Optional, Sequence

try:
    from hardware_testing.modules.vacuum_module.scripts.pressure_regulation import (
        hold_results,
        reports,
    )
except ImportError:
    import hold_results  # type: ignore[no-redef,import-not-found]
    import reports  # type: ignore[no-redef,import-not-found]


_MODULE_PROG = (
    "python3 -m hardware_testing.modules.vacuum_module.scripts.pressure_regulation"
)


def build_parser(prog: Optional[str] = None) -> argparse.ArgumentParser:
    """Build the host CLI parser with report, compare, and convert subcommands."""
    if prog is None and Path(sys.argv[0]).name == "__main__.py":
        prog = _MODULE_PROG
    parser = argparse.ArgumentParser(
        prog=prog,
        description=(
            "Host tools for vacuum pressure hold-test results: "
            "single-run report, multi-run compare, and JSON/CSV convert."
        ),
    )
    sub = parser.add_subparsers(dest="command", required=True)

    report = sub.add_parser(
        "report",
        help="Build a single-run HTML and/or PDF report",
        description=(
            "Build an HTML and/or PDF report from vacuum pressure hold results"
        ),
    )
    reports.add_report_arguments(report)
    report.set_defaults(_run=reports.run_report)

    compare = sub.add_parser(
        "compare",
        help="Build a multi-run comparison HTML and/or PDF",
        description=(
            "Build multi-run comparison HTML and/or PDF from saved sweep result files"
        ),
    )
    reports.add_compare_arguments(compare)
    compare.set_defaults(_run=reports.run_compare)

    convert = sub.add_parser(
        "convert",
        help="Convert hold-test results between JSON and CSV",
        description=(
            "Convert hold-test results between JSON and CSV. "
            "JSON -> CSV writes samples plus a sibling *_summary.csv. "
            "CSV -> JSON rebuilds the nested document (stats from the "
            "summary file, or recomputed from samples)."
        ),
    )
    convert.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Input .json, .csv, or a run directory",
    )
    convert.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output path (default: same stem with the other suffix)",
    )
    convert.set_defaults(_run=run_convert)

    return parser


def run_convert(args: argparse.Namespace) -> int:
    """Convert a hold-test results file to the other format."""
    src: Path = args.input
    if not src.exists():
        print(f"input not found: {src}", file=sys.stderr)
        return 1
    try:
        dest = args.output if args.output is not None else _default_convert_output(src)
        data = hold_results.load_results(src)
        if dest.suffix.lower() == ".csv":
            written = hold_results.write_csv(data, dest)
        elif dest.suffix.lower() == ".json":
            written = [hold_results.write_json(data, dest)]
        else:
            raise ValueError(f"output suffix must be .json or .csv, got {dest}")
    except (OSError, ValueError) as exc:
        print(f"convert failed: {exc}", file=sys.stderr)
        return 1
    print(f"Wrote {', '.join(str(path) for path in written)}")
    return 0


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Parse argv and run the selected host subcommand."""
    args = build_parser().parse_args(argv)
    return int(args._run(args))


def _default_convert_output(src: Path) -> Path:
    suffix = src.suffix.lower()
    if suffix == ".json":
        return src.with_suffix(".csv")
    if suffix == ".csv":
        return src.with_suffix(".json")
    if src.is_dir():
        return src / "results.json"
    raise ValueError(f"cannot infer output path from {src}")


if __name__ == "__main__":
    raise SystemExit(main())
