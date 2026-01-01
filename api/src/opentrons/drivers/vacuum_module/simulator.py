from typing import Optional

from .abstract import AbstractVacuumModuleDriver
from .types import VacuumModuleInfo, HardwareRevision, LEDPattern, LEDColor
from opentrons.util.async_helpers import ensure_yield


class SimulatingDriver(AbstractVacuumModuleDriver):
    def __init__(self, serial_number: str) -> None:
        self._serial_number = serial_number
        self.vacuum_on = False
        self.pump_enabled = False
        self.pressure_sensor_enabled = False

    @ensure_yield
    async def connect(self) -> None:
        pass

    @ensure_yield
    async def disconnect(self) -> None:
        pass

    @ensure_yield
    async def is_connected(self) -> bool:
        return True

    async def get_device_info(self) -> VacuumModuleInfo:
        return VacuumModuleInfo(
            fw="vacuum-fw", hw=HardwareRevision.NFF, sn=self._serial_number
        )

    async def set_serial_number(self, sn: str) -> None:
        self._serial_number = sn

    async def enable_pump(self) -> None:
        self.pump_enabled = True

    async def disable_pump(self) -> None:
        self.pump_enabled = False

    async def get_pump_motor_register(self) -> None:
        """Get the register value of the pump motor driver."""
        pass

    async def get_pressure_sensor_register(self) -> None:
        """Get the register value of the pressure sensor driver."""
        pass

    async def get_pressure_sensor_reading(self) -> float:
        """Get a reading from the pressure sensor."""
        return 0.0

    # TODO: update the pressure arg with the units when we find out which unit
    async def set_vacuum_chamber_pressure(
        self,
        guage_pressure_mbar: float,
        duration: Optional[float],
        rate: Optional[float],
        vent_after: bool = False,
    ) -> None:
        """Engage or release the vacuum until a desired internal pressure is reached."""
        pass

    async def engage_vacuum(self, pump_power: Optional[float] = None) -> None:
        self.vacuum_on = True

    async def vent(self, delay_s: float = 0.0) -> None:
        self.vacuum_on = False

    async def set_led(
        self,
        power: float,
        color: Optional[LEDColor] = None,
        external: Optional[bool] = None,
        pattern: Optional[LEDPattern] = None,
        duration: Optional[int] = None,  # Default firmware duration is 500ms
        reps: Optional[int] = None,  # Default firmware reps is 0
    ) -> None:
        pass

    async def enter_programming_mode(self) -> None:
        pass

    async def reset_serial_buffers(self) -> None:
        pass
