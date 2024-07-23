"""Measure Tip Overlap."""
from opentrons.types import Point
from opentrons.protocol_api import ProtocolContext, OFF_DECK

metadata = {"protocolName": "empty-wells-p1000-single"}
requirements = {"robotType": "Flex", "apiLevel": "2.19"}

NUM_TRIALS = 10

TIP_SIZE = 50
PIPETTE_SIZE = 1000
PIPETTE_CHANNELS = 1

LABWARE = "corning_96_wellplate_360ul_flat"

SLOT_TIPRACK = "D3"
SLOT_LABWARE = "D1"


def run(ctx: ProtocolContext) -> None:
    """Run."""
    trash = ctx.load_trash_bin("A3")
    pip_name = f"flex_{PIPETTE_CHANNELS}channel_{PIPETTE_SIZE}"
    rack_name = f"opentrons_flex_96_tiprack_{TIP_SIZE}uL"

    rack = ctx.load_labware(rack_name, SLOT_TIPRACK)
    pipette = ctx.load_instrument(pip_name, "left", tip_racks=[rack])
    labware = ctx.load_labware(LABWARE, SLOT_LABWARE)

    # collect a list of wells to test
    test_wells = [labware["A1"]]
    if pipette.channels == 8:
        test_wells.append(labware["A12"])
    if pipette.channels == 1:
        test_wells.append(labware["H1"])
        test_wells.append(labware["H12"])

    # collect a list of which tips to test with
    if pipette.channels == 96:
        test_tips = [rack["A1"]]
    elif pipette.channels == 8:
        test_tips = rack.rows()[0][:NUM_TRIALS]
    else:
        test_tips = rack.wells()[:NUM_TRIALS]

    trial_counter = 0  # 1x trial per each tip-pick-up
    fail_counter = 0
    while trial_counter < NUM_TRIALS:
        if trial_counter > 0:
            pipette.reset_tipracks()
            ctx.pause("replace with NEW tips")
        for tip in test_tips:
            # NOTE: (sigler) prioritize testing all-tip pickups over partial-tip pickups
            pipette.pick_up_tip(tip)
            for well in test_wells:
                found = pipette.detect_liquid_presence(well)
                if found:
                    fail_counter += 1
                    ctx.pause(f"ERROR: false positive at well {well.well_name} ({fail_counter} total)")
            pipette.drop_tip(trash)  # trash them, no re-using tips for this test
            trial_counter += 1  # trial is over after dropping the tips
    ctx.pause(f"NOTE: total false positives = {fail_counter}")
