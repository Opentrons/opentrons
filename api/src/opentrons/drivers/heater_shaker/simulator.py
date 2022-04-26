from typing import Dict
from opentrons.drivers.heater_shaker.abstract import AbstractHeaterShakerDriver
from opentrons.drivers.types import Temperature, RPM, HeaterShakerLabwareLatchStatus


class SimulatingDriver(AbstractHeaterShakerDriver):
    DEFAULT_TEMP = 23

    def __init__(self) -> None:
        self._labware_latch_state = HeaterShakerLabwareLatchStatus.IDLE_UNKNOWN
        self._current_temperature = self.DEFAULT_TEMP
        self._temperature = Temperature(current=self.DEFAULT_TEMP, target=None)
        self._rpm = RPM(current=0, target=None)
        self._homing_status = True

    async def connect(self) -> None:
        pass

    async def disconnect(self) -> None:
        pass

    async def is_connected(self) -> bool:
        return True

    async def open_labware_latch(self) -> None:
        self._labware_latch_state = HeaterShakerLabwareLatchStatus.IDLE_OPEN

    async def close_labware_latch(self) -> None:
        self._labware_latch_state = HeaterShakerLabwareLatchStatus.IDLE_CLOSED

    async def get_labware_latch_status(self) -> HeaterShakerLabwareLatchStatus:
        return self._labware_latch_state

    async def set_temperature(self, temperature: float) -> None:
        self._temperature.current = temperature
        self._temperature.target = temperature if temperature != 0.0 else None

    async def get_temperature(self) -> Temperature:
        return self._temperature

    async def set_rpm(self, rpm: int) -> None:
        self._rpm.target = rpm if rpm != 0 else None
        self._rpm.current = rpm
        self._homing_status = False

    async def get_rpm(self) -> RPM:
        return self._rpm

    async def home(self) -> None:
        self._rpm.target = None
        self._rpm.current = 0
        self._homing_status = True

    async def deactivate_heater(self) -> None:
        self._temperature.target = None
        self._temperature.current = 23

    async def deactivate_shaker(self) -> None:
        self._rpm.target = 0
        self._rpm.current = 0

    async def deactivate(self) -> None:
        self._temperature.target = None
        self._temperature.current = 23
        self._rpm.target = 0
        self._rpm.current = 0

    async def get_device_info(self) -> Dict[str, str]:
        return {
            "serial": "dummySerialHS",
            "model": "dummyModelHS",
            "version": "dummyVersionHS",
        }

    async def enter_programming_mode(self) -> None:
        pass
