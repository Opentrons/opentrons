from pathlib import Path
import pytest
from typing import Tuple

from opentrons.protocol_api import Labware, ProtocolContext

from hardware_testing.gravimetric.liquid_height.height import (
    LiquidTracker,
    initialize_liquid_from_deck,
)
from hardware_testing.gravimetric.helpers import get_api_context
from hardware_testing.gravimetric.radwag_pipette_calibration_vial import VIAL_DEFINITION

CUSTOM_LABWARE_DEFINITION_DIR = (
    Path(__file__).parent.parent.parent.parent / "protocols" / "definitions"
)


def _create_context() -> ProtocolContext:
    return get_api_context(api_level="2.13", is_simulating=True)


def _load_labware(ctx: ProtocolContext) -> Tuple[Labware, Labware, Labware, Labware]:
    tiprack = ctx.load_labware(load_name="opentrons_96_tiprack_300uL", location="8")
    trough = ctx.load_labware(load_name="nest_12_reservoir_15ml", location="5")
    plate = ctx.load_labware(load_name="corning_96_wellplate_360ul_flat", location="2")
    vial = ctx.load_labware_from_definition(
        VIAL_DEFINITION,
        location="6",
    )
    return tiprack, trough, plate, vial


def test_initialize_and_reset() -> None:
    ctx = _create_context()
    _, trough, plate, vial = _load_labware(ctx)
    assert len(trough.wells()) == 12
    assert len(plate.wells()) == 96
    assert len(vial.wells()) == 1
    tracker = LiquidTracker()
    assert len(list(tracker._items.keys())) == 0
    initialize_liquid_from_deck(ctx, tracker)
    assert len(list(tracker._items.keys())) == 12 + 96 + 1
    tracker.reset()
    assert len(list(tracker._items.keys())) == 0


def test_volume_changes() -> None:
    # create context and load labware
    ctx = _create_context()
    _, trough, plate, vial = _load_labware(ctx)
    # initialize liquid tracker
    tracker = LiquidTracker()
    initialize_liquid_from_deck(ctx, tracker)
    well = plate["A1"]

    # set starting volume
    assert tracker.get_volume(well) == 0
    tracker.set_start_volume(plate["A1"], 100)
    assert tracker.get_volume(well) == 100

    # use arguments appropriately
    with pytest.raises(ValueError):
        tracker.update_well_volume(well)
    with pytest.raises(ValueError):
        tracker.update_well_volume(well, after_aspirate=50, after_dispense=50)

    # modify the volume with aspirate/dispense
    tracker.update_well_volume(well, after_aspirate=50)
    assert tracker.get_volume(well) == 50
    tracker.update_well_volume(well, after_dispense=50)
    assert tracker.get_volume(well) == 100
    tracker.update_well_volume(well, after_aspirate=100)
    assert tracker.get_volume(well) == 0

    # cannot go beyond well's volume boundaries
    with pytest.raises(ValueError):
        tracker.update_well_volume(well, after_aspirate=1)
    with pytest.raises(ValueError):
        tracker.update_well_volume(well, after_dispense=1000)

    # handle aspirate/dispense over and over
    for i in range(100):
        tracker.update_well_volume(well, after_dispense=1)
    assert tracker.get_volume(well) == 100
    for i in range(100):
        tracker.update_well_volume(well, after_aspirate=1)
    assert tracker.get_volume(well) == 0


def test_liquid_height() -> None:
    # create context and load labware
    ctx = _create_context()
    # NOTE: values were hardcoded based on results from running this test
    #       the Corning and NEST labwares assume perfect cylinders/cubes
    #       without a lookup table
    _, trough, plate, _ = _load_labware(ctx)
    # initialize liquid tracker
    tracker = LiquidTracker()
    initialize_liquid_from_deck(ctx, tracker)

    well = plate["A1"]  # a cyclinder

    # set height, get volumes
    tracker.set_start_volume_from_liquid_height(well, liquid_height=0)
    assert round(tracker.get_volume(well), 2) == 0
    tracker.set_start_volume_from_liquid_height(well, liquid_height=1)
    assert round(tracker.get_volume(well), 2) == 36.96
    tracker.set_start_volume_from_liquid_height(well, liquid_height=10)
    assert round(tracker.get_volume(well), 2) == 369.61

    # get height
    assert round(tracker.get_liquid_height(well), 2) == 10
    tracker.update_well_volume(well, after_aspirate=(369.61 - 36.96))
    assert round(tracker.get_volume(well), 2) == 36.96
    assert round(tracker.get_liquid_height(well), 2) == 1
    tracker.update_well_volume(well, after_aspirate=tracker.get_volume(well))
    assert round(tracker.get_volume(well), 2) == 0
    assert round(tracker.get_liquid_height(well), 2) == 0

    well = trough["A1"]  # a cube

    # set height, get volumes
    tracker.set_start_volume_from_liquid_height(well, liquid_height=0)
    assert round(tracker.get_volume(well), 2) == 0
    tracker.set_start_volume_from_liquid_height(well, liquid_height=1)
    assert round(tracker.get_volume(well), 2) == 583.84
    tracker.set_start_volume_from_liquid_height(well, liquid_height=10)
    assert round(tracker.get_volume(well), 2) == 5838.4

    # get height
    assert round(tracker.get_liquid_height(well), 2) == 10
    tracker.update_well_volume(well, after_aspirate=(5838.4 - 583.84))
    assert round(tracker.get_volume(well), 2) == 583.84
    assert round(tracker.get_liquid_height(well), 2) == 1
    tracker.update_well_volume(well, after_aspirate=tracker.get_volume(well))
    assert round(tracker.get_volume(well), 2) == 0
    assert round(tracker.get_liquid_height(well), 2) == 0


def test_lookup_table() -> None:
    # create context and load labware
    ctx = _create_context()
    # NOTE: values were hardcoded based on results from running this test
    #       the Corning plate assumes a perfect cylinder without a lookup table
    _, _, plate, _ = _load_labware(ctx)
    # initialize liquid tracker
    tracker = LiquidTracker()
    initialize_liquid_from_deck(ctx, tracker)
    well = plate["A1"]

    # create a fake lookup table for this well
    tracker.init_well_liquid_height(well, lookup_table=[(0, 0), (10, 10)])

    # set height, get volumes
    tracker.set_start_volume_from_liquid_height(well, liquid_height=0)
    assert round(tracker.get_volume(well), 2) == 0
    tracker.set_start_volume_from_liquid_height(well, liquid_height=1)
    assert round(tracker.get_volume(well), 2) == 1
    tracker.set_start_volume_from_liquid_height(well, liquid_height=10)
    assert round(tracker.get_volume(well), 2) == 10

    # get height
    assert round(tracker.get_liquid_height(well), 2) == 10
    tracker.update_well_volume(well, after_aspirate=1.5)
    assert round(tracker.get_volume(well), 2) == 8.5
    assert round(tracker.get_liquid_height(well), 2) == 8.5
    tracker.update_well_volume(well, after_aspirate=tracker.get_volume(well))
    assert round(tracker.get_volume(well), 2) == 0
    assert round(tracker.get_liquid_height(well), 2) == 0


def test_before_and_after_heights() -> None:
    # create context and load labware
    ctx = _create_context()
    # NOTE: values were hardcoded based on results from running this test
    #       the Corning plate assumes a perfect cylinder without a lookup table
    tiprack, trough, plate, _ = _load_labware(ctx)
    # load a pipette
    single = ctx.load_instrument("p1000_single_gen3", mount="left", tip_racks=[tiprack])
    multi = ctx.load_instrument("p1000_multi_gen3", mount="right", tip_racks=[tiprack])
    # initialize liquid tracker
    tracker = LiquidTracker()
    initialize_liquid_from_deck(ctx, tracker)

    # create a fake lookup tables
    tracker.init_well_liquid_height(plate["A1"], lookup_table=[(0, 0), (10, 10)])
    tracker.init_well_liquid_height(trough["A1"], lookup_table=[(0, 0), (10, 10)])
    tracker.set_start_volume_from_liquid_height(plate["A1"], liquid_height=5)
    tracker.set_start_volume_from_liquid_height(trough["A1"], liquid_height=5)

    # single-channel pipetting
    before, after = tracker.get_before_and_after_heights(
        well=plate["A1"],
        aspirate=1,
        channels=single.channels,
    )
    assert before == 5
    assert after == 4
    before, after = tracker.get_before_and_after_heights(
        well=plate["A1"],
        dispense=1,
        channels=single.channels,
    )
    assert before == 5
    assert after == 6

    # multi-channel pipetting
    before, after = tracker.get_before_and_after_heights(
        well=plate["A1"],
        aspirate=0.1,
        channels=multi.channels,
    )
    assert before == 5
    assert after == 4.9
    before, after = tracker.get_before_and_after_heights(
        well=plate["A1"],
        dispense=0.1,
        channels=multi.channels,
    )
    assert before == 5
    assert after == 5.1

    # multi-channel pipetting in a trough
    before, after = tracker.get_before_and_after_heights(
        well=trough["A1"],
        aspirate=0.1,
        channels=multi.channels,
    )
    assert before == 5
    assert after == 4.2
    before, after = tracker.get_before_and_after_heights(
        well=trough["A1"],
        dispense=0.1,
        channels=multi.channels,
    )
    assert before == 5
    assert after == 5.8


def test_update_affected_wells() -> None:
    # create context and load labware
    ctx = _create_context()
    # NOTE: values were hardcoded based on results from running this test
    #       the Corning plate assumes a perfect cylinder without a lookup table
    tiprack, trough, plate, _ = _load_labware(ctx)
    # load a pipette
    single = ctx.load_instrument("p1000_single_gen3", mount="left", tip_racks=[tiprack])
    multi = ctx.load_instrument("p1000_multi_gen3", mount="right", tip_racks=[tiprack])
    # initialize liquid tracker
    tracker = LiquidTracker()
    initialize_liquid_from_deck(ctx, tracker)

    # create a fake lookup tables
    for well in plate.wells() + trough.wells():
        tracker.init_well_liquid_height(well, lookup_table=[(0, 0), (10, 10)])
        tracker.set_start_volume_from_liquid_height(well, liquid_height=5)
        assert tracker.get_volume(well) == 5

    # plate
    tracker.update_affected_wells(
        well=plate["A1"], dispense=1, channels=single.channels
    )
    assert tracker.get_volume(plate["A1"]) == 6
    tracker.update_affected_wells(well=plate["A2"], dispense=1, channels=multi.channels)
    assert tracker.get_volume(plate["A2"]) == 6
    assert tracker.get_volume(plate["B2"]) == 6
    assert tracker.get_volume(plate["C2"]) == 6
    assert tracker.get_volume(plate["D2"]) == 6
    assert tracker.get_volume(plate["E2"]) == 6
    assert tracker.get_volume(plate["F2"]) == 6
    assert tracker.get_volume(plate["G2"]) == 6
    assert tracker.get_volume(plate["H2"]) == 6

    # trough
    tracker.update_affected_wells(
        well=trough["A1"], dispense=1, channels=single.channels
    )
    assert tracker.get_volume(trough["A1"]) == 6
    tracker.update_affected_wells(
        well=trough["A2"], dispense=0.1, channels=multi.channels
    )
    assert tracker.get_volume(trough["A2"]) == 5.8
