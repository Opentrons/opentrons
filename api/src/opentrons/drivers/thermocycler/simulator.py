from typing import Optional, Dict

from opentrons.drivers.thermocycler.abstract import AbstractThermocyclerDriver
from opentrons.drivers.types import Temperature, PlateTemperature, ThermocyclerLidStatus


class SimulatingDriver(AbstractThermocyclerDriver):
    DEFAULT_TEMP = 23

    def __init__(self, model: Optional[str] = None) -> None:
        self._ramp_rate: Optional[float] = None
        self._lid_status = ThermocyclerLidStatus.OPEN
        self._lid_temperature = Temperature(current=self.DEFAULT_TEMP, target=None)
        self._plate_temperature = PlateTemperature(
            current=self.DEFAULT_TEMP, target=None, hold=None
        )
        self._model = model if model else "thermocyclerModuleV1"

    def model(self) -> str:
        return self._model

    async def connect(self) -> None:
        pass

    async def disconnect(self) -> None:
        pass

    async def is_connected(self) -> bool:
        return True

    async def open_lid(self) -> None:
        self._lid_status = ThermocyclerLidStatus.OPEN

    async def close_lid(self) -> None:
        self._lid_status = ThermocyclerLidStatus.CLOSED

    async def get_lid_status(self) -> ThermocyclerLidStatus:
        return self._lid_status

    async def get_lid_temperature(self) -> Temperature:
        return self._lid_temperature

    async def set_plate_temperature(
        self,
        temp: float,
        hold_time: Optional[float] = None,
        volume: Optional[float] = None,
    ) -> None:
        self._plate_temperature.target = temp
        self._plate_temperature.current = temp
        self._plate_temperature.hold = hold_time

    async def get_plate_temperature(self) -> PlateTemperature:
        return self._plate_temperature

    async def set_ramp_rate(self, ramp_rate: float) -> None:
        self._ramp_rate = ramp_rate

    async def set_lid_temperature(self, temp: float) -> None:
        """Set the lid temperature in deg Celsius"""
        self._lid_temperature.target = temp
        self._lid_temperature.current = temp

    async def deactivate_lid(self) -> None:
        self._lid_temperature.target = None
        self._lid_temperature.current = self.DEFAULT_TEMP

    async def deactivate_block(self) -> None:
        self._plate_temperature.target = None
        self._plate_temperature.current = self.DEFAULT_TEMP
        self._plate_temperature.hold = None
        self._ramp_rate = None

    async def deactivate_all(self) -> None:
        await self.deactivate_lid()
        await self.deactivate_block()

    async def get_device_info(self) -> Dict[str, str]:
        return {
            "serial": "dummySerialTC",
            "model": "dummyModelTC",
            "version": "dummyVersionTC",
        }

    async def enter_programming_mode(self) -> None:
        pass
