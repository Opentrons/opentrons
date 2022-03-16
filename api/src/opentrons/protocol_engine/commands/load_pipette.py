"""Load pipette command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons.types import MountType

from ..types import PipetteName
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import EquipmentHandler


LoadPipetteCommandType = Literal["loadPipette"]


class LoadPipetteParams(BaseModel):
    """Payload needed to load a pipette on to a mount."""

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


class LoadPipetteImplementation(
    AbstractCommandImpl[LoadPipetteParams, LoadPipetteResult]
):
    """Load pipette command implementation."""

    def __init__(self, equipment: EquipmentHandler, **kwargs: object) -> None:
        self._equipment = equipment

    async def execute(self, params: LoadPipetteParams) -> LoadPipetteResult:
        """Check that requested pipette is attached and assign its identifier."""
        loaded_pipette = await self._equipment.load_pipette(
            pipette_name=params.pipetteName,
            mount=params.mount,
            pipette_id=params.pipetteId,
        )

        return LoadPipetteResult(pipetteId=loaded_pipette.pipette_id)


class LoadPipette(BaseCommand[LoadPipetteParams, LoadPipetteResult]):
    """Load pipette command model."""

    commandType: LoadPipetteCommandType = "loadPipette"
    params: LoadPipetteParams
    result: Optional[LoadPipetteResult]

    _ImplementationCls: Type[LoadPipetteImplementation] = LoadPipetteImplementation


class LoadPipetteCreate(BaseCommandCreate[LoadPipetteParams]):
    """Load pipette command creation request model."""

    commandType: LoadPipetteCommandType = "loadPipette"
    params: LoadPipetteParams

    _CommandCls: Type[LoadPipette] = LoadPipette
