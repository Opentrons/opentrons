from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - MEGAAA PROTOCOL - LETS BREAK, I MEAN TEST, EVERYTHING!!!!!",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}

#############
### FLAGS ###
#############

# prefer to move off deck, instead of waste chute disposal, if possible
PREFER_MOVE_OFF_DECK = True

#################
### CONSTANTS ###
#################

HEATER_SHAKER_NAME = "heaterShakerModuleV1"
MAGNETIC_BLOCK_NAME = "magneticBlockV1"
PCR_PLATE_96_NAME = "nest_96_wellplate_100ul_pcr_full_skirt"
STARTING_VOL = 100
TEMPERATURE_MODULE_NAME = "temperature module gen2"
THERMOCYCLER_NAME = "thermocycler module gen2"
TIPRACK_96_NAME = "opentrons_flex_96_tiprack_1000ul"
TRANSFER_VOL = 10
USING_GRIPPER = True
RESET_AFTER_EACH_MOVE = True
DONT_RESET_AFTER_EACH_MOVE = False

TIP_RACK_LOCATION_1 = "C3"
TIP_RACK_LOCATION_2 = "D2"


def default_well(tiprack: protocol_api.labware) -> protocol_api.labware.Well:
    return tiprack["A1"]


def run(ctx: protocol_api.ProtocolContext) -> None:

    ################
    ### FIXTURES ###
    ################

    trash_bin = ctx.load_trash_bin("B3")
    waste_chute = ctx.load_waste_chute()

    ###############
    ### MODULES ###
    ###############
    thermocycler = ctx.load_module(THERMOCYCLER_NAME)  # A1 & B1
    magnetic_block = ctx.load_module(MAGNETIC_BLOCK_NAME, "C1")
    heater_shaker = ctx.load_module(HEATER_SHAKER_NAME, "A3")
    temperature_module = ctx.load_module(TEMPERATURE_MODULE_NAME, "D1")

    thermocycler.open_lid()
    heater_shaker.open_labware_latch()

    #######################
    ### MODULE ADAPTERS ###
    #######################

    temperature_module_adapter = temperature_module.load_adapter("opentrons_96_well_aluminum_block")
    heater_shaker_adapter = heater_shaker.load_adapter("opentrons_96_pcr_adapter")

    adapters = [temperature_module_adapter, heater_shaker_adapter]

    ###############
    ### LABWARE ###
    ###############

    source_reservoir = ctx.load_labware("nest_1_reservoir_290ml", "D2")
    dest_pcr_plate = ctx.load_labware(PCR_PLATE_96_NAME, "C2")

    tip_rack_1 = ctx.load_labware(
        TIPRACK_96_NAME, "A2", adapter="opentrons_flex_96_tiprack_adapter"
    )
    tip_rack_adapter = tip_rack_1.parent
    
    tip_rack_2 = ctx.load_labware(TIPRACK_96_NAME, "C3")
    tip_rack_3 = ctx.load_labware(TIPRACK_96_NAME, "C4")

    tip_racks = [
        tip_rack_1,
        tip_rack_2,
        tip_rack_3,
    ]

    ##########################
    ### PIPETTE DEFINITION ###
    ##########################

    pipette_96_channel = ctx.load_instrument("flex_96channel_1000", mount="left", tip_racks=tip_racks)

    ########################
    ### LOAD SOME LIQUID ###
    ########################

    water = ctx.define_liquid(name="water", description="High Quality H₂O", display_color="#42AB2D")

    acetone = ctx.define_liquid(name="acetone", description="C₃H₆O", display_color="#38588a")

    [
        well.load_liquid(liquid=water if i % 2 == 0 else acetone, volume=STARTING_VOL)
        for i, column in enumerate(source_reservoir.columns())
        for well in column
    ]

    ################################
    ### GRIPPER LABWARE MOVEMENT ###
    ################################

    # This tests moving the labware with the gripper all around the deck.
    # It will perform 2 types of movements:
    #   Moving to a sequence of locations
    #   Moving to a sequence of locations with a reset to the original labware location after each move

    # Iterations:
    # Deck -> Deck
    # Deck -> Staging Area Slot 3
    # Deck -> Staging Area Slot 4
    # Deck -> Each Module

    # Staging Area Slot 3 -> Staging Area Slot 4
    # Staging Area Slot 3 -> Each Module
    # Staging Area Slot 3 -> Deck

    # Staging Area Slot 4 -> Staging Area Slot 4
    # Staging Area Slot 4 -> Staging Area Slot 3
    # Staging Area Slot 4 -> Each ModuleSTAGING_AREA_SLOT_3_RESET_LOCATION
    # Staging Area Slot 4 -> Deck

    # Module -> Staging Area Slot 3
    # Module -> Staging Area Slot 4
    # Module -> Deck
    # Module -> Other Module

    def get_disposal_preference():
        return (protocol_api.OFF_DECK, not USING_GRIPPER) if PREFER_MOVE_OFF_DECK else (waste_chute, USING_GRIPPER)

    def run_moves(labware, move_sequences, reset_location, use_gripper):
        def move_to_locations(labware_to_move, move_locations, reset_after_each_move, use_gripper, reset_location):
            def reset_labware():
                ctx.move_labware(labware_to_move, reset_location, use_gripper=use_gripper)

            if len(move_locations) == 0:
                return

            for location in move_locations:
                ctx.move_labware(labware_to_move, location, use_gripper=use_gripper)

                if reset_after_each_move:
                    reset_labware()

            if not reset_after_each_move:
                reset_labware()

        for move_sequence in move_sequences:
            move_to_locations(labware, move_sequence, RESET_AFTER_EACH_MOVE, use_gripper, reset_location)
            move_to_locations(labware, move_sequence, DONT_RESET_AFTER_EACH_MOVE, use_gripper, reset_location)

    def test_gripper_moves():
        def deck_moves(pcr_plate, reset_location):
            deck_move_sequence = [
                ["B2"],  # Deck Moves
                ["C3"],  # Staging Area Slot 3 Moves
                ["C4", "D4"],  # Staging Area Slot 4 Moves
                [thermocycler, temperature_module_adapter, heater_shaker_adapter, magnetic_block],  # Module Moves
            ]

            run_moves(pcr_plate, deck_move_sequence, reset_location, USING_GRIPPER)

        def staging_area_slot_3_moves(labware, reset_location):
            staging_area_slot_3_move_sequence = [
                ["B2", "C2"],  # Deck Moves
                [],  # Don't have Staging Area Slot 3 open
                ["C4", "D4"],  # Staging Area Slot 4 Moves
                [thermocycler, temperature_module_adapter, heater_shaker_adapter, magnetic_block],  # Module Moves
            ]

            run_moves(labware, staging_area_slot_3_move_sequence, reset_location, USING_GRIPPER)

        def staging_area_slot_4_moves(labware, reset_location):

            staging_area_slot_4_move_sequence = [
                ["C2", "B2"],  # Deck Moves
                ["C3"],  # Staging Area Slot 3 Moves
                ["C4"],  # Staging Area Slot 4 Moves
                [thermocycler, temperature_module_adapter, heater_shaker_adapter, magnetic_block],  # Module Moves
            ]

            run_moves(labware, staging_area_slot_4_move_sequence, reset_location, USING_GRIPPER)

        def module_moves(labware, module_locations):

            module_move_sequence = [
                ["C2", "B2"],  # Deck Moves
                ["C3"],  # Staging Area Slot 3 Moves
                ["C4", "D4"],  # Staging Area Slot 4 Moves
            ]

            for module_starting_location in module_locations:
                labware_move_to_locations = module_locations.copy()
                labware_move_to_locations.remove(module_starting_location)
                all_sequences = module_move_sequence.copy()
                all_sequences.append(labware_move_to_locations)
                ctx.move_labware(labware, module_starting_location, use_gripper=USING_GRIPPER)
                run_moves(labware, all_sequences, module_starting_location, USING_GRIPPER)

        DECK_MOVE_RESET_LOCATION = "C2"
        STAGING_AREA_SLOT_3_RESET_LOCATION = "C3"
        STAGING_AREA_SLOT_4_RESET_LOCATION = "D4"

        deck_moves(dest_pcr_plate, DECK_MOVE_RESET_LOCATION)

        ctx.move_labware(dest_pcr_plate, STAGING_AREA_SLOT_3_RESET_LOCATION, use_gripper=USING_GRIPPER)
        staging_area_slot_3_moves(dest_pcr_plate, STAGING_AREA_SLOT_3_RESET_LOCATION)

        ctx.move_labware(dest_pcr_plate, STAGING_AREA_SLOT_4_RESET_LOCATION, use_gripper=USING_GRIPPER)
        staging_area_slot_4_moves(dest_pcr_plate, STAGING_AREA_SLOT_4_RESET_LOCATION)

        module_locations = [thermocycler, magnetic_block] + adapters
        module_moves(dest_pcr_plate, module_locations)

    def test_manual_moves():
        # In C4 currently
        ctx.move_labware(source_reservoir, "D4", use_gripper=not USING_GRIPPER)

    def test_pipetting():
        def test_partial_tip_pickup_usage():
            pipette_96_channel.configure_nozzle_layout(style=protocol_api.COLUMN, start="A12")
            for i in range(1, 13):
                pipette_96_channel.pick_up_tip(tip_rack_2[f"A{i}"])

                pipette_96_channel.aspirate(5, source_reservoir["A1"])
                pipette_96_channel.touch_tip()

                pipette_96_channel.dispense(5, dest_pcr_plate[f"A{i}"])
                pipette_96_channel.drop_tip(trash_bin)

            # leave this dropping in waste chute, do not use get_disposal_preference
            # want to test partial drop
            ctx.move_labware(tip_rack_2, waste_chute, use_gripper=USING_GRIPPER)

        def test_full_tip_rack_usage():
            pipette_96_channel.configure_nozzle_layout(style=protocol_api.ALL, start="A1")
            pipette_96_channel.pick_up_tip(tip_rack_1["A1"])
            
            pipette_96_channel.aspirate(5, source_reservoir["A1"])
            pipette_96_channel.touch_tip()

            # Waiting for https://opentrons.atlassian.net/browse/RQA-2056
            # pipette_96_channel.air_gap(height=30)

            pipette_96_channel.blow_out(waste_chute)

            pipette_96_channel.aspirate(10, source_reservoir["A1"])
            pipette_96_channel.touch_tip()

            pipette_96_channel.dispense(10, dest_pcr_plate["A1"])
            pipette_96_channel.mix(repetitions=5, volume=15)
            pipette_96_channel.return_tip()

            ctx.move_labware(tip_rack_1, get_disposal_preference()[0], use_gripper=get_disposal_preference()[1])
            ctx.move_labware(tip_rack_3, tip_rack_adapter, use_gripper=USING_GRIPPER)

            pipette_96_channel.pick_up_tip(tip_rack_3["A1"])
            pipette_96_channel.transfer(
                volume=10,
                source=source_reservoir["A1"],
                dest=dest_pcr_plate["A1"],
                new_tip="never",
                touch_tip=True,
                blow_out=True,
                blowout_location="trash",
                mix_before=(3, 5),
                mix_after=(1, 5),
            )
            pipette_96_channel.return_tip()

            ctx.move_labware(tip_rack_3, get_disposal_preference()[0], use_gripper=get_disposal_preference()[1])

        test_partial_tip_pickup_usage()
        test_full_tip_rack_usage()

    def test_module_usage():
        def test_thermocycler():
            thermocycler.close_lid()
            
            thermocycler.set_block_temperature(
                75.0,
                hold_time_seconds=5.0
            )
            thermocycler.set_lid_temperature(80.0)
            thermocycler.deactivate()

        def test_heater_shaker():
            heater_shaker.open_labware_latch()
            heater_shaker.close_labware_latch()

            heater_shaker.set_target_temperature(75.0)
            heater_shaker.set_and_wait_for_shake_speed(1000)
            heater_shaker.wait_for_temperature()

            heater_shaker.deactivate_heater()
            heater_shaker.deactivate_shaker()

        def test_temperature_module():
            temperature_module.set_temperature(80)
            temperature_module.set_temperature(10)
            temperature_module.deactivate()

        def test_magnetic_block():
            pass

        test_thermocycler()
        test_heater_shaker()
        test_temperature_module()
        test_magnetic_block()


    ###################################################################################################
    ### THE ORDER OF THESE FUNCTION CALLS MATTER. CHANGING THEM WILL CAUSE THE PROTOCOL NOT TO WORK ###
    ###################################################################################################
    test_pipetting()      
    test_gripper_moves()  
    test_module_usage()   
    test_manual_moves()   
    ###################################################################################################
    ### THE ORDER OF THESE FUNCTION CALLS MATTER. CHANGING THEM WILL CAUSE THE PROTOCOL NOT TO WORK ###
    ###################################################################################################


# Cannot test in this protocol
    #           - Waste Chute w/ Lid

