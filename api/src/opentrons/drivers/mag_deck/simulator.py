import asyncio

from typing import Dict, Optional

from .abstract import AbstractMagDeckDriver


MAG_DECK_MODELS = {
    "magneticModuleV1": "mag_deck_v1.1",
    "magneticModuleV2": "mag_deck_v20",
}


async def _yield() -> None:
    await asyncio.sleep(0)


class SimulatingDriver(AbstractMagDeckDriver):
    def __init__(self, sim_model: Optional[str] = None) -> None:
        self._height = 0.0
        self._model = MAG_DECK_MODELS[sim_model] if sim_model else "mag_deck_v1.1"

    async def probe_plate(self) -> None:
        await _yield()

    async def home(self) -> None:
        await _yield()

    async def move(self, location: float) -> None:
        self._height = location
        await _yield()

    async def get_device_info(self) -> Dict[str, str]:
        await _yield()
        return {
            "serial": "dummySerialMD",
            "model": self._model,
            "version": "dummyVersionMD",
        }

    async def connect(self) -> None:
        pass

    async def disconnect(self) -> None:
        pass

    async def enter_programming_mode(self) -> None:
        await _yield()

    async def is_connected(self) -> bool:
        await _yield()
        return True

    async def get_plate_height(self) -> float:
        await _yield()
        return self._height

    async def get_mag_position(self) -> float:
        await _yield()
        return self._height
