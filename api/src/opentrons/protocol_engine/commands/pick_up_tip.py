"""Pick up tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, Type
from typing_extensions import Literal

from .pipetting_common import BasePipettingData
from .command import AbstractCommandImpl, BaseCommand, BaseCommandRequest


PickUpTipCommandType = Literal["pickUpTip"]


class PickUpTipData(BasePipettingData):
    """Data needed to move a pipette to a specific well."""

    pass


class PickUpTipResult(BaseModel):
    """Result data from the execution of a PickUpTip."""

    pass


class PickUpTipImplementation(AbstractCommandImpl[PickUpTipData, PickUpTipResult]):
    """Pick up tip command implementation."""

    async def execute(self, data: PickUpTipData) -> PickUpTipResult:
        """Move to and pick up a tip using the requested pipette."""
        await self._pipetting.pick_up_tip(
            pipette_id=data.pipetteId,
            labware_id=data.labwareId,
            well_name=data.wellName,
        )

        return PickUpTipResult()


class PickUpTip(BaseCommand[PickUpTipData, PickUpTipResult]):
    """Pick up tip command model."""

    commandType: PickUpTipCommandType = "pickUpTip"
    data: PickUpTipData
    result: Optional[PickUpTipResult]

    _ImplementationCls: Type[PickUpTipImplementation] = PickUpTipImplementation


class PickUpTipRequest(BaseCommandRequest[PickUpTipData]):
    """Pick up tip command creation request model."""

    commandType: PickUpTipCommandType = "pickUpTip"
    data: PickUpTipData

    _CommandCls: Type[PickUpTip] = PickUpTip
