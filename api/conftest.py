"""Root conftest.

Contains settings and configuration that must be in
the root of the project.
"""
import pytest

# Options must be added at the root level for pytest to properly
# pick them up. Technically, the main conftest that we use in
# tests/opentrons is not the root level.
def pytest_addoption(parser: pytest.Parser) -> None:
    """Add --ot2-only option to pytest CLI."""
    parser.addoption(
        "--ot2-only",
        action="store_true",
        help="only run OT2 based tests",
    )
