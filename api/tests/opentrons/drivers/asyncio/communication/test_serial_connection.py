from typing import Type

import pytest
from mock import AsyncMock, call

from opentrons.drivers.asyncio.communication.async_serial import AsyncSerial
from opentrons.drivers.asyncio.communication.serial_connection import (
    SerialConnection, NoResponse, ErrorResponse, AlarmResponse
)


@pytest.fixture
def mock_serial_port() -> AsyncMock:
    return AsyncMock(spec=AsyncSerial)


@pytest.fixture
def ack() -> str:
    return "ack"


@pytest.fixture
def subject(mock_serial_port: AsyncMock, ack: str) -> SerialConnection:
    """Create the test subject."""
    # No need to sleep during retries.
    SerialConnection.RETRY_WAIT_TIME = 0
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


@pytest.mark.parametrize(
    argnames=["response", "exception_type"],
    argvalues=[
        ["error", ErrorResponse],
        ["Error", ErrorResponse],
        ["Error: was found.", ErrorResponse],
        ["alarm", AlarmResponse],
        ["ALARM", AlarmResponse],
        ["This is an Alarm", AlarmResponse],
    ]
)
def test_raise_on_error(response: str, exception_type: Type[Exception]) -> None:
    """It should raise an exception on error/alarm responses."""
    with pytest.raises(expected_exception=exception_type, match=response):
        SerialConnection.raise_on_error(response)


async def test_on_retry(mock_serial_port: AsyncMock,
                        subject: SerialConnection) -> None:
    """It should try to re-open connection."""
    await subject._on_retry()

    mock_serial_port.close.assert_called_once()
    mock_serial_port.open.assert_called_once()
