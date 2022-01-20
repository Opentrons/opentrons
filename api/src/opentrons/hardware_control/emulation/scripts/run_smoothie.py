"""Script for starting up a python smoothie emulator."""
import logging
import asyncio

from opentrons.hardware_control.emulation.smoothie import SmoothieEmulator
from opentrons.hardware_control.emulation.parser import Parser


from opentrons.hardware_control.emulation.run_emulator import run_emulator_server
from opentrons.hardware_control.emulation.settings import Settings


async def run(settings: Settings) -> None:
    """Run the smoothie emulator.

    Args:
        settings: emulator settings

    Returns:
        None
    """
    smoothie = SmoothieEmulator(parser=Parser(), settings=settings.smoothie)
    await run_emulator_server(
        host=settings.smoothie.host,
        port=settings.smoothie.port,
        emulator=smoothie,
    )


def main() -> None:
    """Entry point."""
    logging.basicConfig(format="%(asctime)s:%(message)s", level=logging.DEBUG)
    asyncio.run(run(Settings()))


if __name__ == "__main__":
    main()
