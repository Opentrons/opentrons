from typing import Dict, Optional

from .abstract import AbstractVacuumModuleDriver
from .types import (
    LEDColor,
    LEDPattern,
    PressureControlTunings,
    PumpState,
    VacuumState,
    VentState,
    WasteConfigParameters,
)
from opentrons.drivers.asyncio.communication.errors import SerialException
from opentrons.util.async_helpers import ensure_yield


class SimulatingDriver(AbstractVacuumModuleDriver):
    def __init__(
        self, model: Optional[str] = None, serial_number: Optional[str] = None
    ) -> None:
        self._serial_number = serial_number or "dummySerialFS"
        self._model = model if model else "vacuumModuleV1"
        self.vent_state = VentState.OPENED
        self.vacuum_on = False
        self.pump_enabled = False
        self.duration = 0
        self.pressure_sensor_enabled = False
        self.target_pressure = 0.0
        self.current_pressure = 0.0
        self.target_rpm = 0
        self.current_rpm = 0
        self._pending_async_error: Optional[SerialException] = None

    def inject_async_error(self, error: SerialException) -> None:
        """Queue an async module error to raise on the next polled driver read."""
        self._pending_async_error = error

    def _raise_pending_async_error(self) -> None:
        if self._pending_async_error is not None:
            error = self._pending_async_error
            self._pending_async_error = None
            raise error

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

    def reset_serial_buffers(self) -> None:
        pass

    async def get_device_info(self) -> Dict[str, str]:
        return {
            "serial": self._serial_number,
            "version": "vacuum-fw",
            "model": self._model,
            "reset_reason": str(0),
        }

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

    async def set_vacuum_state(
        self,
        enable_vacuum: bool,
        gauge_pressure_mbar: Optional[float] = None,
        duration_s: Optional[int] = None,
        timeout_s: Optional[int] = None,
        rate: Optional[float] = None,
        vent_after: Optional[bool] = None,
    ) -> None:
        """Engage or release the vacuum until a desired internal pressure is reached."""
        self.vacuum_on = enable_vacuum
        self.target_pressure = gauge_pressure_mbar or self.target_pressure
        self.duration = duration_s or 0

    async def get_vacuum_state(self) -> VacuumState:
        """Get the pressure state."""
        self._raise_pending_async_error()
        return VacuumState(
            self.target_pressure,
            self.current_pressure,
            0,
            0,
            0,
            self.vacuum_on,
            self.duration,
            self.vent_state,
        )

    async def set_pump_state(
        self,
        start_pump: bool,
        target_rpm: Optional[int] = None,
        duty_cycle: Optional[int] = None,
        duration_s: Optional[int] = None,
        timeout_s: Optional[int] = None,
        rate: Optional[float] = None,
        vent_after: Optional[bool] = None,
    ) -> None:
        """Start or the stop the pump at a given rpm or duty cycle."""
        self.pump_enabled = start_pump
        self.target_rpm = target_rpm or self.target_rpm

    async def get_pump_state(self) -> PumpState:
        """Get the pump state."""
        self._raise_pending_async_error()
        return PumpState(0, 0, 0, 0, False, False)

    async def set_vent_state(self, state: VentState) -> None:
        """Opens/Closes the vent, which release the vacuum in the module chamber."""
        self.vent_state = state

    async def set_pressure_control_tunings(
        self,
        kp: Optional[float] = None,
        ki: Optional[float] = None,
        kd: Optional[float] = None,
        overshoot: Optional[float] = None,
        k_velocity: Optional[float] = None,
        k_holding: Optional[float] = None,
        tolerance: Optional[float] = None,
        reset: bool = False,
    ) -> None:
        """Sets the PID tuning parameters for the pressure control."""
        pass

    async def get_pressure_control_tunings(self) -> PressureControlTunings:
        """Get the pressure control pid tunings."""
        return PressureControlTunings(0, 0, 0, 0, 0, 0, 0)

    async def set_waste_configs(
        self,
        enable_waste_full_detection: bool,
        p_window_start: Optional[float] = None,
        p_window_end: Optional[float] = None,
        baseline_fast_factor: Optional[float] = None,
        max_delta_per_tick: Optional[float] = None,
        max_rise_per_tick: Optional[float] = None,
        max_cummulative_rise: Optional[float] = None,
        p_filter_alpha: Optional[float] = None,
        min_window_time: Optional[float] = None,
        max_window_time: Optional[float] = None,
    ) -> None:
        """Sets the Waste Full detection algorithm parameters"""
        pass

    async def get_waste_configs(self) -> WasteConfigParameters:
        """Get the waste full detection configs"""
        return WasteConfigParameters(False, 0, 0, 0, 0, 0, 0, 0, 0, 0)
