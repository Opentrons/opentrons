"""Load pipette command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional
from typing_extensions import Literal

from opentrons.types import MountType

from ..types import PipetteName
from .base import BaseCommand, BaseCommandRequest, BaseCommandImpl

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import CommandHandlers


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


class LoadPipetteRequest(BaseCommandRequest[LoadPipetteData]):
    """Load pipette command creation request model."""

    commandType: LoadPipetteCommandType = "loadPipette"
    data: LoadPipetteData


class LoadPipette(BaseCommand[LoadPipetteData, LoadPipetteResult]):
    """Load pipette command model."""

    commandType: LoadPipetteCommandType = "loadPipette"
    data: LoadPipetteData
    result: Optional[LoadPipetteResult]

    class Implementation(BaseCommandImpl[LoadPipetteData, LoadPipetteResult]):
        """Load pipette command implementation."""

        async def execute(
            self,
            data: LoadPipetteData,
            handlers: CommandHandlers,
        ) -> LoadPipetteResult:
            """Check that requested pipette is attached and assign its identifier."""
            loaded_pipette = await handlers.equipment.load_pipette(
                pipette_name=data.pipetteName,
                mount=data.mount,
                pipette_id=data.pipetteId,
            )

            return LoadPipetteResult(pipetteId=loaded_pipette.pipette_id)
