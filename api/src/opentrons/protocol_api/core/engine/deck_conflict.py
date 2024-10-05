"""A Protocol-Engine-friendly wrapper for opentrons.motion_planning.deck_conflict."""
from __future__ import annotations
import itertools
import logging
from typing import (
    Collection,
    Dict,
    Optional,
    Tuple,
    overload,
    Union,
    TYPE_CHECKING,
    List,
)

from opentrons_shared_data.errors.exceptions import MotionPlanningFailureError
from opentrons_shared_data.module import FLEX_TC_LID_COLLISION_ZONE

from opentrons.hardware_control import CriticalPoint
from opentrons.hardware_control.modules.types import ModuleType
from opentrons.motion_planning import deck_conflict as wrapped_deck_conflict
from opentrons.motion_planning import adjacent_slots_getters

from opentrons.protocol_engine import (
    StateView,
    DeckSlotLocation,
    ModuleLocation,
    OnLabwareLocation,
    AddressableAreaLocation,
    OFF_DECK_LOCATION,
    WellLocation,
    DropTipWellLocation,
)
from opentrons.protocol_engine.errors.exceptions import LabwareNotLoadedOnModuleError
from opentrons.protocol_engine.types import (
    StagingSlotLocation,
)
from opentrons.types import DeckSlotName, StagingSlotName, Point
from ...disposal_locations import TrashBin, WasteChute
from . import point_calculations

if TYPE_CHECKING:
    from ...labware import Labware


class PartialTipMovementNotAllowedError(MotionPlanningFailureError):
    """Error raised when trying to perform a partial tip movement to an illegal location."""

    def __init__(self, message: str) -> None:
        super().__init__(
            message=message,
        )


class UnsuitableTiprackForPipetteMotion(MotionPlanningFailureError):
    """Error raised when trying to perform a pipette movement to a tip rack, based on adapter status."""

    def __init__(self, message: str) -> None:
        super().__init__(
            message=message,
        )


_log = logging.getLogger(__name__)

_FLEX_TC_LID_BACK_LEFT_PT = Point(
    x=FLEX_TC_LID_COLLISION_ZONE["back_left"]["x"],
    y=FLEX_TC_LID_COLLISION_ZONE["back_left"]["y"],
    z=FLEX_TC_LID_COLLISION_ZONE["back_left"]["z"],
)

_FLEX_TC_LID_FRONT_RIGHT_PT = Point(
    x=FLEX_TC_LID_COLLISION_ZONE["front_right"]["x"],
    y=FLEX_TC_LID_COLLISION_ZONE["front_right"]["y"],
    z=FLEX_TC_LID_COLLISION_ZONE["front_right"]["z"],
)


@overload
def check(
    *,
    engine_state: StateView,
    existing_labware_ids: Collection[str],
    existing_module_ids: Collection[str],
    existing_disposal_locations: Collection[Union[Labware, WasteChute, TrashBin]],
    new_labware_id: str,
) -> None:
    pass


@overload
def check(
    *,
    engine_state: StateView,
    existing_labware_ids: Collection[str],
    existing_module_ids: Collection[str],
    existing_disposal_locations: Collection[Union[Labware, WasteChute, TrashBin]],
    new_module_id: str,
) -> None:
    pass


@overload
def check(
    *,
    engine_state: StateView,
    existing_labware_ids: Collection[str],
    existing_module_ids: Collection[str],
    existing_disposal_locations: Collection[Union[Labware, WasteChute, TrashBin]],
    new_trash_bin: TrashBin,
) -> None:
    pass


def check(
    *,
    engine_state: StateView,
    existing_labware_ids: Collection[str],
    existing_module_ids: Collection[str],
    existing_disposal_locations: Collection[Union[Labware, WasteChute, TrashBin]],
    # TODO(mm, 2023-02-23): This interface is impossible to use correctly. In order
    # to have new_labware_id or new_module_id, the caller needs to have already loaded
    # the new item into Protocol Engine--but then, it's too late to do deck conflict.
    # checking. Find a way to do deck conflict checking before the new item is loaded.
    new_labware_id: Optional[str] = None,
    new_module_id: Optional[str] = None,
    new_trash_bin: Optional[TrashBin] = None,
) -> None:
    """Check for conflicts between items on the deck.

    This is a Protocol-Engine-friendly wrapper around
    opentrons.motion_planning.deck_conflict.check().

    Params:
        engine_state: An interface to retrieve details about the deck items.
        existing_labware_ids: The Protocol Engine IDs of all labware already loaded.
        existing_module_ids: The Protocol Engine IDs of all modules already loaded.
        new_labware_id: The Protocol Engine ID of a new labware you've just added.
            Mutually exclusive with new_module_id.
        new_module_id: The Protocol EngineID of a new module you've just added.
            Mutually exclusive with new_labware_id.

    Raises:
        opentrons.motion_planning.deck_conflict.DeckConflictError:
            If the newly-added item conflicts with one of the existing items.
    """

    if new_labware_id is not None:
        new_location_and_item = _map_labware(engine_state, new_labware_id)
    if new_module_id is not None:
        new_location_and_item = _map_module(engine_state, new_module_id)
    if new_trash_bin is not None:
        new_location_and_item = _map_disposal_location(new_trash_bin)

    if new_location_and_item is None:
        # The new item should be excluded from deck conflict checking. Nothing to do.
        return

    new_location, new_item = new_location_and_item

    all_existing_labware = (
        _map_labware(engine_state, labware_id) for labware_id in existing_labware_ids
    )
    mapped_existing_labware = (m for m in all_existing_labware if m is not None)

    all_existing_modules = (
        _map_module(engine_state, module_id) for module_id in existing_module_ids
    )
    mapped_existing_modules = (m for m in all_existing_modules if m is not None)

    all_exisiting_disposal_locations = (
        _map_disposal_location(disposal_location)
        for disposal_location in existing_disposal_locations
    )
    mapped_disposal_locations = (
        m for m in all_exisiting_disposal_locations if m is not None
    )

    existing_items: Dict[
        Union[DeckSlotName, StagingSlotName], wrapped_deck_conflict.DeckItem
    ] = {}
    for existing_location, existing_item in itertools.chain(
        mapped_existing_labware, mapped_existing_modules, mapped_disposal_locations
    ):
        assert existing_location not in existing_items
        existing_items[existing_location] = existing_item

    wrapped_deck_conflict.check(
        existing_items=existing_items,
        new_item=new_item,
        new_location=new_location,
        robot_type=engine_state.config.robot_type,
    )


# TODO (spp, 2023-02-16): move pipette movement safety checks to its own separate file.
def check_safe_for_pipette_movement(
    engine_state: StateView,
    pipette_id: str,
    labware_id: str,
    well_name: str,
    well_location: Union[WellLocation, DropTipWellLocation],
) -> None:
    """Check if the labware is safe to move to with a pipette in partial tip configuration.

    Args:
        engine_state: engine state view
        pipette_id: ID of the pipette to be moved
        labware_id: ID of the labware we are moving to
        well_name: Name of the well to move to
        well_location: exact location within the well to move to
    """
    # TODO (spp, 2023-02-06): remove this check after thorough testing.
    #  This function is capable of checking for movement conflict regardless of
    #  nozzle configuration.
    if not engine_state.pipettes.get_is_partially_configured(pipette_id):
        return

    if isinstance(well_location, DropTipWellLocation):
        # convert to WellLocation
        well_location = engine_state.geometry.get_checked_tip_drop_location(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_location=well_location,
            partially_configured=True,
        )
    well_location_point = engine_state.geometry.get_well_position(
        labware_id=labware_id, well_name=well_name, well_location=well_location
    )
    primary_nozzle = engine_state.pipettes.get_primary_nozzle(pipette_id)

    destination_cp = _get_critical_point_to_use(engine_state, labware_id)

    pipette_bounds_at_well_location = (
        engine_state.pipettes.get_pipette_bounds_at_specified_move_to_position(
            pipette_id=pipette_id,
            destination_position=well_location_point,
            critical_point=destination_cp,
        )
    )
    if not _is_within_pipette_extents(
        engine_state=engine_state,
        pipette_id=pipette_id,
        pipette_bounding_box_at_loc=pipette_bounds_at_well_location,
    ):
        raise PartialTipMovementNotAllowedError(
            f"Requested motion with the {primary_nozzle} nozzle partial configuration"
            f" is outside of robot bounds for the pipette."
        )

    labware_slot = engine_state.geometry.get_ancestor_slot_name(labware_id)

    surrounding_slots = adjacent_slots_getters.get_surrounding_slots(
        slot=labware_slot.as_int(), robot_type=engine_state.config.robot_type
    )

    if _will_collide_with_thermocycler_lid(
        engine_state=engine_state,
        pipette_bounds=pipette_bounds_at_well_location,
        surrounding_regular_slots=surrounding_slots.regular_slots,
    ):
        raise PartialTipMovementNotAllowedError(
            f"Moving to {engine_state.labware.get_display_name(labware_id)} in slot"
            f" {labware_slot} with {primary_nozzle} nozzle partial configuration"
            f" will result in collision with thermocycler lid in deck slot A1."
        )

    for regular_slot in surrounding_slots.regular_slots:
        if _slot_has_potential_colliding_object(
            engine_state=engine_state,
            pipette_bounds=pipette_bounds_at_well_location,
            surrounding_slot=regular_slot,
        ):
            raise PartialTipMovementNotAllowedError(
                f"Moving to {engine_state.labware.get_display_name(labware_id)} in slot"
                f" {labware_slot} with {primary_nozzle} nozzle partial configuration"
                f" will result in collision with items in deck slot {regular_slot}."
            )
    for staging_slot in surrounding_slots.staging_slots:
        if _slot_has_potential_colliding_object(
            engine_state=engine_state,
            pipette_bounds=pipette_bounds_at_well_location,
            surrounding_slot=staging_slot,
        ):
            raise PartialTipMovementNotAllowedError(
                f"Moving to {engine_state.labware.get_display_name(labware_id)} in slot"
                f" {labware_slot} with {primary_nozzle} nozzle partial configuration"
                f" will result in collision with items in staging slot {staging_slot}."
            )


def _get_critical_point_to_use(
    engine_state: StateView, labware_id: str
) -> Optional[CriticalPoint]:
    """Return the critical point to use when accessing the given labware."""
    # TODO (spp, 2024-09-17): looks like Y_CENTER of column is the same as its XY_CENTER.
    #   I'm using this if-else ladder to be consistent with what we do in
    #   `MotionPlanning.get_movement_waypoints_to_well()`.
    #   We should probably use only XY_CENTER in both places.
    if engine_state.labware.get_should_center_column_on_target_well(labware_id):
        return CriticalPoint.Y_CENTER
    elif engine_state.labware.get_should_center_pipette_on_target_well(labware_id):
        return CriticalPoint.XY_CENTER
    return None


def _slot_has_potential_colliding_object(
    engine_state: StateView,
    pipette_bounds: Tuple[Point, Point, Point, Point],
    surrounding_slot: Union[DeckSlotName, StagingSlotName],
) -> bool:
    """Return the slot, if any, that has an item that the pipette might collide into."""
    # Check if slot overlaps with pipette position
    slot_pos = engine_state.addressable_areas.get_addressable_area_position(
        addressable_area_name=surrounding_slot.id,
        do_compatibility_check=False,
    )
    slot_bounds = engine_state.addressable_areas.get_addressable_area_bounding_box(
        addressable_area_name=surrounding_slot.id,
        do_compatibility_check=False,
    )
    slot_back_left_coords = Point(slot_pos.x, slot_pos.y + slot_bounds.y, slot_pos.z)
    slot_front_right_coords = Point(slot_pos.x + slot_bounds.x, slot_pos.y, slot_pos.z)

    # If slot overlaps with pipette bounds
    if point_calculations.are_overlapping_rectangles(
        rectangle1=(pipette_bounds[0], pipette_bounds[1]),
        rectangle2=(slot_back_left_coords, slot_front_right_coords),
    ):
        # Check z-height of items in overlapping slot
        if isinstance(surrounding_slot, DeckSlotName):
            slot_highest_z = engine_state.geometry.get_highest_z_in_slot(
                DeckSlotLocation(slotName=surrounding_slot)
            )
        else:
            slot_highest_z = engine_state.geometry.get_highest_z_in_slot(
                StagingSlotLocation(slotName=surrounding_slot)
            )
        return slot_highest_z >= pipette_bounds[0].z
    return False


def _will_collide_with_thermocycler_lid(
    engine_state: StateView,
    pipette_bounds: Tuple[Point, Point, Point, Point],
    surrounding_regular_slots: List[DeckSlotName],
) -> bool:
    """Return whether the pipette might collide with thermocycler's lid/clips on a Flex.

    If any of the pipette's bounding vertices lie inside the no-go zone of the thermocycler-
    which is the area that's to the left, back and below the thermocycler's lid's
    protruding clips, then we will mark the movement for possible collision.

    This could cause false raises for the case where an 8-channel is accessing the
    thermocycler labware in a location such that the pipette is in the area between
    the clips but not touching either clips. But that's a tradeoff we'll need to make
    between a complicated check involving accurate positions of all entities involved
    and a crude check that disallows all partial tip movements around the thermocycler.
    """
    # TODO (spp, 2024-02-27): Improvements:
    #  - make the check dynamic according to lid state:
    #     - if lid is open, check if pipette is in no-go zone
    #     - if lid is closed, use the closed lid height to check for conflict
    if (
        DeckSlotName.SLOT_A1 in surrounding_regular_slots
        and engine_state.modules.is_flex_deck_with_thermocycler()
    ):
        return (
            point_calculations.are_overlapping_rectangles(
                rectangle1=(_FLEX_TC_LID_BACK_LEFT_PT, _FLEX_TC_LID_FRONT_RIGHT_PT),
                rectangle2=(pipette_bounds[0], pipette_bounds[1]),
            )
            and pipette_bounds[0].z <= _FLEX_TC_LID_BACK_LEFT_PT.z
        )

    return False


def check_safe_for_tip_pickup_and_return(
    engine_state: StateView,
    pipette_id: str,
    labware_id: str,
) -> None:
    """Check if the presence or absence of a tiprack adapter might cause any pipette movement issues.

    A 96 channel pipette will pick up tips using cam action when it's configured
    to use ALL nozzles. For this, the tiprack needs to be on the Flex 96 channel tiprack adapter
    or similar or the tips will not be picked up.

    On the other hand, if the pipette is configured with partial nozzle configuration,
    it uses the usual pipette presses to pick the tips up, in which case, having the tiprack
    on the Flex 96 channel tiprack adapter (or similar) will cause the pipette to
    crash against the adapter posts.

    In order to check if the 96-channel can move and pickup/drop tips safely, this method
    checks for the height attribute of the tiprack adapter rather than checking for the
    specific official adapter since users might create custom labware &/or definitions
    compatible with the official adapter.
    """
    if not engine_state.pipettes.get_channels(pipette_id) == 96:
        # Adapters only matter to 96 ch.
        return

    is_partial_config = engine_state.pipettes.get_is_partially_configured(pipette_id)
    tiprack_name = engine_state.labware.get_display_name(labware_id)
    tiprack_parent = engine_state.labware.get_location(labware_id)
    if isinstance(tiprack_parent, OnLabwareLocation):  # tiprack is on an adapter
        is_96_ch_tiprack_adapter = engine_state.labware.get_has_quirk(
            labware_id=tiprack_parent.labwareId, quirk="tiprackAdapterFor96Channel"
        )
        tiprack_height = engine_state.labware.get_dimensions(labware_id).z
        adapter_height = engine_state.labware.get_dimensions(tiprack_parent.labwareId).z
        if is_partial_config and tiprack_height < adapter_height:
            raise PartialTipMovementNotAllowedError(
                f"{tiprack_name} cannot be on an adapter taller than the tip rack"
                f" when picking up fewer than 96 tips."
            )
        elif not is_partial_config and not is_96_ch_tiprack_adapter:
            raise UnsuitableTiprackForPipetteMotion(
                f"{tiprack_name} must be on an Opentrons Flex 96 Tip Rack Adapter"
                f" in order to pick up or return all 96 tips simultaneously."
            )

    elif (
        not is_partial_config
    ):  # tiprack is not on adapter and pipette is in full config
        raise UnsuitableTiprackForPipetteMotion(
            f"{tiprack_name} must be on an Opentrons Flex 96 Tip Rack Adapter"
            f" in order to pick up or return all 96 tips simultaneously."
        )


def _is_within_pipette_extents(
    engine_state: StateView,
    pipette_id: str,
    pipette_bounding_box_at_loc: Tuple[Point, Point, Point, Point],
) -> bool:
    """Whether a given point is within the extents of a configured pipette on the specified robot."""
    channels = engine_state.pipettes.get_channels(pipette_id)
    robot_extents = engine_state.geometry.absolute_deck_extents
    (
        pip_back_left_bound,
        pip_front_right_bound,
        pip_back_right_bound,
        pip_front_left_bound,
    ) = pipette_bounding_box_at_loc

    # Given the padding values accounted for against the deck extents,
    # a pipette is within extents when all of the following are true:

    # Each corner slot full pickup case:
    # A1: Front right nozzle is within the rear and left-side padding limits
    # D1: Back right nozzle is within the front and left-side padding limits
    # A3 Front left nozzle is within the rear and right-side padding limits
    # D3: Back left nozzle is within the front and right-side padding limits
    # Thermocycler Column A2: Front right nozzle is within padding limits

    if channels == 96:
        return (
            pip_front_right_bound.y
            <= robot_extents.deck_extents.y + robot_extents.padding_rear
            and pip_front_right_bound.x >= robot_extents.padding_left_side
            and pip_back_right_bound.y >= robot_extents.padding_front
            and pip_back_right_bound.x >= robot_extents.padding_left_side
            and pip_front_left_bound.y
            <= robot_extents.deck_extents.y + robot_extents.padding_rear
            and pip_front_left_bound.x
            <= robot_extents.deck_extents.x + robot_extents.padding_right_side
            and pip_back_left_bound.y >= robot_extents.padding_front
            and pip_back_left_bound.x
            <= robot_extents.deck_extents.x + robot_extents.padding_right_side
        )
    # For 8ch pipettes we only check the rear and front extents
    return (
        pip_front_right_bound.y
        <= robot_extents.deck_extents.y + robot_extents.padding_rear
        and pip_back_right_bound.y >= robot_extents.padding_front
        and pip_front_left_bound.y
        <= robot_extents.deck_extents.y + robot_extents.padding_rear
        and pip_back_left_bound.y >= robot_extents.padding_front
    )


def _map_labware(
    engine_state: StateView,
    labware_id: str,
) -> Optional[
    Tuple[Union[DeckSlotName, StagingSlotName], wrapped_deck_conflict.DeckItem]
]:
    location_from_engine = engine_state.labware.get_location(labware_id=labware_id)

    if isinstance(location_from_engine, AddressableAreaLocation):
        # This will be guaranteed to be either deck slot name or staging slot name
        slot: Union[DeckSlotName, StagingSlotName]
        try:
            slot = DeckSlotName.from_primitive(location_from_engine.addressableAreaName)
        except ValueError:
            slot = StagingSlotName.from_primitive(
                location_from_engine.addressableAreaName
            )
        return (
            slot,
            wrapped_deck_conflict.Labware(
                name_for_errors=engine_state.labware.get_load_name(
                    labware_id=labware_id
                ),
                highest_z=engine_state.geometry.get_labware_highest_z(
                    labware_id=labware_id
                ),
                uri=engine_state.labware.get_definition_uri(labware_id=labware_id),
                is_fixed_trash=engine_state.labware.is_fixed_trash(
                    labware_id=labware_id
                ),
            ),
        )

    elif isinstance(location_from_engine, DeckSlotLocation):
        # This labware is loaded directly into a deck slot.
        # Map it to a wrapped_deck_conflict.Labware.
        return (
            location_from_engine.slotName,
            wrapped_deck_conflict.Labware(
                name_for_errors=engine_state.labware.get_load_name(
                    labware_id=labware_id
                ),
                highest_z=engine_state.geometry.get_labware_highest_z(
                    labware_id=labware_id
                ),
                uri=engine_state.labware.get_definition_uri(labware_id=labware_id),
                is_fixed_trash=engine_state.labware.is_fixed_trash(
                    labware_id=labware_id
                ),
            ),
        )

    elif isinstance(location_from_engine, ModuleLocation):
        # This labware is loaded atop a module. Don't map it to anything here;
        # let _map_module() pick it up.
        return None

    elif isinstance(location_from_engine, OnLabwareLocation):
        # TODO(jbl 2023-06-08) check if we need to do any logic here or if this is correct
        return None

    elif location_from_engine == OFF_DECK_LOCATION:
        # This labware is off-deck. Exclude it from conflict checking.
        # todo(mm, 2023-02-23): Move this logic into wrapped_deck_conflict.
        return None


def _map_module(
    engine_state: StateView,
    module_id: str,
) -> Optional[Tuple[DeckSlotName, wrapped_deck_conflict.DeckItem]]:
    module_model = engine_state.modules.get_connected_model(module_id=module_id)
    module_type = module_model.as_type()
    mapped_location = engine_state.modules.get_location(module_id=module_id).slotName

    # Use the module model (e.g. "temperatureModuleV1") as the name for error messages
    # because it's convenient for us. Unfortunately, this won't necessarily match
    # the string that the Python protocol author used to load the module.
    name_for_errors = module_model.value

    highest_z_including_labware = _get_module_highest_z_including_labware(
        engine_state=engine_state,
        module_id=module_id,
    )

    if module_type == ModuleType.HEATER_SHAKER:
        return (
            mapped_location,
            wrapped_deck_conflict.HeaterShakerModule(
                name_for_errors=name_for_errors,
                highest_z_including_labware=highest_z_including_labware,
            ),
        )
    elif module_type == ModuleType.MAGNETIC_BLOCK:
        return (
            mapped_location,
            wrapped_deck_conflict.MagneticBlockModule(
                name_for_errors=name_for_errors,
                highest_z_including_labware=highest_z_including_labware,
            ),
        )
    elif module_type == ModuleType.THERMOCYCLER:
        return (
            mapped_location,
            wrapped_deck_conflict.ThermocyclerModule(
                name_for_errors=name_for_errors,
                highest_z_including_labware=highest_z_including_labware,
                # Python Protocol API >=v2.14 never allows loading a Thermocycler in
                # its semi configuration.
                is_semi_configuration=False,
            ),
        )
    else:
        return (
            mapped_location,
            wrapped_deck_conflict.OtherModule(
                name_for_errors=name_for_errors,
                highest_z_including_labware=highest_z_including_labware,
            ),
        )


def _map_disposal_location(
    disposal_location: Union[Labware, WasteChute, TrashBin],
) -> Optional[Tuple[DeckSlotName, wrapped_deck_conflict.DeckItem]]:
    if isinstance(disposal_location, TrashBin):
        return (
            disposal_location.location,
            wrapped_deck_conflict.TrashBin(
                name_for_errors="trash bin", highest_z=disposal_location.height
            ),
        )
    else:
        return None


def _deck_slot_to_int(deck_slot_location: DeckSlotLocation) -> int:
    return deck_slot_location.slotName.as_int()


def _get_module_highest_z_including_labware(
    engine_state: StateView, module_id: str
) -> float:
    try:
        labware_id = engine_state.labware.get_id_by_module(module_id=module_id)
    except LabwareNotLoadedOnModuleError:
        # No labware is loaded atop this module.
        # The height should be just the module itself.
        return engine_state.modules.get_overall_height(module_id=module_id)
    else:
        # This module has a labware loaded atop it. The height should include both.
        return engine_state.geometry.get_labware_highest_z(labware_id=labware_id)
