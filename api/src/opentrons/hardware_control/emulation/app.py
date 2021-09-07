import asyncio
import logging
from opentrons.hardware_control.emulation.connection_handler import ConnectionHandler
from opentrons.hardware_control.emulation.magdeck import MagDeckEmulator
from opentrons.hardware_control.emulation.parser import Parser
from opentrons.hardware_control.emulation.settings import Settings
from opentrons.hardware_control.emulation.tempdeck import TempDeckEmulator
from opentrons.hardware_control.emulation.thermocycler import ThermocyclerEmulator
from opentrons.hardware_control.emulation.smoothie import SmoothieEmulator

logger = logging.getLogger(__name__)


SMOOTHIE_PORT = 9996
THERMOCYCLER_PORT = 9997
TEMPDECK_PORT = 9998
MAGDECK_PORT = 9999


class ServerManager:
    """
    Class to start and stop emulated smoothie and modules.
    """

    def __init__(self, settings=Settings()) -> None:
        host = settings.host
        self._mag_emulator = MagDeckEmulator(parser=Parser())
        self._temp_emulator = TempDeckEmulator(parser=Parser())
        self._therm_emulator = ThermocyclerEmulator(parser=Parser())
        self._smoothie_emulator = SmoothieEmulator(
            parser=Parser(), settings=settings.smoothie
        )

        self._mag_server = self._create_server(
            host=host,
            port=MAGDECK_PORT,
            handler=ConnectionHandler(self._mag_emulator),
        )
        self._temp_server = self._create_server(
            host=host,
            port=TEMPDECK_PORT,
            handler=ConnectionHandler(self._temp_emulator),
        )
        self._therm_server = self._create_server(
            host=host,
            port=THERMOCYCLER_PORT,
            handler=ConnectionHandler(self._therm_emulator),
        )
        self._smoothie_server = self._create_server(
            host=host,
            port=SMOOTHIE_PORT,
            handler=ConnectionHandler(self._smoothie_emulator),
        )

    async def run(self):
        await asyncio.gather(
            self._mag_server,
            self._temp_server,
            self._therm_server,
            self._smoothie_server,
        )

    @staticmethod
    async def _create_server(host: str, port: int, handler: ConnectionHandler) -> None:
        """Run a server."""
        server = await asyncio.start_server(handler, host, port)

        async with server:
            await server.serve_forever()

    def reset(self):
        self._smoothie_emulator.reset()
        self._mag_emulator.reset()
        self._temp_emulator.reset()
        self._therm_emulator.reset()

    def stop(self):
        self._smoothie_server.close()
        self._temp_server.close()
        self._therm_server.close()
        self._mag_server.close()


if __name__ == "__main__":
    logging.basicConfig(format="%(asctime)s:%(message)s", level=logging.DEBUG)
    asyncio.run(ServerManager().run())
