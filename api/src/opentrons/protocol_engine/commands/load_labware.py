"""Load labware command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Any, Tuple

from ..types import LabwareLocation
from .command import CommandImplementation, CommandHandlers


class LoadLabwareRequest(BaseModel):
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

    def get_implementation(self) -> LoadLabwareImplementation:
        """Get the load labware request's command implementation."""
        return LoadLabwareImplementation(self)


class LoadLabwareResult(BaseModel):
    """Result data from the execution of a LoadLabwareRequest."""

    labwareId: str = Field(
        ...,
        description="An ID to reference this labware in subsequent commands.",
    )
    # TODO(mc, 2020-10-21): Don't use `Any` here (TypedDicts make Pydantic sad)
    definition: Any = Field(
        ...,
        description="The full definition data for this labware.",
    )
    calibration: Tuple[float, float, float] = Field(
        ...,
        description="Calibration offset data for this labware at load time.",
    )


class LoadLabwareImplementation(
    CommandImplementation[LoadLabwareRequest, LoadLabwareResult]
):
    """Load labware command implementation."""

    async def execute(self, handlers: CommandHandlers) -> LoadLabwareResult:
        """Load definition and calibration data necessary for a labware."""
        loaded_labware = await handlers.equipment.load_labware(
            load_name=self._request.loadName,
            namespace=self._request.namespace,
            version=self._request.version,
            location=self._request.location,
        )

        return LoadLabwareResult(
            labwareId=loaded_labware.labware_id,
            definition=loaded_labware.definition,
            calibration=loaded_labware.calibration,
        )
