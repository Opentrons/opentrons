"""Pick up tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel

from .command import CommandImplementation, CommandHandlers
from .pipetting_common import BasePipettingRequest


class PickUpTipRequest(BasePipettingRequest):
    """A request to move a pipette to a specific well."""

    def get_implementation(self) -> PickUpTipImplementation:
        """Get the pick up tip request's command implementation."""
        return PickUpTipImplementation(self)


class PickUpTipResult(BaseModel):
    """Result data from the execution of a PickUpTipRequest."""

    pass


class PickUpTipImplementation(
    CommandImplementation[PickUpTipRequest, PickUpTipResult]
):
    """Pick up tip command implementation."""

    async def execute(self, handlers: CommandHandlers) -> PickUpTipResult:
        """Move to and pick up a tip using the requested pipette."""
        await handlers.pipetting.pick_up_tip(
            pipette_id=self._request.pipetteId,
            labware_id=self._request.labwareId,
            well_name=self._request.wellName,
        )

        return PickUpTipResult()
