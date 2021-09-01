from typing import Dict

from .abstract import AbstractMagDeckDriver


MAG_DECK_MODELS = {
    "magneticModuleV1": "mag_deck_v1.1",
    "magneticModuleV2": "mag_deck_v20",
}


class SimulatingDriver(AbstractMagDeckDriver):
    def __init__(self, sim_model: str = None):
        self._height = 0.0
        self._model = MAG_DECK_MODELS[sim_model] if sim_model else "mag_deck_v1.1"

    async def probe_plate(self):
        pass

    async def home(self):
        pass

    async def move(self, location: float):
        self._height = location

    async def get_device_info(self) -> Dict[str, str]:
        return {
            "serial": "dummySerialMD",
            "model": self._model,
            "version": "dummyVersionMD",
        }

    async def connect(self):
        pass

    async def disconnect(self):
        pass

    async def enter_programming_mode(self):
        pass

    async def is_connected(self) -> bool:
        return True

    async def get_plate_height(self) -> float:
        return self._height

    async def get_mag_position(self) -> float:
        return self._height
