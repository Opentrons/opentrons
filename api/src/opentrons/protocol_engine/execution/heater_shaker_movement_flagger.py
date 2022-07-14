"""Helpers for flagging unsafe movements around a heater-shaker Module."""

from typing import List

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
        dest_east_west = _is_east_or_west(heater_shaker_slot_int, destination_slot)
        dest_north_south = _is_north_south(heater_shaker_slot_int, destination_slot)
        dest_heater_shaker = destination_slot == heater_shaker_slot_int

        if any([dest_east_west, dest_north_south, dest_heater_shaker]):
            # If heater-shaker is running, can't move to or around it
            if plate_shaking:
                raise RestrictedPipetteMovementError(
                    "Cannot move pipette to adjacent slot or Heater-Shaker while module is shaking"
                )

            # If heater-shaker's latch is open, can't move to it or east and west of it
            elif not latch_closed and (dest_east_west or dest_heater_shaker):
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


def _is_east_or_west(hs_location: int, dest_location: int) -> bool:
    if hs_location in {1, 4, 7, 10}:
        return dest_location == hs_location + 1
    elif hs_location in {2, 5, 8, 11}:
        return dest_location == hs_location - 1 or dest_location == hs_location + 1
    else:
        return dest_location == hs_location - 1


def _is_north_south(hs_location: int, dest_location: int) -> bool:
    if hs_location in {1, 2, 3}:
        return dest_location == hs_location + 3
    elif hs_location in {4, 5, 6, 7, 8, 9}:
        return dest_location == hs_location - 3 or dest_location == hs_location + 3
    else:
        return dest_location == hs_location - 3
