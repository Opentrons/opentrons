"""OT2 P300 Single Channel Gravimetric Test."""
from pathlib import Path
from typing import Tuple, List

from opentrons.protocol_api import ProtocolContext

from hardware_testing.data import create_run_id_and_start_time
from hardware_testing.labware.position import \
    VIAL_SAFE_Z_OFFSET, overwrite_default_labware_positions
from hardware_testing.labware.layout import \
    LayoutLabware, DEFAULT_SLOTS_GRAV
from hardware_testing.liquid.height import LiquidTracker
from hardware_testing.liquid.defaults import \
    DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE
from hardware_testing.measure.weight import \
    GravimetricRecorder, GravimetricRecorderConfig, GravimetricRecording
from hardware_testing.opentrons_api.helpers import get_api_context
from hardware_testing.pipette.liquid_class import PipetteLiquidClass
from hardware_testing.pipette.timestamp import SampleTimestamps

metadata = {"apiLevel": "2.12",
            "protocolName": "ot2-p300-single-channel-gravimetric"}

PIP_MODEL = 'p300_single_gen2'
PIP_MOUNT = 'left'
VOLUMES = [200]
NUM_SAMPLES_PER_VOLUME = 12


def _analyze_results(recording: GravimetricRecording,
                     timestamps: List[SampleTimestamps]) -> None:
    print('analyzing')


def _setup(ctx: ProtocolContext) -> Tuple[PipetteLiquidClass,
                                          LiquidTracker,
                                          LayoutLabware,
                                          GravimetricRecorder]:
    # RUN ID (for labelling data)
    run_id, start_time = create_run_id_and_start_time()
    # LABWARE
    # NOTE: labware must be fully initialized before the liquid tracker
    labware_defs_dir = Path(__file__).parent / 'definitions'
    _layout = LayoutLabware.build(
        ctx, DEFAULT_SLOTS_GRAV,
        tip_volume=300, definitions_dir=labware_defs_dir
    )
    overwrite_default_labware_positions(ctx, layout=_layout)
    # LIQUID-LEVEL TRACKING
    _liq_track = LiquidTracker()
    _liq_track.initialize_from_deck(ctx)
    # PIPETTE and LIQUID CLASS
    _liq_pip = PipetteLiquidClass(
        ctx=ctx,
        model=PIP_MODEL,
        mount=PIP_MOUNT,
        tip_racks=[_layout.tiprack],  # type: ignore[list-item]
        test_name=metadata['protocolName'],
        run_id=run_id,
        start_time=start_time
    )
    # SCALE RECORDER
    _recorder = GravimetricRecorder(ctx, GravimetricRecorderConfig(
        test_name=metadata['protocolName'],
        run_id=run_id, tag=_liq_pip.unique_name, start_time=start_time,
        duration=0, frequency=10, stable=False
    ))
    return _liq_pip, _liq_track, _layout, _recorder


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
    _items = _setup(protocol)
    liq_pipette = _items[0]
    liq_tracker = _items[1]
    layout = _items[2]
    recorder = _items[3]

    # the vial is weird
    grav_well = layout.vial['A1']  # type: ignore[index]
    liq_tracker.set_start_volume_from_liquid_height(
        grav_well, grav_well.depth - VIAL_SAFE_Z_OFFSET, name='Water'
    )

    # assign the liquid class
    liq_pipette.set_liquid_class(DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE)

    # ASK USER TO SETUP LIQUIDS
    liq_tracker.print_setup_instructions(
        user_confirm=not protocol.is_simulating())

    # Run the test, recording the entire time
    liq_pipette.record_timestamp_enable()
    liq_pipette.clear_timestamps()
    recorder.activate()
    recorder.record(in_thread=True)
    try:
        recorder.record_start()
        _test_gravimetric(liq_pipette, layout, liq_tracker)
    finally:
        recorder.record_stop()

    _analyze_results(recorder.recording, liq_pipette.get_timestamps())


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser('Pipette Testing')
    parser.add_argument(
        '--simulate', action='store_true',
        help='If set, the protocol will be simulated'
    )
    args = parser.parse_args()
    _ctx = get_api_context(metadata['apiLevel'], is_simulating=args.simulate)
    _ctx.home()
    _run(_ctx)
