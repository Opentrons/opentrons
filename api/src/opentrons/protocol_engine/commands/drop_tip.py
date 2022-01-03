"""Drop tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, Type
from typing_extensions import Literal

from .pipetting_common import BasePipettingParams
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

DropTipCommandType = Literal["dropTip"]


class DropTipParams(BasePipettingParams):
    """Payload required to drop a tip in a specific well."""

    pass


class DropTipResult(BaseModel):
    """Result data from the execution of a DropTip command."""

    pass


class DropTipImplementation(AbstractCommandImpl[DropTipParams, DropTipResult]):
    """Drop tip command implementation."""

    async def execute(self, params: DropTipParams) -> DropTipResult:
        """Move to and drop a tip using the requested pipette."""
        await self._pipetting.drop_tip(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )

        return DropTipResult()


class DropTip(BaseCommand[DropTipParams, DropTipResult]):
    """Drop tip command model."""

    commandType: DropTipCommandType = "dropTip"
    params: DropTipParams
    result: Optional[DropTipResult]

    _ImplementationCls: Type[DropTipImplementation] = DropTipImplementation


class DropTipCreate(BaseCommandCreate[DropTipParams]):
    """Drop tip command creation request model."""

    commandType: DropTipCommandType = "dropTip"
    params: DropTipParams

    _CommandCls: Type[DropTip] = DropTip
