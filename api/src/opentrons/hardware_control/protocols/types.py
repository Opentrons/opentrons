"""Types that are common across protocols."""

from typing import TypeVar, Union
from opentrons.hardware_control.types import OT3Mount
from opentrons.types import Mount
from opentrons.config.types import RobotConfig, OT3Config


CalibrationType = TypeVar("CalibrationType")

MountArgType = TypeVar(
    "MountArgType", Mount, Union[OT3Mount, Mount], contravariant=True
)

ConfigType = TypeVar("ConfigType", RobotConfig, OT3Config)