from opentrons.protocol_api import ProtocolContext
from opentrons.types import Point
from typing import List
from opentrons import protocol_api

metadata = {"protocolName": "Dynamic Pipetting Single/Multi"}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


def add_parameters(parameters: protocol_api.Parameters):
    """Add runtime parameters for test configuration"""
    
    parameters.add_str(
        variable_name="pipette_type",
        display_name="Pipette Type",
        description="Which pipette to use for the test",
        default="flex_8channel_1000",
        choices=[
            {"display_name": "Single", "value": "flex_1channel_1000"},
            {"display_name": "Multi", "value": "flex_8channel_1000"},
        ],
    )

def run(ctx: ProtocolContext) -> None:
    """Run."""
    # Change Pipette and mount here as needed
    ctx.load_trash_bin("A3")

    PIPETTE = 'flex_8channel_1000'


    pipette = ctx.load_instrument(PIPETTE, "right")
    rack = ctx.load_labware("opentrons_tough_4_reservoir_72ml", "C1")

    tiprack = ctx.load_labware(f"opentrons_flex_96_tiprack_1000ul", "C2")
    nest_res = ctx.load_labware("nest_12_reservoir_15ml", "D2")
    nest_wellplate = ctx.load_labware("thermoscientific_96_wellplate_800ul", "D1")
    dorf_150 = ctx.load_labware("eppendorf_96_wellplate_150ul", "D3")
    dorf_500 = ctx.load_labware("eppendorf_96_wellplate_500ul", "C3")
    main_well = nest_res.well("A1")
    coffee_well = nest_wellplate.well("A1")
    tea_well = nest_wellplate.well("A2")
    coffee_refill = rack.well("A1")
    tea_refill = rack.well("A3")
    dorf_500_test = dorf_500.well("A1")
    dorf_150_test = dorf_150.well("A1")
    shift_amount = (main_well.length / 2) - 4
    pipette.pick_up_tip(tiprack)
    pipette.require_liquid_presence(main_well)
    pipette.require_liquid_presence(coffee_well)
    pipette.require_liquid_presence(tea_well)
    pipette.require_liquid_presence(coffee_refill)
    pipette.require_liquid_presence(tea_refill)
    pipette.require_liquid_presence(dorf_500_test)
    pipette.require_liquid_presence(dorf_150_test)
    pipette.drop_tip()
    pipette.pick_up_tip(tiprack)

    bottom_left = dorf_150_test.bottom(0.5).move(Point( -1* shift_amount,0, 0))
    bottom_right = dorf_150_test.bottom(0.5).move(Point( shift_amount,0, 0))

    top_left = dorf_150_test.meniscus(z=-2, target="start").move(Point( -1* shift_amount,0, 0))
    top_right = dorf_150_test.meniscus(z=-2, target="end").move(Point(shift_amount,0,  0))

    high_left = dorf_150_test.meniscus(z=1, target="start").move(Point( -1* shift_amount,0, 0))
    high_right = dorf_150_test.meniscus(z=1, target="end").move(Point(shift_amount,0,  0))

    pipette.prepare_to_aspirate()
    #Pick up one dye
    pipette.aspirate(
        volume = 150,
        flow_rate = 300,
        location = dorf_150_test.meniscus(z=-1.5, target="start"),
        end_location = dorf_150_test.meniscus(z=-1.5, target="end")
    )
    #Dispense along the bottom
    pipette.dispense(
        volume = 150,
        flow_rate = 100,
        location = dorf_500_test.meniscus(z=-1.5, target="start"),
        end_location = dorf_500_test.meniscus(z=-1.5, target="end"),
        push_out=10
    )

    pipette.prepare_to_aspirate()
    pipette.aspirate(
        volume = 150,
        flow_rate = 300,
        location = dorf_500_test.meniscus(z=-1.5, target="start"),
        end_location = dorf_500_test.meniscus(z=-1.5, target="end")
    )
    #Dispense along the bottom
    pipette.dispense(
        volume = 150,
        flow_rate = 100,
        location = coffee_well.meniscus(z=-1.5, target="start"),
        end_location = coffee_well.meniscus(z=-1.5, target="end"),
        push_out=10
    )

    pipette.prepare_to_aspirate()
    pipette.aspirate(
        volume = 50,
        flow_rate = 300,
        location = dorf_150_test.meniscus(z=-1.5, target="start"),
        end_location = dorf_150_test.meniscus(z=-1.5, target="end")
    )
    #Dispense along the bottom
    pipette.dispense(
        volume = 50,
        flow_rate = 100,
        location = dorf_150_test.meniscus(z=-1.5, target="start"),
        end_location = dorf_150_test.meniscus(z=-1.5, target="end"),
        push_out=10
    )

    #Pick Up dye two
    pipette.move_to(coffee_well.top())
    pipette.prepare_to_aspirate()
    pipette.aspirate(
        volume = 300,
        flow_rate=300,
        location=coffee_well.meniscus(z=-1.5, target="start"),
        end_location = coffee_well.meniscus(z=-1.5, target="end")
    )
    #Dispense along meniscus
    pipette.dispense(
        volume = 300,
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

    bottom_left = dorf_500_test.bottom(0.5).move(Point( -1* shift_amount,0, 0))
    bottom_right = dorf_500_test.bottom(0.5).move(Point( shift_amount,0, 0))

    top_left = dorf_500_test.meniscus(z=-2, target="start").move(Point( -1* shift_amount,0, 0))
    top_right = dorf_500_test.meniscus(z=-2, target="end").move(Point(shift_amount,0,  0))

    high_left = dorf_500_test.meniscus(z=1, target="start").move(Point( -1* shift_amount,0, 0))
    high_right = dorf_500_test.meniscus(z=1, target="end").move(Point(shift_amount,0,  0))

    pipette.dynamic_mix(
        aspirate_start_location = top_right,
        dispense_start_location = bottom_right,
        repetitions =2,
        volume = 100,
        aspirate_end_location = top_left,
        dispense_end_location = bottom_left,
        final_push_out=0.0
    )

    bottom_left = coffee_well.bottom(0.5).move(Point( -1* shift_amount,0, 0))
    bottom_right = coffee_well.bottom(0.5).move(Point( shift_amount,0, 0))

    top_left = coffee_well.meniscus(z=-2, target="start").move(Point( -1* shift_amount,0, 0))
    top_right = coffee_well.meniscus(z=-2, target="end").move(Point(shift_amount,0,  0))

    high_left = coffee_well.meniscus(z=1, target="start").move(Point( -1* shift_amount,0, 0))
    high_right = coffee_well.meniscus(z=1, target="end").move(Point(shift_amount,0,  0))

    pipette.dynamic_mix(
        aspirate_start_location = top_right,
        dispense_start_location = bottom_right,
        repetitions =2,
        volume = 100,
        aspirate_end_location = bottom_left,
        dispense_end_location = top_left,
        final_push_out=0.0
    )

    pipette.return_tip()


