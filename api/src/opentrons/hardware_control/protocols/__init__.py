"""Typing protocols describing a hardware controller."""
from typing_extensions import Protocol, Type

from opentrons.hardware_control.types import Axis

from .asyncio_configurable import AsyncioConfigurable
from .calibratable import Calibratable
from .chassis_accessory_manager import ChassisAccessoryManager
from .configurable import Configurable
from .event_sourcer import EventSourcer
from .execution_controllable import ExecutionControllable
from .flex_calibratable import FlexCalibratable
from .flex_instrument_configurer import FlexInstrumentConfigurer
from .gripper_controller import GripperController
from .hardware_manager import HardwareManager
from .identifiable import Identifiable
from .instrument_configurer import InstrumentConfigurer
from .liquid_handler import LiquidHandler
from .module_provider import ModuleProvider
from .motion_controller import MotionController
from .simulatable import Simulatable
from .stoppable import Stoppable
from .types import (
    CalibrationType,
    ConfigType,
    FlexRobotType,
    MountArgType,
    OT2RobotType,
)


class HardwareControlInterface(
    ModuleProvider,
    ExecutionControllable,
    LiquidHandler[CalibrationType, MountArgType, ConfigType],
    ChassisAccessoryManager,
    HardwareManager,
    AsyncioConfigurable,
    Stoppable,
    Simulatable,
    Identifiable[Type[OT2RobotType]],
    Protocol[CalibrationType, MountArgType, ConfigType],
):
    """A mypy protocol for a hardware controller.

    This class provides an protocol for the basic hardware controller class,
    with at least two implementations: one for the OT-2, and one for the
    OT-3. While the two classes have the same API, fundamental architectural
    decisions in the OT-2 hardware controller (specifically the data types used
    in the HardwareControl/backend split) make it unsuitable for the OT-3.

    This is a protocol rather than an ABC because of the use of wrapping adapters
    such as ThreadManager and SynchAdapter. Because those classes work via
    getattr, they can't inherit from an ABC that requires specific methods;
    however, they can satisfy protocols.
    """

    def get_robot_type(self) -> Type[OT2RobotType]:
        return OT2RobotType


class FlexHardwareControlInterface(
    ModuleProvider,
    ExecutionControllable,
    LiquidHandler[CalibrationType, MountArgType, ConfigType],
    ChassisAccessoryManager,
    HardwareManager,
    AsyncioConfigurable,
    Stoppable,
    Simulatable,
    GripperController,
    FlexCalibratable,
    FlexInstrumentConfigurer[MountArgType],
    Identifiable[Type[FlexRobotType]],
    Protocol[CalibrationType, MountArgType, ConfigType],
):
    """A mypy protocol for a hardware controller with Flex-specific extensions.

    The interface for the Flex controller is mostly in-line with the OT-2 interface,
    with some additional functionality and parameterization not supported on the OT-2.
    """

    def get_robot_type(self) -> Type[FlexRobotType]:
        return FlexRobotType

    def motor_status_ok(self, axis: Axis) -> bool:
        ...

    def encoder_status_ok(self, axis: Axis) -> bool:
        ...


__all__ = [
    "HardwareControlAPI",
    "FlexHardwareControlInterface",
    "Simulatable",
    "Stoppable",
    "AsyncioConfigurable",
    "ExecutionControllable",
    "InstrumentConfigurer",
    "MotionController",
    "Configurable",
    "Calibratable",
    "LiquidHandler",
    "EventSourcer",
    "ChassisAccessoryManager",
    "HardwareManager",
    "ModuleProvider",
    "Identifiable",
    "FlexCalibratable",
]
