import asyncio

from opentrons.hardware_control.emulation.abstract_emulator import AbstractEmulator
from opentrons.hardware_control.emulation.connection_handler import ConnectionHandler
from opentrons.hardware_control.emulation.magdeck import MagDeckEmulator
from opentrons.hardware_control.emulation.parser import Parser
from opentrons.hardware_control.emulation.settings import Settings


async def run_emulator(host: str, port: int, emulator: AbstractEmulator) -> None:
    """

    Args:
        host:
        port:
        emulator:

    Returns:

    """
    r, w = await asyncio.open_connection(host, port)
    connection = ConnectionHandler(emulator)
    await connection(r, w)


if __name__ == "__main__":
    settings = Settings()

    e = MagDeckEmulator(Parser())

    asyncio.run(run_emulator("localhost", settings.magdeck_proxy.emulator_port, e))
