"""Load adapter command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from ..errors import LabwareDefinitionIsNotAdapterError
from ..resources import labware_validation
from ..types import NonStackedLocation
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..execution import EquipmentHandler


LoadAdapterCommandType = Literal["loadAdapter"]


class LoadAdapterParams(BaseModel):
    """Payload required to load an adapter into a slot."""

    location: NonStackedLocation = Field(
        ...,
        description="Location the adapter should be loaded into.",
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
    adapterId: Optional[str] = Field(
        None,
        description="An optional ID to assign to this adapter. If None, an ID "
        "will be generated.",
    )


class LoadAdapterResult(BaseModel):
    """Result data from the execution of a loadAdapter command."""

    adapterId: str = Field(
        ...,
        description="An ID to reference this adapter in subsequent commands.",
    )
    definition: LabwareDefinition = Field(
        ...,
        description="The full definition data for this adapter.",
    )
    offsetId: Optional[str] = Field(
        # Default `None` instead of `...` so this field shows up as non-required in
        # OpenAPI. The server is allowed to omit it or make it null.
        None,
        description=(
            "An ID referencing the adapter offset that will apply"
            " to the newly-placed adapter."
            " This offset will be in effect until the labware is moved"
            " with a `moveLabware` command."
            " Null or undefined means no offset applies,"
            " so the default of (0, 0, 0) will be used."
        ),
    )


class LoadAdapterImplementation(
    AbstractCommandImpl[LoadAdapterParams, LoadAdapterResult]
):
    """Load adapter command implementation."""

    def __init__(self, equipment: EquipmentHandler, **kwargs: object) -> None:
        self._equipment = equipment

    async def execute(self, params: LoadAdapterParams) -> LoadAdapterResult:
        """Load definition and calibration data necessary for an adapter."""
        loaded_labware = await self._equipment.load_labware(
            load_name=params.loadName,
            namespace=params.namespace,
            version=params.version,
            location=params.location,
            labware_id=params.adapterId,
        )

        # TODO(jbl 2023-06-23) this validation check happen after the adapter is loaded, because it relies on
        #   on the definition. In practice this will not cause any issues since it will raise a protocol ending
        #   exception, but for correctness should be refactored to do this check beforehand.
        if not labware_validation.validate_definition_is_adapter(
            loaded_labware.definition
        ):
            raise LabwareDefinitionIsNotAdapterError(
                f"{params.loadName} is not defined as an adapter"
            )

        return LoadAdapterResult(
            adapterId=loaded_labware.labware_id,
            definition=loaded_labware.definition,
            offsetId=loaded_labware.offsetId,
        )


class LoadAdapter(BaseCommand[LoadAdapterParams, LoadAdapterResult]):
    """Load adapter command resource model."""

    commandType: LoadAdapterCommandType = "loadAdapter"
    params: LoadAdapterParams
    result: Optional[LoadAdapterResult]

    _ImplementationCls: Type[LoadAdapterImplementation] = LoadAdapterImplementation


class LoadAdapterCreate(BaseCommandCreate[LoadAdapterParams]):
    """Load adapter command creation request."""

    commandType: LoadAdapterCommandType = "loadAdapter"
    params: LoadAdapterParams

    _CommandCls: Type[LoadAdapter] = LoadAdapter
