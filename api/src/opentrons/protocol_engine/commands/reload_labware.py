"""Reload labware command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from ..resources import labware_validation

from ..errors import LabwareIsNotAllowedInLocationError
from ..types import (
    OnLabwareLocation,
    DeckSlotLocation,
)

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate

if TYPE_CHECKING:
    from ..state import StateView
    from ..execution import EquipmentHandler


ReloadLabwareCommandType = Literal["reloadLabware"]


class ReloadLabwareParams(BaseModel):
    """Payload required to load a labware into a slot."""

    labwareId: str = Field(
        ..., description="The already-loaded labware instance to update."
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
    displayName: Optional[str] = Field(
        None,
        description="An optional user-specified display name "
        "or label for this labware.",
    )


class ReloadLabwareResult(BaseModel):
    """Result data from the execution of a LoadLabware command."""

    labwareId: str = Field(
        ...,
        description="An ID to reference this labware in subsequent commands. Same as the one in the parameters.",
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
            " to the reloaded labware."
            " This offset will be in effect until the labware is moved"
            " with a `moveLabware` command."
            " Null or undefined means no offset applies,"
            " so the default of (0, 0, 0) will be used."
        ),
    )


class ReloadLabwareImplementation(
    AbstractCommandImpl[ReloadLabwareParams, ReloadLabwareResult]
):
    """Load labware command implementation."""

    def __init__(
        self, equipment: EquipmentHandler, state_view: StateView, **kwargs: object
    ) -> None:
        self._equipment = equipment
        self._state_view = state_view

    async def execute(self, params: ReloadLabwareParams) -> ReloadLabwareResult:
        """Reload the definition and calibration data for a specific labware."""
        reloaded_labware = await self._equipment.reload_labware(
            labware_id=params.labwareId,
            load_name=params.loadName,
            namespace=params.namespace,
            version=params.version,
        )

        # note: this check must be kept because somebody might specify the trash loadName
        if (
            labware_validation.is_flex_trash(params.loadName)
            and isinstance(reloaded_labware.location, DeckSlotLocation)
            and self._state_view.geometry.get_slot_column(
                reloaded_labware.location.slotName
            )
            != 3
        ):
            raise LabwareIsNotAllowedInLocationError(
                f"{params.loadName} is not allowed in slot {reloaded_labware.location.slotName}"
            )

        if isinstance(reloaded_labware.location, OnLabwareLocation):
            self._state_view.labware.raise_if_labware_cannot_be_stacked(
                top_labware_definition=reloaded_labware.definition,
                bottom_labware_id=reloaded_labware.location.labwareId,
            )

        return ReloadLabwareResult(
            labwareId=params.labwareId,
            definition=reloaded_labware.definition,
            offsetId=reloaded_labware.offsetId,
        )


class ReloadLabware(BaseCommand[ReloadLabwareParams, ReloadLabwareResult]):
    """Load labware command resource model."""

    commandType: ReloadLabwareCommandType = "reloadLabware"
    params: ReloadLabwareParams
    result: Optional[ReloadLabwareResult]

    _ImplementationCls: Type[ReloadLabwareImplementation] = ReloadLabwareImplementation


class ReloadLabwareCreate(BaseCommandCreate[ReloadLabwareParams]):
    """Load labware command creation request."""

    commandType: ReloadLabwareCommandType = "reloadLabware"
    params: ReloadLabwareParams

    _CommandCls: Type[ReloadLabware] = ReloadLabware
