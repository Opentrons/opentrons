"""Statically Clung Tips on 8ch Pipette Waste Chute Removal Method tested on 8.3.1."""
from opentrons import protocol_api, types
from opentrons.hardware_control.types import OT3Mount
from opentrons.protocol_api import SINGLE
from opentrons.hardware_control.motion_utilities import target_position_from_plunger


metadata = {
    'protocolName': 'Waste Chute Tip Removal',
    'author': 'Jon Klar',
    'description': 'waste chute swip method for statically clung tips on 8ch pipette',
}

requirements = {
    'robotType': 'OT-3',
    'apiLevel': '2.21'
}

def add_parameters(parameters: protocol_api.Parameters):
    "Parameters."
    parameters.add_float(
    variable_name = 'clip_offset',
        display_name = 'clip distance',
        default = -5.0,
        minimum = -15.0,
        maximum = 5.0, # DEFAULT AND MOST TESTED CLIP_OFFSET IS -5.
        unit = "mm",
        description='distance pipette travels to clip edge of waste chute. Tested Value is -5'
    )

    parameters.add_int(
    variable_name = 'num_times',
        display_name = 'number of pick ups',
        default = 96,
        minimum = 1,
        maximum = 480,
        description='number of pick ups'
    )
    parameters.add_bool(
        variable_name = "partial_tip",
        display_name = "Partial Tip",
        default = True,
        description = "True means partial tip is on"
    )
    parameters.add_str(
        variable_name = "pipette_type",
        display_name = "8ch Pipette Type",
        choices = [
            {"display_name": "50 ul", "value": "flex_8channel_50"},
            {"display_name": "1000 ul", "value": "flex_8channel_1000"}
        ],
        default = "flex_8channel_50"
    )


def run(protocol: protocol_api.ProtocolContext):

    z_travel = -33
    x_travel = -40
    clip_offset = protocol.params.clip_offset # type: ignore[attr-defined]
    num_times = protocol.params.num_times # type: ignore[attr-defined]
    partial_tip = protocol.params.partial_tip # type: ignore[attr-defined]
    pipette_type = protocol.params.pipette_type # type: ignore[attr-defined]
    
    tip_racks = [protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', slot) for slot in DECK_SLOTS]
    pipette = protocol.load_instrument(pipette_type, 'left')
    DECK_SLOTS = ['D1',  'B1', 'D2', 'B2', 'B3']
    if partial_tip:
        pipette.configure_nozzle_layout(style=SINGLE, start="H1", tip_racks = tip_racks)
    trash = protocol.load_waste_chute()
    

    hwapi = protocol._core.get_hardware()
    hwapi._cache_instruments()
    hwapi._cache_current_position()

    mount = OT3Mount.LEFT

    drop_tip_pos = 91.5
    bottom_pos = 61.5

    def drop_tip_with_ejector_extended(api, mount):
        move_pipette_plunger(api, mount, drop_tip_pos)
        api.remove_tip(mount)
        pipette._last_tip_picked_up_from = None

    def clip_trash_edge():
        hwapi.move_rel(mount, types.Point(x = x_travel + clip_offset))

    def pipette_to_neutral_position(api, mount):
        move_pipette_plunger(api, mount, bottom_pos)

    def move_pipette_plunger(api, mount, pos):
        current_pos = hwapi._current_position
        realmount = OT3Mount.from_mount(mount)
        target_pos = target_position_from_plunger(realmount, pos, current_pos)
        api._move(target_pos)

    #commands
    for col in list(range(num_times)):
        pipette.pick_up_tip()
        pipette.move_to(trash.top(x=x_travel, z=z_travel))
        drop_tip_with_ejector_extended(hwapi, mount)
        clip_trash_edge()
        pipette_to_neutral_position(hwapi, mount)



