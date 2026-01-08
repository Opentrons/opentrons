"""Types that are common across protocols."""

from typing import TYPE_CHECKING, Type, TypeVar, Union

from opentrons.hardware_control.types import OT3Mount
from opentrons.types import Mount

if TYPE_CHECKING:
    from opentrons.config.types import OT3Config, RobotConfig


class OT2RobotType:
    pass


class FlexRobotType:
    pass


CalibrationType = TypeVar("CalibrationType")

MountArgType = TypeVar(
    "MountArgType", Mount, Union[OT3Mount, Mount], contravariant=True
)

# Use TYPE_CHECKING conditional to break circular import between
# opentrons.config.types and opentrons.hardware_control.protocols.types
if TYPE_CHECKING:
    ConfigType = TypeVar("ConfigType", "RobotConfig", "OT3Config")
else:
    ConfigType = TypeVar("ConfigType")

ProtocolRobotType = TypeVar(
    "ProtocolRobotType", Type[FlexRobotType], Type[OT2RobotType], covariant=True
)
