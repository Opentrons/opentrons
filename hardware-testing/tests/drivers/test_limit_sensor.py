"""Limit sensor tests."""
from unittest.mock import MagicMock

import pytest
from hardware_testing.drivers import LimitSensor


@pytest.fixture
def connection() -> MagicMock:
    """The mock connection."""
    return MagicMock()


@pytest.fixture
def subject(connection: MagicMock) -> LimitSensor:
    """Test subject."""
    return LimitSensor(connection)


@pytest.mark.parametrize(
    argnames=["reading", "expected"],
    argvalues=[
        [b"OCOK\n", True],
        [b"CCOK\n", False],
        [b"BBBBB\n", False],
        [b"", False],
    ],
)
def test_is_open(
    subject: LimitSensor, connection: MagicMock, reading: bytes, expected: bool
) -> None:
    """It should parse result."""
    connection.readline.return_value = reading
    assert subject.is_open() == expected


@pytest.mark.parametrize(
    argnames=["reading", "expected"],
    argvalues=[
        [b"OCOK\n", False],
        [b"CCOK\n", True],
        [b"BBBBB\n", False],
        [b"", False],
    ],
)
def test_is_closed(
    subject: LimitSensor, connection: MagicMock, reading: bytes, expected: bool
) -> None:
    """It should parse result."""
    connection.readline.return_value = reading
    assert subject.is_closed() == expected
