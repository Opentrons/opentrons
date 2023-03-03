"""Gravimetric OT3."""
import argparse
from typing import List

from opentrons.protocol_api import ProtocolContext

from hardware_testing.gravimetric import execute, helpers, workarounds


# FIXME: bump to v2.14 to utilize protocol engine
metadata = {"apiLevel": "2.13", "protocolName": "gravimetric-ot3"}


def run(protocol: ProtocolContext, labware_offsets: List[dict]) -> None:
    """Run."""
    execute.run(
        protocol,
        execute.ExecuteGravConfig(
            name=metadata["protocolName"],
            pipette_mount="left",
            pipette_volume=1000,
            tip_volume=50,
            trials=10,
            labware_offsets=labware_offsets,
            slot_vial=4,
            slot_tiprack=7,
            increment=False,
            low_volume=False,
        ),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument(
        "--simulate", action="store_true", help="If set, the protocol will be simulated"
    )
    args = parser.parse_args()
    if not args.simulate:
        # getting labware offsets must be done before creating the protocol context
        # because it requires the robot-server to be running
        _offsets = workarounds.http_get_all_labware_offsets()
    else:
        _offsets = []
    _ctx = helpers.get_api_context(
        metadata["apiLevel"],
        is_simulating=args.simulate,
        pipette_left="p1000_single_v3.3",
    )
    _ctx.home()
    run(_ctx, _offsets)
