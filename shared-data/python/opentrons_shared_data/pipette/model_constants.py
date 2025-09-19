from typing import Dict, Union, List

from .types import (
    Quirks,
    RobotMountConfigs,
    AvailableUnits,
    PipetteGenerationType,
    PipetteChannelType,
)

MOUNT_CONFIG_LOOKUP_TABLE = {
    PipetteGenerationType.GEN1: {
        PipetteChannelType.SINGLE_CHANNEL: RobotMountConfigs(768, 220, 30),
        PipetteChannelType.EIGHT_CHANNEL: RobotMountConfigs(768, 220, 30),
    },
    PipetteGenerationType.GEN2: {
        PipetteChannelType.SINGLE_CHANNEL: RobotMountConfigs(3200, 172.15, 60),
        PipetteChannelType.EIGHT_CHANNEL: RobotMountConfigs(3200, 155.75, 60),
    },
    PipetteGenerationType.FLEX: {
        PipetteChannelType.SINGLE_CHANNEL: RobotMountConfigs(2133.33, 230.15, 80),
        PipetteChannelType.EIGHT_CHANNEL: RobotMountConfigs(2133.33, 230.15, 80),
        PipetteChannelType.NINETY_SIX_CHANNEL: RobotMountConfigs(2133.33, 230.15, 80),
    },
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


_MAP_KEY_TO_V2: Dict[str, List[str]] = {
    "top": ["plungerPositionsConfigurations", "default", "top"],
    "bottom": ["plungerPositionsConfigurations", "default", "bottom"],
    "blowout": ["plungerPositionsConfigurations", "default", "blowout"],
    "dropTip": ["plungerPositionsConfigurations", "default", "drop"],
    "pickUpCurrent": [
        "pickUpTipConfigurations",
        "pressFit",
        "configurationsByNozzleMap",
        "##EACHNOZZLEMAP##",
        "##EACHTIPTYPE##",
        "current",
    ],
    "pickUpDistance": [
        "pickUpTipConfigurations",
        "pressFit",
        "configurationsByNozzleMap",
        "##EACHNOZZLEMAP##",
        "##EACHTIPTYPE##",
        "distance",
    ],
    "pickUpIncrement": ["pickUpTipConfigurations", "pressFit", "increment"],
    "pickUpPresses": ["pickUpTipConfigurations", "pressFit", "presses"],
    "pickUpSpeed": [
        "pickUpTipConfigurations",
        "pressFit",
        "configurationsByNozzleMap",
        "##EACHNOZZLEMAP##",
        "##EACHTIPTYPE##",
        "speed",
    ],
    "plungerCurrent": ["plungerMotorConfigurations", "run"],
    "dropTipCurrent": ["dropTipConfigurations", "plungerEject", "current"],
    "dropTipSpeed": ["dropTipConfigurations", "plungerEject", "speed"],
    "maxVolume": ["liquid_properties", "default", "maxVolume"],
    "minVolume": ["liquid_properties", "default", "minVolume"],
    "tipLength": [
        "liquid_properties",
        "default",
        "supportedTips",
        "##EACHTIP##",
        "defaultTipLength",
    ],
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
