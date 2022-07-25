"""OT2 P300 Single Channel Gravimetric Test."""
from pathlib import Path
from opentrons.protocol_api import ProtocolContext
from hardware_testing.execute import gravimetric

metadata = {"apiLevel": "2.12",
            "protocolName": "ot2-p300-single-channel-gravimetric"}

PIP_VOLUME = 300
PIP_MOUNT = 'left'
VOLUMES = [200]
NUM_SAMPLES_PER_VOLUME = 12
LABWARE_DIR = Path(__file__).parent / 'definitions'


def _run(protocol: ProtocolContext) -> None:
    setup_cfg = gravimetric.SetupConfig(
        name=metadata['protocolName'],
        pipette_volume=PIP_VOLUME,
        pipette_mount=PIP_MOUNT,
        labware_dir=LABWARE_DIR
    )
    liq_pipette, liq_tracker, layout, recorder = gravimetric.setup(protocol, setup_cfg)
    liq_tracker.print_setup_instructions(
        user_confirm=not protocol.is_simulating())
    gravimetric.run(liq_pipette, layout, liq_tracker, recorder,
                    VOLUMES, NUM_SAMPLES_PER_VOLUME)
    gravimetric.analyze(recorder, liq_pipette)


if __name__ == '__main__':
    import argparse
    from hardware_testing.opentrons_api import helpers
    parser = argparse.ArgumentParser('Pipette Testing')
    parser.add_argument(
        '--simulate', action='store_true',
        help='If set, the protocol will be simulated'
    )
    args = parser.parse_args()
    _ctx = helpers.get_api_context(metadata['apiLevel'], is_simulating=args.simulate)
    _ctx.home()
    _run(_ctx)
