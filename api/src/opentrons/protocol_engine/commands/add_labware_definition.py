"""Add labware command."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Type
from typing_extensions import Literal

from opentrons.protocols.models import LabwareDefinition
from .command import AbstractCommandImpl, BaseCommand, BaseCommandRequest

AddLabwareDefinitionCommandType = Literal["addLabwareDefinition"]


class AddLabwareDefinitionData(BaseModel):
    """Data required to add a labware definition."""

    definition: LabwareDefinition = Field(..., description="The labware definition.")


class AddLabwareDefinitionResult(BaseModel):
    """Result of add labware request."""

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


class AddLabwareDefinitionImplementation(
    AbstractCommandImpl[AddLabwareDefinitionData, AddLabwareDefinitionResult]
):
    """Add labware command implementation."""

    async def execute(
        self, data: AddLabwareDefinitionData
    ) -> AddLabwareDefinitionResult:
        """Execute the add labware definition request."""
        return AddLabwareDefinitionResult(
            loadName=data.definition.parameters.loadName,
            namespace=data.definition.namespace,
            version=data.definition.version,
        )


class AddLabwareDefinition(
    BaseCommand[AddLabwareDefinitionData, AddLabwareDefinitionResult]
):
    """Add labware definition command resource."""

    commandType: AddLabwareDefinitionCommandType = "addLabwareDefinition"
    data: AddLabwareDefinitionData
    result: Optional[AddLabwareDefinitionResult]

    _ImplementationCls: Type[
        AddLabwareDefinitionImplementation
    ] = AddLabwareDefinitionImplementation


class AddLabwareDefinitionRequest(BaseCommandRequest[AddLabwareDefinitionData]):
    """Add labware definition command creation request."""

    commandType: AddLabwareDefinitionCommandType = "addLabwareDefinition"
    data: AddLabwareDefinitionData

    _CommandCls: Type[AddLabwareDefinition] = AddLabwareDefinition
