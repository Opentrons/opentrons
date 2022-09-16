"""OT2 P300 Single Channel Gravimetric Test."""
import argparse
from pathlib import Path

from opentrons.protocol_api import ProtocolContext

from hardware_testing.execute import gravimetric
from hardware_testing.opentrons_api import helpers

metadata = {"apiLevel": "2.12", "protocolName": "ot2-p300-single-channel-gravimetric"}

TEST_VIAL_LIQUID = False


def _move_to_vial_liquid_surface(
    ctx: ProtocolContext, items: gravimetric.ExecuteGravItems
) -> None:
    vial_well = items.layout.vial["A1"]  # type: ignore[index]
    expected_height = items.liquid_tracker.get_liquid_height(vial_well)
    items.liquid_pipette.pipette.pick_up_tip()
    items.liquid_pipette.pipette.move_to(vial_well.bottom(expected_height))
    ctx.pause("Check that tip is touching liquid surface (+/-) 0.1 mm")
    items.liquid_pipette.pipette.drop_tip()


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
    if TEST_VIAL_LIQUID:
        _move_to_vial_liquid_surface(protocol, items)
    gravimetric.run(protocol, items, volumes=[200.0], samples=12)
    gravimetric.analyze(protocol, items)


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
    _ctx = helpers.get_api_context(metadata["apiLevel"], is_simulating=args.simulate)
    _ctx.home()
    _run(_ctx)
