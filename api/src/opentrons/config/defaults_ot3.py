from typing import Any, Dict, cast, List
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
)

DEFAULT_PIPETTE_OFFSET = [0.0, 0.0, 0.0]


ROBOT_CONFIG_VERSION: Final = 1
DEFAULT_LOG_LEVEL: Final = "INFO"
DEFAULT_DECK_TRANSFORM: Final[OT3Transform] = [
    [-1.0, 0.0, 0.0],
    [0.0, -1.0, 0.0],
    [0.0, 0.0, -1.0],
]
DEFAULT_CARRIAGE_OFFSET: Final[Offset] = (436.605, 484.975, 233.475)
DEFAULT_LEFT_MOUNT_OFFSET: Final[Offset] = (-21.0, -63.05, 256.175)
DEFAULT_RIGHT_MOUNT_OFFSET: Final[Offset] = (33, -63.05, 256.175)
DEFAULT_GRIPPER_MOUNT_OFFSET: Final[Offset] = (-50.0, 0.0, 0.0)
DEFAULT_Z_RETRACT_DISTANCE: Final = 2

DEFAULT_MAX_SPEEDS: Final[ByGantryLoad[Dict[OT3AxisKind, float]]] = ByGantryLoad(
    none={
        OT3AxisKind.X: 100,
        OT3AxisKind.Y: 100,
        OT3AxisKind.Z: 100,
        OT3AxisKind.P: 100,
    },
    high_throughput={
        OT3AxisKind.X: 100,
        OT3AxisKind.Y: 100,
        OT3AxisKind.Z: 100,
        OT3AxisKind.P: 100,
    },
    low_throughput={
        OT3AxisKind.X: 100,
        OT3AxisKind.Y: 100,
        OT3AxisKind.Z: 100,
        OT3AxisKind.P: 100,
    },
    two_low_throughput={
        OT3AxisKind.X: 100,
        OT3AxisKind.Y: 100,
    },
    gripper={
        OT3AxisKind.Z: 100,
    },
)

DEFAULT_ACCELERATIONS: Final[ByGantryLoad[Dict[OT3AxisKind, float]]] = ByGantryLoad(
    none={
        OT3AxisKind.X: 100,
        OT3AxisKind.Y: 100,
        OT3AxisKind.Z: 100,
        OT3AxisKind.P: 100,
    },
    high_throughput={
        OT3AxisKind.X: 100,
        OT3AxisKind.Y: 100,
        OT3AxisKind.Z: 100,
        OT3AxisKind.P: 100,
    },
    low_throughput={
        OT3AxisKind.X: 100,
        OT3AxisKind.Y: 100,
        OT3AxisKind.Z: 100,
        OT3AxisKind.P: 100,
    },
    two_low_throughput={
        OT3AxisKind.X: 100,
        OT3AxisKind.Y: 100,
    },
    gripper={
        OT3AxisKind.Z: 100,
    },
)

DEFAULT_MAX_SPEED_DISCONTINUITY: Final[
    ByGantryLoad[Dict[OT3AxisKind, float]]
] = ByGantryLoad(
    none={
        OT3AxisKind.X: 40,
        OT3AxisKind.Y: 40,
        OT3AxisKind.Z: 40,
        OT3AxisKind.P: 10,
    },
    high_throughput={
        OT3AxisKind.X: 40,
        OT3AxisKind.Y: 40,
        OT3AxisKind.Z: 40,
        OT3AxisKind.P: 10,
    },
    low_throughput={
        OT3AxisKind.X: 40,
        OT3AxisKind.Y: 40,
        OT3AxisKind.Z: 40,
        OT3AxisKind.P: 10,
    },
    two_low_throughput={
        OT3AxisKind.X: 40,
        OT3AxisKind.Y: 40,
    },
    gripper={
        OT3AxisKind.Z: 40,
    },
)

DEFAULT_DIRECTION_CHANGE_SPEED_DISCONTINUITY: Final[
    ByGantryLoad[Dict[OT3AxisKind, float]]
] = ByGantryLoad(
    none={
        OT3AxisKind.X: 20,
        OT3AxisKind.Y: 20,
        OT3AxisKind.Z: 20,
        OT3AxisKind.P: 20,
    },
    high_throughput={
        OT3AxisKind.X: 20,
        OT3AxisKind.Y: 20,
        OT3AxisKind.Z: 20,
        OT3AxisKind.P: 20,
    },
    low_throughput={
        OT3AxisKind.X: 20,
        OT3AxisKind.Y: 20,
        OT3AxisKind.Z: 20,
        OT3AxisKind.P: 20,
    },
    two_low_throughput={
        OT3AxisKind.X: 20,
        OT3AxisKind.Y: 20,
    },
    gripper={
        OT3AxisKind.Z: 20,
    },
)

DEFAULT_HOLD_CURRENT: Final[ByGantryLoad[Dict[OT3AxisKind, float]]] = ByGantryLoad(
    none={
        OT3AxisKind.X: 0.1,
        OT3AxisKind.Y: 0.1,
        OT3AxisKind.Z: 0.1,
        OT3AxisKind.P: 0.1,
    },
    high_throughput={
        OT3AxisKind.X: 0.1,
        OT3AxisKind.Y: 0.1,
        OT3AxisKind.Z: 0.1,
        OT3AxisKind.P: 0.1,
    },
    low_throughput={
        OT3AxisKind.X: 0.1,
        OT3AxisKind.Y: 0.1,
        OT3AxisKind.Z: 0.1,
        OT3AxisKind.P: 0.1,
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
        OT3AxisKind.P: 1.4,
    },
    high_throughput={
        OT3AxisKind.X: 1.4,
        OT3AxisKind.Y: 1.4,
        OT3AxisKind.Z: 1.4,
        OT3AxisKind.P: 1.4,
    },
    low_throughput={
        OT3AxisKind.X: 1.4,
        OT3AxisKind.Y: 1.4,
        OT3AxisKind.Z: 1.4,
        OT3AxisKind.P: 1.4,
    },
    two_low_throughput={
        OT3AxisKind.X: 1.4,
        OT3AxisKind.Y: 1.4,
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
    )


def serialize(config: OT3Config) -> Dict[str, Any]:
    return asdict(config)
