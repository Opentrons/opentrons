"""A driver that emulates CAN over socket."""
from __future__ import annotations
from typing_extensions import Final
import logging
import struct
import asyncio

from opentrons_shared_data.errors.exceptions import CanbusCommunicationError

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
        try:
            header = await self._reader.readexactly(self.header_length)
            arbitration_id, length = struct.unpack(">LL", header)
        except asyncio.IncompleteReadError as e:
            raise CanbusCommunicationError(
                message=f"Error reading socket header: {str(e)}"
            )

        if length > 0:
            try:
                data = await self._reader.readexactly(length)
            except asyncio.IncompleteReadError as e:
                raise CanbusCommunicationError(
                    message=f"Error reading socket payload: {str(e)}"
                )
        else:
            data = b""
        return CanMessage(arbitration_id=ArbitrationId(id=arbitration_id), data=data)

    def shutdown(self) -> None:
        """Close the driver."""
        self._writer.close()
