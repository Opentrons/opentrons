"""Dispense command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional
from typing_extensions import Literal

from .base import BaseCommand, BaseCommandRequest, BaseCommandImpl
from .pipetting_common import BaseLiquidHandlingData, BaseLiquidHandlingResult


if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import CommandHandlers


DispenseCommandType = Literal["dispense"]


class DispenseData(BaseLiquidHandlingData):
    """A request to aspirate from a specific well."""

    pass


class DispenseResult(BaseLiquidHandlingResult):
    """Result data from the execution of a DispenseRequest."""

    pass


class DispenseRequest(BaseCommandRequest[DispenseData]):
    """Create dispense command request model."""

    commandType: DispenseCommandType = "dispense"
    data: DispenseData


class Dispense(BaseCommand[DispenseData, DispenseResult]):
    """Dispense command model."""

    commandType: DispenseCommandType = "dispense"
    data: DispenseData
    result: Optional[DispenseResult]

    class Implementation(BaseCommandImpl[DispenseData, DispenseResult]):
        """Dispense command implementation."""

        async def execute(
            self, data: DispenseData, handlers: CommandHandlers
        ) -> DispenseResult:
            """Move to and dispense to the requested well."""
            volume = await handlers.pipetting.dispense(
                pipette_id=data.pipetteId,
                labware_id=data.labwareId,
                well_name=data.wellName,
                well_location=data.wellLocation,
                volume=data.volume,
            )

            return DispenseResult(volume=volume)
