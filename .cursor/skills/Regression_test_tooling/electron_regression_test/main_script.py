"""Optional entry point — forwards to pytest (prefer running `pytest` directly)."""

from __future__ import annotations

import sys

import bootstrap  # noqa: F401
from automation.helpers.cli_args import inject_robot_profile_or_name_arg


def main(argv: list[str] | None = None) -> int:
    """Forward CLI arguments to pytest, defaulting to the full suite when empty."""
    import pytest

    args = list(argv if argv is not None else sys.argv[1:])
    if not args:
        args = ["tests/"]
    else:
        inject_robot_profile_or_name_arg(args)
    return pytest.main(args)


if __name__ == "__main__":
    raise SystemExit(main())
