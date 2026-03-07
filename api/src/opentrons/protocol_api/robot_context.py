from typing import NamedTuple, Optional, Union

from . import validation
from ._types import PipetteActionTypes, PlungerPositionTypes
from .core.common import ProtocolCore, RobotCore
from .labware import Labware
from .module_contexts import ModuleContext
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.legacy_broker import LegacyBroker
from opentrons.legacy_commands import publisher
from opentrons.legacy_commands import robot_commands as cmds
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import requires_version
from opentrons.types import (
    AxisMapType,
    AxisType,
    DeckLocation,
    Location,
    Mount,
    Point,
    StringAxisMap,
)


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

    Its methods can command the robot to perform an action, like moving to an absolute
    position, controlling the gripper jaw, or moving individual pipette motors.

    Objects in this class should not be instantiated directly. Instead, instances are
    returned by [`ProtocolContext.robot()`][opentrons.protocol_api.ProtocolContext.robot].

    *New in version 2.22*
    """

    def __init__(
        self,
        core: RobotCore,
        protocol_core: ProtocolCore,
        api_version: APIVersion,
        broker: Optional[LegacyBroker] = None,
    ) -> None:
        super().__init__(broker)
        self._hardware = HardwareManager(hardware=protocol_core.get_hardware())
        self._core = core
        self._protocol_core = protocol_core
        self._api_version = api_version

    @property
    @requires_version(2, 22)
    def api_version(self) -> APIVersion:
        return self._api_version

    @property
    def hardware(self) -> HardwareManager:
        # TODO this hardware attribute should be deprecated
        # in version 3.0+ as we will only support exposed robot
        # context commands.
        return self._hardware

    @requires_version(2, 22)
    def move_to(
        self,
        mount: Union[Mount, str],
        destination: Location,
        speed: Optional[float] = None,
    ) -> None:
        """
        Move a specified mount to a location on the deck.

        Args:
            mount: The mount of the instrument you wish to move. This can either be
                an instance of [`Mount`][opentrons.types.Mount] or one of the strings
                `"left"`, `"right"`, `"extension"`, `"gripper"`. Note that the gripper
                mount can be referred to either as `"extension"` or `"gripper"`.
            destination: Any location on the deck, specified as:

                - A slot, like `"A1"`.
                - A defined location, like labware in a deck slot.
                - An absolute location, like a point `{x=10, y=10, z=10}` or a deck
                location and point (`"A1"` + point `{x=10, y=10, z=10}`).
            speed: The absolute speed in mm/s.
        """
        mount = validation.ensure_instrument_mount(mount)
        with publisher.publish_context(
            broker=self.broker,
            command=cmds.move_to(
                # This needs to be called from protocol context and not the command for import loop reasons
                mount=mount,
                location=destination,
                speed=speed,
            ),
        ):
            self._core.move_to(mount, destination.point, speed)

    @requires_version(2, 22)
    def move_axes_to(
        self,
        axis_map: Union[AxisMapType, StringAxisMap],
        critical_point: Optional[Union[AxisMapType, StringAxisMap]] = None,
        speed: Optional[float] = None,
    ) -> None:
        """
        Move a set of axes to an absolute position on the deck.

        Args:
            axis_map (dict): A dictionary mapping axes to an absolute position on the
                deck in mm.
            critical_point (Optional[dict]): The critical point, or specific point on
                the object being moved, to move the axes with. It should only specify
                the gantry axes (i.e. `x`, `y`, `z`). When you specify a critical
                point, you're specifying the object on the gantry to be moved. If not
                specified, the critical point defaults to the center of the carriage
                attached to the gantry.
            speed (Optional[float]): The maximum speed with which to move all axes in mm/s.

        """
        instrument_on_left = self._core.get_pipette_type_from_engine(Mount.LEFT)
        is_96_channel = validation.is_pipette_96_channel(instrument_on_left)
        axis_map = validation.ensure_axis_map_type(
            axis_map, self._protocol_core.robot_type, is_96_channel
        )
        if critical_point:
            critical_point = validation.ensure_axis_map_type(
                critical_point, self._protocol_core.robot_type, is_96_channel
            )
            validation.ensure_only_gantry_axis_map_type(
                critical_point, self._protocol_core.robot_type
            )
        else:
            critical_point = None
        with publisher.publish_context(
            broker=self.broker,
            command=cmds.move_axis_to(
                # This needs to be called from protocol context and not the command for import loop reasons
                axis_map=axis_map,
                speed=speed,
            ),
        ):
            self._core.move_axes_to(axis_map, critical_point, speed)

    @requires_version(2, 22)
    def move_axes_relative(
        self,
        axis_map: Union[AxisMapType, StringAxisMap],
        speed: Optional[float] = None,
    ) -> None:
        """
        Move a set of axes to a relative position on the deck.

        Args:
            axis_map (dict): A dictionary mapping axes to relative movements
                from the current position in mm.
            speed (float, optional): The maximum speed with which to move all
                axes in mm/s.
        """
        instrument_on_left = self._core.get_pipette_type_from_engine(Mount.LEFT)
        is_96_channel = validation.is_pipette_96_channel(instrument_on_left)

        axis_map = validation.ensure_axis_map_type(
            axis_map, self._protocol_core.robot_type, is_96_channel
        )
        with publisher.publish_context(
            broker=self.broker,
            command=cmds.move_axis_relative(
                # This needs to be called from protocol context and not the command for import loop reasons
                axis_map=axis_map,
                speed=speed,
            ),
        ):
            self._core.move_axes_relative(axis_map, speed)

    def close_gripper_jaw(self, force: Optional[float] = None) -> None:
        """Closes the Flex Gripper jaws with a specified force.

        Args:
            force: Force with which to close the gripper jaws in newtons.
        """
        with publisher.publish_context(
            broker=self.broker,
            command=cmds.close_gripper(
                force=force,
            ),
        ):
            self._core.close_gripper(force)

    def open_gripper_jaw(self) -> None:
        """Fully opens the Flex Gripper jaws."""
        with publisher.publish_context(
            broker=self.broker,
            command=cmds.open_gripper(),
        ):
            self._core.release_grip()

    def axis_coordinates_for(
        self,
        mount: Union[Mount, str],
        location: Union[Location, ModuleContext, DeckLocation],
    ) -> AxisMapType:
        """
        Build an axis map from a location to provide to
        either [`RobotContext.move_axes_to()`][opentrons.protocol_api.RobotContext.move_axes_to] or
        [`RobotContext.move_axes_relative()`][opentrons.protocol_api.RobotContext.move_axes_relative].
        You must provide only one of either a location, slot, or module to build
        the axis map.

        Args:
            mount (Union[types.Mount, str]): The mount of the instrument you wish to
                create an axis map for. This can either be an instance of
                [`Mount`][opentrons.types.Mount] or one of the strings `"left"`,
                `"right"`, `"extension"`, `"gripper"`. Note that the gripper mount can
                be referred to either as `"extension"` or `"gripper"`.
            location (Union[Well, ModuleContext, DeckLocation, OffDeckType]): Any
                location on the deck, specified as:

                - A deck location, like slot `"A1"`.
                - A defined location, like a module on the deck.
        """
        mount = validation.ensure_instrument_mount(mount)

        mount_axis = AxisType.axis_for_mount(mount)
        if location:
            loc: Union[Point, Labware, None]
            if isinstance(location, ModuleContext):
                loc = location.labware
                if not loc:
                    raise ValueError(f"There must be a labware on {location}")
                top_of_labware = loc.wells()[0].top()
                loc = top_of_labware.point
                return {mount_axis: loc.z, AxisType.X: loc.x, AxisType.Y: loc.y}
            elif isinstance(location, (int, str)) and not isinstance(
                location, Location
            ):
                slot_name = validation.ensure_and_convert_deck_slot(
                    location,
                    api_version=self._api_version,
                    robot_type=self._protocol_core.robot_type,
                )
                loc = self._protocol_core.get_slot_center(slot_name)
                return {mount_axis: loc.z, AxisType.X: loc.x, AxisType.Y: loc.y}
            elif isinstance(location, Location):
                assert isinstance(location, Location)
                loc = location.point
                return {mount_axis: loc.z, AxisType.X: loc.x, AxisType.Y: loc.y}
            else:
                raise ValueError(
                    "Location parameter must be a Module, Deck Location, or Location type."
                )
        else:
            raise TypeError("You must specify a location to move to.")

    def plunger_coordinates_for_volume(
        self, mount: Union[Mount, str], volume: float, action: PipetteActionTypes
    ) -> AxisMapType:
        """
        Build an axis map to move a pipette plunger motor to complete liquid handling
        actions.

        Args:
            mount: The left or right instrument mount the pipette is attached to.
            volume: A volume to convert to an axis map for linear plunger displacement.
            action: Choose to `aspirate` or `dispense`.
        """
        pipette_name = self._core.get_pipette_type_from_engine(mount)
        if not pipette_name:
            raise ValueError(
                f"Expected a pipette to be attached to provided mount {mount}"
            )
        mount = validation.ensure_mount_for_pipette(mount, pipette_name)
        pipette_axis = AxisType.plunger_axis_for_mount(mount)

        pipette_position = self._core.get_plunger_position_from_volume(
            mount, volume, action, self._protocol_core.robot_type
        )
        return {pipette_axis: pipette_position}

    def plunger_coordinates_for_named_position(
        self, mount: Union[Mount, str], position_name: PlungerPositionTypes
    ) -> AxisMapType:
        """
        Build an axis map to move a pipette plunger motor to a named position.

        Args:
            position_name: A named position to move the pipette plunger to. Choose from
                `top`, `bottom`, `blowout`, or `drop` plunger positions.

        """
        pipette_name = self._core.get_pipette_type_from_engine(mount)
        if not pipette_name:
            raise ValueError(
                f"Expected a pipette to be attached to provided mount {mount}"
            )
        mount = validation.ensure_mount_for_pipette(mount, pipette_name)
        pipette_axis = AxisType.plunger_axis_for_mount(mount)
        pipette_position = self._core.get_plunger_position_from_name(
            mount, position_name
        )
        return {pipette_axis: pipette_position}

    def build_axis_map(self, axis_map: StringAxisMap) -> AxisMapType:
        """
        Take in a [`StringAxisMap`][opentrons.types.StringAxisMap] and
        output an axis map.

        The `StringAxisMap` is allowed to contain any of the following strings:
        `"x"`, `"y"`, `"z_l"`, `"z_r"`, `"z_g"`, `"q"`.

        An example of a valid axis map could be:

            {"x": 1, "y": 2} or {"Z_L": 100}

        Note that capitalization does not matter.
        """
        instrument_on_left = self._core.get_pipette_type_from_engine(Mount.LEFT)
        is_96_channel = validation.is_pipette_96_channel(instrument_on_left)

        return validation.ensure_axis_map_type(
            axis_map, self._protocol_core.robot_type, is_96_channel
        )
