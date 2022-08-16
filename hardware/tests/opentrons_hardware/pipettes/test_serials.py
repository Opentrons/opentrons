"""Test serial setting."""
import pytest
from opentrons_hardware.pipettes import serials
from opentrons_hardware.firmware_bindings.constants import PipetteName


@pytest.mark.parametrize(
    "scanned_val,name,model,serial",
    [
        ("P1KSV0102022022", PipetteName.p1000_single, 1, b"02022022"),
        ("P1KSV3120211129A08", PipetteName.p1000_single, 31, b"20211129A008"),
        ("P50MV29AABBCCDD", PipetteName.p50_multi, 29, b"AABBCCDD"),
        ("P1KMV1000000000", PipetteName.p1000_multi, 10, b"00000000"),
        ("P50SV01", PipetteName.p50_single, 1, b"\x00\x00\x00\x00\x00\x00\x00\x00"),
    ],
)
def test_scan_valid_serials(
    scanned_val: str, name: PipetteName, model: int, serial: bytes
) -> None:
    """Various known-good serials."""
    parsed_name, parsed_model, parsed_serial = serials.info_from_serial_string(
        scanned_val
    )
    assert parsed_name == name
    assert parsed_model == model
    assert parsed_serial == serial


@pytest.mark.parametrize("scannedval", ["P111V02", "P1ksV22", "P3HSV12"])
def test_pipette_name_validity(scannedval: str) -> None:
    """Pipette name lookup matching."""
    with pytest.raises(ValueError, match="The pipette name part.*"):
        serials.info_from_serial_string(scannedval)


@pytest.mark.parametrize(
    "scannedval",
    [
        "",
        "P",
        "P1KS123",
        "P1KSVVV",
        "P1KSV0A",
        "P1KSV0102022022123123123",
    ],
)
def test_serial_validity(scannedval: str) -> None:
    """Various regex failures."""
    with pytest.raises(ValueError, match="The serial number.*"):
        serials.info_from_serial_string(scannedval)


@pytest.mark.parametrize("name", [name for name in PipetteName])
@pytest.mark.parametrize("model", [0, 1, 10, 0xFF])
@pytest.mark.parametrize(
    "data",
    [
        b"\x00\x00\x00\x00\x00\x00\x00\x00",
        b"\xff\xff\xff\xff\xff\xff\xff\xff",
        b"hello  ",
    ],
)
def test_serial_val_from_parts(name: PipetteName, model: int, data: bytes) -> None:
    """Make sure that valid inputs don't cause exceptions."""
    serials.serial_val_from_parts(name, model, data)
