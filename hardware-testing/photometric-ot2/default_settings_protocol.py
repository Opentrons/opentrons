import time
from datetime import datetime
import json
from urllib.request import Request, urlopen

from opentrons import protocol_api, execute, simulate

from photometric_ot2 import config, data
from photometric_ot2.drivers.utils import (
    connect_to_scale_and_temp_sensor,
    load_radwag_vial_definition
)
from photometric_ot2.pipetting import liquid_level, motions
from photometric_ot2.pipetting.lookup_table_12_row_trough_next import \
    LIQUID_LEVEL_LOOKUP_NEXT_TROUGH_12_ROW as TROUGH_LOOKUP_TABLE
from photometric_ot2.protocol import apply_calibrated_labware_offsets, PhotometricProtocolItems, DEFAULT_LABWARE_SLOTS

metadata = {'apiLevel': '2.12'}

CFG = config.default_config()


def http_get_all_labware_offsets(ctx):
    """Request (HTTP GET) from the local robot-server all runs information."""
    if ctx.is_simulating() or not is_running_on_robot():
        return []

    req = Request("http://localhost:31950/runs")
    req.add_header("Opentrons-Version", "2")
    runs_response = urlopen(req)
    runs_response_data = runs_response.read()
    runs_json = json.loads(runs_response_data)

    protocols_list = runs_json["data"]
    return [
        offset
        for _p in protocols_list
        for offset in _p["labwareOffsets"]

    ]

def apply_calibrated_labware_offsets(items: PhotometricProtocolItems) -> None:
    items.tiprack.set_offset(x=0.50, y=0.50, z=0.00)
    items.tiprack_multi.set_offset(x=-0.00, y=0.80, z=-0.20)
    items.plate.set_offset(x=-0.30, y=0.50, z=0.10)
    items.trough.set_offset(x=0.10, y=2.90, z=0.00)
    # items.vial.set_offset(x=-30.00, y=-92.00, z=-35.00)

def load_labware_and_pipettes(protocol: protocol_api.ProtocolContext,
                                pip_mount='left', multi_mount='right',
                                pip_size=300, multi_size=300) -> PhotometricProtocolItems:

    tiprack = protocol.load_labware(f'opentrons_96_tiprack_{pip_size}ul',
                                    location=DEFAULT_LABWARE_SLOTS.tiprack)
    tiprack_multi = protocol.load_labware(f'opentrons_96_tiprack_{multi_size}ul',
                                          location=DEFAULT_LABWARE_SLOTS.tiprack_multi)
    plate = protocol.load_labware('corning_96_wellplate_360ul_flat',
                                  location=DEFAULT_LABWARE_SLOTS.plate)
    trough = protocol.load_labware('nest_12_reservoir_15ml',
                                   location=DEFAULT_LABWARE_SLOTS.trough)

    pipette = None
    if pip_mount:
        pipette = protocol.load_instrument(f'p{pip_size}_single_gen2', pip_mount,
                                           tip_racks=[tiprack])
    multi = None
    if multi_mount:
        multi = protocol.load_instrument(f'p{multi_size}_multi_gen2', multi_mount,
                                         tip_racks=[tiprack_multi])
    return PhotometricProtocolItems(
        plate=plate, tiprack=tiprack, tiprack_multi=tiprack_multi, trough=trough, vial = None,
        pipette=pipette, multi=multi
    )


def get_latest_offset_for_labware(labware_offsets, labware):
    """Get latest offset for labware."""
    lw_uri = str(labware.uri)
    lw_slot = str(labware.parent)

    def _is_offset_present(_o) -> bool:
        _v = _o["vector"]
        return _v["x"] != 0 or _v["y"] != 0 or _v["z"] != 0

    def _offset_applies_to_labware(_o) -> bool:
        if _o["definitionUri"] != lw_uri:
            return False
        if _o["location"]["slotName"] != lw_slot:
            return False
        return _is_offset_present(_o)

    lw_offsets = [
        offset
        for offset in labware_offsets
        if _offset_applies_to_labware(offset)
    ]

    if not lw_offsets:
        return 0.0, 0.0, 0.0

    def _sort_by_created_at(_offset):
        return datetime.fromisoformat(_offset["createdAt"])

    lw_offsets.sort(key=_sort_by_created_at)
    v = lw_offsets[-1]["vector"]
    return round(v["x"], 2), round(v["y"], 2), round(v["z"], 2)

def test_aspirate_dispense(protocol, pipette, well, aspirate=None, dispense=None, full_dispense=True):

    pip_ch = pipette.channels
    is_trough = 'reservoir' in well.parent.load_name

    if pip_ch > 1 and not is_trough:
        wells = [w for w in well.parent.columns_by_name()[well.well_name[1:]]]
        print(wells)
    else:
        wells = [well]

def default_pipetting(protocol, pipette, well, aspirate=None, dispense=None):
    if aspirate:
        pipette.aspirate(aspirate, well)
    else:
        pipette.dispense(dispense, well)
        pipette.blow_out()

def test_photometric(protocol, pipette, trough, plate):
        total_samples = CFG.num_samples * len(CFG.plate_rows)
        corning_3631_wells = [
            well
            for row in CFG.plate_rows
            for well in plate.rows_by_name()[row][:CFG.num_samples]
        ]
        dye_wells = [
            trough[f'A{col}']
            for col in CFG.trough_cols
            for _ in range(CFG.num_samples)
        ]
        for i, (src_well, target_well) in enumerate(zip(dye_wells, corning_3631_wells)):
            print(f'PHOTO ({i + 1}/{total_samples})')
            print(f'\t({CFG.volume}uL) trough[{src_well.well_name}] '
                  f'--> plate[{target_well.well_name}]')
            if not pipette.has_tip:
                pipette.pick_up_tip()
            default_pipetting(
                protocol, pipette, src_well, aspirate=CFG.volume)
            default_pipetting(
                protocol, pipette, target_well, dispense=CFG.volume)
            if CFG.pipette.change_tip:
                test_drop_tip(pipette)
        if pipette.has_tip:
            test_drop_tip(pipette)

def test_drop_tip(pipette):
    if CFG.pipette.use_trash:
        pipette.drop_tip(home_after=False)
    else:
        pipette.return_tip(home_after=False)

def run(protocol: protocol_api.ProtocolContext):
    assert CFG.volume > 0
    assert len(CFG.plate_rows) == len(CFG.trough_cols)
    start_timestamp = time.time()
    print(f'Time: {datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}')

    protocol_items = load_labware_and_pipettes(
        protocol,
        pip_mount=CFG.pip_mount, pip_size=CFG.pip_size,
        multi_mount=CFG.multi_mount, multi_size=CFG.multi_size

    )

    if not CFG.auto_offset:
        apply_calibrated_labware_offsets(protocol_items)
    else:
        offsets_list = http_get_all_labware_offsets(protocol)

        def _load_and_set_offset(labware) -> None:
            delta = get_latest_offset_for_labware(offsets_list, labware)
            labware.set_offset(x=delta[0], y=delta[1], z=delta[2])

        if protocol_items.tiprack:
            _load_and_set_offset(protocol_items.tiprack)
        if protocol_items.trough:
            _load_and_set_offset(protocol_items.trough)
        if protocol_items.plate:
            _load_and_set_offset(protocol_items.plate)
    test_photometric(protocol, protocol_items.pipette, protocol_items.trough, protocol_items.plate)

    print(f'Time: {datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}')
    print(f'Duration: {round((time.time() - start_timestamp) / 60, 1)} minutes')

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action='store_true',
                        help='If set, the protocol will be simulated')
    parser.add_argument("--volume", type=float, default=200,
                        help='Microliters (uL) to transfer for each sample')
    parser.add_argument("--pip-size", type=int, default=300,
                        help='Volume of the single-channel pipette (20, 300, or 1000)')
    parser.add_argument("--pip-mount", type=str, default='left',
                        help='Mount of the single-channel pipette (left or right)')
    parser.add_argument("--multi-size", type=int, default=300,
                        help='Volume of the multi-channel pipette (20, 300)')
    parser.add_argument("--multi-mount", type=str, default='right',
                        help='Mount of the multi-channel pipette (left or right)')
    parser.add_argument("--num-samples", type=int, default=CFG.num_samples,
                        help='Number of transfers to measure')
    parser.add_argument("--rows", type=str, default=CFG.plate_rows,
                        help='Row of the plate to transfer MVS Dye')
    parser.add_argument("--dye-cols", type=str, default=CFG.trough_cols,
                        help='Trough columns to aspirate Dye from')
    parser.add_argument("--trash", action='store_true',
                        help='If set, pipette will discard used tips to the trash')
    parser.add_argument("--change-tip", action='store_true',
                        help='If set, pipette will change tips between each transfer')
    parser.add_argument("--photo", action='store_true',
                        help='If set, the protocol will transfer Dye to a plate')
    parser.add_argument("--use-multi", action='store_true',
                        help='If set, the protocol will transfer Dye to a plate on the scale using the multi')
    parser.add_argument("--has-diluent", action='store_true',
                            help='If set, all peripherals will be tested')
    parser.add_argument("--auto-offset", action='store_true',
                            help='If set, labware offsets will be automatically loaded from the robot-server')
    args = parser.parse_args()

    CFG.pip_size = args.pip_size
    CFG.multi_size = args.multi_size
    CFG.pip_mount = args.pip_mount
    CFG.multi_mount = args.multi_mount

    CFG.num_samples = args.num_samples
    CFG.plate_rows = args.rows
    CFG.trough_cols = args.dye_cols
    CFG.volume = args.volume
    CFG.pipette.use_trash = args.trash
    CFG.pipette.change_tip = args.change_tip
    CFG.photo = args.photo
    CFG.use_multi = args.use_multi
    CFG.has_diluent = args.has_diluent
    CFG.auto_offset = args.auto_offset

    if args.simulate:
        p = simulate.get_protocol_api(metadata['apiLevel'])
    else:
        p = execute.get_protocol_api(metadata['apiLevel'])
    # software requires homing before run (for some reason)
    p.home()
    try:
        run(p)
    finally:
        if not args.simulate and 'y' in input('home? (y/n)').lower():
            p.home()
