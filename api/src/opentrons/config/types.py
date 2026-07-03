from dataclasses import asdict, dataclass
from enum import Enum
from typing import Any, Dict, Generic, List, Mapping, Tuple, TypeVar, cast

from pydantic import BaseModel, ConfigDict, ValidationInfo, field_validator
from typing_extensions import Literal, TypedDict


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


class OT3AxisKind(Enum):
    """An enum of the different kinds of axis we have.

    The machine may have different numbers of specific axes implementing
    each axis kind.
    """

    X = 0
    #: Gantry X axis
    Y = 1
    #: Gantry Y axis
    Z = 2
    #: Z axis (of the left and right)
    P = 3
    #: Plunger axis (of the left and right pipettes)
    Z_G = 4
    #: Gripper Z axis
    Q = 6
    #: High-throughput tip grabbing axis
    OTHER = 6
    #: The internal axes of high throughput pipettes, for instance

    def __str__(self) -> str:
        return self.name

    def is_z_axis(self) -> bool:
        return self in [OT3AxisKind.Z, OT3AxisKind.Z_G]


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


def _coerce_ot3_axis_kind(key: Any) -> OT3AxisKind:
    if isinstance(key, OT3AxisKind):
        return key
    if isinstance(key, int):
        return OT3AxisKind(key)
    if isinstance(key, str):
        try:
            return OT3AxisKind[key]
        except KeyError:
            pass
        return OT3AxisKind(int(key))
    raise TypeError(f"Unsupported OT3 axis key type: {type(key)} ({key!r})")


def _coerce_axis_map(raw: Any) -> Dict[OT3AxisKind, float]:
    if not isinstance(raw, Mapping):
        raise TypeError(f"Expected mapping for axis settings, got {type(raw)}")
    return {_coerce_ot3_axis_kind(k): float(v) for k, v in raw.items()}


def _coerce_by_gantry_load_axis_maps(
    raw: Any,
) -> ByGantryLoad[Dict[OT3AxisKind, float]]:
    if isinstance(raw, ByGantryLoad):
        return ByGantryLoad(
            high_throughput_1000=_coerce_axis_map(raw.high_throughput_1000),
            high_throughput_200=_coerce_axis_map(raw.high_throughput_200),
            low_throughput=_coerce_axis_map(raw.low_throughput),
        )
    if not isinstance(raw, Mapping):
        raise TypeError(f"Expected mapping/ByGantryLoad, got {type(raw)}")
    return ByGantryLoad(
        high_throughput_1000=_coerce_axis_map(raw["high_throughput_1000"]),
        high_throughput_200=_coerce_axis_map(raw["high_throughput_200"]),
        low_throughput=_coerce_axis_map(raw["low_throughput"]),
    )


class OT3MotionSettings(BaseModel):
    model_config = ConfigDict(frozen=True)

    default_max_speed: PerPipetteAxisSettings
    acceleration: PerPipetteAxisSettings
    max_speed_discontinuity: PerPipetteAxisSettings
    direction_change_speed_discontinuity: PerPipetteAxisSettings

    def by_gantry_load(
        self, gantry_load: GantryLoad
    ) -> Dict[str, Dict[OT3AxisKind, float]]:
        return {
            name: getattr(self, name)[gantry_load]
            for name in OT3MotionSettings.model_fields
        }

    @field_validator(
        "default_max_speed",
        "acceleration",
        "max_speed_discontinuity",
        "direction_change_speed_discontinuity",
        mode="before",
    )
    @classmethod
    def _coerce_axis_keyed_maps(cls, v: Any) -> ByGantryLoad[Dict[OT3AxisKind, float]]:
        return _coerce_by_gantry_load_axis_maps(v)


class OT3CurrentSettings(BaseModel):
    model_config = ConfigDict(frozen=True)

    hold_current: PerPipetteAxisSettings
    run_current: PerPipetteAxisSettings

    def by_gantry_load(
        self, gantry_load: GantryLoad
    ) -> Dict[str, Dict[OT3AxisKind, float]]:
        return {
            name: getattr(self, name)[gantry_load]
            for name in OT3CurrentSettings.model_fields
        }

    @field_validator("hold_current", "run_current", mode="before")
    @classmethod
    def _coerce_axis_keyed_maps(cls, v: Any) -> ByGantryLoad[Dict[OT3AxisKind, float]]:
        return _coerce_by_gantry_load_axis_maps(v)


class CapacitivePassSettings(BaseModel):
    model_config = ConfigDict(frozen=True)

    prep_distance_mm: float
    max_overrun_distance_mm: float
    speed_mm_per_s: float
    sensor_threshold_pf: float


class ZSenseSettings(BaseModel):
    model_config = ConfigDict(frozen=True)

    pass_settings: CapacitivePassSettings


class LiquidProbeSettings(BaseModel):
    mount_speed: float
    plunger_speed: float
    plunger_impulse_time: float
    sensor_threshold_pascals: float
    aspirate_while_sensing: bool
    z_overlap_between_passes_mm: float
    plunger_reset_offset: float
    samples_for_baselining: int
    sample_time_sec: float


class EdgeSenseSettings(BaseModel):
    model_config = ConfigDict(frozen=True)

    overrun_tolerance_mm: float
    early_sense_tolerance_mm: float
    pass_settings: CapacitivePassSettings
    search_initial_tolerance_mm: float
    search_iteration_limit: int

    @field_validator("pass_settings")
    @classmethod
    def _validate_pass_settings(
        cls, v: CapacitivePassSettings, info: ValidationInfo
    ) -> CapacitivePassSettings:
        overrun_tolerance_mm = info.data.get("overrun_tolerance_mm")
        assert isinstance(overrun_tolerance_mm, float)
        if overrun_tolerance_mm > v.max_overrun_distance_mm:
            raise ValueError("Overrun tolerance and pass setting distance do not match")
        return v


class OT3CalibrationSettings(BaseModel):
    model_config = ConfigDict(frozen=True)

    z_offset: ZSenseSettings
    edge_sense: EdgeSenseSettings
    probe_length: float


class OT3Config(BaseModel):
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
