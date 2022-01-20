import asyncio
import logging

from opentrons.hardware_control.emulation.module_server import ModuleStatusServer
from opentrons.hardware_control.emulation.proxy import Proxy
from opentrons.hardware_control.emulation.settings import Settings
from opentrons.hardware_control.emulation.types import ModuleType

logger = logging.getLogger(__name__)


class Application:
    """The emulator application."""

    def __init__(self, settings: Settings) -> None:
        """Constructor.

        Args:
            settings: Application settings.
        """
        self._settings = settings
        self._status_server = ModuleStatusServer(settings.module_server)
        self._magdeck = Proxy(
            ModuleType.Magnetic, self._status_server, self._settings.magdeck_proxy
        )
        self._temperature = Proxy(
            ModuleType.Temperature,
            self._status_server,
            self._settings.temperature_proxy,
        )
        self._thermocycler = Proxy(
            ModuleType.Thermocycler,
            self._status_server,
            self._settings.thermocycler_proxy,
        )
        self._heatershaker = Proxy(
            ModuleType.Heatershaker,
            self._status_server,
            self._settings.heatershaker_proxy,
        )

    async def run(self) -> None:
        """Run the application."""
        await asyncio.gather(
            self._status_server.run(),
            self._magdeck.run(),
            self._temperature.run(),
            self._thermocycler.run(),
            self._heatershaker.run(),
        )


if __name__ == "__main__":
    logging.basicConfig(format="%(asctime)s:%(message)s", level=logging.DEBUG)
    s = Settings()
    asyncio.run(Application(settings=s).run())
