from opentrons import protocol_api

# metadata
metadata = {
    "protocolName": "2.20 Error Recovery Testing Protocol - Modified",
    "author": "Sara Kowalski",
    "description": "Simple Protocol that user can use to Phase 1 Error Recovery options for single and multi channel pipettes. NOTE: YOU WILL NEED A MODIFIED PIPETTE (NO SHROUD), and changed order of operations to reduce impact of dispense ER failure",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}

DRYRUN = "NO"


def run(protocol: protocol_api.ProtocolContext):

    # modules/fixtures
    trashbin = protocol.load_trash_bin(location="A3")

    # labware
    tiprack1 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "A2")
    tiprack2 = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "B2")
    sample_plate = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "C3")
    reservoir = protocol.load_labware("nest_1_reservoir_290ml", "D3")
    wet_sample = protocol.load_labware("nest_12_reservoir_15ml", "B3")

    # liquids
    water = protocol.define_liquid(
        name="Water",
        description="water for ER testing",
        display_color="#90e0ef",
    )
    waterButMoreBlue = protocol.define_liquid(
        name="Water but more blue",
        description="Water for ER testing",
        display_color="#0077b6",
    )

    wet_sample["A1"].load_liquid(liquid=water, volume=800)
    wet_sample["A2"].load_liquid(liquid=waterButMoreBlue, volume=800)

    # instruments
    p1000 = protocol.load_instrument(
        "flex_8channel_1000", mount="left", tip_racks=[tiprack1]
    )  ## will need a modified pipette that doesn't have the ejector(?)
    p50 = protocol.load_instrument(
        "flex_1channel_50", mount="right", tip_racks=[tiprack2]
    )  ## will need a modified pipette that doesn't have the ejector(?)

    pipette_list = [p1000, p50]
    volume = 900

    for pipette in pipette_list:
        if pipette == p50:
            volume = 50

        ##############################
        #####Tip Pick Up Failure######
        ##############################

        protocol.pause("This tests Tip Pick Up Failure (General Error for now)")
        protocol.pause("Please remove tip rack from deck. When you're testing recovery, add tiprack back as necessary.")
        pipette.pick_up_tip()

        ##########################################
        #####Overpressure - While Aspirating######
        ##########################################

        protocol.pause("Overpressure - While Aspirating")
        pipette.home()
        protocol.pause(
            "Use p50UL tips - Swap with tip(s) that are hot glued shut (you will need to swap the tips for retry recovery options)"
        )

        for i in range(10):
            pipette.aspirate(volume, reservoir["A1"].top())
            pipette.dispense(volume, reservoir["A1"].top())

        ####################################
        #####Liquid Presence Detection######
        ####################################
        protocol.pause("This tests Liquid Presence Detection - PLEASE MAKE SURE YOU'RE USING 1000UL TIPS OR YOU WILL BREAK THE PIPETTE")
        protocol.pause("Make sure reservoir is empty, and have full reservoir on standby to switch out with for recovery")

        pipette.require_liquid_presence(wet_sample["A1"])

        pipette.aspirate(volume, wet_sample["A1"])
        pipette.dispense(volume, wet_sample["A1"])
        pipette.home()

        #####################################################
        #####Overpressure - While Dispensing######
        #####################################################

        protocol.pause("Overpressure - While Dispensing")

        pipette.aspirate(volume, reservoir["A1"].top(20))
        protocol.pause("Swap with tip(s) that are hot glued shut (you will need to cut the tips for retry recovery options)")
        pipette.dispense(volume, reservoir["A1"].top(20))

        pipette.move_to(trashbin)
        protocol.pause("You will have to manually remove tips if you're using a modified pipette")
        pipette.drop_tip(trashbin)
