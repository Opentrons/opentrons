"""Drop tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel

from .command import CommandImplementation, CommandHandlers
from .pipetting_common import BasePipettingRequest


class DropTipRequest(BasePipettingRequest):
    """A request to drop a tip in a specific well."""

    def get_implementation(self) -> DropTipImplementation:
        """Get the drop tip request's command implementation."""
        return DropTipImplementation(self)


class DropTipResult(BaseModel):
    """Result data from the execution of a DropTipRequest."""

    pass


class DropTipImplementation(
    CommandImplementation[DropTipRequest, DropTipResult]
):
    """Drop tip command implementation."""

    async def execute(self, handlers: CommandHandlers) -> DropTipResult:
        """Move to and drop a tip using the requested pipette."""
        await handlers.pipetting.drop_tip(
            pipette_id=self._request.pipetteId,
            labware_id=self._request.labwareId,
            well_name=self._request.wellName,
        )

        return DropTipResult()
