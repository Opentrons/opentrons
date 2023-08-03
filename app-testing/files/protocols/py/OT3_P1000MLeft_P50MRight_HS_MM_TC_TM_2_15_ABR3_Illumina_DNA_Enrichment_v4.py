from opentrons import protocol_api
from opentrons import types

metadata = {
    "protocolName": "Illumina DNA Enrichment v4",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.15",
}

# SCRIPT SETTINGS
DRYRUN = True  # True = skip incubation times, shorten mix, for testing purposes
USE_GRIPPER = True  # True = Uses Gripper, False = Manual Move
TIP_TRASH = False  # True = Used tips go in Trash, False = Used tips go back into rack
HYBRID_PAUSE = True  # True = sets a pause on the Hybridization

# PROTOCOL SETTINGS
COLUMNS = 3  # 1-3
HYBRIDDECK = True
HYBRIDTIME = 1.6  # Hours

# PROTOCOL BLOCKS
STEP_VOLPOOL = 0
STEP_HYB = 0
STEP_CAPTURE = 1
STEP_WASH = 1
STEP_PCR = 1
STEP_PCRDECK = 1
STEP_CLEANUP = 1

############################################################################################################################################
############################################################################################################################################
############################################################################################################################################

p200_tips = 0
p50_tips = 0

ABR_TEST = True
if ABR_TEST == True:
    DRYRUN = True  # Overrides to only DRYRUN
    TIP_TRASH = False  # Overrides to only REUSING TIPS
    RUN = 3  # Repetitions
else:
    RUN = 1


def run(protocol: protocol_api.ProtocolContext):

    global p200_tips
    global p50_tips

    if ABR_TEST == True:
        protocol.comment("THIS IS A ABR RUN WITH " + str(RUN) + " REPEATS")
    protocol.comment("THIS IS A DRY RUN") if DRYRUN == True else protocol.comment("THIS IS A REACTION RUN")
    protocol.comment("USED TIPS WILL GO IN TRASH") if TIP_TRASH == True else protocol.comment(
        "USED TIPS WILL BE RE-RACKED"
    )

    # DECK SETUP AND LABWARE
    # ========== FIRST ROW ===========
    heatershaker = protocol.load_module("heaterShakerModuleV1", "1")
    sample_plate_2 = heatershaker.load_labware("nest_96_wellplate_2ml_deep")
    reservoir = protocol.load_labware("nest_96_wellplate_2ml_deep", "2")
    temp_block = protocol.load_module("temperature module gen2", "3")
    reagent_plate = temp_block.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    # ========== SECOND ROW ==========
    MAG_PLATE_SLOT = 4
    tiprack_200_1 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "5")
    tiprack_50_1 = protocol.load_labware("opentrons_ot3_96_tiprack_50ul", "6")
    # ========== THIRD ROW ===========
    thermocycler = protocol.load_module("thermocycler module gen2")
    sample_plate_1 = thermocycler.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    tiprack_200_2 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "8")
    tiprack_50_2 = protocol.load_labware("opentrons_ot3_96_tiprack_50ul", "9")
    # ========== FOURTH ROW ==========
    tiprack_200_3 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "11")

    # reagent
    AMPure = reservoir["A1"]
    SMB = reservoir["A2"]

    EtOH = reservoir["A4"]
    RSB = reservoir["A5"]
    Liquid_trash_well_1 = reservoir["A9"]
    Liquid_trash_well_2 = reservoir["A10"]
    Liquid_trash_well_3 = reservoir["A11"]
    Liquid_trash_well_4 = reservoir["A12"]

    # Will Be distributed during the protocol
    EEW_1 = sample_plate_2.wells_by_name()["A10"]
    EEW_2 = sample_plate_2.wells_by_name()["A11"]
    EEW_3 = sample_plate_2.wells_by_name()["A12"]

    NHB2 = reagent_plate.wells_by_name()["A1"]
    Panel = reagent_plate.wells_by_name()["A2"]
    EHB2 = reagent_plate.wells_by_name()["A3"]
    Elute = reagent_plate.wells_by_name()["A4"]
    ET2 = reagent_plate.wells_by_name()["A5"]
    PPC = reagent_plate.wells_by_name()["A6"]
    EPM = reagent_plate.wells_by_name()["A7"]

    # pipette
    p1000 = protocol.load_instrument(
        "p1000_multi_gen3", "left", tip_racks=[tiprack_200_1, tiprack_200_2, tiprack_200_3]
    )
    p50 = protocol.load_instrument("p50_multi_gen3", "right", tip_racks=[tiprack_50_1, tiprack_50_2])

    # tip and sample tracking
    if COLUMNS == 1:
        column_1_list = ["A1"]  # Plate 1
        column_2_list = ["A1"]  # Plate 2
        column_3_list = ["A4"]  # Plate 2
        column_4_list = ["A4"]  # Plate 1
        column_5_list = ["A7"]  # Plate 2
        column_6_list = ["A7"]  # Plate 1
        WASHES = [EEW_1]
    if COLUMNS == 2:
        column_1_list = ["A1", "A2"]  # Plate 1
        column_2_list = ["A1", "A2"]  # Plate 2
        column_3_list = ["A4", "A5"]  # Plate 2
        column_4_list = ["A4", "A5"]  # Plate 1
        column_5_list = ["A7", "A8"]  # Plate 2
        column_6_list = ["A7", "A8"]  # Plate 1
        WASHES = [EEW_1, EEW_2]
    if COLUMNS == 3:
        column_1_list = ["A1", "A2", "A3"]  # Plate 1
        column_2_list = ["A1", "A2", "A3"]  # Plate 2
        column_3_list = ["A4", "A5", "A6"]  # Plate 2
        column_4_list = ["A4", "A5", "A6"]  # Plate 1
        column_5_list = ["A7", "A8", "A9"]  # Plate 2
        column_6_list = ["A7", "A8", "A9"]  # Plate 1
        WASHES = [EEW_1, EEW_2, EEW_3]

    def tipcheck():
        if p200_tips >= 3 * 12:
            if ABR_TEST == True:
                p1000.reset_tipracks()
            else:
                protocol.pause("RESET p200 TIPS")
                p1000.reset_tipracks()
            p200_tips == 0
        if p50_tips >= 2 * 12:
            if ABR_TEST == True:
                p50.reset_tipracks()
            else:
                protocol.pause("RESET p50 TIPS")
                p50.reset_tipracks()
            p50_tips == 0

    def grip_offset(action, item, slot=None):
        """Grip offset."""
        from opentrons.types import Point

        # EDIT these values
        # NOTE: we are still testing to determine our software's defaults
        #       but we also expect users will want to edit these
        _pick_up_offsets = {
            "deck": Point(),
            "mag-plate": Point(),
            "heater-shaker": Point(z=1.0),
            "temp-module": Point(),
            "thermo-cycler": Point(),
        }
        # EDIT these values
        # NOTE: we are still testing to determine our software's defaults
        #       but we also expect users will want to edit these
        _drop_offsets = {
            "deck": Point(),
            "mag-plate": Point(x=0.1, y=-0.25, z=0.5),
            "heater-shaker": Point(y=-0.5),
            "temp-module": Point(),
            "thermo-cycler": Point(),
        }
        # do NOT edit these values
        # NOTE: these values will eventually be in our software
        #       and will not need to be inside a protocol
        _hw_offsets = {
            "deck": Point(),
            "mag-plate": Point(z=34.5),
            "heater-shaker-right": Point(z=2.5),
            "heater-shaker-left": Point(z=2.5),
            "temp-module": Point(z=5.0),
            "thermo-cycler": Point(z=2.5),
        }
        # make sure arguments are correct
        action_options = ["pick-up", "drop"]
        item_options = list(_hw_offsets.keys())
        item_options.remove("heater-shaker-left")
        item_options.remove("heater-shaker-right")
        item_options.append("heater-shaker")
        if action not in action_options:
            raise ValueError(f'"{action}" not recognized, available options: {action_options}')
        if item not in item_options:
            raise ValueError(f'"{item}" not recognized, available options: {item_options}')
        if item == "heater-shaker":
            assert slot, 'argument slot= is required when using "heater-shaker"'
            if slot in [1, 4, 7, 10]:
                side = "left"
            elif slot in [3, 6, 9, 12]:
                side = "right"
            else:
                raise ValueError("heater shaker must be on either left or right side")
            hw_offset = _hw_offsets[f"{item}-{side}"]
        else:
            hw_offset = _hw_offsets[item]
        if action == "pick-up":
            offset = hw_offset + _pick_up_offsets[item]
        else:
            offset = hw_offset + _drop_offsets[item]

        # convert from Point() to dict()
        return {"x": offset.x, "y": offset.y, "z": offset.z}

    ############################################################################################################################################
    ############################################################################################################################################
    ############################################################################################################################################
    # commands
    for loop in range(RUN):
        thermocycler.open_lid()
        heatershaker.open_labware_latch()
        if DRYRUN == False:
            if STEP_HYB == 1:
                protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
                thermocycler.set_block_temperature(4)
                thermocycler.set_lid_temperature(100)
                temp_block.set_temperature(4)
            else:
                protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
                thermocycler.set_block_temperature(58)
                thermocycler.set_lid_temperature(58)
                heatershaker.set_and_wait_for_temperature(58)
        protocol.pause("Ready")
        heatershaker.close_labware_latch()
        Liquid_trash = Liquid_trash_well_1

        # Sample Plate contains 30ul  of DNA

        if STEP_VOLPOOL == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Quick Vol Pool")
            protocol.comment("==============================================")

        if STEP_HYB == 1:
            protocol.comment("==============================================")
            protocol.comment("--> HYB")
            protocol.comment("==============================================")

            protocol.comment("--> Adding NHB2")
            NHB2Vol = 50
            for loop, X in enumerate(column_1_list):
                p50.pick_up_tip()
                p50.aspirate(NHB2Vol, NHB2.bottom())
                p50.dispense(NHB2Vol, sample_plate_1[X].bottom())
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            protocol.comment("--> Adding Panel")
            PanelVol = 10
            for loop, X in enumerate(column_1_list):
                p50.pick_up_tip()
                p50.aspirate(PanelVol, Panel.bottom())
                p50.dispense(PanelVol, sample_plate_1[X].bottom())
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            protocol.comment("--> Adding EHB2")
            EHB2Vol = 10
            EHB2MixRep = 10 if DRYRUN == False else 1
            EHB2MixVol = 90
            for loop, X in enumerate(column_1_list):
                p1000.pick_up_tip()
                p1000.aspirate(EHB2Vol, EHB2.bottom())
                p1000.dispense(EHB2Vol, sample_plate_1[X].bottom())
                p1000.move_to(sample_plate_1[X].bottom())
                p1000.mix(EHB2MixRep, EHB2MixVol)
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p50_tips += 1
                tipcheck()

            if HYBRIDDECK == True:
                protocol.comment("Hybridize on Deck")
                ############################################################################################################################################
                thermocycler.close_lid()
                if DRYRUN == False:
                    profile_TAGSTOP = [
                        {"temperature": 98, "hold_time_minutes": 5},
                        {"temperature": 97, "hold_time_minutes": 1},
                        {"temperature": 95, "hold_time_minutes": 1},
                        {"temperature": 93, "hold_time_minutes": 1},
                        {"temperature": 91, "hold_time_minutes": 1},
                        {"temperature": 89, "hold_time_minutes": 1},
                        {"temperature": 87, "hold_time_minutes": 1},
                        {"temperature": 85, "hold_time_minutes": 1},
                        {"temperature": 83, "hold_time_minutes": 1},
                        {"temperature": 81, "hold_time_minutes": 1},
                        {"temperature": 79, "hold_time_minutes": 1},
                        {"temperature": 77, "hold_time_minutes": 1},
                        {"temperature": 75, "hold_time_minutes": 1},
                        {"temperature": 73, "hold_time_minutes": 1},
                        {"temperature": 71, "hold_time_minutes": 1},
                        {"temperature": 69, "hold_time_minutes": 1},
                        {"temperature": 67, "hold_time_minutes": 1},
                        {"temperature": 65, "hold_time_minutes": 1},
                        {"temperature": 63, "hold_time_minutes": 1},
                        {"temperature": 62, "hold_time_minutes": HYBRIDTIME * 60},
                    ]
                    thermocycler.execute_profile(steps=profile_TAGSTOP, repetitions=1, block_max_volume=100)
                    thermocycler.set_block_temperature(62)
                    if HYBRID_PAUSE == True:
                        protocol.comment("HYBRIDIZATION PAUSED")
                    thermocycler.set_block_temperature(10)
                thermocycler.open_lid()
                ############################################################################################################################################
            else:
                protocol.comment("Hybridize off Deck")

        if STEP_CAPTURE == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Capture")
            protocol.comment("==============================================")
            # Standard Setup

            if DRYRUN == False:
                protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
                thermocycler.set_block_temperature(58)
                thermocycler.set_lid_temperature(58)

            if DRYRUN == False:
                heatershaker.set_and_wait_for_temperature(58)

            protocol.comment("--> Transfer Hybridization")
            TransferSup = 100
            for loop, X in enumerate(column_1_list):
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_1[X].bottom(z=0.25))
                p1000.aspirate(TransferSup + 1, rate=0.25)
                p1000.dispense(TransferSup + 5, sample_plate_2[column_2_list[loop]].bottom(z=1))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            thermocycler.close_lid()

            protocol.comment("--> ADDING SMB")
            SMBVol = 250
            SampleVol = 100
            SMBMixRPM = 2000
            SMBMixRep = 5 * 60 if DRYRUN == False else 0.1 * 60
            SMBPremix = 3 if DRYRUN == False else 1
            # ==============================
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.mix(SMBPremix, 200, SMB.bottom(z=1))
                p1000.aspirate(SMBVol / 2, SMB.bottom(z=1), rate=0.25)
                p1000.dispense(SMBVol / 2, sample_plate_2[X].top(z=-7), rate=0.25)
                p1000.aspirate(SMBVol / 2, SMB.bottom(z=1), rate=0.25)
                p1000.dispense(SMBVol / 2, sample_plate_2[X].bottom(z=1), rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(sample_plate_2[X].bottom(z=5))
                for Mix in range(2):
                    p1000.aspirate(100, rate=0.5)
                    p1000.move_to(sample_plate_2[X].bottom(z=1))
                    p1000.aspirate(80, rate=0.5)
                    p1000.dispense(80, rate=0.5)
                    p1000.move_to(sample_plate_2[X].bottom(z=5))
                    p1000.dispense(100, rate=0.5)
                    Mix += 1
                p1000.blow_out(sample_plate_2[X].top(z=-7))
                p1000.default_speed = 400
                p1000.move_to(sample_plate_2[X].top(z=5))
                p1000.move_to(sample_plate_2[X].top(z=0))
                p1000.move_to(sample_plate_2[X].top(z=5))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()
            # ==============================
            heatershaker.set_and_wait_for_shake_speed(rpm=SMBMixRPM)
            protocol.delay(SMBMixRep)
            heatershaker.deactivate_shaker()

            # ============================================================================================
            # GRIPPER MOVE sample_plate_2 FROM heatershaker TO MAGPLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
                drop_offset=grip_offset("drop", "mag-plate"),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            thermocycler.open_lid()

            if DRYRUN == False:
                protocol.delay(minutes=2)

            protocol.comment("==============================================")
            protocol.comment("--> WASH")
            protocol.comment("==============================================")
            # Setting Labware to Resume at Cleanup 1

            protocol.comment("--> Remove SUPERNATANT")
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_2[X].bottom(4))
                p1000.aspirate(200, rate=0.25)
                p1000.dispense(200, Liquid_trash.top(z=-7))
                p1000.move_to(sample_plate_2[X].bottom(0.5))
                p1000.aspirate(200, rate=0.25)
                p1000.dispense(200, Liquid_trash.top(z=-7))
                p1000.move_to(Liquid_trash.top(z=-7))
                protocol.delay(minutes=0.1)
                p1000.blow_out(Liquid_trash.top(z=-7))
                p1000.aspirate(20)
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            Liquid_trash = Liquid_trash_well_2

            # ============================================================================================
            # GRIPPER MOVE sample_plate_2 FROM MAGPLATE TO heatershaker
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=heatershaker,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "mag-plate"),
                drop_offset=grip_offset("drop", "heater-shaker", 1),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Repeating 3 washes")
            washreps = 3
            washcount = 0
            for wash in range(washreps):

                protocol.comment("--> Adding EEW")
                EEWVol = 200
                for loop, X in enumerate(column_2_list):
                    p1000.pick_up_tip()
                    p1000.aspirate(EEWVol, WASHES[loop].bottom())
                    p1000.dispense(EEWVol, sample_plate_2[X].bottom())
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                    tipcheck()
                heatershaker.close_labware_latch()
                heatershaker.set_and_wait_for_shake_speed(rpm=1800)
                if DRYRUN == False:
                    protocol.delay(seconds=4 * 60)
                heatershaker.deactivate_shaker()
                heatershaker.open_labware_latch()

                if DRYRUN == False:
                    protocol.delay(seconds=5 * 60)

                # ============================================================================================
                # GRIPPER MOVE sample_plate_2 FROM heatershaker TO MAGPLATE
                heatershaker.open_labware_latch()
                protocol.move_labware(
                    labware=sample_plate_2,
                    new_location=MAG_PLATE_SLOT,
                    use_gripper=USE_GRIPPER,
                    pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
                    drop_offset=grip_offset("drop", "mag-plate"),
                )
                heatershaker.close_labware_latch()
                # ============================================================================================

                if DRYRUN == False:
                    protocol.delay(seconds=1 * 60)

                if washcount > 2:
                    Liquid_trash = Liquid_trash_well_3

                protocol.comment("--> Removing Supernatant")
                RemoveSup = 200
                for loop, X in enumerate(column_2_list):
                    p1000.pick_up_tip()
                    p1000.move_to(sample_plate_2[X].bottom(z=3.5))
                    p1000.aspirate(RemoveSup - 100, rate=0.25)
                    protocol.delay(minutes=0.1)
                    p1000.move_to(sample_plate_2[X].bottom(z=0.5))
                    p1000.aspirate(100, rate=0.25)
                    p1000.move_to(sample_plate_2[X].top(z=0.5))
                    p1000.dispense(200, Liquid_trash.top(z=-7))
                    protocol.delay(minutes=0.1)
                    p1000.blow_out(Liquid_trash.top(z=-7))
                    p1000.aspirate(20)
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                    tipcheck()

                # ============================================================================================
                # GRIPPER MOVE sample_plate_2 FROM MAGPLATE TO heatershaker
                heatershaker.open_labware_latch()
                protocol.move_labware(
                    labware=sample_plate_2,
                    new_location=heatershaker,
                    use_gripper=USE_GRIPPER,
                    pick_up_offset=grip_offset("pick-up", "mag-plate"),
                    drop_offset=grip_offset("drop", "heater-shaker", 1),
                )
                heatershaker.close_labware_latch()
                # ============================================================================================

                washcount += 1

            protocol.comment("--> Adding EEW")
            EEWVol = 200
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.aspirate(EEWVol, WASHES[loop].bottom())
                p1000.dispense(EEWVol, sample_plate_2[X].bottom())
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            heatershaker.set_and_wait_for_shake_speed(rpm=1800)
            if DRYRUN == False:
                protocol.delay(seconds=4 * 60)
            heatershaker.deactivate_shaker()

            if DRYRUN == False:
                protocol.delay(seconds=1 * 60)

            protocol.comment("--> Transfer Hybridization")
            TransferSup = 200
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_2[X].bottom(z=0.25))
                p1000.aspirate(TransferSup, rate=0.25)
                p1000.dispense(TransferSup, sample_plate_2[column_3_list[loop]].bottom(z=1))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            if DRYRUN == False:
                protocol.delay(seconds=5 * 60)

            # ============================================================================================
            # GRIPPER MOVE sample_plate_2 FROM heatershaker TO MAGPLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
                drop_offset=grip_offset("drop", "mag-plate"),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            if DRYRUN == False:
                protocol.delay(seconds=1 * 60)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 150
            for loop, X in enumerate(column_3_list):
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_2[X].bottom(z=3.5))
                p1000.aspirate(RemoveSup - 100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(sample_plate_2[X].bottom(z=0.5))
                p1000.aspirate(100, rate=0.25)
                p1000.move_to(sample_plate_2[X].top(z=0.5))
                p1000.dispense(200, Liquid_trash.top(z=-7))
                protocol.delay(minutes=0.1)
                p1000.blow_out(Liquid_trash.top(z=-7))
                p1000.aspirate(20)
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            protocol.comment("--> Removing Residual")
            for loop, X in enumerate(column_3_list):
                p50.pick_up_tip()
                p50.move_to(sample_plate_2[X].bottom(z=0))
                p50.aspirate(50, rate=0.25)
                p50.default_speed = 200
                p50.dispense(100, Liquid_trash.top(z=-7))
                protocol.delay(minutes=0.1)
                p50.blow_out()
                p50.default_speed = 400
                p50.move_to(Liquid_trash.top(z=-7))
                p50.move_to(Liquid_trash.top(z=0))
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            protocol.comment("==============================================")
            protocol.comment("--> ELUTE")
            protocol.comment("==============================================")

            protocol.comment("--> Adding Elute")
            EluteVol = 23
            for loop, X in enumerate(column_3_list):
                p50.pick_up_tip()
                p50.aspirate(EluteVol, Elute.bottom())
                p50.dispense(EluteVol, sample_plate_2[X].bottom())
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            # ============================================================================================
            # GRIPPER MOVE sample_plate_2 FROM MAGPLATE TO heatershaker
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=heatershaker,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "mag-plate"),
                drop_offset=grip_offset("drop", "heater-shaker", 1),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            heatershaker.close_labware_latch()
            heatershaker.set_and_wait_for_shake_speed(rpm=1800)
            if DRYRUN == False:
                protocol.delay(seconds=2 * 60)
            heatershaker.deactivate_shaker()
            heatershaker.open_labware_latch()

            if DRYRUN == False:
                protocol.delay(minutes=2)

            # ============================================================================================
            # GRIPPER MOVE sample_plate_2 FROM heatershaker TO MAGPLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
                drop_offset=grip_offset("drop", "mag-plate"),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Transfer Elution")
            TransferSup = 21
            for loop, X in enumerate(column_3_list):
                p50.pick_up_tip()
                p50.move_to(sample_plate_2[X].bottom(z=0.25))
                p50.aspirate(TransferSup + 1, rate=0.25)
                p50.dispense(TransferSup + 5, sample_plate_1[column_4_list[loop]].bottom(z=1))
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            protocol.comment("--> Adding ET2")
            ET2Vol = 4
            ET2MixRep = 10 if DRYRUN == False else 1
            ET2MixVol = 20
            for loop, X in enumerate(column_4_list):
                p50.pick_up_tip()
                p50.aspirate(ET2Vol, ET2.bottom())
                p50.dispense(ET2Vol, sample_plate_1[X].bottom())
                p50.move_to(sample_plate_1[X].bottom())
                p50.mix(ET2MixRep, ET2MixVol)
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

        if STEP_PCR == 1:
            protocol.comment("==============================================")
            protocol.comment("--> AMPLIFICATION")
            protocol.comment("==============================================")

            protocol.comment("--> Adding PPC")
            PPCVol = 5
            for loop, X in enumerate(column_4_list):
                p50.pick_up_tip()
                p50.aspirate(PPCVol, PPC.bottom())
                p50.dispense(PPCVol, sample_plate_1[X].bottom())
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            protocol.comment("--> Adding EPM")
            EPMVol = 20
            EPMMixRep = 10 if DRYRUN == False else 1
            EPMMixVol = 45
            for loop, X in enumerate(column_4_list):
                p50.pick_up_tip()
                p50.aspirate(EPMVol, EPM.bottom())
                p50.dispense(EPMVol, sample_plate_1[X].bottom())
                p50.move_to(sample_plate_1[X].bottom())
                p50.mix(EPMMixRep, EPMMixVol)
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

        if DRYRUN == False:
            heatershaker.deactivate_heater()

        if STEP_PCRDECK == 1:
            if DRYRUN == False:
                ############################################################################################################################################
                if DRYRUN == False:
                    thermocycler.close_lid()
                    profile_PCR_1 = [{"temperature": 98, "hold_time_seconds": 45}]
                    thermocycler.execute_profile(steps=profile_PCR_1, repetitions=1, block_max_volume=50)
                    profile_PCR_2 = [
                        {"temperature": 98, "hold_time_seconds": 30},
                        {"temperature": 60, "hold_time_seconds": 30},
                        {"temperature": 72, "hold_time_seconds": 30},
                    ]
                    thermocycler.execute_profile(steps=profile_PCR_2, repetitions=12, block_max_volume=50)
                    profile_PCR_3 = [{"temperature": 72, "hold_time_minutes": 1}]
                    thermocycler.execute_profile(steps=profile_PCR_3, repetitions=1, block_max_volume=50)
                    thermocycler.set_block_temperature(10)
                ############################################################################################################################################

                thermocycler.open_lid()

        if STEP_CLEANUP == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Cleanup")
            protocol.comment("==============================================")

            # ============================================================================================
            # GRIPPER MOVE sample_plate_2 FROM MAGPLATE TO heatershaker
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=heatershaker,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "mag-plate"),
                drop_offset=grip_offset("drop", "heater-shaker", 1),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Transfer Elution")
            TransferSup = 45
            for loop, X in enumerate(column_4_list):
                p50.pick_up_tip()
                p50.move_to(sample_plate_1[X].bottom(z=0.25))
                p50.aspirate(TransferSup + 1, rate=0.25)
                p50.dispense(TransferSup + 5, sample_plate_2[column_5_list[loop]].bottom(z=1))
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                tipcheck()

            Liquid_trash = Liquid_trash_well_4

            protocol.comment("--> ADDING AMPure (0.8x)")
            AMPureVol = 40.5
            SampleVol = 45
            AMPureMixRep = 5 * 60 if DRYRUN == False else 0.1 * 60
            AMPurePremix = 3 if DRYRUN == False else 1
            # ========NEW SINGLE TIP DISPENSE===========
            for loop, X in enumerate(column_5_list):
                p1000.pick_up_tip()
                p1000.mix(AMPurePremix, AMPureVol + 10, AMPure.bottom(z=1))
                p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
                p1000.dispense(AMPureVol, sample_plate_2[X].bottom(z=1), rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(sample_plate_2[X].bottom(z=5))
                for Mix in range(2):
                    p1000.aspirate(60, rate=0.5)
                    p1000.move_to(sample_plate_2[X].bottom(z=1))
                    p1000.aspirate(60, rate=0.5)
                    p1000.dispense(60, rate=0.5)
                    p1000.move_to(sample_plate_2[X].bottom(z=5))
                    p1000.dispense(30, rate=0.5)
                    Mix += 1
                p1000.blow_out(sample_plate_2[X].top(z=2))
                p1000.default_speed = 400
                p1000.move_to(sample_plate_2[X].top(z=5))
                p1000.move_to(sample_plate_2[X].top(z=0))
                p1000.move_to(sample_plate_2[X].top(z=5))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()
            # ========NEW HS MIX=========================
            heatershaker.set_and_wait_for_shake_speed(rpm=1800)
            protocol.delay(AMPureMixRep)
            heatershaker.deactivate_shaker()

            # ============================================================================================
            # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
                drop_offset=grip_offset("drop", "mag-plate"),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=4)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 200
            for loop, X in enumerate(column_5_list):
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_2[X].bottom(z=3.5))
                p1000.aspirate(RemoveSup - 100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(sample_plate_2[X].bottom(z=0.5))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(sample_plate_2[X].top(z=2))
                p1000.default_speed = 200
                p1000.dispense(200, Liquid_trash.top(z=-7))
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                p1000.default_speed = 400
                p1000.move_to(Liquid_trash.top(z=-7))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            for X in range(2):
                protocol.comment("--> ETOH Wash")
                ETOHMaxVol = 150
                for loop, X in enumerate(column_5_list):
                    p1000.pick_up_tip()
                    p1000.aspirate(ETOHMaxVol, EtOH.bottom(z=1))
                    p1000.move_to(EtOH.top(z=0))
                    p1000.move_to(EtOH.top(z=-5))
                    p1000.move_to(EtOH.top(z=0))
                    p1000.move_to(sample_plate_2[X].top(z=-2))
                    p1000.dispense(ETOHMaxVol, rate=1)
                    protocol.delay(minutes=0.1)
                    p1000.blow_out()
                    p1000.move_to(sample_plate_2[X].top(z=5))
                    p1000.move_to(sample_plate_2[X].top(z=0))
                    p1000.move_to(sample_plate_2[X].top(z=5))
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                    tipcheck()

                if DRYRUN == False:
                    protocol.delay(minutes=0.5)

                protocol.comment("--> Remove ETOH Wash")
                for loop, X in enumerate(column_5_list):
                    p1000.pick_up_tip()
                    p1000.move_to(sample_plate_2[X].bottom(z=3.5))
                    p1000.aspirate(RemoveSup - 100, rate=0.25)
                    protocol.delay(minutes=0.1)
                    p1000.move_to(sample_plate_2[X].bottom(z=0.5))
                    p1000.aspirate(100, rate=0.25)
                    p1000.default_speed = 5
                    p1000.move_to(sample_plate_2[X].top(z=2))
                    p1000.default_speed = 200
                    p1000.dispense(200, Liquid_trash.top(z=-7))
                    protocol.delay(minutes=0.1)
                    p1000.blow_out()
                    p1000.default_speed = 400
                    p1000.move_to(Liquid_trash.top(z=-7))
                    p1000.move_to(Liquid_trash.top(z=0))
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                    tipcheck()

            if DRYRUN == False:
                protocol.delay(minutes=2)

            protocol.comment("--> Removing Residual ETOH")
            for loop, X in enumerate(column_5_list):
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_2[X].bottom(z=0))
                p1000.aspirate(50, rate=0.25)
                p1000.default_speed = 200
                p1000.dispense(100, Liquid_trash.top(z=-7))
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                p1000.default_speed = 400
                p1000.move_to(Liquid_trash.top(z=-7))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

            if DRYRUN == False:
                protocol.delay(minutes=1)

            # ============================================================================================
            # GRIPPER MOVE PLATE FROM MAG PLATE TO HEATER SHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=heatershaker,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "mag-plate"),
                drop_offset=grip_offset("drop", "heater-shaker", 1),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Adding RSB")
            RSBVol = 32
            RSBMixRep = 1 * 60 if DRYRUN == False else 0.1 * 60
            for loop, X in enumerate(column_5_list):
                p1000.pick_up_tip()
                p1000.aspirate(RSBVol, RSB.bottom(z=1))

                p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=1.3 * 0.8, y=0, z=-4))))
                p1000.dispense(RSBVol, rate=1)
                p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=1))
                p1000.aspirate(RSBVol, rate=1)
                p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=0, y=1.3 * 0.8, z=-4))))
                p1000.dispense(RSBVol, rate=1)
                p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=1))
                p1000.aspirate(RSBVol, rate=1)
                p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=1.3 * -0.8, y=0, z=-4))))
                p1000.dispense(RSBVol, rate=1)
                p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=1))
                p1000.aspirate(RSBVol, rate=1)
                p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=0, y=1.3 * -0.8, z=-4))))
                p1000.dispense(RSBVol, rate=1)
                p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=1))
                p1000.aspirate(RSBVol, rate=1)
                p1000.dispense(RSBVol, rate=1)

                p1000.blow_out(sample_plate_2.wells_by_name()[X].center())
                p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=5))
                p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=0))
                p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=5))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()
                if DRYRUN == False:
                    heatershaker.set_and_wait_for_shake_speed(rpm=1600)
                    protocol.delay(RSBMixRep)
                    heatershaker.deactivate_shaker()

            # ============================================================================================
            # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
                drop_offset=grip_offset("drop", "mag-plate"),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=3)

            protocol.comment("--> Transferring Supernatant")
            TransferSup = 30
            for loop, X in enumerate(column_5_list):
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_2[X].bottom(z=0.25))
                p1000.aspirate(TransferSup + 1, rate=0.25)
                p1000.dispense(TransferSup + 5, sample_plate_1[column_6_list[loop]].bottom(z=1))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                tipcheck()

        if ABR_TEST == True:
            protocol.comment("==============================================")
            protocol.comment("--> Resetting Run")
            protocol.comment("==============================================")

            # ============================================================================================
            # GRIPPER MOVE PLATE FROM MAG PLATE TO HEATER SHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=heatershaker,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "mag-plate"),
                drop_offset=grip_offset("drop", "heater-shaker", 1),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            p1000.pick_up_tip()
            # Resetting NHB2
            p1000.aspirate(COLUMNS * 50, Liquid_trash_well_1.bottom(z=1))
            p1000.dispense(COLUMNS * 50, NHB2.bottom(z=1))
            # Resetting Panel
            p1000.aspirate(COLUMNS * 10, Liquid_trash_well_1.bottom(z=1))
            p1000.dispense(COLUMNS * 10, Panel.bottom(z=1))
            # Resetting EHB2
            p1000.aspirate(COLUMNS * 10, Liquid_trash_well_1.bottom(z=1))
            p1000.dispense(COLUMNS * 10, EHB2.bottom(z=1))
            # Resetting SMB
            for X in range(COLUMNS):
                p1000.aspirate(125, Liquid_trash_well_1.bottom(z=1))
                p1000.dispense(125, SMB.bottom(z=1))
                p1000.aspirate(125, Liquid_trash_well_1.bottom(z=1))
                p1000.dispense(125, SMB.bottom(z=1))

            # Resetting TWB
            for X in range(COLUMNS):

                p1000.aspirate(200, Liquid_trash_well_2.bottom(z=1))
                p1000.dispense(200, EEW_1.bottom(z=1))
                p1000.aspirate(200, Liquid_trash_well_2.bottom(z=1))
                p1000.dispense(200, EEW_1.bottom(z=1))
                p1000.aspirate(200, Liquid_trash_well_2.bottom(z=1))
                p1000.dispense(200, EEW_2.bottom(z=1))
                p1000.aspirate(200, Liquid_trash_well_2.bottom(z=1))
                p1000.dispense(200, EEW_2.bottom(z=1))
                p1000.aspirate(200, Liquid_trash_well_2.bottom(z=1))
                p1000.dispense(200, EEW_3.bottom(z=1))
                p1000.aspirate(200, Liquid_trash_well_2.bottom(z=1))
                p1000.dispense(200, EEW_3.bottom(z=1))
                p1000.aspirate(200, Liquid_trash_well_3.bottom(z=1))
                p1000.dispense(200, EEW_1.bottom(z=1))
                p1000.aspirate(200, Liquid_trash_well_3.bottom(z=1))
                p1000.dispense(200, EEW_1.bottom(z=1))
                p1000.aspirate(200, Liquid_trash_well_3.bottom(z=1))
                p1000.dispense(200, EEW_2.bottom(z=1))
                p1000.aspirate(200, Liquid_trash_well_3.bottom(z=1))
                p1000.dispense(200, EEW_2.bottom(z=1))
                p1000.aspirate(200, Liquid_trash_well_3.bottom(z=1))
                p1000.dispense(200, EEW_3.bottom(z=1))
                p1000.aspirate(200, Liquid_trash_well_3.bottom(z=1))
                p1000.dispense(200, EEW_3.bottom(z=1))
            # Resetting ETOH
            for X in range(COLUMNS):
                p1000.aspirate(150, Liquid_trash_well_4.bottom(z=1))
                p1000.dispense(150, EtOH.bottom(z=1))
                p1000.aspirate(150, Liquid_trash_well_4.bottom(z=1))
                p1000.dispense(150, EtOH.bottom(z=1))
            # Resetting AMPURE
            for X in range(COLUMNS):
                p1000.aspirate(COLUMNS * 40.5, Liquid_trash_well_4.bottom(z=1))
                p1000.dispense(COLUMNS * 40.5, AMPure.bottom(z=1))
            # Resetting Elute
            p1000.aspirate(COLUMNS * 25, Liquid_trash_well_4.bottom(z=1))
            p1000.dispense(COLUMNS * 25, Elute.bottom(z=1))
            # Resetting EPM
            p1000.aspirate(COLUMNS * 40, Liquid_trash_well_4.bottom(z=1))
            p1000.dispense(COLUMNS * 40, EPM.bottom(z=1))
            p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
            p200_tips += 1
            tipcheck()

            p50.pick_up_tip()
            # Resetting ET2
            p50.aspirate(COLUMNS * 4, Liquid_trash_well_4.bottom(z=1))
            p50.dispense(COLUMNS * 4, ET2.bottom(z=1))
            # Resetting PPC
            p50.aspirate(COLUMNS * 5, Liquid_trash_well_4.bottom(z=1))
            p50.dispense(COLUMNS * 5, PPC.bottom(z=1))
            # Removing Final Samples
            for loop, X in enumerate(column_6_list):
                p50.aspirate(32, sample_plate_1[X].bottom(z=1))
                p50.dispense(32, Liquid_trash_well_4.bottom(z=1))
            # Resetting Samples
            for loop, X in enumerate(column_1_list):
                p50.aspirate(30, Liquid_trash_well_4.bottom(z=1))
                p50.dispense(30, sample_plate_1[X].bottom(z=1))

            p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
            p50_tips += 1
            tipcheck()
