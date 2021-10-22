import asyncio
from typing import Sequence, Set

from opentrons.hardware_control.emulation.module_server.client import \
    ModuleServerClient
from opentrons.hardware_control.emulation.module_server.models import Message
from opentrons.hardware_control.emulation.module_server.server import log
from opentrons.hardware_control.emulation.types import ModuleType


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
