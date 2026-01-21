"""A Protocol-Engine-friendly wrapper for opentrons.motion_planning.deck_conflict."""

from __future__ import annotations

import logging
from typing import (
    List,
    Tuple,
    Union,
)

from opentrons_shared_data.errors.exceptions import MotionPlanningFailureError
from opentrons_shared_data.module import FLEX_TC_LID_COLLISION_ZONE

from . import point_calculations
from opentrons.motion_planning import adjacent_slots_getters
from opentrons.protocol_engine import (
    DeckSlotLocation,
    DropTipWellLocation,
    OnLabwareLocation,
    StateView,
)
from opentrons.protocol_engine.errors import LocationIsStagingSlotError
from opentrons.protocol_engine.types import (
    LoadedModule,
    StagingSlotLocation,
    WellLocationType,
)
from opentrons.protocols.api_support.types import APIVersion
from opentrons.types import DeckSlotName, Point, StagingSlotName

_PARTIAL_TIP_RETURN_VERSION_GATE = APIVersion(2, 28)


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


def check_safe_for_pipette_movement(  # noqa: C901
    engine_state: StateView,
    pipette_id: str,
    labware_id: str,
    well_name: str,
    well_location: WellLocationType,
    version: APIVersion,
) -> None:
    """Check if the labware is safe to move to with a pipette in partial tip configuration.

    Args:
        engine_state: engine state view
        pipette_id: ID of the pipette to be moved
        labware_id: ID of the labware we are moving to
        well_name: Name of the well to move to
        well_location: exact location within the well to move to
        version: the API version of the protocol
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
            # TODO (jbl, 2026-01-14) check if partially configured if the above TODO is addressed
            api_version_allows_partial_return_tip=version
            >= _PARTIAL_TIP_RETURN_VERSION_GATE,
        )
    well_location_point = engine_state.geometry.get_well_position(
        labware_id=labware_id,
        well_name=well_name,
        well_location=well_location,
        pipette_id=pipette_id,
    )
    primary_nozzle = engine_state.pipettes.get_primary_nozzle(pipette_id)

    destination_cp = engine_state.motion.get_critical_point_for_wells_in_labware(
        labware_id
    )
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
    ancestor = engine_state.geometry.get_ancestor_slot_name(labware_id)
    if isinstance(ancestor, StagingSlotName):
        raise LocationIsStagingSlotError(
            "Cannot perform pipette actions on labware in Staging Area Slot."
        )
    labware_slot = ancestor

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

    def _check_for_column_4_module_collision(slot: DeckSlotName) -> None:
        slot_module = engine_state.modules.get_by_slot(slot)
        if (
            slot_module
            and engine_state.modules.is_column_4_module(slot_module.model)
            and _slot_has_potential_colliding_object(
                engine_state=engine_state,
                pipette_bounds=pipette_bounds_at_well_location,
                surrounding_location=slot_module,
            )
        ):
            raise PartialTipMovementNotAllowedError(
                f"Moving to {engine_state.labware.get_display_name(labware_id)} in slot"
                f" {slot} with {primary_nozzle} nozzle partial configuration will"
                f" result in collision with items on {slot_module.model} mounted in {slot}."
            )

    # We check the labware slot for a module that is mounted in the same cutout
    # as the labwares slot but does not occupy the same heirarchy (like the stacker).
    _check_for_column_4_module_collision(labware_slot)

    for regular_slot in surrounding_slots.regular_slots:
        if _slot_has_potential_colliding_object(
            engine_state=engine_state,
            pipette_bounds=pipette_bounds_at_well_location,
            surrounding_location=regular_slot,
        ):
            raise PartialTipMovementNotAllowedError(
                f"Moving to {engine_state.labware.get_display_name(labware_id)} in slot"
                f" {labware_slot} with {primary_nozzle} nozzle partial configuration"
                f" will result in collision with items in deck slot {regular_slot}."
            )

        # Check for Column 4 Modules that may be descendants of a given surrounding slot
        _check_for_column_4_module_collision(regular_slot)

    for staging_slot in surrounding_slots.staging_slots:
        if _slot_has_potential_colliding_object(
            engine_state=engine_state,
            pipette_bounds=pipette_bounds_at_well_location,
            surrounding_location=staging_slot,
        ):
            raise PartialTipMovementNotAllowedError(
                f"Moving to {engine_state.labware.get_display_name(labware_id)} in slot"
                f" {labware_slot} with {primary_nozzle} nozzle partial configuration"
                f" will result in collision with items in staging slot {staging_slot}."
            )


def _slot_has_potential_colliding_object(
    engine_state: StateView,
    pipette_bounds: Tuple[Point, Point, Point, Point],
    surrounding_location: Union[DeckSlotName, StagingSlotName, LoadedModule],
) -> bool:
    """Return the slot, if any, that has an item that the pipette might collide into.
    Can be provided a Deck Slot, Staging Slot, or Column 4 Module.
    """
    if isinstance(surrounding_location, LoadedModule):
        if (
            engine_state.modules.is_column_4_module(surrounding_location.model)
            and surrounding_location.location is not None
        ):
            module_area = (
                engine_state.modules.ensure_and_convert_module_fixture_location(
                    surrounding_location.location.slotName, surrounding_location.model
                )
            )
            slot_pos = engine_state.addressable_areas.get_addressable_area_position(
                addressable_area_name=module_area,
                do_compatibility_check=False,
            )
            slot_bounds = (
                engine_state.addressable_areas.get_addressable_area_bounding_box(
                    addressable_area_name=module_area,
                    do_compatibility_check=False,
                )
            )
        else:
            raise ValueError(
                f"Error during collision validation, Module {surrounding_location.model} must be in Column 4."
            )
    else:
        # Check if slot overlaps with pipette position
        slot_pos = engine_state.addressable_areas.get_addressable_area_position(
            addressable_area_name=surrounding_location.id,
            do_compatibility_check=False,
        )
        slot_bounds = engine_state.addressable_areas.get_addressable_area_bounding_box(
            addressable_area_name=surrounding_location.id,
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
        if isinstance(surrounding_location, DeckSlotName):
            slot_highest_z = engine_state.geometry.get_highest_z_in_slot(
                DeckSlotLocation(slotName=surrounding_location)
            )
        elif isinstance(surrounding_location, LoadedModule):
            slot_highest_z = engine_state.geometry.get_highest_z_of_column_4_module(
                surrounding_location
            )
        else:
            slot_highest_z = engine_state.geometry.get_highest_z_in_slot(
                StagingSlotLocation(slotName=surrounding_location)
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
        tiprack_height = engine_state.labware.get_dimensions(labware_id=labware_id).z
        adapter_height = engine_state.labware.get_dimensions(
            labware_id=tiprack_parent.labwareId
        ).z
        # todo(mm, 2025-07-31): This looks like it needs to be something like
        # `tiprack_top_plane < adapter_top_plane` instead of `tiprack_height < adapter_height`.
        # In other words, take into account the stacking offset between the tip rack
        # and its adapter.
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
