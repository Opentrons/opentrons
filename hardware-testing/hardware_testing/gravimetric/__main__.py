"""Gravimetric OT3."""
import argparse
from typing import List

from opentrons.protocol_api import ProtocolContext

from hardware_testing.data import ui
from hardware_testing.protocols.gravimetric_ot3_p50 import (
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
    starting_tip: str,
    increment: bool,
    low_volume: bool,
    return_tip: bool,
    blank: bool,
    mix: bool,
    inspect: bool,
    user_volumes: bool,
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
            starting_tip=starting_tip,
            labware_offsets=LABWARE_OFFSETS,
            slot_vial=SLOT_VIAL,
            slots_tiprack=SLOTS_TIPRACK[tip_volume],
            increment=increment,
            low_volume=low_volume,
            return_tip=return_tip,
            blank=blank,
            mix=mix,
            inspect=inspect,
            user_volumes=user_volumes,
        ),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--pipette", type=int, choices=[50, 1000], required=True)
    parser.add_argument("--tip", type=int, choices=[50, 200, 1000], required=True)
    parser.add_argument("--trials", type=int, required=True)
    starting_tip_choices = [
        f"{row}{col + 1}" for row in "ABCDEFGH" for col in list(range(12))
    ]
    parser.add_argument(
        "--starting-tip", type=str, choices=starting_tip_choices, required=True
    )
    parser.add_argument("--increment", action="store_true")
    parser.add_argument("--low-volume", action="store_true")
    parser.add_argument("--return-tip", action="store_true")
    parser.add_argument("--skip-labware-offsets", action="store_true")
    parser.add_argument("--blank", action="store_true")
    parser.add_argument("--mix", action="store_true")
    parser.add_argument("--inspect", action="store_true")
    parser.add_argument("--user-volumes", action="store_true")
    args = parser.parse_args()
    if not args.simulate and not args.skip_labware_offsets:
        # getting labware offsets must be done before creating the protocol context
        # because it requires the robot-server to be running
        ui.print_title("SETUP")
        print("Starting opentrons-robot-server, so we can http GET labware offsets")
        offsets = workarounds.http_get_all_labware_offsets()
        print(f"found {len(offsets)} offsets:")
        for offset in offsets:
            print(f"\t{offset['createdAt']}:")
            print(f"\t\t{offset['definitionUri']}")
            print(f"\t\t{offset['vector']}")
            LABWARE_OFFSETS.append(offset)
    _ctx = helpers.get_api_context(
        requirements["apiLevel"],
        is_simulating=args.simulate,
        pipette_left=f"p{args.pipette}_single_v3.3",
    )
    run(
        _ctx,
        args.pipette,
        args.tip,
        args.trials,
        args.starting_tip,
        args.increment,
        args.low_volume,
        args.return_tip,
        args.blank,
        args.mix,
        args.inspect,
        args.user_volumes,
    )
