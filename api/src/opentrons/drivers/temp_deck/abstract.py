from abc import ABC, abstractmethod
from typing import Dict

from opentrons.drivers.types import Temperature


class AbstractTempDeckDriver(ABC):
    @abstractmethod
    async def connect(self) -> None:
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        ...

    @abstractmethod
    async def is_connected(self) -> bool:
        ...

    @abstractmethod
    async def deactivate(self) -> None:
        ...

    @abstractmethod
    async def set_temperature(self, celsius: float) -> None:
        ...

    @abstractmethod
    async def get_temperature(self) -> Temperature:
        ...

    @abstractmethod
    async def get_device_info(self) -> Dict[str, str]:
        """
        Queries Temp-Deck for its build version, model, and serial number

        returns: dict
            Where keys are the strings 'version', 'model', and 'serial',
            and each value is a string identifier

            {
                'serial': '1aa11bb22',
                'model': '1aa11bb22',
                'version': '1aa11bb22'
            }

        Example input from Temp-Deck's serial response:
            "serial:aa11bb22 model:aa11bb22 version:aa11bb22"
        """
        ...

    @abstractmethod
    async def enter_programming_mode(self) -> None:
        ...
