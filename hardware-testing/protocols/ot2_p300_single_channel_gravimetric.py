from opentrons.protocol_api import ProtocolContext, InstrumentContext, labware

from hardware_testing.labware.position import VIAL_SAFE_Z_OFFSET
from hardware_testing.labware.layout import LayoutLabware, DEFAULT_SLOTS_GRAV
from hardware_testing.liquid.height import LiquidTracker
from hardware_testing.liquid.liquid_class import LIQUID_CLASS_OT2_P300_SINGLE
from hardware_testing.measure.weight import GravimetricRecorder
from hardware_testing.opentrons_api.helpers import get_api_context
from hardware_testing.pipette import motions
from hardware_testing.labware.position import overwrite_default_labware_positions

metadata = {
    'apiLevel': '2.12',
    'protocolName': 'ot2_p300_single_channel_gravimetric'
}

VOLUMES = [20, 150, 290]
NUM_SAMPLES_PER_VOLUME = 10


def test_gravimetric(protocol: ProtocolContext,
                     pipette: InstrumentContext,
                     layout: LayoutLabware,
                     liquid_level: LiquidTracker,
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

    samples = [v for v in VOLUMES for _ in range(NUM_SAMPLES_PER_VOLUME)]
    if pipette.has_tip:
        pipette.drop_tip()
    for sample_volume in samples:
        pipette.pick_up_tip()
        motions.pipette_liquid_settings(
            protocol, pipette, layout.vial['A1'],
            LIQUID_CLASS_OT2_P300_SINGLE, liquid_level,
            aspirate=sample_volume,
            on_pre_submerge=_on_pre_aspirate,
            on_post_emerge=_on_post_aspirate)
        motions.pipette_liquid_settings(
            protocol, pipette, layout.vial['A1'],
            LIQUID_CLASS_OT2_P300_SINGLE, liquid_level,
            dispense=sample_volume,
            on_pre_submerge=_on_pre_dispense,
            on_post_emerge=_on_post_dispense)
        pipette.drop_tip()


def run(protocol: ProtocolContext):
    layout = LayoutLabware.build(protocol, DEFAULT_SLOTS_GRAV, tip_volume=300)
    overwrite_default_labware_positions(layout=layout)

    liquid_level = LiquidTracker()
    liquid_level.initialize_from_deck(protocol)
    liquid_level.set_start_volume_from_liquid_height(
        layout.vial['A1'], layout.vial['A1'].depth - VIAL_SAFE_Z_OFFSET, name='Water')

    pipette = protocol.load_instrument('p300_single_gen2', 'left', tip_racks=[layout.tiprack])
    motions.apply_pipette_speeds(pipette, LIQUID_CLASS_OT2_P300_SINGLE)

    recorder = GravimetricRecorder(protocol, test_name=metadata['protocolName'])
    recorder.set_tag(pipette.name)  # FIXME: get the serial number of the pipette

    liquid_level.print_setup_instructions(user_confirm=not protocol.is_simulating())
    test_gravimetric(protocol, pipette, layout, liquid_level, recorder)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument("--simulate", action='store_true',
                        help='If set, the protocol will be simulated')
    args = parser.parse_args()
    ctx = get_api_context(metadata['apiLevel'], is_simulating=args.simulate)
    ctx.home()
    run(ctx)
