from typing import Dict, Optional

from .abstract import AbstractMagDeckDriver
from opentrons.util.async_helpers import ensure_yield


MAG_DECK_MODELS = {
    "magneticModuleV1": "mag_deck_v1.1",
    "magneticModuleV2": "mag_deck_v20",
}


class SimulatingDriver(AbstractMagDeckDriver):
    def __init__(
        self, sim_model: Optional[str] = None, serial_number: Optional[str] = None
    ) -> None:
        self._height = 0.0
        self._model = MAG_DECK_MODELS[sim_model] if sim_model else "mag_deck_v1.1"
        self._serial_number = serial_number

    @ensure_yield
    async def probe_plate(self) -> None:
        pass

    @ensure_yield
    async def home(self) -> None:
        pass

    @ensure_yield
    async def move(self, location: float) -> None:
        self._height = location

    @ensure_yield
    async def get_device_info(self) -> Dict[str, str]:
        return {
            "serial": self._serial_number if self._serial_number else "dummySerialMD",
            "model": self._model,
            "version": "dummyVersionMD",
        }

    @ensure_yield
    async def connect(self) -> None:
        pass

    @ensure_yield
    async def disconnect(self) -> None:
        pass

    @ensure_yield
    async def enter_programming_mode(self) -> None:
        pass

    @ensure_yield
    async def is_connected(self) -> bool:
        return True

    @ensure_yield
    async def get_plate_height(self) -> float:
        return self._height

    @ensure_yield
    async def get_mag_position(self) -> float:
        return self._height
