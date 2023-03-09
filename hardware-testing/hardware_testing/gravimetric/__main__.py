"""Gravimetric OT3."""
import argparse
from typing import List

from opentrons.protocol_api import ProtocolContext

from hardware_testing.protocols.gravimetric_lpc_ot3 import (
    SLOTS_TIPRACK,
    SLOT_VIAL,
    metadata,
    requirements,
)

from . import execute, helpers, workarounds
from .config import GravimetricConfig

LABWARE_OFFSETS: List[dict] = list()


def run(
    protocol: ProtocolContext,
    pipette_volume: int,
    tip_volume: int,
    trials: int,
    increment: bool,
    low_volume: bool,
) -> None:
    """Run."""
    execute.run(
        protocol,
        GravimetricConfig(
            name=metadata["protocolName"],
            pipette_mount="left",
            pipette_volume=pipette_volume,
            tip_volume=tip_volume,
            trials=trials,
            labware_offsets=LABWARE_OFFSETS,
            slot_vial=SLOT_VIAL,
            slot_tiprack=SLOTS_TIPRACK[tip_volume][0],
            increment=increment,
            low_volume=low_volume,
        ),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--pipette", type=int, choices=[50, 1000], required=True)
    parser.add_argument("--tip", type=int, choices=[50, 200, 1000], required=True)
    parser.add_argument("--trials", type=int, required=True)
    parser.add_argument("--increment", action="store_true")
    parser.add_argument("--low-volume", action="store_true")
    parser.add_argument("--skip-labware-offsets", action="store_true")
    args = parser.parse_args()
    if not args.simulate and not args.skip_labware_offsets:
        # getting labware offsets must be done before creating the protocol context
        # because it requires the robot-server to be running
        for offset in workarounds.http_get_all_labware_offsets():
            LABWARE_OFFSETS.append(offset)
    _ctx = helpers.get_api_context(
        requirements["apiLevel"],
        is_simulating=args.simulate,
        pipette_left=f"p{args.pipette}_single_v3.3",
    )
    run(_ctx, args.pipette, args.tip, args.trials, args.increment, args.low_volume)
