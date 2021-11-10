"""Add labware command."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Type
from typing_extensions import Literal

from opentrons.protocols.models import LabwareDefinition
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

AddLabwareDefinitionCommandType = Literal["addLabwareDefinition"]


class AddLabwareDefinitionParams(BaseModel):
    """Parameters required to add a labware definition."""

    definition: LabwareDefinition = Field(..., description="The labware definition.")


class AddLabwareDefinitionResult(BaseModel):
    """Result data from execution of an AddLabware command."""

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
    AbstractCommandImpl[AddLabwareDefinitionParams, AddLabwareDefinitionResult]
):
    """Add labware command implementation."""

    async def execute(
        self,
        params: AddLabwareDefinitionParams,
    ) -> AddLabwareDefinitionResult:
        """Execute the add labware definition request."""
        return AddLabwareDefinitionResult(
            loadName=params.definition.parameters.loadName,
            namespace=params.definition.namespace,
            version=params.definition.version,
        )


class AddLabwareDefinition(
    BaseCommand[AddLabwareDefinitionParams, AddLabwareDefinitionResult]
):
    """Add labware definition command resource."""

    commandType: AddLabwareDefinitionCommandType = "addLabwareDefinition"
    params: AddLabwareDefinitionParams
    result: Optional[AddLabwareDefinitionResult]

    _ImplementationCls: Type[
        AddLabwareDefinitionImplementation
    ] = AddLabwareDefinitionImplementation


class AddLabwareDefinitionCreate(BaseCommandCreate[AddLabwareDefinitionParams]):
    """Add labware definition command creation request."""

    commandType: AddLabwareDefinitionCommandType = "addLabwareDefinition"
    params: AddLabwareDefinitionParams

    _CommandCls: Type[AddLabwareDefinition] = AddLabwareDefinition
