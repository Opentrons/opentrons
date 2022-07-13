import time
from datetime import datetime

from opentrons import protocol_api, execute, simulate

from hardware_testing import config, data
from hardware_testing.drivers.utils import (
    connect_to_scale_and_temp_sensor,
    load_radwag_vial_definition
)
from hardware_testing.pipetting import liquid_level, motions
from hardware_testing.protocol import metadata, load_labware_and_pipettes, apply_calibrated_labware_offsets

CFG = config.default_config()
CFG.scale.safe_z_offset = 10

PRELOADED_SCALE_DEF = None


def init_liquid_tracking(plate, trough, vial):
    # LIQUID TRACKING
    for c in [plate, trough, vial]:
        for w in c.wells():
            # NOTE: For Corning 3631, assuming a perfect cylinder creates
            #       an error of -0.78mm when Corning 3631 plate is full (~360uL)
            #       This means the software will think the liquid is
            #       0.78mm lower than it is in reality. To make it more
            #       accurate, give .init_liquid_height() a lookup table
            liquid_level.init_liquid_height(w)
    if CFG.photo:
        for col in CFG.trough_cols:
            dye_well = trough[f'A{col}']
            if not liquid_level.get_volume(dye_well):
                liquid_level.add_start_volume(dye_well, 3000)
            liquid_level.add_start_volume(
                dye_well, CFG.volume * CFG.num_samples, name='Dye')
    # always assume baseline is in the final x2 troughs
    if CFG.baseline or CFG.plate_on_scale:
        vol_per_transfer = CFG.volume * 8
        dead_vol = 3000
        vol_needed = vol_per_transfer * 6  # 6 columns (half the plate)
        for col in ['11', '12']:
            baseline_well = trough[f'A{col}']
            if not liquid_level.get_volume(baseline_well):
                liquid_level.add_start_volume(baseline_well, dead_vol)
            liquid_level.add_start_volume(baseline_well, vol_needed, name='Baseline')
    if CFG.grav:
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


def test_evaporation(scale, temp_sensor, test_data):
    print('Measuring evaporation (ENTER when ready)')
    print('DATA:\n-----\n')
    print('seconds,milligrams,celsius,humidity')
    start_time = time.time()

    def _take_reading():
        _t = time.time()
        _mg = scale.read_continuous() * 1000
        _c, _h = temp_sensor.get_reading()
        return _t, _mg, _c, _h

    start_t, start_mg, _, _ = _take_reading()
    while True:
        t, mg, c, h = _take_reading()
        print(f'{t - start_t},{start_mg - mg},{c},{h}')
        time.sleep(0.1)


def test_gravimetric(protocol, pipette, vial, scale, temp_sensor, test_data):
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
        test_aspirate_dispense(
            protocol, pipette, src_well, aspirate=CFG.volume)
        test_aspirate_dispense(
            protocol, pipette, target_well, dispense=CFG.volume)
        if CFG.pipette.change_tip:
            test_drop_tip(pipette)
    if pipette.has_tip:
        test_drop_tip(pipette)


def fill_plate_with_baseline(protocol, multi, trough, plate):
    # hard-coded wells for baseline in trough
    source_wells = [
        trough['A11'], trough['A11'], trough['A11'], trough['A11'], trough['A11'], trough['A11'],
        trough['A12'], trough['A12'], trough['A12'], trough['A12'], trough['A12'], trough['A12'],
    ]
    target_cols = [w for w in plate.rows_by_name()['A']]  # every column on the plate
    fill_plate_with_multi(protocol, multi, volume=200,
                          source_wells=source_wells, target_wells=target_cols)


def fill_plate_with_dye(protocol, multi, trough, plate, scale, temp_sensor):
    # hard-coded wells for baseline in trough
    source_wells = [
        trough['A11'], trough['A11'], trough['A11'], trough['A11'], trough['A11'], trough['A11'],
        trough['A12'], trough['A12'], trough['A12'], trough['A12'], trough['A12'], trough['A12'],
    ]
    target_wells = [w for w in plate.rows_by_name()['A']]  # every column on the plate
    dispense_count = 0
    start_sample = (0, 0, 0, 0)
    end_sample = (0, 0, 0, 0)

    def _take_reading():
        g = scale.read_continuous()
        c, h = temp_sensor.get_reading()
        return time.time(), g, c, h

    def _on_pre_dispense():
        nonlocal dispense_count, start_sample
        dispense_count += 1  # counter starts at well A1
        if dispense_count == 1:
            start_sample = _take_reading()

    def _on_post_dispense():
        nonlocal end_sample
        if dispense_count == 12:
            end_sample = _take_reading()

    fill_plate_with_multi(protocol, multi, volume=200,
                          source_wells=source_wells, target_wells=target_wells,
                          on_pre_dispense=_on_pre_dispense, on_post_dispense=_on_post_dispense)
    print('Plate-on-Scale Results:')
    print(f'\tTotal Grams Dispensed: {end_sample[1] - start_sample[1]}')
    print(f'\tTotal Seconds Elapsed: {end_sample[0] - start_sample[0]}')


def fill_plate_with_multi(protocol, multi, volume, source_wells, target_wells,
                          on_pre_aspirate=None, on_post_aspirate=None,
                          on_pre_dispense=None, on_post_dispense=None):
    assert len(source_wells) == len(target_wells), \
        f'{source_wells} not same length as {target_wells}' \
        f' ({len(source_wells)} != {len(target_wells)})'
    for i, (src_well, target_well) in enumerate(zip(source_wells, target_wells)):
        print(f'FILL ({i + 1}/{len(target_wells)})')
        print(f'\t(200uL) trough[{src_well.well_name}] '
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
            on_post_emerge=on_post_dispense)
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
    test_data_filename = f'{items.pipette.hw_pipette["pipette_id"]}'
    test_data = data.GravimetricTestData(
        directory=CFG.data.directory, filename=test_data_filename)

    # RUN
    liquid_level.print_setup_instructions(
        user_confirm=not protocol.is_simulating())
    if CFG.baseline:
        fill_plate_with_baseline(
            protocol, items.multi, items.trough, items.plate)
    if CFG.plate_on_scale:
        fill_plate_with_dye(
            protocol, items.multi, items.trough,
            items.plate, scale, temp_sensor)
    if CFG.photo:
        test_photometric(protocol, items.pipette, items.trough, items.plate)
        print(f'Time: {datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}')
        if not protocol.is_simulating():
            input('Done transferring dye:'
                  '\n\t1) Add SEAL to top of plate'
                  '\n\t2) Remove plate from OT2'
                  '\n\t3) Press ENTER to continue test')
        print(f'Time: {datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}')
    if CFG.grav:
        print(f'Time: {datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}')
        test_gravimetric(protocol, items.pipette, items.vial, scale, temp_sensor, test_data)
        print(f'Time: {datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}')
        print('\n\n\nFULL CSV DATA:\n\n')
        test_data.print_full_data()
    print(f'Duration: {round((time.time() - start_timestamp) / 60, 1)} minutes')
    if CFG.measure_evaporation:
        test_evaporation(scale, temp_sensor, test_data)
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
