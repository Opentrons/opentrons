from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import (
    Any,
    Awaitable,
    Callable,
    Dict,
    List,
    NamedTuple,
    Optional,
    Protocol,
    Tuple,
    TypeGuard,
    Union,
    cast,
)

from typing_extensions import TypedDict

from opentrons_shared_data.util import StrEnum

from opentrons.drivers.flex_stacker.types import (
    LimitSwitchStatus,
    PlatformStatus,
    StackerAxis,
)
from opentrons.drivers.rpi_drivers.types import USBPort


class ThermocyclerStepBase(TypedDict):
    temperature: float


class ThermocyclerStep(ThermocyclerStepBase, total=False):
    hold_time_seconds: float
    hold_time_minutes: float
    ramp_rate: Optional[float]


class ThermocyclerCycle(TypedDict):
    steps: List[ThermocyclerStep]
    repetitions: int


UploadFunction = Callable[[str, str, Dict[str, Any]], Awaitable[Tuple[bool, str]]]


class ModuleDisconnectedCallback(Protocol):
    """Protocol for the callback when the module should be disconnected."""

    def __call__(self, model: str, port: str, serial: str | None) -> None: ...


class ModuleErrorCallback(Protocol):
    """Protocol for the callback when the module sees a hardware error."""

    def __call__(
        self,
        exc: Exception,
        model: str,
        port: str,
        serial: str | None,
    ) -> None: ...


class MagneticModuleData(TypedDict):
    engaged: bool
    height: float


class TemperatureModuleData(TypedDict):
    currentTemp: float
    targetTemp: float | None


class HeaterShakerData(TypedDict):
    temperatureStatus: str
    speedStatus: str
    labwareLatchStatus: str
    currentTemp: float
    targetTemp: float | None
    currentSpeed: int
    targetSpeed: int | None
    errorDetails: str | None


class ThermocyclerData(TypedDict):
    lid: str
    lidTarget: float | None
    lidTemp: float
    lidTempStatus: str
    currentTemp: float | None
    targetTemp: float | None
    holdTime: float | None
    rampRate: float | None
    currentCycleIndex: int | None
    totalCycleCount: int | None
    currentStepIndex: int | None
    totalStepCount: int | None


class AbsorbanceReaderData(TypedDict):
    uptime: int
    deviceStatus: str
    lidStatus: str
    platePresence: str
    measureMode: str
    sampleWavelengths: List[int]
    referenceWavelength: int


class FlexStackerData(TypedDict):
    latchState: str
    platformState: str
    hopperDoorState: str
    installDetected: bool
    errorDetails: str | None


class VacuumModuleData(TypedDict):
    errorDetails: str | None


ModuleData = Union[
    Dict[Any, Any],  # This allows an empty dict as module data
    MagneticModuleData,
    TemperatureModuleData,
    HeaterShakerData,
    ThermocyclerData,
    AbsorbanceReaderData,
    FlexStackerData,
    VacuumModuleData,
]


class ModuleDataValidator:
    @classmethod
    def is_magnetic_module_data(
        cls, data: ModuleData | None
    ) -> TypeGuard[MagneticModuleData]:
        return data is not None and "engaged" in data.keys()

    @classmethod
    def is_temperature_module_data(
        cls, data: ModuleData | None
    ) -> TypeGuard[TemperatureModuleData]:
        return data is not None and "targetTemp" in data.keys()

    @classmethod
    def is_heater_shaker_data(
        cls, data: ModuleData | None
    ) -> TypeGuard[HeaterShakerData]:
        return data is not None and "labwareLatchStatus" in data.keys()

    @classmethod
    def is_thermocycler_data(
        cls, data: ModuleData | None
    ) -> TypeGuard[ThermocyclerData]:
        return data is not None and "lid" in data.keys()

    @classmethod
    def is_absorbance_reader_data(
        cls, data: ModuleData | None
    ) -> TypeGuard[AbsorbanceReaderData]:
        return data is not None and "uptime" in data.keys()

    @classmethod
    def is_flex_stacker_data(
        cls, data: ModuleData | None
    ) -> TypeGuard[FlexStackerData]:
        return data is not None and "platformState" in data.keys()

    @classmethod
    def is_vacuum_module_data(
        cls, data: ModuleData | None
    ) -> TypeGuard[VacuumModuleData]:
        # TODO: Change platformState to specific key
        return data is not None and "platformState" in data.keys()


class LiveData(TypedDict):
    status: str
    data: ModuleData | None


class ModuleType(StrEnum):
    THERMOCYCLER = "thermocyclerModuleType"
    TEMPERATURE = "temperatureModuleType"
    MAGNETIC = "magneticModuleType"
    HEATER_SHAKER = "heaterShakerModuleType"
    MAGNETIC_BLOCK = "magneticBlockType"
    ABSORBANCE_READER = "absorbanceReaderType"
    FLEX_STACKER = "flexStackerModuleType"
    VACUUM_MODULE = "vacuumModuleType"

    @classmethod
    def from_model(cls, model: ModuleModel) -> ModuleType:
        if isinstance(model, MagneticModuleModel):
            return cls.MAGNETIC
        if isinstance(model, TemperatureModuleModel):
            return cls.TEMPERATURE
        if isinstance(model, ThermocyclerModuleModel):
            return cls.THERMOCYCLER
        if isinstance(model, HeaterShakerModuleModel):
            return cls.HEATER_SHAKER
        if isinstance(model, MagneticBlockModel):
            return cls.MAGNETIC_BLOCK
        if isinstance(model, AbsorbanceReaderModel):
            return cls.ABSORBANCE_READER
        if isinstance(model, FlexStackerModuleModel):
            return cls.FLEX_STACKER
        if isinstance(model, VacuumModuleModel):
            return cls.VACUUM_MODULE

    @classmethod
    def to_module_fixture_id(cls, module_type: ModuleType) -> str:
        if module_type == ModuleType.THERMOCYCLER:
            # Thermocyclers are "loaded" in B1 only
            return "thermocyclerModuleV2Front"
        if module_type == ModuleType.TEMPERATURE:
            return "temperatureModuleV2"
        if module_type == ModuleType.HEATER_SHAKER:
            return "heaterShakerModuleV1"
        if module_type == ModuleType.MAGNETIC_BLOCK:
            return "magneticBlockV1"
        if module_type == ModuleType.ABSORBANCE_READER:
            return "absorbanceReaderV1"
        if module_type == ModuleType.FLEX_STACKER:
            return "flexStackerModuleV1"
        if module_type == ModuleType.VACUUM_MODULE:
            return "vacuumModuleMilliporeV1"
        else:
            raise ValueError(
                f"Module Type {module_type} does not have a related fixture ID."
            )


class MagneticModuleModel(StrEnum):
    MAGNETIC_V1 = "magneticModuleV1"
    MAGNETIC_V2 = "magneticModuleV2"


class TemperatureModuleModel(StrEnum):
    TEMPERATURE_V1 = "temperatureModuleV1"
    TEMPERATURE_V2 = "temperatureModuleV2"


class ThermocyclerModuleModel(StrEnum):
    THERMOCYCLER_V1 = "thermocyclerModuleV1"
    THERMOCYCLER_V2 = "thermocyclerModuleV2"


class HeaterShakerModuleModel(StrEnum):
    HEATER_SHAKER_V1 = "heaterShakerModuleV1"


class MagneticBlockModel(StrEnum):
    MAGNETIC_BLOCK_V1 = "magneticBlockV1"


class AbsorbanceReaderModel(StrEnum):
    ABSORBANCE_READER_V1 = "absorbanceReaderV1"


class FlexStackerModuleModel(StrEnum):
    FLEX_STACKER_V1 = "flexStackerModuleV1"


class VacuumModuleModel(StrEnum):
    VACUUM_MODULE_V1 = "vacuumModuleMilliporeV1"


def module_model_from_string(model_string: str) -> ModuleModel:
    for model_enum in {
        MagneticModuleModel,
        TemperatureModuleModel,
        ThermocyclerModuleModel,
        HeaterShakerModuleModel,
        MagneticBlockModel,
        AbsorbanceReaderModel,
        FlexStackerModuleModel,
        VacuumModuleModel,
    }:
        try:
            return cast(ModuleModel, model_enum(model_string))
        except ValueError:
            pass
    raise ValueError(f"No such module model {model_string}")


@dataclass(kw_only=True)
class ModuleAtPort:
    port: str
    name: str
    serial: Optional[str] = None
    usb_port: USBPort = USBPort(name="", port_number=0)


@dataclass(kw_only=True)
class SimulatingModule:
    serial_number: str
    model: Optional[str]


@dataclass(kw_only=True)
class SimulatingModuleAtPort(ModuleAtPort, SimulatingModule):
    pass


class BundledFirmware(NamedTuple):
    """Represents a versioned firmware file, generally bundled into the fs"""

    version: str
    path: Path

    def __repr__(self) -> str:
        return f"<BundledFirmware {self.version}, path={self.path}>"


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
    MagneticBlockModel,
    AbsorbanceReaderModel,
    FlexStackerModuleModel,
    VacuumModuleModel,
]


class MagneticStatus(StrEnum):
    ENGAGED = "engaged"
    DISENGAGED = "disengaged"


class TemperatureStatus(StrEnum):
    HOLDING = "holding at target"
    COOLING = "cooling"
    HEATING = "heating"
    IDLE = "idle"
    ERROR = "error"


class SpeedStatus(StrEnum):
    HOLDING = "holding at target"
    ACCELERATING = "speeding up"
    DECELERATING = "slowing down"
    IDLE = "idle"
    ERROR = "error"


class HeaterShakerStatus(StrEnum):
    IDLE = "idle"
    RUNNING = "running"
    ERROR = "error"


class AbsorbanceReaderStatus(StrEnum):
    IDLE = "idle"
    MEASURING = "measuring"
    ERROR = "error"


class LidStatus(StrEnum):
    ON = "on"
    OFF = "off"
    UNKNOWN = "unknown"
    ERROR = "error"


class FlexStackerStatus(StrEnum):
    IDLE = "idle"
    DISPENSING = "dispensing"
    STORING = "storing"
    ERROR = "error"


class PlatformState(StrEnum):
    UNKNOWN = "unknown"
    EXTENDED = "extended"
    RETRACTED = "retracted"
    MISSING = "missing"

    @classmethod
    def from_status(cls, status: PlatformStatus) -> "PlatformState":
        """Get the state from the platform status."""
        if status.E and not status.R:
            return cls.EXTENDED
        if status.R and not status.E:
            return cls.RETRACTED
        return cls.UNKNOWN


class StackerAxisState(StrEnum):
    UNKNOWN = "unknown"
    EXTENDED = "extended"
    RETRACTED = "retracted"

    @classmethod
    def from_status(
        cls, status: LimitSwitchStatus, axis: StackerAxis
    ) -> "StackerAxisState":
        """Get the axis state from the limit switch status."""
        match axis:
            case StackerAxis.X:
                if status.XE and not status.XR:
                    return cls.EXTENDED
                if status.XR and not status.XE:
                    return cls.RETRACTED
            case StackerAxis.Z:
                if status.ZE and not status.ZR:
                    return cls.EXTENDED
                if status.ZR and not status.ZE:
                    return cls.RETRACTED
            case StackerAxis.L:
                return cls.EXTENDED if status.LR else cls.RETRACTED
        return cls.UNKNOWN


class LatchState(StrEnum):
    CLOSED = "closed"
    OPENED = "opened"

    @classmethod
    def from_state(cls, state: StackerAxisState) -> "LatchState":
        """Get the latch state from the axis state."""
        return cls.CLOSED if state == StackerAxisState.EXTENDED else cls.OPENED


class HopperDoorState(StrEnum):
    CLOSED = "closed"
    OPENED = "opened"

    @classmethod
    def from_state(cls, state: bool) -> "HopperDoorState":
        """Get the hopper door state from the door state boolean."""
        return cls.CLOSED if state else cls.OPENED


class VacuumModuleStatus(StrEnum):
    IDLE = "idle"  # Waiting for input
    RAMPING = "ramping"  # Moving toward target
    HOLDING = "holding"  # Maintaining target for duration_s
    VENTING = "venting"  # Opening valve to atmosphere
    COMPLETE = "complete"  # Finished cycle
    ERROR = "error"  # An error has occured


class VentState(StrEnum):
    CLOSED = "closed"
    OPENED = "opened"
