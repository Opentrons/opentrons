"""A driver that emulates CAN over socket."""
from __future__ import annotations
import logging
import struct
import asyncio
from typing import List

from . import ArbitrationId
from .message import CanMessage
from .abstract_driver import AbstractCanDriver


log = logging.getLogger(__name__)


class SocketDriver(AbstractCanDriver):
    """A driver that emulates CAN over socket."""

    _server: asyncio.AbstractServer

    def __init__(
        self, server: asyncio.AbstractServer, connection_handler: ConnectionHandler
    ) -> None:
        """Constructor.

        Args:
            server: the server
            connection_handler: the connection handler
        """
        self._server = server
        self._connection_handler = connection_handler

    @classmethod
    async def build(cls, port: int) -> SocketDriver:
        """Create a socket driver.

        Args:
            port: The port to listen on.

        Returns:
            A new instance.
        """
        log.info(f"Listening on {port}")
        connection_handler = ConnectionHandler()
        server = await asyncio.start_server(connection_handler, port=port)
        return SocketDriver(server, connection_handler)

    async def send(self, message: CanMessage) -> None:
        """Send a message."""
        self._connection_handler.send(message)

    async def read(self) -> CanMessage:
        """Read a message."""
        return await self._connection_handler.read()

    def shutdown(self) -> None:
        """Shutdown the driver."""
        self._server.close()


class ConnectionHandler:
    """The class that manages client connections."""

    _writers: List[asyncio.StreamWriter]
    _queue: asyncio.Queue[CanMessage]

    def __init__(self) -> None:
        """Constructor."""
        self._writers = []
        self._queue = asyncio.Queue()

    async def __call__(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """Server accept connection callback."""
        log.info("Handling new connection")

        self._writers.append(writer)

        while True:
            header = await reader.read(8)
            arbitration_id, length = struct.unpack(">LL", header)
            if length > 0:
                data = await reader.read(length)
            else:
                data = b""
            self._queue.put_nowait(
                CanMessage(arbitration_id=ArbitrationId(arbitration_id), data=data)
            )

    def send(self, message: CanMessage) -> None:
        """Send message to all connections."""
        if message.data:
            data = struct.pack(
                ">LLp", message.arbitration_id.id, len(message.data), message.data
            )
        else:
            data = struct.pack(">LL", message.arbitration_id.id, len(message.data))
        for w in self._writers:
            w.write(data)

    async def read(self) -> CanMessage:
        """Read a message."""
        return await self._queue.get()
