from dataclasses import asdict, dataclass
from enum import Enum
from typing import Any, Dict

from opentrons_shared_data.util import StrEnum

from opentrons.drivers.command_builder import CommandBuilder


class GCODE(StrEnum):
    GET_RESET_REASON = "M114"
    GET_DEVICE_INFO = "M115"
    SET_SERIAL_NUMBER = "M996"
    ENTER_BOOTLOADER = "dfu"
    SET_LED = "M200"
    SET_PRESSURE_STATE = "M120"
    GET_PRESSURE_STATE = "M121"
    SET_PUMP_STATE = "M122"
    GET_PUMP_STATE = "M123"
    SET_VENT_STATE = "M124"
    SET_PRESSURE_PID = "M125"
    GET_PRESSURE_PID = "M126"
    SET_WASTE_CONFIG = "M127"
    GET_WASTE_CONFIG = "M128"

    def build_command(self) -> CommandBuilder:
        """Build command."""
        return CommandBuilder().add_gcode(self)


class HardwareRevision(Enum):
    """Hardware Revision."""

    NFF = "nff"
    EVT = "a1"
    DVT = "b1"


@dataclass
class VacuumModuleInfo:
    """Vacuum module info."""

    fw: str
    hw: HardwareRevision
    sn: str
    rr: int = 0

    def to_dict(self) -> Dict[str, str]:
        """Build vacuum module info."""
        return {
            "serial": self.sn,
            "version": self.fw,
            "model": self.hw.value,
            "reset_reason": str(self.rr),
        }


class LEDColor(Enum):
    """Vacuum Module LED Color."""

    WHITE = 0
    RED = 1
    GREEN = 2
    BLUE = 3
    YELLOW = 4

    @classmethod
    def from_name(cls, name: str) -> "LEDColor":
        match name.lower():
            case "red":
                return cls.RED
            case "green":
                return cls.GREEN
            case "blue":
                return cls.BLUE
            case "yellow":
                return cls.YELLOW
            case _:
                return cls.WHITE

    def to_name(self) -> "str":
        return self.name.lower()


class LEDPattern(Enum):
    """Vacuum Module LED Pattern."""

    STATIC = 0
    FLASH = 1
    PULSE = 2
    CONFIRM = 3


class VentState(Enum):
    """The State of the vent."""

    CLOSED = 0
    OPENED = 1

    def __init__(self, val: int) -> None:
        self.formatted = self.name.lower()


@dataclass
class VacuumState:
    """Get the vacuum state."""

    target_gauge_pressure: float
    current_gauge_pressure: float
    pressure_abs_a: float
    pressure_abs_b: float
    pressure_atm: float
    vacuum_enabled: bool
    vacuum_duration: int
    vent_state: VentState

    @staticmethod
    def to_pyro_dict(obj: "VacuumState") -> Dict[str, Any]:
        """Consumed by Serpent, convert type to a Pyro Dictionary."""
        pyro_dict = asdict(obj)
        # Override specific variables for safe conversion
        pyro_dict["__class__"] = f"{obj.__module__}.{obj.__class__.__qualname__}"
        pyro_dict["vent_state"] = obj.vent_state.value

        return pyro_dict

    @staticmethod
    def from_pyro_dict(classname: Any, data: Dict[str, Any]) -> "VacuumState":
        """Consumed by Serpent, convert to type from a Pyro Dictionary."""
        data.pop("__class__", None)
        return VacuumState(
            **{  # type: ignore
                key: (VentState(data[key]) if key == "vent_state" else data[key])
                for key, value in data.items()
            }
        )


@dataclass
class PressureControlTunings:
    """Get the pressure control tuning values."""

    kp: float
    ki: float
    kd: float
    overshoot_error: float
    k_velocity: float
    k_holding: float
    tolerance_error: float


@dataclass
class WasteConfigParameters:
    """Get the waste config parameters"""

    waste_detection_enabled: bool
    p_window_start: float
    p_window_end: float
    baseline_fast_factor: float
    max_delta_per_tick: float
    max_rise_per_tick: float
    max_cummulative_rise: float
    p_filter_alpha: float
    min_window_time: float
    max_window_time: float


@dataclass
class PumpState:
    """Get the pump state."""

    target_rpm: float
    current_rpm: float
    target_pwm: float
    current_pwm: float
    pump_running: bool
    manual_control: bool

    @staticmethod
    def to_pyro_dict(obj: "PumpState") -> Dict[str, Any]:
        """Consumed by Serpent, convert type to a Pyro Dictionary."""
        pyro_dict = asdict(obj)
        pyro_dict["__class__"] = f"{obj.__module__}.{obj.__class__.__qualname__}"
        return pyro_dict

    @staticmethod
    def from_pyro_dict(classname: Any, data: Dict[str, Any]) -> "PumpState":
        """Convert from a Pyro Dictionary."""
        data.pop("__class__", None)
        return PumpState(**data)
