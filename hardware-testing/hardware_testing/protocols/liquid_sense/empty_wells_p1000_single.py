"""Measure Tip Overlap."""
from typing import List, Tuple

from opentrons.protocol_api import (
    ProtocolContext,
    Labware,
    Well,
    InstrumentContext,
)

###########################################
#  VARIABLES - START
###########################################
# TODO: use runtime-variables instead of constants
NUM_TRIALS = 10

TIP_SIZE = 50
PIPETTE_SIZE = 50
PIPETTE_CHANNELS = 1

LABWARE = "corning_96_wellplate_360ul_flat"

SLOT_TIPRACK = "D3"
SLOT_LABWARE = "D1"

###########################################
#  VARIABLES - END
###########################################

metadata = {"protocolName": "lld-test-empty-wells"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}

TEST_WELLS = {
    1: {
        "corning_96_wellplate_360ul_flat": ["A1", "A12", "H1", "H12"],
    },
    8: {
        "corning_96_wellplate_360ul_flat": ["A1", "A12"],
    },
    96: {
        "corning_96_wellplate_360ul_flat": ["A1"],
    },
}


def _setup(ctx: ProtocolContext) -> Tuple[InstrumentContext, Labware, Labware]:
    # TODO: use runtime-variables instead of constants
    ctx.load_trash_bin("A3")
    pip_name = f"flex_{PIPETTE_CHANNELS}channel_{PIPETTE_SIZE}"
    rack_name = f"opentrons_flex_96_tiprack_{TIP_SIZE}uL"

    rack = ctx.load_labware(rack_name, SLOT_TIPRACK)
    pipette = ctx.load_instrument(pip_name, "left")
    labware = ctx.load_labware(LABWARE, SLOT_LABWARE)

    return pipette, rack, labware


def _get_test_wells(labware: Labware, pipette: InstrumentContext) -> List[Well]:
    return [labware[w] for w in TEST_WELLS[pipette.channels][labware.load_name]]


def _get_test_tips(rack: Labware, pipette: InstrumentContext) -> List[Well]:
    if pipette.channels == 96:
        test_tips = [rack["A1"]]
    elif pipette.channels == 8:
        test_tips = rack.rows()[0][:NUM_TRIALS]
    else:
        test_tips = rack.wells()[:NUM_TRIALS]
    return test_tips


def _get_wells_with_expected_liquid_state(
    pipette: InstrumentContext, test_wells: List[Well], state: bool
) -> List[Well]:
    # NOTE: (sigler) prioritize testing all-tip pickups over partial-tip pickups
    failed_wells = []
    for well in test_wells:
        found_liquid = pipette.detect_liquid_presence(well)
        if found_liquid != state:
            failed_wells.append(well)
    return failed_wells


def _test_for_expected_liquid_state(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tips: List[Well],
    wells: List[Well],
    trials: int,
    liquid_state: bool,
) -> None:
    fail_counter = 0
    trial_counter = 0
    while trial_counter < trials:
        for tip in tips:
            pipette.pick_up_tip(tip)
            failed_wells = _get_wells_with_expected_liquid_state(
                pipette, wells, liquid_state
            )
            if failed_wells:
                ctx.pause(f"Failed: {[w.well_name for w in failed_wells]}")
            pipette.drop_tip()
            fail_counter += len(failed_wells)
            trial_counter += len(wells)
        if trial_counter < trials:
            ctx.pause("replace with NEW tips")
            pipette.reset_tipracks()
    ctx.pause(f"NOTE: total failed wells = {fail_counter}/{trial_counter}")


def run(ctx: ProtocolContext) -> None:
    """Run."""
    pipette, rack, labware = _setup(ctx)
    test_wells = _get_test_wells(labware, pipette)
    test_tips = _get_test_tips(rack, pipette)
    _test_for_expected_liquid_state(
        ctx,
        pipette,
        tips=test_tips,
        wells=test_wells,
        trials=NUM_TRIALS,
        liquid_state=False,
    )
