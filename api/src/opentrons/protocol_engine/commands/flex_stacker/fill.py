"""Command models to engage a user to empty a Flex Stacker."""

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
from ...types import (
    StackerFillEmptyStrategy,
    StackerStoredLabwareGroup,
    LabwareLocationSequence,
    NotOnDeckLocationSequenceComponent,
    SYSTEM_LOCATION,
    InStackerHopperLocation,
)
from .common import (
    INITIAL_STORED_LABWARE_DESCRIPTION,
    build_ids_to_fill,
    build_or_assign_labware_to_hopper,
    labware_locations_for_group,
    labware_location_base_sequence,
    primary_location_sequences,
    adapter_location_sequences_with_default,
    lid_location_sequences_with_default,
)

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler, RunControlHandler
    from opentrons.protocol_engine.resources import ModelUtils


FillCommandType = Literal["flexStacker/fill"]


class FillParams(BaseModel):
    """The parameters defining how a stacker should be filled."""

    moduleId: str = Field(..., description="Unique ID of the Flex Stacker")

    strategy: StackerFillEmptyStrategy = Field(
        ...,
        description=(
            "How to fill the stacker. "
            "If manualWithPause, pause the protocol until the client sends an interaction, and apply "
            "the new specified count thereafter. If logical, do not pause but immediately apply the "
            "specified count."
        ),
    )

    message: str | SkipJsonSchema[None] = Field(
        None,
        description="The message to display on connected clients during a manualWithPause strategy fill.",
    )

    count: Optional[Annotated[int, Field(ge=1)]] = Field(
        None,
        description=(
            "How full the labware pool should now be. If None, default to the maximum amount "
            "of the currently-configured labware the pool can hold. "
            "If this number is larger than the maximum the pool can hold, it will be clamped to "
            "the maximum. If this number is smaller than the current amount of labware the pool "
            "holds, it will be clamped to that minimum. Do not use the value in the parameters as "
            "an outside observer; instead, use the count value from the results."
        ),
    )
    labwareToStore: list[StackerStoredLabwareGroup] | None = Field(
        None, description=INITIAL_STORED_LABWARE_DESCRIPTION
    )


class FillResult(BaseModel):
    """Result data from a stacker fill command."""

    count: int = Field(
        ..., description="The new amount of labware stored in the stacker."
    )
    primaryLabwareURI: str = Field(
        ..., description="The labware definition URI of the primary labware."
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
        None, description="The labware now stored in the stacker."
    )
    addedLabware: list[StackerStoredLabwareGroup] | SkipJsonSchema[None] = Field(
        None, description="The labware just added to the stacker."
    )
    originalPrimaryLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The previous position of each primary labware, in the same order as storedLabware.",
    )
    originalAdapterLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The previous position of each adapter labware, in the same order as storedLabware. None if the pool does not specify an adapter.",
    )
    originalLidLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The previous position of each lid labware, in the same order as storedLabware. None if the pool does not specify a lid.",
    )
    newPrimaryLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The new position of each primary labware, in the same order as storedLabware.",
    )
    newAdapterLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The new position of each adapter labware, in the same order as storedLabware. None if the pool does not specify an adapter.",
    )
    newLidLabwareLocationSequences: (
        list[LabwareLocationSequence] | SkipJsonSchema[None]
    ) = Field(
        None,
        description="The new position of each lid labware, in the same order as storedLabware. None if the pool does not specify a lid labware.",
    )


class FillImpl(AbstractCommandImpl[FillParams, SuccessData[FillResult]]):
    """Implementation of a stacker fill command."""

    def __init__(
        self,
        state_view: StateView,
        run_control: RunControlHandler,
        model_utils: ModelUtils,
        equipment: EquipmentHandler,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._run_control = run_control
        self._model_utils = model_utils
        self._equipment = equipment

    async def execute(self, params: FillParams) -> SuccessData[FillResult]:
        """Execute the stacker fill command."""
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )

        if stacker_state.pool_primary_definition is None:
            location = self._state_view.modules.get_location(params.moduleId)
            raise FlexStackerLabwarePoolNotYetDefinedError(
                message=f"The Flex Stacker in {location} has not been configured yet and cannot be filled."
            )

        groups_to_load = build_ids_to_fill(
            stacker_state.pool_adapter_definition is not None,
            stacker_state.pool_lid_definition is not None,
            params.labwareToStore,
            params.count,
            stacker_state.max_pool_count,
            len(stacker_state.contained_labware_bottom_first),
            self._model_utils,
        )

        state_update, new_contained_labware = await build_or_assign_labware_to_hopper(
            stacker_state.pool_primary_definition,
            stacker_state.pool_adapter_definition,
            stacker_state.pool_lid_definition,
            params.moduleId,
            groups_to_load,
            stacker_state.get_contained_labware(),
            self._equipment,
            self._state_view,
        )
        added_labware = [
            labware
            for labware in new_contained_labware
            if labware not in stacker_state.contained_labware_bottom_first
        ]

        original_location_sequences = [
            labware_locations_for_group(
                group,
                labware_location_base_sequence(
                    group,
                    self._state_view,
                    [
                        NotOnDeckLocationSequenceComponent(
                            logicalLocationName=SYSTEM_LOCATION
                        )
                    ],
                ),
            )
            for group in added_labware
        ]
        new_location_sequences = [
            labware_locations_for_group(
                group, [InStackerHopperLocation(moduleId=params.moduleId)]
            )
            for group in added_labware
        ]

        stacker_hw = self._equipment.get_module_hardware_api(
            module_id=stacker_state.module_id
        )
        if stacker_hw:
            stacker_hw.set_stacker_identify(True)

        if params.strategy == StackerFillEmptyStrategy.MANUAL_WITH_PAUSE:
            await self._run_control.wait_for_resume()

        if stacker_hw:
            stacker_hw.set_stacker_identify(False)

        return SuccessData(
            public=FillResult.model_construct(
                count=len(new_contained_labware),
                storedLabware=new_contained_labware,
                addedLabware=added_labware,
                primaryLabwareURI=self._state_view.labware.get_uri_from_definition_unless_none(
                    stacker_state.pool_primary_definition
                ),
                adapterLabwareURI=self._state_view.labware.get_uri_from_definition_unless_none(
                    stacker_state.pool_adapter_definition
                ),
                lidLabwareURI=self._state_view.labware.get_uri_from_definition_unless_none(
                    stacker_state.pool_lid_definition
                ),
                originalPrimaryLabwareLocationSequences=primary_location_sequences(
                    original_location_sequences
                ),
                originalAdapterLabwareLocationSequences=adapter_location_sequences_with_default(
                    original_location_sequences, stacker_state.pool_adapter_definition
                ),
                originalLidLabwareLocationSequences=lid_location_sequences_with_default(
                    original_location_sequences, stacker_state.pool_lid_definition
                ),
                newPrimaryLabwareLocationSequences=primary_location_sequences(
                    new_location_sequences
                ),
                newAdapterLabwareLocationSequences=adapter_location_sequences_with_default(
                    new_location_sequences, stacker_state.pool_adapter_definition
                ),
                newLidLabwareLocationSequences=lid_location_sequences_with_default(
                    new_location_sequences, stacker_state.pool_lid_definition
                ),
            ),
            state_update=state_update,
        )


class Fill(BaseCommand[FillParams, FillResult, ErrorOccurrence]):
    """A command to fill the Flex Stacker with labware."""

    commandType: FillCommandType = "flexStacker/fill"
    params: FillParams
    result: Optional[FillResult] = None

    _ImplementationCls: Type[FillImpl] = FillImpl


class FillCreate(BaseCommandCreate[FillParams]):
    """A request to execute a Flex Stacker fill command."""

    commandType: FillCommandType = "flexStacker/fill"
    params: FillParams

    _CommandCls: Type[Fill] = Fill
