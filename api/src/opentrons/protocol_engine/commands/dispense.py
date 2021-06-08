"""Dispense command request, result, and implementation models."""
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

    def get_implementation(self) -> DispenseImplementation:
        """Get the execution implementation of the DispenseRequest."""
        return DispenseImplementation(self.data)


class Dispense(BaseCommand[DispenseData, DispenseResult]):
    """Dispense command model."""

    commandType: DispenseCommandType = "dispense"
    data: DispenseData
    result: Optional[DispenseResult]


class DispenseImplementation(
    AbstractCommandImpl[DispenseData, DispenseResult, Dispense]
):
    """Dispense command implementation."""

    def create_command(
        self,
        command_id: str,
        created_at: datetime,
        status: CommandStatus = CommandStatus.QUEUED,
    ) -> Dispense:
        """Create a new Dispense command resource."""
        return Dispense(
            id=command_id,
            createdAt=created_at,
            status=status,
            data=self._data,
        )

    async def execute(self, handlers: CommandHandlers) -> DispenseResult:
        """Move to and dispense to the requested well."""
        volume = await handlers.pipetting.dispense(
            pipette_id=self._data.pipetteId,
            labware_id=self._data.labwareId,
            well_name=self._data.wellName,
            well_location=self._data.wellLocation,
            volume=self._data.volume,
        )

        return DispenseResult(volume=volume)
