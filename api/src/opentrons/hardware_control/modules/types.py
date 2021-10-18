from enum import Enum
from dataclasses import dataclass
from typing import (
    Dict,
    NamedTuple,
    Callable,
    Any,
    Type,
    TypeVar,
    Tuple,
    Awaitable,
    Mapping,
    Union,
    TYPE_CHECKING,
)
from pathlib import Path

from opentrons.drivers.rpi_drivers.types import USBPort

if TYPE_CHECKING:
    from opentrons_shared_data.module.dev_types import (
        ThermocyclerModuleType,
        MagneticModuleType,
        TemperatureModuleType,
    )

ThermocyclerStep = Dict[str, float]

UploadFunction = Callable[[str, str, Dict[str, Any]], Awaitable[Tuple[bool, str]]]

LiveData = Mapping[str, Union[str, Mapping[str, Union[float, str, None]]]]


E = TypeVar("E", bound="_ProvideLookup")


class _ProvideLookup(Enum):
    @classmethod
    def from_str(cls: Type[E], typename: str) -> "E":
        for m in cls.__members__.values():
            if m.value == typename:
                return m
        raise AttributeError(f"No such type {typename}")


class ModuleType(_ProvideLookup):
    THERMOCYCLER: "ThermocyclerModuleType" = "thermocyclerModuleType"
    TEMPERATURE: "TemperatureModuleType" = "temperatureModuleType"
    MAGNETIC: "MagneticModuleType" = "magneticModuleType"


class MagneticModuleModel(_ProvideLookup):
    MAGNETIC_V1: str = "magneticModuleV1"
    MAGNETIC_V2: str = "magneticModuleV2"


class TemperatureModuleModel(_ProvideLookup):
    TEMPERATURE_V1: str = "temperatureModuleV1"
    TEMPERATURE_V2: str = "temperatureModuleV2"


class ThermocyclerModuleModel(_ProvideLookup):
    @classmethod
    def from_str(
        cls: Type["ThermocyclerModuleModel"], typename: str
    ) -> "ThermocyclerModuleModel":
        return super().from_str(typename)

    THERMOCYCLER_V1: str = "thermocyclerModuleV1"


@dataclass
class ModuleAtPort:
    port: str
    name: str
    usb_port: USBPort = USBPort(name="", sub_names=[])


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


ModuleModel = Union[
    MagneticModuleModel, TemperatureModuleModel, ThermocyclerModuleModel
]


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
