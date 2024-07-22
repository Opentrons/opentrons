"""Measure Tip Overlap."""
from opentrons.types import Point
from opentrons.protocol_api import ProtocolContext, OFF_DECK

metadata = {"protocolName": "measure-tip-overlap"}
requirements = {"robotType": "Flex", "apiLevel": "2.19"}

TIP_SIZE = 50
PIPETTE_SIZE = 1000
PIPETTE_CHANNELS = 1

SLOT_TIPRACK = "D3"
SLOT_DIAL = "B3"

CHANNEL_OFFSETS = {
    "A1": Point(),
    "H1": Point(y=9 * 7),
    "H12": Point(y=9 * 7, x=9 * -11),
}
TEST_CHANNELS = {
    1: ["A1"],
    8: ["A1", "H1"],
    96: ["A1", "H12"],
}


def run(ctx: ProtocolContext) -> None:
    """Run."""
    trash = ctx.load_trash_bin("A3")
    pip_name = f"flex_{PIPETTE_CHANNELS}channel_{PIPETTE_SIZE}"
    rack_name = f"opentrons_flex_96_tiprack_{TIP_SIZE}uL"

    pipette = ctx.load_instrument(pip_name, "left")
    dial = ctx.load_labware("dial_indicator", SLOT_DIAL)
    test_pos = dial["A1"].top()

    def _move_channels_to_dial_indicator() -> None:
        for ch in TEST_CHANNELS[pipette.channels]:
            pipette.move_to(test_pos.move(CHANNEL_OFFSETS[ch]))
            ctx.pause(f"[{ch}] record dial position")
            # TODO: robot could read from device over usb serial...

    tip_length = None
    ctx.pause("ready to measure NOZZLE...")
    _move_channels_to_dial_indicator()

    num_tip_racks = 10 if pipette.channels == 96 else 1
    for _ in range(num_tip_racks):
        rack = ctx.load_labware(rack_name, SLOT_TIPRACK)
        if pipette.channels == 96:
            tips = rack["A1"]
        else:
            tips = rack.rows()[0]
        for tip in tips:
            ctx.pause("ready to test next TIP...")
            # NOTE: (sigler) prioritize testing all-tip pickups over partial-tip pickups
            pipette.pick_up_tip(tip)
            if tip_length is None:
                tip_length = 10.0
            _move_channels_to_dial_indicator()
            pipette.drop_tip(trash)  # trash them, no re-using tips for this test
        ctx.move_labware(rack, OFF_DECK, use_gripper=False)
        ctx.pause("replace with NEW tips")
