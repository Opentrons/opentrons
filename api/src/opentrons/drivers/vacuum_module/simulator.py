from typing import Optional

from .abstract import AbstractVacuumModuleDriver
from .types import (
    HardwareRevision,
    LEDColor,
    LEDPattern,
    PressureState,
    PumpState,
    VacuumModuleInfo,
    VentState,
)
from opentrons.util.async_helpers import ensure_yield


class SimulatingDriver(AbstractVacuumModuleDriver):
    def __init__(self, serial_number: Optional[str] = None) -> None:
        self._serial_number = serial_number or "dummySerialFS"
        self.vent_state = VentState.OPENED
        self.vacuum_on = False
        self.pump_enabled = False
        self.pressure_sensor_enabled = False
        self.target_pressure = 0.0
        self.current_pressure = 0.0
        self.target_rpm = 0
        self.current_rpm = 0

    @ensure_yield
    async def connect(self) -> None:
        pass

    @ensure_yield
    async def disconnect(self) -> None:
        pass

    @ensure_yield
    async def is_connected(self) -> bool:
        return True

    def reset_serial_buffers(self) -> None:
        pass

    async def get_device_info(self) -> VacuumModuleInfo:
        return VacuumModuleInfo(
            fw="vacuum-fw", hw=HardwareRevision.NFF, sn=self._serial_number
        )

    async def enter_programming_mode(self) -> None:
        pass

    async def set_serial_number(self, sn: str) -> None:
        self._serial_number = sn

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

    # TODO: update the pressure arg with the units when we find out which unit
    async def set_vacuum_state(
        self,
        enable_vacuum: bool,
        guage_pressure_mbar: Optional[float] = None,
        duration: Optional[int] = None,
        rate: Optional[float] = None,
        vent_after: Optional[bool] = None,
    ) -> None:
        """Engage or release the vacuum until a desired internal pressure is reached."""
        self.vacuum_on = enable_vacuum
        self.target_pressure = guage_pressure_mbar or self.target_pressure

    async def get_vacuum_state(self) -> PressureState:
        """Get the pressure state."""
        return PressureState(
            self.target_pressure,
            self.current_pressure,
            0,
            0,
            0,
            self.vacuum_on,
            self.vent_state,
        )

    async def set_pump_state(
        self,
        start_pump: bool,
        target_rpm: Optional[int] = None,
        duty_cycle: Optional[int] = None,
    ) -> None:
        """Start or the stop the pump at a given rpm or duty cycle."""
        self.pump_enabled = start_pump
        self.target_rpm = target_rpm or self.target_rpm

    async def get_pump_state(self) -> PumpState:
        """Get the pump state."""
        return PumpState(0, 0, 0, 0, False, False)

    async def set_vent_state(self, state: bool) -> None:
        """Opens/Closes the vent, which release the vacuum in the module chamber."""
        self.vent_state = VentState(open)
