import asyncio

from opentrons.hardware_control import HardwareAPILike, adapters


async def get_hardware() -> HardwareAPILike:
    return adapters.SingletonAdapter(asyncio.get_event_loop())
