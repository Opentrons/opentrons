"""Reload labware command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..state import StateView
    from ..execution import EquipmentHandler


ReloadLabwareCommandType = Literal["reloadLabware"]


class ReloadLabwareParams(BaseModel):
    """Payload required to load a labware into a slot."""

    labwareId: str = Field(
        ..., description="The already-loaded labware instance to update."
    )


class ReloadLabwareResult(BaseModel):
    """Result data from the execution of a LoadLabware command."""

    labwareId: str = Field(
        ...,
        description="An ID to reference this labware in subsequent commands. Same as the one in the parameters.",
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
    AbstractCommandImpl[ReloadLabwareParams, SuccessData[ReloadLabwareResult, None]]
):
    """Reload labware command implementation."""

    def __init__(
        self, equipment: EquipmentHandler, state_view: StateView, **kwargs: object
    ) -> None:
        self._equipment = equipment
        self._state_view = state_view

    async def execute(
        self, params: ReloadLabwareParams
    ) -> SuccessData[ReloadLabwareResult, None]:
        """Reload the definition and calibration data for a specific labware."""
        reloaded_labware = await self._equipment.reload_labware(
            labware_id=params.labwareId,
        )

        return SuccessData(
            public=ReloadLabwareResult(
                labwareId=params.labwareId,
                offsetId=reloaded_labware.offsetId,
            ),
            private=None,
        )


class ReloadLabware(
    BaseCommand[ReloadLabwareParams, ReloadLabwareResult, ErrorOccurrence]
):
    """Reload labware command resource model."""

    commandType: ReloadLabwareCommandType = "reloadLabware"
    params: ReloadLabwareParams
    result: Optional[ReloadLabwareResult]

    _ImplementationCls: Type[ReloadLabwareImplementation] = ReloadLabwareImplementation


class ReloadLabwareCreate(BaseCommandCreate[ReloadLabwareParams]):
    """Reload labware command creation request."""

    commandType: ReloadLabwareCommandType = "reloadLabware"
    params: ReloadLabwareParams

    _CommandCls: Type[ReloadLabware] = ReloadLabware
