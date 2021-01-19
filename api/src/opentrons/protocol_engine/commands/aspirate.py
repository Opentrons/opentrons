"""Aspirate command request, result, and implementation models."""
from __future__ import annotations
from typing_extensions import final

from .command import CommandImplementation, CommandHandlers
from .pipetting_common import BaseLiquidHandlingRequest, BaseLiquidHandlingResult


@final
class AspirateRequest(BaseLiquidHandlingRequest):
    """A request to aspirate from a specific well."""

    def get_implementation(self) -> AspirateImplementation:
        """Get the execution implementation of the AspirateRequest."""
        return AspirateImplementation(self)


@final
class AspirateResult(BaseLiquidHandlingResult):
    """Result data from the execution of a AspirateRequest."""

    pass


@final
class AspirateImplementation(
    CommandImplementation[AspirateRequest, AspirateResult]
):
    """Aspirate command implementation."""

    async def execute(self, handlers: CommandHandlers) -> AspirateResult:
        """Move to and aspirate from the requested well."""
        volume = await handlers.pipetting.aspirate(
            pipette_id=self._request.pipetteId,
            labware_id=self._request.labwareId,
            well_name=self._request.wellName,
            well_location=self._request.wellLocation,
            volume=self._request.volume,
        )

        return AspirateResult(volume=volume)
