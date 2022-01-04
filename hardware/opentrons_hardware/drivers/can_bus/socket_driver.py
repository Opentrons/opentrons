"""A driver that emulates CAN over socket."""
from __future__ import annotations
import logging
import struct
import asyncio

from . import ArbitrationId
from opentrons_ot3_firmware import CanMessage
from .abstract_driver import AbstractCanDriver


log = logging.getLogger(__name__)


class SocketDriver(AbstractCanDriver):
    """A driver that emulates CAN over socket."""

    _server: asyncio.AbstractServer

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
        header = await self._reader.read(8)
        arbitration_id, length = struct.unpack(">LL", header)

        if length > 0:
            data = await self._reader.read(length)
        else:
            data = b""
        return CanMessage(arbitration_id=ArbitrationId(id=arbitration_id), data=data)

    def shutdown(self) -> None:
        """Close the driver."""
        self._writer.close()
