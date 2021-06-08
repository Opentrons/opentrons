"""Pick up tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional
from typing_extensions import Literal

from .base import BaseCommand, BaseCommandRequest, BaseCommandImpl
from .pipetting_common import BasePipettingData

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import CommandHandlers


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


class PickUpTip(BaseCommand[PickUpTipData, PickUpTipResult]):
    """Pick up tip command model."""

    commandType: PickUpTipCommandType = "pickUpTip"
    data: PickUpTipData
    result: Optional[PickUpTipResult]

    class Implementation(BaseCommandImpl[PickUpTipData, PickUpTipResult]):
        """Pick up tip command implementation."""

        async def execute(
            self,
            data: PickUpTipData,
            handlers: CommandHandlers,
        ) -> PickUpTipResult:
            """Move to and pick up a tip using the requested pipette."""
            await handlers.pipetting.pick_up_tip(
                pipette_id=data.pipetteId,
                labware_id=data.labwareId,
                well_name=data.wellName,
            )

            return PickUpTipResult()
