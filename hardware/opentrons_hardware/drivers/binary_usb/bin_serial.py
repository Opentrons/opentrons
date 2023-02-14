"""The usb binary protocol over serial transport."""

import serial  # type: ignore[import]
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
    get_binary_definition,
)

from typing import Optional
from opentrons_hardware.firmware_bindings import utils
from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId


class SerialUsbDriver:
    """The usb binary protocol interface."""

    def __init__(
        self, vid: int, pid: int, baudrate: int = 115200, timeout: int = 1
    ) -> None:
        """Initialize a serial connection to a usb device that uses the binary messaging protocol."""
        self._port_name = self._find_serial_port(vid, pid)
        if self._port_name == "":
            raise IOError("unable to find serial device")

        self._port = serial.Serial(self._port_name, baudrate, timeout=timeout)

    def _find_serial_port(self, vid: int, pid: int) -> str:
        ports = serial.tools.list_ports.comports()

        for check_port in ports:
            if hasattr(serial.tools, "list_ports_common"):
                if (check_port.vid, check_port.pid) == (vid, pid):
                    return str(check_port.device)
                continue
        return ""

    def write(self, message: BinaryMessageDefinition) -> int:
        """Send a binary message to the connected serial device."""
        return int(self._port.write(message.serialize()))

    def read(self, size: int = 64) -> Optional[BinaryMessageDefinition]:
        """Receive a binary message from the connected serial device."""
        data = self._port.read(size=size)
        message_type = BinaryMessageId(utils.UInt16Field.build(data[0, 2]).value)
        message_def = get_binary_definition(message_type)
        if message_def is not None:
            return message_def(message_def.build(data))  # type: ignore[arg-type]
        else:
            return None

    def __exit__(self) -> None:
        self._port.close()
