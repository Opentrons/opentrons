from typing import Dict, Optional, Protocol

from opentrons.drivers.vacuum_module.types import (
    LEDColor,
    LEDPattern,
    PressureControlTunings,
    PumpState,
    VacuumState,
    VentState,
    WasteConfigParameters,
)


class AbstractVacuumModuleDriver(Protocol):
    """Protocol for the Vacuum Module driver."""

    async def connect(self) -> None:
        """Connect to vacuum module."""
        ...

    async def disconnect(self) -> None:
        """Disconnect from vacuum module."""
        ...

    async def is_connected(self) -> bool:
        """Check connection to vacuum module."""
        ...

    async def get_device_info(self) -> Dict[str, str]:
        """Get Device Info."""
        ...

    async def set_serial_number(self, sn: str) -> None:
        """Set Serial Number."""
        ...

    async def enter_programming_mode(self) -> None:
        """Reboot into programming mode"""
        ...

    def reset_serial_buffers(self) -> None:
        """Reset the input and output serial buffers."""
        ...

    async def move_port(self, new_port: str) -> None:
        """Try to change the port of the underlying connection."""
        ...

    async def set_led(
        self,
        power: float,
        color: Optional[LEDColor] = None,
        external: Optional[bool] = None,
        pattern: Optional[LEDPattern] = None,
        duration: Optional[int] = None,  # Default firmware duration is 500ms
        reps: Optional[int] = None,  # Default firmware reps is 0
    ) -> None:
        """Set LED Status bar color and pattern."""
        ...

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
        ...

    async def get_vacuum_state(self) -> VacuumState:
        """Get the pressure state."""
        ...

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
        ...

    async def get_pump_state(self) -> PumpState:
        """Get the pump state."""
        ...

    async def set_vent_state(self, state: VentState) -> None:
        """Opens/Closes the vent, which release the vacuum in the module chamber."""
        ...

    async def set_pressure_control_tunings(
        self,
        kp: Optional[float] = None,
        ki: Optional[float] = None,
        kd: Optional[float] = None,
        overshoot: Optional[float] = None,
        k_velocity: Optional[float] = None,
        k_holding: Optional[float] = None,
        tolerance: Optional[float] = None,
        approach_band: Optional[float] = None,
        slew_end_fraction: Optional[float] = None,
        reset: bool = False,
    ) -> None:
        """Sets the PID tuning parameters for pressure control."""
        ...

    async def get_pressure_control_tunings(self) -> PressureControlTunings:
        """Get the pressure control pid tunings."""
        ...

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
        ...

    async def get_waste_configs(self) -> WasteConfigParameters:
        """Get the waste full detection configs"""
        ...
