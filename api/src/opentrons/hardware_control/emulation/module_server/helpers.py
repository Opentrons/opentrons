import asyncio
from typing import Sequence, Set, Callable, List, Awaitable

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.hardware_control.emulation.module_server.client import ModuleServerClient
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
        client = await ModuleServerClient.connect(host=settings.module_server.host, port=settings.module_server.port, interval_seconds=1.0)
        listener = ModuleListener(client=client, notify_method=callback)
        await listener.run()
    except IOError:
        log.exception("Failed to connect to module server.")


class ModuleListener:
    """Provide a callback for listening for new and removed module connections."""

    def __init__(self, client: ModuleServerClient, notify_method: NotifyMethod) -> None:
        """Constructor.

        Args:
            client: A module server client
            notify_method: callback method.

        Returns:
            None
        """
        self._client = client
        self._notify_method = notify_method

    async def run(self) -> None:
        """Run the listener."""
        while True:
            m = await self._client.read()
            await self.message_to_notify(message=m, notify_method=self._notify_method)

    @staticmethod
    async def message_to_notify(message: Message, notify_method: NotifyMethod) -> None:
        """Call callback with results of message.

        Args:
            message: Message object from module server
            notify_method: callback method

        Returns:
            None
        """
        connections = [
            ModuleAtPort(
                port=c.url,
                name=c.module_type,
                usb_port=USBPort(name=c.identifier, sub_names=[]),
            )
            for c in message.connections
        ]
        if message.status == "connected" or message.status == "dump":
            await notify_method(connections, [])
        elif message.status == "disconnected":
            await notify_method([], connections)


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
