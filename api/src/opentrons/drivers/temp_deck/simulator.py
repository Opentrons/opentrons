import asyncio
from typing import Optional, Dict

from opentrons.drivers.types import Temperature
from opentrons.drivers.temp_deck.abstract import AbstractTempDeckDriver

TEMP_DECK_MODELS = {
    "temperatureModuleV1": "temp_deck_v1.1",
    "temperatureModuleV2": "temp_deck_v20",
}


async def _yield() -> None:
    await asyncio.sleep(0)


class SimulatingDriver(AbstractTempDeckDriver):
    def __init__(self, sim_model: Optional[str] = None):
        self._temp = Temperature(target=None, current=0)
        self._port: Optional[str] = None
        self._model = TEMP_DECK_MODELS[sim_model] if sim_model else "temp_deck_v1.1"

    async def set_temperature(self, celsius: float) -> None:
        self._temp.target = celsius
        self._temp.current = self._temp.target
        await _yield()

    async def get_temperature(self) -> Temperature:
        await _yield()
        return self._temp

    async def deactivate(self) -> None:
        self._temp = Temperature(target=None, current=23)
        await _yield()

    async def connect(self) -> None:
        pass

    async def is_connected(self) -> bool:
        return True

    async def disconnect(self) -> None:
        pass

    async def enter_programming_mode(self) -> None:
        await _yield()

    async def get_device_info(self) -> Dict[str, str]:
        await _yield()
        return {
            "serial": "dummySerialTD",
            "model": self._model,
            "version": "dummyVersionTD",
        }
