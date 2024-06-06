"""Load labware command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from ..errors import LabwareIsNotAllowedInLocationError
from ..resources import labware_validation, fixture_validation
from ..types import (
    LabwareLocation,
    OnLabwareLocation,
    DeckSlotLocation,
    AddressableAreaLocation,
)

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..state import StateView
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
        # Default `None` instead of `...` so this field shows up as non-required in
        # OpenAPI. The server is allowed to omit it or make it null.
        None,
        description=(
            "An ID referencing the labware offset that will apply"
            " to the newly-placed labware."
            " This offset will be in effect until the labware is moved"
            " with a `moveLabware` command."
            " Null or undefined means no offset applies,"
            " so the default of (0, 0, 0) will be used."
        ),
    )


class LoadLabwareImplementation(
    AbstractCommandImpl[LoadLabwareParams, SuccessData[LoadLabwareResult, None]]
):
    """Load labware command implementation."""

    def __init__(
        self, equipment: EquipmentHandler, state_view: StateView, **kwargs: object
    ) -> None:
        self._equipment = equipment
        self._state_view = state_view

    async def execute(
        self, params: LoadLabwareParams
    ) -> SuccessData[LoadLabwareResult, None]:
        """Load definition and calibration data necessary for a labware."""
        # TODO (tz, 8-15-2023): extend column validation to column 1 when working
        # on https://opentrons.atlassian.net/browse/RSS-258 and completing
        # https://opentrons.atlassian.net/browse/RSS-255
        if (
            labware_validation.is_flex_trash(params.loadName)
            and isinstance(params.location, DeckSlotLocation)
            and self._state_view.geometry.get_slot_column(params.location.slotName) != 3
        ):
            raise LabwareIsNotAllowedInLocationError(
                f"{params.loadName} is not allowed in slot {params.location.slotName}"
            )

        if isinstance(params.location, AddressableAreaLocation):
            area_name = params.location.addressableAreaName
            if not fixture_validation.is_deck_slot(params.location.addressableAreaName):
                raise LabwareIsNotAllowedInLocationError(
                    f"Cannot load {params.loadName} onto addressable area {area_name}"
                )
            self._state_view.addressable_areas.raise_if_area_not_in_deck_configuration(
                area_name
            )
        elif isinstance(params.location, DeckSlotLocation):
            self._state_view.addressable_areas.raise_if_area_not_in_deck_configuration(
                params.location.slotName.id
            )

        verified_location = self._state_view.geometry.ensure_location_not_occupied(
            params.location
        )
        loaded_labware = await self._equipment.load_labware(
            load_name=params.loadName,
            namespace=params.namespace,
            version=params.version,
            location=verified_location,
            labware_id=params.labwareId,
        )

        # TODO(jbl 2023-06-23) these validation checks happen after the labware is loaded, because they rely on
        #   on the definition. In practice this will not cause any issues since they will raise protocol ending
        #   exception, but for correctness should be refactored to do this check beforehand.
        if isinstance(verified_location, OnLabwareLocation):
            self._state_view.labware.raise_if_labware_cannot_be_stacked(
                top_labware_definition=loaded_labware.definition,
                bottom_labware_id=verified_location.labwareId,
            )

        return SuccessData(
            public=LoadLabwareResult(
                labwareId=loaded_labware.labware_id,
                definition=loaded_labware.definition,
                offsetId=loaded_labware.offsetId,
            ),
            private=None,
        )


class LoadLabware(BaseCommand[LoadLabwareParams, LoadLabwareResult, ErrorOccurrence]):
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
