"""Add labware command."""
from __future__ import annotations
from opentrons.protocol_engine.commands.command import (
    CommandImplementation, CommandHandlers
)
from pydantic import BaseModel, Field
from opentrons.protocols.models import LabwareDefinition


class AddLabwareDefinitionRequest(BaseModel):
    """Request to add a labware definition."""
    definition: LabwareDefinition = Field(
        ...,
        description="The labware definition."
    )

    def get_implementation(self) -> AddLabwareDefinitionImplementation:
        """Get the execution implementation of the AddLabwareDefinitionRequest."""
        return AddLabwareDefinitionImplementation(self)


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
    CommandImplementation[AddLabwareDefinitionRequest,
                          AddLabwareDefinitionResult]
):
    """Add labware command implementation."""

    async def execute(
            self,
            handlers: CommandHandlers
    ) -> AddLabwareDefinitionResult:
        """Execute the add labware definition request."""
        return AddLabwareDefinitionResult(
            loadName=self._request.definition.parameters.loadName,
            namespace=self._request.definition.namespace,
            version=self._request.definition.version
        )
