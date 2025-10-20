from enum import Enum
from dataclasses import dataclass
from typing import Dict

from opentrons.drivers.command_builder import CommandBuilder


class GCODE(str, Enum):

    GET_RESET_REASON = "M114"
    GET_DEVICE_INFO = "M115"
    SET_SERIAL_NUMBER = "M996"
    ENTER_BOOTLOADER = "dfu"
    SET_LED = "M200"

    def build_command(self) -> CommandBuilder:
        """Build command."""
        return CommandBuilder().add_gcode(self)


class HardwareRevision(Enum):
    """Hardware Revision."""

    NFF = "nff"


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
        match (name.lower()):
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
