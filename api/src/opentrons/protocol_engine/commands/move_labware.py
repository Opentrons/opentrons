"""Models and implementation for the ``moveLabware`` command."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from ..types import LabwareLocation
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import EquipmentHandler


MoveLabwareCommandType = Literal["moveLabware"]


class MoveLabwareParams(BaseModel):
    """Input parameters for a ``moveLabware`` command."""

    labwareId: str = Field(..., description="The ID of the labware to move.")
    newLocation: LabwareLocation = Field(..., description="Where to move the labware.")


class MoveLabwareResult(BaseModel):
    """The output of a successful ``moveLabware`` command."""

    # TODO: Should this be named newOffsetId for consistency with newLocation?
    offsetId: Optional[str] = Field(
        # Default `None` instead of `...` so this field shows up as non-required in
        # OpenAPI. The server is allowed to omit it or make it null.
        ...,
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

    def __init__(self, equipment: EquipmentHandler, **kwargs: object) -> None:
        self._equipment = equipment

    async def execute(self, params: MoveLabwareParams) -> MoveLabwareResult:
        """Move a loaded labware to a new location."""
        # TODO:
        # 1. Check that the given labware ID actually exists.
        # 2. Check that the new location is valid
        #    (if it's a module ID, that module needs to exist.)
        # 3. Check that the location is unoccupied? (Probably defer this for now.)
        # 4. Grab a new labware offset, somehow?
        new_offset_id = self._equipment.select_offset_for_after_move(
            labware_id=params.labwareId,
            new_location=params.newLocation,
        )
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
