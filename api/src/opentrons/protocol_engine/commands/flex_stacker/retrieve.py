"""Command models to retrieve a labware from a Flex Stacker."""

from __future__ import annotations
from typing import Literal, TYPE_CHECKING, Any, Union
from typing_extensions import Type

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema

from opentrons_shared_data.errors.exceptions import (
    FlexStackerStallError,
    FlexStackerShuttleMissingError,
    FlexStackerHopperLabwareError,
    FlexStackerShuttleLabwareError,
    FlexStackerShuttleNotEmptyError,
)

from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
    DefinedErrorData,
)
from ...errors import (
    ErrorOccurrence,
    CannotPerformModuleAction,
    LocationIsOccupiedError,
    FlexStackerLabwarePoolNotYetDefinedError,
)
from ...resources import ModelUtils
from ...state import update_types
from ...types import (
    ModuleLocation,
    LabwareLocationSequence,
    InStackerHopperLocation,
)
from .common import (
    labware_locations_for_group,
    build_retrieve_labware_move_updates,
    FlexStackerStallOrCollisionError,
    FlexStackerShuttleError,
    FlexStackerHopperError,
    FlexStackerLabwareRetrieveError,
    FlexStackerShuttleOccupiedError,
    primary_location_sequence,
    adapter_location_sequence,
    lid_location_sequence,
)

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler

RetrieveCommandType = Literal["flexStacker/retrieve"]

RecoverableExceptions = Union[
    FlexStackerStallError,
    FlexStackerShuttleMissingError,
    FlexStackerHopperLabwareError,
    FlexStackerShuttleLabwareError,
    FlexStackerShuttleNotEmptyError,
]


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default", None)


class RetrieveParams(BaseModel):
    """Input parameters for a labware retrieval command."""

    moduleId: str = Field(
        ...,
        description="Unique ID of the Flex Stacker.",
    )
    labwareId: str | SkipJsonSchema[None] = Field(
        None,
        description="Do not use. Present for internal backward compatibility.",
        json_schema_extra=_remove_default,
    )
    displayName: str | SkipJsonSchema[None] = Field(
        None,
        description="Do not use. Present for internal backward compatibility.",
        json_schema_extra=_remove_default,
    )
    adapterId: str | SkipJsonSchema[None] = Field(
        None,
        description="Do not use. Present for internal backward compatibility.",
        json_schema_extra=_remove_default,
    )
    lidId: str | SkipJsonSchema[None] = Field(
        None,
        description="Do not use. Present for internal backward compatibility.",
        json_schema_extra=_remove_default,
    )


class RetrieveResult(BaseModel):
    """Result data from a labware retrieval command."""

    labwareId: str = Field(
        ...,
        description="The labware ID of the primary retrieved labware.",
    )
    adapterId: str | SkipJsonSchema[None] = Field(
        None,
        description="The optional Adapter Labware ID of the adapter under a primary labware.",
    )
    lidId: str | SkipJsonSchema[None] = Field(
        None,
        description="The optional Lid Labware ID of the lid on a primary labware.",
    )
    primaryLocationSequence: LabwareLocationSequence = Field(
        ..., description="The new location of the just-retrieved."
    )
    lidLocationSequence: LabwareLocationSequence | SkipJsonSchema[None] = Field(
        None,
        description="The new location of the just-retrieved adapter labware under a primary labware.",
    )
    adapterLocationSequence: LabwareLocationSequence | SkipJsonSchema[None] = Field(
        None,
        description="The new location of the just-retrieved lid labware on a primary labware.",
    )
    originalPrimaryLocationSequence: LabwareLocationSequence = Field(
        ..., description="The original location of the just-retrieved primary labware"
    )
    originalAdapterLocationSequence: LabwareLocationSequence | SkipJsonSchema[
        None
    ] = Field(None, description="The original location of an adapter labware if any")
    originalLidLocationSequence: LabwareLocationSequence | SkipJsonSchema[None] = Field(
        None, description="The original location of a lid labware if any"
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


_ExecuteReturn = Union[
    SuccessData[RetrieveResult],
    DefinedErrorData[FlexStackerStallOrCollisionError]
    | DefinedErrorData[FlexStackerShuttleError]
    | DefinedErrorData[FlexStackerHopperError]
    | DefinedErrorData[FlexStackerLabwareRetrieveError]
    | DefinedErrorData[FlexStackerShuttleOccupiedError],
]


class RetrieveImpl(AbstractCommandImpl[RetrieveParams, _ExecuteReturn]):
    """Implementation of a labware retrieval command."""

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

    def handle_recoverable_error(
        self,
        error: RecoverableExceptions,
        intended_id: str,
        state_update: update_types.StateUpdate,
    ) -> (
        DefinedErrorData[FlexStackerStallOrCollisionError]
        | DefinedErrorData[FlexStackerShuttleError]
        | DefinedErrorData[FlexStackerHopperError]
        | DefinedErrorData[FlexStackerLabwareRetrieveError]
        | DefinedErrorData[FlexStackerShuttleOccupiedError]
    ):
        """Handle a recoverable error raised during command execution."""
        error_map = {
            FlexStackerStallError: FlexStackerStallOrCollisionError,
            FlexStackerShuttleMissingError: FlexStackerShuttleError,
            FlexStackerHopperLabwareError: FlexStackerHopperError,
            FlexStackerShuttleLabwareError: FlexStackerLabwareRetrieveError,
            FlexStackerShuttleNotEmptyError: FlexStackerShuttleOccupiedError,
        }
        return DefinedErrorData(
            public=error_map[type(error)](
                id=self._model_utils.generate_id(),
                createdAt=self._model_utils.get_timestamp(),
                wrappedErrors=[
                    ErrorOccurrence.from_failed(
                        id=self._model_utils.generate_id(),
                        createdAt=self._model_utils.get_timestamp(),
                        error=error,
                    )
                ],
                errorInfo={"labwareId": intended_id},
            ),
            state_update_if_false_positive=state_update,
        )

    async def execute(self, params: RetrieveParams) -> _ExecuteReturn:
        """Execute the labware retrieval command."""
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )
        location = self._state_view.modules.get_location(params.moduleId)

        if stacker_state.pool_primary_definition is None:
            raise FlexStackerLabwarePoolNotYetDefinedError(
                f"The Flex Stacker in {location} must be configured before labware can be retrieved."
            )

        if len(stacker_state.contained_labware_bottom_first) == 0:
            raise CannotPerformModuleAction(
                message=f"Cannot retrieve labware from Flex Stacker in {location} because it contains no labware"
            )

        stacker_loc = ModuleLocation(moduleId=params.moduleId)

        try:
            self._state_view.labware.raise_if_labware_in_location(stacker_loc)
        except LocationIsOccupiedError:
            raise CannotPerformModuleAction(
                f"Cannot retrieve a labware from Flex Stacker in {location} if the carriage is occupied"
            )

        to_retrieve = stacker_state.contained_labware_bottom_first[0]
        remaining = stacker_state.contained_labware_bottom_first[1:]

        locations, offsets = build_retrieve_labware_move_updates(
            to_retrieve, stacker_state, self._state_view
        )

        # Update the state to reflect the labware is now in the Flex Stacker slot
        # todo(chb, 2025-02-19): This ModuleLocation piece should probably instead be an AddressableAreaLocation
        # but that has implications for where labware are set by things like module.load_labware(..) and what
        # happens when we move labware.
        stacker_area = (
            self._state_view.modules.ensure_and_convert_module_fixture_location(
                deck_slot=self._state_view.modules.get_location(
                    params.moduleId
                ).slotName,
                model=self._state_view.modules.get(params.moduleId).model,
            )
        )
        original_locations = labware_locations_for_group(
            to_retrieve, [InStackerHopperLocation(moduleId=params.moduleId)]
        )
        new_locations = labware_locations_for_group(
            to_retrieve,
            self._state_view.geometry.get_predicted_location_sequence(
                ModuleLocation(moduleId=params.moduleId)
            ),
        )

        state_update = (
            update_types.StateUpdate()
            .set_batch_labware_location(
                new_locations_by_id=locations, new_offset_ids_by_id=offsets
            )
            .update_flex_stacker_contained_labware(params.moduleId, remaining)
            .set_addressable_area_used(stacker_area)
        )

        # Allow propagation of ModuleNotAttachedError.
        stacker_hw = self._equipment.get_module_hardware_api(stacker_state.module_id)
        if stacker_hw is not None:
            try:
                stacker_hw.set_stacker_identify(True)
                await stacker_hw.dispense_labware(
                    labware_height=stacker_state.get_pool_height_minus_overlap()
                )
            except (
                FlexStackerStallError,
                FlexStackerShuttleMissingError,
                FlexStackerHopperLabwareError,
                FlexStackerShuttleLabwareError,
                FlexStackerShuttleNotEmptyError,
            ) as e:
                return self.handle_recoverable_error(
                    e, to_retrieve.primaryLabwareId, state_update
                )

        if stacker_hw is not None:
            stacker_hw.set_stacker_identify(False)

        return SuccessData(
            public=RetrieveResult.model_construct(
                labwareId=to_retrieve.primaryLabwareId,
                adapterId=to_retrieve.adapterLabwareId,
                lidId=to_retrieve.lidLabwareId,
                primaryLocationSequence=primary_location_sequence(new_locations),
                adapterLocationSequence=adapter_location_sequence(new_locations),
                lidLocationSequence=lid_location_sequence(new_locations),
                originalPrimaryLocationSequence=primary_location_sequence(
                    original_locations
                ),
                originalAdapterLocationSequence=adapter_location_sequence(
                    original_locations
                ),
                originalLidLocationSequence=lid_location_sequence(original_locations),
                primaryLabwareURI=self._state_view.labware.get_uri_from_definition(
                    stacker_state.pool_primary_definition
                ),
                adapterLabwareURI=self._state_view.labware.get_uri_from_definition_unless_none(
                    stacker_state.pool_adapter_definition
                ),
                lidLabwareURI=self._state_view.labware.get_uri_from_definition_unless_none(
                    stacker_state.pool_lid_definition
                ),
            ),
            state_update=state_update,
        )


class Retrieve(BaseCommand[RetrieveParams, RetrieveResult, ErrorOccurrence]):
    """A command to retrieve a labware from a Flex Stacker."""

    commandType: RetrieveCommandType = "flexStacker/retrieve"
    params: RetrieveParams
    result: RetrieveResult | None = None

    _ImplementationCls: Type[RetrieveImpl] = RetrieveImpl


class RetrieveCreate(BaseCommandCreate[RetrieveParams]):
    """A request to execute a Flex Stacker retrieve command."""

    commandType: RetrieveCommandType = "flexStacker/retrieve"
    params: RetrieveParams

    _CommandCls: Type[Retrieve] = Retrieve
