from typing import AsyncGenerator, Callable, Type, Union
from unittest.mock import patch

import mock
import pytest
from _pytest.fixtures import SubRequest
from mock import AsyncMock, call

from opentrons.drivers.asyncio.communication.async_serial import AsyncSerial
from opentrons.drivers.asyncio.communication.errors import (
    AlarmResponse,
    BaseErrorCode,
    DefaultErrorCodes,
    ErrorResponse,
    NoResponse,
    UnhandledGcode,
)
from opentrons.drivers.asyncio.communication.serial_connection import (
    AsyncResponseSerialConnection,
    SerialConnection,
    SerialResponse,
)


@pytest.fixture
def mock_serial_port() -> AsyncMock:
    return AsyncMock(spec=AsyncSerial)


@pytest.fixture
def ack() -> str:
    return "ack"


SerialKind = Union[AsyncResponseSerialConnection, SerialConnection]


# Async because SerialConnection.__init__() needs an event loop,
# so this fixture needs to run in an event loop.
@pytest.fixture(
    params=[AsyncResponseSerialConnection, SerialConnection],
)
async def subject(
    request: SubRequest, mock_serial_port: AsyncMock, ack: str
) -> SerialKind:
    """Create the test subject."""
    serial_class = request.param
    serial_class.RETRY_WAIT_TIME = 0
    if serial_class == AsyncResponseSerialConnection:
        return serial_class(  # type: ignore[no-any-return]
            serial=mock_serial_port,
            ack=ack,
            name="name",
            port="port",
            retry_wait_time_seconds=0,
            error_keyword="err",
            alarm_keyword="alarm",
            async_error_ack="async",
            error_codes=DefaultErrorCodes,
        )
    elif serial_class == SerialConnection:
        return serial_class(  # type: ignore[no-any-return]
            serial=mock_serial_port,
            ack=ack,
            name="name",
            port="port",
            retry_wait_time_seconds=0,
            error_keyword="error",
            alarm_keyword="alarm",
        )
    else:
        raise AssertionError(f"Unexpected serial_class: {serial_class}")


@pytest.fixture
async def async_subject(
    mock_serial_port: AsyncMock, ack: str
) -> AsyncResponseSerialConnection:
    """Create the test async subject."""
    AsyncResponseSerialConnection.RETRY_WAIT_TIME = 0  # type: ignore[attr-defined]
    return AsyncResponseSerialConnection(
        serial=mock_serial_port,
        ack=ack,
        name="name",
        port="port",
        retry_wait_time_seconds=0,
        error_keyword="err",
        alarm_keyword="alarm",
        async_error_ack="async",
    )


@pytest.fixture
async def subject_raise_on_error_patched(
    async_subject: AsyncResponseSerialConnection,
) -> AsyncGenerator[AsyncResponseSerialConnection, None]:
    raise_on_error_mock = mock.MagicMock()
    with mock.patch.object(async_subject, "raise_on_error", raise_on_error_mock):
        yield async_subject


async def test_send_command(
    mock_serial_port: AsyncMock, subject: SerialKind, ack: str
) -> None:
    """It should send a command."""
    serial_response = "response data " + ack
    mock_serial_port.read_until.return_value = serial_response.encode()

    await subject.send_data(data="send data")

    mock_serial_port.timeout_override.assert_called_once_with("timeout", None)
    mock_serial_port.write.assert_called_once_with(data=b"send data")
    mock_serial_port.read_until.assert_called_once_with(match=ack.encode())


async def test_send_command_with_retry(
    mock_serial_port: AsyncMock, subject: SerialKind, ack: str
) -> None:
    """It should retry sending after a read failure."""
    serial_response = "response data " + ack
    mock_serial_port.read_until.side_effect = (b"", serial_response.encode())

    await subject.send_data(data="send data", retries=1)

    mock_serial_port.timeout_override.assert_called_once_with("timeout", None)
    mock_serial_port.write.assert_has_calls(
        calls=[call(data=b"send data"), call(data=b"send data")]
    )
    mock_serial_port.read_until.assert_has_calls(
        calls=[
            call(match=ack.encode()),
            call(match=ack.encode()),
        ]
    )


async def test_send_command_with_zero_retries(
    mock_serial_port: AsyncMock, async_subject: AsyncResponseSerialConnection, ack: str
) -> None:
    """It should a command once"""
    mock_serial_port.read_until.side_effect = (b"", b"")

    # Set the default number of retries to 1, we want to overide this with
    # the retries from the subject.send_data(data, retries=0) method call.
    async_subject._number_of_retries = 1

    with patch("os.path.exists") as mock_exists:
        mock_exists.return_value = True
        with pytest.raises(NoResponse):
            # We want this to overwrite the internal `_number_of_retries`
            await async_subject.send_data(data="send data", retries=0)

    mock_serial_port.timeout_override.assert_called_once_with("timeout", None)
    mock_serial_port.write.assert_called_once_with(data=b"send data")
    mock_serial_port.read_until.assert_called_once_with(match=ack.encode())
    mock_serial_port.close.assert_called_once()
    mock_serial_port.open.assert_called_once()


async def test_send_command_with_retry_exhausted(
    mock_serial_port: AsyncMock, subject: SerialKind
) -> None:
    """It should raise after retries exhausted."""
    mock_serial_port.read_until.side_effect = (b"", b"", b"")

    with pytest.raises(NoResponse):
        await subject.send_data(data="send data", retries=2)


async def test_send_command_response(
    mock_serial_port: AsyncMock, subject: SerialKind, ack: str
) -> None:
    """It should return response without the ack and stripped."""
    response_data = "response data"
    serial_response = f" {response_data}  {ack}"
    mock_serial_port.read_until.return_value = serial_response.encode()

    response = await subject.send_data(data="send data")

    assert response == response_data


@pytest.mark.parametrize(
    argnames=["response", "exception_type", "async_only"],
    argvalues=[
        ["error", ErrorResponse, False],
        ["Error", ErrorResponse, False],
        ["Error: was found.", ErrorResponse, False],
        ["alarm", AlarmResponse, False],
        ["ALARM", AlarmResponse, False],
        ["This is an Alarm", AlarmResponse, False],
        ["error:Alarm lock", AlarmResponse, False],
        ["alarm:error", AlarmResponse, False],
        ["ALARM: Hard limit -X", AlarmResponse, False],
        ["ERR003:unhandled gcode OK ", UnhandledGcode, True],
    ],
)
def test_raise_on_error(
    subject: SerialKind,
    response: str,
    exception_type: Type[Exception],
    async_only: bool,
) -> None:
    """It should raise an exception on error/alarm responses."""
    if isinstance(subject, SerialConnection) and async_only:
        pytest.skip()
    with pytest.raises(expected_exception=exception_type, match=response):
        subject.raise_on_error(response, "fake request")


def test_raise_on_error_no_raise_on_keyword_in_body(
    subject: SerialKind,
) -> None:
    """It should not raise when there is a keyword in the response body."""
    request = "M226 Z"
    # This response contains `eRR` which tricks the system into thinking there is an
    # error, we fixed this by making sure the request and response gcodes match.
    response = "M226 Z I:12 D:gW2ACQuAAAAAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAAAAAAAAAAAAA"
    "AAAAAAAAAAAAAAAAAAAACPbxeRRikcFhINCQYFBAICAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    subject.raise_on_error(response, request)

    # This should still raise
    with pytest.raises(expected_exception=ErrorResponse, match="error"):
        subject.raise_on_error("error", request)


def test_get_error_codes_lowercase(
    subject: SerialKind,
) -> None:
    """It should return an error code dictionary keyed by lowercase value."""
    lowercase_result = subject._error_codes.get_error_codes()
    assert lowercase_result == {"err003": DefaultErrorCodes.UNHANDLED_GCODE}


async def test_on_retry(mock_serial_port: AsyncMock, subject: SerialKind) -> None:
    """It should try to re-open connection."""
    with patch("os.path.exists") as mock_exists:
        mock_exists.return_value = True
        await subject.on_retry()

    mock_serial_port.close.assert_called_once()
    mock_serial_port.open.assert_called_once()


async def test_send_data_with_async_error_before(
    mock_serial_port: AsyncMock,
    subject_raise_on_error_patched: AsyncResponseSerialConnection,
    ack: str,
) -> None:
    """It should return response without the ack and stripped. It should also handle the async error."""
    error_response = "async ERR106:main motor:speedsensor failed"
    serial_error_response = f" {error_response}  {ack}"
    encoded_error_response = serial_error_response.encode()
    successful_response = "G28"
    data = "G28"
    serial_successful_response = f" {successful_response}  {ack}"
    encoded_successful_response = serial_successful_response.encode()
    mock_serial_port.read_until.side_effect = [
        encoded_error_response,
        encoded_successful_response,
    ]

    response = await subject_raise_on_error_patched._send_data(data=data, retries=0)

    assert response == successful_response
    mock_serial_port.read_until.assert_has_calls(
        calls=[
            call(match=ack.encode()),
            call(match=ack.encode()),
        ]
    )
    subject_raise_on_error_patched.raise_on_error.assert_has_calls(  # type: ignore[attr-defined]
        calls=[
            call(response=error_response, request=data),
            call(response=successful_response, request=data),
        ]
    )


async def test_send_data_with_async_error_after(
    mock_serial_port: AsyncMock,
    subject_raise_on_error_patched: AsyncResponseSerialConnection,
    ack: str,
) -> None:
    """It should return response without the ack and stripped. It should not handle the async error."""
    error_response = "async ERR106:main motor:speedsensor failed"
    serial_error_response = f" {error_response}  {ack}"
    encoded_error_response = serial_error_response.encode()
    successful_response = "G28"
    data = "G28"
    serial_successful_response = f" {successful_response}  {ack}"
    encoded_successful_response = serial_successful_response.encode()
    mock_serial_port.read_until.side_effect = [
        encoded_successful_response,
        encoded_error_response,
    ]

    response = await subject_raise_on_error_patched._send_data(data=data, retries=0)

    assert response == successful_response
    mock_serial_port.read_until.assert_has_calls(
        calls=[
            call(match=ack.encode()),
        ]
    )
    subject_raise_on_error_patched.raise_on_error.assert_has_calls(  # type: ignore[attr-defined]
        calls=[
            call(response=successful_response, request=data),
        ]
    )


async def test_send_data_multiple_ack_ok(
    mock_serial_port: AsyncMock,
    async_subject: AsyncResponseSerialConnection,
    ack: str,
) -> None:
    """It should return all acks."""
    successful_response = "M411"
    data = "M411"
    serial_successful_response = f" {successful_response}  {ack}"
    encoded_successful_response = serial_successful_response.encode()
    mock_serial_port.read_until.side_effect = [
        encoded_successful_response,
        encoded_successful_response,
        encoded_successful_response,
    ]

    responses = await async_subject._send_data_multiack(data=data, retries=0, acks=3)

    assert responses == [successful_response] * 3
    mock_serial_port.read_until.assert_has_calls(
        calls=[
            call(match=ack.encode()),
            call(match=ack.encode()),
            call(match=ack.encode()),
        ]
    )


async def test_send_data_multiple_ack_some_errors(
    mock_serial_port: AsyncMock,
    async_subject: AsyncResponseSerialConnection,
    ack: str,
) -> None:
    """It should return all acks."""
    successful_response = "M411"
    data = "M411"
    error_response = "ERR007:test"
    serial_successful_response = f" {successful_response}  {ack}"
    encoded_successful_response = serial_successful_response.encode()
    serial_error_response = f" {error_response}  {ack}"
    encoded_error_response = serial_error_response.encode()
    mock_serial_port.read_until.side_effect = [
        encoded_successful_response,
        encoded_error_response,
        encoded_successful_response,
    ]

    with pytest.raises(ErrorResponse, match=error_response):
        await async_subject._send_data_multiack(data=data, retries=0, acks=3)

    mock_serial_port.read_until.assert_has_calls(
        calls=[
            call(match=ack.encode()),
            call(match=ack.encode()),
            call(match=ack.encode()),
        ]
    )


async def test_send_data_multiple_ack_ok_with_async_error(
    mock_serial_port: AsyncMock,
    async_subject: AsyncResponseSerialConnection,
    ack: str,
) -> None:
    """It should return all acks."""
    successful_response = "M411"
    data = "M411"
    serial_successful_response = f" {successful_response}  {ack}"
    encoded_successful_response = serial_successful_response.encode()
    error_response = "async ERR106:main motor:speedsensor failed"
    serial_error_response = f" {error_response}  {ack}"
    encoded_error_response = serial_error_response.encode()
    mock_serial_port.read_until.side_effect = [
        encoded_error_response,
        encoded_successful_response,
        encoded_successful_response,
        encoded_successful_response,
    ]

    with pytest.raises(ErrorResponse, match=error_response):
        await async_subject._send_data_multiack(data=data, retries=0, acks=3)

    mock_serial_port.read_until.assert_has_calls(
        calls=[
            call(match=ack.encode()),
            call(match=ack.encode()),
            call(match=ack.encode()),
            call(match=ack.encode()),
        ]
    )


async def test_send_data_does_not_retry_async_error(
    mock_serial_port: AsyncMock,
    async_subject: AsyncResponseSerialConnection,
    ack: str,
) -> None:
    """Async/device error responses must not be retried or they can be lost.

    Mirrors vacuum-module waste-full behavior: a one-shot async error arrives
    while waiting for a polled command response. With retries enabled, a later
    successful retry would otherwise swallow the only notification.
    """
    data = "M121 "
    error_response = "async ERR401:vacuum:waste is full"
    # Combined firmware-style read: async line (no OK) + command response with OK.
    combined_response = f"{error_response}\nM121 T:0.0 C:-4.7 V:1 {ack}".encode()
    # If the send path incorrectly retries after the device error, these would be used.
    successful_response = f"M121 T:0.0 C:-4.7 V:1 {ack}".encode()
    mock_serial_port.read_until.side_effect = [
        combined_response,
        successful_response,
        successful_response,
    ]

    with pytest.raises(ErrorResponse, match="ERR401"):
        await async_subject._send_data_multiack(data=data, retries=2, acks=1)

    # Only the original attempt should write; device errors must not be retried.
    assert mock_serial_port.write.await_count == 1
    mock_serial_port.write.assert_awaited_once_with(data=data.encode())
    # Combined async + command frame is fully consumed in a single read.
    assert mock_serial_port.read_until.await_count == 1


async def test_send_data_still_retries_missing_response(
    mock_serial_port: AsyncMock,
    async_subject: AsyncResponseSerialConnection,
    ack: str,
) -> None:
    """Transport-style missing responses should still be retried."""
    data = "M121 "
    successful_response = f"M121 T:0.0 C:-4.7 V:1 {ack}".encode()
    mock_serial_port.read_until.side_effect = [
        b"",  # first attempt times out
        successful_response,  # retry succeeds
    ]

    responses = await async_subject._send_data_multiack(data=data, retries=2, acks=1)

    assert responses == ["M121 T:0.0 C:-4.7 V:1"]
    assert mock_serial_port.write.await_count == 2


def _command_response(ack: str, gcode: str = "M121") -> bytes:
    return f"{gcode} T:0.0 C:-4.7 V:1 {ack}".encode()


def _async_error_no_ack(code: str = "ERR401", line_ending: str = "\n") -> bytes:
    """Vacuum-style async notification without its own trailing ack."""
    return f"async {code}:vacuum:waste is full{line_ending}".encode()


def _async_error_with_ack(ack: str, code: str = "ERR106") -> bytes:
    """Older-module style async notification that includes a trailing ack."""
    return f"async {code}:main motor:speedsensor failed {ack}".encode()


def _connection_with_ack(
    mock_serial_port: AsyncMock, ack: str
) -> AsyncResponseSerialConnection:
    """Build a connection whose command terminator matches the given ack."""
    return AsyncResponseSerialConnection(
        serial=mock_serial_port,
        ack=ack,
        name="name",
        port="port",
        retry_wait_time_seconds=0,
        error_keyword="err",
        alarm_keyword="alarm",
        async_error_ack="async",
    )


@pytest.mark.parametrize(
    argnames=["raw", "expected"],
    argvalues=[
        # Response only.
        pytest.param(
            lambda ack: _command_response(ack),
            lambda ack: [("response", _command_response(ack))],
            id="response-only",
        ),
        # Async only, no ack (one-shot firmware notification).
        pytest.param(
            lambda ack: _async_error_no_ack(),
            lambda ack: [("error", _async_error_no_ack())],
            id="async-only-no-ack",
        ),
        # Async only, ack-terminated.
        pytest.param(
            lambda ack: _async_error_with_ack(ack),
            lambda ack: [("error", _async_error_with_ack(ack))],
            id="async-only-with-ack",
        ),
        # async ERR...\n + command OK  (vacuum firmware interleave)
        pytest.param(
            lambda ack: _async_error_no_ack() + _command_response(ack),
            lambda ack: [
                ("error", _async_error_no_ack()),
                ("response", _command_response(ack)),
            ],
            id="async-no-ack-then-response",
        ),
        # command OK + async ERR...\n  (async arrives after command ack)
        pytest.param(
            lambda ack: _command_response(ack) + b"\n" + _async_error_no_ack(),
            lambda ack: [
                ("response", _command_response(ack) + b"\n"),
                ("error", _async_error_no_ack()),
            ],
            id="response-then-async-no-ack",
        ),
        # command OK + async with its own ack
        pytest.param(
            lambda ack: _command_response(ack) + _async_error_with_ack(ack),
            lambda ack: [
                ("response", _command_response(ack)),
                ("error", _async_error_with_ack(ack)),
            ],
            id="response-then-async-with-ack",
        ),
        # async with its own ack + command OK
        pytest.param(
            lambda ack: _async_error_with_ack(ack) + _command_response(ack),
            lambda ack: [
                ("error", _async_error_with_ack(ack)),
                ("response", _command_response(ack)),
            ],
            id="async-with-ack-then-response",
        ),
        # Repeated vacuum-style pairs in one buffer.
        # async\nresponse async\nresponse
        pytest.param(
            lambda ack: (
                _async_error_no_ack("ERR401")
                + _command_response(ack)
                + b"\n"
                + _async_error_no_ack("ERR400")
                + _command_response(ack, "M122")
            ),
            lambda ack: [
                ("error", _async_error_no_ack("ERR401")),
                ("response", _command_response(ack) + b"\n"),
                ("error", _async_error_no_ack("ERR400")),
                ("response", _command_response(ack, "M122")),
            ],
            id="two-async-no-ack-response-pairs",
        ),
        # Two ack-terminated async frames then a command response.
        pytest.param(
            lambda ack: (
                _async_error_with_ack(ack, "ERR106")
                + _async_error_with_ack(ack, "ERR107")
                + _command_response(ack)
            ),
            lambda ack: [
                ("error", _async_error_with_ack(ack, "ERR106")),
                ("error", _async_error_with_ack(ack, "ERR107")),
                ("response", _command_response(ack)),
            ],
            id="two-async-with-ack-then-response",
        ),
        # Two async-no-ack lines before a single command response.
        pytest.param(
            lambda ack: (
                _async_error_no_ack("ERR401")
                + _async_error_no_ack("ERR400")
                + _command_response(ack)
            ),
            lambda ack: [
                ("error", _async_error_no_ack("ERR401")),
                ("error", _async_error_no_ack("ERR400")),
                ("response", _command_response(ack)),
            ],
            id="two-async-no-ack-then-response",
        ),
        # Response sandwiched between async-no-ack notifications.
        pytest.param(
            lambda ack: (
                _async_error_no_ack("ERR401")
                + _command_response(ack)
                + b"\n"
                + _async_error_no_ack("ERR400")
            ),
            lambda ack: [
                ("error", _async_error_no_ack("ERR401")),
                ("response", _command_response(ack) + b"\n"),
                ("error", _async_error_no_ack("ERR400")),
            ],
            id="async-response-async",
        ),
        # Empty / timeout-style reads.
        pytest.param(
            lambda ack: b"",
            lambda ack: [("empty-unknown", b"")],
            id="empty",
        ),
        pytest.param(
            lambda ack: b"noise without terminator",
            lambda ack: [("empty-unknown", b"noise without terminator")],
            id="noise-no-ack-no-async",
        ),
        # Whitespace-only after a complete async+response pair is ignored.
        pytest.param(
            lambda ack: _async_error_no_ack() + _command_response(ack) + b"   ",
            lambda ack: [
                ("error", _async_error_no_ack()),
                ("response", _command_response(ack) + b"   "),
            ],
            id="async-response-trailing-whitespace",
        ),
    ],
)
def test_partition_serial_read_permutations(
    async_subject: AsyncResponseSerialConnection,
    ack: str,
    raw: Callable[[str], bytes],
    expected: Callable[[str], list[SerialResponse]],
) -> None:
    """Partition async/command interleaves across common firmware shapes."""
    assert async_subject._partition_serial_read(raw(ack)) == expected(ack)


@pytest.mark.parametrize(
    argnames=["ack"],
    argvalues=[
        pytest.param("OK\n", id="lf-ack"),
        pytest.param("OK\r\n", id="crlf-ack"),
        # Smoothie / temp-deck / mag-deck style multi-line terminator.
        pytest.param("ok\r\nok\r\n", id="crlf-double-ok-ack"),
    ],
)
@pytest.mark.parametrize(
    argnames=["build_raw", "build_expected"],
    argvalues=[
        pytest.param(
            lambda ack, ending: _async_error_no_ack(line_ending=ending)
            + _command_response(ack),
            lambda ack, ending: [
                ("error", _async_error_no_ack(line_ending=ending)),
                ("response", _command_response(ack)),
            ],
            id="async-then-response",
        ),
        pytest.param(
            lambda ack, ending: _command_response(ack)
            + _async_error_no_ack(line_ending=ending),
            lambda ack, ending: [
                ("response", _command_response(ack)),
                ("error", _async_error_no_ack(line_ending=ending)),
            ],
            id="response-then-async",
        ),
        pytest.param(
            lambda ack, ending: (
                _async_error_no_ack("ERR401", line_ending=ending)
                + _command_response(ack)
                + _async_error_no_ack("ERR400", line_ending=ending)
                + _command_response(ack, "M122")
            ),
            lambda ack, ending: [
                ("error", _async_error_no_ack("ERR401", line_ending=ending)),
                ("response", _command_response(ack)),
                ("error", _async_error_no_ack("ERR400", line_ending=ending)),
                ("response", _command_response(ack, "M122")),
            ],
            id="two-pairs",
        ),
        pytest.param(
            lambda ack, ending: _async_error_with_ack(ack)
            + _command_response(ack),
            lambda ack, ending: [
                ("error", _async_error_with_ack(ack)),
                ("response", _command_response(ack)),
            ],
            id="async-with-ack-then-response",
        ),
        pytest.param(
            # Async line uses LF while the command ack uses the device terminator
            # (e.g. firmware prints async with \n even when OK is \r\n).
            lambda ack, ending: _async_error_no_ack(line_ending="\n")
            + _command_response(ack),
            lambda ack, ending: [
                ("error", _async_error_no_ack(line_ending="\n")),
                ("response", _command_response(ack)),
            ],
            id="async-lf-command-device-ack",
        ),
    ],
)
def test_partition_serial_read_with_crlf_and_lf_acks(
    mock_serial_port: AsyncMock,
    ack: str,
    build_raw: Callable[[str, str], bytes],
    build_expected: Callable[[str, str], list[SerialResponse]],
) -> None:
    """CRLF command terminators must not break async/command partitioning.

    Devices may ack with ``OK\\n``, ``OK\\r\\n``, or multi-line ``ok\\r\\nok\\r\\n``.
    Async notifications are split on the first ``\\n`` before the command ack, so
    both LF and CRLF line endings on the async line are accepted.
    """
    # Prefer matching the async line ending to the ack family when possible.
    line_ending = "\r\n" if "\r\n" in ack else "\n"
    subject = _connection_with_ack(mock_serial_port, ack)

    raw = build_raw(ack, line_ending)
    expected = build_expected(ack, line_ending)
    assert subject._partition_serial_read(raw) == expected


async def test_send_data_raises_async_error_with_crlf_ack_without_extra_wait(
    mock_serial_port: AsyncMock,
) -> None:
    """Interleaved async + CRLF-acked command should raise on a single read."""
    ack = "OK\r\n"
    subject = _connection_with_ack(mock_serial_port, ack)
    data = "M121 "
    combined = (
        b"async ERR401:vacuum:waste is full\r\n"
        + f"M121 T:0.0 C:-4.7 V:1 {ack}".encode()
    )
    mock_serial_port.read_until.side_effect = [combined]

    with pytest.raises(ErrorResponse, match="ERR401"):
        await subject._send_data_multiack(data=data, retries=0, acks=1)

    mock_serial_port.read_until.assert_awaited_once_with(match=ack.encode())
    mock_serial_port.write.assert_awaited_once_with(data=data.encode())


async def test_send_data_raises_async_error_from_interleaved_read_without_extra_wait(
    mock_serial_port: AsyncMock,
    async_subject: AsyncResponseSerialConnection,
    ack: str,
) -> None:
    """Interleaved async + command should raise without waiting for another ack."""
    data = "M121 "
    error_line = "async ERR401:vacuum:waste is full"
    combined_response = f"{error_line}\nM121 T:0.0 C:-4.7 V:1 {ack}".encode()
    mock_serial_port.read_until.side_effect = [combined_response]

    with pytest.raises(ErrorResponse, match="ERR401"):
        await async_subject._send_data_multiack(data=data, retries=0, acks=1)

    mock_serial_port.read_until.assert_awaited_once_with(match=ack.encode())
    mock_serial_port.write.assert_awaited_once_with(data=data.encode())


def test_default_error_code_raise_exception() -> None:
    """Test that error codes can raise appropriate exceptions."""
    with pytest.raises(UnhandledGcode) as error:
        DefaultErrorCodes.UNHANDLED_GCODE.raise_exception(
            port="test_port", response="ERR003:test", command="G28"
        )

    assert error.value.response == "ERR003:test"
    assert error.value.port == "test_port"
    assert error.value.command == "G28"


def test_custom_error_code_raise_custom_exception() -> None:
    """Test that custom error codes can raise appropriate exceptions."""

    class CustomErrorResponse(ErrorResponse):
        pass

    class CustomDefaultErrorCodes(BaseErrorCode):
        CUSTOM_ERROR = ("ERR999", CustomErrorResponse)

    # Test that a regular ErrorResponse works correctly
    with pytest.raises(CustomErrorResponse) as error:
        CustomDefaultErrorCodes.CUSTOM_ERROR.raise_exception(
            port="test_port", response="ERR999:test", command="G28"
        )

    assert error.value.command == "G28"
    assert error.value.response == "ERR999:test"
    assert error.value.port == "test_port"


async def test_send_data_multiple_raises_unhandled(
    mock_serial_port: AsyncMock, async_subject: AsyncResponseSerialConnection, ack: str
) -> None:
    """It shouldn't wait for both acks before raising an unhandled gcode"""
    mock_serial_port.read_until.side_effect = [
        f"ERR003:unhandled gcode {ack}".encode(),
    ]
    with pytest.raises(UnhandledGcode):
        await async_subject._send_data_multiack(data="M411", retries=0, acks=3)
    mock_serial_port.read_until.assert_called_once()


async def test_update_port_updates_port_and_name(
    mock_serial_port: AsyncMock, async_subject: AsyncResponseSerialConnection
) -> None:
    """update_port should rebind serial and keep log name aligned with the path."""
    mock_serial_port.is_open = AsyncMock(return_value=True)
    mock_serial_port._baud_rate = 115200
    mock_serial_port.get_timeout = mock.Mock(return_value=5.0)
    mock_serial_port._loop = mock.sentinel.loop
    mock_serial_port._reset_buffer_before_write = True

    new_serial = AsyncMock(spec=AsyncSerial)
    with patch.object(
        AsyncResponseSerialConnection,
        "_build_serial",
        new=AsyncMock(return_value=new_serial),
    ) as build_serial:
        await async_subject.update_port("/dev/ot_module_vacuummodule5")

    mock_serial_port.close.assert_awaited_once()
    build_serial.assert_awaited_once_with(
        port="/dev/ot_module_vacuummodule5",
        baud_rate=115200,
        timeout=5.0,
        loop=mock.sentinel.loop,
        reset_buffer_before_write=True,
    )
    assert async_subject.port == "/dev/ot_module_vacuummodule5"
    assert async_subject.name == "/dev/ot_module_vacuummodule5"
    assert async_subject._serial is new_serial
