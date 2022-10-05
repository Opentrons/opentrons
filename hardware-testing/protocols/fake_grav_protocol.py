"""Fake Grav Protocol."""
from opentrons.protocol_api import ProtocolContext

metadata = {"apiLevel": "2.12"}


def run(ctx: ProtocolContext) -> None:
    """Run."""
    tiprack = ctx.load_labware("opentrons_ot3_96_tiprack_50uL", "8")
    # vial = ctx.load_labware("radwag_pipette_calibration_vial", "6")
    pipette = ctx.load_instrument("p1000_single_gen3", "left", tip_racks=[tiprack])
    pipette.pick_up_tip()
    # pipette.aspirate(pipette.min_volume, vial["A1"])
    # pipette.dispense(pipette.min_volume, vial["A1"])
    pipette.drop_tip()


if __name__ == "__main__":
    import argparse
    from hardware_testing.opentrons_api import helpers
    parser = argparse.ArgumentParser("Fake Protocol")
    parser.add_argument(
        "--simulate", action="store_true", help="If set, the protocol will be simulated"
    )
    args = parser.parse_args()
    _ctx = helpers.get_api_context(metadata["apiLevel"], is_simulating=args.simulate)
    _ctx.home()
    run(_ctx)
