"""Handle parsing and providing pipette information."""
import re
from typing import Dict, Tuple
import struct
from opentrons_hardware.firmware_bindings.constants import PipetteName

SERIAL_RE = re.compile("^(?P<name>P.{3,3})V(?P<model>[0-9]{2,2})(?P<code>.{,12})$")


NAME_LOOKUP: Dict[str, PipetteName] = {
    "P1KS": PipetteName.p1000_single,
    "P1KM": PipetteName.p1000_multi,
    "P50S": PipetteName.p50_single,
    "P50M": PipetteName.p50_multi,
}

SERIAL_FORMAT_MSG = (
    f'Serial numbers must have the format PNNNVMMXXXXXX... where NNN is one of {", ".join(NAME_LOOKUP.keys())}, '
    "MM is a two-digit model number, and the rest is some serial code."
)


def _ensure_length(input_val: bytes, target_length: int) -> bytes:
    """Makes a bytestring exactly 12 bytes long by limiting length and padding with 0."""
    return (input_val + (b"\x00" * target_length))[:target_length]


def info_from_serial_string(serialval: str) -> Tuple[PipetteName, int, bytes]:
    """Parse pipette information from a serial code.

    The return value is the serial parts: the name, the model, and the serial.

    Note: this is not the inverse of serial_val_from_parts. The input should be
    something a human scans, not something returned from a pipette. A bytestring
    from a pipette is probably not valid ascii and even if it is, you won't get
    the expected values from passing it to this function.
    """
    matches = SERIAL_RE.match(serialval.strip())
    if not matches:
        raise ValueError(
            f"The serial number {serialval.strip()} is not valid. {SERIAL_FORMAT_MSG}"
        )
    try:
        name = NAME_LOOKUP[matches.group("name")]
    except KeyError:
        raise ValueError(
            f"The pipette name part of the serial number ({matches.group('name')}) is unknown. {SERIAL_FORMAT_MSG}"
        )
    model = int(matches.group("model"))

    return (
        name,
        model,
        _ensure_length(matches.group("code").encode("ascii"), 16),
    )


def serial_val_from_parts(name: PipetteName, model: int, serialval: bytes) -> bytes:
    """Encode pipette information into a bytestring suitable for EEPROM storage.

    Note: this is not the inverse of info_from_serial_string. info_from_serial_string
    parses information from a human-entered string that is probably the pipette barcode.
    This function takes that information and specifically encodes it in a bytestring for
    storage on the pipette, which includes binary data. If you call

    serial_val_from_parts(*info_from_serial_str(somestr.encode('ascii'))).decode('ascii')

    you will not get what you put in.
    """
    return struct.pack(">HH16s", name.value, model, _ensure_length(serialval, 16))
