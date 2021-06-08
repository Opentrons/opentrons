"""Load labware command request, result, and implementation models."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Tuple
from typing_extensions import Literal

from opentrons.protocols.models import LabwareDefinition

from opentrons.protocol_engine.types import LabwareLocation
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandRequest,
    CommandHandlers,
    CommandStatus,
)

LoadLabwareCommandType = Literal["loadLabware"]


class LoadLabwareData(BaseModel):
    """A request to load a labware into a slot."""

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


class LoadLabwareResult(BaseModel):
    """Result data from the execution of a LoadLabwareRequest."""

    labwareId: str = Field(
        ...,
        description="An ID to reference this labware in subsequent commands.",
    )
    definition: LabwareDefinition = Field(
        ...,
        description="The full definition data for this labware.",
    )
    calibration: Tuple[float, float, float] = Field(
        ...,
        description="Calibration offset data for this labware at load time.",
    )


class LoadLabwareRequest(BaseCommandRequest[LoadLabwareData]):
    """Load labware command creation request."""

    commandType: LoadLabwareCommandType = "loadLabware"
    data: LoadLabwareData

    def get_implementation(self) -> LoadLabwareImplementation:
        """Get the execution implementation of the LoadLabwareRequest."""
        return LoadLabwareImplementation(self.data)


class LoadLabware(BaseCommand[LoadLabwareData, LoadLabwareResult]):
    """Load labware command resource model."""

    commandType: LoadLabwareCommandType = "loadLabware"
    data: LoadLabwareData
    result: Optional[LoadLabwareResult]


class LoadLabwareImplementation(
    AbstractCommandImpl[LoadLabwareData, LoadLabwareResult, LoadLabware]
):
    """Load labware command implementation."""

    def create_command(
        self,
        command_id: str,
        created_at: datetime,
        status: CommandStatus = CommandStatus.QUEUED,
    ) -> LoadLabware:
        """Create a new LoadLabware command resource."""
        return LoadLabware(
            id=command_id,
            createdAt=created_at,
            status=status,
            data=self._data,
        )

    async def execute(self, handlers: CommandHandlers) -> LoadLabwareResult:
        """Load definition and calibration data necessary for a labware."""
        loaded_labware = await handlers.equipment.load_labware(
            load_name=self._data.loadName,
            namespace=self._data.namespace,
            version=self._data.version,
            location=self._data.location,
            labware_id=self._data.labwareId,
        )

        return LoadLabwareResult(
            labwareId=loaded_labware.labware_id,
            definition=loaded_labware.definition,
            calibration=loaded_labware.calibration,
        )
