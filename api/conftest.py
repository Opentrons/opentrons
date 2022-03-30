"""rootfile conftest - settings that must be in root."""
import pytest

# Options must be added at the root level for pytest to properly
# pick them up. Technically, the main conftest that we use in
# tests/opentrons is not the root level.
def pytest_addoption(parser):
    parser.addoption(
        "--ot2-only",
        action="store_true",
        help="only run OT2 based tests",
    )
