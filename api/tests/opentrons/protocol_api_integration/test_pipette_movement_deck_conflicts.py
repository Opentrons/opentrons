"""Tests for the APIs around deck conflicts during pipette movement."""

import pytest

from opentrons import protocol_api, simulate
from opentrons.protocol_api import COLUMN, ALL
from opentrons.protocol_api.core.engine.deck_conflict import PartialTipMovementNotAllowedError


def test_deck_conflicts_for_96_ch_a1_column_configuration() -> None:
    """It should raise errors for expected deck conflicts."""
    protocol = simulate.get_protocol_api(version="2.16", robot_type="Flex")
    instrument = protocol.load_instrument(
        "flex_96channel_1000", mount="left"
    )
    trash_labware = protocol.load_labware("opentrons_1_trash_3200ml_fixed","A3")
    instrument.trash_container = trash_labware

    badly_placed_tiprack = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "C2")
    well_placed_tiprack = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "C1")
    tiprack_on_adapter = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "C3", adapter="opentrons_flex_96_tiprack_adapter")

    #############  SHORT LABWARE  ################
    # These labware should be to the east of tall labware to avoid any partial tip deck conflicts
    badly_placed_plate = protocol.load_labware('nest_96_wellplate_200ul_flat', "B3")
    well_placed_plate = protocol.load_labware('nest_96_wellplate_200ul_flat', "B1")

    ############# TALL LABWARE ###############
    my_tuberack = protocol.load_labware(
        'opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical', "B2")

    ############ Use Partial Nozzles #############
    instrument.configure_nozzle_layout(style=COLUMN, start="A1")

    with pytest.raises(PartialTipMovementNotAllowedError, match="collision with items in deck slot"):
        instrument.pick_up_tip(badly_placed_tiprack.wells_by_name()["H12"])

    # No error cuz within pipette extent bounds and no taller labware to right of tiprack
    instrument.pick_up_tip(well_placed_tiprack.wells_by_name()["A12"])

    # No error cuz no labware on right of plate
    instrument.aspirate(25, well_placed_plate.wells_by_name()["A4"])
    # No error cuz dispensing from high above plate, so it clears tuberack on the right
    instrument.dispense(25, badly_placed_plate.wells_by_name()["A1"].top(150))

    with pytest.raises(PartialTipMovementNotAllowedError, match="collision with items in deck slot"):
        instrument.aspirate(25, badly_placed_plate.wells_by_name()["A1"])

    # No error cuz no taller labware on the right
    instrument.aspirate(10, my_tuberack.wells_by_name()["A1"])

    instrument.drop_tip()

    ######### CHANGE CONFIG TO ALL #########
    instrument.configure_nozzle_layout(style=ALL, tip_racks=[tiprack_on_adapter])

    # No error because of full config
    instrument.pick_up_tip()

    # No error NOW because of full config
    instrument.aspirate(50, badly_placed_plate.wells_by_name()["A1"])

    # No error NOW because of full config
    instrument.dispense(50, badly_placed_plate.wells_by_name()["A1"].bottom())
