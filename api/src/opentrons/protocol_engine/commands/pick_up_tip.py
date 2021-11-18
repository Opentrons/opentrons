"""Pick up tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, Type
from typing_extensions import Literal

from .pipetting_common import BasePipettingParams
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


PickUpTipCommandType = Literal["pickUpTip"]


class PickUpTipParams(BasePipettingParams):
    """Payload needed to move a pipette to a specific well."""

    pass


class PickUpTipResult(BaseModel):
    """Result data from the execution of a PickUpTip."""

    pass


class PickUpTipImplementation(AbstractCommandImpl[PickUpTipParams, PickUpTipResult]):
    """Pick up tip command implementation."""

    async def execute(self, params: PickUpTipParams) -> PickUpTipResult:
        """Move to and pick up a tip using the requested pipette."""
        await self._pipetting.pick_up_tip(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )

        return PickUpTipResult()


class PickUpTip(BaseCommand[PickUpTipParams, PickUpTipResult]):
    """Pick up tip command model."""

    commandType: PickUpTipCommandType = "pickUpTip"
    params: PickUpTipParams
    result: Optional[PickUpTipResult]

    _ImplementationCls: Type[PickUpTipImplementation] = PickUpTipImplementation


class PickUpTipCreate(BaseCommandCreate[PickUpTipParams]):
    """Pick up tip command creation request model."""

    commandType: PickUpTipCommandType = "pickUpTip"
    params: PickUpTipParams

    _CommandCls: Type[PickUpTip] = PickUpTip
