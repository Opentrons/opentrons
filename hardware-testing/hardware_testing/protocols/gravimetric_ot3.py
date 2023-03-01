"""OT3 P1000 Single Channel Gravimetric Test."""
import argparse
from pathlib import Path

from opentrons.protocol_api import ProtocolContext
from opentrons.config import infer_config_base_dir, IS_ROBOT

from hardware_testing.gravimetric import execute
from hardware_testing.gravimetric import helpers


metadata = {"apiLevel": "2.13", "protocolName": "ot3-p50-single-channel-gravimetric"}

PIPETTE_VOLUME = 50
TIP_VOLUME = 50


def _run(protocol: ProtocolContext) -> None:
    if IS_ROBOT:
        labware_dir = infer_config_base_dir() / "testing_data" / "labware-definitions"
    else:
        labware_dir = Path(__file__).parent.parent.parent / "labware-definitions"
    execute.run(
        protocol,
        execute.ExecuteGravConfig(
            name=metadata["protocolName"],
            pipette_volume=PIPETTE_VOLUME,
            pipette_mount="left",
            tip_volume=TIP_VOLUME,
            labware_dir=labware_dir,
            trials=10,
        ),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument(
        "--simulate", action="store_true", help="If set, the protocol will be simulated"
    )
    args = parser.parse_args()
    _ctx = helpers.get_api_context(
        metadata["apiLevel"],
        is_simulating=args.simulate,
        pipette_left="p50_single_v3.3",
    )
    _ctx.home()
    _run(_ctx)
