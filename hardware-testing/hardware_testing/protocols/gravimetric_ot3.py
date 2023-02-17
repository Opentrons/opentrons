"""OT3 P1000 Single Channel Gravimetric Test."""
import argparse
from pathlib import Path

from opentrons.protocol_api import ProtocolContext, InstrumentContext
from opentrons.config import infer_config_base_dir, IS_ROBOT
from opentrons.protocol_api.labware import Well

from hardware_testing.gravimetric.liquid.height import LiquidTracker
from hardware_testing.gravimetric import execute
from hardware_testing.gravimetric import helpers


metadata = {"apiLevel": "2.13", "protocolName": "ot3-p1000-single-channel-gravimetric"}

PIPETTE_VOLUME = 50
TIP_VOLUME = 50

TEST_VIAL_LIQUID = False


def _move_to_vial_liquid_surface(
   ctx: ProtocolContext, liquid_tracker: LiquidTracker, well: Well, pipette: InstrumentContext,
) -> None:
    expected_height = liquid_tracker.get_liquid_height(well)
    pipette.pick_up_tip()
    pipette.move_to(well.bottom(expected_height))
    ctx.pause("Check that tip is touching liquid surface (+/-) 0.1 mm")
    pipette.drop_tip()


def _run(protocol: ProtocolContext) -> None:
    if IS_ROBOT:
        labware_dir = infer_config_base_dir() / "testing_data" / "labware-definitions"
    else:
        labware_dir = Path(__file__).parent.parent.parent / "labware-definitions"
    p, l, r = execute.setup(
        protocol,
        execute.ExecuteGravConfig(
            name=metadata["protocolName"],
            vial_slot=2,
            tiprack_slot=6,
            pipette_volume=PIPETTE_VOLUME,
            pipette_mount="left",
            tip_volume=TIP_VOLUME,
            labware_dir=labware_dir,
        ),
    )
    vial_well = protocol.loaded_labwares[2]["A1"]
    if TEST_VIAL_LIQUID:
        _move_to_vial_liquid_surface(protocol, l, vial_well, p.pipette)
    execute.run(protocol, p, l, r, vial_well, volumes=[45.0], samples=12)
    execute.analyze(protocol, p, r)


if __name__ == "__main__":
    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument(
        "--simulate", action="store_true", help="If set, the protocol will be simulated"
    )
    parser.add_argument(
        "--test-vial-liquid",
        action="store_true",
        help="If set, the pipette will "
        "move to the expected liquid "
        "level in the vial",
    )
    args = parser.parse_args()
    TEST_VIAL_LIQUID = args.test_vial_liquid
    _ctx = helpers.get_api_context(
        metadata["apiLevel"],
        is_simulating=args.simulate,
        pipette_left="p50_single_v3.3"
    )
    _ctx.home()
    _run(_ctx)
