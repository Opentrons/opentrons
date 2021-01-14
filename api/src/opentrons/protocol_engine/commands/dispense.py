"""Dispense command request, result, and implementation models."""
from __future__ import annotations
from typing_extensions import final

from .command import CommandImplementation, CommandHandlers
from .pipetting_common import BaseLiquidHandlingRequest, BaseLiquidHandlingResult


@final
class DispenseRequest(BaseLiquidHandlingRequest):
    """A request to aspirate from a specific well."""

    def get_implementation(self) -> DispenseImplementation:
        """Get the execution implementation of the DispenseRequest."""
        return DispenseImplementation(self)


@final
class DispenseResult(BaseLiquidHandlingResult):
    """Result data from the execution of a DispenseRequest."""

    pass


@final
class DispenseImplementation(
    CommandImplementation[DispenseRequest, DispenseResult]
):
    """Dispense command implementation."""

    async def execute(self, handlers: CommandHandlers) -> DispenseResult:
        """Move to and dispense to the requested well."""
        volume = await handlers.pipetting.dispense(
            pipette_id=self._request.pipetteId,
            labware_id=self._request.labwareId,
            well_name=self._request.wellName,
            well_location=self._request.wellLocation,
            volume=self._request.volume,
        )

        return DispenseResult(volume=volume)
