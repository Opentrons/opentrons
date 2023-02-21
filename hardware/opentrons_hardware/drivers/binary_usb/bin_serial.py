"""The usb binary protocol over serial transport."""

import serial  # type: ignore[import]
from functools import partial
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
    get_binary_definition,
)
import asyncio
import logging
import concurrent.futures

from typing import Optional
from opentrons_hardware.firmware_bindings import utils
from opentrons_hardware.firmware_bindings.binary_constants import BinaryMessageId

log = logging.getLogger(__name__)


class SerialUsbDriver:
    """The usb binary protocol interface."""

    def __init__(self, loop: asyncio.AbstractEventLoop) -> None:
        """Initialize the driver and set the event loop."""
        self._loop = loop
        self._executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)
        self._connected = False

    def connect(
        self, vid: int, pid: int, baudrate: int = 115200, timeout: int = 1
    ) -> None:
        """Initialize a serial connection to a usb device that uses the binary messaging protocol."""
        self._port_name = self._find_serial_port(vid, pid)
        if self._port_name is None:
            raise IOError("unable to find serial device")

        self._port = serial.Serial(self._port_name, baudrate, timeout=timeout)
        self._connected = self._port.is_open

    def connected(self) -> bool:
        """Return the state of the serial connection."""
        self._check_connection()
        return self._connected

    def _find_serial_port(self, vid: int, pid: int) -> Optional[str]:
        ports = serial.tools.list_ports.comports()

        for check_port in ports:
            if (check_port.vid, check_port.pid) == (vid, pid):
                return str(check_port.device)
            continue
        return None

    def _check_connection(self) -> None:
        self._connected = self._port.is_open and self._connected

    async def write(self, message: BinaryMessageDefinition) -> int:
        """Send a binary message to the connected serial device."""
        if not self.connected():
            log.error("Unable to send message to unconnected device")
            return 0
        try:
            return int(
                await self._loop.run_in_executor(
                    self._executor, self._port.write, message.serialize()
                )
            )
        except serial.SerialTimeoutException as e:
            log.error("Unable to write to port {err}".format(err=str(e)))
            self._connected = False
            return 0

    async def read(self) -> Optional[BinaryMessageDefinition]:
        """Receive a binary message from the connected serial device."""
        if not self.connected():
            log.error("Unable to read message from unconnected device")
            return None
        try:
            header_data = await self._loop.run_in_executor(
                self._executor, partial(self._port.read, size=4)
            )  # read the message id and length
            message_type = BinaryMessageId(
                utils.UInt16Field.build(header_data[0, 2]).value
            )
            message_def = get_binary_definition(message_type)
            if message_def is not None:
                message_length = utils.UInt16Field.build(header_data[2, 4]).value
                message_data = await self._loop.run_in_executor(
                    self._executor,
                    partial(
                        self._port.read,
                        size=min(message_length, message_def.get_size()),
                    ),
                )
                data = b"".join([header_data, message_data])
                return message_def(message_def.build(data))  # type: ignore[arg-type]
            else:
                return None
        except serial.SerialException as e:
            log.error("Unable to read from port {err}".format(err=str(e)))
            self._connected = False
            return None

    def __exit__(self) -> None:
        self._connected = False
        self._port.close()
