import pytest
from mock import AsyncMock, call

from opentrons.drivers.asyncio.communication.async_serial import AsyncSerial
from opentrons.drivers.asyncio.communication.serial_connection import (
    SerialConnection, NoResponse
)


@pytest.fixture
def mock_serial_port() -> AsyncMock:
    return AsyncMock(spec=AsyncSerial)


@pytest.fixture
def ack() -> str:
    return "ack"


@pytest.fixture
def subject(mock_serial_port: AsyncMock, ack: str) -> SerialConnection:
    return SerialConnection(serial=mock_serial_port,
                            ack=ack,
                            name="name",
                            port="port")


async def test_send_command(mock_serial_port: AsyncMock,
                            subject: SerialConnection,
                            ack: str) -> None:
    """It should send a command and return response."""
    serial_response = "response data " + ack
    mock_serial_port.read_until.return_value = serial_response.encode()

    response = await subject.send_command(data="send data")

    mock_serial_port.write.assert_called_once_with(data=b"send data")
    assert response == serial_response
    mock_serial_port.read_until.assert_called_once_with(match=ack.encode())


async def test_send_command_with_retry(mock_serial_port: AsyncMock,
                                       subject: SerialConnection,
                                       ack: str) -> None:
    """It should retry sending after a read failure."""
    serial_response = "response data " + ack
    mock_serial_port.read_until.side_effect = (b"", serial_response.encode())

    response = await subject.send_command(data="send data", retries=1)

    mock_serial_port.write.assert_has_calls(
        calls=[call(data=b"send data"), call(data=b"send data")])
    assert response == serial_response
    mock_serial_port.read_until.assert_has_calls(
        calls=[call(match=ack.encode()), call(match=ack.encode())])


async def test_send_command_with_retry_exhausted(mock_serial_port: AsyncMock,
                                                 subject: SerialConnection) -> None:
    """It should raise after retries exhausted."""
    mock_serial_port.read_until.side_effect = (b"", b"", b"")

    with pytest.raises(NoResponse):
        await subject.send_command(data="send data", retries=2)
