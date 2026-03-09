from enum import Enum
from dataclasses import dataclass, asdict, fields
from typing import Dict, Tuple, TypeVar, Generic, List, cast
from typing_extensions import TypedDict, Literal
from opentrons.hardware_control.types import OT3AxisKind


class AxisDict(TypedDict):
    X: float
    Y: float
    Z: float
    A: float
    B: float
    C: float


Vt = TypeVar("Vt")


class GantryLoad(Enum):
    HIGH_THROUGHPUT_1000 = "high_throughput_1000"
    HIGH_THROUGHPUT_200 = "high_throughput_200"
    LOW_THROUGHPUT = "low_throughput"


@dataclass
class ByGantryLoad(Generic[Vt]):
    high_throughput_1000: Vt
    high_throughput_200: Vt
    low_throughput: Vt

    def __getitem__(self, key: GantryLoad) -> Vt:
        return cast(Vt, asdict(self)[key.value])


PerPipetteAxisSettings = ByGantryLoad[Dict[OT3AxisKind, float]]


class CurrentDictDefault(TypedDict):
    default: AxisDict


CurrentDictModelEntries = TypedDict(
    "CurrentDictModelEntries",
    {"2.1": AxisDict, "A": AxisDict, "B": AxisDict, "C": AxisDict},
    total=False,
)


class CurrentDict(CurrentDictDefault, CurrentDictModelEntries):
    pass


Offset = Tuple[float, float, float]


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
    left_mount_offset: Offset


OT3Transform = List[List[float]]


@dataclass(frozen=True)
class OT3MotionSettings:
    default_max_speed: PerPipetteAxisSettings
    acceleration: PerPipetteAxisSettings
    max_speed_discontinuity: PerPipetteAxisSettings
    direction_change_speed_discontinuity: PerPipetteAxisSettings

    def by_gantry_load(
        self, gantry_load: GantryLoad
    ) -> Dict[str, Dict[OT3AxisKind, float]]:
        return dict(
            (field.name, getattr(self, field.name)[gantry_load])
            for field in fields(self)
        )


@dataclass(frozen=True)
class OT3CurrentSettings:
    hold_current: PerPipetteAxisSettings
    run_current: PerPipetteAxisSettings

    def by_gantry_load(
        self, gantry_load: GantryLoad
    ) -> Dict[str, Dict[OT3AxisKind, float]]:
        return dict(
            (field.name, getattr(self, field.name)[gantry_load])
            for field in fields(self)
        )


@dataclass(frozen=True)
class CapacitivePassSettings:
    prep_distance_mm: float
    max_overrun_distance_mm: float
    speed_mm_per_s: float
    sensor_threshold_pf: float


@dataclass(frozen=True)
class ZSenseSettings:
    pass_settings: CapacitivePassSettings


@dataclass
class LiquidProbeSettings:
    mount_speed: float
    plunger_speed: float
    plunger_impulse_time: float
    sensor_threshold_pascals: float
    aspirate_while_sensing: bool
    z_overlap_between_passes_mm: float
    plunger_reset_offset: float
    samples_for_baselining: int
    sample_time_sec: float


@dataclass(frozen=True)
class EdgeSenseSettings:
    overrun_tolerance_mm: float
    early_sense_tolerance_mm: float
    pass_settings: CapacitivePassSettings
    search_initial_tolerance_mm: float
    search_iteration_limit: int

    def __init__(
        self,
        overrun_tolerance_mm: float,
        early_sense_tolerance_mm: float,
        pass_settings: CapacitivePassSettings,
        search_initial_tolerance_mm: float,
        search_iteration_limit: int,
    ) -> None:
        if overrun_tolerance_mm > pass_settings.max_overrun_distance_mm:
            raise ValueError("Overrun tolerance and pass setting distance do not match")
        object.__setattr__(self, "overrun_tolerance_mm", overrun_tolerance_mm)
        object.__setattr__(self, "early_sense_tolerance_mm", early_sense_tolerance_mm)
        object.__setattr__(self, "pass_settings", pass_settings)
        object.__setattr__(
            self, "search_initial_tolerance_mm", search_initial_tolerance_mm
        )
        object.__setattr__(self, "search_iteration_limit", search_iteration_limit)


@dataclass(frozen=True)
class OT3CalibrationSettings:
    z_offset: ZSenseSettings
    edge_sense: EdgeSenseSettings
    probe_length: float


@dataclass
class OT3Config:
    model: Literal["OT-3 Standard"]
    name: str
    version: int
    log_level: str
    motion_settings: OT3MotionSettings
    current_settings: OT3CurrentSettings
    safe_home_distance: float
    deck_transform: OT3Transform
    carriage_offset: Offset
    left_mount_offset: Offset
    right_mount_offset: Offset
    gripper_mount_offset: Offset
    calibration: OT3CalibrationSettings
    liquid_sense: LiquidProbeSettings
