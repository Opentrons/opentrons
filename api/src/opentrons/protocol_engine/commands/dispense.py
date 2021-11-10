"""Dispense command request, result, and implementation models."""
from __future__ import annotations
from typing import Optional, Type
from typing_extensions import Literal

from .pipetting_common import BaseLiquidHandlingParams, BaseLiquidHandlingResult
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate


DispenseCommandType = Literal["dispense"]


class DispenseParams(BaseLiquidHandlingParams):
    """Payload required to dispense to a specific well."""

    pass


class DispenseResult(BaseLiquidHandlingResult):
    """Result data from the execution of a Dispense command."""

    pass


class DispenseImplementation(AbstractCommandImpl[DispenseParams, DispenseResult]):
    """Dispense command implementation."""

    async def execute(self, params: DispenseParams) -> DispenseResult:
        """Move to and dispense to the requested well."""
        volume = await self._pipetting.dispense(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
            volume=params.volume,
        )

        return DispenseResult(volume=volume)


class Dispense(BaseCommand[DispenseParams, DispenseResult]):
    """Dispense command model."""

    commandType: DispenseCommandType = "dispense"
    params: DispenseParams
    result: Optional[DispenseResult]

    _ImplementationCls: Type[DispenseImplementation] = DispenseImplementation


class DispenseCreate(BaseCommandCreate[DispenseParams]):
    """Create dispense command request model."""

    commandType: DispenseCommandType = "dispense"
    params: DispenseParams

    _CommandCls: Type[Dispense] = Dispense
