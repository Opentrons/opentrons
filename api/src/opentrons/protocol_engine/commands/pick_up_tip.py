"""Pick up tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import PipetteIdMixin, WellLocationMixin
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import PipettingHandler


PickUpTipCommandType = Literal["pickUpTip"]


class PickUpTipParams(PipetteIdMixin, WellLocationMixin):
    """Payload needed to move a pipette to a specific well."""

    presses: Optional[int] = Field(
        None,
        description="The number of times to lower and then raise the pipette when picking up a tip.",
    )

    increment: Optional[float] = Field(
        None,
        description="The additional distance to travel on each successive press",
    )


class PickUpTipResult(BaseModel):
    """Result data from the execution of a PickUpTip."""

    pass


class PickUpTipImplementation(AbstractCommandImpl[PickUpTipParams, PickUpTipResult]):
    """Pick up tip command implementation."""

    def __init__(self, pipetting: PipettingHandler, **kwargs: object) -> None:
        self._pipetting = pipetting

    async def execute(self, params: PickUpTipParams) -> PickUpTipResult:
        """Move to and pick up a tip using the requested pipette."""
        await self._pipetting.pick_up_tip(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
            presses=params.presses,
            increment=params.increment
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
