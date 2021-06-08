"""Pick up tip command request, result, and implementation models."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from typing_extensions import Literal

from .pipetting_common import BasePipettingData
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandRequest,
    CommandHandlers,
    CommandStatus,
)


PickUpTipCommandType = Literal["pickUpTip"]


class PickUpTipData(BasePipettingData):
    """Data needed to move a pipette to a specific well."""

    pass


class PickUpTipResult(BaseModel):
    """Result data from the execution of a PickUpTip."""

    pass


class PickUpTipRequest(BaseCommandRequest[PickUpTipData]):
    """Pick up tip command creation request model."""

    commandType: PickUpTipCommandType = "pickUpTip"
    data: PickUpTipData

    def get_implementation(self) -> PickUpTipImplementation:
        """Get the execution implementation of the PickUpTipRequest."""
        return PickUpTipImplementation(self.data)


class PickUpTip(BaseCommand[PickUpTipData, PickUpTipResult]):
    """Pick up tip command model."""

    commandType: PickUpTipCommandType = "pickUpTip"
    data: PickUpTipData
    result: Optional[PickUpTipResult]


class PickUpTipImplementation(
    AbstractCommandImpl[PickUpTipData, PickUpTipResult, PickUpTip]
):
    """Pick up tip command implementation."""

    def create_command(
        self,
        command_id: str,
        created_at: datetime,
        status: CommandStatus = CommandStatus.QUEUED,
    ) -> PickUpTip:
        """Create a new PickUpTip command resource."""
        return PickUpTip(
            id=command_id,
            createdAt=created_at,
            status=status,
            data=self._data,
        )

    async def execute(self, handlers: CommandHandlers) -> PickUpTipResult:
        """Move to and pick up a tip using the requested pipette."""
        await handlers.pipetting.pick_up_tip(
            pipette_id=self._data.pipetteId,
            labware_id=self._data.labwareId,
            well_name=self._data.wellName,
        )

        return PickUpTipResult()
