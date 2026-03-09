from typing import Optional, Dict

from opentrons.util.async_helpers import ensure_yield
from opentrons.drivers.types import Temperature
from opentrons.drivers.temp_deck.abstract import AbstractTempDeckDriver

TEMP_DECK_MODELS = {
    "temperatureModuleV1": "temp_deck_v1.1",
    "temperatureModuleV2": "temp_deck_v20",
}


class SimulatingDriver(AbstractTempDeckDriver):
    def __init__(
        self, sim_model: Optional[str] = None, serial_number: Optional[str] = None
    ):
        self._temp = Temperature(target=None, current=0)
        self._port: Optional[str] = None
        self._model = TEMP_DECK_MODELS[sim_model] if sim_model else "temp_deck_v1.1"
        self._serial_number = serial_number

    @ensure_yield
    async def set_temperature(self, celsius: float) -> None:
        self._temp.target = celsius
        self._temp.current = self._temp.target

    @ensure_yield
    async def get_temperature(self) -> Temperature:
        return self._temp

    @ensure_yield
    async def deactivate(self) -> None:
        self._temp = Temperature(target=None, current=23)

    @ensure_yield
    async def connect(self) -> None:
        pass

    @ensure_yield
    async def is_connected(self) -> bool:
        return True

    @ensure_yield
    async def disconnect(self) -> None:
        pass

    @ensure_yield
    async def enter_programming_mode(self) -> None:
        pass

    @ensure_yield
    async def get_device_info(self) -> Dict[str, str]:
        return {
            "serial": self._serial_number if self._serial_number else "dummySerialTD",
            "model": self._model,
            "version": "dummyVersionTD",
        }
