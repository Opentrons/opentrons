"""Add labware command."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from typing_extensions import Literal

from opentrons.protocols.models import LabwareDefinition
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandRequest,
    CommandHandlers,
    CommandStatus,
)

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


class AddLabwareDefinitionImplProvider:
    """Implementation provider mixin."""

    data: AddLabwareDefinitionData

    def get_implementation(self) -> AddLabwareDefinitionImplementation:
        """Get the execution implementation of an AddLabwareDefinition."""
        return AddLabwareDefinitionImplementation(self.data)


class AddLabwareDefinitionRequest(
    BaseCommandRequest[AddLabwareDefinitionData],
    AddLabwareDefinitionImplProvider,
):
    """Add labware definition command creation request."""

    commandType: AddLabwareDefinitionCommandType = "addLabwareDefinition"
    data: AddLabwareDefinitionData


class AddLabwareDefinition(
    BaseCommand[AddLabwareDefinitionData, AddLabwareDefinitionResult],
    AddLabwareDefinitionImplProvider,
):
    """Add labware definition command resource."""

    commandType: AddLabwareDefinitionCommandType = "addLabwareDefinition"
    data: AddLabwareDefinitionData
    result: Optional[AddLabwareDefinitionResult]


class AddLabwareDefinitionImplementation(
    AbstractCommandImpl[
        AddLabwareDefinitionData,
        AddLabwareDefinitionResult,
        AddLabwareDefinition,
    ]
):
    """Add labware command implementation."""

    def create_command(
        self,
        command_id: str,
        created_at: datetime,
        status: CommandStatus = CommandStatus.QUEUED,
    ) -> AddLabwareDefinition:
        """Create a new AddLabwareDefinition command resource."""
        return AddLabwareDefinition(
            id=command_id,
            createdAt=created_at,
            status=status,
            data=self._data,
        )

    async def execute(self, handlers: CommandHandlers) -> AddLabwareDefinitionResult:
        """Execute the add labware definition request."""
        return AddLabwareDefinitionResult(
            loadName=self._data.definition.parameters.loadName,
            namespace=self._data.definition.namespace,
            version=self._data.definition.version,
        )
