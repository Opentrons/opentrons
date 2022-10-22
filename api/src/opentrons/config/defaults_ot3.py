from typing import Any, Dict, cast, List, Iterable, Tuple
from typing_extensions import Final
from dataclasses import asdict

from opentrons.hardware_control.types import OT3AxisKind
from .types import (
    OT3Config,
    ByGantryLoad,
    OT3CurrentSettings,
    OT3MotionSettings,
    OT3Transform,
    Offset,
    OT3CalibrationSettings,
    CapacitivePassSettings,
    ZSenseSettings,
    EdgeSenseSettings,
)

DEFAULT_PIPETTE_OFFSET = [0.0, 0.0, 0.0]

DEFAULT_CALIBRATION_SETTINGS: Final[OT3CalibrationSettings] = OT3CalibrationSettings(
    z_offset=ZSenseSettings(
        point=(209, 170, 0),
        pass_settings=CapacitivePassSettings(
            prep_distance_mm=3,
            max_overrun_distance_mm=3,
            speed_mm_per_s=1,
            sensor_threshold_pf=1.0,
        ),
    ),
    edge_sense=EdgeSenseSettings(
        plus_x_pos=(219, 150, 0),
        minus_x_pos=(199, 150, 0),
        plus_y_pos=(209, 160, 0),
        minus_y_pos=(209, 140, 0),
        overrun_tolerance_mm=0.5,
        early_sense_tolerance_mm=0.2,
        pass_settings=CapacitivePassSettings(
            prep_distance_mm=1,
            max_overrun_distance_mm=1,
            speed_mm_per_s=1,
            sensor_threshold_pf=1.0,
        ),
        search_initial_tolerance_mm=5.0,
        search_iteration_limit=10,
    ),
)

ROBOT_CONFIG_VERSION: Final = 1
DEFAULT_LOG_LEVEL: Final = "INFO"
DEFAULT_DECK_TRANSFORM: Final[OT3Transform] = [
    [-1.0, 0.0, 0.0],
    [0.0, -1.0, 0.0],
    [0.0, 0.0, -1.0],
]
DEFAULT_CARRIAGE_OFFSET: Final[Offset] = (477.20, 493.8, 253.475)
DEFAULT_LEFT_MOUNT_OFFSET: Final[Offset] = (-21.0, -63.05, 256.175)
DEFAULT_RIGHT_MOUNT_OFFSET: Final[Offset] = (33, -63.05, 256.175)
DEFAULT_GRIPPER_MOUNT_OFFSET: Final[Offset] = (84.55, -12.75, 93.85)
DEFAULT_Z_RETRACT_DISTANCE: Final = 2

DEFAULT_MAX_SPEEDS: Final[ByGantryLoad[Dict[OT3AxisKind, float]]] = ByGantryLoad(
    none={
        OT3AxisKind.X: 500,
        OT3AxisKind.Y: 500,
        OT3AxisKind.Z: 65,
        OT3AxisKind.P: 45,
        OT3AxisKind.Z_G: 100,
    },
    high_throughput={
        OT3AxisKind.X: 500,
        OT3AxisKind.Y: 500,
        OT3AxisKind.Z: 35,
        OT3AxisKind.P: 45,
    },
    low_throughput={
        OT3AxisKind.X: 500,
        OT3AxisKind.Y: 500,
        OT3AxisKind.Z: 65,
        OT3AxisKind.P: 45,
    },
    two_low_throughput={
        OT3AxisKind.X: 500,
        OT3AxisKind.Y: 500,
    },
    gripper={OT3AxisKind.Z: 65},
)

DEFAULT_ACCELERATIONS: Final[ByGantryLoad[Dict[OT3AxisKind, float]]] = ByGantryLoad(
    none={
        OT3AxisKind.X: 1000,
        OT3AxisKind.Y: 1000,
        OT3AxisKind.Z: 100,
        OT3AxisKind.P: 50,
        OT3AxisKind.Z_G: 20,
    },
    high_throughput={
        OT3AxisKind.X: 1000,
        OT3AxisKind.Y: 1000,
        OT3AxisKind.Z: 100,
        OT3AxisKind.P: 50,
    },
    low_throughput={
        OT3AxisKind.X: 1000,
        OT3AxisKind.Y: 1000,
        OT3AxisKind.Z: 100,
        OT3AxisKind.P: 50,
    },
    two_low_throughput={
        OT3AxisKind.X: 1000,
        OT3AxisKind.Y: 1000,
    },
    gripper={
        OT3AxisKind.Z: 100,
    },
)

DEFAULT_MAX_SPEED_DISCONTINUITY: Final[
    ByGantryLoad[Dict[OT3AxisKind, float]]
] = ByGantryLoad(
    none={
        OT3AxisKind.X: 10,
        OT3AxisKind.Y: 10,
        OT3AxisKind.Z: 10,
        OT3AxisKind.Z_G: 10,
        OT3AxisKind.P: 10,
    },
    high_throughput={
        OT3AxisKind.X: 10,
        OT3AxisKind.Y: 10,
        OT3AxisKind.Z: 10,
        OT3AxisKind.P: 10,
    },
    low_throughput={
        OT3AxisKind.X: 10,
        OT3AxisKind.Y: 10,
        OT3AxisKind.Z: 10,
        OT3AxisKind.P: 10,
    },
    two_low_throughput={
        OT3AxisKind.X: 10,
        OT3AxisKind.Y: 10,
    },
    gripper={
        OT3AxisKind.Z: 10,
    },
)

DEFAULT_DIRECTION_CHANGE_SPEED_DISCONTINUITY: Final[
    ByGantryLoad[Dict[OT3AxisKind, float]]
] = ByGantryLoad(
    none={
        OT3AxisKind.X: 5,
        OT3AxisKind.Y: 5,
        OT3AxisKind.Z: 5,
        OT3AxisKind.P: 5,
        OT3AxisKind.Z_G: 5,
    },
    high_throughput={
        OT3AxisKind.X: 5,
        OT3AxisKind.Y: 5,
        OT3AxisKind.Z: 5,
        OT3AxisKind.P: 5,
    },
    low_throughput={
        OT3AxisKind.X: 5,
        OT3AxisKind.Y: 5,
        OT3AxisKind.Z: 5,
        OT3AxisKind.P: 5,
    },
    two_low_throughput={
        OT3AxisKind.X: 5,
        OT3AxisKind.Y: 5,
    },
    gripper={
        OT3AxisKind.Z: 5,
    },
)

DEFAULT_HOLD_CURRENT: Final[ByGantryLoad[Dict[OT3AxisKind, float]]] = ByGantryLoad(
    none={
        OT3AxisKind.X: 0.1,
        OT3AxisKind.Y: 0.1,
        OT3AxisKind.Z: 0.1,
        OT3AxisKind.P: 0.3,
        OT3AxisKind.Z_G: 0.2,
    },
    high_throughput={
        OT3AxisKind.X: 0.1,
        OT3AxisKind.Y: 0.1,
        OT3AxisKind.Z: 0.1,
        OT3AxisKind.P: 0.3,
    },
    low_throughput={
        OT3AxisKind.X: 0.1,
        OT3AxisKind.Y: 0.1,
        OT3AxisKind.Z: 0.1,
        OT3AxisKind.P: 0.3,
    },
    two_low_throughput={
        OT3AxisKind.X: 0.1,
        OT3AxisKind.Y: 0.1,
    },
    gripper={
        OT3AxisKind.Z: 0.1,
    },
)

DEFAULT_RUN_CURRENT: Final[ByGantryLoad[Dict[OT3AxisKind, float]]] = ByGantryLoad(
    none={
        OT3AxisKind.X: 1.4,
        OT3AxisKind.Y: 1.4,
        OT3AxisKind.Z: 1.4,
        OT3AxisKind.P: 1.0,
        OT3AxisKind.Z_G: 0.7,
    },
    high_throughput={
        OT3AxisKind.X: 1.4,
        OT3AxisKind.Y: 1.4,
        OT3AxisKind.Z: 1.4,
        OT3AxisKind.P: 1.0,
    },
    low_throughput={
        OT3AxisKind.X: 1.4,
        OT3AxisKind.Y: 1.4,
        OT3AxisKind.Z: 1.4,
        OT3AxisKind.P: 1.0,
    },
    two_low_throughput={
        OT3AxisKind.X: 1.4,
        OT3AxisKind.Y: 1.4,
        OT3AxisKind.Z: 1.4,
    },
    gripper={
        OT3AxisKind.Z: 1.4,
    },
)


def _build_dict_with_default(
    from_conf: Any,
    default: Dict[OT3AxisKind, float],
) -> Dict[OT3AxisKind, float]:
    if not isinstance(from_conf, dict):
        return {k: v for k, v in default.items()}
    else:
        validated: Dict[OT3AxisKind, float] = {}
        # Keep what is specified, handling it being
        # either enum element name string or enum element directly
        for k, v in from_conf.items():
            if isinstance(k, OT3AxisKind):
                validated[k] = v
            else:
                try:
                    enumval = OT3AxisKind[k]
                except KeyError:  # not an enum entry
                    pass
                else:
                    validated[enumval] = v
        # Add what's missing relative to the default
        for k, default_v in default.items():
            if k in from_conf:
                validated[k] = from_conf[k]
            elif k.name in from_conf:
                validated[k] = from_conf[k.name]
            else:
                validated[k] = default_v
        return validated


def _build_default_bpk(
    from_conf: Any, default: ByGantryLoad[Dict[OT3AxisKind, float]]
) -> ByGantryLoad[Dict[OT3AxisKind, float]]:
    return ByGantryLoad(
        low_throughput=_build_dict_with_default(
            from_conf.get("low_throughput", {}), default.low_throughput
        ),
        high_throughput=_build_dict_with_default(
            from_conf.get("high_throughput", {}), default.high_throughput
        ),
        two_low_throughput=_build_dict_with_default(
            from_conf.get("two_low_throughput", {}), default.two_low_throughput
        ),
        none=_build_dict_with_default(from_conf.get("none", {}), default.none),
        gripper=_build_dict_with_default(from_conf.get("gripper", {}), default.gripper),
    )


def _build_default_offset(from_conf: Any, default: Offset) -> Offset:
    if not isinstance(from_conf, (list, tuple)) or len(from_conf) != 3:
        return default
    return cast(Offset, tuple(from_conf))


def _build_default_transform(
    from_conf: Any, default: List[List[float]]
) -> List[List[float]]:
    if (
        not isinstance(from_conf, list)
        or len(from_conf) != 3
        or not all(isinstance(elem, list) for elem in from_conf)
        or not all(len(e) == 3 for e in from_conf)
        or not all(
            all(isinstance(elem, (int, float)) for elem in vec) for vec in from_conf
        )
    ):
        return default
    return cast(OT3Transform, from_conf)


def _build_default_cap_pass(
    from_conf: Any, default: CapacitivePassSettings
) -> CapacitivePassSettings:
    return CapacitivePassSettings(
        prep_distance_mm=from_conf.get("prep_distance_mm", default.prep_distance_mm),
        max_overrun_distance_mm=from_conf.get(
            "max_overrun_distance_mm", default.max_overrun_distance_mm
        ),
        speed_mm_per_s=from_conf.get("speed_mm_per_s", default.speed_mm_per_s),
        sensor_threshold_pf=from_conf.get(
            "sensor_threshold_pf", default.sensor_threshold_pf
        ),
    )


def _build_default_z_pass(from_conf: Any, default: ZSenseSettings) -> ZSenseSettings:
    return ZSenseSettings(
        point=from_conf.get("point", default.point),
        pass_settings=_build_default_cap_pass(
            from_conf.get("pass_settings", {}), default.pass_settings
        ),
    )


def _build_default_edge_sense(
    from_conf: Any, default: EdgeSenseSettings
) -> EdgeSenseSettings:
    return EdgeSenseSettings(
        plus_x_pos=from_conf.get("plus_x_pos", default.plus_x_pos),
        minus_x_pos=from_conf.get("minus_x_pos", default.minus_x_pos),
        plus_y_pos=from_conf.get("plus_y_pos", default.plus_y_pos),
        minus_y_pos=from_conf.get("minus_y_pos", default.minus_y_pos),
        overrun_tolerance_mm=from_conf.get(
            "overrun_tolerance_mm", default.overrun_tolerance_mm
        ),
        early_sense_tolerance_mm=from_conf.get(
            "early_sense_tolerance_mm", default.early_sense_tolerance_mm
        ),
        pass_settings=_build_default_cap_pass(
            from_conf.get("pass_settings", {}), default.pass_settings
        ),
        search_initial_tolerance_mm=from_conf.get(
            "search_initial_tolerance_mm", default.search_initial_tolerance_mm
        ),
        search_iteration_limit=from_conf.get(
            "search_iteration_limit", default.search_iteration_limit
        ),
    )


def _build_default_calibration(
    from_conf: Any, default: OT3CalibrationSettings
) -> OT3CalibrationSettings:
    return OT3CalibrationSettings(
        z_offset=_build_default_z_pass(from_conf.get("z_offset", {}), default.z_offset),
        edge_sense=_build_default_edge_sense(
            from_conf.get("edge_sense", {}), default.edge_sense
        ),
    )


def build_with_defaults(robot_settings: Dict[str, Any]) -> OT3Config:
    motion_settings = robot_settings.get("motion_settings", {})
    current_settings = robot_settings.get("current_settings", {})
    return OT3Config(
        model="OT-3 Standard",
        version=ROBOT_CONFIG_VERSION,
        name=robot_settings.get("name", "Grace Hopper"),
        log_level=robot_settings.get("log_level", DEFAULT_LOG_LEVEL),
        motion_settings=OT3MotionSettings(
            default_max_speed=_build_default_bpk(
                motion_settings.get("default_max_speed", {}), DEFAULT_MAX_SPEEDS
            ),
            acceleration=_build_default_bpk(
                motion_settings.get("acceleration", {}), DEFAULT_ACCELERATIONS
            ),
            max_speed_discontinuity=_build_default_bpk(
                motion_settings.get("max_speed_discontinuity", {}),
                DEFAULT_MAX_SPEED_DISCONTINUITY,
            ),
            direction_change_speed_discontinuity=_build_default_bpk(
                motion_settings.get("direction_change_speed_discontinuity", {}),
                DEFAULT_DIRECTION_CHANGE_SPEED_DISCONTINUITY,
            ),
        ),
        current_settings=OT3CurrentSettings(
            hold_current=_build_default_bpk(
                current_settings.get("hold_current", {}),
                DEFAULT_HOLD_CURRENT,
            ),
            run_current=_build_default_bpk(
                current_settings.get("run_current", {}),
                DEFAULT_RUN_CURRENT,
            ),
        ),
        z_retract_distance=robot_settings.get(
            "z_retract_distance", DEFAULT_Z_RETRACT_DISTANCE
        ),
        deck_transform=_build_default_transform(
            robot_settings.get("deck_transform", []), DEFAULT_DECK_TRANSFORM
        ),
        carriage_offset=_build_default_offset(
            robot_settings.get("carriage_offset", []), DEFAULT_CARRIAGE_OFFSET
        ),
        left_mount_offset=_build_default_offset(
            robot_settings.get("left_mount_offset", []), DEFAULT_LEFT_MOUNT_OFFSET
        ),
        right_mount_offset=_build_default_offset(
            robot_settings.get("right_mount_offset", []), DEFAULT_RIGHT_MOUNT_OFFSET
        ),
        gripper_mount_offset=_build_default_offset(
            robot_settings.get("gripper_mount_offset", []), DEFAULT_GRIPPER_MOUNT_OFFSET
        ),
        calibration=_build_default_calibration(
            robot_settings.get("calibration", {}), DEFAULT_CALIBRATION_SETTINGS
        ),
    )


def serialize(config: OT3Config) -> Dict[str, Any]:
    def _build_dict(pairs: Iterable[Tuple[Any, Any]]) -> Dict[str, Any]:
        def _normalize_key(key: Any) -> Any:
            if isinstance(key, OT3AxisKind):
                return key.name
            return key

        def _normalize_value(value: Any) -> Any:
            if isinstance(value, dict):
                return {
                    _normalize_key(k): _normalize_value(v) for k, v in value.items()
                }
            else:
                return value

        return dict((_normalize_key(key), _normalize_value(val)) for key, val in pairs)

    return asdict(config, dict_factory=_build_dict)
