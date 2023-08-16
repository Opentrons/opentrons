from opentrons import protocol_api
from opentrons import types

metadata = {
    "protocolName": "IDT xGen EZ 96x Head PART I-III ABR",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.15",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.15",
}

# SCRIPT SETTINGS
DRYRUN = True  # True = skip incubation times, shorten mix, for testing purposes
USE_GRIPPER = True  # True = Uses Gripper, False = Manual Move
TIP_TRASH = False  # True = Used tips go in Trash, False = Used tips go back into rack
MODULES = False  # True = Use Modules, False - No Modules for testing purposes

# PROTOCOL SETTINGS
FRAGTIME = 27  # Minutes, Duration of the Fragmentation Step
PCRCYCLES = 5  # Amount of Cycles

# PROTOCOL BLOCKS
STEP_FRERAT = 1
STEP_FRERATDECK = 1
STEP_LIG = 1
STEP_LIGDECK = 1
STEP_CLEANUP = 1
STEP_PCR = 1
STEP_PCRDECK = 1
STEP_POSTPCR = 1

############################################################################################################################################
############################################################################################################################################
############################################################################################################################################


def run(protocol: protocol_api.ProtocolContext):

    protocol.comment("THIS IS A DRY RUN") if DRYRUN == True else protocol.comment("THIS IS A REACTION RUN")
    protocol.comment("USED TIPS WILL GO IN TRASH") if TIP_TRASH == True else protocol.comment(
        "USED TIPS WILL BE RE-RACKED"
    )

    # DECK SETUP AND LABWARE
    # ========== FIRST ROW ===========
    if MODULES == True:
        heatershaker = protocol.load_module("heaterShakerModuleV1", "1")
        reagent_plate_1 = heatershaker.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    else:
        heatershaker = 1
        reagent_plate_1 = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "1")
    reservoir_1 = protocol.load_labware("nest_96_wellplate_2ml_deep", "2")
    if MODULES == True:
        temp_block = protocol.load_module("temperature module gen2", "3")
        reagent_plate_2 = temp_block.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    else:
        reagent_plate_2 = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "3")
    # ========== SECOND ROW ==========
    MAG_PLATE_SLOT = protocol.load_module("magneticBlockV1", "4")
    reservoir_2 = protocol.load_labware("nest_96_wellplate_2ml_deep", "5")
    tiprack_20_1 = protocol.load_labware("opentrons_ot3_96_tiprack_50ul_rss", "6")
    # ========== THIRD ROW ===========
    if MODULES == True:
        thermocycler = protocol.load_module("thermocycler module gen2")
        sample_plate_1 = thermocycler.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    else:
        thermocycler = 7
        sample_plate_1 = protocol.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "7")
    reservoir_3 = protocol.load_labware("nest_96_wellplate_2ml_deep", "8")
    tiprack_200_1 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul_rss", "9")
    # ========== FOURTH ROW ==========
    reservoir_4 = protocol.load_labware("nest_96_wellplate_2ml_deep", "11")

    # ========= REAGENT PLATE ==========
    FRERAT = reagent_plate_1.wells_by_name()["A1"]
    LIG = reagent_plate_2.wells_by_name()["A1"]
    PCR = reagent_plate_2.wells_by_name()["A1"]
    sample_plate_2 = reagent_plate_1
    sample_plate_3 = reagent_plate_2

    # =========== RESERVOIR ==========
    EtOH_1 = reservoir_1["A1"]
    AMPure = reservoir_2["A1"]
    RSB = reservoir_3["A1"]
    Liquid_trash = reservoir_4["A1"]

    # pipette
    p1000 = protocol.load_instrument("p1000_96", "left")

    # tip and sample tracking

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
            "mag-plate": Point(z=0.5),
            "heater-shaker": Point(),
            "temp-module": Point(),
            "thermo-cycler": Point(),
        }
        # do NOT edit these values
        # NOTE: these values will eventually be in our software
        #       and will not need to be inside a protocol
        _hw_offsets = {
            "deck": Point(),
            "mag-plate": Point(z=2.5),
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
    if MODULES == True:
        heatershaker.open_labware_latch()
    if DRYRUN == "NO":
        protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
        if MODULES == True:
            thermocycler.set_block_temperature(4)
            thermocycler.set_lid_temperature(100)
            temp_block.set_temperature(4)
    if MODULES == True:
        thermocycler.open_lid()
    protocol.pause("Ready")
    if MODULES == True:
        heatershaker.close_labware_latch()

    if STEP_FRERAT == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Fragmenting / End Repair / A-Tailing")
        protocol.comment("==============================================")

        protocol.comment("--> Adding FRERAT")
        FRERATVol = 10.5
        FRERATMixRep = 10 if DRYRUN == "NO" else 1
        FRERATMixVol = 20
        p1000.pick_up_tip(tiprack_20_1["A1"])
        p1000.aspirate(FRERATVol, FRERAT.bottom())
        p1000.dispense(FRERATVol, sample_plate_1["A1"].bottom())
        p1000.move_to(sample_plate_1["A1"].bottom())
        p1000.mix(FRERATMixRep, FRERATMixVol)
        p1000.return_tip()

    if STEP_FRERATDECK == 1:
        if MODULES == True:
            ############################################################################################################################################
            protocol.comment("Seal, Run FRERAT (60min)")
            thermocycler.close_lid()
            if DRYRUN == "NO":
                profile_FRERAT = [
                    {"temperature": 32, "hold_time_minutes": FRAGTIME},
                    {"temperature": 65, "hold_time_minutes": 30},
                ]
                thermocycler.execute_profile(steps=profile_FRERAT, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(4)
            ############################################################################################################################################
            thermocycler.open_lid()

    if DRYRUN == "NO":
        protocol.pause("RESET tiprack_20_1")

    if STEP_LIG == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Adapter Ligation")
        protocol.comment("==============================================")

        protocol.comment("--> Adding Lig")
        LIGVol = 30
        LIGMixRep = 40 if DRYRUN == "NO" else 1
        LIGMixVol = 50
        p1000.pick_up_tip(tiprack_20_1["A1"])
        p1000.mix(3, LIGVol, LIG.bottom(z=1), rate=0.5)
        p1000.aspirate(LIGVol, LIG.bottom(z=1), rate=0.2)
        p1000.default_speed = 5
        p1000.move_to(LIG.top(5))
        protocol.delay(seconds=0.2)
        p1000.default_speed = 400
        p1000.dispense(LIGVol, sample_plate_1["A1"].bottom(), rate=0.25)
        p1000.move_to(sample_plate_1["A1"].bottom())
        p1000.mix(LIGMixRep, LIGMixVol, rate=0.5)
        p1000.blow_out(sample_plate_1["A1"].top(z=-5))
        p1000.return_tip()

    if STEP_LIGDECK == 1:
        if MODULES == True:
            ############################################################################################################################################
            if DRYRUN == "NO":
                profile_LIG = [{"temperature": 20, "hold_time_minutes": 20}]
                thermocycler.execute_profile(steps=profile_LIG, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(4)
            ############################################################################################################################################

    if DRYRUN == "NO":
        protocol.pause("RESET tiprack_20_1")

    # ============================================================================================
    # GRIPPER MOVE reagent_plate_1 FROM HEATHERSHAKER TO MAG PLATE
    if MODULES == True:
        heatershaker.open_labware_latch()
    if MODULES == True:
        protocol.move_labware(
            labware=reagent_plate_1,
            new_location=MAG_PLATE_SLOT,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
            drop_offset=grip_offset("drop", "mag-plate"),
        )
    else:
        protocol.move_labware(
            labware=reagent_plate_1,
            new_location=MAG_PLATE_SLOT,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "deck"),
            drop_offset=grip_offset("drop", "deck"),
        )
    # ============================================================================================

    # ============================================================================================
    # GRIPPER MOVE sample_plate_1 FROM THERMOCYCLER TO HEATHERSHAKER
    if MODULES == True:
        protocol.move_labware(
            labware=sample_plate_1,
            new_location=heatershaker,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "thermo-cycler"),
            drop_offset=grip_offset("drop", "heater-shaker", 1),
        )
    else:
        protocol.move_labware(
            labware=sample_plate_1,
            new_location=heatershaker,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "deck"),
            drop_offset=grip_offset("drop", "deck"),
        )
    # ============================================================================================

    # ============================================================================================
    # GRIPPER MOVE reagent_plate_1 FROM MAG PLATE TO THERMOCYCLER
    if MODULES == True:
        protocol.move_labware(
            labware=reagent_plate_1,
            new_location=thermocycler,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "mag-plate"),
            drop_offset=grip_offset("drop", "thermo-cycler"),
        )
    else:
        protocol.move_labware(
            labware=reagent_plate_1,
            new_location=thermocycler,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "deck"),
            drop_offset=grip_offset("drop", "deck"),
        )
    if MODULES == True:
        heatershaker.close_labware_latch()
    # ============================================================================================

    ############################################################################################################################################
    ############################################################################################################################################
    ############################################################################################################################################

    if STEP_CLEANUP == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Cleanup")
        protocol.comment("==============================================")

        protocol.comment("--> ADDING AMPure (0.8x)")
        AMPureVol = 48
        SampleVol = 75
        AMPureMixRep = 5 * 60 if DRYRUN == "NO" else 0.1 * 60
        AMPurePremix = 3 if DRYRUN == "NO" else 1
        # ========NEW SINGLE TIP DISPENSE===========
        p1000.pick_up_tip(tiprack_200_1["A1"])  # <---------------- Tip Pickup
        p1000.mix(AMPurePremix, AMPureVol + 10, AMPure.bottom(z=1))
        p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
        p1000.dispense(AMPureVol, sample_plate_1["A1"].bottom(z=1), rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(sample_plate_1["A1"].bottom(z=5))
        for Mix in range(2):
            p1000.aspirate(70, rate=0.5)
            p1000.move_to(sample_plate_1["A1"].bottom(z=1))
            p1000.aspirate(50, rate=0.5)
            p1000.dispense(50, rate=0.5)
            p1000.move_to(sample_plate_1["A1"].bottom(z=5))
            p1000.dispense(70, rate=0.5)
            Mix += 1
        p1000.blow_out(sample_plate_1["A1"].top(z=2))
        p1000.default_speed = 400
        p1000.move_to(sample_plate_1["A1"].top(z=5))
        p1000.move_to(sample_plate_1["A1"].top(z=0))
        p1000.move_to(sample_plate_1["A1"].top(z=5))
        p1000.return_tip()  # <---------------- Tip Return
        # ========NEW HS MIX=========================
        if MODULES == True:
            heatershaker.set_and_wait_for_shake_speed(rpm=1800)
            protocol.delay(AMPureMixRep)
            heatershaker.deactivate_shaker()

        # ============================================================================================
        # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
        if MODULES == True:
            heatershaker.open_labware_latch()
        if MODULES == True:
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
                drop_offset=grip_offset("drop", "mag-plate"),
            )
        else:
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "deck"),
                drop_offset=grip_offset("drop", "deck"),
            )
        if MODULES == True:
            heatershaker.close_labware_latch()
        # ============================================================================================

        if DRYRUN == "NO":
            protocol.delay(minutes=4)

        protocol.comment("--> Removing Supernatant")
        RemoveSup = 200
        p1000.pick_up_tip(tiprack_200_1["A1"])  # <---------------- Tip Pickup
        p1000.move_to(sample_plate_1["A1"].bottom(z=3.5))
        p1000.aspirate(RemoveSup - 100, rate=0.25)
        protocol.delay(minutes=0.1)
        p1000.move_to(sample_plate_1["A1"].bottom(z=0.5))
        p1000.aspirate(100, rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(sample_plate_1["A1"].top(z=2))
        p1000.default_speed = 200
        p1000.dispense(200, Liquid_trash.top(z=0))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(Liquid_trash.top(z=-5))
        p1000.move_to(Liquid_trash.top(z=0))
        p1000.return_tip()  # <---------------- Tip Return

        if DRYRUN == "NO":
            protocol.pause("RESET tiprack_200_1")

        for X in range(2):
            protocol.comment("--> ETOH Wash")
            ETOHMaxVol = 150
            p1000.pick_up_tip(tiprack_200_1["A1"])
            p1000.aspirate(ETOHMaxVol, EtOH_1.bottom(z=1))
            p1000.move_to(EtOH_1.top(z=0))
            p1000.move_to(EtOH_1.top(z=-5))
            p1000.move_to(EtOH_1.top(z=0))
            p1000.move_to(sample_plate_1["A1"].top(z=-2))
            p1000.dispense(ETOHMaxVol, rate=1)
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.move_to(sample_plate_1["A1"].top(z=5))
            p1000.move_to(sample_plate_1["A1"].top(z=0))
            p1000.move_to(sample_plate_1["A1"].top(z=5))
            p1000.return_tip()

            if DRYRUN == "NO":
                protocol.delay(minutes=0.5)

            protocol.comment("--> Remove ETOH Wash")
            p1000.pick_up_tip(tiprack_200_1["A1"])  # <---------------- Tip Pickup
            p1000.move_to(sample_plate_1["A1"].bottom(z=3.5))
            p1000.aspirate(RemoveSup - 100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(sample_plate_1["A1"].bottom(z=0.5))
            p1000.aspirate(100, rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(sample_plate_1["A1"].top(z=2))
            p1000.default_speed = 200
            p1000.dispense(200, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.default_speed = 400
            p1000.move_to(Liquid_trash.top(z=-5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.return_tip()  # <---------------- Tip Return

        if DRYRUN == "NO":
            protocol.delay(minutes=2)

        protocol.comment("--> Removing Residual ETOH")
        p1000.pick_up_tip(tiprack_200_1["A1"])  # <---------------- Tip Pickup
        p1000.move_to(sample_plate_1["A1"].bottom(z=0))
        p1000.aspirate(50, rate=0.25)
        p1000.default_speed = 200
        p1000.dispense(100, Liquid_trash.top(z=0))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(Liquid_trash.top(z=-5))
        p1000.move_to(Liquid_trash.top(z=0))
        p1000.return_tip()  # <---------------- Tip Return

        if DRYRUN == "NO":
            protocol.delay(minutes=1)

        # ============================================================================================
        # GRIPPER MOVE PLATE FROM MAG PLATE TO HEATER SHAKER
        if MODULES == True:
            heatershaker.open_labware_latch()
        if MODULES == True:
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=heatershaker,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "mag-plate"),
                drop_offset=grip_offset("drop", "heater-shaker", 1),
            )
        else:
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=heatershaker,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "deck"),
                drop_offset=grip_offset("drop", "deck"),
            )
        if MODULES == True:
            heatershaker.close_labware_latch()
        # ============================================================================================

        if DRYRUN == "NO":
            protocol.pause("RESET tiprack_20_1")
            protocol.pause("SWAP reagent_plate_1: -reagent_plate_1 +sample_plate_2 with Barcodes")
            protocol.pause("SWAP reagent_plate_2: -reagent_plate_2 +reagent_plate_3 with PCR")

        protocol.comment("--> Adding RSB")
        RSBVol = 22
        RSBMixRep = 4 * 60 if DRYRUN == "NO" else 0.1 * 60
        p1000.pick_up_tip(tiprack_20_1["A1"])  # <---------------- Tip Pickup
        p1000.aspirate(RSBVol, RSB.bottom(z=1))

        p1000.move_to((sample_plate_1.wells_by_name()["A1"].center().move(types.Point(x=1.3 * 0.8, y=0, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_1.wells_by_name()["A1"].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.move_to((sample_plate_1.wells_by_name()["A1"].center().move(types.Point(x=0, y=1.3 * 0.8, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_1.wells_by_name()["A1"].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.move_to((sample_plate_1.wells_by_name()["A1"].center().move(types.Point(x=1.3 * -0.8, y=0, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_1.wells_by_name()["A1"].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.move_to((sample_plate_1.wells_by_name()["A1"].center().move(types.Point(x=0, y=1.3 * -0.8, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_1.wells_by_name()["A1"].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.dispense(RSBVol, rate=1)

        p1000.blow_out(sample_plate_1.wells_by_name()["A1"].center())
        p1000.move_to(sample_plate_1.wells_by_name()["A1"].top(z=5))
        p1000.move_to(sample_plate_1.wells_by_name()["A1"].top(z=0))
        p1000.move_to(sample_plate_1.wells_by_name()["A1"].top(z=5))
        p1000.return_tip()  # <---------------- Tip Return
        if MODULES == True:
            heatershaker.set_and_wait_for_shake_speed(rpm=2000)
            protocol.delay(RSBMixRep)
            heatershaker.deactivate_shaker()

        # ============================================================================================
        # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
        if MODULES == True:
            heatershaker.open_labware_latch()
        if MODULES == True:
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
                drop_offset=grip_offset("drop", "mag-plate"),
            )
        else:
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "deck"),
                drop_offset=grip_offset("drop", "deck"),
            )
        if MODULES == True:
            heatershaker.close_labware_latch()
        # ============================================================================================

        if DRYRUN == "NO":
            protocol.delay(minutes=3)

        protocol.comment("--> Transferring Supernatant")
        TransferSup = 20
        p1000.pick_up_tip(tiprack_20_1["A1"])  # <---------------- Tip Pickup
        p1000.move_to(sample_plate_1["A1"].bottom(z=0.25))
        p1000.aspirate(TransferSup + 1, rate=0.25)
        p1000.dispense(TransferSup + 5, sample_plate_2["A1"].bottom(z=1))
        p1000.return_tip()  # <---------------- Tip Return

        if DRYRUN == "NO":
            protocol.pause("RESET tiprack_20_1")

    if STEP_PCR == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Amplification")
        protocol.comment("==============================================")

        protocol.comment("--> Adding PCR")
        PCRVol = 25
        PCRMixRep = 10
        PCRMixVol = 50
        p1000.pick_up_tip(tiprack_20_1["A1"])
        p1000.mix(2, PCRVol, PCR.bottom(z=1), rate=0.5)
        p1000.aspirate(PCRVol, PCR.bottom(z=1), rate=0.25)
        p1000.dispense(PCRVol, sample_plate_2["A1"].bottom(z=1), rate=0.25)
        p1000.mix(PCRMixRep, PCRMixVol, rate=0.5)
        p1000.move_to(sample_plate_2["A1"].bottom(z=1))
        protocol.delay(minutes=0.1)
        p1000.blow_out(sample_plate_2["A1"].top(z=-5))
        p1000.return_tip()

    if STEP_PCRDECK == 1:
        ############################################################################################################################################
        if MODULES == True:
            thermocycler.close_lid()
            if DRYRUN == "NO":
                profile_PCR_1 = [{"temperature": 98, "hold_time_seconds": 45}]
                thermocycler.execute_profile(steps=profile_PCR_1, repetitions=1, block_max_volume=50)
                profile_PCR_2 = [
                    {"temperature": 98, "hold_time_seconds": 15},
                    {"temperature": 60, "hold_time_seconds": 30},
                    {"temperature": 72, "hold_time_seconds": 30},
                ]
                thermocycler.execute_profile(steps=profile_PCR_2, repetitions=PCRCYCLES, block_max_volume=50)
                profile_PCR_3 = [{"temperature": 72, "hold_time_minutes": 1}]
                thermocycler.execute_profile(steps=profile_PCR_3, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(4)
            thermocycler.open_lid()
        ############################################################################################################################################

    ############################################################################################################################################
    ############################################################################################################################################
    ############################################################################################################################################

    # ============================================================================================
    # GRIPPER MOVE sample_plate_2 FROM THERMOCYCLER TO HEATER SHAKER
    if MODULES == True:
        heatershaker.open_labware_latch()
    if MODULES == True:
        protocol.move_labware(
            labware=sample_plate_2,
            new_location=heatershaker,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "thermo-cycler"),
            drop_offset=grip_offset("drop", "heater-shaker", 1),
        )
    else:
        protocol.move_labware(
            labware=sample_plate_2,
            new_location=heatershaker,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "deck"),
            drop_offset=grip_offset("drop", "deck"),
        )
    if MODULES == True:
        heatershaker.close_labware_latch()
    # ============================================================================================

    # ============================================================================================
    # GRIPPER MOVE sample_plate_1 FROM HMAG PLATE TO THERMOCYCLER
    if MODULES == True:
        heatershaker.open_labware_latch()
    if MODULES == True:
        protocol.move_labware(
            labware=sample_plate_1,
            new_location=thermocycler,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "mag-plate"),
            drop_offset=grip_offset("drop", "thermo-cycler"),
        )
    else:
        protocol.move_labware(
            labware=sample_plate_1,
            new_location=thermocycler,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "mag-plate"),
            drop_offset=grip_offset("drop", "thermo-cycler"),
        )
    if MODULES == True:
        heatershaker.close_labware_latch()
    # ============================================================================================

    if DRYRUN == "NO":
        protocol.pause("RESET tiprack_200_1")

    if STEP_POSTPCR == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Cleanup")
        protocol.comment("==============================================")

        protocol.comment("--> ADDING AMPure (0.8x)")
        AMPureVol = 32.5
        SampleVol = 50
        AMPureMixRep = 5 * 60 if DRYRUN == "NO" else 0.1 * 60
        AMPurePremix = 3 if DRYRUN == "NO" else 1
        # ========NEW SINGLE TIP DISPENSE===========
        p1000.pick_up_tip(tiprack_200_1["A1"])  # <---------------- Tip Pickup
        p1000.mix(AMPurePremix, AMPureVol + 10, AMPure.bottom(z=1))
        p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
        p1000.dispense(AMPureVol, sample_plate_2["A1"].bottom(z=1), rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(sample_plate_2["A1"].bottom(z=3.5))
        for Mix in range(2):
            p1000.aspirate(50, rate=0.5)
            p1000.move_to(sample_plate_2["A1"].bottom(z=1))
            p1000.aspirate(30, rate=0.5)
            p1000.dispense(30, rate=0.5)
            p1000.move_to(sample_plate_2["A1"].bottom(z=3.5))
            p1000.dispense(50, rate=0.5)
            Mix += 1
        p1000.blow_out(sample_plate_2["A1"].top(z=2))
        p1000.default_speed = 400
        p1000.move_to(sample_plate_2["A1"].top(z=5))
        p1000.move_to(sample_plate_2["A1"].top(z=0))
        p1000.move_to(sample_plate_2["A1"].top(z=5))
        p1000.return_tip()  # <---------------- Tip Return
        # ========NEW HS MIX=========================
        if MODULES == True:
            heatershaker.set_and_wait_for_shake_speed(rpm=1800)
            protocol.delay(AMPureMixRep)
            heatershaker.deactivate_shaker()

        # ============================================================================================
        # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
        if MODULES == True:
            heatershaker.open_labware_latch()
        if MODULES == True:
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
                drop_offset=grip_offset("drop", "mag-plate"),
            )
        else:
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "deck"),
                drop_offset=grip_offset("drop", "deck"),
            )
        if MODULES == True:
            heatershaker.close_labware_latch()
        # ============================================================================================

        if DRYRUN == "NO":
            protocol.delay(minutes=4)

        protocol.comment("--> Removing Supernatant")
        RemoveSup = 200
        p1000.pick_up_tip(tiprack_200_1["A1"])  # <---------------- Tip Pickup
        p1000.move_to(sample_plate_2["A1"].bottom(z=3.5))
        p1000.aspirate(RemoveSup - 100, rate=0.25)
        protocol.delay(minutes=0.1)
        p1000.move_to(sample_plate_2["A1"].bottom(z=0.5))
        p1000.aspirate(100, rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(sample_plate_2["A1"].top(z=2))
        p1000.default_speed = 200
        p1000.dispense(200, Liquid_trash.top(z=0))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(Liquid_trash.top(z=-5))
        p1000.move_to(Liquid_trash.top(z=0))
        p1000.return_tip()  # <---------------- Tip Return

        if DRYRUN == "NO":
            protocol.pause("RESET tiprack_200_1")

        for X in range(2):
            protocol.comment("--> ETOH Wash")
            ETOHMaxVol = 150
            p1000.pick_up_tip(tiprack_200_1["A1"])
            p1000.aspirate(ETOHMaxVol, EtOH_1.bottom(z=1))
            p1000.move_to(EtOH_1.top(z=0))
            p1000.move_to(EtOH_1.top(z=-5))
            p1000.move_to(EtOH_1.top(z=0))
            p1000.move_to(sample_plate_2["A1"].top(z=-2))
            p1000.dispense(ETOHMaxVol, rate=1)
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.move_to(sample_plate_2["A1"].top(z=5))
            p1000.move_to(sample_plate_2["A1"].top(z=0))
            p1000.move_to(sample_plate_2["A1"].top(z=5))
            p1000.return_tip()

            if DRYRUN == "NO":
                protocol.delay(minutes=0.5)

            protocol.comment("--> Remove ETOH Wash")
            p1000.pick_up_tip(tiprack_200_1["A1"])  # <---------------- Tip Pickup
            p1000.move_to(sample_plate_2["A1"].bottom(z=3.5))
            p1000.aspirate(RemoveSup - 100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(sample_plate_2["A1"].bottom(z=0.5))
            p1000.aspirate(100, rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(sample_plate_2["A1"].top(z=2))
            p1000.default_speed = 200
            p1000.dispense(200, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.default_speed = 400
            p1000.move_to(Liquid_trash.top(z=-5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.return_tip()  # <---------------- Tip Return

        if DRYRUN == "NO":
            protocol.delay(minutes=2)

        protocol.comment("--> Removing Residual ETOH")
        p1000.pick_up_tip(tiprack_200_1["A1"])  # <---------------- Tip Pickup
        p1000.move_to(sample_plate_2["A1"].bottom(z=0))
        p1000.aspirate(50, rate=0.25)
        p1000.default_speed = 200
        p1000.dispense(100, Liquid_trash.top(z=0))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(Liquid_trash.top(z=-5))
        p1000.move_to(Liquid_trash.top(z=0))
        p1000.return_tip()  # <---------------- Tip Return

        if DRYRUN == "NO":
            protocol.delay(minutes=1)

        # ============================================================================================
        # GRIPPER MOVE PLATE FROM MAG PLATE TO HEATER SHAKER
        if MODULES == True:
            heatershaker.open_labware_latch()
        if MODULES == True:
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=heatershaker,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "mag-plate"),
                drop_offset=grip_offset("drop", "heater-shaker", 1),
            )
        else:
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=heatershaker,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "deck"),
                drop_offset=grip_offset("drop", "deck"),
            )
        if MODULES == True:
            heatershaker.close_labware_latch()
        # ============================================================================================

        if DRYRUN == "NO":
            protocol.pause("RESET tiprack_20_1")

        protocol.comment("--> Adding RSB")
        RSBVol = 22
        RSBMixRep = 4 * 60 if DRYRUN == "NO" else 0.1 * 60
        p1000.pick_up_tip(tiprack_20_1["A1"])  # <---------------- Tip Pickup
        p1000.aspirate(RSBVol, RSB.bottom(z=1))

        p1000.move_to((sample_plate_2.wells_by_name()["A1"].center().move(types.Point(x=1.3 * 0.8, y=0, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_2.wells_by_name()["A1"].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.move_to((sample_plate_2.wells_by_name()["A1"].center().move(types.Point(x=0, y=1.3 * 0.8, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_2.wells_by_name()["A1"].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.move_to((sample_plate_2.wells_by_name()["A1"].center().move(types.Point(x=1.3 * -0.8, y=0, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_2.wells_by_name()["A1"].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.move_to((sample_plate_2.wells_by_name()["A1"].center().move(types.Point(x=0, y=1.3 * -0.8, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_2.wells_by_name()["A1"].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.dispense(RSBVol, rate=1)

        p1000.blow_out(sample_plate_2.wells_by_name()["A1"].center())
        p1000.move_to(sample_plate_2.wells_by_name()["A1"].top(z=5))
        p1000.move_to(sample_plate_2.wells_by_name()["A1"].top(z=0))
        p1000.move_to(sample_plate_2.wells_by_name()["A1"].top(z=5))
        p1000.return_tip()  # <---------------- Tip Return
        if MODULES == True:
            heatershaker.set_and_wait_for_shake_speed(rpm=2000)
            protocol.delay(RSBMixRep)
            heatershaker.deactivate_shaker()

        # ============================================================================================
        # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
        if MODULES == True:
            heatershaker.open_labware_latch()
        if MODULES == True:
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
                drop_offset=grip_offset("drop", "mag-plate"),
            )
        else:
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=MAG_PLATE_SLOT,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "deck"),
                drop_offset=grip_offset("drop", "deck"),
            )
        if MODULES == True:
            heatershaker.close_labware_latch()
        # ============================================================================================

        if DRYRUN == "NO":
            protocol.delay(minutes=3)

        protocol.comment("--> Transferring Supernatant")
        TransferSup = 20
        p1000.pick_up_tip(tiprack_20_1["A1"])  # <---------------- Tip Pickup
        p1000.move_to(sample_plate_2["A1"].bottom(z=0.25))
        p1000.aspirate(TransferSup + 1, rate=0.25)
        p1000.dispense(TransferSup + 5, sample_plate_3["A1"].bottom(z=1))
        p1000.return_tip()  # <---------------- Tip Return
