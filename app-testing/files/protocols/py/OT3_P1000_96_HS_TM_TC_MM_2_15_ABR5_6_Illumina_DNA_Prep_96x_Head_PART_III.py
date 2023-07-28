from opentrons import protocol_api
from opentrons import types

metadata = {
    "protocolName": "Illumina DNA Prep 96x Head PART III",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.15",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.15",
}

# SCRIPT SETTINGS
DRYRUN = "YES"  # YES or NO, DRYRUN = 'YES' will return tips, skip incubation times, shorten mix, for testing purposes
USE_GRIPPER = True
USE_8xMULTI = "NO"

# PROTOCOL SETTINGS

# PROTOCOL BLOCKS
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
    sample_plate_2 = heatershaker.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    tiprack_200_1 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul_rss", "2")
    temp_block = protocol.load_module("temperature module gen2", "3")
    sample_plate_3 = temp_block.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    # ========== SECOND ROW ==========
    MAG_PLATE_SLOT = protocol.load_module("magneticBlockV1", "4")
    reservoir_1 = protocol.load_labware("nest_96_wellplate_2ml_deep", "5")
    reservoir_2 = protocol.load_labware("nest_96_wellplate_2ml_deep", "5")
    # ========== THIRD ROW ===========
    thermocycler = protocol.load_module("thermocycler module gen2")
    sample_plate_1 = thermocycler.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    tiprack_200_2 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul_rss", "8")
    reservoir_3 = protocol.load_labware("nest_96_wellplate_2ml_deep", "5")
    # ========== FOURTH ROW ==========
    reservoir_4 = protocol.load_labware("nest_96_wellplate_2ml_deep", "5")

    # =========== RESERVOIR ==========
    EtOH = reservoir_1["A1"]
    AMPure = reservoir_2["A1"]
    RSB = reservoir_3["A1"]
    Liquid_trash = reservoir_4["A1"]
    # ========= REAGENT PLATE =========

    # pipette
    if USE_8xMULTI == "YES":
        p1000 = protocol.load_instrument("p1000_multi_gen3", "right")
    else:
        p1000 = protocol.load_instrument("p1000_96", "left")

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
            "mag-plate": Point(z=29.5),
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

    if STEP_CLEANUP == 1:
        protocol.comment("==============================================")
        protocol.comment("--> Cleanup")
        protocol.comment("==============================================")

        protocol.comment("--> Adding H20 and SAMPLE")
        H20Vol = 40  # H20 ALREADY IN WELL
        SampleVol = 45
        p1000.pick_up_tip(tiprack_200_1["A1"])  # <---------------- Tip Pickup
        p1000.aspirate(SampleVol, sample_plate_1["A1"].bottom(z=1))
        p1000.dispense(SampleVol, sample_plate_2["A1"].bottom(z=1))
        p1000.return_tip()  # <---------------- Tip Return

        protocol.comment("--> ADDING AMPure (0.8x)")
        AMPureVol = 45
        SampleVol = 85
        AMPureMixRep = 5 * 60 if DRYRUN == "NO" else 0.1 * 60
        AMPurePremix = 3 if DRYRUN == "NO" else 1
        # ========NEW SINGLE TIP DISPENSE===========
        p1000.pick_up_tip(tiprack_200_2["A1"])  # <---------------- Tip Pickup
        p1000.mix(AMPurePremix, AMPureVol + 10, AMPure.bottom(z=1))
        p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
        p1000.dispense(AMPureVol, sample_plate_2["A1"].bottom(z=1), rate=0.25)
        p1000.default_speed = 5
        p1000.move_to(sample_plate_2["A1"].bottom(z=5))
        for Mix in range(2):
            p1000.aspirate(60, rate=0.5)
            p1000.move_to(sample_plate_2["A1"].bottom(z=1))
            p1000.aspirate(60, rate=0.5)
            p1000.dispense(60, rate=0.5)
            p1000.move_to(sample_plate_2["A1"].bottom(z=5))
            p1000.dispense(30, rate=0.5)
            Mix += 1
        p1000.blow_out(sample_plate_2["A1"].top(z=2))
        p1000.default_speed = 400
        p1000.move_to(sample_plate_2["A1"].top(z=5))
        p1000.move_to(sample_plate_2["A1"].top(z=0))
        p1000.move_to(sample_plate_2["A1"].top(z=5))
        p1000.return_tip()  # <---------------- Tip Return
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
        p1000.pick_up_tip(tiprack_200_2["A1"])  # <---------------- Tip Pickup
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

        protocol.pause("RESET TIPRACKS")
        del tiprack_200_1
        del tiprack_200_2

        tiprack_200_3 = protocol.load_labware("opentrons_ot3_96_tiprack_200ul_rss", "2")
        tiprack_20_1 = protocol.load_labware("opentrons_ot3_96_tiprack_50ul_rss", "8")

        for X in range(2):
            protocol.comment("--> ETOH Wash")
            ETOHMaxVol = 150
            p1000.pick_up_tip(tiprack_200_3["A1"])
            p1000.aspirate(ETOHMaxVol, EtOH.bottom(z=1))
            p1000.move_to(EtOH.top(z=0))
            p1000.move_to(EtOH.top(z=-5))
            p1000.move_to(EtOH.top(z=0))
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
            p1000.pick_up_tip(tiprack_200_3["A1"])  # <---------------- Tip Pickup
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
        p1000.pick_up_tip(tiprack_200_3["A1"])  # <---------------- Tip Pickup
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
        p1000.pick_up_tip(tiprack_20_1["A1"])  # <---------------- Tip Pickup
        p1000.move_to(sample_plate_2["A1"].bottom(z=0.25))
        p1000.aspirate(TransferSup + 1, rate=0.25)
        p1000.dispense(TransferSup + 5, sample_plate_3["A1"].bottom(z=1))
        p1000.return_tip()  # <---------------- Tip Return
