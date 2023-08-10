from opentrons.types import Point
import json
import os
import math
from time import sleep
from opentrons import types
import numpy as np

"""
Setup:

Slot 1 = H-S with Nest DW (empty plate)
Slot 2 = Nest DW (350 ul each well)
Slot 3 = Temp Mod with Armadillo PCR plate (100ul each well)
Slot 4 = Magblock (empty)
Slot 5 = Nest DW (300 ul each well)
Slot 6 = Nest DW (empty plate)
Slot 7 = Nest DW (1300 ul each well)
Slot 8 = Nest DW (700 ul each well)
Slot 9 = Nest DW (500 ul each well)
Slot 10 = 1000ul tips
Slot 11 = 1000ul tips (only used during elution steps)

"""

metadata = {
    "protocolName": "Omega HDQ DNA Extraction: Bacteria 96 FOR ABR TESTING",
    "author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>",
    "apiLevel": "2.15",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.15",
}

dry_run = True
HS_SLOT = 1
USE_GRIPPER = True


# Start protocol
def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """

    # *****If drying beads does not produce same results- can eliminate waste in slot 12 and add extra elution reservoir***

    # Same for all HDQ Extractions
    deepwell_type = "nest_96_wellplate_2ml_deep"
    wash_vol = 600
    settling_time = 2
    num_washes = 3

    h_s = ctx.load_module("heaterShakerModuleV1", HS_SLOT)
    TL_plate = h_s.load_labware(deepwell_type)  # can be whatever plate type
    TL_samples = TL_plate.wells()[0]
    sample_plate = ctx.load_labware(deepwell_type, "6")
    samples_m = sample_plate.wells()[0]

    temp = ctx.load_module("temperature module gen2", "3")
    elutionplate = temp.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt")
    elution_res = elutionplate.wells()[0]
    MAG_PLATE_SLOT = ctx.load_module("magneticBlockV1", "4")
    # elution_two = ctx.load_labware(deepwell_type, '12').wells()[0]

    TL_res = ctx.load_labware(deepwell_type, "2").wells()[0]
    AL_res = ctx.load_labware(deepwell_type, "5").wells()[0]
    wash1_res = ctx.load_labware(deepwell_type, "7").wells()[0]
    wash2_res = ctx.load_labware(deepwell_type, "8").wells()[0]
    bind_res = ctx.load_labware(deepwell_type, "9").wells()[0]

    # Load tips
    tips = ctx.load_labware("opentrons_ot3_96_tiprack_1000ul_rss", "10").wells()[0]
    tips1 = ctx.load_labware("opentrons_ot3_96_tiprack_1000ul_rss", "11").wells()[0]

    # Differences between sample types
    AL_vol = 230
    TL_vol = 270
    sample_vol = 200
    inc_temp = 55
    starting_vol = AL_vol + sample_vol
    binding_buffer_vol = 340
    elution_two_vol = 350
    elution_vol = 100

    # load 96 channel pipette
    pip = ctx.load_instrument("p1000_96", mount="left")

    pip.flow_rate.aspirate = 50
    pip.flow_rate.dispense = 150
    pip.flow_rate.blow_out = 300

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
        ctx.comment("Move TL Sample Plate Back to Heater-Shaker")
        h_s.open_labware_latch()
        ctx.move_labware(
            TL_plate,
            h_s,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "deck"),
            drop_offset=grip_offset("drop", "heater-shaker", slot=HS_SLOT),
        )
        h_s.close_labware_latch()
        ctx.comment("Move Sample Plate back to Original Deck Slot")
        ctx.move_labware(
            sample_plate,
            6,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "mag-plate"),
            drop_offset=grip_offset("drop", "deck"),
        )

        pip.pick_up_tip(tips)
        # Return Washes 1 and 2 from TL res to Wash res
        for r in range(2):
            if r == 0:
                pip.aspirate(wash_vol, TL_res.top(-20))
            else:
                pip.aspirate(wash_vol, TL_res.bottom(1))
            pip.dispense(wash_vol, wash1_res)
            pip.air_gap(5)

        # Return sample TL from Bind to TL
        pip.aspirate(200, bind_res.top(-19))
        pip.dispense(200, TL_res)
        pip.air_gap(5)

        # Return sample TL from TL sample plate to TL res
        pip.aspirate(70, TL_samples.bottom())
        pip.dispense(70, TL_res)
        pip.air_gap(5)

        # Return AL from Bind to AL
        pip.aspirate(AL_vol, bind_res.top(-25))
        pip.dispense(AL_vol, AL_res)
        pip.air_gap(5)

        # Return W3 from Bind to W3
        pip.aspirate(wash_vol, bind_res.bottom())
        pip.dispense(wash_vol, wash2_res)
        pip.air_gap(5)

        pip.return_tip()

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

    # Just in case
    h_s.close_labware_latch()
    for loop in range(3):
        # Start Protocol
        pip.pick_up_tip(tips)
        # Mix PK and TL buffers
        ctx.comment("----- Mixing TL buffer and PK -----")
        for m in range(3):
            pip.aspirate(TL_vol, TL_res)
            pip.dispense(TL_vol, TL_res.bottom(30))
        # Transfer TL to plate
        ctx.comment("----- Transferring TL and PK to samples -----")
        pip.aspirate(TL_vol, TL_res)
        pip.air_gap(10)
        pip.dispense(pip.current_volume, TL_samples)
        h_s.set_target_temperature(55)
        ctx.comment("----- Mixing TL buffer with samples -----")
        resuspend_pellet(TL_vol, TL_samples, reps=4)
        pip.return_tip()

        ctx.comment("----- Mixing and incubating for 30 minutes on Heater-Shaker -----")
        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=30 if not dry_run else 0.25, msg="Shake at 2000 rpm for 30 minutes to allow lysis.")
        h_s.deactivate_shaker()

        # Transfer 200ul of sample + TL buffer to sample plate
        ctx.comment("----- Mixing, then transferring 200 ul of sample to new deep well plate -----")
        pip.pick_up_tip(tips)
        pip.aspirate(sample_vol, TL_samples)
        pip.air_gap(20)
        pip.dispense(pip.current_volume, samples_m)
        pip.blow_out()
        pip.return_tip()

        # Move TL samples off H-S into deck slot and sample plate onto H-S
        ctx.comment("------- Transferring TL and Sample plates -------")
        # Transfer TL samples from H-S to Magnet
        h_s.open_labware_latch()
        ctx.move_labware(
            TL_plate,
            MAG_PLATE_SLOT,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "heater-shaker", slot=HS_SLOT),
            drop_offset=grip_offset("drop", "mag-plate"),
        )
        # Move sample plate onto H-S from deck
        ctx.move_labware(
            sample_plate,
            h_s,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "deck"),
            drop_offset=grip_offset("drop", "heater-shaker", slot=HS_SLOT),
        )
        h_s.close_labware_latch()
        # Move plate off magplate onto the deck
        ctx.move_labware(
            TL_plate,
            6,
            use_gripper=USE_GRIPPER,
            pick_up_offset=grip_offset("pick-up", "mag-plate"),
            drop_offset=grip_offset("drop", "deck"),
        )

        # Transfer and mix AL_lysis
        ctx.comment("------- Starting AL Lysis Steps -------")
        pip.pick_up_tip(tips)
        pip.aspirate(AL_vol, AL_res)
        pip.air_gap(10)
        pip.dispense(pip.current_volume, samples_m)
        resuspend_pellet(starting_vol, samples_m, reps=4)
        pip.drop_tip(tips)

        # Mix, then heat
        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=4 if not dry_run else 0.25, msg="Please wait 4 minutes to allow for proper lysis mixing.")

        h_s.deactivate_shaker()

        # Transfer and mix bind&beads
        ctx.comment("------- Mixing and Transferring Beads and Binding -------")
        pip.pick_up_tip(tips)
        bead_mix(binding_buffer_vol, bind_res, reps=3)
        pip.aspirate(binding_buffer_vol, bind_res)
        pip.dispense(binding_buffer_vol, samples_m)
        bead_mix(binding_buffer_vol + starting_vol, samples_m, reps=3)
        pip.return_tip()
        pip.home()

        # Shake for binding incubation
        h_s.set_and_wait_for_shake_speed(rpm=1800)
        ctx.delay(minutes=10 if not dry_run else 0.25, msg="Please allow 10 minutes for the beads to bind the DNA.")

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

        ctx.delay(minutes=settling_time, msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet.")

        # Remove Supernatant and move off magnet
        ctx.comment("------- Removing Supernatant -------")
        pip.pick_up_tip(tips)
        pip.aspirate(1000, samples_m.bottom(0.5))
        pip.dispense(1000, bind_res)
        if starting_vol + binding_buffer_vol > 1000:
            pip.aspirate(1000, samples_m.bottom(0.5))
            pip.dispense(1000, bind_res)
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

        # Washes
        for i in range(num_washes):
            if i == 0 or 1:
                wash_res = wash1_res
                waste_res = TL_res
            if i == 2:
                wash_res = wash2_res
                waste_res = bind_res
            ctx.comment("------- Starting Wash #" + str(i + 1) + " -------")
            pip.pick_up_tip(tips)
            pip.aspirate(wash_vol, wash_res)
            pip.dispense(wash_vol, samples_m)
            # resuspend_pellet(wash_vol,samples_m,reps=1)
            pip.blow_out()
            pip.air_gap(10)
            pip.return_tip()
            pip.home()

            h_s.set_and_wait_for_shake_speed(rpm=1800)
            ctx.delay(minutes=5 if not dry_run else 0.25)
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

            ctx.delay(
                minutes=settling_time, msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet."
            )

            # Remove Supernatant and move off magnet
            ctx.comment("------- Removing Supernatant -------")
            pip.pick_up_tip(tips)
            pip.aspirate(1000, samples_m.bottom(0.5))
            pip.dispense(1000, waste_res.top())
            if wash_vol > 1000:
                pip.aspirate(1000, samples_m.bottom(0.5))
                pip.dispense(1000, waste_res.top())
            pip.return_tip()

            # if i == 0 or 2 and not dry_run:
            # Transfer plate from magnet to H/S after first two washes
            ctx.move_labware(
                sample_plate,
                h_s,
                use_gripper=USE_GRIPPER,
                pick_up_offset=grip_offset("pick-up", "mag-plate"),
                drop_offset=grip_offset("drop", "heater-shaker", slot=HS_SLOT),
            )
            h_s.close_labware_latch()

        dry_beads = 10

        for beaddry in np.arange(dry_beads, 0, -0.5):
            ctx.delay(minutes=0.5, msg="There are " + str(beaddry) + " minutes left in the drying step.")

        # Elution
        ctx.comment("------- Beginning Elution Steps -------")

        pip.pick_up_tip(tips1)
        pip.aspirate(elution_vol, elution_res)
        pip.dispense(elution_vol, samples_m)
        resuspend_pellet(elution_vol, samples_m, reps=3)
        pip.return_tip()
        pip.home()

        h_s.set_and_wait_for_shake_speed(rpm=2000)
        ctx.delay(minutes=5 if not dry_run else 0.25, msg="Please wait 5 minutes to allow dna to elute from beads.")
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

        ctx.delay(minutes=settling_time, msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet.")

        pip.pick_up_tip(tips1)
        pip.aspirate(elution_vol, samples_m)
        pip.dispense(elution_vol, elution_res)
        pip.return_tip()

        pip.home()

        reset_protocol()
