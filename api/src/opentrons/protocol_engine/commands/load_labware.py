"""Load labware command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons.protocols.models import LabwareDefinition

from ..types import LabwareLocation
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import EquipmentHandler


LoadLabwareCommandType = Literal["loadLabware"]


class LoadLabwareParams(BaseModel):
    """Payload required to load a labware into a slot."""

    location: LabwareLocation = Field(
        ...,
        description="Location the labware should be loaded into.",
    )
    loadName: str = Field(
        ...,
        description="Name used to reference a labware definition.",
    )
    namespace: str = Field(
        ...,
        description="The namespace the labware definition belongs to.",
    )
    version: int = Field(
        ...,
        description="The labware definition version.",
    )
    labwareId: Optional[str] = Field(
        None,
        description="An optional ID to assign to this labware. If None, an ID "
        "will be generated.",
    )
    displayName: Optional[str] = Field(
        None,
        description="An optional user-specified display name "
        "or label for this labware.",
        # NOTE: v4/5 JSON protocols will always have a displayName which will be the
        #  user-specified label OR the displayName property of the labware's definition.
        # TODO: Make sure v6 JSON protocols don't do that.
    )


class LoadLabwareResult(BaseModel):
    """Result data from the execution of a LoadLabware command."""

    labwareId: str = Field(
        ...,
        description="An ID to reference this labware in subsequent commands.",
    )
    definition: LabwareDefinition = Field(
        ...,
        description="The full definition data for this labware.",
    )
    offsetId: Optional[str] = Field(
        None,
        description=(
            "An ID referencing the offset applied to this labware placement,"
            " decided at load time."
            " Null or undefined means no offset was provided for this load,"
            " so the default of (0, 0, 0) will be used."
        ),
    )


class LoadLabwareImplementation(
    AbstractCommandImpl[LoadLabwareParams, LoadLabwareResult]
):
    """Load labware command implementation."""

    def __init__(self, equipment: EquipmentHandler, **kwargs: object) -> None:
        self._equipment = equipment

    async def execute(self, params: LoadLabwareParams) -> LoadLabwareResult:
        """Load definition and calibration data necessary for a labware."""
        loaded_labware = await self._equipment.load_labware(
            load_name=params.loadName,
            namespace=params.namespace,
            version=params.version,
            location=params.location,
            labware_id=params.labwareId,
        )

        return LoadLabwareResult(
            labwareId=loaded_labware.labware_id,
            definition=loaded_labware.definition,
            offsetId=loaded_labware.offsetId,
        )


class LoadLabware(BaseCommand[LoadLabwareParams, LoadLabwareResult]):
    """Load labware command resource model."""

    commandType: LoadLabwareCommandType = "loadLabware"
    params: LoadLabwareParams
    result: Optional[LoadLabwareResult]

    _ImplementationCls: Type[LoadLabwareImplementation] = LoadLabwareImplementation


class LoadLabwareCreate(BaseCommandCreate[LoadLabwareParams]):
    """Load labware command creation request."""

    commandType: LoadLabwareCommandType = "loadLabware"
    params: LoadLabwareParams

    _CommandCls: Type[LoadLabware] = LoadLabware
