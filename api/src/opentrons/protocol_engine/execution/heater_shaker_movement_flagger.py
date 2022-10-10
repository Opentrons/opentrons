"""Helpers for flagging unsafe movements around a Heater-Shaker Module."""

from typing import List

from opentrons.motion_planning.adjacent_slots_getters import (
    get_east_west_slots,
    get_north_south_slots,
)

from ..errors import PipetteMovementRestrictedByHeaterShakerError
from ..types import HeaterShakerMovementRestrictors


def raise_if_movement_restricted(
    hs_movement_restrictors: List[HeaterShakerMovementRestrictors],
    destination_slot: int,
    is_multi_channel: bool,
    destination_is_tip_rack: bool,
) -> None:
    """Flag restricted movement around/to a Heater-Shaker."""
    for hs_movement_restrictor in hs_movement_restrictors:
        dest_east_west = destination_slot in get_east_west_slots(
            hs_movement_restrictor.deck_slot
        )
        dest_north_south = destination_slot in get_north_south_slots(
            hs_movement_restrictor.deck_slot
        )
        dest_heater_shaker = destination_slot == hs_movement_restrictor.deck_slot

        # If Heater-Shaker is running, can't move to or around it
        if (
            any([dest_east_west, dest_north_south, dest_heater_shaker])
            and hs_movement_restrictor.plate_shaking
        ):
            raise PipetteMovementRestrictedByHeaterShakerError(
                "Cannot move pipette to Heater-Shaker or adjacent slot while module is shaking"
            )

        # If Heater-Shaker's latch is open, can't move to it or east and west of it
        elif (
            dest_east_west or dest_heater_shaker
        ) and not hs_movement_restrictor.latch_closed:
            raise PipetteMovementRestrictedByHeaterShakerError(
                "Cannot move pipette to Heater-Shaker or adjacent slot to the left or right while labware latch is open"
            )

        elif is_multi_channel:
            # Can't go to east/west slot under any circumstances if pipette is multi-channel
            if dest_east_west:
                raise PipetteMovementRestrictedByHeaterShakerError(
                    "Cannot move 8-Channel pipette to slot adjacent to the left or right of Heater-Shaker"
                )
            # Can only go north/south if the labware is a tip rack
            elif dest_north_south and not destination_is_tip_rack:
                raise PipetteMovementRestrictedByHeaterShakerError(
                    "Cannot move 8-Channel pipette to non-tip-rack labware directly in front of or behind a Heater-Shaker"
                )
