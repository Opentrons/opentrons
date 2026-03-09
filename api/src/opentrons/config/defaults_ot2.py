from copy import deepcopy
from dataclasses import asdict
from typing import Dict, Any, List, cast, Union, Optional, TypeVar
from typing_extensions import Final
from .types import RobotConfig, CurrentDict, AxisDict

ROBOT_CONFIG_VERSION: Final = 4
PLUNGER_CURRENT_LOW = 0.05
PLUNGER_CURRENT_HIGH = 0.05

MOUNT_CURRENT_LOW = 0.1
MOUNT_CURRENT_HIGH = 0.8

X_CURRENT_LOW = 0.3
X_CURRENT_HIGH = 1.25

Y_CURRENT_LOW = 0.3
Y_CURRENT_HIGH = 1.25

XY_CURRENT_LOW_REFRESH = 0.7
MOUNT_CURRENT_HIGH_REFRESH = 0.5

Z_RETRACT_DISTANCE = 2

HIGH_CURRENT: CurrentDict = {
    "default": {
        "X": X_CURRENT_HIGH,
        "Y": Y_CURRENT_HIGH,
        "Z": MOUNT_CURRENT_HIGH_REFRESH,
        "A": MOUNT_CURRENT_HIGH_REFRESH,
        "B": PLUNGER_CURRENT_HIGH,
        "C": PLUNGER_CURRENT_HIGH,
    },
    "2.1": {
        "X": X_CURRENT_HIGH,
        "Y": Y_CURRENT_HIGH,
        "Z": MOUNT_CURRENT_HIGH,
        "A": MOUNT_CURRENT_HIGH,
        "B": PLUNGER_CURRENT_HIGH,
        "C": PLUNGER_CURRENT_HIGH,
    },
}

LOW_CURRENT: CurrentDict = {
    "default": {
        "X": XY_CURRENT_LOW_REFRESH,
        "Y": XY_CURRENT_LOW_REFRESH,
        "Z": MOUNT_CURRENT_LOW,
        "A": MOUNT_CURRENT_LOW,
        "B": PLUNGER_CURRENT_LOW,
        "C": PLUNGER_CURRENT_LOW,
    },
    "2.1": {
        "X": X_CURRENT_LOW,
        "Y": Y_CURRENT_LOW,
        "Z": MOUNT_CURRENT_LOW,
        "A": MOUNT_CURRENT_LOW,
        "B": PLUNGER_CURRENT_LOW,
        "C": PLUNGER_CURRENT_LOW,
    },
}

DEFAULT_CURRENT: CurrentDict = {
    "default": {
        "X": HIGH_CURRENT["default"]["X"],
        "Y": HIGH_CURRENT["default"]["Y"],
        "Z": HIGH_CURRENT["default"]["Z"],
        "A": HIGH_CURRENT["default"]["A"],
        "B": LOW_CURRENT["default"]["B"],
        "C": LOW_CURRENT["default"]["C"],
    },
    "2.1": {
        "X": HIGH_CURRENT["2.1"]["X"],
        "Y": HIGH_CURRENT["2.1"]["Y"],
        "Z": HIGH_CURRENT["2.1"]["Z"],
        "A": HIGH_CURRENT["2.1"]["A"],
        "B": LOW_CURRENT["2.1"]["B"],
        "C": LOW_CURRENT["2.1"]["C"],
    },
}

X_MAX_SPEED = 600
Y_MAX_SPEED = 400
Z_MAX_SPEED = 125
A_MAX_SPEED = 125
B_MAX_SPEED = 40
C_MAX_SPEED = 40

DEFAULT_MAX_SPEEDS: AxisDict = {
    "X": X_MAX_SPEED,
    "Y": Y_MAX_SPEED,
    "Z": Z_MAX_SPEED,
    "A": A_MAX_SPEED,
    "B": B_MAX_SPEED,
    "C": C_MAX_SPEED,
}

DEFAULT_CURRENT_STRING = " ".join(
    ["{}{}".format(key, value) for key, value in DEFAULT_CURRENT.items()]
)

DEFAULT_DECK_CALIBRATION_V2: List[List[float]] = [
    [1.00, 0.00, 0.00],
    [0.00, 1.00, 0.00],
    [0.00, 0.00, 1.00],
]

DEFAULT_SIMULATION_CALIBRATION: List[List[float]] = [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, -25.0],
    [0.0, 0.0, 0.0, 1.0],
]

X_ACCELERATION = 3000
Y_ACCELERATION = 2000
Z_ACCELERATION = 1500
A_ACCELERATION = 1500
B_ACCELERATION = 200
C_ACCELERATION = 200

DEFAULT_ACCELERATION: Dict[str, float] = {
    "X": X_ACCELERATION,
    "Y": Y_ACCELERATION,
    "Z": Z_ACCELERATION,
    "A": A_ACCELERATION,
    "B": B_ACCELERATION,
    "C": C_ACCELERATION,
}

DEFAULT_PIPETTE_CONFIGS: Dict[str, float] = {
    "homePosition": 220,
    "stepsPerMM": 768,
    "maxTravel": 30,
}

DEFAULT_GANTRY_STEPS_PER_MM: Dict[str, float] = {
    "X": 80.00,
    "Y": 80.00,
    "Z": 400,
    "A": 400,
}


DEFAULT_MOUNT_OFFSET = [-34, 0, 0]
DEFAULT_PIPETTE_OFFSET = [0.0, 0.0, 0.0]
SERIAL_SPEED = 115200
DEFAULT_LOG_LEVEL = "INFO"

DictType = TypeVar("DictType", bound=Dict[str, Any])


def _build_dict_with_default(
    from_conf: Union[DictType, str, None], default: DictType
) -> DictType:
    if not isinstance(from_conf, dict):
        return default
    else:
        return cast(DictType, from_conf)


def _build_hw_versioned_current_dict(
    from_conf: Optional[Dict[str, Any]], default: CurrentDict
) -> CurrentDict:
    if not from_conf or not isinstance(from_conf, dict):
        return default
    # special case: if this is a valid old (i.e. not model-specific) current
    # setup, migrate it.
    if "default" not in from_conf and not (set("XYZABC") - set(from_conf.keys())):
        new_dct = deepcopy(default)
        # Because there's no case in which a machine with a more recent revision
        # than 2.1 should have a valid and edited robot config when updating
        # to this code, we should default it to 2.1 to avoid breaking other
        # robots
        new_dct["2.1"] = cast(AxisDict, from_conf)
        return new_dct
    return cast(CurrentDict, from_conf)


def build_with_defaults(robot_settings: Dict[str, Any]) -> RobotConfig:
    return RobotConfig(
        model="OT-2 Standard",
        name=robot_settings.get("name", "Ada Lovelace"),
        version=ROBOT_CONFIG_VERSION,
        gantry_steps_per_mm=_build_dict_with_default(
            robot_settings.get("steps_per_mm"), DEFAULT_GANTRY_STEPS_PER_MM
        ),
        acceleration=_build_dict_with_default(
            robot_settings.get("acceleration"), DEFAULT_ACCELERATION
        ),
        serial_speed=robot_settings.get("serial_speed", SERIAL_SPEED),
        default_current=_build_hw_versioned_current_dict(
            robot_settings.get("default_current"), DEFAULT_CURRENT
        ),
        low_current=_build_hw_versioned_current_dict(
            robot_settings.get("low_current"), LOW_CURRENT
        ),
        high_current=_build_hw_versioned_current_dict(
            robot_settings.get("high_current"), HIGH_CURRENT
        ),
        default_max_speed=robot_settings.get("default_max_speed", DEFAULT_MAX_SPEEDS),
        log_level=robot_settings.get("log_level", DEFAULT_LOG_LEVEL),
        default_pipette_configs=robot_settings.get(
            "default_pipette_configs", DEFAULT_PIPETTE_CONFIGS
        ),
        z_retract_distance=robot_settings.get("z_retract_distance", Z_RETRACT_DISTANCE),
        left_mount_offset=robot_settings.get("left_mount_offset", DEFAULT_MOUNT_OFFSET),
    )


def serialize(config: RobotConfig) -> Dict[str, Any]:
    config_dict = asdict(config)
    config_dict.pop("model", None)
    return config_dict
