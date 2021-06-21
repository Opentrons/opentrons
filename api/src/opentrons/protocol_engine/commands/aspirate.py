"""Aspirate command request, result, and implementation models."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from typing_extensions import Literal


from .pipetting_common import BaseLiquidHandlingData, BaseLiquidHandlingResult
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandRequest,
    CommandHandlers,
    CommandStatus,
)

AspirateCommandType = Literal["aspirate"]


class AspirateData(BaseLiquidHandlingData):
    """A request to move to a specific well and aspirate from it."""

    pass


class AspirateResult(BaseLiquidHandlingResult):
    """Result data from the execution of a AspirateRequest."""

    pass


class AspirateImplProvider:
    """Implementation provider mixin."""

    data: AspirateData

    def get_implementation(self) -> AspirateImplementation:
        """Get the execution implementation of an Aspirate."""
        return AspirateImplementation(self.data)


class AspirateRequest(BaseCommandRequest[AspirateData], AspirateImplProvider):
    """Create aspirate command request model."""

    commandType: AspirateCommandType = "aspirate"
    data: AspirateData


class Aspirate(BaseCommand[AspirateData, AspirateResult], AspirateImplProvider):
    """Aspirate command model."""

    commandType: AspirateCommandType = "aspirate"
    data: AspirateData
    result: Optional[AspirateResult]


class AspirateImplementation(
    AbstractCommandImpl[AspirateData, AspirateResult, Aspirate]
):
    """Aspirate command implementation."""

    def create_command(
        self,
        command_id: str,
        created_at: datetime,
        status: CommandStatus = CommandStatus.QUEUED,
    ) -> Aspirate:
        """Create a new Aspirate command resource."""
        return Aspirate(
            id=command_id,
            createdAt=created_at,
            status=status,
            data=self._data,
        )

    async def execute(
        self,
        handlers: CommandHandlers,
    ) -> AspirateResult:
        """Move to and aspirate from the requested well."""
        volume = await handlers.pipetting.aspirate(
            pipette_id=self._data.pipetteId,
            labware_id=self._data.labwareId,
            well_name=self._data.wellName,
            well_location=self._data.wellLocation,
            volume=self._data.volume,
        )

        return AspirateResult(volume=volume)
