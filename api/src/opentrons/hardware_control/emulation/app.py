import asyncio
import logging

from opentrons.hardware_control.emulation.connection_handler import \
    ConnectionHandler
from opentrons.hardware_control.emulation.magdeck import MagDeckEmulator
from opentrons.hardware_control.emulation.tempdeck import TempDeckEmulator
from opentrons.hardware_control.emulation.thermocycler import ThermocyclerEmulator
from opentrons.hardware_control.emulation.smoothie import SmoothieEmulator

logger = logging.getLogger(__name__)


SMOOTHIE_PORT = 9996
THERMOCYCLER_PORT = 9997
TEMPDECK_PORT = 9998
MAGDECK_PORT = 9999


async def run_server(host: str, port: int, handler: ConnectionHandler) -> None:
    """Run a server."""
    server = await asyncio.start_server(handler, host, port)

    async with server:
        await server.serve_forever()


async def run() -> None:
    """Run the module emulators."""
    host = "127.0.0.1"

    await asyncio.gather(
        run_server(host=host,
                   port=MAGDECK_PORT,
                   handler=ConnectionHandler(MagDeckEmulator())),
        run_server(host=host,
                   port=TEMPDECK_PORT,
                   handler=ConnectionHandler(TempDeckEmulator())),
        run_server(host=host,
                   port=THERMOCYCLER_PORT,
                   handler=ConnectionHandler(ThermocyclerEmulator())),
        run_server(host=host,
                   port=SMOOTHIE_PORT,
                   handler=ConnectionHandler(SmoothieEmulator())),
    )


if __name__ == "__main__":
    h = logging.StreamHandler()
    h.setLevel(logging.DEBUG)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(h)
    asyncio.run(run())
