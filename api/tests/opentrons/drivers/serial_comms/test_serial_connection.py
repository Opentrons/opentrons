import pytest
from mock import AsyncMock, call

from opentrons.drivers.serial_comms.async_serial import AsyncSerial
from opentrons.drivers.serial_comms.serial_connection import SerialConnection, \
    NoResponse


@pytest.fixture
def mock_serial_port() -> AsyncMock:
    return AsyncMock(spec=AsyncSerial)


@pytest.fixture
def subject(mock_serial_port: AsyncMock) -> SerialConnection:
    return SerialConnection(mock_serial_port)


async def test_send_command(mock_serial_port: AsyncMock,
                            subject: SerialConnection) -> None:
    """It should send a command and return response."""
    mock_serial_port.read_until.return_value = b"response data"

    response = await subject.send_command(data=b"send data", terminator=b"ack")

    mock_serial_port.write.assert_called_once_with(data=b"send data")
    assert response == b"response data"
    mock_serial_port.read_until.assert_called_once_with(match=b"ack")


async def test_send_command_with_retry(mock_serial_port: AsyncMock,
                                       subject: SerialConnection) -> None:
    """It should retry sending after a read failure."""
    mock_serial_port.read_until.side_effect = (b"", b"response data ack")

    response = await subject.send_command_with_retries(data=b"send data",
                                                       terminator=b"ack",
                                                       retries=1)

    mock_serial_port.write.assert_has_calls(
        calls=[call(data=b"send data"), call(data=b"send data")])
    assert response == b"response data ack"
    mock_serial_port.read_until.assert_has_calls(
        calls=[call(match=b"ack"), call(match=b"ack")])


async def test_send_command_with_retry_exhausted(mock_serial_port: AsyncMock,
                                                 subject: SerialConnection) -> None:
    """It should raise after retries exhausted."""
    mock_serial_port.read_until.side_effect = (b"", b"", b"")

    with pytest.raises(NoResponse):
        await subject.send_command_with_retries(data=b"send data",
                                                terminator=b"ack",
                                                retries=2)
