from dataclasses import dataclass
from typing import Dict, Tuple, TypeVar, Generic
from typing_extensions import TypedDict, Literal


class AxisDict(TypedDict):
    X: float
    Y: float
    Z: float
    A: float
    B: float
    C: float


class GeneralizeableAxisDict(TypedDict, total=False):
    X: float
    Y: float
    Z: float
    P: float


Vt = TypeVar("Vt")


@dataclass
class ByPipetteKind(Generic[Vt]):
    high_throughput: Vt
    low_throughput: Vt
    two_low_throughput: Vt
    none: Vt
    gripper: Vt


PerPipetteAxisSettings = ByPipetteKind[GeneralizeableAxisDict]


class CurrentDictDefault(TypedDict):
    default: AxisDict


CurrentDictModelEntries = TypedDict(
    "CurrentDictModelEntries",
    {"2.1": AxisDict, "A": AxisDict, "B": AxisDict, "C": AxisDict},
    total=False,
)


class CurrentDict(CurrentDictDefault, CurrentDictModelEntries):
    pass


@dataclass
class RobotConfig:
    model: Literal["OT-2 Standard"]
    name: str
    version: int
    gantry_steps_per_mm: Dict[str, float]
    acceleration: Dict[str, float]
    serial_speed: int
    default_pipette_configs: Dict[str, float]
    default_current: CurrentDict
    low_current: CurrentDict
    high_current: CurrentDict
    default_max_speed: AxisDict
    log_level: str
    z_retract_distance: float
    left_mount_offset: Tuple[float, float, float]


@dataclass
class OT3Config:
    model: Literal["OT-3 Standard"]
    name: str
    version: int
    log_level: str
    left_mount_offset: Tuple[float, float, float]
    default_max_speed: PerPipetteAxisSettings
    acceleration: PerPipetteAxisSettings
    max_speed_discontinuity: PerPipetteAxisSettings
    direction_change_speed_discontinuity: PerPipetteAxisSettings
    holding_current: PerPipetteAxisSettings
    normal_motion_current: PerPipetteAxisSettings
    z_retract_distance: float
