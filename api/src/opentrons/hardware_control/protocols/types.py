"""Types that are common across protocols."""

from typing import Type, TypeVar, Union

from opentrons.config.types import OT3Config, RobotConfig
from opentrons.hardware_control.types import OT3Mount
from opentrons.types import Mount


class OT2RobotType:
    pass


class FlexRobotType:
    pass


CalibrationType = TypeVar("CalibrationType")

MountArgType = TypeVar(
    "MountArgType", Mount, Union[OT3Mount, Mount], contravariant=True
)

ConfigType = TypeVar("ConfigType", RobotConfig, OT3Config)

ProtocolRobotType = TypeVar(
    "ProtocolRobotType", Type[FlexRobotType], Type[OT2RobotType], covariant=True
)
