if __name__ == "__main__":
    print("\nLoading, this can take several seconds...\n")
    print("Please ignore the \"Failed to initialize character device...\" error\n")

import time
from datetime import datetime
import json
from urllib.request import Request, urlopen

from opentrons import protocol_api, execute, simulate

from pipetting import liquid_level, motions
from pipetting.lookup_table_12_row_trough_next import \
    LIQUID_LEVEL_LOOKUP_NEXT_TROUGH_12_ROW as TROUGH_LOOKUP_TABLE
from config.protocol import load_labware_and_pipettes
from config import default_config

metadata = {'apiLevel': '2.12'}

CFG = default_config()
REFILL_VOL = 0
TROUGH_DEAD_VOL = 3000


def http_get_all_labware_offsets(ctx):
    """Request (HTTP GET) from the local robot-server all runs information."""
    if ctx.is_simulating():
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
        print(f'WARNING: No Labware-Offset found for: \"{lw_uri}\".')
        print('Please use the Opentrons App to save a Labware Offset for this labware.')
        return 0.0, 0.0, 0.0

    def _sort_by_created_at(_offset):
        return datetime.fromisoformat(_offset["createdAt"])

    lw_offsets.sort(key=_sort_by_created_at)
    v = lw_offsets[-1]["vector"]
    return round(v["x"], 2), round(v["y"], 2), round(v["z"], 2)


def init_liquid_tracking(plate, trough):
    # LIQUID TRACKING
    for w in plate.wells():
        # NOTE: For Corning 3631, assuming a perfect cylinder creates
        #       an error of -0.78mm when Corning 3631 plate is full (~360uL)
        #       This means the software will think the liquid is
        #       0.78mm lower than it is in reality. To make it more
        #       accurate, give .init_liquid_height() a lookup table
        liquid_level.init_liquid_height(w)
    for w in trough.wells():
        liquid_level.init_liquid_height(w, lookup_table=TROUGH_LOOKUP_TABLE)
    # always assume baseline is in the final x2 troughs
    vol_per_transfer = CFG.volume * 8  # because multi channel
    vol_needed = vol_per_transfer * 6  # 6 columns (half the plate)
    for col in ['11', '12']:
        baseline_well = trough[f'A{col}']
        if not liquid_level.get_volume(baseline_well):
            liquid_level.add_start_volume(baseline_well, TROUGH_DEAD_VOL)
        liquid_level.add_start_volume(baseline_well, vol_needed, name='Baseline')


def test_drop_tip(pipette):
    if CFG.pipette.use_trash:
        pipette.drop_tip(home_after=False)
    else:
        pipette.return_tip(home_after=False)


def test_aspirate_dispense(
        protocol, pipette, well, aspirate=None, dispense=None,
        on_pre_submerge=None, on_post_emerge=None, retract=0.0, full_dispense=True):
    pip_ch = pipette.channels
    is_trough = 'reservoir' in well.parent.load_name
    liq_lvl_asp = aspirate * pip_ch if is_trough and aspirate else aspirate
    liq_lvl_disp = aspirate * pip_ch if is_trough and dispense else dispense
    liq_mm_start = liquid_level.get_liquid_height(well)
    liq_mm_end = liquid_level.get_liquid_height(
        well, after_aspirate=liq_lvl_asp, after_dispense=liq_lvl_disp)
    heights = motions.create_careful_heights(
        start_mm=liq_mm_start, end_mm=liq_mm_end)
    motions.carefully_pipette(
        protocol, pipette, well, heights,
        aspirate=aspirate, dispense=dispense,
        inspect=CFG.inspect,
        on_pre_submerge=on_pre_submerge, on_post_emerge=on_post_emerge,
        retract=retract, full_dispense=full_dispense
    )
    if pip_ch > 1 and not is_trough:
        wells = [w for w in well.parent.columns_by_name()[well.well_name[1:]]]
        assert well in wells, 'Well is not inside column'
    else:
        wells = [well]
    for w in wells:
        liquid_level.update_well_volume(
            w, after_aspirate=liq_lvl_asp, after_dispense=liq_lvl_disp)


def fill_plate_with_baseline(protocol, multi, trough, plate):
    # hard-coded wells for baseline in trough
    source_wells = [trough['A11']] * 6 + [trough['A12']] * 6
    target_cols = [w for w in plate.rows_by_name()['A']]  # every column on the plate
    fill_plate_with_multi(protocol, multi, volume=CFG.volume,
                          source_wells=source_wells, target_wells=target_cols)


def fill_plate_with_multi(protocol, multi, volume, source_wells, target_wells,
                          on_pre_aspirate=None, on_post_aspirate=None,
                          on_pre_dispense=None, on_post_dispense=None):
    assert len(source_wells) == len(target_wells), \
        f'{source_wells} not same length as {target_wells}' \
        f' ({len(source_wells)} != {len(target_wells)})'
    for i, (src_well, target_well) in enumerate(zip(source_wells, target_wells)):
        print(f'FILL ({i + 1}/{len(target_wells)})')
        print(f'\t({volume}uL) trough[{src_well.well_name}] '
              f'--> plate[{target_well.well_name}]')
        if not multi.has_tip:
            multi.pick_up_tip()
        test_aspirate_dispense(
            protocol, multi, src_well,
            aspirate=volume,
            on_pre_submerge=on_pre_aspirate,
            on_post_emerge=on_post_aspirate)
        test_aspirate_dispense(
            protocol, multi, target_well,
            dispense=volume,
            on_pre_submerge=on_pre_dispense,
            on_post_emerge=on_post_dispense,
            retract=CFG.retract)
        if CFG.pipette.change_tip:
            test_drop_tip(multi)
    if multi.has_tip:
        test_drop_tip(multi)


def run(protocol: protocol_api.ProtocolContext):
    assert CFG.volume > 0
    assert len(CFG.plate_rows) == len(CFG.trough_cols)

    start_timestamp = time.time()
    print(f'Time: {datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}')

    items = load_labware_and_pipettes(
        protocol, vial_def=None,
        pip_mount=CFG.pip_mount, pip_size=CFG.pip_size,
        multi_mount=CFG.multi_mount, multi_size=CFG.multi_size

    )

    # FIXME: make this configurable outside script source code
    if __name__ == '__main__':
        offsets_list = http_get_all_labware_offsets(protocol)

        def _load_and_set_offset(labware) -> None:
            delta = get_latest_offset_for_labware(offsets_list, labware)
            labware.set_offset(x=delta[0], y=delta[1], z=delta[2])

        if items.tiprack_multi:
            _load_and_set_offset(items.tiprack_multi)
        if items.trough:
            _load_and_set_offset(items.trough)
        if items.plate:
            _load_and_set_offset(items.plate)
    # must be after all offsets/addition_offsets are applied (b/c all Well objects are re-instantiated)
    init_liquid_tracking(plate=items.plate, trough=items.trough)

    # PIPETTE
    if items.multi:
        motions.apply_pipette_speeds(items.multi)

    # RUN
    liquid_level.print_setup_instructions(
        user_confirm=not protocol.is_simulating(), refill_vol=REFILL_VOL)
    fill_plate_with_baseline(
        protocol, items.multi, items.trough, items.plate)
    print(f'Time: {datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}')
    print(f'Duration: {round((time.time() - start_timestamp) / 60, 1)} minutes')
    print('\ndone')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(
        "Pipette Testing",
        epilog='\nEXAMPLES\n--------'
               '\n\nSimulate:'
               '\n > python main.py --simulate'
               '\n\nTest the script live (don\'t change tips):'
               '\n > python main.py --photo --grav'
               '\n\nFill a plate with 200uL of baseline from trough well A8 and A9:'
               '\n > python main.py --baseline --baseline-cols 888888999999 --trash'
               '\n\nRun a real measurement w/ defaults (change and trash tips):'
               '\n > python main.py --photo --grav --change-tip --trash'
               '\n\nHere are the default values of all options:'
               '\n > python main.py --photo --grav --change-tip --trash'
               '\n\nFill entire plate w/ 200uL (using 1 tip), from trough wells A1 and A2:'
               '\n > python main.py --photo --volume 200 --num-samples 12 '
               '--rows ABCDEFGH --dye-cols 11112222',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--volume", type=float, default=CFG.volume,
                        help='Microliters (uL) to transfer for each sample')
    parser.add_argument("--pip-size", type=int, default=CFG.pip_size,
                        help='Volume of the single-channel pipette (20, 300, or 1000)')
    parser.add_argument("--pip-mount", type=str, default=CFG.pip_mount,
                        help='Mount of the single-channel pipette (left or right)')
    parser.add_argument("--multi-size", type=int, default=CFG.multi_size,
                        help='Volume of the multi-channel pipette (20, 300)')
    parser.add_argument("--multi-mount", type=str, default=CFG.multi_mount,
                        help='Mount of the multi-channel pipette (left or right)')
    parser.add_argument("--num-samples", type=int, default=CFG.num_samples,
                        help='Number of transfers to measure')
    parser.add_argument("--rows", type=str, default=CFG.plate_rows,
                        help='Row of the plate to transfer MVS Dye')
    parser.add_argument("--dye-cols", type=str, default=CFG.trough_cols,
                        help='Trough columns to aspirate Dye from')
    parser.add_argument("--start-tip", type=str, default=CFG.start_tip,
                        help='Tip to begin iterating')
    parser.add_argument("--data-dir", type=str, default='.',
                        help='Directory to store gravimetric CSV data')
    parser.add_argument("--lid", action='store_true',
                        help='If set, will enable the Radwag 20g scale\'s motorized lid')
    parser.add_argument("--inspect", action='store_true',
                        help='If set, user can visually inspect each pipetting movement')
    parser.add_argument("--trash", action='store_true',
                        help='If set, pipette will discard used tips to the trash')
    parser.add_argument("--change-tip", action='store_true',
                        help='If set, pipette will use change tip(s) between each transfer')
    parser.add_argument("--simulate", action='store_true',
                        help='If set, the protocol will be simulated')
    parser.add_argument("--grav", action='store_true',
                        help='If set, the protocol will measure weight with the scale')
    parser.add_argument("--photo", action='store_true',
                        help='If set, the protocol will transfer Dye to a plate')
    parser.add_argument("--baseline", action='store_true',
                        help='If set, the protocol will transfer Baseline to a plate')
    parser.add_argument("--plate-on-scale", action='store_true',
                        help='If set, the protocol will transfer Dye to a plate on the scale')
    parser.add_argument("--use-multi", action='store_true',
                        help='If set, the protocol will transfer Dye to a plate on the scale using the multi')
    parser.add_argument("--evaporation", action='store_true',
                        help='If set, the scale will FOREVER read and print the')
    parser.add_argument("--peripherals", action='store_true',
                        help='If set, all peripherals will be tested')
    parser.add_argument("--has-diluent", action='store_true',
                        help='If set, all peripherals will be tested')
    parser.add_argument("--retract", type=int, default=CFG.retract,
                        help='Number of transfers to measure')
    parser.add_argument("--hv-divide", type=int, default=CFG.hv_divide,
                        help='Number of times to divide a large HV dispense')
    parser.add_argument("--scale-baud", type=int, default=CFG.scale_baud,
                        help='Baudrate for the scale (9600 or 115200, usually)')
    parser.add_argument("--auto-offset", action='store_true',
                        help='If set, labware offsets will be automatically loaded from the robot-server')
    parser.add_argument("--refill", action='store_true')
    args = parser.parse_args()

    CFG.pip_size = args.pip_size
    CFG.multi_size = args.multi_size
    CFG.pip_mount = args.pip_mount
    CFG.multi_mount = args.multi_mount

    CFG.data.directory = args.data_dir
    CFG.num_samples = args.num_samples
    CFG.plate_rows = args.rows
    CFG.trough_cols = args.dye_cols
    CFG.volume = args.volume
    CFG.inspect = args.inspect
    CFG.scale.use_lid = args.lid
    if args.change_tip:
        CFG.pipette.change_tip = True
    CFG.grav = args.grav
    CFG.photo = args.photo
    CFG.baseline = args.baseline
    CFG.plate_on_scale = args.plate_on_scale
    CFG.use_multi = args.use_multi
    CFG.start_tip = args.start_tip
    CFG.measure_evaporation = args.evaporation
    CFG.retract = args.retract
    CFG.has_diluent = args.has_diluent
    CFG.hv_divide = args.hv_divide
    CFG.scale_baud = args.scale_baud

    if args.refill:
        REFILL_VOL = TROUGH_DEAD_VOL

    if args.simulate:
        p = simulate.get_protocol_api(metadata['apiLevel'])
    else:
        p = execute.get_protocol_api(metadata['apiLevel'])
    # software requires homing before run (for some reason)
    print('\nhoming...')
    p.home()
    run(p)
