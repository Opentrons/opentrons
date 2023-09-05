"""Handle parsing and providing gripper information."""
import re
from typing import Tuple
import struct

from opentrons_shared_data.errors.exceptions import (
    InvalidInstrumentData,
    PythonException,
)
from opentrons_hardware.instruments.serial_utils import ensure_serial_length

# Separate string into 2 groups
#  - model
#  - code

GRIPPER_REGEX_STRING = (
    "^"  # start of string
    "GRPV"  # The characters GRPV
    r"(?P<model>\d{2})"  # "model" group contains exactly 2 digits
    r"(?P<code>[\w\d]{0,12})"  # "code" group contains 0 to 12 inclusive alphanumeric characters
    "$"  # end of string
)

SERIAL_RE = re.compile(GRIPPER_REGEX_STRING)

SERIAL_FORMAT_MSG = (
    "Serial numbers must have the format GRPVMMXXXXXX... where"
    "MM is a two-digit model number, and the rest is some serial code."
)


def gripper_info_from_serial_string(serialval: str) -> Tuple[int, bytes]:
    """Parse gripper information from a serial code.

    The return value is the serial parts: the model, and the serial.

    Note: this is not the inverse of serial_val_from_parts. The input should be
    something a human scans, not something returned from a gripper. A bytestring
    from a gripper is probably not valid ascii and even if it is, you won't get
    the expected values from passing it to this function.
    """
    matches = SERIAL_RE.match(serialval.strip())
    if not matches:
        raise InvalidInstrumentData(
            message=f"The serial number {serialval.strip()} is not valid. {SERIAL_FORMAT_MSG}",
            detail={"serial": serialval},
        )
    model = int(matches.group("model"))

    return (
        model,
        ensure_serial_length(matches.group("code").encode("ascii")),
    )


def gripper_serial_val_from_parts(model: int, serialval: bytes) -> bytes:
    """Encode pipette information into a bytestring suitable for EEPROM storage.

    Note: this is not the inverse of info_from_serial_string. info_from_serial_string
    parses information from a human-entered string that is probably the pipette barcode.
    This function takes that information and specifically encodes it in a bytestring for
    storage on the pipette, which includes binary data. If you call

    serial_val_from_parts(*info_from_serial_str(somestr.encode('ascii'))).decode('ascii')

    you will not get what you put in.
    """
    try:
        return struct.pack(">H16s", model, ensure_serial_length(serialval))
    except struct.error as e:
        raise InvalidInstrumentData(
            message="Invalid serial data",
            detail={"model": model, "serial": serialval},
            wrapping=[PythonException(e)],
        )
