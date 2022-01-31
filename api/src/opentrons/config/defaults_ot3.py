from typing import Any, Dict, cast, List, Tuple
from typing_extensions import Final
from dataclasses import asdict

from .types import OT3Config, ByPipetteKind, GeneralizeableAxisDict

DEFAULT_DECK_CALIBRATION: List[List[float]] = [
    [-1.00, 0.00, 0.00],
    [0.00, -1.00, 0.00],
    [0.00, 0.00, -1.00],
]

DEFAULT_PIPETTE_OFFSET = [0.0, 0.0, 0.0]


ROBOT_CONFIG_VERSION: Final = 1
DEFAULT_LOG_LEVEL = "INFO"
DEFAULT_DECK_TRANSFORM = [[-1.0, 0.0, 0.0], [0.0, -1.0, 0.0], [0.0, 0.0, -1.0]]
DEFAULT_CARRIAGE_OFFSET = (436.605, 484.975, 233.475)
DEFAULT_LEFT_MOUNT_OFFSET = (-21.0, -63.05, 256.175)
DEFAULT_RIGHT_MOUNT_OFFSET = (33, -63.05, 256.175)
DEFAULT_GRIPPER_MOUNT_OFFSET = (-50.0, 0.0, 0.0)
DEFAULT_Z_RETRACT_DISTANCE = 2

DEFAULT_MAX_SPEEDS: ByPipetteKind[GeneralizeableAxisDict] = ByPipetteKind(
    none={
        "X": 500,
        "Y": 500,
        "Z": 500,
        "P": 500,
    },
    high_throughput={
        "X": 500,
        "Y": 500,
        "Z": 500,
        "P": 500,
    },
    low_throughput={
        "X": 500,
        "Y": 500,
        "Z": 500,
        "P": 500,
    },
    two_low_throughput={
        "X": 500,
        "Y": 500,
    },
    gripper={
        "Z": 500,
    },
)

DEFAULT_ACCELERATIONS: ByPipetteKind[GeneralizeableAxisDict] = ByPipetteKind(
    none={
        "X": 10000,
        "Y": 10000,
        "Z": 10000,
        "P": 10000,
    },
    high_throughput={
        "X": 10000,
        "Y": 10000,
        "Z": 10000,
        "P": 10000,
    },
    low_throughput={
        "X": 10000,
        "Y": 10000,
        "Z": 10000,
        "P": 10000,
    },
    two_low_throughput={
        "X": 10000,
        "Y": 10000,
    },
    gripper={
        "Z": 10000,
    },
)

DEFAULT_MAX_SPEED_DISCONTINUITY: ByPipetteKind[GeneralizeableAxisDict] = ByPipetteKind(
    none={
        "X": 40,
        "Y": 40,
        "Z": 40,
        "P": 40,
    },
    high_throughput={
        "X": 40,
        "Y": 40,
        "Z": 40,
        "P": 40,
    },
    low_throughput={
        "X": 40,
        "Y": 40,
        "Z": 40,
        "P": 40,
    },
    two_low_throughput={
        "X": 40,
        "Y": 40,
    },
    gripper={
        "Z": 40,
    },
)

DEFAULT_DIRECTION_CHANGE_SPEED_DISCONTINUITY: ByPipetteKind[
    GeneralizeableAxisDict
] = ByPipetteKind(
    none={
        "X": 20,
        "Y": 20,
        "Z": 20,
        "P": 20,
    },
    high_throughput={
        "X": 20,
        "Y": 20,
        "Z": 20,
        "P": 20,
    },
    low_throughput={
        "X": 20,
        "Y": 20,
        "Z": 20,
        "P": 20,
    },
    two_low_throughput={
        "X": 20,
        "Y": 20,
    },
    gripper={
        "Z": 20,
    },
)

DEFAULT_HOLDING_CURRENT: ByPipetteKind[GeneralizeableAxisDict] = ByPipetteKind(
    none={
        "X": 0.1,
        "Y": 0.1,
        "Z": 0.1,
        "P": 0.1,
    },
    high_throughput={
        "X": 0.1,
        "Y": 0.1,
        "Z": 0.1,
        "P": 0.1,
    },
    low_throughput={
        "X": 0.1,
        "Y": 0.1,
        "Z": 0.1,
        "P": 0.1,
    },
    two_low_throughput={
        "X": 0.1,
        "Y": 0.1,
    },
    gripper={
        "Z": 0.1,
    },
)

DEFAULT_NORMAL_MOTION_CURRENT: ByPipetteKind[GeneralizeableAxisDict] = ByPipetteKind(
    none={
        "X": 1.0,
        "Y": 1.0,
        "Z": 1.0,
        "P": 1.0,
    },
    high_throughput={
        "X": 1.0,
        "Y": 1.0,
        "Z": 1.0,
        "P": 1.0,
    },
    low_throughput={
        "X": 1.0,
        "Y": 1.0,
        "Z": 1.0,
        "P": 1.0,
    },
    two_low_throughput={
        "X": 1.0,
        "Y": 1.0,
    },
    gripper={
        "Z": 1.0,
    },
)


def _build_dict_with_default(
    from_conf: Any,
    default: GeneralizeableAxisDict,
) -> GeneralizeableAxisDict:
    if not isinstance(from_conf, dict):
        return default
    else:
        for k in default.keys():
            if k not in from_conf:
                from_conf[k] = default[k]  # type: ignore[misc]
        return cast(GeneralizeableAxisDict, from_conf)


def _build_default_bpk(
    from_conf: Any, default: ByPipetteKind[GeneralizeableAxisDict]
) -> ByPipetteKind[GeneralizeableAxisDict]:
    return ByPipetteKind(
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


def _build_default_offset(
    from_conf: Any, default: Tuple[float, float, float]
) -> Tuple[float, float, float]:
    if not isinstance(from_conf, (list, tuple)) or len(from_conf) != 3:
        return default
    return cast(Tuple[float, float, float], tuple(from_conf))


def _build_default_transform(
    from_conf: Any, default: List[List[float]]
) -> List[List[float]]:
    if (
        not isinstance(from_conf, list)
        or not all(isinstance(elem, list) for elem in from_conf)
        or not all(
            all(isinstance(elem, (int, float)) for elem in vec) for vec in from_conf
        )
        or not (len(from_conf) == 3)
        or not all(len(e) == 3 for e in from_conf)
    ):
        return default
    return cast(List[List[float]], from_conf)


def build_with_defaults(robot_settings: Dict[str, Any]) -> OT3Config:
    return OT3Config(
        model="OT-3 Standard",
        version=ROBOT_CONFIG_VERSION,
        name=robot_settings.get("name", "Grace Hopper"),
        log_level=robot_settings.get("log_level", DEFAULT_LOG_LEVEL),
        default_max_speed=_build_default_bpk(
            robot_settings.get("default_max_speed", {}), DEFAULT_MAX_SPEEDS
        ),
        acceleration=_build_default_bpk(
            robot_settings.get("acceleration", {}), DEFAULT_ACCELERATIONS
        ),
        max_speed_discontinuity=_build_default_bpk(
            robot_settings.get("max_speed_discontinuity", {}),
            DEFAULT_MAX_SPEED_DISCONTINUITY,
        ),
        direction_change_speed_discontinuity=_build_default_bpk(
            robot_settings.get("direction_change_speed_discontinuity", {}),
            DEFAULT_DIRECTION_CHANGE_SPEED_DISCONTINUITY,
        ),
        holding_current=_build_default_bpk(
            robot_settings.get("holding_current", {}), DEFAULT_HOLDING_CURRENT
        ),
        normal_motion_current=_build_default_bpk(
            robot_settings.get("normal_motion_current", {}),
            DEFAULT_NORMAL_MOTION_CURRENT,
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
