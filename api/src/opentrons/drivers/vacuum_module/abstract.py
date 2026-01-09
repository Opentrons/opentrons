from typing import Optional, Protocol

from .types import LEDColor, LEDPattern, PressureState, PumpState, VacuumModuleInfo


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

    async def get_device_info(self) -> VacuumModuleInfo:
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
        guage_pressure_mbar: Optional[float] = None,
        duration: Optional[int] = None,
        rate: Optional[float] = None,
        vent_after: Optional[bool] = None,
    ) -> None:
        """Engage or release the vacuum until a desired internal pressure is reached."""
        ...

    async def get_vacuum_state(self) -> PressureState:
        """Get the pressure state."""
        ...

    async def set_pump_state(
        self,
        start_pump: bool,
        target_rpm: Optional[int] = None,
        duty_cycle: Optional[int] = None,
    ) -> None:
        """Start or the stop the pump at a given rpm or duty cycle."""
        ...

    async def get_pump_state(self) -> PumpState:
        """Get the pump state."""
        ...

    async def set_vent_state(self, state: bool) -> None:
        """Opens/Closes the vent, which release the vacuum in the module chamber."""
        ...
