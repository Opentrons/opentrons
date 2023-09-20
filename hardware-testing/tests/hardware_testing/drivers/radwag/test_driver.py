"""Radwag driver tests."""

from typing import List
from unittest.mock import MagicMock, mock_open, patch

import pytest

from hardware_testing.drivers import RadwagScale


@pytest.fixture
def scale_connection() -> MagicMock:
    """Mock scale connection."""
    mm = MagicMock()

    def _write(b: bytes) -> int:
        return len(b)

    mm.write.side_effect = _write
    return mm


@pytest.fixture
def subject(scale_connection: MagicMock) -> RadwagScale:
    """Test subject."""
    with patch("builtins.open", mock_open()):
        return RadwagScale(connection=scale_connection)


def create_radwag_result_line(
    command: str, val: float, stability_char: str = " "
) -> bytes:
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
    return f"{command:3s}{stability_char[0]} {sign}{str(abs(val)).rjust(9)} {'g':3s}\r\n".encode()


@pytest.mark.parametrize(
    argnames="masses,expected",
    argvalues=[
        # All the same
        [[5.5, 5.5, 5.5, 5.5], [(5.5, True), (5.5, True), (5.5, True), (5.5, True)]],
        # Remove outlier
        [[1.0, 12.0, 1.0], [(1.0, True), (12.0, True), (1.0, True)]],
    ],
)
def test_read_mass(
    subject: RadwagScale,
    scale_connection: MagicMock,
    masses: List[float],
    expected: List[tuple],
) -> None:
    """It should read the mass and return the average."""
    scale_connection.readline.side_effect = [
        create_radwag_result_line("SI", v) for v in masses
    ]

    mass = [subject.read_mass() for _ in range(len(masses))]

    assert mass == expected
    assert scale_connection.readline.call_count == len(masses)
