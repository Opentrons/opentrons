"""Touch tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import BasePipettingParams
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import PipettingHandler


TouchTipCommandType = Literal["touchTip"]


class TouchTipParams(BasePipettingParams):
    """Payload needed to touch a pipette tip the sides of a specific well."""

    pass


class TouchTipResult(BaseModel):
    """Result data from the execution of a TouchTip."""

    pass


class TouchTipImplementation(AbstractCommandImpl[TouchTipParams, TouchTipResult]):
    """Touch tip command implementation."""

    def __init__(self, pipetting: PipettingHandler, **kwargs: object) -> None:
        self._pipetting = pipetting

    async def execute(self, params: TouchTipParams) -> TouchTipResult:
        """Touch tip to sides of a well using the requested pipette."""
        await self._pipetting.touch_tip(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )

        return TouchTipResult()


class TouchTip(BaseCommand[TouchTipParams, TouchTipResult]):
    """Touch up tip command model."""

    commandType: TouchTipCommandType = "touchTip"
    params: TouchTipParams
    result: Optional[TouchTipResult]

    _ImplementationCls: Type[TouchTipImplementation] = TouchTipImplementation


class TouchTipCreate(BaseCommandCreate[TouchTipParams]):
    """Touch tip command creation request model."""

    commandType: TouchTipCommandType = "touchTip"
    params: TouchTipParams

    _CommandCls: Type[TouchTip] = TouchTip
