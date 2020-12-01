"""Move to well command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel

from .command import CommandImplementation, CommandHandlers
from .pipetting_common import BasePipettingRequest


class MoveToWellRequest(BasePipettingRequest):
    """A request to move a pipette to a specific well."""

    def get_implementation(self) -> MoveToWellImplementation:
        """Get the move to well request's command implementation."""
        return MoveToWellImplementation(self)


class MoveToWellResult(BaseModel):
    """Result data from the execution of a MoveToWellRequest."""

    pass


class MoveToWellImplementation(
    CommandImplementation[MoveToWellRequest, MoveToWellResult]
):
    """Move to well command implementation."""

    async def execute(self, handlers: CommandHandlers) -> MoveToWellResult:
        """Move the requested pipette to the requested well."""
        await handlers.movement.move_to_well(
            pipette_id=self._request.pipetteId,
            labware_id=self._request.labwareId,
            well_name=self._request.wellName,
        )

        return MoveToWellResult()
