"""Labware position."""
from typing import List

from opentrons.protocol_api.labware import Labware

from hardware_testing.gravimetric.workarounds import (
    apply_additional_offset_to_labware,
    http_get_all_labware_offsets,
    get_latest_offset_for_labware,
)

# FIXME: replace vial with something where
#        we can know the exact height of liquid
VIAL_SAFE_Z_OFFSET = 10


def overwrite_default_labware_positions(labwares: List[Labware]) -> None:
    """Overwrite default labware positions."""
    offsets_list = http_get_all_labware_offsets()
    for labware in labwares:
        delta = get_latest_offset_for_labware(offsets_list, labware)
        labware.set_offset(x=delta[0], y=delta[1], z=delta[2])
        if "vial" in labware.load_name:
            apply_additional_offset_to_labware(labware, z=VIAL_SAFE_Z_OFFSET)
