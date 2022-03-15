from dataclasses import dataclass
import enum
from re import M
from typing import List, Literal, Union


@dataclass
class Module:
    type: Literal[
        "magneticModuleV1",
        "magneticModuleV2",
        "temperatureModuleV1",
        "temperatureModuleV2",
        "thermocyclerModuleV1",
        "heaterShakerModuleV1",
    ]
    id: str
    serial: str


@dataclass
class Dev:
    """Info about the robot brought up with 'make -C robot-server dev'"""

    display_name: str = "opentrons-dev"
    host: str = "localhost"
    port: str = "31950"


@dataclass
class Kansas:
    """A robot in Kansas used for testing."""

    display_name: str = "OT2CEP20210323B11"
    host: str = "192.168.50.89"
    port: str = "31950"


RobotDataType = Dev | Kansas
ROBOT_KEYS: dict[str, RobotDataType] = {"dev": Dev(), "kansas": Kansas()}
