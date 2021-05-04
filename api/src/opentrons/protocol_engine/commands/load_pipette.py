"""Load pipette command request, result, and implementation models."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from opentrons.types import MountType

from ..types import PipetteName
from .command import CommandImplementation, CommandHandlers


class LoadPipetteRequest(BaseModel):
    """A request to load a pipette on to a mount."""

    pipetteName: PipetteName = Field(
        ...,
        description="The name of the pipette to be required.",
    )
    mount: MountType = Field(
        ...,
        description="The mount the pipette should be present on.",
    )
    pipetteId: Optional[str] = Field(
        None,
        description="An optional ID to assign to this pipette. If None, an ID "
                    "will be generated."
    )

    def get_implementation(self) -> LoadPipetteImplementation:
        """Get the load pipette request's command implementation."""
        return LoadPipetteImplementation(self)


class LoadPipetteResult(BaseModel):
    """Result data for executing a LoadPipetteRequest."""

    pipetteId: str = Field(
        ...,
        description="An ID to reference this pipette in subsequent commands.",
    )


class LoadPipetteImplementation(
    CommandImplementation[LoadPipetteRequest, LoadPipetteResult]
):
    """Load pipette command implementation."""

    async def execute(self, handlers: CommandHandlers) -> LoadPipetteResult:
        """Check that requested pipette is attached and assign its identifier."""
        loaded_pipette = await handlers.equipment.load_pipette(
            pipette_name=self._request.pipetteName,
            mount=self._request.mount,
            pipette_id=self._request.pipetteId
        )

        return LoadPipetteResult(pipetteId=loaded_pipette.pipette_id)
