from typing import ByteString

import pytest
from mock import AsyncMock, call

from opentrons.drivers.asyncio.communication.async_serial import (
    AsyncSerial,
)
from opentrons.drivers.barcode_scanner.rtscanner_commands import (
    bool_conv,
    expand_ascii_args,
    int_conv,
)
from opentrons.drivers.barcode_scanner.rtscanner_driver import RTScanner


@pytest.fixture
def connection() -> AsyncMock:
    return AsyncMock(spec=AsyncSerial)


@pytest.fixture
def subject(connection: AsyncMock) -> RTScanner:
    return RTScanner(connection, "device")


def test_bool_conv() -> None:
    """Make sure the boolean function correctly gets the right ascii to send."""
    assert bool_conv(True) == b"1"
    assert bool_conv(False) == b"0"


@pytest.mark.parametrize(
    "number, expected",
    [(123, b"123"), (456, b"456")],
)
def test_int_conv(number: int, expected: ByteString) -> None:
    """Make sure numbers are correctly set to bytestrings."""
    assert int_conv(number) == expected


@pytest.mark.parametrize(
    "txt, expected", [("abc", b"616263"), ("Test", b"54657374"), ("\r\n", b"0D0A")]
)
def test_expand_ascii(txt: str, expected: ByteString) -> None:
    """Test the dumb double ascii expansion."""
    assert expand_ascii_args(txt) == expected


async def test_set_prefix(subject: RTScanner, connection: AsyncMock) -> None:
    """Make sure the right messages are sent down the wire."""
    await subject.set_prefix("CODE")
    connection.write.assert_has_calls(
        calls=[
            call(b"~\x010000@CPRENA1;\x03"),  # enable prefix
            call(
                b"~\x010000@CPRSET434F4445;\x03"
            ),  # set prefix to double encoded "Code"
        ]
    )


async def test_set_suffix(subject: RTScanner, connection: AsyncMock) -> None:
    """Make sure the right messages are sent down the wire."""
    await subject.set_suffix("CODE")
    connection.write.assert_has_calls(
        calls=[
            call(b"~\x010000@CSUENA1;\x03"),  # enable suffix
            call(
                b"~\x010000@CSUSET434F4445;\x03"
            ),  # set prefix to double encoded "Code"
        ]
    )


async def test_enable_beeps(subject: RTScanner, connection: AsyncMock) -> None:
    """Make sure the right messages are sent down the wire."""
    await subject.enable_success_beeps(True)
    connection.write.assert_has_calls(
        calls=[
            call(b"~\x010000@GRBENA1;\x03"),  # enable beeps
            call(b"~\x010000@GRBDUR80;\x03"),  # set duration to 80"
            call(b"~\x010000@GRBVLL20;\x03"),  # set volume to 20"
            call(b"~\x010000@GRBFRQ2730;\x03"),  # set frequency to 2730"
        ]
    )


async def test_do_beep(subject: RTScanner, connection: AsyncMock) -> None:
    """Make sure the right messages are sent down the wire."""
    await subject.do_beep()
    connection.write.assert_has_calls(
        calls=[
            call(b"~\x010000@BEEPON2730F80T20V;\x03"),
            # beep at 2730HZ for 80ms at vol 20
        ]
    )
