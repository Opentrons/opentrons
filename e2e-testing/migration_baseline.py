"""Copy a versioned migration export into a baseline folder.

This is a small utility to promote an export run (e.g. prod 8.7.1) into a
stable baseline directory for later diffs.

Defaults:
- Source: e2e-testing/migration-report/8.7.1/exports
- Dest:   e2e-testing/migration-report/baseline/exports

You can override the destination folder name (under migration-report/) via
`MIGRATION_BASELINE_DEST_FOLDER` (or CLI `--dest-folder`).

This script intentionally operates on directories only; it does not attempt to
validate protocol contents.

Note: This script copies the `exports/` directory; it does not delete the
source.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


def _e2e_root() -> Path:
    return Path(__file__).resolve().parent


def _migration_report_root() -> Path:
    return _e2e_root() / "migration-report"


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Promote a migration export to baseline")
    parser.add_argument(
        "--source-folder",
        required=True,
        help=(
            "Source folder under migration-report (e.g. '8.7.1' or '8.8.0-alpha.7'). "
            "The script will use <source-folder>/exports as the source path."
        ),
    )
    parser.add_argument(
        "--dest-folder",
        default="baseline",
        help=(
            "Destination folder under migration-report. Exported files will end up in "
            "<dest-folder>/exports (default: baseline)."
        ),
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="If set, delete any existing destination exports directory before moving.",
    )
    return parser.parse_args()


def copy_exports(*, source_folder: str, dest_folder: str, overwrite: bool) -> tuple[Path, Path]:
    """Copy exports directory from a version folder into a baseline folder.

    Returns (src_exports_dir, dest_exports_dir).
    """

    report_root = _migration_report_root()

    src_exports_dir = report_root / source_folder / "exports"
    if not src_exports_dir.exists() or not src_exports_dir.is_dir():
        raise RuntimeError(f"Source exports directory does not exist: {src_exports_dir}")

    dest_exports_dir = report_root / dest_folder / "exports"
    dest_exports_dir.parent.mkdir(parents=True, exist_ok=True)

    if dest_exports_dir.exists():
        if not overwrite:
            raise RuntimeError(
                "Destination exports directory already exists. "
                "Re-run with --overwrite to replace it: "
                f"{dest_exports_dir}"
            )
        shutil.rmtree(dest_exports_dir)

    shutil.copytree(src_exports_dir, dest_exports_dir)
    return src_exports_dir, dest_exports_dir


def main() -> None:
    args = _parse_args()
    src, dest = copy_exports(
        source_folder=args.source_folder,
        dest_folder=args.dest_folder,
        overwrite=bool(args.overwrite),
    )
    print("Copied exports")
    print(f"- From: {src}")
    print(f"- To:   {dest}")


if __name__ == "__main__":
    main()
