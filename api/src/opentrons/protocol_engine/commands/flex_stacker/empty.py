"""Command models to engage a user to empty a Flex Stacker."""

from __future__ import annotations

from __future__ import annotations
from typing import Optional, Literal, TYPE_CHECKING, Annotated
from typing_extensions import Type

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors import (
    ErrorOccurrence,
)
from ...errors.exceptions import FlexStackerLabwarePoolNotYetDefinedError
from ...state import update_types
from ...types import (
    StackerFillEmptyStrategy,
    StackerStoredLabwareGroup,
    NotOnDeckLocationSequenceComponent,
    OFF_DECK_LOCATION,
    InStackerHopperLocation,
    LabwareLocationSequence,
    OnLabwareLocation,
    LabwareLocation,
)
from .common import (
    labware_locations_for_group,
    primary_location_sequences,
    adapter_location_sequences_with_default,
    lid_location_sequences_with_default,
)

if TYPE_CHECKING:
    from ...state.state import StateView
    from ...execution import RunControlHandler, EquipmentHandler

EmptyCommandType = Literal["flexStacker/empty"]


class EmptyParams(BaseModel):
    """The parameters defining how a stacker should be emptied."""

    moduleId: str = Field(..., description="Unique ID of the Flex Stacker")

    strategy: StackerFillEmptyStrategy = Field(
        ...,
        description=(
            "How to empty the stacker. "
            "If manualWithPause, pause the protocol until the client sends an interaction, and mark "
            "the labware pool as empty thereafter. If logical, do not pause but immediately apply the "
            "specified count."
        ),
    )

    message: str | SkipJsonSchema[None] = Field(
        None,
        description="The message to display on connected clients during a manualWithPause strategy empty.",
    )

    count: Optional[Annotated[int, Field(ge=0)]] = Field(
        None,
        description=(
            "The new count of labware in the pool. If None, default to an empty pool. If this number is "
            "larger than the amount of labware currently in the pool, default to the smaller amount. "
            "Do not use the value in the parameters as an outside observer; instead, use the count value "
            "from the results."
        ),
    )


class EmptyResult(BaseModel):
    """Result data from a stacker empty command."""

    count: int = Field(
        ..., description="The new amount of labware stored in the stacker labware pool."
    )
    primaryLabwareURI: str = Field(
        ...,
        description="The labware definition URI of the primary labware.",
    )
    adapterLabwareURI: str | SkipJsonSchema[None] = Field(
        None,
        description="The labware definition URI of the adapter labware.",
    )
    lidLabwareURI: str | SkipJsonSchema[None] = Field(
        None,
        description="The labware definition URI of the lid labware.",
    )
    storedLabware: list[StackerStoredLabwareGroup] | SkipJsonSchema[None] = Field(
        ..., description="The primary labware loaded into the stacker labware pool."
    )
    removedLabware: list[StackerStoredLabwareGroup] | SkipJsonSchema[None] = Field(
        ...,
        description="The labware objects that have just been removed from the stacker labware pool.",
    )
    originalPrimaryLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The previous position of each newly-removed primary labware, in the same order as removedLabware.",
    )
    originalAdapterLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The previous position of each newly-removed adapter labware, in the same order as removedLabware. None if the pool does not specify an adapter.",
    )
    originalLidLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The previous position of each newly-removed lid labware, in the same order as removedLabware. None if the  pool does not specify a lid.",
    )
    newPrimaryLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The new position of each newly-removed primary labware, in the same order as removedLabware.",
    )
    newAdapterLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The new position of each newly-removed adapter labware, in the same order as removedLabware. None if the pool does not specify an adapter.",
    )
    newLidLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The new position of each newly-removed lid labware, in the same order as removedLabware. None if the pool does not specify a lid labware.",
    )


class EmptyImpl(AbstractCommandImpl[EmptyParams, SuccessData[EmptyResult]]):
    """Implementation of a stacker empty command."""

    def __init__(
        self,
        state_view: StateView,
        run_control: RunControlHandler,
        equipment: EquipmentHandler,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._run_control = run_control
        self._equipment = equipment

    async def execute(  # noqa: C901
        self, params: EmptyParams
    ) -> SuccessData[EmptyResult]:
        """Execute the stacker empty command."""
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )

        if stacker_state.pool_primary_definition is None:
            location = self._state_view.modules.get_location(params.moduleId)
            raise FlexStackerLabwarePoolNotYetDefinedError(
                message=f"The Flex Stacker in {location} has not been configured yet and cannot be emptied."
            )

        count = params.count if params.count is not None else 0

        new_count = min(len(stacker_state.contained_labware_bottom_first), count)

        new_stored_labware = stacker_state.contained_labware_bottom_first[:new_count]
        removed_labware = stacker_state.contained_labware_bottom_first[new_count:]
        new_locations_by_id: dict[str, LabwareLocation] = {}
        new_offset_ids_by_id: dict[str, str | None] = {}

        def _add_to_dicts(labware_group: StackerStoredLabwareGroup) -> None:
            if labware_group.adapterLabwareId:
                new_locations_by_id[labware_group.primaryLabwareId] = OnLabwareLocation(
                    labwareId=labware_group.adapterLabwareId
                )
                new_locations_by_id[labware_group.adapterLabwareId] = OFF_DECK_LOCATION
                new_offset_ids_by_id[labware_group.primaryLabwareId] = None
                new_offset_ids_by_id[labware_group.adapterLabwareId] = None
            else:
                new_locations_by_id[labware_group.primaryLabwareId] = OFF_DECK_LOCATION
                new_offset_ids_by_id[labware_group.primaryLabwareId] = None
            if labware_group.lidLabwareId:
                new_locations_by_id[labware_group.lidLabwareId] = OnLabwareLocation(
                    labwareId=labware_group.primaryLabwareId
                )
                new_offset_ids_by_id[labware_group.lidLabwareId] = None

        for group in removed_labware:
            _add_to_dicts(group)

        state_update = (
            update_types.StateUpdate()
            .update_flex_stacker_contained_labware(
                module_id=params.moduleId,
                contained_labware_bottom_first=new_stored_labware,
            )
            .set_batch_labware_location(
                new_locations_by_id=new_locations_by_id,
                new_offset_ids_by_id=new_offset_ids_by_id,
            )
        )

        stacker_hw = self._equipment.get_module_hardware_api(
            module_id=stacker_state.module_id
        )
        if stacker_hw:
            stacker_hw.set_stacker_identify(True)

        if params.strategy == StackerFillEmptyStrategy.MANUAL_WITH_PAUSE:
            await self._run_control.wait_for_resume()

        if stacker_hw:
            stacker_hw.set_stacker_identify(False)

        if stacker_state.pool_primary_definition is None:
            raise FlexStackerLabwarePoolNotYetDefinedError(
                "The Primary Labware must be defined in the stacker pool."
            )

        original_locations = [
            labware_locations_for_group(
                group, [InStackerHopperLocation(moduleId=params.moduleId)]
            )
            for group in removed_labware
        ]
        new_locations = [
            labware_locations_for_group(
                group,
                [
                    NotOnDeckLocationSequenceComponent(
                        logicalLocationName=OFF_DECK_LOCATION
                    )
                ],
            )
            for group in removed_labware
        ]

        return SuccessData(
            public=EmptyResult.model_construct(
                count=new_count,
                primaryLabwareURI=self._state_view.labware.get_uri_from_definition(
                    stacker_state.pool_primary_definition
                ),
                adapterLabwareURI=self._state_view.labware.get_uri_from_definition_unless_none(
                    stacker_state.pool_adapter_definition
                ),
                lidLabwareURI=self._state_view.labware.get_uri_from_definition_unless_none(
                    stacker_state.pool_lid_definition
                ),
                storedLabware=new_stored_labware,
                removedLabware=removed_labware,
                originalPrimaryLabwareLocationSequences=primary_location_sequences(
                    original_locations
                ),
                originalAdapterLabwareLocationSequences=adapter_location_sequences_with_default(
                    original_locations, stacker_state.pool_adapter_definition
                ),
                originalLidLabwareLocationSequences=lid_location_sequences_with_default(
                    original_locations, stacker_state.pool_lid_definition
                ),
                newPrimaryLabwareLocationSequences=primary_location_sequences(
                    new_locations
                ),
                newAdapterLabwareLocationSequences=adapter_location_sequences_with_default(
                    new_locations, stacker_state.pool_adapter_definition
                ),
                newLidLabwareLocationSequences=lid_location_sequences_with_default(
                    new_locations, stacker_state.pool_lid_definition
                ),
            ),
            state_update=state_update,
        )


class Empty(BaseCommand[EmptyParams, EmptyResult, ErrorOccurrence]):
    """A command to empty the Flex Stacker of labware."""

    commandType: EmptyCommandType = "flexStacker/empty"
    params: EmptyParams
    result: Optional[EmptyResult] = None

    _ImplementationCls: Type[EmptyImpl] = EmptyImpl


class EmptyCreate(BaseCommandCreate[EmptyParams]):
    """A request to execute a Flex Stacker empty command."""

    commandType: EmptyCommandType = "flexStacker/empty"
    params: EmptyParams

    _CommandCls: Type[Empty] = Empty
