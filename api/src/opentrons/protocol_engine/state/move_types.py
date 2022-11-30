"""Getters for Protocol Engine motion planning."""
from typing import Optional

from opentrons.motion_planning.types import MoveType

from .pipettes import CurrentWell


def get_move_type_to_well(
    pipette_id: str,
    labware_id: str,
    well_name: str,
    location: Optional[CurrentWell],
    force_direct: bool,
) -> MoveType:
    """Get the move type for a move to well command."""
    if force_direct:
        return MoveType.DIRECT
    if (
        location is not None
        and pipette_id == location.pipette_id
        and labware_id == location.labware_id
    ):
        return (
            MoveType.IN_LABWARE_ARC
            if well_name != location.well_name
            else MoveType.DIRECT
        )
    else:
        return MoveType.GENERAL_ARC
