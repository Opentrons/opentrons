"""Add labware command."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional
from typing_extensions import Literal

from opentrons.protocols.models import LabwareDefinition
from .base import BaseCommand, BaseCommandRequest, BaseCommandImpl

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import CommandHandlers


AddLabwareDefinitionCommandType = Literal["addLabwareDefinition"]


class AddLabwareDefinitionData(BaseModel):
    """Request to add a labware definition."""

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


class AddLabwareDefinitionRequest(BaseCommandRequest[AddLabwareDefinitionData]):
    """Add labware definition command creation request."""

    commandType: AddLabwareDefinitionCommandType = "addLabwareDefinition"
    data: AddLabwareDefinitionData


class AddLabwareDefinition(
    BaseCommand[AddLabwareDefinitionData, AddLabwareDefinitionResult]
):
    """Add labware definition command resource."""

    commandType: AddLabwareDefinitionCommandType = "addLabwareDefinition"
    data: AddLabwareDefinitionData
    result: Optional[AddLabwareDefinitionResult]

    class Implementation(
        BaseCommandImpl[AddLabwareDefinitionData, AddLabwareDefinitionResult]
    ):
        """Add labware command implementation."""

        async def execute(
            self, data: AddLabwareDefinitionData, handlers: CommandHandlers
        ) -> AddLabwareDefinitionResult:
            """Execute the add labware definition request."""
            return AddLabwareDefinitionResult(
                loadName=data.definition.parameters.loadName,
                namespace=data.definition.namespace,
                version=data.definition.version,
            )
