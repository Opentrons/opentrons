"""Load pipette command request, result, and implementation models."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from typing_extensions import Literal

from opentrons.types import MountType

from ..types import PipetteName
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandRequest,
    CommandHandlers,
    CommandStatus,
)

LoadPipetteCommandType = Literal["loadPipette"]


class LoadPipetteData(BaseModel):
    """Data needed to load a pipette on to a mount."""

    pipetteName: PipetteName = Field(
        ...,
        description="The load name of the pipette to be required.",
    )
    mount: MountType = Field(
        ...,
        description="The mount the pipette should be present on.",
    )
    pipetteId: Optional[str] = Field(
        None,
        description="An optional ID to assign to this pipette. If None, an ID "
        "will be generated.",
    )


class LoadPipetteResult(BaseModel):
    """Result data for executing a LoadPipette."""

    pipetteId: str = Field(
        ...,
        description="An ID to reference this pipette in subsequent commands.",
    )


class LoadPipetteImplProvider:
    """Implementation provider mixin."""

    data: LoadPipetteData

    def get_implementation(self) -> LoadPipetteImplementation:
        """Get the execution implementation of a LoadPipette."""
        return LoadPipetteImplementation(self.data)


class LoadPipetteRequest(BaseCommandRequest[LoadPipetteData], LoadPipetteImplProvider):
    """Load pipette command creation request model."""

    commandType: LoadPipetteCommandType = "loadPipette"
    data: LoadPipetteData


class LoadPipette(
    BaseCommand[LoadPipetteData, LoadPipetteResult],
    LoadPipetteImplProvider,
):
    """Load pipette command model."""

    commandType: LoadPipetteCommandType = "loadPipette"
    data: LoadPipetteData
    result: Optional[LoadPipetteResult]


class LoadPipetteImplementation(
    AbstractCommandImpl[LoadPipetteData, LoadPipetteResult, LoadPipette]
):
    """Load pipette command implementation."""

    def create_command(
        self,
        command_id: str,
        created_at: datetime,
        status: CommandStatus = CommandStatus.QUEUED,
    ) -> LoadPipette:
        """Create a new LoadPipette command resource."""
        return LoadPipette(
            id=command_id,
            createdAt=created_at,
            status=status,
            data=self._data,
        )

    async def execute(self, handlers: CommandHandlers) -> LoadPipetteResult:
        """Check that requested pipette is attached and assign its identifier."""
        loaded_pipette = await handlers.equipment.load_pipette(
            pipette_name=self._data.pipetteName,
            mount=self._data.mount,
            pipette_id=self._data.pipetteId,
        )

        return LoadPipetteResult(pipetteId=loaded_pipette.pipette_id)
