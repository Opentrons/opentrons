from opentrons.drivers.barcode_scanner.rtscanner_driver import RTScanner
from opentrons.drivers.barcode_scanner.rtscanner_commands import bool_conv, int_conv, expand_ascii_args
import pytest
from typing import ByteString

def test_bool_conv() -> None:
    assert bool_conv(True) == b'1'
    assert bool_conv(False) == b'0'


@pytest.mark.parametrize(
    "number, expected",
    [(123, b'123'), (456, b'456')],
)
def test_int_conv(number: int, expected: ByteString) -> None:
    assert int_conv(number) == expected

@pytest.mark.parametrize(
    "txt, expected",
    [("abc", b'616263'), ("Test",b'54657374'), ("\r\n", b'0D0A')]
)
def test_expand_ascii(txt: str, expected: ByteString) -> None:
    assert expand_ascii_args(txt) == expected
