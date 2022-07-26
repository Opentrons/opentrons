"""OT2 P300 Single Channel Gravimetric Test."""
import argparse
from pathlib import Path

from opentrons.protocol_api import ProtocolContext

from hardware_testing.execute import gravimetric
from hardware_testing.opentrons_api import helpers

metadata = {"apiLevel": "2.12", "protocolName": "ot2-p300-single-channel-gravimetric"}


def _run(protocol: ProtocolContext) -> None:
    items = gravimetric.setup(
        protocol,
        gravimetric.ExecuteGravConfig(
            name=metadata["protocolName"],
            pipette_volume=300,
            pipette_mount="left",
            labware_dir=Path(__file__).parent / "definitions",
        ),
    )
    items.liquid_tracker.print_setup_instructions(protocol, user_confirm=True)
    gravimetric.run(protocol, items, volumes=[200.0], samples=12)
    gravimetric.analyze(protocol, items)


if __name__ == "__main__":
    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument(
        "--simulate", action="store_true", help="If set, the protocol will be simulated"
    )
    args = parser.parse_args()
    _ctx = helpers.get_api_context(metadata["apiLevel"], is_simulating=args.simulate)
    _ctx.home()
    _run(_ctx)
