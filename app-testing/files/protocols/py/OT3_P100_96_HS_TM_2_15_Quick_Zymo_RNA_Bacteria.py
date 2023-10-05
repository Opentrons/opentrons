from opentrons.types import Point
import json
import os
import math
import threading
from time import sleep
from opentrons import types
import numpy as np

metadata = {
    "protocolName": "Quick Zymo Magbead RNA Extraction with Lysis: Bacteria 96 Channel Deletion Test",
    "author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.15",
}

"""
        **********

        Line 254


        NOTE: this accesses private members of the protocol engine and is not stable, 
        as soon as moving labware offDeck is supported from the top level `move_labware`, 
        this hack should be removed
        
        ***********

"""

HS_SLOT = 1
dry_run = False
USE_GRIPPER = True
whichwash = 1


def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    # Protocol Parameters
    deepwell_type = "nest_96_wellplate_2ml_deep"
    if not dry_run:
        settling_time = 3
    else:
        settling_time = 0.25
    # Volumes Defined
    lysis_vol = 100
    binding_buffer_vol = 215  # Beads+Binding
    wash_vol = stop_vol = 250
    dnase_vol = 50
    elution_vol = 50
    starting_vol = 250  # This is sample volume (300 in shield) + lysis volume

    h_s = ctx.load_module("heaterShakerModuleV1", HS_SLOT)
    sample_plate = h_s.load_labware("opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep")
    samples_m = sample_plate.wells()[0]
    h_s.close_labware_latch()
    MAG_PLATE_SLOT = ctx.load_module("magneticBlockV1", "4")

    tempdeck = ctx.load_module("Temperature Module Gen2", "3")
    # Keep elution warm during protocol
    elutionplate = tempdeck.load_labware("opentrons_96_pcr_adapter_armadillo_wellplate_200ul")

    # Load Reservoir Plates
    wash2_reservoir = lysis_reservoir = ctx.load_labware(
        deepwell_type, "2"
    )  # deleted after use- replaced (by gripper) with wash2 res
    bind_reservoir = ctx.load_labware(deepwell_type, "6")
    wash1_reservoir = ctx.load_labware(deepwell_type, "5")
    wash3_reservoir = wash4_reservoir = wash5_reservoir = ctx.load_labware(deepwell_type, "7")
    dnase_reservoir = ctx.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "9")
    stop_reservoir = ctx.load_labware(deepwell_type, "8")

    # Load Reagents
    lysis_res = lysis_reservoir.wells()[0]  # deleted after use- replaced (by gripper) with wash2 res
    bind_res = bind_reservoir.wells()[0]
    wash1 = wash1_reservoir.wells()[0]
    wash2 = wash2_reservoir.wells()[0]  # loaded on magplate- move to lysis location after lysis is used
    wash3 = wash4 = wash5 = wash3_reservoir.wells()[0]
    dnase_res = dnase_reservoir.wells()[0]
    stop_res = stop_reservoir.wells()[0]
    elution_res = elutionplate.wells()[0]

    # Load tips
    tips = ctx.load_labware("opentrons_ot3_96_tiprack_1000ul_rss", "10").wells()[0]
    tips1 = ctx.load_labware("opentrons_ot3_96_tiprack_1000ul_rss", "11").wells()[0]

    # load instruments
    pip = ctx.load_instrument("p1000_96", mount="left")

    pip.flow_rate.aspirate = 50
    pip.flow_rate.dispense = 150
    pip.flow_rate.blow_out = 300

    def grip_offset(action, item, slot=None):
        from opentrons.types import Point

        # EDIT these values
        # NOTE: we are still testing to determine our software's defaults
        #       but we also expect users will want to edit these
        _pick_up_offsets = {
            "deck": Point(),
            "mag-plate": Point(),
            "heater-shaker": Point(),
            "temp-module": Point(),
            "thermo-cycler": Point(),
        }
        # EDIT these values
        # NOTE: we are still testing to determine our software's defaults
        #       but we also expect users will want to edit these
        _drop_offsets = {
            "deck": Point(z=0.5),
            "mag-plate": Point(z=0.5),
            "heater-shaker": Point(z=0.5),
            "temp-module": Point(z=0.5),
            "thermo-cycler": Point(z=0.5),
        }
        # do NOT edit these values
        # NOTE: these values will eventually be in our software
        #       and will not need to be inside a protocol
        _hw_offsets = {
            "deck": Point(),
            "mag-plate": Point(),
            "heater-shaker": Point(z=2.5),
            "temp-module": Point(z=5),
            "thermo-cycler": Point(z=2.5),
        }
        # make sure arguments are correct
        action_options = ["pick-up", "drop"]
        item_options = list(_hw_offsets.keys())

        if action not in action_options:
            raise ValueError(f'"{action}" not recognized, available options: {action_options}')
        if item not in item_options:
            raise ValueError(f'"{item}" not recognized, available options: {item_options}')
        hw_offset = _hw_offsets[item]
        if action == "pick-up":
            offset = hw_offset + _pick_up_offsets[item]
        else:
            offset = hw_offset + _drop_offsets[item]
        # convert from Point() to dict()
        return {"x": offset.x, "y": offset.y, "z": offset.z}

    def blink():
        for i in range(3):
            ctx.set_rail_lights(True)
            ctx.delay(minutes=0.01666667)
            ctx.set_rail_lights(False)
            ctx.delay(minutes=0.01666667)

    def remove_supernatant(vol, waste):
        pip.pick_up_tip(tips)
        if vol > 1000:
            x = 2
        else:
            x = 1
        transfer_vol = vol / x
        for i in range(x):
            pip.aspirate(transfer_vol, samples_m.bottom(0.15))
            pip.dispense(transfer_vol, waste)
        pip.return_tip()

        # Transfer plate from magnet to H/S
        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            h_s,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "mag-plate"),
            drop_offset=grip_offset("drop", "heater-shaker", slot=HS_SLOT),
        )
        h_s.close_labware_latch()

    def resuspend_pellet(vol, plate, reps=3):
        pip.flow_rate.aspirate = 150
        pip.flow_rate.dispense = 200

        loc1 = plate.bottom().move(types.Point(x=1, y=0, z=1))
        loc2 = plate.bottom().move(types.Point(x=0.75, y=0.75, z=1))
        loc3 = plate.bottom().move(types.Point(x=0, y=1, z=1))
        loc4 = plate.bottom().move(types.Point(x=-0.75, y=0.75, z=1))
        loc5 = plate.bottom().move(types.Point(x=-1, y=0, z=1))
        loc6 = plate.bottom().move(types.Point(x=-0.75, y=0 - 0.75, z=1))
        loc7 = plate.bottom().move(types.Point(x=0, y=-1, z=1))
        loc8 = plate.bottom().move(types.Point(x=0.75, y=-0.75, z=1))

        if vol > 1000:
            vol = 1000

        mixvol = vol * 0.9

        for _ in range(reps):
            pip.aspirate(mixvol, loc1)
            pip.dispense(mixvol, loc1)
            pip.aspirate(mixvol, loc2)
            pip.dispense(mixvol, loc2)
            pip.aspirate(mixvol, loc3)
            pip.dispense(mixvol, loc3)
            pip.aspirate(mixvol, loc4)
            pip.dispense(mixvol, loc4)
            pip.aspirate(mixvol, loc5)
            pip.dispense(mixvol, loc5)
            pip.aspirate(mixvol, loc6)
            pip.dispense(mixvol, loc6)
            pip.aspirate(mixvol, loc7)
            pip.dispense(mixvol, loc7)
            pip.aspirate(mixvol, loc8)
            pip.dispense(mixvol, loc8)
            if _ == reps - 1:
                pip.flow_rate.aspirate = 50
                pip.flow_rate.dispense = 30
                pip.aspirate(mixvol, loc8)
                pip.dispense(mixvol, loc8)

        pip.flow_rate.aspirate = 50
        pip.flow_rate.dispense = 150

    def bead_mix(vol, plate, reps=5):
        pip.flow_rate.aspirate = 150
        pip.flow_rate.dispense = 200

        loc1 = plate.bottom().move(types.Point(x=0, y=0, z=1))
        loc2 = plate.bottom().move(types.Point(x=0, y=0, z=8))
        loc3 = plate.bottom().move(types.Point(x=0, y=0, z=16))
        loc4 = plate.bottom().move(types.Point(x=0, y=0, z=24))

        if vol > 1000:
            vol = 1000

        mixvol = vol * 0.9

        for _ in range(reps):
            pip.aspirate(mixvol, loc1)
            pip.dispense(mixvol, loc1)
            pip.aspirate(mixvol, loc1)
            pip.dispense(mixvol, loc2)
            pip.aspirate(mixvol, loc1)
            pip.dispense(mixvol, loc3)
            pip.aspirate(mixvol, loc1)
            pip.dispense(mixvol, loc4)
            if _ == reps - 1:
                pip.flow_rate.aspirate = 50
                pip.flow_rate.dispense = 30
                pip.aspirate(mixvol, loc1)
                pip.dispense(mixvol, loc1)

        pip.flow_rate.aspirate = 50
        pip.flow_rate.dispense = 150

    def lysis(vol, source):
        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        resuspend_pellet(starting_vol, samples_m, reps=5 if not dry_run else 1)
        pip.return_tip()

        h_s.set_and_wait_for_shake_speed(rpm=2000)

        # Delete Lysis reservoir from deck
        """
        blink()
        ctx.pause('Please remove lysis reservoir (slot 2 or D2) from the deck.')
        del ctx.deck['2']
        

        ctx._core._engine_client.move_labware(
            labware_id=lysis_reservoir._core.labware_id,
            new_location="offDeck",
            strategy="manualMoveWithPause",
            use_pick_up_location_lpc_offset=False, 
            use_drop_location_lpc_offset=False,
            pick_up_offset=None,
            drop_offset=None
        )
        
        **********


        NOTE: this accesses private members of the protocol engine and is not stable, 
        as soon as moving labware offDeck is supported from the top level `move_labware`, 
        this hack should be removed
        
        ***********

        


        #Transfer wash2 res from magnet to deck slot
        ctx.move_labware(
            wash2_reservoir, 
            2, 
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up","mag-plate"),
            drop_offset=grip_offset("drop","deck")
        )
        """
        ctx.delay(
            minutes=1 if not dry_run else 0.25,
            msg="Please wait 2 minutes while the lysis buffer mixes with the sample.",
        )
        h_s.deactivate_shaker()

    def bind(vol, source):
        """
        `bind` will perform magnetic bead binding on each sample in the
        deepwell plate. Each channel of binding beads will be mixed before
        transfer, and the samples will be mixed with the binding beads after
        the transfer. The magnetic deck activates after the addition to all
        samples, and the supernatant is removed after bead bining.
        :param vol (float): The amount of volume to aspirate from the elution
                            buffer source and dispense to each well containing
                            beads.
        :param park (boolean): Whether to save sample-corresponding tips
                               between adding elution buffer and transferring
                               supernatant to the final clean elutions PCR
                               plate.
        """
        pip.pick_up_tip(tips)
        # Mix in reservoir
        bead_mix(vol, source, reps=5 if not dry_run else 1)
        # Transfer from reservoir
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        # Mix in plate
        bead_mix(1000, samples_m, reps=8 if not dry_run else 1)
        pip.return_tip()

        h_s.set_and_wait_for_shake_speed(rpm=1800)
        ctx.delay(
            minutes=20 if not dry_run else 0.25, msg="Please wait 20 minutes while the sample binds with the beads."
        )
        h_s.deactivate_shaker()

        h_s.open_labware_latch()
        # Transfer plate to magnet
        ctx.move_labware(
            sample_plate,
            MAG_PLATE_SLOT,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "heater-shaker", slot=HS_SLOT),
            drop_offset=grip_offset("drop", "mag-plate"),
        )
        h_s.close_labware_latch()

        for bindi in np.arange(settling_time + 1, 0, -0.5):  # Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg="There are " + str(bindi) + " minutes left in the incubation.")

        # remove initial supernatant
        remove_supernatant(vol + starting_vol, bind_res)

    def wash(vol, source):

        global whichwash  # Defines which wash the protocol is on to log on the app

        if source == wash1:
            whichwash = 1
            waste_res = bind_res
        if source == wash2:
            whichwash = 2
            waste_res = bind_res
        if source == wash3:
            whichwash = 3
            waste_res = wash2
        if source == wash4:
            whichwash = 4
            waste_res = wash2
        if source == wash5:
            whichwash = 5
            waste_res = wash2

        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        resuspend_pellet(vol, samples_m, reps=5 if not dry_run else 1)
        pip.return_tip()

        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=2 if not dry_run else 0.25, msg="Please allow 2 minutes for wash to mix on heater-shaker.")
        h_s.deactivate_shaker()

        h_s.open_labware_latch()
        # Transfer plate to magnet
        ctx.move_labware(
            sample_plate,
            MAG_PLATE_SLOT,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "heater-shaker", slot=HS_SLOT),
            drop_offset=grip_offset("drop", "mag-plate"),
        )
        h_s.close_labware_latch()

        for washi in np.arange(settling_time, 0, -0.5):  # settling time timer for washes
            ctx.delay(
                minutes=0.5, msg="There are " + str(washi) + " minutes left in wash " + str(whichwash) + " incubation."
            )

        remove_supernatant(vol, waste_res)

    def dnase(vol, source):
        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        resuspend_pellet(vol, samples_m, reps=4 if not dry_run else 1)
        pip.return_tip()

        h_s.set_and_wait_for_shake_speed(rpm=2000)
        if not dry_run:
            h_s.set_and_wait_for_temperature(65)
        # minutes should equal 10 minus time it takes to reach 65
        ctx.delay(minutes=9 if not dry_run else 0.25, msg="Please wait 10 minutes while the dnase incubates.")
        h_s.deactivate_shaker()

    def stop_reaction(vol, source):

        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        resuspend_pellet(vol, samples_m, reps=2 if not dry_run else 1)
        pip.return_tip()

        h_s.set_and_wait_for_shake_speed(rpm=1800)
        ctx.delay(
            minutes=10 if not dry_run else 0.1,
            msg="Please wait 10 minutes while the stop solution inactivates the dnase.",
        )
        h_s.deactivate_shaker()

        h_s.open_labware_latch()
        # Transfer plate to magnet
        ctx.move_labware(
            sample_plate,
            MAG_PLATE_SLOT,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "heater-shaker", slot=HS_SLOT),
            drop_offset=grip_offset("drop", "mag-plate"),
        )
        h_s.close_labware_latch()

        for stop in np.arange(settling_time, 0, -0.5):
            ctx.delay(minutes=0.5, msg="There are " + str(stop) + " minutes left in this incubation.")

        remove_supernatant(vol + 50, wash1)

    def elute(vol, source):
        pip.pick_up_tip(tips1)
        # Transfer
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        # Mix
        resuspend_pellet(vol, samples_m, reps=3 if not dry_run else 1)
        pip.return_tip()

        # Elution Incubation
        h_s.set_and_wait_for_shake_speed(rpm=2000)
        if not dry_run:
            tempdeck.set_temperature(4)
        ctx.delay(
            minutes=3 if not dry_run else 0.25, msg="Please wait 5 minutes while the sample elutes from the beads."
        )
        h_s.deactivate_shaker()

        h_s.open_labware_latch()
        # Transfer plate to magnet
        ctx.move_labware(
            sample_plate,
            MAG_PLATE_SLOT,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "heater-shaker", slot=HS_SLOT),
            drop_offset=grip_offset("drop", "mag-plate"),
        )
        h_s.close_labware_latch()

        for elutei in np.arange(settling_time, 0, -0.5):
            ctx.delay(minutes=0.5, msg="Incubating on MagDeck for " + str(elutei) + " more minutes.")

        pip.flow_rate.aspirate = 25

        pip.pick_up_tip(tips1)
        pip.aspirate(vol, samples_m)
        pip.dispense(vol, source)
        pip.return_tip()

        h_s.open_labware_latch()
        # Transfer plate to magnet
        ctx.move_labware(
            sample_plate,
            h_s,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "mag-plate"),
            drop_offset=grip_offset("drop", "heater-shaker", slot=HS_SLOT),
        )
        h_s.close_labware_latch()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    # Start Protocol
    for x in range(2):
        lysis(lysis_vol, lysis_res)
        bind(binding_buffer_vol, bind_res)
        wash(wash_vol, wash1)
        if not dry_run:
            wash(wash_vol, wash2)
            wash(wash_vol, wash3)
        # dnase1 treatment
        dnase(dnase_vol, dnase_res)
        stop_reaction(stop_vol, stop_res)
        # Resume washes
        if not dry_run:
            wash(wash_vol, wash4)
            wash(wash_vol, wash5)
            tempdeck.set_temperature(55)
            drybeads = 9  # Number of minutes you want to dry for
        else:
            drybeads = 0.5
        for beaddry in np.arange(drybeads, 0, -0.5):
            ctx.delay(minutes=0.5, msg="There are " + str(beaddry) + " minutes left in the drying step.")
        elute(elution_vol, elution_res)
