from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - MEGAAA PROTOCOL - LETS BREAK, I MEAN TEST, EVERYTHING!!!!!",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}

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


LABWARE_MOVEMENT_DECK_SLOT_1 = "D1"
LABWARE_MOVEMENT_DECK_SLOT_2 = "B3"
LABWARE_MOVEMENT_STAGING_AREA_SLOT_3 = "C3"
LABWARE_MOVEMENT_STAGING_AREA_SLOT_4 = "A4"

TIP_RACK_LOCATION_1 = "C3"
TIP_RACK_LOCATION_2 = "D2"

# NO STAGING AREA IN ROW A or B because of modules

# A1 - B1: Thermocycler
# C1: Trash Bin
# D1: EMPTY
# A2: Magnetic Block
# B2: Source PCR Plate
# C2: EMPTY for now, will load from off deck - Dest PCR Plate
# D2: Tip Rack 2
# A3: Heater-Shaker
# B3: Temperature Module
# C3: Tip Rack 1
# D3: EMPTY
# A4: EMPTY
# B4: EMPTY
# C4: EMPTY for now, will load from off deck - Staging Area Tip Rack 1
# D4: EMPTY for now, will load from off deck - Staging Area Tip Rack 2


def default_well(tiprack: protocol_api.labware) -> protocol_api.labware.Well:
    return tiprack["A1"]


def run(ctx: protocol_api.ProtocolContext) -> None:

    ################
    ### FIXTURES ###
    ################

    trash_bin_1 = ctx.load_trash_bin("C1")
    waste_chute = ctx.load_waste_chute()

    ###############
    ### MODULES ###
    ###############
    thermocycler = ctx.load_module(THERMOCYCLER_NAME)  # A1 & B1
    magnetic_block = ctx.load_module(MAGNETIC_BLOCK_NAME, "A2")
    heater_shaker = ctx.load_module(HEATER_SHAKER_NAME, "A3")
    temperature_module = ctx.load_module(TEMPERATURE_MODULE_NAME, "B3")

    thermocycler.open_lid()
    heater_shaker.open_labware_latch()

    modules = [thermocycler, heater_shaker, magnetic_block, temperature_module]

    #######################
    ### MODULE ADAPTERS ###
    #######################

    temperature_module_adapter = temperature_module.load_adapter("opentrons_96_well_aluminum_block")
    heater_shaker_adapter = heater_shaker.load_adapter("opentrons_96_pcr_adapter")

    adapters = [temperature_module_adapter, heater_shaker_adapter]

    ###############
    ### LABWARE ###
    ###############

    source_pcr_plate = ctx.load_labware(PCR_PLATE_96_NAME, "B2")
    dest_pcr_plate = ctx.load_labware(PCR_PLATE_96_NAME, protocol_api.OFF_DECK)

    on_deck_tip_rack_1 = ctx.load_labware(
        TIPRACK_96_NAME, TIP_RACK_LOCATION_1, adapter="opentrons_flex_96_tiprack_adapter"
    )
    tip_rack_adapter_1 = on_deck_tip_rack_1.parent

    on_deck_tip_rack_2 = ctx.load_labware(
        TIPRACK_96_NAME, TIP_RACK_LOCATION_2, adapter="opentrons_flex_96_tiprack_adapter"
    )
    tip_rack_adapter_2 = on_deck_tip_rack_2.parent

    off_deck_tip_rack_1 = ctx.load_labware(TIPRACK_96_NAME, protocol_api.OFF_DECK)
    off_deck_tip_rack_2 = ctx.load_labware(TIPRACK_96_NAME, protocol_api.OFF_DECK)
    staging_area_tip_rack_1 = ctx.load_labware(TIPRACK_96_NAME, protocol_api.OFF_DECK)
    staging_area_tip_rack_2 = ctx.load_labware(TIPRACK_96_NAME, protocol_api.OFF_DECK)

    tip_racks = [
        on_deck_tip_rack_1,
        on_deck_tip_rack_2,
        # staging_area_tip_rack_1,
        # staging_area_tip_rack_2,
        off_deck_tip_rack_1,
        off_deck_tip_rack_2,
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
        for i, column in enumerate(source_pcr_plate.columns())
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
    # Staging Area Slot 4 -> Each Module
    # Staging Area Slot 4 -> Deck

    # Module -> Staging Area Slot 3
    # Module -> Staging Area Slot 4
    # Module -> Deck
    # Module -> Other Module

    def run_moves(labware, move_sequences, reset_location, use_gripper):
        def move_to_locations(labware_to_move, move_locations, reset_after_each_move, use_gripper, reset_location):
            def reset_labware():
                ctx.comment(
                    f"Moving {labware_to_move.name} back to {reset_location.__str__} from {labware_to_move.parent.__str__}"
                )
                ctx.move_labware(labware_to_move, reset_location, use_gripper=use_gripper)

            if len(move_locations) == 0:
                return

            for location in move_locations:
                ctx.comment(
                    f"Moving {labware_to_move.name} from {labware_to_move.parent.__str__} to {location.__str__}"
                )
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

            # Deck -> Deck
            deck_move_sequence = [
                ["D1", "C2"],  # Deck Moves
                ["D3"],  # Staging Area Slot 3 Moves
                ["C4", "D4"],  # Staging Area Slot 4 Moves
                [thermocycler, temperature_module_adapter, heater_shaker_adapter, magnetic_block],  # Module Moves
            ]

            run_moves(pcr_plate, deck_move_sequence, reset_location, USING_GRIPPER)

        def staging_area_slot_3_moves(labware, reset_location):

            staging_area_slot_3_move_sequence = [
                ["D1", "C2", "B2"],  # Deck Moves
                [],  # Don't have Staging Area Slot 3 open
                ["C4", "D4"],  # Staging Area Slot 4 Moves
                [thermocycler, temperature_module_adapter, heater_shaker_adapter, magnetic_block],  # Module Moves
            ]

            run_moves(labware, staging_area_slot_3_move_sequence, reset_location, USING_GRIPPER)

        def staging_area_slot_4_moves(labware, reset_location):

            staging_area_slot_4_move_sequence = [
                ["D1", "C2", "B2"],  # Deck Moves
                ["D3"],  # Staging Area Slot 3 Moves
                ["D4"],  # Staging Area Slot 4 Moves
                [thermocycler, temperature_module_adapter, heater_shaker_adapter, magnetic_block],  # Module Moves
            ]

            run_moves(labware, staging_area_slot_4_move_sequence, reset_location, USING_GRIPPER)

        def module_moves(labware, module_locations):

            module_move_sequence = [
                ["D1", "C2", "B2"],  # Deck Moves
                ["D3"],  # Staging Area Slot 3 Moves
                ["C4", "D4"],  # Staging Area Slot 4 Moves
            ]

            for module_starting_location in module_locations:
                labware_move_to_locations = module_locations.copy()
                labware_move_to_locations.remove(module_starting_location)
                all_sequences = module_move_sequence.copy()
                all_sequences.append(labware_move_to_locations)
                ctx.move_labware(source_pcr_plate, module_starting_location, use_gripper=USING_GRIPPER)
                run_moves(labware, all_sequences, module_starting_location, USING_GRIPPER)

        DECK_MOVE_RESET_LOCATION = "B2"
        STAGING_AREA_SLOT_3_RESET_LOCATION = "D3"
        STAGING_AREA_SLOT_4_RESET_LOCATION = "C4"

        deck_moves(source_pcr_plate, DECK_MOVE_RESET_LOCATION)

        ctx.move_labware(source_pcr_plate, STAGING_AREA_SLOT_3_RESET_LOCATION, use_gripper=USING_GRIPPER)
        staging_area_slot_3_moves(source_pcr_plate, STAGING_AREA_SLOT_3_RESET_LOCATION)

        ctx.move_labware(source_pcr_plate, STAGING_AREA_SLOT_4_RESET_LOCATION, use_gripper=USING_GRIPPER)
        staging_area_slot_4_moves(source_pcr_plate, STAGING_AREA_SLOT_4_RESET_LOCATION)

        module_locations = [thermocycler, magnetic_block] + adapters
        module_moves(source_pcr_plate, module_locations)

    def test_manual_moves():
        # In C4 currently
        ctx.move_labware(source_pcr_plate, "D4", use_gripper=not USING_GRIPPER)

    test_gripper_moves()
    test_manual_moves()
