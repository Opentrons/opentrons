from __future__ import annotations

import asyncio
import logging

from opentrons.hardware_control.emulation.types import ModuleType
from typing_extensions import Literal, Final
from typing import Dict, List, Set, Sequence, Optional
from pydantic import BaseModel

from opentrons.hardware_control.emulation.proxy import ProxyListener
from opentrons.hardware_control.emulation.settings import ModuleServerSettings


log = logging.getLogger(__name__)

MessageDelimiter: Final = b"\n"


class ModuleStatusServer(ProxyListener):
    """Server notifying of module connections."""

    def __init__(self, settings: ModuleServerSettings) -> None:
        """Constructor

        Args:
            settings: app settings
        """
        self._settings = settings
        self._connections: Dict[str, Connection] = {}
        self._clients: Set[asyncio.StreamWriter] = set()

    def on_server_connected(
        self, server_type: str, client_uri: str, identifier: str
    ) -> None:
        """Called when a new module has connected.

        Args:
            server_type: the type of module
            client_uri: the url string for a driver to connect to
            identifier: unique id for connection

        Returns: None

        """
        log.info(f"On connected {server_type} {client_uri} {identifier}")
        connection = Connection(
            module_type=server_type, url=client_uri, identifier=identifier
        )
        self._connections[identifier] = connection
        for c in self._clients:
            c.write(
                Message(status="connected", connections=[connection]).json().encode()
            )
            c.write(b"\n")

    def on_server_disconnected(self, identifier: str) -> None:
        """Called when a module has disconnected.

        Args:
            identifier: unique id for the connection

        Returns: None
        """
        log.info(f"On disconnected {identifier}")
        try:
            connection = self._connections[identifier]
            del self._connections[identifier]
            for c in self._clients:
                c.write(
                    Message(status="disconnected", connections=[connection])
                    .json()
                    .encode()
                )
                c.write(MessageDelimiter)
        except KeyError:
            log.exception("Failed to find identifier")

    async def run(self) -> None:
        """Run the server."""
        server = await asyncio.start_server(
            self._handle_connection, host=self._settings.host, port=self._settings.port
        )
        await server.serve_forever()

    async def _handle_connection(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """Handle a client connection to the server."""
        log.info("Client connected to module server.")

        m = Message(status="dump", connections=list(self._connections.values()))

        writer.write(m.json().encode())
        writer.write(MessageDelimiter)

        self._clients.add(writer)

        while True:
            if b"" == await reader.read():
                self._clients.remove(writer)
                break

        log.info("Client disconnected from module server.")


class Connection(BaseModel):
    """Model a single module connection."""

    url: str
    module_type: str
    identifier: str


class Message(BaseModel):
    """A message sent to module server clients."""

    status: Literal["connected", "disconnected", "dump"]
    connections: List[Connection]


class ModuleServerClient:
    """A module server client."""

    def __init__(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """Constructor."""
        self._reader = reader
        self._writer = writer

    @classmethod
    async def connect(
        cls,
        host: str,
        port: int,
        retries: int = 3,
        interval_seconds: float = 0.1,
    ) -> ModuleServerClient:
        """Connect to the module server.

        Args:
            host: module server host.
            port: module server port.
            retries: number of retries
            interval_seconds: time between retries.

        Returns:
            None
        Raises:
            IOError on retry expiry.
        """
        r: Optional[asyncio.StreamReader] = None
        w: Optional[asyncio.StreamWriter] = None
        for i in range(retries):
            try:
                r, w = await asyncio.open_connection(host=host, port=port)
            except OSError:
                await asyncio.sleep(interval_seconds)

        if r is not None and w is not None:
            return ModuleServerClient(reader=r, writer=w)
        else:
            raise IOError(
                f"Failed to connect to module_server at after {retries} retries."
            )

    async def read(self) -> Message:
        """Read a message from the module server."""
        b = await self._reader.readuntil(MessageDelimiter)
        m: Message = Message.parse_raw(b)
        return m

    def close(self) -> None:
        """Close the client."""
        self._writer.close()


async def wait_emulators(
    client: ModuleServerClient,
    modules: Sequence[ModuleType],
    timeout: float,
) -> None:
    """Wait for module emulators to connect.

    Args:
        client: module server client.
        modules: collection of of module types to wait for.
        timeout: how long to wait for emulators to connect (in seconds)

    Returns:
        None
    Raises:
        asyncio.TimeoutError on timeout.
    """

    async def _wait_modules(cl: ModuleServerClient, module_set: Set[str]) -> None:
        """Read messages from module server waiting for modules in module_set to
        be connected."""
        while module_set:
            m: Message = await cl.read()
            if m.status == "dump" or m.status == "connected":
                for c in m.connections:
                    if c.module_type in module_set:
                        module_set.remove(c.module_type)
            elif m.status == "disconnected":
                for c in m.connections:
                    if c.module_type in module_set:
                        module_set.add(c.module_type)

            log.debug(f"after message: {m}, awaiting module set is: {module_set}")

    await asyncio.wait_for(
        _wait_modules(cl=client, module_set=set(n.value for n in modules)),
        timeout=timeout,
    )
