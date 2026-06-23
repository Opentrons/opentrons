"""Build hardware-testing wheels.

The default pyproject.toml config produces a slim wheel for OT3 production builds.
Use --full to build a dev wheel that includes all subpackages except tests.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path
from typing import Any

import tomli
import tomli_w

ROOT = Path(__file__).resolve().parent.parent

FULL_WHEEL_CONFIG: dict[str, Any] = {
    "packages": ["hardware_testing"],
    "exclude": ["tests", "tests.*"],
}


def _configure_full_wheel(pyproject: dict[str, Any]) -> None:
    wheel_target = pyproject["tool"]["hatch"]["build"]["targets"]["wheel"]
    force_include = wheel_target.pop("force_include", None)

    wheel_target.clear()
    wheel_target.update(FULL_WHEEL_CONFIG)

    if force_include is not None:
        wheel_target["force_include"] = force_include


def _write_pyproject(pyproject_path: Path, pyproject: dict[str, Any]) -> None:
    with pyproject_path.open("wb") as pyproject_file:
        tomli_w.dump(pyproject, pyproject_file)


def build_wheel(*, full: bool) -> None:
    pyproject_path = ROOT / "pyproject.toml"
    original_text = pyproject_path.read_text(encoding="utf-8")

    if full:
        with pyproject_path.open("rb") as pyproject_file:
            pyproject = tomli.load(pyproject_file)
        _configure_full_wheel(pyproject)
        _write_pyproject(pyproject_path, pyproject)

    try:
        subprocess.run(
            [sys.executable, "-m", "build", "--wheel", "."],
            cwd=ROOT,
            check=True,
        )
    finally:
        if full:
            pyproject_path.write_text(original_text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--full",
        action="store_true",
        help="Build a full dev wheel (all subpackages except tests).",
    )
    args = parser.parse_args()
    build_wheel(full=args.full)


if __name__ == "__main__":
    main()