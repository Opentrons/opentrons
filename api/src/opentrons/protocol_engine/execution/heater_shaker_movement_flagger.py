"""Helpers for flagging unsafe movements around a heater-shaker Module."""

from typing import List

from opentrons.protocols.geometry.deck_conflict import (
    get_east_west_locations,
    get_north_south_locations,
)

from ..errors import RestrictedPipetteMovementError
from ..types import HeaterShakerMovementData


async def raise_if_movement_restricted_by_heater_shaker(
    heater_shaker_data: List[HeaterShakerMovementData],
    destination_slot: int,
    is_multi_channel: bool,
    is_tiprack: bool,
) -> None:
    """Flag restricted movement around/to a Heater-Shaker."""
    for plate_shaking, latch_closed, heater_shaker_slot_int in heater_shaker_data:
        dest_east_west = destination_slot in get_east_west_locations(
            heater_shaker_slot_int
        )
        dest_north_south = destination_slot in get_north_south_locations(
            heater_shaker_slot_int
        )
        dest_heater_shaker = destination_slot == heater_shaker_slot_int

        # If heater-shaker is running, can't move to or around it
        if (
            any([dest_east_west, dest_north_south, dest_heater_shaker])
            and plate_shaking
        ):
            raise RestrictedPipetteMovementError(
                "Cannot move pipette to adjacent slot or Heater-Shaker while module is shaking"
            )

        # If heater-shaker's latch is open, can't move to it or east and west of it
        elif (dest_east_west or dest_heater_shaker) and not latch_closed:
            raise RestrictedPipetteMovementError(
                "Cannot move pipette east or west of or to Heater-Shaker while latch is open"
            )

        if is_multi_channel:
            # Can't go to east/west slot under any circumstances if pipette is multi-channel
            if dest_east_west:
                raise RestrictedPipetteMovementError(
                    "Cannot move multi-channel pipette east or west of Heater-Shaker"
                )
            # Can only go north/south if the labware is a tiprack
            elif dest_north_south and not is_tiprack:
                raise RestrictedPipetteMovementError(
                    "Cannot move multi-channel pipette north or south of Heater-Shaker to non-tiprack labware"
                )
