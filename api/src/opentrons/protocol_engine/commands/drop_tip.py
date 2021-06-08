"""Drop tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional
from typing_extensions import Literal

from .base import BaseCommand, BaseCommandRequest, BaseCommandImpl
from .pipetting_common import BasePipettingData


if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import CommandHandlers


DropTipCommandType = Literal["dropTip"]


class DropTipData(BasePipettingData):
    """A request to drop a tip in a specific well."""

    pass


class DropTipResult(BaseModel):
    """Result data from the execution of a DropTipRequest."""

    pass


class DropTipRequest(BaseCommandRequest[DropTipData]):
    """Drop tip command creation request model."""

    commandType: DropTipCommandType = "dropTip"
    data: DropTipData


class DropTip(BaseCommand[DropTipData, DropTipResult]):
    """Drop tip command model."""

    commandType: DropTipCommandType = "dropTip"
    data: DropTipData
    result: Optional[DropTipResult]

    class Implementation(BaseCommandImpl[DropTipData, DropTipResult]):
        """Drop tip command implementation."""

        async def execute(
            self,
            data: DropTipData,
            handlers: CommandHandlers,
        ) -> DropTipResult:
            """Move to and drop a tip using the requested pipette."""
            await handlers.pipetting.drop_tip(
                pipette_id=data.pipetteId,
                labware_id=data.labwareId,
                well_name=data.wellName,
            )

            return DropTipResult()
