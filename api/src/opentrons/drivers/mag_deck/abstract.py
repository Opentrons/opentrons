from abc import ABC, abstractmethod
from typing import Dict


class AbstractMagDeckDriver(ABC):
    @abstractmethod
    async def connect(self) -> None:
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        ...

    @abstractmethod
    async def is_connected(self) -> bool:
        pass

    @abstractmethod
    async def home(self) -> None:
        ...

    @abstractmethod
    async def probe_plate(self) -> None:
        ...

    @abstractmethod
    async def get_plate_height(self) -> float:
        ...

    @abstractmethod
    async def get_mag_position(self) -> float:
        ...

    @abstractmethod
    async def move(self, position_mm: float) -> None:
        ...

    @abstractmethod
    async def get_device_info(self) -> Dict[str, str]:
        ...

    @abstractmethod
    async def enter_programming_mode(self) -> None:
        ...
