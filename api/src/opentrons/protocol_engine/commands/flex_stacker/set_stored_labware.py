"""Command models to configure the stored labware pool of a Flex Stacker.."""

from __future__ import annotations
from textwrap import dedent
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
from ...state import update_types
from ...types import StackerStoredLabwareGroup

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler

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
        description=(
            "The number of labware that should be initially stored in the stacker. This number will be silently clamped to "
            "the maximum number of labware that will fit; do not rely on the parameter to know how many labware are in the stacker."
        ),
    )
    initialStoredLabware: list[StackerStoredLabwareGroup] | None = Field(
        None,
        description=dedent(
            """\
        A list of IDs that should be initially stored in the stacker.

        This is a complex field. The following must be true for the field to be valid:
        - If this field is specified, then either initialCount must not be specified, or this field must have exactly initalCount elements
        - Each element must contain an id for each corresponding labware details field (i.e. if lidLabware is specified, each element must have
          a lidLabwareId) and must not contain an id for a corresponding labware details field that is not specified (i.e., if adapterLabware
          is not specified, each element must not have an adapterLabwareId).

        The behavior of the command depends on the values of both this field and initialCount.
        - If this field is not specified and initialCount is not specified, the command will create 0 labware objects and the stacker will be empty.
        - If this field is not specified and initialCount is specified to be 0, the command will create 0 labware objects and the stacker will be empty.
        - If this field is not specified and initialCount is specified to be non-0, the command will create initialCount labware objects of
          each specified labware type (primary, lid, and adapter), with appropriate positions, and arbitrary IDs, loaded into the stacker
        - If this field is specified (and therefore initialCount is not specified or is specified to be the length of this field) then the
          command will create labware objects with the IDs specified in this field and appropriate positions, loaded into the stacker.
        """
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


class SetStoredLabwareImpl(
    AbstractCommandImpl[SetStoredLabwareParams, SuccessData[SetStoredLabwareResult]]
):
    """Implementation of a setstoredlabware command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment

    async def execute(
        self, params: SetStoredLabwareParams
    ) -> SuccessData[SetStoredLabwareResult]:
        """Execute the setstoredlabwarecommand."""
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )

        if stacker_state.pool_count != 0:
            # Note: this error catches if the protocol tells us the stacker is not empty, making this command
            # invalid at this point in the protocol. This error is not recoverable and should occur during
            # analysis; the protocol must be changed.

            raise FlexStackerNotLogicallyEmptyError(
                message=(
                    "The Flex Stacker must be known to be empty before reconfiguring its labware pool, but it has "
                    f"a pool of {stacker_state.pool_count} labware"
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

        self._state_view.labware.raise_if_stacker_labware_pool_is_not_valid(
            labware_def, lid_def, adapter_def
        )

        pool_height = self._state_view.geometry.get_height_of_labware_stack(
            [x for x in [lid_def, labware_def, adapter_def] if x is not None]
        )
        pool_definitions = [
            x for x in [lid_def, labware_def, adapter_def] if x is not None
        ]

        overlap = self._state_view._labware.get_labware_overlap_offsets(
            pool_definitions[-1], pool_definitions[0].parameters.loadName
        )

        max_pool_count = self._state_view.modules.stacker_max_pool_count_by_height(
            params.moduleId,
            pool_height,
            overlap.z,
        )
        initial_count = (
            params.initialCount if params.initialCount is not None else max_pool_count
        )
        count = min(initial_count, max_pool_count)

        state_update = (
            update_types.StateUpdate()
            .update_flex_stacker_labware_pool_definition(
                params.moduleId,
                max_pool_count,
                overlap.z,
                labware_def,
                adapter_def,
                lid_def,
            )
            .update_flex_stacker_labware_pool_count(params.moduleId, count)
        )
        return SuccessData(
            public=SetStoredLabwareResult.model_construct(
                primaryLabwareDefinition=labware_def,
                lidLabwareDefinition=lid_def,
                adapterLabwareDefinition=adapter_def,
                count=count,
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
