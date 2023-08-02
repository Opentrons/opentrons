"""Asair sensor tests."""
from unittest.mock import MagicMock

import pytest
from hardware_testing.drivers.asair_sensor import Reading, AsairSensor


@pytest.fixture
def connection() -> MagicMock:
    """The mock connection."""
    return MagicMock()


@pytest.fixture
def subject(connection: MagicMock) -> AsairSensor:
    """Test subject."""
    return AsairSensor(connection)


def test_reading(subject: AsairSensor, connection: MagicMock) -> None:
    """It should return a reading."""
    data = b"\x00\x00\x00" + b"\x00\x0a" + b"\x00\x1e"
    connection.read.return_value = data
    connection.inWaiting.return_value = len(data)
    assert subject.get_reading() == Reading(
        1.0,
        3.0,
    )

    connection.write.assert_called_once_with(b"\x01\x03\x00\x00\x00\x02\xC4\x0b")
