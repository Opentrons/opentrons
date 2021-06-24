"""Drop tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, Type
from typing_extensions import Literal

from .pipetting_common import BasePipettingData
from .command import AbstractCommandImpl, BaseCommand, BaseCommandRequest

DropTipCommandType = Literal["dropTip"]


class DropTipData(BasePipettingData):
    """Data required to drop a tip in a specific well."""

    pass


class DropTipResult(BaseModel):
    """Result data from the execution of a DropTipRequest."""

    pass


class DropTipImplementation(AbstractCommandImpl[DropTipData, DropTipResult]):
    """Drop tip command implementation."""

    async def execute(self, data: DropTipData) -> DropTipResult:
        """Move to and drop a tip using the requested pipette."""
        await self._pipetting.drop_tip(
            pipette_id=data.pipetteId,
            labware_id=data.labwareId,
            well_name=data.wellName,
        )

        return DropTipResult()


class DropTip(BaseCommand[DropTipData, DropTipResult]):
    """Drop tip command model."""

    commandType: DropTipCommandType = "dropTip"
    data: DropTipData
    result: Optional[DropTipResult]

    _ImplementationCls: Type[DropTipImplementation] = DropTipImplementation


class DropTipRequest(BaseCommandRequest[DropTipData]):
    """Drop tip command creation request model."""

    commandType: DropTipCommandType = "dropTip"
    data: DropTipData

    _CommandCls: Type[DropTip] = DropTip
