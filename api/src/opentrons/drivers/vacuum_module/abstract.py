from typing import Protocol, Optional

from .types import VacuumModuleInfo, LEDColor, LEDPattern


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

    async def enable_pump(self) -> None:
        """Enable the vacuum pump."""
        ...

    async def disable_pump(self) -> None:
        """Disable the vacuum pump."""
        ...

    async def get_pump_motor_register(self) -> None:
        """Get the register value of the pump motor driver."""
        ...

    async def get_pressure_sensor_register(self) -> None:
        """Get the register value of the pressure sensor driver."""
        ...

    async def get_pressure_sensor_reading_psi(self) -> float:
        """Get a reading from the pressure sensor."""
        ...

    async def set_vacuum_chamber_pressure(
        self,
        gage_pressure_mbarg: float,
        duration: Optional[float],
        rate: Optional[float],
    ) -> None:
        """Engage or release the vacuum until a desired internal pressure is reached."""
        ...

    async def get_gage_pressure_reading_mbarg(self) -> float:
        """Read each pressure sensor and return the pressure difference."""
        return 0.0

    # TODO: change pump power to be more specific when we find out how were gonna operate that
    async def engage_vacuum(self, pump_power: Optional[float] = None) -> None:
        """Engage the vacuum without regard to chamber pressure."""
        ...

    async def disengage_vacuum_pump(self) -> None:
        """Stops the vacuum pump, doesn't vent air or disable the motor."""
        ...

    async def vent(self) -> None:
        """Release the vacuum in the module chamber."""
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

    async def enter_programming_mode(self) -> None:
        """Reboot into programming mode"""
        ...

    async def reset_serial_buffers(self) -> None:
        """Reset the input and output serial buffers."""
        ...
