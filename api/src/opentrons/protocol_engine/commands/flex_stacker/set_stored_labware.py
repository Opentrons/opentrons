"""Command models to configure the stored labware pool of a Flex Stacker.."""

from __future__ import annotations
from typing import Optional, Literal, TYPE_CHECKING, Annotated
from typing_extensions import Type

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema

from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors import (
    ErrorOccurrence,
)
from ...errors.exceptions import FlexStackerNotLogicallyEmptyError
from ...types import (
    StackerStoredLabwareGroup,
    LabwareLocationSequence,
    NotOnDeckLocationSequenceComponent,
    InStackerHopperLocation,
    SYSTEM_LOCATION,
)
from .common import (
    INITIAL_COUNT_DESCRIPTION,
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
    from opentrons.protocol_engine.execution import EquipmentHandler
    from opentrons.protocol_engine.resources import ModelUtils

SetStoredLabwareCommandType = Literal["flexStacker/setStoredLabware"]


class StackerStoredLabwareDetails(BaseModel):
    """The parameters defining a labware to be stored in the stacker."""

    loadName: str = Field(
        ..., description="Name used to reference the definition of this labware."
    )
    namespace: str = Field(
        ..., description="Namespace of the definition of this labware."
    )
    version: int = Field(..., description="Version of the definition of this labware.")


class SetStoredLabwareParams(BaseModel):
    """Input parameters for a setStoredLabware command."""

    moduleId: str = Field(
        ...,
        description="Unique ID of the Flex Stacker.",
    )
    primaryLabware: StackerStoredLabwareDetails = Field(
        ...,
        description="The details of the primary labware (i.e. not the lid or adapter, if any) stored in the stacker.",
    )
    lidLabware: StackerStoredLabwareDetails | SkipJsonSchema[None] = Field(
        default=None,
        description="The details of the lid on the primary labware, if any.",
    )
    adapterLabware: StackerStoredLabwareDetails | SkipJsonSchema[None] = Field(
        default=None,
        description="The details of the adapter under the primary labware, if any.",
    )
    initialCount: Optional[Annotated[int, Field(ge=0)]] = Field(
        None,
        description=INITIAL_COUNT_DESCRIPTION,
    )
    initialStoredLabware: list[StackerStoredLabwareGroup] | None = Field(
        None,
        description=INITIAL_STORED_LABWARE_DESCRIPTION,
    )
    poolOverlapOverride: Optional[float] = Field(
        None,
        description=(
            "Override for the Z stacking overlap of the labware pool. If not "
            "provided, the protocol engine will calculate the overlap based on "
            "the stacking offsets provided in the labware definitions."
        ),
    )


class SetStoredLabwareResult(BaseModel):
    """Result data from a setstoredlabware command."""

    primaryLabwareDefinition: LabwareDefinition = Field(
        ..., description="The definition of the primary labware."
    )
    lidLabwareDefinition: LabwareDefinition | SkipJsonSchema[None] = Field(
        None, description="The definition of the lid on the primary labware, if any."
    )
    adapterLabwareDefinition: LabwareDefinition | SkipJsonSchema[None] = Field(
        None,
        description="The definition of the adapter under the primary labware, if any.",
    )
    storedLabware: list[StackerStoredLabwareGroup] = Field(
        ..., description="The primary labware loaded into the stacker labware pool."
    )
    count: int = Field(
        ..., description="The number of labware now stored in the hopper."
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


class SetStoredLabwareImpl(
    AbstractCommandImpl[SetStoredLabwareParams, SuccessData[SetStoredLabwareResult]]
):
    """Implementation of a setstoredlabware command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._model_utils = model_utils

    async def execute(
        self, params: SetStoredLabwareParams
    ) -> SuccessData[SetStoredLabwareResult]:
        """Execute the setstoredlabwarecommand."""
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )
        location = self._state_view.modules.get_location(params.moduleId)

        if len(stacker_state.contained_labware_bottom_first) != 0:
            # Note: this error catches if the protocol tells us the stacker is not empty, making this command
            # invalid at this point in the protocol. This error is not recoverable and should occur during
            # analysis; the protocol must be changed.

            raise FlexStackerNotLogicallyEmptyError(
                message=(
                    f"The Flex Stacker in {location} must be known to be empty before reconfiguring its labware pool, but it has "
                    f"{len(stacker_state.contained_labware_bottom_first)} labware"
                )
            )

        labware_def, _ = await self._equipment.load_definition_for_details(
            load_name=params.primaryLabware.loadName,
            namespace=params.primaryLabware.namespace,
            version=params.primaryLabware.version,
        )
        lid_def: LabwareDefinition | None = None
        if params.lidLabware:
            lid_def, _ = await self._equipment.load_definition_for_details(
                load_name=params.lidLabware.loadName,
                namespace=params.lidLabware.namespace,
                version=params.lidLabware.version,
            )
        adapter_def: LabwareDefinition | None = None
        if params.adapterLabware:
            adapter_def, _ = await self._equipment.load_definition_for_details(
                load_name=params.adapterLabware.loadName,
                namespace=params.adapterLabware.namespace,
                version=params.adapterLabware.version,
            )

        pool_definitions = (
            self._state_view.labware.stacker_labware_pool_to_ordered_list(
                labware_def, lid_def, adapter_def
            )
        )

        pool_height = self._state_view.geometry.get_height_of_labware_stack(
            pool_definitions
        )

        pool_overlap = (
            params.poolOverlapOverride
            if params.poolOverlapOverride
            else self._state_view.labware.get_stacker_labware_overlap_offset(
                pool_definitions
            ).z
        )

        max_pool_count = self._state_view.modules.stacker_max_pool_count_by_height(
            params.moduleId,
            pool_height,
            pool_overlap,
        )
        groups_to_load = build_ids_to_fill(
            params.adapterLabware is not None,
            params.lidLabware is not None,
            params.initialStoredLabware,
            params.initialCount,
            max_pool_count,
            0,
            self._model_utils,
        )
        state_update, new_contained_labware = await build_or_assign_labware_to_hopper(
            labware_def,
            adapter_def,
            lid_def,
            params.moduleId,
            groups_to_load,
            [],
            self._equipment,
            self._state_view,
        )

        state_update = state_update.update_flex_stacker_labware_pool_definition(
            params.moduleId,
            max_pool_count,
            pool_overlap,
            pool_height,
            labware_def,
            adapter_def,
            lid_def,
        )
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
            for group in new_contained_labware
        ]
        new_location_sequences = [
            labware_locations_for_group(
                group, [InStackerHopperLocation(moduleId=params.moduleId)]
            )
            for group in new_contained_labware
        ]
        return SuccessData(
            public=SetStoredLabwareResult.model_construct(
                primaryLabwareDefinition=labware_def,
                lidLabwareDefinition=lid_def,
                adapterLabwareDefinition=adapter_def,
                count=len(new_contained_labware),
                storedLabware=new_contained_labware,
                originalPrimaryLabwareLocationSequences=primary_location_sequences(
                    original_location_sequences
                ),
                originalAdapterLabwareLocationSequences=adapter_location_sequences_with_default(
                    original_location_sequences, adapter_def
                ),
                originalLidLabwareLocationSequences=lid_location_sequences_with_default(
                    original_location_sequences, lid_def
                ),
                newPrimaryLabwareLocationSequences=primary_location_sequences(
                    new_location_sequences
                ),
                newAdapterLabwareLocationSequences=adapter_location_sequences_with_default(
                    new_location_sequences, adapter_def
                ),
                newLidLabwareLocationSequences=lid_location_sequences_with_default(
                    new_location_sequences, lid_def
                ),
            ),
            state_update=state_update,
        )


class SetStoredLabware(
    BaseCommand[SetStoredLabwareParams, SetStoredLabwareResult, ErrorOccurrence]
):
    """A command to setstoredlabware the Flex Stacker."""

    commandType: SetStoredLabwareCommandType = "flexStacker/setStoredLabware"
    params: SetStoredLabwareParams
    result: Optional[SetStoredLabwareResult] = None

    _ImplementationCls: Type[SetStoredLabwareImpl] = SetStoredLabwareImpl


class SetStoredLabwareCreate(BaseCommandCreate[SetStoredLabwareParams]):
    """A request to execute a Flex Stacker SetStoredLabware command."""

    commandType: SetStoredLabwareCommandType = "flexStacker/setStoredLabware"
    params: SetStoredLabwareParams

    _CommandCls: Type[SetStoredLabware] = SetStoredLabware
