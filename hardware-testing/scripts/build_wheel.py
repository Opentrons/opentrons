"""Build hardware-testing wheels.

The default pyproject.toml config produces a slim wheel for OT3 production builds.
Use --full to build a dev wheel that includes all subpackages except tests.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

WHEEL_SECTION_PATTERN = re.compile(
    r"\[tool\.hatch\.build\.targets\.wheel\].*?(?=\n\[tool\.hatch\.build\.targets\.sdist\])",
    re.DOTALL,
)

FULL_WHEEL_SECTION = """[tool.hatch.build.targets.wheel]
packages = ["hardware_testing"]
exclude = [
    "tests",
    "tests.*",
]

"""


def _replace_wheel_section(pyproject_text: str, *, full: bool) -> str:
    if not full:
        return pyproject_text

    if not WHEEL_SECTION_PATTERN.search(pyproject_text):
        raise RuntimeError("Could not find wheel build section in pyproject.toml")

    return WHEEL_SECTION_PATTERN.sub(FULL_WHEEL_SECTION, pyproject_text, count=1)


def build_wheel(*, full: bool) -> None:
    pyproject_path = ROOT / "pyproject.toml"
    original_text = pyproject_path.read_text(encoding="utf-8")

    if full:
        pyproject_path.write_text(
            _replace_wheel_section(original_text, full=True),
            encoding="utf-8",
        )

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