"""Optional entry point — forwards to pytest (prefer running `pytest` directly)."""

from __future__ import annotations

import sys

import bootstrap  # noqa: F401


def main(argv: list[str] | None = None) -> int:
    import pytest

    args = argv if argv is not None else sys.argv[1:]
    return pytest.main(args or ["tests/nav"])


if __name__ == "__main__":
    raise SystemExit(main())
