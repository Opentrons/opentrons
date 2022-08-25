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

    labwareId: str = Field(
        ...,
        description="The ID of the labware to move."
    )
    newLocation: LabwareLocation = Field(
        ...,
        description="Where to move the labware."
    )


class MoveLabwareResult(BaseModel):
    """The output of a successful ``moveLabware`` command."""

    offsetId: Optional[str] = Field(
        ...,
        description=(
            "An ID referencing the labware offset that will apply to this labware"
            " now that it's in the new location."
            "\n\n"
            "Null or undefined means no offset applies,"
            " so the default of (0, 0, 0) will be used."
            "\n\n"
            "This offset will be in effect until the labware is moved"
            " with another `moveLabware` command."
        )
    )


class MoveLabwareImplementation(
    AbstractCommandImpl[MoveLabwareParams, MoveLabwareResult]
):
    """The execution implementation for ``moveLabware`` commands."""

    def __init__(self, equipment: EquipmentHandler, **kwargs: object) -> None:
        self._equipment = equipment

    async def execute(self, params: MoveLabwareParams) -> MoveLabwareResult:
        """Move a loaded labware to a new location."""
        # 1. Check that the given labware ID actually exists.
        # 2. Check that the location is unoccupied? (Probably defer this for now.)
        # 3. Grab a new labware offset, somehow?
        raise NotImplementedError()


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
