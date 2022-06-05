from __future__ import annotations
from enum import Enum
from dataclasses import dataclass
from typing import (
    Dict,
    NamedTuple,
    Callable,
    Any,
    Tuple,
    Awaitable,
    Union,
    TYPE_CHECKING,
)
from typing_extensions import TypedDict
from pathlib import Path

from opentrons.drivers.rpi_drivers.types import USBPort

if TYPE_CHECKING:
    from opentrons_shared_data.module.dev_types import (
        ThermocyclerModuleType,
        MagneticModuleType,
        TemperatureModuleType,
        HeaterShakerModuleType,
    )

ThermocyclerStep = Dict[str, float]

UploadFunction = Callable[[str, str, Dict[str, Any]], Awaitable[Tuple[bool, str]]]


class LiveData(TypedDict):
    status: str
    data: Dict[str, Union[float, str, bool, None]]


class ModuleType(str, Enum):
    THERMOCYCLER: ThermocyclerModuleType = "thermocyclerModuleType"
    TEMPERATURE: TemperatureModuleType = "temperatureModuleType"
    MAGNETIC: MagneticModuleType = "magneticModuleType"
    HEATER_SHAKER: HeaterShakerModuleType = "heaterShakerModuleType"


class MagneticModuleModel(str, Enum):
    MAGNETIC_V1: str = "magneticModuleV1"
    MAGNETIC_V2: str = "magneticModuleV2"


class TemperatureModuleModel(str, Enum):
    TEMPERATURE_V1: str = "temperatureModuleV1"
    TEMPERATURE_V2: str = "temperatureModuleV2"


class ThermocyclerModuleModel(str, Enum):
    THERMOCYCLER_V1: str = "thermocyclerModuleV1"
    THERMOCYCLER_V2: str = "thermocyclerModuleV2"


class HeaterShakerModuleModel(str, Enum):
    HEATER_SHAKER_V1: str = "heaterShakerModuleV1"


@dataclass
class ModuleAtPort:
    port: str
    name: str
    usb_port: USBPort = USBPort(name="", port_number=0)


class BundledFirmware(NamedTuple):
    """Represents a versioned firmware file, generally bundled into the fs"""

    version: str
    path: Path

    def __repr__(self) -> str:
        return f"<BundledFirmware {self.version}, path={self.path}>"


class UpdateError(RuntimeError):
    pass


class ModuleInfo(NamedTuple):
    model: str  # A module model such as "magneticModuleV2"
    fw_version: str  # The version of the firmware
    hw_revision: str  # the revision of the hardware
    serial: str  # the serial number


# TODO(mc, 2022-01-18): replace with enum
ModuleModel = Union[
    MagneticModuleModel,
    TemperatureModuleModel,
    ThermocyclerModuleModel,
    HeaterShakerModuleModel,
]


class MagneticStatus(str, Enum):
    ENGAGED = "engaged"
    DISENGAGED = "disengaged"


class TemperatureStatus(str, Enum):
    HOLDING = "holding at target"
    COOLING = "cooling"
    HEATING = "heating"
    IDLE = "idle"
    ERROR = "error"


class SpeedStatus(str, Enum):
    HOLDING = "holding at target"
    ACCELERATING = "speeding up"
    DECELERATING = "slowing down"
    IDLE = "idle"
    ERROR = "error"


class HeaterShakerStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    ERROR = "error"
