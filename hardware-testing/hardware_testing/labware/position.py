from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.labware import Labware

from .layout import LayoutLabware

from hardware_testing.opentrons_api.workarounds import (
    apply_additional_offset_to_labware,
    is_running_in_app,
    load_newest_offset_for_labware
)

# FIXME: replace vial with something where
#        we can know the exact height of liquid
VIAL_SAFE_Z_OFFSET = 10


def _apply_calibrated_labware_offsets(protocol: ProtocolContext, layout: LayoutLabware) -> None:

    def _load_and_set_offset(labware: Labware) -> None:
        delta = load_newest_offset_for_labware(protocol, labware)
        labware.set_offset(x=delta[0], y=delta[1], z=delta[2])

    if layout.tiprack:
        _load_and_set_offset(layout.tiprack)
    if layout.tiprack_multi:
        _load_and_set_offset(layout.tiprack_multi)
    if layout.trough:
        _load_and_set_offset(layout.trough)
    if layout.plate:
        _load_and_set_offset(layout.plate)
    if layout.vial:
        _load_and_set_offset(layout.vial)


def overwrite_default_labware_positions(protocol: ProtocolContext, layout: LayoutLabware) -> None:
    if not is_running_in_app():
        _apply_calibrated_labware_offsets(protocol, layout)
    if layout.vial:
        apply_additional_offset_to_labware(layout.vial, z=VIAL_SAFE_Z_OFFSET)
