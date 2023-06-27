"""The usb binary protocol over serial transport."""

import serial  # type: ignore[import]
from serial.tools.list_ports import comports  # type: ignore[import]
from functools import partial
from opentrons_hardware.firmware_bindings.messages.binary_message_definitions import (
    BinaryMessageDefinition,
    get_binary_definition,
)
import asyncio
import logging
import concurrent.futures

from typing import Optional, Type, Tuple
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
        self._vid = 0
        self._pid = 0
        self._baudrate = 0
        self._timeout = 0

    def find_and_connect(
        self, vid: int, pid: int, baudrate: int = 115200, timeout: int = 1
    ) -> None:
        """Initialize a serial connection to a usb device that uses the binary messaging protocol."""
        _port_name = self._find_serial_port(vid, pid)
        if _port_name is None:
            raise IOError("unable to find serial device")
        self._vid = vid
        self._pid = pid
        self._baudrate = baudrate
        self._timeout = timeout
        _port = serial.Serial(_port_name, baudrate, timeout=timeout)
        self.connect(_port_name, _port)

    def connect(self, port_name: str, serial_port: Type[serial.Serial]) -> None:
        """Initialize a serial connection to a usb device that uses the binary messaging protocol."""
        self._port_name = port_name
        self._port = serial_port
        self._connected = self._port.is_open

    def connected(self) -> bool:
        """Return the state of the serial connection."""
        self._check_connection()
        return self._connected

    def _find_serial_port(self, vid: int, pid: int) -> Optional[str]:
        ports = comports()

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
            log.debug(f"binary write: {message}")
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
            if len(header_data) < 4:
                return None
            message_type = BinaryMessageId(
                int.from_bytes(utils.UInt16Field.build(header_data[0:2]).value, "big")  # type: ignore[arg-type]
            )
            message_def = get_binary_definition(message_type)
            if message_def is not None:
                message_length = int.from_bytes(
                    utils.UInt16Field.build(header_data[2:4]).value, "big"  # type: ignore[arg-type]
                )
                message_data = await self._loop.run_in_executor(
                    self._executor,
                    partial(
                        self._port.read,
                        size=min(message_length, message_def.get_size()),
                    ),
                )
                data = b"".join([header_data, message_data])
                msg = message_def.build(data)
                log.debug(f"binary read: {msg}")
                return msg  # type: ignore[return-value]
            else:
                return None
        except serial.SerialException as e:
            log.error("Unable to read from port {err}".format(err=str(e)))
            self._connected = False
            return None

    def __exit__(self) -> None:
        self._connected = False
        self._port.close()

    def __aiter__(self) -> "SerialUsbDriver":
        """Enter iterator.

        Returns:
            SerialUsbDriver
        """
        return self

    async def __anext__(self) -> Optional[BinaryMessageDefinition]:
        """Async next.

        Returns:
            Binary USB message
        """
        if not self._port.is_open:
            self.__exit__()
            return None
        return await self.read()

    def get_connection_info(self) -> Tuple[int, int, int, int]:
        """Get the connection information for this device.

        During unit tests since we don't connect via usb device these will all be 0
        """
        return (self._vid, self._pid, self._baudrate, self._timeout)
