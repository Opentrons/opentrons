"""Command models to retrieve a labware from a Flex Stacker."""

from __future__ import annotations
from typing import Optional, Literal, TYPE_CHECKING, Type, Union, cast

from pydantic import BaseModel, Field
from pydantic.json_schema import SkipJsonSchema

from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.errors.exceptions import (
    FlexStackerStallError,
    FlexStackerShuttleMissingError,
)

from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
    DefinedErrorData,
)
from ..flex_stacker.common import (
    FlexStackerStallOrCollisionError,
    FlexStackerShuttleError,
    labware_locations_for_group,
    labware_location_base_sequence,
    primary_location_sequence,
    adapter_location_sequence,
    lid_location_sequence,
)
from ...errors import (
    ErrorOccurrence,
    CannotPerformModuleAction,
    LabwareNotLoadedOnModuleError,
    FlexStackerLabwarePoolNotYetDefinedError,
)
from ...resources import ModelUtils
from ...state import update_types
from ...types import (
    LabwareLocationSequence,
    InStackerHopperLocation,
    StackerStoredLabwareGroup,
    ModuleLocation,
)

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.state.module_substates import FlexStackerSubState
    from opentrons.protocol_engine.execution import EquipmentHandler


StoreCommandType = Literal["flexStacker/store"]


class StoreParams(BaseModel):
    """Input parameters for a labware storage command."""

    moduleId: str = Field(
        ...,
        description="Unique ID of the flex stacker.",
    )


class StoreResult(BaseModel):
    """Result data from a labware storage command."""

    eventualDestinationLocationSequence: (
        LabwareLocationSequence | SkipJsonSchema[None]
    ) = Field(
        None,
        description=(
            "The full location in which all labware moved by this command will eventually reside."
        ),
    )
    primaryOriginLocationSequence: LabwareLocationSequence | SkipJsonSchema[
        None
    ] = Field(None, description=("The origin location of the primary labware."))
    primaryLabwareId: str | SkipJsonSchema[None] = Field(
        None, description="The primary labware in the stack that was stored."
    )
    adapterOriginLocationSequence: LabwareLocationSequence | SkipJsonSchema[
        None
    ] = Field(None, description=("The origin location of the adapter labware, if any."))
    adapterLabwareId: str | SkipJsonSchema[None] = Field(
        None, description="The adapter in the stack that was stored, if any."
    )
    lidOriginLocationSequence: LabwareLocationSequence | SkipJsonSchema[None] = Field(
        None, description=("The origin location of the lid labware, if any.")
    )
    lidLabwareId: str | SkipJsonSchema[None] = Field(
        None, description="The lid in the stack that was stored, if any."
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
    SuccessData[StoreResult],
    DefinedErrorData[FlexStackerStallOrCollisionError]
    | DefinedErrorData[FlexStackerShuttleError],
]


class StoreImpl(AbstractCommandImpl[StoreParams, _ExecuteReturn]):
    """Implementation of a labware storage command."""

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

    def _verify_labware_to_store(
        self, params: StoreParams, stacker_state: FlexStackerSubState
    ) -> tuple[str, str | None, str | None]:
        location = self._state_view.modules.get_location(params.moduleId)
        try:
            bottom_id = self._state_view.labware.get_id_by_module(params.moduleId)
        except LabwareNotLoadedOnModuleError:
            raise CannotPerformModuleAction(
                f"Flex Stacker in {location} cannot store labware because its carriage is empty"
            )
        labware_ids = self._state_view.labware.get_labware_stack_from_parent(bottom_id)
        labware_defs = [
            self._state_view.labware.get_definition(id) for id in labware_ids
        ]

        lid_id: str | None = None

        pool_list = stacker_state.get_pool_definition_ordered_list()
        assert pool_list is not None
        if len(labware_ids) != len(pool_list):
            raise CannotPerformModuleAction(
                f"Cannot store labware stack that does not correspond with the configuration of Flex Stacker in {location}"
            )
        if stacker_state.pool_lid_definition is not None:
            if labware_defs[-1] != stacker_state.pool_lid_definition:
                raise CannotPerformModuleAction(
                    f"Cannot store labware stack that does not correspond with the configuration of Flex Stacker in {location}"
                )
            lid_id = labware_ids[-1]

        if stacker_state.pool_adapter_definition is not None:
            if (
                labware_defs[0] != stacker_state.pool_adapter_definition
                or labware_defs[1] != stacker_state.pool_primary_definition
            ):
                raise CannotPerformModuleAction(
                    f"Cannot store labware stack that does not correspond with the configuration of Flex Stacker in {location}"
                )
            else:
                return labware_ids[1], labware_ids[0], lid_id
        else:
            if labware_defs[0] != stacker_state.pool_primary_definition:
                raise CannotPerformModuleAction(
                    f"Cannot store labware stack that does not correspond with the configuration of Flex Stacker in {location}"
                )
            return labware_ids[0], None, lid_id

    async def execute(self, params: StoreParams) -> _ExecuteReturn:
        """Execute the labware storage command."""
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )

        location = self._state_view.modules.get_location(params.moduleId)
        pool_definitions = stacker_state.get_pool_definition_ordered_list()
        if pool_definitions is None:
            raise FlexStackerLabwarePoolNotYetDefinedError(
                message=f"The Flex Stacker in {location} has not been configured yet and cannot be filled."
            )

        if (
            len(stacker_state.contained_labware_bottom_first)
            == stacker_state.max_pool_count
        ):
            raise CannotPerformModuleAction(
                f"Cannot store labware in Flex Stacker in {location} because it is full"
            )

        primary_id, maybe_adapter_id, maybe_lid_id = self._verify_labware_to_store(
            params, stacker_state
        )

        # Allow propagation of ModuleNotAttachedError.
        stacker_hw = self._equipment.get_module_hardware_api(stacker_state.module_id)

        state_update = update_types.StateUpdate()
        try:
            if stacker_hw is not None:
                stacker_hw.set_stacker_identify(True)
                await stacker_hw.store_labware(
                    labware_height=stacker_state.get_pool_height_minus_overlap()
                )
        except FlexStackerStallError as e:
            return DefinedErrorData(
                public=FlexStackerStallOrCollisionError(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    wrappedErrors=[
                        ErrorOccurrence.from_failed(
                            id=self._model_utils.generate_id(),
                            createdAt=self._model_utils.get_timestamp(),
                            error=e,
                        )
                    ],
                    errorInfo={"labwareId": primary_id},
                ),
            )
        except FlexStackerShuttleMissingError as e:
            return DefinedErrorData(
                public=FlexStackerShuttleError(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    wrappedErrors=[
                        ErrorOccurrence.from_failed(
                            id=self._model_utils.generate_id(),
                            createdAt=self._model_utils.get_timestamp(),
                            error=e,
                        )
                    ],
                    errorInfo={"labwareId": primary_id},
                ),
            )

        id_list = [
            id for id in (primary_id, maybe_adapter_id, maybe_lid_id) if id is not None
        ]

        group = StackerStoredLabwareGroup(
            primaryLabwareId=primary_id,
            adapterLabwareId=maybe_adapter_id,
            lidLabwareId=maybe_lid_id,
        )

        state_update.set_batch_labware_location(
            new_locations_by_id={
                id: InStackerHopperLocation(moduleId=params.moduleId) for id in id_list
            },
            new_offset_ids_by_id={id: None for id in id_list},
        )

        state_update.update_flex_stacker_contained_labware(
            module_id=params.moduleId,
            contained_labware_bottom_first=(
                [group] + stacker_state.contained_labware_bottom_first
            ),
        )

        original_location_sequences = labware_locations_for_group(
            group,
            labware_location_base_sequence(
                group,
                self._state_view,
                self._state_view.geometry.get_predicted_location_sequence(
                    ModuleLocation(moduleId=params.moduleId)
                ),
            ),
        )

        if stacker_hw is not None:
            stacker_hw.set_stacker_identify(False)

        return SuccessData(
            public=StoreResult.model_construct(
                eventualDestinationLocationSequence=[
                    InStackerHopperLocation(moduleId=params.moduleId)
                ],
                primaryOriginLocationSequence=primary_location_sequence(
                    original_location_sequences
                ),
                primaryLabwareId=primary_id,
                adapterOriginLocationSequence=adapter_location_sequence(
                    original_location_sequences
                ),
                adapterLabwareId=maybe_adapter_id,
                lidOriginLocationSequence=lid_location_sequence(
                    original_location_sequences
                ),
                lidLabwareId=maybe_lid_id,
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
            state_update=state_update,
        )


class Store(BaseCommand[StoreParams, StoreResult, ErrorOccurrence]):
    """A command to store a labware in a Flex Stacker."""

    commandType: StoreCommandType = "flexStacker/store"
    params: StoreParams
    result: Optional[StoreResult] = None

    _ImplementationCls: Type[StoreImpl] = StoreImpl


class StoreCreate(BaseCommandCreate[StoreParams]):
    """A request to execute a Flex Stacker store command."""

    commandType: StoreCommandType = "flexStacker/store"
    params: StoreParams

    _CommandCls: Type[Store] = Store
