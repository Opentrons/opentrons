from opentrons import protocol_api
from opentrons import types

metadata = {
    "protocolName": "Illumina DNA Prep 24x",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.15",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.15",
}

# SCRIPT SETTINGS
DRYRUN = "NO"  # YES or NO, DRYRUN = 'YES' will return tips, skip incubation times, shorten mix, for testing purposes
USE_GRIPPER = True

# PROTOCOL SETTINGS
COLUMNS = 3  # 1-3

# PROTOCOL BLOCKS
STEP_TAG = 1
STEP_WASH = 1
STEP_PCRDECK = 1
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
    sample_plate_1 = heatershaker.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    tiprack_200_1 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "2")
    temp_block = protocol.load_module("temperature module gen2", "3")
    reagent_plate = temp_block.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    # ========== SECOND ROW ==========
    mag_block = protocol.load_module("magneticBlockV1", 4)
    reservoir = protocol.load_labware("nest_96_wellplate_2ml_deep", "5")
    tiprack_200_2 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul", "6")
    # ========== THIRD ROW ===========
    thermocycler = protocol.load_module("thermocycler module gen2")
    tiprack_20 = protocol.load_labware("opentrons_ot3_96_tiprack_50ul", "9")
    # ========== FOURTH ROW ==========

    # =========== RESERVOIR ==========
    AMPure = reservoir["A1"]
    WASH_1 = reservoir["A2"]
    WASH_2 = reservoir["A3"]
    WASH_3 = reservoir["A4"]
    EtOH = reservoir["A8"]
    RSB = reservoir["A9"]
    H20 = reservoir["A10"]
    Liquid_trash = reservoir["A11"]
    # ========= REAGENT PLATE =========
    TAGMIX = reagent_plate["A1"]
    TAGSTOP = reagent_plate["A2"]
    EPM = reagent_plate["A3"]
    Barcodes1 = reagent_plate.wells_by_name()["A7"]
    Barcodes2 = reagent_plate.wells_by_name()["A8"]
    Barcodes3 = reagent_plate.wells_by_name()["A9"]

    # pipette
    p1000 = protocol.load_instrument("p1000_multi_gen3", "right", tip_racks=[tiprack_200_1, tiprack_200_2])
    p50 = protocol.load_instrument("p50_multi_gen3", "left", tip_racks=[tiprack_20])

    # tip and sample tracking
    if COLUMNS == 3:
        column_1_list = ["A1", "A2", "A3"]
        column_2_list = ["A5", "A6", "A7"]
        column_3_list = ["A9", "A10", "A11"]
        barcodes = ["A7", "A8", "A9"]

    TIP_SUP = [tiprack_200_1["A1"], tiprack_200_1["A2"], tiprack_200_1["A3"]]
    TIP_WASH = [tiprack_200_1["A4"], tiprack_200_1["A5"], tiprack_200_1["A6"]]
    WASH = [WASH_1, WASH_2, WASH_3]
    TIP_EPM = [tiprack_200_1["A7"], tiprack_200_1["A8"], tiprack_200_1["A9"]]
    TIP_TRANSFER = [tiprack_200_1["A10"], tiprack_200_1["A11"], tiprack_200_1["A12"]]
    TIP_CLEANUP = [tiprack_200_2["A1"], tiprack_200_2["A2"], tiprack_200_2["A3"]]
    TIP_RSB = [tiprack_200_2["A4"], tiprack_200_2["A5"], tiprack_200_2["A6"]]
    Tip_ETOH = tiprack_200_2["A7"]

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
            "thermo-cycler": Point(z=4.5),
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

    if STEP_TAG == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Tagment")
        protocol.comment("==============================================")

        protocol.comment("--> ADDING TAGMIX")
        TagVol = 20
        SampleVol = 60
        TagMixRep = 5 * 60 if DRYRUN == "NO" else 0.1 * 60
        TagPremix = 3 if DRYRUN == "NO" else 1
        # ========NEW SINGLE TIP DISPENSE===========
        for loop, X in enumerate(column_1_list):
            p1000.pick_up_tip(TIP_SUP[loop])  # <---------------- Tip Pickup
            p1000.mix(TagPremix, TagVol + 10, TAGMIX.bottom(z=1))
            p1000.aspirate(TagVol, TAGMIX.bottom(z=1), rate=0.25)
            p1000.dispense(TagVol, sample_plate_1[X].bottom(z=1), rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(sample_plate_1[X].bottom(z=3.5))
            for Mix in range(2):
                p1000.aspirate(40, rate=0.5)
                p1000.move_to(sample_plate_1[X].bottom(z=1))
                p1000.aspirate(20, rate=0.5)
                p1000.dispense(20, rate=0.5)
                p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                p1000.dispense(40, rate=0.5)
                Mix += 1
            p1000.blow_out(sample_plate_1[X].top(z=2))
            p1000.default_speed = 400
            p1000.move_to(sample_plate_1[X].top(z=5))
            p1000.move_to(sample_plate_1[X].top(z=0))
            p1000.move_to(sample_plate_1[X].top(z=5))
            p1000.return_tip()  # <---------------- Tip Return
        # ========NEW HS MIX=========================
        heatershaker.set_and_wait_for_shake_speed(rpm=1800)
        protocol.delay(TagMixRep)
        heatershaker.deactivate_shaker()

        # ============================================================================================
        # GRIPPER MOVE sample_plate_1 FROM HEATERSHAKER TO THERMOCYCLER
        heatershaker.open_labware_latch()
        protocol.move_labware(
            labware=sample_plate_1,
            new_location=thermocycler,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
            drop_offset=grip_offset("drop", "thermo-cycler"),
        )
        heatershaker.close_labware_latch()
        # ============================================================================================

        ############################################################################################################################################
        thermocycler.close_lid()
        if DRYRUN == "NO":
            profile_TAG = [{"temperature": 55, "hold_time_minutes": 15}]
            thermocycler.execute_profile(steps=profile_TAG, repetitions=1, block_max_volume=50)
            thermocycler.set_block_temperature(10)
        thermocycler.open_lid()
        ############################################################################################################################################

        protocol.comment("--> Adding TAGSTOP")
        TAGSTOPVol = 10
        TAGSTOPMixRep = 10 if DRYRUN == "NO" else 1
        TAGSTOPMixVol = 20
        for loop, X in enumerate(column_1_list):
            p50.pick_up_tip()
            p50.aspirate(TAGSTOPVol, TAGSTOP.bottom())
            p50.dispense(TAGSTOPVol, sample_plate_1[X].bottom())
            p50.move_to(sample_plate_1[X].bottom())
            p50.mix(TAGSTOPMixRep, TAGSTOPMixVol)
            p50.return_tip()

        ############################################################################################################################################
        thermocycler.close_lid()
        if DRYRUN == "NO":
            profile_TAGSTOP = [{"temperature": 37, "hold_time_minutes": 15}]
            thermocycler.execute_profile(steps=profile_TAGSTOP, repetitions=1, block_max_volume=50)
            thermocycler.set_block_temperature(10)
        thermocycler.open_lid()
        ############################################################################################################################################

        # ============================================================================================
        # GRIPPER MOVE sample_plate_1 FROM THERMOCYCLER TO MAG PLATE
        protocol.move_labware(
            labware=sample_plate_1,
            new_location=mag_block,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "thermo-cycler"),
            drop_offset=grip_offset("drop", "mag-plate"),
        )
        # ============================================================================================

    if DRYRUN == "NO":
        protocol.delay(minutes=4)

    if STEP_WASH == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Cleanup")
        protocol.comment("==============================================")

        protocol.comment("--> Removing Supernatant")
        RemoveSup = 200
        for loop, X in enumerate(column_1_list):
            p1000.pick_up_tip(TIP_SUP[loop])  # <---------------- Tip Pickup
            p1000.move_to(sample_plate_1[X].bottom(z=3.5))
            p1000.aspirate(RemoveSup - 100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(sample_plate_1[X].bottom(z=0.5))
            p1000.aspirate(100, rate=0.25)
            p1000.move_to(sample_plate_1[X].top(z=2))
            p1000.dispense(200, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out(Liquid_trash.top(z=0))
            p1000.aspirate(20)
            p1000.return_tip()  # <---------------- Tip Return

        for X in range(3):
            # ============================================================================================
            # GRIPPER MOVE PLATE FROM MAG PLATE TO HEATER SHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=heatershaker,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "mag-plate"),
                drop_offset=grip_offset("drop", "heater-shaker", 1),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Wash ")
            WASHMaxVol = 100
            WASHTime = 3 * 60 if DRYRUN == "NO" else 0.1 * 60
            for loop, X in enumerate(column_1_list):
                p1000.pick_up_tip(TIP_WASH[loop])  # <---------------- Tip Pickup
                p1000.aspirate(WASHMaxVol, WASH[loop].bottom(z=1), rate=0.25)
                p1000.move_to(sample_plate_1[X].bottom(z=1))
                p1000.dispense(WASHMaxVol, rate=0.25)
                p1000.mix(2, 90, rate=0.5)
                p1000.move_to(sample_plate_1[X].top(z=1))
                protocol.delay(minutes=0.1)
                p1000.blow_out(sample_plate_1[X].top(z=1))
                p1000.aspirate(20)
                p1000.return_tip()  # <---------------- Tip Return

            heatershaker.close_labware_latch()
            heatershaker.set_and_wait_for_shake_speed(rpm=1600)
            protocol.delay(WASHTime)
            heatershaker.deactivate_shaker()
            heatershaker.open_labware_latch()

            # ============================================================================================
            # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
                drop_offset=grip_offset("drop", "mag-plate"),
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            if DRYRUN == "NO":
                protocol.delay(minutes=3)

            protocol.comment("--> Remove Wash")
            for loop, X in enumerate(column_1_list):
                p1000.pick_up_tip(TIP_WASH[loop])  # <---------------- Tip Pickup
                p1000.move_to(sample_plate_1[X].bottom(4))
                p1000.aspirate(WASHMaxVol, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(sample_plate_1[X].bottom())
                protocol.delay(minutes=0.1)
                p1000.aspirate(200 - WASHMaxVol, rate=0.25)
                p1000.default_speed = 400
                p1000.dispense(200, Liquid_trash)
                p1000.move_to(Liquid_trash.top(z=5))
                protocol.delay(minutes=0.1)
                p1000.blow_out(Liquid_trash.top(z=5))
                p1000.aspirate(20)
                p1000.return_tip()  # <---------------- Tip Return

        if DRYRUN == "NO":
            protocol.delay(minutes=1)

        protocol.comment("--> Removing Residual Wash")
        for loop, X in enumerate(column_1_list):
            p1000.pick_up_tip(TIP_WASH[loop])  # <---------------- Tip Pickup
            p1000.move_to(sample_plate_1[X].bottom(1))
            p1000.aspirate(20, rate=0.25)
            p1000.return_tip()  # <---------------- Tip Return

        if DRYRUN == "NO":
            protocol.delay(minutes=0.5)

        # ============================================================================================
        # GRIPPER MOVE PLATE FROM MAG PLATE TO HEATER SHAKER
        heatershaker.open_labware_latch()
        protocol.move_labware(
            labware=sample_plate_1,
            new_location=heatershaker,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "mag-plate"),
            drop_offset=grip_offset("drop", "heater-shaker", 1),
        )
        heatershaker.close_labware_latch()
        # ============================================================================================

        protocol.comment("--> Adding EPM")
        EPMVol = 40
        EPMMixRep = 5 if DRYRUN == "NO" else 1
        EPMMixVol = 35
        EPMVolCount = 0
        for loop, X in enumerate(column_1_list):
            p1000.pick_up_tip(TIP_EPM[loop])  # <---------------- Tip Pickup
            p1000.aspirate(EPMVol, EPM.bottom(z=1))
            EPMVolCount += 1
            p1000.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=1.3 * 0.8, y=0, z=-4))))
            p1000.dispense(EPMMixVol, rate=1)
            p1000.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
            p1000.aspirate(EPMMixVol, rate=1)
            p1000.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=0, y=1.3 * 0.8, z=-4))))
            p1000.dispense(EPMMixVol, rate=1)
            p1000.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
            p1000.aspirate(EPMMixVol, rate=1)
            p1000.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=1.3 * -0.8, y=0, z=-4))))
            p1000.dispense(EPMMixVol, rate=1)
            p1000.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
            p1000.aspirate(EPMMixVol, rate=1)
            p1000.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=0, y=1.3 * -0.8, z=-4))))
            p1000.dispense(EPMMixVol, rate=1)
            p1000.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
            p1000.aspirate(EPMMixVol, rate=1)
            p1000.dispense(EPMMixVol, rate=1)

            p1000.blow_out(sample_plate_1.wells_by_name()[X].center())
            p1000.move_to(sample_plate_1.wells_by_name()[X].top(z=5))
            p1000.move_to(sample_plate_1.wells_by_name()[X].top(z=0))
            p1000.move_to(sample_plate_1.wells_by_name()[X].top(z=5))
            p1000.return_tip()  # <---------------- Tip Return
        heatershaker.close_labware_latch()
        heatershaker.set_and_wait_for_shake_speed(rpm=2000)
        protocol.delay(minutes=3)
        heatershaker.deactivate_shaker()
        heatershaker.open_labware_latch()

        # ============================================================================================
        # GRIPPER MOVE PLATE FROM HEATER SHAKER TO THERMOCYCLER
        heatershaker.open_labware_latch()
        protocol.move_labware(
            labware=sample_plate_1,
            new_location=thermocycler,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "heater-shaker", 1),
            drop_offset=grip_offset("drop", "thermo-cycler"),
        )
        heatershaker.close_labware_latch()
        # ============================================================================================

        protocol.comment("--> Adding Barcodes")
        BarcodeVol = 10
        BarcodeMixRep = 3 if DRYRUN == "NO" else 1
        BarcodeMixVol = 10
        for loop, X in enumerate(column_1_list):
            p50.pick_up_tip()
            p50.aspirate(BarcodeVol, reagent_plate.wells_by_name()[barcodes[loop]].bottom(), rate=0.25)
            p50.dispense(BarcodeVol, sample_plate_1.wells_by_name()[X].bottom(1))
            p50.mix(BarcodeMixRep, BarcodeMixVol)
            p50.return_tip()

    if STEP_PCRDECK == 1:
        ############################################################################################################################################

        if DRYRUN == "NO":
            thermocycler.set_lid_temperature(100)
        thermocycler.close_lid()
        if DRYRUN == "NO":
            profile_PCR_1 = [
                {"temperature": 68, "hold_time_seconds": 180},
                {"temperature": 98, "hold_time_seconds": 180},
            ]
            thermocycler.execute_profile(steps=profile_PCR_1, repetitions=1, block_max_volume=50)
            profile_PCR_2 = [
                {"temperature": 98, "hold_time_seconds": 45},
                {"temperature": 62, "hold_time_seconds": 30},
                {"temperature": 68, "hold_time_seconds": 120},
            ]
            thermocycler.execute_profile(steps=profile_PCR_2, repetitions=5, block_max_volume=50)
            profile_PCR_3 = [{"temperature": 68, "hold_time_minutes": 1}]
            thermocycler.execute_profile(steps=profile_PCR_3, repetitions=1, block_max_volume=50)
            thermocycler.set_block_temperature(10)
        ############################################################################################################################################
        thermocycler.open_lid()

    if STEP_CLEANUP == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Cleanup")
        protocol.comment("==============================================")

        # ============================================================================================
        # GRIPPER MOVE sample_plate_1 FROM THERMOCYCLER To HEATERSHAKER
        heatershaker.open_labware_latch()
        protocol.move_labware(
            labware=sample_plate_1,
            new_location=heatershaker,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "thermo-cycler"),
            drop_offset=grip_offset("drop", "heater-shaker", 1),
        )
        heatershaker.close_labware_latch()
        # ============================================================================================

        protocol.comment("--> Adding H20 and SAMPLE")
        H20Vol = 40
        SampleVol = 45
        for loop, X in enumerate(column_1_list):
            p1000.pick_up_tip(TIP_TRANSFER[loop])  # <---------------- Tip Pickup
            p1000.aspirate(H20Vol, H20.bottom(), rate=1)
            p1000.dispense(H20Vol, sample_plate_1[column_2_list[loop]].bottom(1))
            p1000.aspirate(SampleVol, sample_plate_1[column_1_list[loop]].bottom(), rate=1)
            p1000.dispense(SampleVol, sample_plate_1[column_2_list[loop]].bottom(1))
            p1000.return_tip()  # <---------------- Tip Return

        protocol.comment("--> ADDING AMPure (0.8x)")
        AMPureVol = 45
        SampleVol = 85
        AMPureMixRep = 5 * 60 if DRYRUN == "NO" else 0.1 * 60
        AMPurePremix = 3 if DRYRUN == "NO" else 1
        # ========NEW SINGLE TIP DISPENSE===========
        for loop, X in enumerate(column_2_list):
            p1000.pick_up_tip(TIP_CLEANUP[loop])  # <---------------- Tip Pickup
            p1000.mix(AMPurePremix, AMPureVol + 10, AMPure.bottom(z=1))
            p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
            p1000.dispense(AMPureVol, sample_plate_1[X].bottom(z=1), rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(sample_plate_1[X].bottom(z=5))
            for Mix in range(2):
                p1000.aspirate(60, rate=0.5)
                p1000.move_to(sample_plate_1[X].bottom(z=1))
                p1000.aspirate(60, rate=0.5)
                p1000.dispense(60, rate=0.5)
                p1000.move_to(sample_plate_1[X].bottom(z=5))
                p1000.dispense(30, rate=0.5)
                Mix += 1
            p1000.blow_out(sample_plate_1[X].top(z=2))
            p1000.default_speed = 400
            p1000.move_to(sample_plate_1[X].top(z=5))
            p1000.move_to(sample_plate_1[X].top(z=0))
            p1000.move_to(sample_plate_1[X].top(z=5))
            p1000.return_tip()  # <---------------- Tip Return
        # ========NEW HS MIX=========================
        heatershaker.set_and_wait_for_shake_speed(rpm=1800)
        protocol.delay(AMPureMixRep)
        heatershaker.deactivate_shaker()

        # ============================================================================================
        # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
        heatershaker.open_labware_latch()
        protocol.move_labware(
            labware=sample_plate_1,
            new_location=mag_block,
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
        for loop, X in enumerate(column_2_list):
            p1000.pick_up_tip(TIP_CLEANUP[loop])  # <---------------- Tip Pickup
            p1000.move_to(sample_plate_1[X].bottom(z=3.5))
            p1000.aspirate(RemoveSup - 100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(sample_plate_1[X].bottom(z=0.5))
            p1000.aspirate(100, rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(sample_plate_1[X].top(z=2))
            p1000.default_speed = 200
            p1000.dispense(200, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.default_speed = 400
            p1000.move_to(Liquid_trash.top(z=-5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.return_tip()  # <---------------- Tip Return

        for X in range(2):
            protocol.comment("--> ETOH Wash")
            ETOHMaxVol = 150
            p1000.pick_up_tip(Tip_ETOH)
            for loop, X in enumerate(column_2_list):
                p1000.aspirate(ETOHMaxVol, EtOH.bottom(z=1))
                p1000.move_to(EtOH.top(z=0))
                p1000.move_to(EtOH.top(z=-5))
                p1000.move_to(EtOH.top(z=0))
                p1000.move_to(sample_plate_1[X].top(z=-2))
                p1000.dispense(ETOHMaxVol, rate=1)
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                p1000.move_to(sample_plate_1[X].top(z=5))
                p1000.move_to(sample_plate_1[X].top(z=0))
                p1000.move_to(sample_plate_1[X].top(z=5))
            p1000.return_tip()

            if DRYRUN == "NO":
                protocol.delay(minutes=0.5)

            protocol.comment("--> Remove ETOH Wash")
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip(TIP_CLEANUP[loop])  # <---------------- Tip Pickup
                p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                p1000.aspirate(RemoveSup - 100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(sample_plate_1[X].bottom(z=0.5))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(sample_plate_1[X].top(z=2))
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
        for loop, X in enumerate(column_2_list):
            p1000.pick_up_tip(TIP_CLEANUP[loop])  # <---------------- Tip Pickup
            p1000.move_to(sample_plate_1[X].bottom(z=0))
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
        heatershaker.open_labware_latch()
        protocol.move_labware(
            labware=sample_plate_1,
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
        for loop, X in enumerate(column_2_list):
            p1000.pick_up_tip(TIP_RSB[loop])  # <---------------- Tip Pickup
            p1000.aspirate(RSBVol, RSB.bottom(z=1))

            p1000.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=1.3 * 0.8, y=0, z=-4))))
            p1000.dispense(RSBVol, rate=1)
            p1000.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
            p1000.aspirate(RSBVol, rate=1)
            p1000.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=0, y=1.3 * 0.8, z=-4))))
            p1000.dispense(RSBVol, rate=1)
            p1000.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
            p1000.aspirate(RSBVol, rate=1)
            p1000.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=1.3 * -0.8, y=0, z=-4))))
            p1000.dispense(RSBVol, rate=1)
            p1000.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
            p1000.aspirate(RSBVol, rate=1)
            p1000.move_to((sample_plate_1.wells_by_name()[X].center().move(types.Point(x=0, y=1.3 * -0.8, z=-4))))
            p1000.dispense(RSBVol, rate=1)
            p1000.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
            p1000.aspirate(RSBVol, rate=1)
            p1000.dispense(RSBVol, rate=1)

            p1000.blow_out(sample_plate_1.wells_by_name()[X].center())
            p1000.move_to(sample_plate_1.wells_by_name()[X].top(z=5))
            p1000.move_to(sample_plate_1.wells_by_name()[X].top(z=0))
            p1000.move_to(sample_plate_1.wells_by_name()[X].top(z=5))
            p1000.return_tip()  # <---------------- Tip Return
        heatershaker.set_and_wait_for_shake_speed(rpm=1600)
        protocol.delay(RSBMixRep)
        heatershaker.deactivate_shaker()

        # ============================================================================================
        # GRIPPER MOVE PLATE FROM HEATER SHAKER TO MAG PLATE
        heatershaker.open_labware_latch()
        protocol.move_labware(
            labware=sample_plate_1,
            new_location=mag_block,
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
        for loop, X in enumerate(column_2_list):
            p1000.pick_up_tip(TIP_RSB[loop])  # <---------------- Tip Pickup
            p1000.move_to(sample_plate_1[X].bottom(z=0.25))
            p1000.aspirate(TransferSup + 1, rate=0.25)
            p1000.dispense(TransferSup + 5, sample_plate_1[column_3_list[loop]].bottom(z=1))
            p1000.return_tip()  # <---------------- Tip Return
