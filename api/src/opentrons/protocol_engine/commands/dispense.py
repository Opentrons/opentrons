"""Dispense command request, result, and implementation models."""
from __future__ import annotations
from typing import Optional, Type
from typing_extensions import Literal

from .pipetting_common import BaseLiquidHandlingData, BaseLiquidHandlingResult
from .command import AbstractCommandImpl, BaseCommand, BaseCommandRequest


DispenseCommandType = Literal["dispense"]


class DispenseData(BaseLiquidHandlingData):
    """Data required to dispense to a specific well."""

    pass


class DispenseResult(BaseLiquidHandlingResult):
    """Result data from the execution of a DispenseRequest."""

    pass


class DispenseImplementation(AbstractCommandImpl[DispenseData, DispenseResult]):
    """Dispense command implementation."""

    async def execute(self, data: DispenseData) -> DispenseResult:
        """Move to and dispense to the requested well."""
        volume = await self._pipetting.dispense(
            pipette_id=data.pipetteId,
            labware_id=data.labwareId,
            well_name=data.wellName,
            well_location=data.wellLocation,
            volume=data.volume,
        )

        return DispenseResult(volume=volume)


class Dispense(BaseCommand[DispenseData, DispenseResult]):
    """Dispense command model."""

    commandType: DispenseCommandType = "dispense"
    data: DispenseData
    result: Optional[DispenseResult]

    _ImplementationCls: Type[DispenseImplementation] = DispenseImplementation


class DispenseRequest(BaseCommandRequest[DispenseData]):
    """Create dispense command request model."""

    commandType: DispenseCommandType = "dispense"
    data: DispenseData

    _CommandCls: Type[Dispense] = Dispense
