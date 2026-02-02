from opentrons.protocol_api import ProtocolContext, InstrumentContext
from opentrons.hardware_control.types import Axis
from opentrons.types import Mount, Point
import re
from opentrons.config import IS_ROBOT
from typing import List
import math
metadata = {"protocolName": "Demo dynamic pipetting with filling"}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

def run(ctx: ProtocolContext) -> None:
    """Run."""
    # Change Pipette and mount here as needed
    ctx.load_trash_bin("A3")
    pipette = ctx.load_instrument(f"flex_1channel_1000", "left")
    tiprack = ctx.load_labware(f"opentrons_flex_96_tiprack_1000ul", "C2")
    rack = ctx.load_labware(f"opentrons_10_tuberack_nest_4x50ml_6x15ml_conical", "C1")
    dye = ctx.load_labware("nest_96_wellplate_2ml_deep", "D1")
    water = ctx.load_labware("nest_8_reservoir_22ml", "D2")
    main_well = water.well("H1")
    red = dye.well("H1")
    blue = dye.well("H2")
    red_refill = rack.well("A1")
    blue_refill = rack.well("B1")

    shift_amount = (main_well.length / 2) - 4

    # get liquid heights
    pipette.pick_up_tip(tiprack)
    pipette.require_liquid_presence(main_well)
    pipette.require_liquid_presence(red)
    pipette.require_liquid_presence(blue)
    pipette.require_liquid_presence(red_refill)
    pipette.require_liquid_presence(blue_refill)
    pipette.return_tip()
    pipette.pick_up_tip(tiprack)
    ctx.pause("Ready to Demo?")
    # Fill the demo wells
    if not ctx.is_simulating():
        amount_needed = 2000 - red.current_liquid_volume()
        amount_needed = min(amount_needed,1000)
    else:
        amount_needed = 1000
    pipette.aspirate(
        volume=amount_needed,
        location=red_refill.meniscus(z=-1, target="end")
    )
    pipette.dispense(
        volume=amount_needed,
        location =red.meniscus(z=-1, target="start"),
        end_location = red.meniscus(z=-1, target="end")
    )
    if not ctx.is_simulating():
        amount_needed = 2000 - blue.current_liquid_volume()
        amount_needed = min(amount_needed,1000)
    else:
        amount_needed = 1000
    pipette.move_to(blue_refill.top())
    pipette.prepare_to_aspirate()
    pipette.aspirate(
        volume=amount_needed,
        location=blue_refill.meniscus(z=-1, target="end")
    )
    pipette.dispense(
        volume=amount_needed,
        location = blue.meniscus(z=-1, target="start"),
        end_location = blue.meniscus(z=-1, target="end")
    )
    #calculate positions
    bottom_left = main_well.bottom(0.5).move(Point( -1* shift_amount,0, 0))
    bottom_right = main_well.bottom(0.5).move(Point( shift_amount,0, 0))

    top_left = main_well.meniscus(z=-2, target="start").move(Point( -1* shift_amount,0, 0))
    top_right = main_well.meniscus(z=-2, target="end").move(Point(shift_amount,0,  0))

    center_left = main_well.center().move(Point( -1* shift_amount,0, 0))
    center_right = main_well.center().move(Point(shift_amount,0,  0))

    trough_left = main_well.bottom(2).move(Point( -1* shift_amount,0, 0))
    trouch_right = main_well.bottom(2).move(Point( shift_amount,0, 0))
    high_left = main_well.meniscus(z=1, target="start").move(Point( -1* shift_amount,0, 0))
    high_right = main_well.meniscus(z=1, target="end").move(Point(shift_amount,0,  0))
    pipette.move_to(blue.top(5))
    pipette.prepare_to_aspirate()
    #Pick up one dye
    pipette.aspirate(
        volume = 1000,
        flow_rate = 300,
        location = blue.meniscus(z=-1.5, target="start"),
        end_location = blue.meniscus(z=-1.5, target="end")
    )
    #Dispense along the bottom
    pipette.dispense(
        volume = 1000,
        flow_rate = 100,
        location = trough_left,
        end_location = trouch_right
    )
    #Pick Up dye two
    pipette.move_to(red.top())
    pipette.prepare_to_aspirate()
    pipette.aspirate(
        volume = 1000,
        flow_rate=300,
        location=red.meniscus(z=-1.5, target="start"),
        end_location = red.meniscus(z=-1.5, target="end")
    )
    #Dispense along meniscus
    pipette.dispense(
        volume = 1000,
        flow_rate = 50,
        location = high_left,
        end_location = high_right
    )
    # Mix in an x pattern
    pipette.move_to(main_well.top())
    pipette.prepare_to_aspirate()
    pipette.dynamic_mix(
        aspirate_start_location = bottom_right,
        dispense_start_location = top_left,
        repetitions = 2,
        volume = 1000,
        aspirate_end_location = bottom_left,
        dispense_end_location = top_right,
        final_push_out=0.0
    )
    pipette.dynamic_mix(
        aspirate_start_location = top_right,
        dispense_start_location = bottom_right,
        repetitions =2,
        volume = 1000,
        aspirate_end_location = top_left,
        dispense_end_location = bottom_left,
        final_push_out=0.0
    )
    pipette.dynamic_mix(
        aspirate_start_location = top_right,
        dispense_start_location = bottom_right,
        repetitions =2,
        volume = 1000,
        aspirate_end_location = bottom_left,
        dispense_end_location = top_left,
        final_push_out=0.0
    )

    pipette.return_tip()


