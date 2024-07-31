from typing import NamedTuple, Union, Dict, Optional

from opentrons.types import Mount, DeckLocation, Point
from opentrons.legacy_commands import publisher
from opentrons.hardware_control import SyncHardwareAPI, types as hw_types

from ._types import OffDeckType
from .core.common import ProtocolCore


class HardwareManager(NamedTuple):
    """Back. compat. wrapper for a removed class called `HardwareManager`.

    This interface will not be present in PAPIv3.
    """

    hardware: SyncHardwareAPI


class RobotContext(publisher.CommandPublisher):
    """
    A context for the movement system of the robot.

    The RobotContext class provides the objects, attributes, and methods that allow
    you to control robot motor axes individually.

    Its methods can command the robot to perform an action, like moving to an absolute position,
    controlling the gripper jaw, or moving individual pipette motors.

    Objects in this class should not be instantiated directly. Instead, instances are
    returned by :py:meth:`ProtocolContext.robot`.

    .. versionadded:: 2.20

    """

    def __init__(self, core: ProtocolCore) -> None:
        self._hardware = HardwareManager(hardware=core.get_hardware())

    @property
    def hardware(self) -> HardwareManager:
        return self._hardware

    def move_to(
        self,
        mount: Union[Mount, str],
        destination: Point,
        velocity: float,
    ) -> None:
        raise NotImplementedError()

    def move_axes_to(
        self,
        abs_axis_map: Dict[hw_types.Axis, hw_types.AxisMapValue],
        velocity: float,
        critical_point: Optional[hw_types.CriticalPoint],
    ) -> None:
        raise NotImplementedError()

    def move_axes_relative(
        self, rel_axis_map: Dict[hw_types.Axis, hw_types.AxisMapValue], velocity: float
    ) -> None:
        raise NotImplementedError()

    def close_gripper_jaw(self, force: float) -> None:
        raise NotImplementedError()

    def open_gripper_jaw(self) -> None:
        raise NotImplementedError()

    def axis_coordinates_for(
        self, mount: Union[Mount, str], location: Union[DeckLocation, OffDeckType]
    ) -> None:
        raise NotImplementedError()

    def plunger_coordinates_for_volume(
        self, mount: Union[Mount, str], volume: float
    ) -> None:
        raise NotImplementedError()

    def plunger_coordinates_for_named_position(
        self, mount: Union[Mount, str], position_name: str
    ) -> None:
        raise NotImplementedError()

    def build_axis_map(
        self, axis_map: Dict[hw_types.Axis, hw_types.AxisMapValue]
    ) -> None:
        raise NotImplementedError()
