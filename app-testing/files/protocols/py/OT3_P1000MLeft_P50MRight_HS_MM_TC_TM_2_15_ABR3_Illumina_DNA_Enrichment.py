from opentrons import protocol_api
from opentrons import types

metadata = {
    "protocolName": "Illumina DNA Enrichment",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.15",
}

# SCRIPT SETTINGS
DRYRUN = "YES"  # YES or NO, DRYRUN = 'YES' will return tips, skip incubation times, shorten mix, for testing purposes
USE_GRIPPER = True


# PROTOCOL SETTINGS
SAMPLES = "8x"  # 8x
HYBRIDDECK = True
HYBRIDTIME = 1.6  # Hours

# PROTOCOL BLOCKS
STEP_VOLPOOL = 1
STEP_CAPTURE = 1
STEP_WASH = 1
STEP_PCR = 1
STEP_PCRDECK = 1
STEP_POSTPCR = 1
STEP_CLEANUP = 1

############################################################################################################################################
############################################################################################################################################
############################################################################################################################################


def run(protocol: protocol_api.ProtocolContext):
    global DRYRUN

    protocol.comment("THIS IS A DRY RUN") if DRYRUN == "YES" else protocol.comment("THIS IS A REACTION RUN")

    # DECK SETUP AND LABWARE
    # ========== FIRST ROW ===========
    heatershaker = protocol.load_module("heaterShakerModuleV1", "1")
    sample_plate_2 = heatershaker.load_labware("nest_96_wellplate_2ml_deep")
    tiprack_200_1 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "2")
    temp_block = protocol.load_module("temperature module gen2", "3")
    reagent_plate = temp_block.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    # ========== SECOND ROW ==========
    MAG_PLATE_SLOT = protocol.load_module("magneticBlockV1", "4")
    reservoir = protocol.load_labware("nest_96_wellplate_2ml_deep", "5")
    tiprack_200_2 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "6")
    # ========== THIRD ROW ===========
    thermocycler = protocol.load_module("thermocycler module gen2")
    sample_plate_1 = thermocycler.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    tiprack_20 = protocol.load_labware("opentrons_ot3_96_tiprack_50ul", "9")
    # ========== FOURTH ROW ==========

    # reagent

    AMPure = reservoir["A1"]
    SMB = reservoir["A2"]
    EEW = reservoir["A3"]
    EtOH = reservoir["A4"]
    RSB = reservoir["A5"]
    Liquid_trash = reservoir["A12"]

    EEW_1 = sample_plate_1.wells_by_name()["A8"]
    EEW_2 = sample_plate_1.wells_by_name()["A9"]
    EEW_3 = sample_plate_1.wells_by_name()["A10"]
    EEW_4 = sample_plate_1.wells_by_name()["A11"]

    NHB2 = reagent_plate.wells_by_name()["A1"]
    Panel = reagent_plate.wells_by_name()["A2"]
    EHB2 = reagent_plate.wells_by_name()["A3"]
    Elute = reagent_plate.wells_by_name()["A4"]
    ET2 = reagent_plate.wells_by_name()["A5"]
    PPC = reagent_plate.wells_by_name()["A6"]
    EPM = reagent_plate.wells_by_name()["A7"]

    # pipette
    p1000 = protocol.load_instrument("p1000_multi_gen3", "left", tip_racks=[tiprack_200_1, tiprack_200_2])
    p50 = protocol.load_instrument("p50_multi_gen3", "right", tip_racks=[tiprack_20])

    # tip and sample tracking
    sample_well = "A3"

    WASHES = [EEW_1, EEW_2, EEW_3, EEW_4]

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
            "heater-shaker": Point(y=-0.5),
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
    heatershaker.open_labware_latch()
    if DRYRUN == "NO":
        protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
        thermocycler.set_block_temperature(4)
        thermocycler.set_lid_temperature(100)
        temp_block.set_temperature(4)
    thermocycler.open_lid()
    protocol.pause("Ready")
    heatershaker.close_labware_latch()

    if STEP_VOLPOOL == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Quick Vol Pool")
        protocol.comment("==============================================")

    if STEP_CAPTURE == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Capture")
        protocol.comment("==============================================")

        protocol.comment("--> Adding NHB2")
        NHB2Vol = 50
        p50.pick_up_tip()
        p50.aspirate(NHB2Vol, NHB2.bottom())
        p50.dispense(NHB2Vol, sample_plate_1[sample_well].bottom())
        p50.return_tip()

        protocol.comment("--> Adding Panel")
        PanelVol = 10
        p50.pick_up_tip()
        p50.aspirate(PanelVol, Panel.bottom())
        p50.dispense(PanelVol, sample_plate_1[sample_well].bottom())
        p50.return_tip()

        protocol.comment("--> Adding EHB2")
        EHB2Vol = 10
        EHB2MixRep = 10 if DRYRUN == "NO" else 1
        EHB2MixVol = 90
        p1000.pick_up_tip()
        p1000.aspirate(EHB2Vol, EHB2.bottom())
        p1000.dispense(EHB2Vol, sample_plate_1[sample_well].bottom())
        p1000.move_to(sample_plate_1[sample_well].bottom())
        p1000.mix(EHB2MixRep, EHB2MixVol)
        p1000.return_tip()

        if HYBRIDDECK == True:
            protocol.comment("Hybridize on Deck")
            ############################################################################################################################################
            thermocycler.close_lid()
            if DRYRUN == "NO":
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
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
            ############################################################################################################################################
        else:
            protocol.comment("Hybridize off Deck")

    if STEP_CAPTURE == 1:
        if DRYRUN == "NO":
            heatershaker.set_and_wait_for_temperature(62)

        protocol.comment("--> Heating EEW")
        EEWVol = 120
        p1000.pick_up_tip()
        for loop, X in enumerate(["A8", "A9", "A10", "A11"]):
            p1000.aspirate(EEWVol + 1, EEW.bottom(z=0.25), rate=0.25)
            p1000.dispense(EEWVol + 5, sample_plate_1[sample_well].bottom(z=1))
        p1000.return_tip()  # <---------------- Tip Return

        protocol.comment("--> Transfer Hybridization")
        TransferSup = 100
        p1000.pick_up_tip()
        p1000.move_to(sample_plate_1[sample_well].bottom(z=0.25))
        p1000.aspirate(TransferSup + 1, rate=0.25)
        p1000.dispense(TransferSup + 5, sample_plate_2[sample_well].bottom(z=1))
        p1000.return_tip()

        thermocycler.close_lid()

        protocol.comment("--> ADDING SMB")
        SMBVol = 250
        SampleVol = 100
        SMBMixRep = 15 * 60 if DRYRUN == "NO" else 0.1 * 60
        SMBPremix = 3 if DRYRUN == "NO" else 1
        # ========NEW SINGLE TIP DISPENSE===========
        p1000.pick_up_tip()
        p1000.mix(SMBMixRep, 200, SMB.bottom(z=1))
        p1000.aspirate(SMBVol / 2, SMB.bottom(z=1), rate=0.25)
        p1000.dispense(SMBVol / 2, sample_plate_2[sample_well].top(z=2), rate=0.25)
        p1000.aspirate(SMBVol / 2, SMB.bottom(z=1), rate=0.25)
        p1000.dispense(SMBVol / 2, sample_plate_2[sample_well].bottom(z=1), rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(sample_plate_2[sample_well].bottom(z=5))
        for Mix in range(2):
            p1000.aspirate(100, rate=0.5)
            p1000.move_to(sample_plate_2[sample_well].bottom(z=1))
            p1000.aspirate(80, rate=0.5)
            p1000.dispense(80, rate=0.5)
            p1000.move_to(sample_plate_2[sample_well].bottom(z=5))
            p1000.dispense(100, rate=0.5)
            Mix += 1
        p1000.blow_out(sample_plate_2[sample_well].top(z=2))
        p1000.default_speed = 400
        p1000.move_to(sample_plate_2[sample_well].top(z=5))
        p1000.move_to(sample_plate_2[sample_well].top(z=0))
        p1000.move_to(sample_plate_2[sample_well].top(z=5))
        p1000.return_tip()
        # ========NEW HS MIX=========================
        protocol.delay(SMBMixRep)

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

        if DRYRUN == "NO":
            protocol.delay(minutes=2)

        protocol.comment("==============================================")
        protocol.comment("--> WASH")
        protocol.comment("==============================================")

        protocol.comment("--> Remove SUPERNATANT")
        p1000.pick_up_tip()
        p1000.move_to(sample_plate_2[sample_well].bottom(4))
        p1000.aspirate(200, rate=0.25)
        p1000.dispense(200, Liquid_trash)
        p1000.aspirate(200, rate=0.25)
        p1000.dispense(200, Liquid_trash)
        p1000.move_to(Liquid_trash.top(z=5))
        protocol.delay(minutes=0.1)
        p1000.blow_out(Liquid_trash.top(z=5))
        p1000.aspirate(20)
        p1000.return_tip()

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
        for wash in range(washreps):

            protocol.comment("--> Adding EEW")
            EEWVol = 200
            p1000.pick_up_tip()
            p1000.aspirate(EEWVol, WASHES[wash].bottom())
            p1000.dispense(EEWVol, sample_plate_2[sample_well].bottom())
            p1000.return_tip()

            heatershaker.close_labware_latch()
            heatershaker.set_and_wait_for_shake_speed(rpm=1600)
            protocol.delay(seconds=4 * 60)
            heatershaker.deactivate_shaker()
            heatershaker.open_labware_latch()

            if DRYRUN == "NO":
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

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 200
            p1000.pick_up_tip()
            p1000.move_to(sample_plate_2[sample_well].bottom(z=3.5))
            p1000.aspirate(RemoveSup - 100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(sample_plate_2[sample_well].bottom(z=0.5))
            p1000.aspirate(100, rate=0.25)
            p1000.move_to(sample_plate_2[sample_well].top(z=2))
            p1000.dispense(200, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out(Liquid_trash.top(z=0))
            p1000.aspirate(20)
            p1000.return_tip()

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

        protocol.comment("--> Adding EEW")
        EEWVol = 200
        p1000.pick_up_tip()
        p1000.aspirate(EEWVol, WASHES[3].bottom())
        p1000.dispense(EEWVol, sample_plate_2[sample_well].bottom())
        p1000.return_tip()

        heatershaker.set_and_wait_for_shake_speed(rpm=1600)
        if DRYRUN == "NO":
            protocol.delay(seconds=4 * 60)
        heatershaker.deactivate_shaker()

        protocol.comment("--> Transfer Hybridization")
        TransferSup = 200
        p1000.pick_up_tip()
        p1000.move_to(sample_plate_2[sample_well].bottom(z=0.25))
        p1000.aspirate(TransferSup, rate=0.25)
        sample_well = "A4"
        p1000.dispense(TransferSup, sample_plate_2[sample_well].bottom(z=1))
        p1000.return_tip()

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

        protocol.comment("--> Removing Supernatant")
        RemoveSup = 200
        p1000.pick_up_tip()
        p1000.move_to(sample_plate_2[sample_well].bottom(z=3.5))
        p1000.aspirate(RemoveSup - 100, rate=0.25)
        protocol.delay(minutes=0.1)
        p1000.move_to(sample_plate_2[sample_well].bottom(z=0.5))
        p1000.aspirate(100, rate=0.25)
        p1000.move_to(sample_plate_2[sample_well].top(z=2))
        p1000.dispense(200, Liquid_trash.top(z=0))
        protocol.delay(minutes=0.1)
        p1000.blow_out(Liquid_trash.top(z=0))
        p1000.aspirate(20)
        p1000.return_tip()

        protocol.comment("--> Removing Residual")
        p50.pick_up_tip()
        p50.move_to(sample_plate_2[sample_well].bottom(z=0))
        p50.aspirate(50, rate=0.25)
        p50.default_speed = 200
        p50.dispense(100, Liquid_trash.top(z=0))
        protocol.delay(minutes=0.1)
        p50.blow_out()
        p50.default_speed = 400
        p50.move_to(Liquid_trash.top(z=-5))
        p50.move_to(Liquid_trash.top(z=0))
        p50.return_tip()

        protocol.comment("==============================================")
        protocol.comment("--> ELUTE")
        protocol.comment("==============================================")

        protocol.comment("--> Adding EE1")
        EluteVol = 23
        p50.pick_up_tip()
        p50.aspirate(EluteVol, Elute.bottom())
        p50.dispense(EluteVol, sample_plate_2[sample_well].bottom())
        p50.return_tip()

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
        heatershaker.set_and_wait_for_shake_speed(rpm=1600)
        if DRYRUN == "NO":
            protocol.delay(seconds=2 * 60)
        heatershaker.deactivate_shaker()
        heatershaker.open_labware_latch()

        if DRYRUN == "NO":
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
        p50.pick_up_tip()
        p50.move_to(sample_plate_2[sample_well].bottom(z=0.25))
        p50.aspirate(TransferSup + 1, rate=0.25)
        sample_well = "A5"
        p50.dispense(TransferSup + 5, sample_plate_1[sample_well].bottom(z=1))
        p50.return_tip()

        protocol.comment("--> Adding ET2")
        ET2Vol = 4
        ET2MixRep = 10 if DRYRUN == "NO" else 1
        ET2MixVol = 20
        p50.pick_up_tip()
        p50.aspirate(ET2Vol, ET2.bottom())
        p50.dispense(ET2Vol, sample_plate_1[sample_well].bottom())
        p50.move_to(sample_plate_1[X].bottom())
        p50.mix(ET2MixRep, ET2MixVol)
        p50.return_tip()

    if STEP_PCR == 1:
        protocol.comment("==============================================")
        protocol.comment("--> AMPLIFICATION")
        protocol.comment("==============================================")

        protocol.comment("--> Adding PPC")
        PPCVol = 5
        p50.pick_up_tip()
        p50.aspirate(PPCVol, PPC.bottom())
        p50.dispense(PPCVol, sample_plate_1[sample_well].bottom())
        p50.return_tip()

        protocol.comment("--> Adding EPM")
        EPMVol = 20
        EPMMixRep = 10 if DRYRUN == "NO" else 1
        EPMMixVol = 45
        p50.pick_up_tip()
        p50.aspirate(EPMVol, EPM.bottom())
        p50.dispense(EPMVol, sample_plate_1[sample_well].bottom())
        p50.move_to(sample_plate_1[sample_well].bottom())
        p50.mix(EPMMixRep, EPMMixVol)
        p50.return_tip()

    heatershaker.deactivate_heater()

    if STEP_PCRDECK == 1:
        if DRYRUN == "NO":
            ############################################################################################################################################
            protocol.pause("Seal, Run PCR (60min)")
            if DRYRUN == "NO":
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
        p50.pick_up_tip()
        p50.move_to(sample_plate_1[sample_well].bottom(z=0.25))
        p50.aspirate(TransferSup + 1, rate=0.25)
        sample_well = "A5"
        p50.dispense(TransferSup + 5, sample_plate_2[sample_well].bottom(z=1))
        p50.return_tip()

        protocol.comment("--> ADDING AMPure (0.8x)")
        AMPureVol = 40.5
        SampleVol = 45
        AMPureMixRep = 5 * 60 if DRYRUN == "NO" else 0.1 * 60
        AMPurePremix = 3 if DRYRUN == "NO" else 1
        # ========NEW SINGLE TIP DISPENSE===========
        p1000.pick_up_tip()
        p1000.mix(AMPurePremix, AMPureVol + 10, AMPure.bottom(z=1))
        p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
        p1000.dispense(AMPureVol, sample_plate_2[sample_well].bottom(z=1), rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(sample_plate_2[sample_well].bottom(z=5))
        for Mix in range(2):
            p1000.aspirate(60, rate=0.5)
            p1000.move_to(sample_plate_2[sample_well].bottom(z=1))
            p1000.aspirate(60, rate=0.5)
            p1000.dispense(60, rate=0.5)
            p1000.move_to(sample_plate_2[sample_well].bottom(z=5))
            p1000.dispense(30, rate=0.5)
            Mix += 1
        p1000.blow_out(sample_plate_2[sample_well].top(z=2))
        p1000.default_speed = 400
        p1000.move_to(sample_plate_2[sample_well].top(z=5))
        p1000.move_to(sample_plate_2[sample_well].top(z=0))
        p1000.move_to(sample_plate_2[sample_well].top(z=5))
        p1000.return_tip()
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

        if DRYRUN == "NO":
            protocol.delay(minutes=4)

        protocol.comment("--> Removing Supernatant")
        RemoveSup = 200
        p1000.pick_up_tip()
        p1000.move_to(sample_plate_2[sample_well].bottom(z=3.5))
        p1000.aspirate(RemoveSup - 100, rate=0.25)
        protocol.delay(minutes=0.1)
        p1000.move_to(sample_plate_2[sample_well].bottom(z=0.5))
        p1000.aspirate(100, rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(sample_plate_2[sample_well].top(z=2))
        p1000.default_speed = 200
        p1000.dispense(200, Liquid_trash.top(z=0))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(Liquid_trash.top(z=-5))
        p1000.move_to(Liquid_trash.top(z=0))
        p1000.return_tip()

        for X in range(2):
            protocol.comment("--> ETOH Wash")
            ETOHMaxVol = 150
            p1000.pick_up_tip()
            p1000.aspirate(ETOHMaxVol, EtOH.bottom(z=1))
            p1000.move_to(EtOH.top(z=0))
            p1000.move_to(EtOH.top(z=-5))
            p1000.move_to(EtOH.top(z=0))
            p1000.move_to(sample_plate_2[sample_well].top(z=-2))
            p1000.dispense(ETOHMaxVol, rate=1)
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.move_to(sample_plate_2[sample_well].top(z=5))
            p1000.move_to(sample_plate_2[sample_well].top(z=0))
            p1000.move_to(sample_plate_2[sample_well].top(z=5))
            p1000.return_tip()

            if DRYRUN == "NO":
                protocol.delay(minutes=0.5)

            protocol.comment("--> Remove ETOH Wash")
            p1000.pick_up_tip()
            p1000.move_to(sample_plate_2[sample_well].bottom(z=3.5))
            p1000.aspirate(RemoveSup - 100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(sample_plate_2[sample_well].bottom(z=0.5))
            p1000.aspirate(100, rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(sample_plate_2[sample_well].top(z=2))
            p1000.default_speed = 200
            p1000.dispense(200, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.default_speed = 400
            p1000.move_to(Liquid_trash.top(z=-5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.return_tip()

        if DRYRUN == "NO":
            protocol.delay(minutes=2)

        protocol.comment("--> Removing Residual ETOH")
        p1000.pick_up_tip()
        p1000.move_to(sample_plate_2[sample_well].bottom(z=0))
        p1000.aspirate(50, rate=0.25)
        p1000.default_speed = 200
        p1000.dispense(100, Liquid_trash.top(z=0))
        protocol.delay(minutes=0.1)
        p1000.blow_out()
        p1000.default_speed = 400
        p1000.move_to(Liquid_trash.top(z=-5))
        p1000.move_to(Liquid_trash.top(z=0))
        p1000.return_tip()

        if DRYRUN == "NO":
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
        RSBMixRep = 1 * 60 if DRYRUN == "NO" else 0.1 * 60
        p1000.pick_up_tip()
        p1000.aspirate(RSBVol, RSB.bottom(z=1))

        p1000.move_to((sample_plate_2.wells_by_name()[sample_well].center().move(types.Point(x=1.3 * 0.8, y=0, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_2.wells_by_name()[sample_well].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.move_to((sample_plate_2.wells_by_name()[sample_well].center().move(types.Point(x=0, y=1.3 * 0.8, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_2.wells_by_name()[sample_well].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.move_to((sample_plate_2.wells_by_name()[sample_well].center().move(types.Point(x=1.3 * -0.8, y=0, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_2.wells_by_name()[sample_well].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.move_to((sample_plate_2.wells_by_name()[sample_well].center().move(types.Point(x=0, y=1.3 * -0.8, z=-4))))
        p1000.dispense(RSBVol, rate=1)
        p1000.move_to(sample_plate_2.wells_by_name()[sample_well].bottom(z=1))
        p1000.aspirate(RSBVol, rate=1)
        p1000.dispense(RSBVol, rate=1)

        p1000.blow_out(sample_plate_2.wells_by_name()[sample_well].center())
        p1000.move_to(sample_plate_2.wells_by_name()[sample_well].top(z=5))
        p1000.move_to(sample_plate_2.wells_by_name()[sample_well].top(z=0))
        p1000.move_to(sample_plate_2.wells_by_name()[sample_well].top(z=5))
        p1000.return_tip()
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

        if DRYRUN == "NO":
            protocol.delay(minutes=3)

        protocol.comment("--> Transferring Supernatant")
        TransferSup = 30
        p1000.pick_up_tip()
        p1000.move_to(sample_plate_2[sample_well].bottom(z=0.25))
        p1000.aspirate(TransferSup + 1, rate=0.25)
        p1000.dispense(TransferSup + 5, sample_plate_2["A7"].bottom(z=1))
        p1000.return_tip()
