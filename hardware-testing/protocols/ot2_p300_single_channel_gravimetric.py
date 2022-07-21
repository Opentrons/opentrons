"""OT2 P300 Single Channel Gravimetric Test."""
from pathlib import Path

from opentrons.protocol_api import ProtocolContext

from hardware_testing.data import create_run_id
from hardware_testing.labware.position import \
    VIAL_SAFE_Z_OFFSET, overwrite_default_labware_positions
from hardware_testing.labware.layout import \
    LayoutLabware, DEFAULT_SLOTS_GRAV
from hardware_testing.liquid.height import LiquidTracker
from hardware_testing.liquid.defaults import \
    DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE
from hardware_testing.measure.weight import \
    GravimetricRecorder, GravimetricRecorderConfig
from hardware_testing.opentrons_api.helpers import get_api_context
from hardware_testing.pipette.liquid_class import PipetteLiquidClass

metadata = {"apiLevel": "2.12",
            "protocolName": "ot2-p300-single-channel-gravimetric"}

PIP_MODEL = 'p300_single_gen2'
PIP_MOUNT = 'left'
VOLUMES = [200]
NUM_SAMPLES_PER_VOLUME = 12


def _test_gravimetric(
    liq_pipette: PipetteLiquidClass,
    layout: LayoutLabware,
    liquid_level: LiquidTracker,
) -> None:

    samples = [v for v in VOLUMES for _ in range(NUM_SAMPLES_PER_VOLUME)]
    if liq_pipette.pipette.has_tip:
        liq_pipette.pipette.drop_tip()
    grav_well = layout.vial['A1']  # type: ignore[index]
    for i, sample_volume in enumerate(samples):
        print(f'{i + 1}/{len(samples)}: {sample_volume} uL')
        liq_pipette.create_empty_timestamp(tag=str(sample_volume))
        liq_pipette.pipette.pick_up_tip()
        liq_pipette.aspirate(sample_volume, grav_well,
                             liquid_level=liquid_level)
        liq_pipette.dispense(sample_volume, grav_well,
                             liquid_level=liquid_level)
        liq_pipette.pipette.drop_tip()
        liq_pipette.save_latest_timestamp()


def _run(protocol: ProtocolContext) -> None:
    # RUN ID (for labelling data)
    run_id = create_run_id()

    # LABWARE
    labware_defs_dir = Path(__file__).parent / 'definitions'
    layout = LayoutLabware.build(
        protocol, DEFAULT_SLOTS_GRAV,
        tip_volume=300, definitions_dir=labware_defs_dir
    )
    overwrite_default_labware_positions(protocol, layout=layout)

    # LIQUID-LEVEL TRACKING
    liquid_level = LiquidTracker()
    liquid_level.initialize_from_deck(protocol)
    grav_well = layout.vial['A1']  # type: ignore[index]
    liquid_level.set_start_volume_from_liquid_height(
        grav_well, grav_well.depth - VIAL_SAFE_Z_OFFSET, name='Water'
    )

    # PIPETTE and LIQUID CLASS
    liq_pipette = PipetteLiquidClass(
        ctx=protocol,
        model=PIP_MODEL,
        mount=PIP_MOUNT,
        tip_racks=[layout.tiprack],  # type: ignore[list-item]
        test_name=metadata['protocolName'],
        run_id=run_id
    )
    liq_pipette.set_liquid_class(DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE)
    liq_pipette.record_timestamp_enable()

    # SCALE RECORDER
    recorder = GravimetricRecorder(protocol, GravimetricRecorderConfig(
        test_name=metadata['protocolName'], run_id=run_id, tag=liq_pipette.unique_name,
        duration=0, frequency=10, stable=False
    ))
    recorder.activate()

    # ASK USER TO SETUP LIQUIDS
    liquid_level.print_setup_instructions(
        user_confirm=not protocol.is_simulating())

    # Run the test, recording the entire time
    liq_pipette.clear_timestamps()
    recorder.record(in_thread=True)
    try:
        recorder.record_start()
        _test_gravimetric(liq_pipette, layout, liquid_level)
    finally:
        recorder.record_stop()

    # TODO: maybe add a way to determine if the entire test
    #       data is ok (eg: search for sudden noise events
    #       that don't align with a pipetting timestamp)
    # TODO: use timestamps to figure out when in recording
    #       to isolate each transfer
    # TODO: after isolating each transfer, calculate volume
    #       of each dispense
    # TODO: after each dispense volume is calculated, then
    #       calculate the %CV and %D, print results
    # TODO: figure out outside of this script
    _scale_recording = recorder.recording
    _pipette_action_timestamps = liq_pipette.get_timestamps()


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser('Pipette Testing')
    parser.add_argument(
        '--simulate', action='store_true',
        help='If set, the protocol will be simulated'
    )
    args = parser.parse_args()
    ctx = get_api_context(metadata['apiLevel'], is_simulating=args.simulate)
    ctx.home()
    _run(ctx)
