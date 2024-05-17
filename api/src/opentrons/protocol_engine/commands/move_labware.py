"""Models and implementation for the ``moveLabware`` command."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons.types import Point
from ..types import (
    LabwareLocation,
    DeckSlotLocation,
    OnLabwareLocation,
    AddressableAreaLocation,
    LabwareMovementStrategy,
    LabwareOffsetVector,
    LabwareMovementOffsetData,
)
from ..errors import LabwareMovementNotAllowedError, NotSupportedOnRobotType
from ..resources import labware_validation, fixture_validation
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence
from opentrons_shared_data.gripper.constants import GRIPPER_PADDLE_WIDTH

if TYPE_CHECKING:
    from ..execution import EquipmentHandler, RunControlHandler, LabwareMovementHandler
    from ..state import StateView


MoveLabwareCommandType = Literal["moveLabware"]


# Extra buffer on top of minimum distance to move to the right
_TRASH_CHUTE_DROP_BUFFER_MM = 8


# TODO (spp, 2022-12-14): https://opentrons.atlassian.net/browse/RLAB-237
class MoveLabwareParams(BaseModel):
    """Input parameters for a ``moveLabware`` command."""

    labwareId: str = Field(..., description="The ID of the labware to move.")
    newLocation: LabwareLocation = Field(..., description="Where to move the labware.")
    strategy: LabwareMovementStrategy = Field(
        ...,
        description="Whether to use the gripper to perform the labware movement"
        " or to perform a manual movement with an option to pause.",
    )
    pickUpOffset: Optional[LabwareOffsetVector] = Field(
        None,
        description="Offset to use when picking up labware. "
        "Experimental param, subject to change",
    )
    dropOffset: Optional[LabwareOffsetVector] = Field(
        None,
        description="Offset to use when dropping off labware. "
        "Experimental param, subject to change",
    )


class MoveLabwareResult(BaseModel):
    """The output of a successful ``moveLabware`` command."""

    offsetId: Optional[str] = Field(
        # Default `None` instead of `...` so this field shows up as non-required in
        # OpenAPI. The server is allowed to omit it or make it null.
        None,
        description=(
            "An ID referencing the labware offset that will apply to this labware"
            " now that it's in the new location."
            " This offset will be in effect until the labware is moved"
            " with another `moveLabware` command."
            " Null or undefined means no offset applies,"
            " so the default of (0, 0, 0) will be used."
        ),
    )


class MoveLabwareImplementation(
    AbstractCommandImpl[MoveLabwareParams, SuccessData[MoveLabwareResult, None]]
):
    """The execution implementation for ``moveLabware`` commands."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        labware_movement: LabwareMovementHandler,
        run_control: RunControlHandler,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._labware_movement = labware_movement
        self._run_control = run_control

    async def execute(  # noqa: C901
        self, params: MoveLabwareParams
    ) -> SuccessData[MoveLabwareResult, None]:
        """Move a loaded labware to a new location."""
        # Allow propagation of LabwareNotLoadedError.
        current_labware = self._state_view.labware.get(labware_id=params.labwareId)
        current_labware_definition = self._state_view.labware.get_definition(
            labware_id=params.labwareId
        )
        definition_uri = current_labware.definitionUri
        post_drop_slide_offset: Optional[Point] = None

        if self._state_view.labware.is_fixed_trash(params.labwareId):
            raise LabwareMovementNotAllowedError(
                f"Cannot move fixed trash labware '{current_labware_definition.parameters.loadName}'."
            )

        if isinstance(params.newLocation, AddressableAreaLocation):
            area_name = params.newLocation.addressableAreaName
            if not fixture_validation.is_gripper_waste_chute(
                area_name
            ) and not fixture_validation.is_deck_slot(area_name):
                raise LabwareMovementNotAllowedError(
                    f"Cannot move {current_labware.loadName} to addressable area {area_name}"
                )
            self._state_view.addressable_areas.raise_if_area_not_in_deck_configuration(
                area_name
            )

            if fixture_validation.is_gripper_waste_chute(area_name):
                # When dropping off labware in the waste chute, some bigger pieces
                # of labware (namely tipracks) can get stuck between a gripper
                # paddle and the bottom of the waste chute, even after the gripper
                # has homed all the way to the top of its travel. We add a "post-drop
                # slide" to dropoffs in the waste chute in order to guarantee that the
                # labware can drop fully through the chute before the gripper jaws close.
                post_drop_slide_offset = Point(
                    x=(current_labware_definition.dimensions.xDimension / 2.0)
                    + (GRIPPER_PADDLE_WIDTH / 2.0)
                    + _TRASH_CHUTE_DROP_BUFFER_MM,
                    y=0,
                    z=0,
                )
        elif isinstance(params.newLocation, DeckSlotLocation):
            self._state_view.addressable_areas.raise_if_area_not_in_deck_configuration(
                params.newLocation.slotName.id
            )

        available_new_location = self._state_view.geometry.ensure_location_not_occupied(
            location=params.newLocation
        )

        # Check that labware and destination do not have labware on top
        self._state_view.labware.raise_if_labware_has_labware_on_top(
            labware_id=params.labwareId
        )
        if isinstance(available_new_location, OnLabwareLocation):
            self._state_view.labware.raise_if_labware_has_labware_on_top(
                available_new_location.labwareId
            )
            # Ensure that labware can be placed on requested labware
            self._state_view.labware.raise_if_labware_cannot_be_stacked(
                top_labware_definition=current_labware_definition,
                bottom_labware_id=available_new_location.labwareId,
            )

        # Allow propagation of ModuleNotLoadedError.
        new_offset_id = self._equipment.find_applicable_labware_offset_id(
            labware_definition_uri=definition_uri,
            labware_location=available_new_location,
        )
        await self._labware_movement.ensure_movement_not_obstructed_by_module(
            labware_id=params.labwareId, new_location=available_new_location
        )

        if params.strategy == LabwareMovementStrategy.USING_GRIPPER:
            if self._state_view.config.robot_type == "OT-2 Standard":
                raise NotSupportedOnRobotType(
                    message="Labware movement using a gripper is not supported on the OT-2",
                    details={"strategy": params.strategy},
                )
            if not labware_validation.validate_gripper_compatible(
                current_labware_definition
            ):
                raise LabwareMovementNotAllowedError(
                    f"Cannot move labware '{current_labware_definition.parameters.loadName}' with gripper."
                    f" If trying to move a labware on an adapter, load the adapter separately to allow"
                    f" gripper movement."
                )
            if labware_validation.validate_definition_is_adapter(
                current_labware_definition
            ):
                raise LabwareMovementNotAllowedError(
                    f"Cannot move adapter '{current_labware_definition.parameters.loadName}' with gripper."
                )

            validated_current_loc = (
                self._state_view.geometry.ensure_valid_gripper_location(
                    current_labware.location
                )
            )
            validated_new_loc = self._state_view.geometry.ensure_valid_gripper_location(
                available_new_location,
            )
            user_offset_data = LabwareMovementOffsetData(
                pickUpOffset=params.pickUpOffset or LabwareOffsetVector(x=0, y=0, z=0),
                dropOffset=params.dropOffset or LabwareOffsetVector(x=0, y=0, z=0),
            )

            # Skips gripper moves when using virtual gripper
            await self._labware_movement.move_labware_with_gripper(
                labware_id=params.labwareId,
                current_location=validated_current_loc,
                new_location=validated_new_loc,
                user_offset_data=user_offset_data,
                post_drop_slide_offset=post_drop_slide_offset,
            )
        elif params.strategy == LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE:
            # Pause to allow for manual labware movement
            await self._run_control.wait_for_resume()

        return SuccessData(
            public=MoveLabwareResult(offsetId=new_offset_id), private=None
        )


class MoveLabware(BaseCommand[MoveLabwareParams, MoveLabwareResult, ErrorOccurrence]):
    """A ``moveLabware`` command."""

    commandType: MoveLabwareCommandType = "moveLabware"
    params: MoveLabwareParams
    result: Optional[MoveLabwareResult]

    _ImplementationCls: Type[MoveLabwareImplementation] = MoveLabwareImplementation


class MoveLabwareCreate(BaseCommandCreate[MoveLabwareParams]):
    """A request to create a ``moveLabware`` command."""

    commandType: MoveLabwareCommandType = "moveLabware"
    params: MoveLabwareParams

    _CommandCls: Type[MoveLabware] = MoveLabware
