"""Load labware command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Type
from typing_extensions import Literal

from opentrons.protocols.models import LabwareDefinition

from ..types import LabwareLocation, CalibrationOffset
from .command import AbstractCommandImpl, BaseCommand, BaseCommandRequest

LoadLabwareCommandType = Literal["loadLabware"]


class LoadLabwareData(BaseModel):
    """Data required to load a labware into a slot."""

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
    calibration: CalibrationOffset = Field(
        ...,
        description="Calibration offset data for this labware at load time.",
    )


class LoadLabwareImplementation(
    AbstractCommandImpl[LoadLabwareData, LoadLabwareResult]
):
    """Load labware command implementation."""

    async def execute(self, data: LoadLabwareData) -> LoadLabwareResult:
        """Load definition and calibration data necessary for a labware."""
        loaded_labware = await self._equipment.load_labware(
            load_name=data.loadName,
            namespace=data.namespace,
            version=data.version,
            location=data.location,
            labware_id=data.labwareId,
        )
        x_offset, y_offset, z_offset = loaded_labware.calibration

        return LoadLabwareResult(
            labwareId=loaded_labware.labware_id,
            definition=loaded_labware.definition,
            calibration=CalibrationOffset(x=x_offset, y=y_offset, z=z_offset),
        )


class LoadLabware(BaseCommand[LoadLabwareData, LoadLabwareResult]):
    """Load labware command resource model."""

    commandType: LoadLabwareCommandType = "loadLabware"
    data: LoadLabwareData
    result: Optional[LoadLabwareResult]

    _ImplementationCls: Type[LoadLabwareImplementation] = LoadLabwareImplementation


class LoadLabwareRequest(BaseCommandRequest[LoadLabwareData]):
    """Load labware command creation request."""

    commandType: LoadLabwareCommandType = "loadLabware"
    data: LoadLabwareData

    _CommandCls: Type[LoadLabware] = LoadLabware
