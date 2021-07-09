"""Aspirate command request, result, and implementation models."""
from __future__ import annotations
from typing import Optional, Type
from typing_extensions import Literal


from .pipetting_common import BaseLiquidHandlingData, BaseLiquidHandlingResult
from .command import AbstractCommandImpl, BaseCommand, BaseCommandRequest

AspirateCommandType = Literal["aspirate"]


class AspirateData(BaseLiquidHandlingData):
    """Data required to aspirate from a specific well."""

    pass


class AspirateResult(BaseLiquidHandlingResult):
    """Result data from the execution of a AspirateRequest."""

    pass


class AspirateImplementation(AbstractCommandImpl[AspirateData, AspirateResult]):
    """Aspirate command implementation."""

    async def execute(self, data: AspirateData) -> AspirateResult:
        """Move to and aspirate from the requested well."""
        volume = await self._pipetting.aspirate(
            pipette_id=data.pipetteId,
            labware_id=data.labwareId,
            well_name=data.wellName,
            well_location=data.wellLocation,
            volume=data.volume,
        )

        return AspirateResult(volume=volume)


class Aspirate(BaseCommand[AspirateData, AspirateResult]):
    """Aspirate command model."""

    commandType: AspirateCommandType = "aspirate"
    data: AspirateData
    result: Optional[AspirateResult]

    _ImplementationCls: Type[AspirateImplementation] = AspirateImplementation


class AspirateRequest(BaseCommandRequest[AspirateData]):
    """Create aspirate command request model."""

    commandType: AspirateCommandType = "aspirate"
    data: AspirateData

    _CommandCls: Type[Aspirate] = Aspirate
