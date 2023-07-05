from typing import Dict, Union

from .types import Quirks, RobotMountConfigs, AvailableUnits

MOUNT_CONFIG_LOOKUP_TABLE = {
    "GEN1": RobotMountConfigs(768, 220, 30),
    "GEN2": RobotMountConfigs(3200, 155.75, 60),
    "FLEX": RobotMountConfigs(2133.33, 230.15, 80),
}


VALID_QUIRKS = [q.value for q in Quirks]
MUTABLE_CONFIGS_V1 = [
    "top",
    "bottom",
    "blowout",
    "dropTip",
    "pickUpCurrent",
    "pickUpDistance",
    "pickUpIncrement",
    "pickUpPresses",
    "pickUpSpeed",
    "plungerCurrent",
    "dropTipCurrent",
    "dropTipSpeed",
    "tipLength",
    "quirks",
]

# Version 2 Configuration Keys.
MUTABLE_CONFIGS_V2 = [
    "plungerPositionsConfigurations",
    "pickUpTipConfigurations",
    "dropTipConfigurations",
    "plungerMotorConfigurations",
    "tipLength",
]

RESTRICTED_MUTABLE_CONFIG_KEYS = [*VALID_QUIRKS, "model"]

_MAP_KEY_TO_V2: Dict[str, Dict[str, str]] = {
    "top": {"top_level_name": "plungerPositionsConfigurations", "nested_name": "top"},
    "bottom": {
        "top_level_name": "plungerPositionsConfigurations",
        "nested_name": "bottom",
    },
    "blowout": {
        "top_level_name": "plungerPositionsConfigurations",
        "nested_name": "blowout",
    },
    "dropTip": {
        "top_level_name": "plungerPositionsConfigurations",
        "nested_name": "drop",
    },
    "pickUpCurrent": {
        "top_level_name": "pickUpTipConfigurations",
        "nested_name": "current",
    },
    "pickUpDistance": {
        "top_level_name": "pickUpTipConfigurations",
        "nested_name": "distance",
    },
    "pickUpIncrement": {
        "top_level_name": "pickUpTipConfigurations",
        "nested_name": "increment",
    },
    "pickUpPresses": {
        "top_level_name": "pickUpTipConfigurations",
        "nested_name": "presses",
    },
    "pickUpSpeed": {
        "top_level_name": "pickUpTipConfigurations",
        "nested_name": "speed",
    },
    "plungerCurrent": {
        "top_level_name": "plungerMotorConfigurations",
        "nested_name": "run",
    },
    "dropTipCurrent": {
        "top_level_name": "dropTipConfigurations",
        "nested_name": "current",
    },
    "dropTipSpeed": {"top_level_name": "dropTipConfigurations", "nested_name": "speed"},
    "tipLength": {"top_level_name": "supportedTips", "nested_name": "defaultTipLength"},
}


_MIN_MAX_LOOKUP: Dict[str, Dict[str, Union[int, float]]] = {
    "current": {"min": 0.1, "max": 2.0},
    "run": {"min": 0.1, "max": 2.0},
    "speed": {"min": 0.01, "max": 30},
    "top": {"min": -20, "max": 30},
    "bottom": {"min": -20, "max": 30},
    "blowout": {"min": -20, "max": 30},
    "drop": {"min": -20, "max": 30},
    "presses": {"min": 0, "max": 15},
    "increment": {"min": 0, "max": 10},
    "distance": {"min": 0, "max": 10},
    "defaultTipLength": {"min": 0, "max": 100},
}

_TYPE_LOOKUP: Dict[str, str] = {
    "current": "float",
    "run": "float",
    "speed": "float",
    "top": "float",
    "bottom": "float",
    "blowout": "float",
    "drop": "float",
    "presses": "int",
    "increment": "int",
    "defaultTipLength": "float",
    "distance": "float",
}

_UNITS_LOOKUP = {
    "current": AvailableUnits.amps,
    "run": AvailableUnits.amps,
    "speed": AvailableUnits.speed,
    "top": AvailableUnits.mm,
    "bottom": AvailableUnits.mm,
    "blowout": AvailableUnits.mm,
    "drop": AvailableUnits.mm,
    "presses": AvailableUnits.presses,
    "increment": AvailableUnits.mm,
    "defaultTipLength": AvailableUnits.mm,
    "distance": AvailableUnits.mm,
}
