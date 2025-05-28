"""Command models to manually retrieve a labware from a Flex Stacker in an unsafe situation."""

from __future__ import annotations
from typing import Literal, TYPE_CHECKING, Any, Union, cast
from typing_extensions import Type

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema

from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
    DefinedErrorData,
)
from ..flex_stacker.common import (
    FlexStackerStallOrCollisionError,
    labware_locations_for_group,
    build_retrieve_labware_move_updates,
    primary_location_sequence,
    adapter_location_sequence,
    lid_location_sequence,
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
from opentrons.hardware_control.modules.types import PlatformState
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler

UnsafeFlexStackerManualRetrieveCommandType = Literal[
    "unsafe/flexStacker/manualRetrieve"
]


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default", None)


class UnsafeFlexStackerManualRetrieveParams(BaseModel):
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


class UnsafeFlexStackerManualRetrieveResult(BaseModel):
    """Result data from a labware retrieval command."""

    labwareId: str = Field(
        ...,
        description="The labware ID of the primary retrieved labware.",
    )
    adapterId: str | None = Field(
        None,
        description="The optional Adapter Labware ID of the adapter under a primary labware.",
    )
    lidId: str | None = Field(
        None,
        description="The optional Lid Labware ID of the lid on a primary labware.",
    )
    primaryLocationSequence: LabwareLocationSequence = Field(
        ..., description="The origin location of the primary labware."
    )
    lidLocationSequence: LabwareLocationSequence | None = Field(
        None,
        description="The origin location of the adapter labware under a primary labware.",
    )
    adapterLocationSequence: LabwareLocationSequence | None = Field(
        None, description="The origin location of the lid labware on a primary labware."
    )
    originalPrimaryLocationSequence: LabwareLocationSequence = Field(
        ..., description="The original location of the just-retrieved primary labware"
    )
    originalAdapterLocationSequence: LabwareLocationSequence | None = Field(
        None, description="The original location of an adapter labware if any"
    )
    originalLidLocationSequence: LabwareLocationSequence | None = Field(
        None, description="The original location of a lid labware if any"
    )
    primaryLabwareURI: str = Field(
        ...,
        description="The labware definition URI of the primary labware.",
    )
    adapterLabwareURI: str | None = Field(
        None,
        description="The labware definition URI of the adapter labware.",
    )
    lidLabwareURI: str | None = Field(
        None,
        description="The labware definition URI of the lid labware.",
    )


_ExecuteReturn = Union[
    SuccessData[UnsafeFlexStackerManualRetrieveResult],
    DefinedErrorData[FlexStackerStallOrCollisionError],
]


class UnsafeFlexStackerManualRetrieveImpl(
    AbstractCommandImpl[UnsafeFlexStackerManualRetrieveParams, _ExecuteReturn]
):
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

    async def execute(
        self, params: UnsafeFlexStackerManualRetrieveParams
    ) -> _ExecuteReturn:
        """Execute the labware retrieval command."""
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )

        pool_definitions = stacker_state.get_pool_definition_ordered_list()
        location = self._state_view.modules.get_location(params.moduleId)
        if pool_definitions is None:
            raise FlexStackerLabwarePoolNotYetDefinedError(
                message=f"The Flex Stacker in {location} has not been configured yet and cannot be filled."
            )

        if len(stacker_state.contained_labware_bottom_first) == 0:
            raise CannotPerformModuleAction(
                message=f"Cannot retrieve labware from Flex Stacker in {location} because it contains no labware"
            )

        stacker_loc = ModuleLocation(moduleId=params.moduleId)
        # Allow propagation of ModuleNotAttachedError.
        stacker_hw = self._equipment.get_module_hardware_api(stacker_state.module_id)

        # Validate that the stacker is fully in the gripper position
        if stacker_hw:
            stacker_hw.set_stacker_identify(True)
            if stacker_hw.platform_state != PlatformState.EXTENDED:
                raise CannotPerformModuleAction(
                    f"Cannot manually retrieve a labware from Flex Stacker in {location} if the carriage is not in gripper position."
                )

        try:
            # In theory given this is an unsafe manual retrieve this should never raise
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
            to_retrieve,
            self._state_view.geometry.get_predicted_location_sequence(
                InStackerHopperLocation(moduleId=params.moduleId)
            ),
        )
        new_locations = labware_locations_for_group(
            to_retrieve,
            self._state_view.geometry.get_predicted_location_sequence(
                ModuleLocation(moduleId=params.moduleId)
            ),
        )

        if stacker_hw is not None:
            stacker_hw.set_stacker_identify(False)

        return SuccessData(
            public=UnsafeFlexStackerManualRetrieveResult(
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
                primaryLabwareURI=self._state_view.labware.get_uri_from_definition_unless_none(
                    cast(LabwareDefinition, stacker_state.pool_primary_definition)
                ),
                adapterLabwareURI=self._state_view.labware.get_uri_from_definition_unless_none(
                    stacker_state.pool_adapter_definition
                ),
                lidLabwareURI=self._state_view.labware.get_uri_from_definition_unless_none(
                    stacker_state.pool_lid_definition
                ),
            ),
            state_update=(
                update_types.StateUpdate()
                .set_batch_labware_location(
                    new_locations_by_id=locations, new_offset_ids_by_id=offsets
                )
                .update_flex_stacker_contained_labware(params.moduleId, remaining)
                .set_addressable_area_used(stacker_area)
            ),
        )


class UnsafeFlexStackerManualRetrieve(
    BaseCommand[
        UnsafeFlexStackerManualRetrieveParams,
        UnsafeFlexStackerManualRetrieveResult,
        ErrorOccurrence,
    ]
):
    """A command to manually retrieve a labware from a Flex Stacker."""

    commandType: UnsafeFlexStackerManualRetrieveCommandType = (
        "unsafe/flexStacker/manualRetrieve"
    )
    params: UnsafeFlexStackerManualRetrieveParams
    result: UnsafeFlexStackerManualRetrieveResult | None = None

    _ImplementationCls: Type[
        UnsafeFlexStackerManualRetrieveImpl
    ] = UnsafeFlexStackerManualRetrieveImpl


class UnsafeFlexStackerManualRetrieveCreate(
    BaseCommandCreate[UnsafeFlexStackerManualRetrieveParams]
):
    """A request to execute a Flex Stacker manual retrieve command."""

    commandType: UnsafeFlexStackerManualRetrieveCommandType = (
        "unsafe/flexStacker/manualRetrieve"
    )
    params: UnsafeFlexStackerManualRetrieveParams

    _CommandCls: Type[UnsafeFlexStackerManualRetrieve] = UnsafeFlexStackerManualRetrieve
