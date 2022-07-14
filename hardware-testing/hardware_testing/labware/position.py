from .layout import LayoutLabware

from hardware_testing.opentrons_api.workarounds import apply_additional_offset_to_labware, is_running_in_app

# FIXME: replace vial with something where
#        we can know the exact height of liquid
VIAL_SAFE_Z_OFFSET = 10


def _apply_calibrated_labware_offsets(layout: LayoutLabware) -> None:
    # TODO: load these values automatically
    if layout.tiprack:
        layout.tiprack.set_offset(x=-0.40, y=6.90, z=1.00)
    if layout.tiprack_multi:
        layout.tiprack_multi.set_offset(x=0.70, y=1.10, z=0.00)
    if layout.trough:
        layout.trough.set_offset(x=0.00, y=0.00, z=0.00)
    if layout.plate:
        layout.plate.set_offset(x=136.00, y=105.40, z=-6.50)
    if layout.vial:
        layout.vial.set_offset(x=-4.00, y=-14.20, z=-39.30)


def overwrite_default_labware_positions(layout: LayoutLabware) -> None:
    if not is_running_in_app():
        _apply_calibrated_labware_offsets(layout)
    if layout.vial:
        apply_additional_offset_to_labware(layout.vial, z=VIAL_SAFE_Z_OFFSET)
