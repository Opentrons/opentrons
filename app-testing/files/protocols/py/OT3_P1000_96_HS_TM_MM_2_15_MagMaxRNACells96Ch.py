from opentrons.types import Point
import json
import os
import math
import threading
from time import sleep
from opentrons import types
import numpy as np

"""
Setup:

Slot 1 = H-S with Nest DW (empty plate)
Slot 2 = Nest DW (800 ul each well)
Slot 3 = Temp Mod with Armadillo PCR plate (50ul each well)
Slot 4 = Magblock (empty)
Slot 5 = Nest DW (200 ul each well)
Slot 6 = Nest DW (200 ul each well)
Slot 7 = Armadillo PCR plate (50 ul each well)
Slot 8 = Nest DW (200 ul each well)
Slot 9 = Nest DW (550 ul each well)
Slot 10 = 200ul tips
Slot 11 = 200ul tips (only used during elution steps)

"""


metadata = {
    "protocolName": "MagMax RNA Extraction: Cells 96 ABR TESTING",
    "author": "Opentrons Engineering <engineering@opentrons.com>",
    "source": "Software Testing Team",
    "description": ("MagMax RNA Extraction: Cells 96 ABR TESTING"),
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.15",
}

HS_SLOT = 1
dry_run = True
USE_GRIPPER = True
whichwash = 1
EMPTY_SLOT = 9


def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    # Protocol Parameters
    deepwell_type = "nest_96_wellplate_2ml_deep"
    res_type = "nest_12_reservoir_15ml"
    wash_vol = 150
    settling_time = 2
    sample_vol = 50
    lysis_vol = 140
    elution_vol = 50
    starting_vol = sample_vol + lysis_vol

    h_s = ctx.load_module("heaterShakerModuleV1", HS_SLOT)
    cell_plate = h_s.load_labware(deepwell_type)
    cells_m = cell_plate.wells()[0]
    sample_plate = ctx.load_labware(deepwell_type, "2")  # Plate with just beads
    samples_m = sample_plate.wells()[0]
    h_s.close_labware_latch()

    tempdeck = ctx.load_module("Temperature Module Gen2", "3")
    MAG_PLATE_SLOT = ctx.load_module("magneticBlockV1", "4")
    # Keep elution warm during protocol
    elutionplate = tempdeck.load_labware("opentrons_96_aluminumblock_nest_wellplate_100ul")

    # Load Reagents
    lysis_res = ctx.load_labware(deepwell_type, "5").wells()[0]
    wash1 = ctx.load_labware(deepwell_type, "6").wells()[0]
    wash2 = wash3 = wash4 = ctx.load_labware(deepwell_type, "9").wells()[0]
    dnase_res = ctx.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "7").wells()[0]
    stop_res = ctx.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "8").wells()[0]
    elution_res = elutionplate.wells()[0]

    # Load tips
    tips = ctx.load_labware("opentrons_ot3_96_tiprack_200ul_rss", "10").wells()[0]
    tips1 = ctx.load_labware("opentrons_ot3_96_tiprack_200ul_rss", "11").wells()[0]

    # load 96 channel pipette
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

    def remove_supernatant(vol, waste):
        pip.pick_up_tip(tips)
        if vol > 1000:
            x = 2
        else:
            x = 1
        transfer_vol = vol
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

    def reset_protocol():
        # Replace Cell and Sample Plates
        h_s.open_labware_latch()
        # Transfer cell plate back to H-S initial spot
        ctx.move_labware(
            cell_plate,
            h_s,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "mag-plate"),
            drop_offset=grip_offset("drop", "heater-shaker", slot=HS_SLOT),
        )
        h_s.close_labware_latch()

        # Transfer sample plate back to original slot 2
        ctx.move_labware(
            sample_plate,
            2,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "mag-plate"),
            drop_offset=grip_offset("drop", "deck"),
        )

        pip.pick_up_tip(tips)
        # Return Wash buffers from lysis res back to their own
        deep = 20
        for w in range(4):
            pip.aspirate(wash_vol, lysis_res.top(-deep))
            if w == 0:
                pip.dispense(wash_vol, wash1)
            else:
                pip.dispense(wash_vol, wash2)
            deep = deep + 5
            pip.air_gap(5)

        # Return Stop Solution to original res
        pip.aspirate(100, lysis_res.top(-deep + 5))
        pip.dispense(100, stop_res)
        pip.air_gap(5)

        # Return DNAse to original res
        pip.aspirate(50, lysis_res.top(-deep + 5))
        pip.dispense(50, dnase_res)
        pip.air_gap(5)

        pip.return_tip()

    def lysis(vol, source):
        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, cells_m)
        resuspend_pellet(vol, cells_m, reps=5)
        pip.return_tip()

        h_s.set_and_wait_for_shake_speed(rpm=2200)
        ctx.delay(
            minutes=1 if not dry_run else 0.25, msg="Please wait 1 minute while the lysis buffer mixes with the sample."
        )
        h_s.deactivate_shaker()

    def bind():
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
        # Quick Mix then Transfer cells+lysis/bind to wells with beads
        for i in range(3):
            pip.aspirate(125, cells_m)
            pip.dispense(125, cells_m.bottom(15))
        pip.aspirate(175, cells_m)
        pip.air_gap(10)
        pip.dispense(185, samples_m)
        bead_mix(140, samples_m, reps=5)
        pip.blow_out(samples_m.top(-3))
        pip.air_gap(10)
        pip.return_tip()

        # Replace Cell Plate on H-S with Bead Plate (now has sample in it also)
        h_s.open_labware_latch()
        # Transfer empty cell plate to empty mag plate
        ctx.move_labware(
            cell_plate,
            MAG_PLATE_SLOT,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "heater-shaker", slot=HS_SLOT),
            drop_offset=grip_offset("drop", "mag-plate"),
        )
        # Transfer Beads+Cells to H-S
        ctx.move_labware(
            sample_plate,
            h_s,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "deck"),
            drop_offset=grip_offset("drop", "heater-shaker", slot=HS_SLOT),
        )
        h_s.close_labware_latch()
        h_s.set_and_wait_for_shake_speed(rpm=2000)

        # Transfer empty cell plate to empty slot 2
        ctx.move_labware(
            cell_plate,
            2,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "mag-plate"),
            drop_offset=grip_offset("drop", "deck"),
        )

        # Incubate for beads to bind DNA
        ctx.delay(
            minutes=5 if not dry_run else 0.25, msg="Please wait 5 minutes while the sample binds with the beads."
        )
        h_s.deactivate_shaker()

        # Transfer plate to magnet
        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            MAG_PLATE_SLOT,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "heater-shaker", slot=HS_SLOT),
            drop_offset=grip_offset("drop", "mag-plate"),
        )
        h_s.close_labware_latch()

        for bindi in np.arange(settling_time, 0, -0.5):  # Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg="There are " + str(bindi) + " minutes left in the incubation.")

        # remove initial supernatant
        remove_supernatant(175, lysis_res)

    def wash(vol, source, waste):

        global whichwash  # Defines which wash the protocol is on to log on the app
        """
        if source == wash1:
            whichwash = 1
        if source == wash2:
            whichwash = 2
        if source == wash3:
            whichwash = 3
        if source == wash4:
            whichwash = 4
        """

        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        pip.blow_out(samples_m.top(-3))
        pip.air_gap(10)
        pip.return_tip()

        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=5 if not dry_run else 0.25, msg="Please allow 5 minutes for wash to mix on heater-shaker.")
        h_s.deactivate_shaker()

        # Transfer plate to magnet
        h_s.open_labware_latch()
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

        remove_supernatant(vol, lysis_res)

        whichwash = whichwash + 1

    def dnase(vol, source):
        pip.flow_rate.aspirate = 20
        pip.flow_rate.dispense = 50

        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        resuspend_pellet(45, samples_m, reps=4)
        pip.return_tip()

        h_s.set_and_wait_for_shake_speed(rpm=2000)
        ctx.delay(minutes=10 if not dry_run else 0.25, msg="Please wait 10 minutes while the dnase incubates.")
        h_s.deactivate_shaker()

        pip.flow_rate.aspirate = 50
        pip.flow_rate.dispense = 150

    def stop_reaction(vol, source):

        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        resuspend_pellet(vol, samples_m, reps=2)
        pip.blow_out(samples_m.top(-3))
        pip.air_gap(10)
        pip.return_tip()

        h_s.set_and_wait_for_shake_speed(rpm=2000)
        ctx.delay(
            minutes=3 if not dry_run else 0.25,
            msg="Please wait 3 minutes while the stop solution inactivates the dnase.",
        )
        h_s.deactivate_shaker()

        # Transfer plate to magnet
        h_s.open_labware_latch()
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

        remove_supernatant(vol + 50, lysis_res)

    def elute(vol, source):
        pip.pick_up_tip(tips1)
        # Transfer
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        # Mix
        resuspend_pellet(vol, samples_m, reps=2)
        pip.return_tip()

        # Elution Incubation
        h_s.set_and_wait_for_shake_speed(rpm=2000)
        tempdeck.set_temperature(4)
        h_s.deactivate_shaker()

        # Transfer plate to magnet
        h_s.open_labware_latch()
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
        pip.flow_rate.dispense = 25

        # Transfer From Sample Plate to Elution Plate
        pip.pick_up_tip(tips1)
        pip.aspirate(vol, samples_m)
        pip.dispense(vol, source)
        pip.return_tip()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    for loop in range(3):
        # Start Protocol
        lysis(lysis_vol, lysis_res)
        bind()
        wash(wash_vol, wash1, lysis_res)
        wash(wash_vol, wash2, lysis_res)
        # dnase1 treatment
        dnase(50, dnase_res)
        stop_reaction(100, stop_res)
        # Resume washes
        wash(wash_vol, wash3, lysis_res)
        wash(wash_vol, wash4, lysis_res)
        tempdeck.set_temperature(55)
        drybeads = 1  # Number of minutes you want to dry for
        for beaddry in np.arange(drybeads, 0, -0.5):
            ctx.delay(minutes=0.5, msg="There are " + str(beaddry) + " minutes left in the drying step.")
        elute(elution_vol, elution_res)
        reset_protocol()
