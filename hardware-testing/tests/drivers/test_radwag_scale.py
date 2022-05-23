"""Radwag driver tests."""

from typing import List
from unittest.mock import MagicMock

import pytest

from hardware_testing.drivers import RadwagScale


@pytest.fixture
def scale_connection() -> MagicMock:
    """Mock scale connection."""
    return MagicMock()


@pytest.fixture
def subject(scale_connection: MagicMock) -> RadwagScale:
    """Test subject."""
    r = RadwagScale()
    r._scale = scale_connection
    return r


def create_radwag_result_line(command: str, val: float) -> bytes:
    """Create a radwag protocol line."""
    sign = " "
    # TODO (amit, 2022-05-20): Add sign to tests.
    # if val > 0:
    #     sign = '+'
    # elif val < 0:
    #     sign = '-'

    # Format breakdown
    # 0-2 = command
    # 3 = stability
    # 5 = sign
    # 6-14 = data
    # 16-18 = unit
    return f"{command:3s}? {sign}{str(abs(val)).rjust(9)} {'g':3s}".encode()


@pytest.mark.parametrize(
    argnames="masses,expected",
    argvalues=[
        # All the same
        [[5.5, 5.5, 5.5, 5.5], 5.5],
        # Remove outlier
        [[1.0, 12.0, 1.0], 1.0],
    ],
)
def test_read_mass(
    subject: RadwagScale,
    scale_connection: MagicMock,
    masses: List[float],
    expected: float,
) -> None:
    """It should read the mass and return the average."""
    scale_connection.readline.side_effect = [
        create_radwag_result_line("SI", v) for v in masses
    ]

    mass = subject.read_mass(samples=len(masses))

    assert mass == expected
    assert scale_connection.readline.call_count == len(masses)
