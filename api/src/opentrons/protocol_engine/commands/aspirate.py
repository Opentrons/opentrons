"""Aspirate command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field

from ..types import WellLocation
from .command import CommandImplementation, CommandHandlers
from .pipetting_common import BasePipettingRequest


class AspirateRequest(BasePipettingRequest):
    """A request to aspirate from a specific well."""

    wellLocation: WellLocation = Field(
        ...,
        description="Relative well location to aspirate from.",
    )
    volume: float = Field(
        ...,
        description="Volume of liquid to aspirate.",
    )

    def get_implementation(self) -> AspirateImplementation:
        """Get the execution implementation of the AspirateRequest."""
        return AspirateImplementation(self)


class AspirateResult(BaseModel):
    """Result data from the execution of a AspirateRequest."""

    volume: float = Field(
        ...,
        description="Volume of liquid aspirated.",
    )


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
