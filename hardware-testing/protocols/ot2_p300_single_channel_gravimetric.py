import time
from datetime import datetime
from typing import Tuple

from opentrons.protocol_api import ProtocolContext

from hardware_testing.opentrons import get_api_context
from hardware_testing import config
from hardware_testing.labware.definitions import load_radwag_vial_definition
from hardware_testing.labware.liquid_level.liquid_level import LiquidTracker
from hardware_testing.measure.weight import GravimetricRecorder
from hardware_testing.pipette import motions
from hardware_testing.protocol import load_labware_and_pipettes, apply_calibrated_labware_offsets
from hardware_testing.protocol import PhotometricProtocolItems

metadata = {'apiLevel': '2.12', 'protocolName': 'ot2_p300_single_channel_gravimetric'}

CFG = config.default_config()
CFG.scale.safe_z_offset = 10

PRELOADED_SCALE_DEF = None

liquid_level = LiquidTracker()


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
        protocol: ProtocolContext, pipette, well, aspirate=None, dispense=None,
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


def test_gravimetric(protocol: ProtocolContext, items: PhotometricProtocolItems,
                     recorder: GravimetricRecorder):
    def _take_reading():
        # FIXME: refactor so it uses Recorder
        return

    def _on_pre_aspirate():
        # FIXME: refactor so it uses Recorder
        return

    def _on_post_aspirate():
        # FIXME: refactor so it uses Recorder
        return

    def _on_pre_dispense():
        # FIXME: refactor so it uses Recorder
        return

    def _on_post_dispense():
        # FIXME: refactor so it uses Recorder
        return

    def _print_latest_reading():
        # FIXME: refactor so it uses Recorder
        return

    # first, move to the liquid surface, and allow the tester
    # to add more liquid if needed
    pipette = items.pipette
    vial = items.vial
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
        if CFG.pipette.change_tip:
            test_drop_tip(pipette)
    if pipette.has_tip:
        test_drop_tip(pipette)


def run(protocol: ProtocolContext):
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

    # RECORDER
    recorder = GravimetricRecorder(protocol, test_name=metadata['protocolName'])
    recorder.set_tag(items.pipette.name)  # FIXME: get the serial number of the pipette

    # RUN
    liquid_level.print_setup_instructions(
        user_confirm=not protocol.is_simulating())
    test_gravimetric(protocol, items, recorder)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument("--simulate", action='store_true',
                        help='If set, the protocol will be simulated')
    args = parser.parse_args()
    # need to load custom labware definitions ourselves
    PRELOADED_SCALE_DEF = load_radwag_vial_definition()
    ctx = get_api_context(args.simulate)
    # software requires homing before run (for some reason)
    ctx.home()
    try:
        run(ctx)
    finally:
        if not args.simulate and 'y' in input('home? (y/n)').lower():
            ctx.home()
