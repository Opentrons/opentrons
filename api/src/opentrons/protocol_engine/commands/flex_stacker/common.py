"""Common flex stacker base models."""

from __future__ import annotations
from dataclasses import dataclass
from typing import Literal, TYPE_CHECKING, Sequence, Iterator
from typing_extensions import TypedDict
from textwrap import dedent

from opentrons_shared_data.errors import ErrorCodes
from opentrons_shared_data.errors.exceptions import CommandPreconditionViolated
from opentrons_shared_data.labware.labware_definition import LabwareDefinition


from ...errors import ErrorOccurrence
from ...types import (
    StackerStoredLabwareGroup,
    InStackerHopperLocation,
    LoadedLabware,
    OFF_DECK_LOCATION,
    OnLabwareLocation,
    OnLabwareLocationSequenceComponent,
    LabwareLocationSequence,
    LabwareLocation,
    LabwareOffsetLocationSequence,
    OnLabwareOffsetLocationSequenceComponent,
    ModuleLocation,
)
from ...state.update_types import StateUpdate


if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.resources import ModelUtils
    from opentrons.protocol_engine.execution.equipment import LoadedLabwarePoolData
    from opentrons.protocol_engine.state.module_substates import FlexStackerSubState

INITIAL_COUNT_DESCRIPTION = dedent(
    """\
        The number of labware that should be initially stored in the stacker. This number will be silently clamped to
        the maximum number of labware that will fit; do not rely on the parameter to know how many labware are in the stacker.

        This field works with the initialStoredLabware field in a complex way.

        The following must be true for initialCount to be valid:
          - It is not specified, and initialStoredLabware is not specified, in which case the stacker will start empty
          - It is not specified, and initialStoredLabware is specified, in which case the contents of the stacker are entirely
            determined by initialStoredLabware.
          - It is specified, and initialStoredLabware is specified, in which case the length of initialStoredLabware must be
            exactly initialCount, and the contents of the stacker will be determined by initialStoredLabware.
        """
)

INITIAL_STORED_LABWARE_DESCRIPTION = dedent(
    """\
        A list of IDs that should be initially stored in the stacker.

        If specified, the first element of the list is the labware on the physical bottom that will be the first labware retrieved.

        This is a complex field. The following must be true for the field to be valid:
        - If this field is specified, then either initialCount must not be specified, or this field must have exactly initalCount elements
        - Each element must contain an id for each corresponding labware details field (i.e. if lidLabware is specified, each element must have
          a lidLabwareId) and must not contain an id for a corresponding labware details field that is not specified (i.e., if adapterLabware
          is not specified, each element must not have an adapterLabwareId).

        The behavior of the command depends on the values of both this field and initialCount.
        - If this field is not specified and initialCount is not specified, the command will create the maximum number of labware objects
          the stacker can hold according to the labware pool specifications.
        - If this field is not specified and initialCount is specified to be 0, the command will create 0 labware objects and the stacker will be empty.
        - If this field is not specified and initialCount is specified to be non-0, the command will create initialCount labware objects of
          each specified labware type (primary, lid, and adapter), with appropriate positions, and arbitrary IDs, loaded into the stacker
        - If this field is specified (and therefore initialCount is not specified or is specified to be the length of this field) then the
          command will create labware objects with the IDs specified in this field and appropriate positions, loaded into the stacker.

        Behavior is also different depending on whether the labware identified by ID in this field exist or not. Either all labware specified
        in this field must exist, or all must not exist.

        Further,
        - If the labware exist, they must be of the same type as identified in the primaryLabware field.
        - If the labware exist and the adapterLabware field is specified, each labware must be currently loaded on a labware of the same kind as
          specified in the adapterLabware field, and that labware must be loaded off-deck
        - If the labware exist and the adapterLabware field is not specified, each labware must be currently loaded off deck directly
        - If the labware exist and the lidLabware field is specified, each labware must currently have a loaded lid of the same kind as specified
          in the lidLabware field
        - If the labware exist and the lidLabware field is not specified, each labware must not currently have a lid
        - If the labware exist, they must have nothing loaded underneath them or above them other than what is mentioned above

        If all the above are true, when this command executes the labware will be immediately moved into InStackerHopper. If any of the above
        are not true, analysis will fail.
        """
)


class FailedLabware(TypedDict, total=False):
    """Holds the labware ID that would have been involved in a failed command."""

    labwareId: str


class FlexStackerStallOrCollisionError(ErrorOccurrence):
    """Returned when the motor driver detects a stall."""

    isDefined: bool = True
    errorType: Literal["flexStackerStallOrCollision"] = "flexStackerStallOrCollision"

    errorCode: str = ErrorCodes.STACKER_STALL_OR_COLLISION_DETECTED.value.code
    detail: str = ErrorCodes.STACKER_STALL_OR_COLLISION_DETECTED.value.detail

    errorInfo: FailedLabware


class FlexStackerShuttleError(ErrorOccurrence):
    """Returned when the Flex Stacker Shuttle is not in the correct location."""

    isDefined: bool = True
    errorType: Literal["flexStackerShuttleMissing"] = "flexStackerShuttleMissing"

    errorCode: str = ErrorCodes.STACKER_SHUTTLE_MISSING.value.code
    detail: str = ErrorCodes.STACKER_SHUTTLE_MISSING.value.detail

    errorInfo: FailedLabware


class FlexStackerHopperError(ErrorOccurrence):
    """Returned when the Flex Stacker hopper labware presence sensor raises an error."""

    isDefined: bool = True
    errorType: Literal[
        "flexStackerHopperLabwareFailed"
    ] = "flexStackerHopperLabwareFailed"

    errorCode: str = ErrorCodes.STACKER_HOPPER_LABWARE_FAILED.value.code
    detail: str = ErrorCodes.STACKER_HOPPER_LABWARE_FAILED.value.detail

    errorInfo: FailedLabware


class FlexStackerLabwareRetrieveError(ErrorOccurrence):
    """Returned when the labware was not able to get to the shuttle."""

    isDefined: bool = True
    errorType: Literal[
        "flexStackerLabwareRetrieveFailed"
    ] = "flexStackerLabwareRetrieveFailed"

    errorCode: str = ErrorCodes.STACKER_SHUTTLE_LABWARE_FAILED.value.code
    detail: str = ErrorCodes.STACKER_SHUTTLE_LABWARE_FAILED.value.detail
    errorInfo: FailedLabware


class FlexStackerShuttleOccupiedError(ErrorOccurrence):
    """Returned when the Flex Stacker Shuttle is occupied when it shouldn't be."""

    isDefined: bool = True
    errorType: Literal["flexStackerShuttleOccupied"] = "flexStackerShuttleOccupied"

    errorCode: str = ErrorCodes.STACKER_SHUTTLE_OCCUPIED.value.code
    detail: str = ErrorCodes.STACKER_SHUTTLE_OCCUPIED.value.detail
    errorInfo: FailedLabware


@dataclass
class _LabwareDefPair:
    definition: LabwareDefinition
    id: str


@dataclass
class _GroupWithDefs:
    primary: _LabwareDefPair
    adapter: _LabwareDefPair | None
    lid: _LabwareDefPair | None


@dataclass
class LabwareWithLocationSequence:
    """Holds a labware id and location."""

    labwareId: str
    locationSequence: LabwareLocationSequence


@dataclass
class GroupWithLocationSequences:
    """Holds labware id and location for group components."""

    primary: LabwareWithLocationSequence
    adapter: LabwareWithLocationSequence | None
    lid: LabwareWithLocationSequence | None


def _labware_location_seq_for_primary(
    group: StackerStoredLabwareGroup,
    base: LabwareLocationSequence,
) -> LabwareWithLocationSequence:
    if group.adapterLabwareId is not None:
        return LabwareWithLocationSequence(
            labwareId=group.primaryLabwareId,
            locationSequence=(
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId=group.adapterLabwareId, lidId=None
                    )
                ]
                + base
            ),
        )
    else:
        return LabwareWithLocationSequence(
            labwareId=group.primaryLabwareId,
            locationSequence=base,
        )


def _labware_location_seq_for_lid(
    group: StackerStoredLabwareGroup,
    base: LabwareLocationSequence,
) -> LabwareWithLocationSequence | None:
    if group.lidLabwareId is None:
        return None
    elif group.adapterLabwareId is None:
        return LabwareWithLocationSequence(
            labwareId=group.lidLabwareId,
            locationSequence=(
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId=group.primaryLabwareId, lidId=group.lidLabwareId
                    )
                ]
                + base
            ),
        )
    else:
        return LabwareWithLocationSequence(
            labwareId=group.lidLabwareId,
            locationSequence=(
                [
                    OnLabwareLocationSequenceComponent(
                        labwareId=group.primaryLabwareId, lidId=group.lidLabwareId
                    ),
                    OnLabwareLocationSequenceComponent(
                        labwareId=group.adapterLabwareId, lidId=None
                    ),
                ]
                + base
            ),
        )


def _labware_location_seq_for_adapter(
    group: StackerStoredLabwareGroup,
    base: LabwareLocationSequence,
) -> LabwareWithLocationSequence | None:
    if group.adapterLabwareId is None:
        return None
    return LabwareWithLocationSequence(
        labwareId=group.adapterLabwareId, locationSequence=base
    )


def labware_locations_for_group(
    group: StackerStoredLabwareGroup, base: LabwareLocationSequence
) -> GroupWithLocationSequences:
    """Get the labware and location sequences bound together."""
    return GroupWithLocationSequences(
        primary=_labware_location_seq_for_primary(group, base),
        adapter=_labware_location_seq_for_adapter(group, base),
        lid=_labware_location_seq_for_lid(group, base),
    )


def labware_location_base_sequence(
    sample_group: StackerStoredLabwareGroup,
    state_view: StateView,
    default: LabwareLocationSequence,
) -> LabwareLocationSequence:
    """Get the base location sequence for a labware group, including loading the current location if it exists."""
    first = (
        sample_group.adapterLabwareId
        if sample_group.adapterLabwareId is not None
        else sample_group.primaryLabwareId
    )
    if state_view.labware.known(first):
        return state_view.geometry.get_location_sequence(first)
    return default


def primary_location_sequences(
    groups: list[GroupWithLocationSequences],
) -> list[LabwareLocationSequence]:
    """Collate primary location sequences from lists of labware-plus-location."""
    return [primary_location_sequence(group) for group in groups]


def primary_location_sequence(
    group: GroupWithLocationSequences,
) -> LabwareLocationSequence:
    """Get the location sequence for the primary labware."""
    return group.primary.locationSequence


def adapter_location_sequences(
    groups: list[GroupWithLocationSequences],
) -> list[LabwareLocationSequence] | None:
    """Collate adapter location sequences from lists of labware-plus-location."""

    def _yield_adapters(
        groups: list[GroupWithLocationSequences],
    ) -> Iterator[LabwareLocationSequence]:
        for group in groups:
            seq = adapter_location_sequence(group)
            if seq is None:
                continue
            else:
                yield seq

    adapter_seqs = list(_yield_adapters(groups))
    if len(adapter_seqs) != len(groups):
        return None
    return adapter_seqs


def adapter_location_sequences_with_default(
    groups: list[GroupWithLocationSequences], adapter_def: LabwareDefinition | None
) -> list[LabwareLocationSequence] | None:
    """Collate adapter location sequences unless there is no adapter."""
    if adapter_def is None:
        return None
    else:
        return adapter_location_sequences(groups)


def adapter_location_sequence(
    group: GroupWithLocationSequences,
) -> LabwareLocationSequence | None:
    """Get the adapter location sequence from a group."""
    if group.adapter is None:
        return None
    return group.adapter.locationSequence


def lid_location_sequences(
    groups: list[GroupWithLocationSequences],
) -> list[LabwareLocationSequence] | None:
    """Collate lid location sequences from lists of labware-plus-location."""

    def _yield_lids(
        groups: list[GroupWithLocationSequences],
    ) -> Iterator[LabwareLocationSequence]:
        for group in groups:
            seq = lid_location_sequence(group)
            if seq is None:
                continue
            else:
                yield seq

    lid_seqs = list(_yield_lids(groups))
    if len(lid_seqs) != len(groups):
        return None
    return lid_seqs


def lid_location_sequences_with_default(
    groups: list[GroupWithLocationSequences], lid_def: LabwareDefinition | None
) -> list[LabwareLocationSequence] | None:
    """Collate lid location sequences unless there is no lid."""
    if lid_def is None:
        return None
    else:
        return lid_location_sequences(groups)


def lid_location_sequence(
    group: GroupWithLocationSequences,
) -> LabwareLocationSequence | None:
    """Get the lid location sequence from a group."""
    if group.lid is None:
        return None
    return group.lid.locationSequence


def _check_one_preloaded_labware_known(
    group: StackerStoredLabwareGroup, state_view: StateView
) -> bool:
    """Slightly tricky way to check if a labware group represents known labware.

    Return true if all specified labware are known; false if all specified labware are not known; and
    raise CommandPreconditionViolated if some specified labware are known and some are not.
    """
    if state_view.labware.known(group.primaryLabwareId):
        if group.lidLabwareId is not None and not state_view.labware.known(
            group.lidLabwareId
        ):
            raise CommandPreconditionViolated(
                "Either all labware ids must be known or none must be, but primary and lid do not match"
            )
        if group.adapterLabwareId is not None and not state_view.labware.known(
            group.adapterLabwareId
        ):
            raise CommandPreconditionViolated(
                "Either all labware ids must be known or none must be, but primary and adapter do not match"
            )

        return True
    else:
        if group.lidLabwareId is not None and state_view.labware.known(
            group.lidLabwareId
        ):
            raise CommandPreconditionViolated(
                "Either all labware ids must be known or none must be, but primary and lid do not match"
            )
        if group.adapterLabwareId is not None and state_view.labware.known(
            group.adapterLabwareId
        ):
            raise CommandPreconditionViolated(
                "Either all labware ids must be known or none must be, but primary and lid do not match"
            )
        return False


def _check_one_preloaded_labware(  # noqa: C901
    pool_primary_definition: LabwareDefinition,
    pool_adapter_definition: LabwareDefinition | None,
    pool_lid_definition: LabwareDefinition | None,
    group: StackerStoredLabwareGroup,
    state_view: StateView,
) -> None:
    """Do some preflight checks for labware known to be preloaded.

    Check that labware known to the engine is located appropriately to be loaded to the stacker.
    hopper directly (i.e. during setStoredLabware or fill, NOT with store). While we're at it, bind the def and the id.
    """
    pool_primary_uri = state_view.labware.get_uri_from_definition(
        pool_primary_definition
    )
    stored_primary_uri = state_view.labware.get_definition_uri(group.primaryLabwareId)

    if pool_primary_uri != stored_primary_uri:
        raise CommandPreconditionViolated(
            f"URI {stored_primary_uri} of primary labware {group.primaryLabwareId} must match pool URI {pool_primary_uri} but does not"
        )
    if pool_adapter_definition:
        if group.adapterLabwareId is None:
            raise CommandPreconditionViolated(
                "All pool components must have an ID, but adapter has no id"
            )
        stored_adapter_uri = state_view.labware.get_definition_uri(
            group.adapterLabwareId
        )
        pool_adapter_uri = state_view.labware.get_uri_from_definition(
            pool_adapter_definition
        )
        if stored_adapter_uri != pool_adapter_uri:
            raise CommandPreconditionViolated(
                f"URI {stored_adapter_uri} of adapter labware {group.adapterLabwareId} must match pool URI {pool_adapter_uri} but does not"
            )
        if state_view.labware.get_location(group.adapterLabwareId) != OFF_DECK_LOCATION:
            raise CommandPreconditionViolated(
                "All existing adapters to be loaded into a stacker must be currently OFF_DECK"
            )
        if state_view.labware.get_location(group.primaryLabwareId) != OnLabwareLocation(
            labwareId=group.adapterLabwareId
        ):
            raise CommandPreconditionViolated(
                "Existing labware groups to be loaded into a stacker must already be associated"
            )
    else:
        if group.adapterLabwareId is not None:
            raise CommandPreconditionViolated(
                "No unspecified pool component may have an ID, but adapter has an id"
            )
        if state_view.labware.get_location(group.primaryLabwareId) != OFF_DECK_LOCATION:
            raise CommandPreconditionViolated(
                "All existing labware without adapters to be loaded into a stacker must be currently OFF_DECK"
            )
    if pool_lid_definition:
        if group.lidLabwareId is None:
            raise CommandPreconditionViolated(
                "All pool components must have an ID but lid has no id"
            )
        stored_lid_uri = state_view.labware.get_definition_uri(group.lidLabwareId)
        pool_lid_uri = state_view.labware.get_uri_from_definition(pool_lid_definition)
        if stored_lid_uri != pool_lid_uri:
            raise CommandPreconditionViolated(
                f"URI {stored_lid_uri} of lid labware {group.lidLabwareId} must match pool URI {pool_lid_uri} but does not"
            )

        if (
            state_view.labware.get_location(group.lidLabwareId)
            != OnLabwareLocation(labwareId=group.primaryLabwareId)
            or state_view.labware.get_lid_id_by_labware_id(group.primaryLabwareId)
            != group.lidLabwareId
        ):
            raise CommandPreconditionViolated(
                "Existing labware groups to be loaded into a stacker must already be associated"
            )
    else:
        if group.lidLabwareId is not None:
            raise CommandPreconditionViolated(
                "No unspecified pool component may have an id, but lid has an id"
            )


def check_preloaded_labware(
    pool_primary_definition: LabwareDefinition,
    pool_adapter_definition: LabwareDefinition | None,
    pool_lid_definition: LabwareDefinition | None,
    ids: list[StackerStoredLabwareGroup],
    state_view: StateView,
) -> None:
    """Check whether a list of known-to-be-preloaded labware match the pool constraints."""
    for group in ids:
        _check_one_preloaded_labware(
            pool_primary_definition,
            pool_adapter_definition,
            pool_lid_definition,
            group,
            state_view,
        )


def check_if_labware_preloaded(
    ids: list[StackerStoredLabwareGroup], state_view: StateView
) -> bool:
    """Determine whether the list of ids has already been loaded or needs to be loaded."""
    if len(ids) == 0:
        return False
    first = _check_one_preloaded_labware_known(ids[0], state_view)
    for group in ids[1:]:
        if _check_one_preloaded_labware_known(group, state_view) != first:
            raise CommandPreconditionViolated(
                "All labware must be previously loaded or none must be previously loaded."
            )
    return first


def _add_labware_details_to_dicts(
    definitions_by_id: dict[str, LabwareDefinition],
    display_names_by_id: dict[str, str | None],
    new_locations_by_id: dict[str, LabwareLocation],
    offset_ids_by_id: dict[str, str | None],
    definition: LabwareDefinition,
    labware: LoadedLabware,
) -> None:
    definitions_by_id[labware.id] = definition
    display_names_by_id[labware.id] = None
    new_locations_by_id[labware.id] = labware.location
    offset_ids_by_id[labware.id] = labware.offsetId


def _add_pool_labware_details_to_dicts(
    definitions_by_id: dict[str, LabwareDefinition],
    display_names_by_id: dict[str, str | None],
    new_locations_by_id: dict[str, LabwareLocation],
    offset_ids_by_id: dict[str, str | None],
    lid_parent_ids: list[str],
    lid_ids: list[str],
    pool_primary_definition: LabwareDefinition,
    pool_lid_definition: LabwareDefinition | None,
    pool_adapter_definition: LabwareDefinition | None,
    pool_group: LoadedLabwarePoolData,
) -> None:
    if pool_group.lid_labware:
        assert pool_lid_definition  # safe: only have lids if the pool has lids
        lid_parent_ids.append(pool_group.primary_labware.id)
        lid_ids.append(pool_group.lid_labware.id)
        _add_labware_details_to_dicts(
            definitions_by_id,
            display_names_by_id,
            new_locations_by_id,
            offset_ids_by_id,
            pool_lid_definition,
            pool_group.lid_labware,
        )
    if pool_group.adapter_labware:
        assert pool_adapter_definition
        _add_labware_details_to_dicts(
            definitions_by_id,
            display_names_by_id,
            new_locations_by_id,
            offset_ids_by_id,
            pool_adapter_definition,
            pool_group.adapter_labware,
        )

    _add_labware_details_to_dicts(
        definitions_by_id,
        display_names_by_id,
        new_locations_by_id,
        offset_ids_by_id,
        pool_primary_definition,
        pool_group.primary_labware,
    )


async def build_n_labware_with_ids(
    pool_primary_definition: LabwareDefinition,
    pool_adapter_definition: LabwareDefinition | None,
    pool_lid_definition: LabwareDefinition | None,
    module_id: str,
    ids: list[StackerStoredLabwareGroup],
    current_contained_labware: list[StackerStoredLabwareGroup],
    equipment: EquipmentHandler,
) -> tuple[StateUpdate, list[StackerStoredLabwareGroup]]:
    """Create labware objects to be stored inside the hopper."""
    pool_groups = [
        await equipment.load_labware_pool_from_definitions(
            pool_primary_definition=pool_primary_definition,
            pool_adapter_definition=pool_adapter_definition,
            pool_lid_definition=pool_lid_definition,
            location=InStackerHopperLocation(moduleId=module_id),
            primary_id=id_group.primaryLabwareId,
            adapter_id=id_group.adapterLabwareId,
            lid_id=id_group.lidLabwareId,
        )
        for id_group in ids
    ]
    definitions_by_id: dict[str, LabwareDefinition] = {}
    display_names_by_id: dict[str, str | None] = {}
    new_locations_by_id: dict[str, LabwareLocation] = {}
    offset_ids_by_id: dict[str, str | None] = {}
    lid_parent_ids: list[str] = []
    lid_ids: list[str] = []
    for pool_group in pool_groups:
        _add_pool_labware_details_to_dicts(
            definitions_by_id,
            display_names_by_id,
            new_locations_by_id,
            offset_ids_by_id,
            lid_parent_ids,
            lid_ids,
            pool_primary_definition,
            pool_lid_definition,
            pool_adapter_definition,
            pool_group,
        )
    new_contained_labware = current_contained_labware + ids
    return (
        StateUpdate()
        .update_flex_stacker_contained_labware(module_id, new_contained_labware)
        .set_batch_loaded_labware(
            definitions_by_id=definitions_by_id,
            offset_ids_by_id=offset_ids_by_id,
            display_names_by_id=display_names_by_id,
            new_locations_by_id=new_locations_by_id,
        )
        .set_lids(parent_labware_ids=lid_parent_ids, lid_ids=lid_ids)
    ), new_contained_labware


async def assign_n_labware(
    pool_primary_definition: LabwareDefinition,
    pool_adapter_definition: LabwareDefinition | None,
    pool_lid_definition: LabwareDefinition | None,
    module_id: str,
    ids: list[StackerStoredLabwareGroup],
    current_contained_labware: list[StackerStoredLabwareGroup],
    state_view: StateView,
) -> tuple[StateUpdate, list[StackerStoredLabwareGroup]]:
    """Assign a list of labware to be inside the stacker hopper."""
    check_preloaded_labware(
        pool_primary_definition,
        pool_adapter_definition,
        pool_lid_definition,
        ids,
        state_view,
    )

    def _bottom_labware(group: StackerStoredLabwareGroup) -> str:
        if group.adapterLabwareId:
            return group.adapterLabwareId
        return group.primaryLabwareId

    def _add_ids(
        group: StackerStoredLabwareGroup, offset_dict: dict[str, str | None]
    ) -> None:
        offset_dict[group.primaryLabwareId] = None
        if group.adapterLabwareId:
            offset_dict[group.adapterLabwareId] = None
        if group.lidLabwareId:
            offset_dict[group.lidLabwareId] = None

    new_locations_by_id = {
        _bottom_labware(group): InStackerHopperLocation(moduleId=module_id)
        for group in ids
    }
    new_offset_ids_by_id: dict[str, str | None] = {}
    for group in ids:
        _add_ids(group, new_offset_ids_by_id)

    new_contained_labware = current_contained_labware + ids
    return (
        StateUpdate()
        .update_flex_stacker_contained_labware(module_id, new_contained_labware)
        .set_batch_labware_location(
            new_locations_by_id=new_locations_by_id,
            new_offset_ids_by_id=new_offset_ids_by_id,
        )
    ), new_contained_labware


async def build_or_assign_labware_to_hopper(
    pool_primary_definition: LabwareDefinition,
    pool_adapter_definition: LabwareDefinition | None,
    pool_lid_definition: LabwareDefinition | None,
    module_id: str,
    ids: list[StackerStoredLabwareGroup],
    current_contained_labware: list[StackerStoredLabwareGroup],
    equipment: EquipmentHandler,
    state_view: StateView,
) -> tuple[StateUpdate, list[StackerStoredLabwareGroup]]:
    """Use the common params to labware-creating stacker commands to load labware appropriately.

    If the specified labware IDs exist already, labware is moved; if they don't, labware is created.
    """
    if check_if_labware_preloaded(ids, state_view):
        return await assign_n_labware(
            pool_primary_definition,
            pool_adapter_definition,
            pool_lid_definition,
            module_id,
            ids,
            current_contained_labware,
            state_view,
        )
    else:
        return await build_n_labware_with_ids(
            pool_primary_definition,
            pool_adapter_definition,
            pool_lid_definition,
            module_id,
            ids,
            current_contained_labware,
            equipment,
        )


def _count_from_lw_list_or_initial_count(
    initial_count: int | None,
    initial_lw: list[StackerStoredLabwareGroup] | None,
    max_pool_count: int,
    current_count: int,
) -> int:
    """Count the number of labware to be added to the stacker."""
    capacity = max(max_pool_count - current_count, 0)

    if initial_count is not None:
        if initial_lw and len(initial_lw) != initial_count:
            raise CommandPreconditionViolated(
                "If initialCount and initialStoredLabware are both specified, the number of labware must equal the count"
            )
        to_store_count = initial_count
    elif initial_lw is not None:
        to_store_count = len(initial_lw)
    else:
        # neither initialCount nor initialStoredLabware are specified
        if not capacity:
            raise CommandPreconditionViolated(
                "No labware groups were specified to be stored, but the stacker is already full"
            )
        return capacity

    if to_store_count > capacity:
        error_text = f" and is already holding {current_count}" if current_count else ""
        raise CommandPreconditionViolated(
            f"{to_store_count} labware groups were requested to be stored, "
            f"but the stacker can hold only {max_pool_count}{error_text}"
        )
    return to_store_count


def _build_one_labware_group(
    has_adapter: bool,
    has_lid: bool,
    group: StackerStoredLabwareGroup | None,
    model_utils: ModelUtils,
) -> StackerStoredLabwareGroup:
    if group:
        return group
    return StackerStoredLabwareGroup(
        primaryLabwareId=model_utils.generate_id(),
        adapterLabwareId=(model_utils.generate_id() if has_adapter else None),
        lidLabwareId=(model_utils.generate_id() if has_lid else None),
    )


def build_ids_to_fill(
    has_adapter: bool,
    has_lid: bool,
    initialLabware: list[StackerStoredLabwareGroup] | None,
    initialCount: int | None,
    max_count: int,
    current_count: int,
    model_utils: ModelUtils,
) -> list[StackerStoredLabwareGroup]:
    """Handle the common params for filling the stacker to make a list of ids.

    Only builds labware to add to the current stored (defined by current count).
    """
    count = _count_from_lw_list_or_initial_count(
        initialCount, initialLabware, max_count, current_count
    )

    def _pad_labware_to_count(
        labware_list: list[StackerStoredLabwareGroup], count: int
    ) -> Sequence[StackerStoredLabwareGroup | None]:
        if len(labware_list) < count:
            return labware_list + ([None] * (count - len(labware_list)))
        else:
            return labware_list[:count]

    return [
        _build_one_labware_group(has_adapter, has_lid, group, model_utils)
        for group in _pad_labware_to_count(initialLabware or [], count)
    ]


def build_retrieve_labware_move_updates(
    group: StackerStoredLabwareGroup,
    stacker: FlexStackerSubState,
    state_view: StateView,
) -> tuple[dict[str, LabwareLocation], dict[str, str | None]]:
    """Build the arguments required for batch_labware_location."""
    locations_for_ids: dict[str, LabwareLocation] = {}
    offset_ids_by_id: dict[str, str | None] = {}
    base_offset_location = state_view.geometry.get_projected_offset_location(
        ModuleLocation(moduleId=stacker.module_id)
    )
    assert stacker.pool_primary_definition, "Undefined labware pool"
    primary_uri = state_view.labware.get_uri_from_definition(
        stacker.pool_primary_definition
    )

    def _prepend_loc(
        new: LabwareOffsetLocationSequence,
        current: LabwareOffsetLocationSequence | None,
    ) -> LabwareOffsetLocationSequence | None:
        if current is None:
            return None
        return new + current

    def _find_offset_id(
        uri: str, offset_location: LabwareOffsetLocationSequence | None
    ) -> str | None:
        if offset_location is None:
            return None
        offset = state_view.labware.find_applicable_labware_offset(uri, offset_location)
        if offset is None:
            return None
        return offset.id

    if group.adapterLabwareId:
        locations_for_ids[group.adapterLabwareId] = ModuleLocation(
            moduleId=stacker.module_id
        )
        locations_for_ids[group.primaryLabwareId] = OnLabwareLocation(
            labwareId=group.adapterLabwareId
        )
        assert (
            stacker.pool_adapter_definition
        ), "Mismatched pool and labware definitions"
        adapter_uri = state_view.labware.get_uri_from_definition(
            stacker.pool_adapter_definition
        )
        offset_ids_by_id[group.adapterLabwareId] = _find_offset_id(
            adapter_uri, base_offset_location
        )
        primary_offset_location = _prepend_loc(
            [OnLabwareOffsetLocationSequenceComponent(labwareUri=adapter_uri)],
            base_offset_location,
        )
        offset_ids_by_id[group.primaryLabwareId] = _find_offset_id(
            primary_uri, primary_offset_location
        )

    else:
        locations_for_ids[group.primaryLabwareId] = ModuleLocation(
            moduleId=stacker.module_id
        )
        primary_offset_location = base_offset_location
        offset_ids_by_id[group.primaryLabwareId] = _find_offset_id(
            primary_uri, primary_offset_location
        )

    if group.lidLabwareId:
        assert (
            stacker.pool_lid_definition is not None
        ), "Mismatched pool and stored labware"
        lid_offset_location = _prepend_loc(
            [OnLabwareOffsetLocationSequenceComponent(labwareUri=primary_uri)],
            primary_offset_location,
        )
        locations_for_ids[group.lidLabwareId] = OnLabwareLocation(
            labwareId=group.primaryLabwareId
        )
        offset_ids_by_id[group.lidLabwareId] = _find_offset_id(
            state_view.labware.get_uri_from_definition(stacker.pool_lid_definition),
            lid_offset_location,
        )
    return locations_for_ids, offset_ids_by_id
