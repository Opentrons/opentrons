"""Testing"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type, cast
from typing_extensions import Literal

from opentrons.hardware_control.types import Axis, OT3Mount
from opentrons.motion_planning.waypoints import get_gripper_labware_placement_waypoints
from opentrons.protocol_engine.errors.exceptions import CannotPerformGripperAction, GripperNotAttachedError
from opentrons.types import Point

from ...types import DeckSlotLocation, LabwareLocation, ModuleLocation, OnDeckLabwareLocation
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors.error_occurrence import ErrorOccurrence
from ...resources import ensure_ot3_hardware

from opentrons.hardware_control import HardwareControlAPI

if TYPE_CHECKING:
    from ...state.state import StateView


UnsafePlaceLabwareCommandType = Literal["unsafe/placeLabware"]


class UnsafePlaceLabwareParams(BaseModel):
    """Payload required for an UnsafePlaceLabware command."""

    labwareId: str = Field(..., description="The id of the labware to place.")
    newLocation: LabwareLocation = Field(..., description="Where to place the labware.")


class UnsafePlaceLabwareResult(BaseModel):
    """Result data from the execution of an UnsafePlaceLabware command."""


class UnsafePlaceLabwareImplementation(
    AbstractCommandImpl[
        UnsafePlaceLabwareParams,
        SuccessData[UnsafePlaceLabwareResult, None],
    ]
):
    """The place labware command implementation."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        state_view: StateView,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api
        self._state_view = state_view

    async def execute(
        self, params: UnsafePlaceLabwareParams
    ) -> SuccessData[UnsafePlaceLabwareResult, None]:
        """Enable exes."""
        ot3api = ensure_ot3_hardware(self._hardware_api)
        if not ot3api.has_gripper():
            raise GripperNotAttachedError("No gripper found to perform labware place.")

        if ot3api.gripper_jaw_can_home():
            raise CannotPerformGripperAction(
                "Cannot place labware when gripper is not gripping."
            )

        # Allow propagation of LabwareNotLoadedError.
        labware_id = params.labwareId
        current_labware = self._state_view.labware.get(labware_id=params.labwareId)
        current_labware_definition = self._state_view.labware.get_definition(
            labware_id=params.labwareId
        )

        # TODO: do we need these offsets
        # final_offsets = (
        #     self._state_view.geometry.get_final_labware_movement_offset_vectors(
        #         from_location=ModuleLocation(),
        #         to_location=new_location,
        #         additional_offset_vector=Point(),
        #         current_labware=current_labware,
        #     )
        # )
        final_offsets = self._state_view.labware.get_labware_gripper_offsets(labware_id, None)
        drop_offset = cast(Point, final_offsets.dropOffset) if final_offsets else Point()

        if isinstance(params.newLocation, DeckSlotLocation):
            self._state_view.addressable_areas.raise_if_area_not_in_deck_configuration(
                params.newLocation.slotName.id
            )

        new_location = self._state_view.geometry.ensure_valid_gripper_location(
            params.newLocation,
        )

        # TODO: when we stop the gantry position goes bad, so the robot needs to
        # home x, y.
        await ot3api.home(axes=[Axis.Z_L, Axis.Z_R, Axis.Z_G, Axis.X, Axis.Y])
        gripper_homed_position = await ot3api.gantry_position(
            mount=OT3Mount.GRIPPER,
            refresh=True,
        )

        to_labware_center = self._state_view.geometry.get_labware_grip_point(
            labware_id=labware_id, location=new_location
        )

        movement_waypoints = get_gripper_labware_placement_waypoints(
            to_labware_center=to_labware_center,
            gripper_home_z=gripper_homed_position.z,
            drop_offset=drop_offset,
        )

        # start movement
        for waypoint_data in movement_waypoints:
            if waypoint_data.jaw_open:
                if waypoint_data.dropping:
                    # This `disengage_axes` step is important in order to engage
                    # the electronic brake on the Z axis of the gripper. The brake
                    # has a stronger holding force on the axis than the hold current,
                    # and prevents the axis from spuriously dropping when  e.g. the notch
                    # on the side of a falling tiprack catches the jaw.
                    await ot3api.disengage_axes([Axis.Z_G])
                await ot3api.ungrip()
                if waypoint_data.dropping:
                    # We lost the position estimation after disengaging the axis, so
                    # it is necessary to home it next
                    await ot3api.home_z(OT3Mount.GRIPPER)
            await ot3api.move_to(
                mount=OT3Mount.GRIPPER, abs_position=waypoint_data.position
            )
        return SuccessData(public=UnsafePlaceLabwareResult(), private=None)


class UnsafePlaceLabware(
    BaseCommand[UnsafePlaceLabwareParams, UnsafePlaceLabwareResult, ErrorOccurrence]
):
    """UnsafePlaceLabware command model."""

    commandType: UnsafePlaceLabwareCommandType = "unsafe/placeLabware"
    params: UnsafePlaceLabwareParams
    result: Optional[UnsafePlaceLabwareResult]

    _ImplementationCls: Type[
        UnsafePlaceLabwareImplementation
    ] = UnsafePlaceLabwareImplementation


class UnsafePlaceLabwareCreate(BaseCommandCreate[UnsafePlaceLabwareParams]):
    """UnsafePlaceLabware command request model."""

    commandType: UnsafePlaceLabwareCommandType = "unsafe/placeLabware"
    params: UnsafePlaceLabwareParams

    _CommandCls: Type[UnsafePlaceLabware] = UnsafePlaceLabware


# """Place labware with gripper, result, and implementaiton."""
# 
# from __future__ import annotations
# import asyncio
# from pydantic import BaseModel, Field
# from typing import TYPE_CHECKING, Optional, Type
# from typing_extensions import Literal
# from logging import getLogger
# 
# from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
# from ...errors.error_occurrence import ErrorOccurrence
# from ...errors.exceptions import CannotPerformGripperAction, GripperNotAttachedError
# from ...resources import ensure_ot3_hardware
# from ...types import DeckSlotLocation, LabwareLocation
# 
# from opentrons.types import Point
# 
# from opentrons.hardware_control import HardwareControlAPI
# from opentrons.hardware_control.types import Axis, OT3Mount
# from opentrons.motion_planning.waypoints import get_gripper_labware_placement_waypoints
# 
# 
# if TYPE_CHECKING:
#     from ...state.state import StateView, StateStore
# 
# log = getLogger(__name__)
# 
# UnsafePlaceLabwareCommandType = Literal["unsafe/placeLabware"]
# 
# 
# class UnsafePlaceLabwareParams(BaseModel):
#     """Payload required for an PlaceLabware command."""
# 
#     labwareId: str = Field(..., description="The id of the labware to place.")
#     newLocation: LabwareLocation = Field(..., description="Where to place the labware.")
# 
# 
# class UnsafePlaceLabwareResult(BaseModel):
#     """Result data from the execution of an PlaceLabware command."""
# 
# 
# class UnsafePlaceLabwareImplementation(
#     AbstractCommandImpl[
#         UnsafePlaceLabwareParams,
#         SuccessData[UnsafePlaceLabwareResult, None],
#     ]
# ):
#     """Move labware command implementation."""
# 
#     def __init__(
#         self,
#         state_view: StateView,
#         state_store: StateStore,
#         hardware_api: HardwareControlAPI,
#         **kwargs: object,
#     ) -> None:
#         self._hardware_api = hardware_api
#         self._state_view = state_view
#         self._state_store = state_store
# 
#     async def execute(
#         self, params: UnsafePlaceLabwareParams
#     ) -> SuccessData[UnsafePlaceLabwareResult, None]:
#         """Place Labware."""
# 
#         # 1. Make sure we are on a Flex
#         # 2. Make sure we have a gripper
#         # 3. Make sure the gripper has something in its jaws
#         # 4. Make sure there isnt anything in the destination slot
#         # 5. Get the labware definition for geometric shape, gripper offset, force, etc
#         # 6. Create movement waypoints for gripper, starting with home on the gripper z
#         # 7. Execute waypoints, raise if error (stall, collision, drop, etc)
#         print("SOMETHING")
#         raise RuntimeError("FUCK OFF")
#         return SuccessData(public=UnsafePlaceLabwareResult(), private=None)
#         ot3api = ensure_ot3_hardware(self._hardware_api)
#         log.warning(2)
#         if not ot3api.has_gripper():
#             raise GripperNotAttachedError("No gripper found to perform labware place.")
# 
#         if ot3api.gripper_jaw_can_home():
#             raise CannotPerformGripperAction(
#                 "Cannot place labware when gripper is not gripping."
#             )
# 
#         log.warning(3)
#         # Allow propagation of LabwareNotLoadedError.
#         labware_id = params.labwareId
#         current_labware = self._state_view.labware.get(labware_id=params.labwareId)
#         current_labware_definition = self._state_view.labware.get_definition(
#             labware_id=params.labwareId
#         )
# 
#         log.warning(4)
#         if isinstance(params.newLocation, DeckSlotLocation):
#             self._state_view.addressable_areas.raise_if_area_not_in_deck_configuration(
#                 params.newLocation.slotName.id
#             )
# 
#         log.warning(5)
#         available_new_location = self._state_view.geometry.ensure_location_not_occupied(
#             location=params.newLocation
#         )
# 
#         log.warning(6)
#         new_location = self._state_view.geometry.ensure_valid_gripper_location(
#             available_new_location,
#         )
# 
#         log.warning(7)
#         # TODO: Only home gripper Z
#         # await ot3api.home(axes=[Axis.Z_L, Axis.Z_R, Axis.Z_G])
#         gripper_homed_position = await ot3api.gantry_position(mount=OT3Mount.GRIPPER)
# 
#         log.warning(8)
#         drop_offset = Point()  # TODO: FIx this
#         to_labware_center = self._state_store.geometry.get_labware_grip_point(
#             labware_id=labware_id, location=new_location
#         )
# 
#         log.warning(9)
#         movement_waypoints = get_gripper_labware_placement_waypoints(
#             to_labware_center=to_labware_center,
#             gripper_home_z=gripper_homed_position.z,
#             drop_offset=drop_offset,
#         )
# 
#         log.warning(10)
#         # start movement
#         for waypoint_data in movement_waypoints:
# 
#             log.warning(f"WP: {waypoint_data}")
#             await ot3api.move_to(
#                 mount=OT3Mount.GRIPPER, abs_position=waypoint_data.position
#             )
# 
#             if waypoint_data.jaw_open:
#                 if waypoint_data.dropping:
#                     # This `disengage_axes` step is important in order to engage
#                     # the electronic brake on the Z axis of the gripper. The brake
#                     # has a stronger holding force on the axis than the hold current,
#                     # and prevents the axis from spuriously dropping when  e.g. the notch
#                     # on the side of a falling tiprack catches the jaw.
#                     await ot3api.disengage_axes([Axis.Z_G])
#                 await ot3api.ungrip()
#                 if waypoint_data.dropping:
#                     # We lost the position estimation after disengaging the axis, so
#                     # it is necessary to home it next
#                     await ot3api.home_z(OT3Mount.GRIPPER)
# 
#         return SuccessData(public=UnsafePlaceLabwareResult(), private=None)
# 
# 
# class UnsafePlaceLabware(
#     BaseCommand[UnsafePlaceLabwareParams, UnsafePlaceLabwareResult, ErrorOccurrence]
# ):
#     """UnsafePlaceLabware command model."""
# 
#     commandType: UnsafePlaceLabwareCommandType = "unsafe/placeLabware"
#     params: UnsafePlaceLabwareParams
#     result: Optional[UnsafePlaceLabwareResult]
# 
#     _ImplementationCls: Type[
#         UnsafePlaceLabwareImplementation
#     ] = UnsafePlaceLabwareImplementation
# 
# 
# class UnsafePlaceLabwareCreate(BaseCommandCreate[UnsafePlaceLabwareParams]):
#     """UnsafeEngageAxes command request model."""
# 
#     commandType: UnsafePlaceLabwareCommandType = "unsafe/placeLabware"
#     params: UnsafePlaceLabwareParams
# 
#     _CommandCls: Type[UnsafePlaceLabware] = UnsafePlaceLabware
