"""Models and implementation for the ``moveLabware`` command."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import LabwareLocation
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import EquipmentHandler, RunControlHandler, LabwareMovementHandler
    from ..state import StateView


MoveLabwareCommandType = Literal["moveLabware"]


class MoveLabwareParams(BaseModel):
    """Input parameters for a ``moveLabware`` command."""

    labwareId: str = Field(..., description="The ID of the labware to move.")
    newLocation: LabwareLocation = Field(..., description="Where to move the labware.")
    useGripper: Optional[bool] = Field(
        False, description="Whether to use the gripper to perform the labware movement."
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
    AbstractCommandImpl[MoveLabwareParams, MoveLabwareResult]
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

    async def execute(self, params: MoveLabwareParams) -> MoveLabwareResult:
        """Move a loaded labware to a new location."""
        # Allow propagation of LabwareNotLoadedError.
        current_labware = self._state_view.labware.get(labware_id=params.labwareId)
        definition_uri = current_labware.definitionUri

        # Allow propagation of ModuleNotLoadedError.
        new_offset_id = self._equipment.find_applicable_labware_offset_id(
            labware_definition_uri=definition_uri, labware_location=params.newLocation
        )

        if params.useGripper:
            validated_current_loc = (
                self._labware_movement.ensure_valid_gripper_location(
                    current_labware.location
                )
            )
            validated_new_loc = self._labware_movement.ensure_valid_gripper_location(
                params.newLocation
            )
            await self._labware_movement.move_labware_with_gripper(
                labware_id=params.labwareId,
                current_location=validated_current_loc,
                new_location=validated_new_loc,
                new_offset_id=new_offset_id,
            )
        else:
            # Pause to allow for manual labware movement
            await self._run_control.wait_for_resume()

        return MoveLabwareResult(offsetId=new_offset_id)


class MoveLabware(BaseCommand[MoveLabwareParams, MoveLabwareResult]):
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
