import time
from datetime import datetime
from typing import Tuple

from opentrons import protocol_api, execute, simulate

from hardware_testing import config, data
from hardware_testing.drivers import find_port, RadwagScaleBase, AsairSensorBase
from hardware_testing.labware.definitions import load_radwag_vial_definition
from hardware_testing.labware.liquid_level.liquid_level import LiquidTracker
from hardware_testing.pipetting import motions
from hardware_testing.protocol import metadata, load_labware_and_pipettes, apply_calibrated_labware_offsets

CFG = config.default_config()
CFG.scale.safe_z_offset = 10

PRELOADED_SCALE_DEF = None

liquid_level = LiquidTracker()


def connect_to_scale_and_temp_sensor(is_simulating: bool) -> Tuple[RadwagScaleBase, AsairSensorBase]:
    if is_simulating:
        return SimRadwagScale()
    vid, pid = RadwagScaleBase.vid_pid()
    try:
        scale_port = find_port(vid=vid, pid=pid)
    except RuntimeError:
        # also try looking for the RS232 USB adapter cable
        scale_port = find_port(vid=1659, pid=8963)
    vid, pid = AsairSensorBase.vid_pid()
    temp_port = find_port(vid=vid, pid=pid)
    return scale, temp_sensor


def init_liquid_tracking(plate, vial):
    # LIQUID TRACKING
    for c in [plate, vial]:
        for w in c.wells():
            # NOTE: For Corning 3631, assuming a perfect cylinder creates
            #       an error of -0.78mm when Corning 3631 plate is full (~360uL)
            #       This means the software will think the liquid is
            #       0.78mm lower than it is in reality. To make it more
            #       accurate, give .init_liquid_height() a lookup table
            liquid_level.init_liquid_height(w)
    # add 10mm of clearance from calibrated liquid-level in vial
    liquid_level.set_start_volume_from_liquid_height(
        vial['A1'], vial['A1'].depth - CFG.scale.safe_z_offset, name='Water')


def test_drop_tip(pipette):
    if CFG.pipette.use_trash:
        pipette.drop_tip(home_after=False)
    else:
        pipette.return_tip(home_after=False)


def test_aspirate_dispense(
        protocol, pipette, well, aspirate=None, dispense=None,
        on_pre_submerge=None, on_post_emerge=None):
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
        on_pre_submerge=on_pre_submerge, on_post_emerge=on_post_emerge)
    if pip_ch > 1 and not is_trough:
        wells = [w for w in well.parent.columns_by_name()[well.well_name[1:]]]
        assert well in wells, 'Well is not inside column'
    else:
        wells = [well]
    for w in wells:
        liquid_level.update_well_volume(
            w, after_aspirate=liq_lvl_asp, after_dispense=liq_lvl_disp)


def test_gravimetric(protocol, pipette, vial, scale, temp_sensor):
    def _take_reading():
        g = scale.read_continuous()
        c, h = temp_sensor.get_reading()
        # TODO: consider saving relevant configurations:
        #       - aspirate/dispense speed
        #       - submerge speed/depth
        #       - etc.
        return data.GravimetricReading(
            timestamp=time.time(), grams=g, celsius=c, humidity=h)

    def _on_pre_aspirate():
        test_data.cache_reading(pre_aspirate=_take_reading())
        scale.open_lid()

    def _on_post_aspirate():
        scale.close_lid()
        test_data.cache_reading(post_aspirate=_take_reading())

    def _on_pre_dispense():
        test_data.cache_reading(pre_dispense=_take_reading())
        scale.open_lid()

    def _on_post_dispense():
        scale.close_lid()
        test_data.cache_reading(post_dispense=_take_reading())

    def _print_latest_reading():
        s = test_data.current_sample
        gram_diff_aspirate = s.post_aspirate.grams - s.pre_aspirate.grams
        gram_diff_dispense = s.post_dispense.grams - s.pre_dispense.grams
        gram_diff_aspirate = round(abs(gram_diff_aspirate), 5)
        gram_diff_dispense = round(abs(gram_diff_dispense), 5)
        print(f'\tAspirated {gram_diff_aspirate} grams'
              f'\n\tDispensed {gram_diff_dispense} grams')

    # first, move to the liquid surface, and allow the tester
    # to add more liquid if needed
    pipette.pick_up_tip()
    vial_liq_lvl = liquid_level.get_liquid_height(vial['A1'])
    pipette.move_to(vial['A1'].bottom(vial_liq_lvl + 5))
    if not protocol.is_simulating() and __name__ == '__main__':
        input('Ready to touch the liquid? (press ENTER)')
    pipette.move_to(vial['A1'].bottom(vial_liq_lvl))
    if not protocol.is_simulating() and __name__ == '__main__':
        input('Press ENTER when tip is touching liquid')
    test_drop_tip(pipette)

    for i in range(CFG.num_samples):
        print(f'GRAV ({i + 1}/{CFG.num_samples})')
        if not pipette.has_tip:
            pipette.pick_up_tip()
        test_data.create_new_sample(CFG.volume)
        test_aspirate_dispense(
            protocol, pipette, vial['A1'],
            aspirate=CFG.volume,
            on_pre_submerge=_on_pre_aspirate,
            on_post_emerge=_on_post_aspirate)
        test_aspirate_dispense(
            protocol, pipette, vial['A1'],
            dispense=CFG.volume,
            on_pre_submerge=_on_pre_dispense,
            on_post_emerge=_on_post_dispense)
        _print_latest_reading()
        if not protocol.is_simulating():
            test_data.save_current_sample_to_file()
        if CFG.pipette.change_tip:
            test_drop_tip(pipette)
    if pipette.has_tip:
        test_drop_tip(pipette)
    test_data.print_summary()


def run(protocol: protocol_api.ProtocolContext):
    assert CFG.volume > 0
    assert len(CFG.plate_rows) == len(CFG.trough_cols)

    start_timestamp = time.time()
    print(f'Time: {datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}')

    items = load_labware_and_pipettes(
        protocol, vial_def=PRELOADED_SCALE_DEF)

    # FIXME: make this configurable outside script source code
    if __name__ == '__main__':
        apply_calibrated_labware_offsets(items)
    # must be after protocol.apply_calibrated_labware_offsets()
    motions.apply_additional_offset_to_labware(
        items.vial, z=CFG.scale.safe_z_offset)
    # must be after all offsets/addition_offsets are applied
    init_liquid_tracking(plate=items.plate, trough=items.trough, vial=items.vial)

    # PIPETTE
    motions.apply_pipette_speeds(items.pipette)
    motions.apply_pipette_speeds(items.multi)
    # FIXME: make this work with multi too
    items.pipette.starting_tip = items.tiprack[CFG.start_tip]

    # EQUIPMENT
    scale, temp_sensor = connect_to_scale_and_temp_sensor(protocol.is_simulating())

    # RUN
    liquid_level.print_setup_instructions(
        user_confirm=not protocol.is_simulating())
    test_gravimetric(protocol, items.pipette, items.vial, scale, temp_sensor)


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
                        help='If set, pipette will change tips between each transfer')
    parser.add_argument("--simulate", action='store_true',
                        help='If set, the protocol will be simulated')
    parser.add_argument("--grav", action='store_true',
                        help='If set, the protocol will measure weight with the scale')
    parser.add_argument("--photo", action='store_true',
                        help='If set, the protocol will transfer Dye to a plate')
    parser.add_argument("--baseline", action='store_true',
                        help='If set, the protocol will transfer Baseline to a plate')
    parser.add_argument("--plate-on-scale", action='store_true',
                        help='If set, the protocol will transfer Dye to a plate')
    parser.add_argument("--evaporation", action='store_true',
                        help='If set, the scale will FOREVER read and print the')
    parser.add_argument("--peripherals", action='store_true',
                        help='If set, all peripherals will be tested')
    args = parser.parse_args()

    CFG.data.directory = args.data_dir
    CFG.num_samples = args.num_samples
    CFG.plate_rows = args.rows
    CFG.trough_cols = args.dye_cols
    CFG.volume = args.volume
    CFG.inspect = args.inspect
    CFG.scale.use_lid = args.lid
    CFG.pipette.use_trash = args.trash
    CFG.pipette.change_tip = args.change_tip
    CFG.grav = args.grav
    CFG.photo = args.photo
    CFG.baseline = args.baseline
    CFG.plate_on_scale = args.plate_on_scale
    CFG.start_tip = args.start_tip
    CFG.measure_evaporation = args.evaporation

    if args.peripherals:
        _scale, _temp_sensor = connect_to_scale_and_temp_sensor(args.simulate)
        while True:
            print('\nTesting Peripherals:')
            print(f'\tTemp-Sensor: {_temp_sensor.get_reading()}')
            print(f'\tScale: {_scale.read_continuous()}')

    print(f'\nTest config:\n\n{CFG}')
    input('\nTest config looks good?')

    PRELOADED_SCALE_DEF = load_radwag_vial_definition()

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
