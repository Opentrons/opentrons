"""Aspirate command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional
from typing_extensions import Literal

from .base import BaseCommand, BaseCommandRequest, BaseCommandImpl
from .pipetting_common import BaseLiquidHandlingData, BaseLiquidHandlingResult


if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import CommandHandlers


AspirateCommandType = Literal["aspirate"]


class AspirateData(BaseLiquidHandlingData):
    """A request to move to a specific well and aspirate from it."""

    pass


class AspirateResult(BaseLiquidHandlingResult):
    """Result data from the execution of a AspirateRequest."""

    pass


class AspirateRequest(BaseCommandRequest[AspirateData]):
    """Create aspirate command request model."""

    commandType: AspirateCommandType = "aspirate"
    data: AspirateData


class Aspirate(BaseCommand[AspirateData, AspirateResult]):
    """Aspirate command model."""

    commandType: AspirateCommandType = "aspirate"
    data: AspirateData
    result: Optional[AspirateResult]

    class Implementation(BaseCommandImpl[AspirateData, AspirateResult]):
        """Aspirate command implementation."""

        async def execute(
            self,
            data: AspirateData,
            handlers: CommandHandlers,
        ) -> AspirateResult:
            """Move to and aspirate from the requested well."""
            volume = await handlers.pipetting.aspirate(
                pipette_id=data.pipetteId,
                labware_id=data.labwareId,
                well_name=data.wellName,
                well_location=data.wellLocation,
                volume=data.volume,
            )

            return AspirateResult(volume=volume)
