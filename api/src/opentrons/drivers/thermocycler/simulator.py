from typing import Optional, Dict

from opentrons.util.async_helpers import ensure_yield
from opentrons.drivers.thermocycler.abstract import AbstractThermocyclerDriver
from opentrons.drivers.types import Temperature, PlateTemperature, ThermocyclerLidStatus
from opentrons.hardware_control.modules.types import ThermocyclerModuleModel
from opentrons.drivers.asyncio.communication.errors import ErrorResponse


class SimulatingDriver(AbstractThermocyclerDriver):
    DEFAULT_TEMP = 23

    def __init__(
        self, model: Optional[str] = None, serial_number: Optional[str] = None
    ) -> None:
        self._ramp_rate: Optional[float] = None
        self._lid_status = ThermocyclerLidStatus.OPEN
        self._lid_temperature = Temperature(current=self.DEFAULT_TEMP, target=None)
        self._plate_temperature = PlateTemperature(
            current=self.DEFAULT_TEMP, target=None, hold=None
        )
        self._model = model if model else "thermocyclerModuleV1"
        self._serial_number = serial_number

    def model(self) -> str:
        return self._model

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
    async def open_lid(self) -> None:
        self._lid_status = ThermocyclerLidStatus.OPEN

    @ensure_yield
    async def close_lid(self) -> None:
        self._lid_status = ThermocyclerLidStatus.CLOSED

    @ensure_yield
    async def lift_plate(self) -> None:
        if self._model == ThermocyclerModuleModel.THERMOCYCLER_V1.value:
            raise NotImplementedError()
        if self._lid_status != ThermocyclerLidStatus.OPEN:
            raise ErrorResponse(port="sim_port", response="Lid is not open")
        self._lid_status = ThermocyclerLidStatus.OPEN

    @ensure_yield
    async def get_lid_status(self) -> ThermocyclerLidStatus:
        return self._lid_status

    @ensure_yield
    async def get_lid_temperature(self) -> Temperature:
        return self._lid_temperature

    @ensure_yield
    async def set_plate_temperature(
        self,
        temp: float,
        hold_time: Optional[float] = None,
        volume: Optional[float] = None,
    ) -> None:
        self._plate_temperature.target = temp
        self._plate_temperature.current = temp
        self._plate_temperature.hold = 0

    @ensure_yield
    async def get_plate_temperature(self) -> PlateTemperature:
        return self._plate_temperature

    @ensure_yield
    async def set_ramp_rate(self, ramp_rate: float) -> None:
        self._ramp_rate = ramp_rate

    @ensure_yield
    async def set_lid_temperature(self, temp: float) -> None:
        """Set the lid temperature in deg Celsius"""
        self._lid_temperature.target = temp
        self._lid_temperature.current = temp

    @ensure_yield
    async def deactivate_lid(self) -> None:
        self._lid_temperature.target = None
        self._lid_temperature.current = self.DEFAULT_TEMP

    @ensure_yield
    async def deactivate_block(self) -> None:
        self._plate_temperature.target = None
        self._plate_temperature.current = self.DEFAULT_TEMP
        self._plate_temperature.hold = None
        self._ramp_rate = None

    @ensure_yield
    async def deactivate_all(self) -> None:
        await self.deactivate_lid()
        await self.deactivate_block()

    @ensure_yield
    async def get_device_info(self) -> Dict[str, str]:
        return {
            "serial": self._serial_number if self._serial_number else "dummySerialTC",
            "model": "dummyModelTC",
            "version": "dummyVersionTC",
        }

    @ensure_yield
    async def enter_programming_mode(self) -> None:
        pass

    @ensure_yield
    async def jog_lid(self, angle: float) -> None:
        if self._model == ThermocyclerModuleModel.THERMOCYCLER_V1.value:
            raise NotImplementedError()
        self._lid_status = (
            ThermocyclerLidStatus.IN_BETWEEN
            if angle < 0
            else ThermocyclerLidStatus.OPEN
        )
