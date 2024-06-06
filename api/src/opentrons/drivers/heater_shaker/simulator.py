from typing import Dict, Optional
from opentrons.util.async_helpers import ensure_yield
from opentrons.drivers.heater_shaker.abstract import AbstractHeaterShakerDriver
from opentrons.drivers.types import Temperature, RPM, HeaterShakerLabwareLatchStatus


class SimulatingDriver(AbstractHeaterShakerDriver):
    DEFAULT_TEMP = 23

    def __init__(self, serial_number: Optional[str] = None) -> None:
        self._labware_latch_state = HeaterShakerLabwareLatchStatus.IDLE_UNKNOWN
        self._current_temperature = self.DEFAULT_TEMP
        self._temperature = Temperature(current=self.DEFAULT_TEMP, target=None)
        self._rpm = RPM(current=0, target=None)
        self._homing_status = True
        self._serial_number = serial_number

    @ensure_yield
    async def connect(self) -> None:
        pass

    @ensure_yield
    async def disconnect(self) -> None:
        pass

    @ensure_yield
    async def is_connected(self) -> bool:
        return True

    @ensure_yield
    async def open_labware_latch(self) -> None:
        self._labware_latch_state = HeaterShakerLabwareLatchStatus.IDLE_OPEN

    @ensure_yield
    async def close_labware_latch(self) -> None:
        self._labware_latch_state = HeaterShakerLabwareLatchStatus.IDLE_CLOSED

    @ensure_yield
    async def get_labware_latch_status(self) -> HeaterShakerLabwareLatchStatus:
        return self._labware_latch_state

    @ensure_yield
    async def set_temperature(self, temperature: float) -> None:
        self._temperature.current = temperature
        self._temperature.target = temperature if temperature != 0.0 else None

    @ensure_yield
    async def get_temperature(self) -> Temperature:
        return self._temperature

    @ensure_yield
    async def set_rpm(self, rpm: int) -> None:
        self._rpm.target = rpm if rpm != 0 else None
        self._rpm.current = rpm
        self._homing_status = False

    @ensure_yield
    async def get_rpm(self) -> RPM:
        return self._rpm

    @ensure_yield
    async def home(self) -> None:
        self._rpm.target = None
        self._rpm.current = 0
        self._homing_status = True

    @ensure_yield
    async def deactivate_heater(self) -> None:
        self._temperature.target = None
        self._temperature.current = 23

    @ensure_yield
    async def deactivate_shaker(self) -> None:
        self._rpm.target = 0
        self._rpm.current = 0

    @ensure_yield
    async def deactivate(self) -> None:
        self._temperature.target = None
        self._temperature.current = 23
        self._rpm.target = 0
        self._rpm.current = 0

    @ensure_yield
    async def get_device_info(self) -> Dict[str, str]:
        return {
            "serial": self._serial_number if self._serial_number else "dummySerialHS",
            "model": "dummyModelHS",
            "version": "dummyVersionHS",
        }

    @ensure_yield
    async def enter_programming_mode(self) -> None:
        pass
