"""Utililty methods and classes for interacting with the Module Status Server."""

import asyncio
from typing import Sequence, Set, Callable, List, Awaitable

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.emulation.module_server.client import (
    ModuleStatusClient,
    ModuleServerClientError,
    ModuleServerDisconnected,
)
from opentrons.hardware_control.emulation.module_server.models import Message
from opentrons.hardware_control.emulation.module_server.server import log
from opentrons.hardware_control.emulation.settings import Settings
from opentrons.hardware_control.emulation.types import ModuleType
from opentrons.hardware_control.modules import ModuleAtPort

NotifyMethod = Callable[[List[ModuleAtPort], List[ModuleAtPort]], Awaitable[None]]
"""Signature of method to be notified of new and removed modules."""


async def listen_module_connection(callback: NotifyMethod) -> None:
    """Listen for module emulator connections."""
    settings = Settings()
    try:
        client = await ModuleStatusClient.connect(
            host=settings.module_server.host,
            port=settings.module_server.port,
            interval_seconds=1.0,
        )
        listener = ModuleListener(client=client, notify_method=callback)
        await listener.run()
    except IOError:
        log.exception("Failed to connect to module server.")


class ModuleListener:
    """Provide a callback for listening for new and removed module connections."""

    def __init__(self, client: ModuleStatusClient, notify_method: NotifyMethod) -> None:
        """Constructor.

        Args:
            client: A module server client
            notify_method: callback method.

        Returns:
            None
        """
        self._client = client
        self._notify_method = notify_method
        self._hub_index = 1

    async def run(self) -> None:
        """Run the listener."""
        while True:
            try:
                m = await self._client.read()
                await self.handle_message(message=m)
            except ModuleServerDisconnected:
                log.info("Disconnected from module server.")
                break
            except ModuleServerClientError:
                log.exception("Read error.")
                break

    async def handle_message(self, message: Message) -> None:
        """Call callback with results of message.

        Args:
            message: Message object from module server

        Returns:
            None
        """

        def _next_index() -> int:
            index = self._hub_index
            self._hub_index += 1
            return index

        connections = [
            ModuleAtPort(
                port=c.url,
                name=c.module_type,
                usb_port=USBPort(name=c.identifier, port_number=0, hub=_next_index()),
            )
            for c in message.connections
        ]
        if message.status == "connected" or message.status == "dump":
            await self._notify_method(connections, [])
        elif message.status == "disconnected":
            await self._notify_method([], connections)


async def wait_emulators(
    client: ModuleStatusClient,
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

    async def _wait_modules() -> None:
        """Read messages from module server waiting for modules in module_set to
        be connected."""
        module_set: Set[str] = set(modules)

        while module_set:
            m: Message = await client.read()
            if m.status == "dump" or m.status == "connected":
                for c in m.connections:
                    module_set.discard(c.module_type)
            elif m.status == "disconnected":
                for c in m.connections:
                    module_set.add(c.module_type)

            log.debug(f"after message: {m}, awaiting module set is: {module_set}")

    await asyncio.wait_for(_wait_modules(), timeout=timeout)
