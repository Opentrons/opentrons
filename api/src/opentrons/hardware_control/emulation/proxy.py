"""The Proxy class module."""
from __future__ import annotations
import asyncio
import logging
import uuid
import socket
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List

from opentrons.hardware_control.emulation.settings import ProxySettings

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class Connection:
    """Attributes of a client connected on the server port (module emulator)."""

    identifier: str
    reader: asyncio.StreamReader
    writer: asyncio.StreamWriter


class ProxyListener(ABC):
    """Interface defining an object needing to know when a server (module emulator)
    connected/disconnected."""

    @abstractmethod
    def on_server_connected(
        self, server_type: str, client_uri: str, identifier: str
    ) -> None:
        """Called when a new server connects."""
        ...

    @abstractmethod
    def on_server_disconnected(self, identifier: str) -> None:
        """Called when a server disconnects."""
        ...


class Proxy:
    """A class that has servers (emulators) connect on one port and clients
    (drivers) on another. A server connection will be added to a collection. A
    client connection will check for a server connection and if available will
    have its write stream attached to the servers read stream and vice versa."""

    def __init__(
        self, name: str, listener: ProxyListener, settings: ProxySettings
    ) -> None:
        """Constructor.

        Args:
            name: Proxy name.
            listener: Connection even listener.
            settings:  The proxy settings.
        """
        self._name = name
        self._settings = settings
        self._event_listener = listener
        self._cons: List[Connection] = []

    @property
    def name(self) -> str:
        """Return the name of the proxy."""
        return self._name

    async def run(self) -> None:
        """Run the server."""
        await asyncio.gather(
            self._listen_server_connections(),
            self._listen_client_connections(),
        )

    async def _listen_server_connections(self) -> None:
        """Run the server listener."""
        log.info(
            f"starting {self._name} server connection server at "
            f"{self._settings.host}:{self._settings.emulator_port}"
        )
        server = await asyncio.start_server(
            self._handle_server_connection,
            self._settings.host,
            self._settings.emulator_port,
        )
        await server.serve_forever()

    async def _listen_client_connections(self) -> None:
        """Run the client listener."""
        log.info(
            f"starting {self._name} client connection server at "
            f"{self._settings.host}:{self._settings.driver_port}"
        )
        server = await asyncio.start_server(
            self._handle_client_connection,
            self._settings.host,
            self._settings.driver_port,
        )
        await server.serve_forever()

    async def _handle_server_connection(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """Handle a server connection.

        A new connection will be added to the our connection collection.

        Args:
            reader: Reader
            writer: Writer

        Returns:
            None
        """
        log.info(f"{self._name} emulator connected.")
        connection = Connection(
            identifier=str(uuid.uuid1()), reader=reader, writer=writer
        )

        log.info(f"Using Local Host: {self._settings.use_local_host}")

        client_host = (
            "127.0.0.1" if self._settings.use_local_host else socket.gethostname()
        )

        self._cons.append(connection)
        self._event_listener.on_server_connected(
            server_type=self._name,
            client_uri=f"socket://{client_host}:{self._settings.driver_port}",
            identifier=connection.identifier,
        )

    async def _handle_client_connection(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        """Handle a client connection.

        Attempt to match the client steam with an available server stream.

        Args:
            reader: Reader
            writer: Writer

        Returns:
            None
        """
        try:
            while True:
                # Pop an emulator connection.
                connection = self._cons.pop(0)
                if not connection.reader.at_eof():
                    break
                else:
                    log.info(f"{self._name} server connection terminated")
                    self._event_listener.on_server_disconnected(connection.identifier)
        except IndexError:
            log.info(f"{self._name} no emulator connected.")
            writer.close()
            return

        log.info(
            f"{self._name} "
            f"client at {writer.transport.get_extra_info('socket')}"
            f" connected to {connection.writer.transport.get_extra_info('socket')}."
        )

        await self._handle_proxy(
            driver=Connection(
                reader=reader, writer=writer, identifier=connection.identifier
            ),
            server=connection,
        )

        # Return the emulator connection to the pool.
        if not connection.reader.at_eof():
            log.info(f"{self._name} returning connection to pool")
            self._cons.append(connection)
        else:
            log.info(f"{self._name} server connection terminated")
            self._event_listener.on_server_disconnected(connection.identifier)

    async def _handle_proxy(self, driver: Connection, server: Connection) -> None:
        """Connect the driver to the emulator.

        Args:
            driver: Driver connection
            server: Emulator connection

        Returns:
            None
        """
        loop = asyncio.get_event_loop()
        read_from_client_task = loop.create_task(
            self._data_router(driver, server, False)
        )
        read_from_server_task = loop.create_task(
            self._data_router(server, driver, True)
        )
        await read_from_client_task
        read_from_server_task.cancel()
        try:
            await read_from_server_task
        except asyncio.CancelledError:
            log.exception("Server task cancelled")
            pass

    @staticmethod
    async def _data_router(
        in_connection: Connection,
        out_connection: Connection,
        close_other_on_disconnect: bool,
    ) -> None:
        """Route date from in to out.

        Args:
            in_connection: connection to read from.
            out_connection: connection to write to
            close_other_on_disconnect: whether the other connection should
                be closed if the in_connection is closed.
                A driver disconnect should close connection with emulator, while
                an emulator disconnect should close the attached driver.

        Returns:
            None
        """
        while True:
            try:
                d = await in_connection.reader.read(1)
                out_connection.writer.write(d)

                if not d:
                    log.info(
                        f"{in_connection.writer.transport.get_extra_info('socket')} "
                        f"disconnected."
                    )
                    break
            except ConnectionError:
                log.exception("connection error in data router")
                break
        if close_other_on_disconnect:
            out_connection.writer.close()
