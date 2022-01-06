"""Typing protocols describing a hardware controller."""
from typing_extensions import Protocol

from .module_provider import ModuleProvider
from .hardware_manager import HardwareManager
from .chassis_accessory_manager import ChassisAccessoryManager
from .event_sourcer import EventSourcer
from .liquid_handler import LiquidHandler
from .calibratable import Calibratable
from .configurable import Configurable
from .motion_controller import MotionController
from .instrument_configurer import InstrumentConfigurer
from .execution_controllable import ExecutionControllable
from .asyncio_configurable import AsyncioConfigurable
from .stoppable import Stoppable
from .simulatable import Simulatable


class HardwareControlAPI(
    ModuleProvider,
    ExecutionControllable,
    LiquidHandler,
    ChassisAccessoryManager,
    HardwareManager,
    AsyncioConfigurable,
    Stoppable,
    Simulatable,
    Protocol,
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

    ...


__all__ = [
    "HardwareControlAPI",
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
]
