"""A driver that emulates CAN over socket."""
from __future__ import annotations
from typing_extensions import Final
import logging
import struct
import asyncio

from . import ArbitrationId
from opentrons_hardware.firmware_bindings import CanMessage
from .abstract_driver import AbstractCanDriver


log = logging.getLogger(__name__)


class SocketDriver(AbstractCanDriver):
    """A driver that emulates CAN over socket."""

    _server: asyncio.AbstractServer
    header_length: Final = 8

    def __init__(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """Constructor.

        Args:
            reader: Reader
            writer: Writer
        """
        self._reader = reader
        self._writer = writer
        self._buffer = b""

    @classmethod
    async def build(cls, host: str, port: int) -> SocketDriver:
        """Create a socket driver.

        Args:
            host: The host to connect to.
            port: The port to listen on.

        Returns:
            A new instance.
        """
        log.info(f"Connecting to on {host}:{port}")
        reader, writer = await asyncio.open_connection(host=host, port=port)
        return SocketDriver(reader, writer)

    async def send(self, message: CanMessage) -> None:
        """Send a message."""
        data = struct.pack(
            f">LL{len(message.data)}s",
            message.arbitration_id.id,
            len(message.data),
            message.data,
        )
        self._writer.write(data)

    async def read(self) -> CanMessage:
        """Read a message."""
        header = await self._read_buff(self.header_length)
        arbitration_id, length = struct.unpack(">LL", header)

        if length > 0:
            data = await self._read_buff(length)
        else:
            data = b""
        return CanMessage(arbitration_id=ArbitrationId(id=arbitration_id), data=data)

    async def _read_buff(self, min_length: int) -> bytes:
        """Read a minimum of min_length bytes."""
        while len(self._buffer) < min_length:
            self._buffer += await self._reader.read(min_length - len(self._buffer))
        ret = self._buffer[:min_length]
        self._buffer = self._buffer[min_length:]
        return ret

    def shutdown(self) -> None:
        """Close the driver."""
        self._writer.close()
