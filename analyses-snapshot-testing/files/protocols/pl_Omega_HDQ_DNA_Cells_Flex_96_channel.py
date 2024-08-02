def get_values(*names):
    import json

    _all_values = json.loads(
        """{"trash_chute":false,"USE_GRIPPER":true,"dry_run":false,"temp_mod":true,"heater_shaker":true,"tip_mixing":false,"wash_vol":600,"AL_vol":230,"sample_vol":180,"bind_vol":320,"elution_vol":100,"protocol_filename":"Omega_HDQ_DNA_Cells-Flex_96_channel"}"""
    )
    return [_all_values[n] for n in names]


from opentrons.types import Point
import json
import math
from opentrons import types
import numpy as np

metadata = {
    "author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}


# Start protocol
def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    trash_chute = False  # If false, waste bin loaded in D3, if True, trash chute loaded there
    USE_GRIPPER = True
    dry_run = False
    temp_mod = True
    heater_shaker = True
    tip_mixing = False

    wash_vol = 600
    AL_vol = 230
    bind_vol = 320
    sample_vol = 180
    elution_vol = 100

    try:
        [trash_chute, USE_GRIPPER, dry_run, temp_mod, heater_shaker, tip_mixing, wash_vol, sample_vol, bind_vol, AL_vol, elution_vol] = (
            get_values(  # noqa: F821
                "trash_chute",
                "USE_GRIPPER",
                "dry_run",
                "temp_mod",
                "heater_shaker",
                "tip_mixing",
                "wash_vol",
                "sample_vol",
                "bind_vol",
                "AL_vol",
                "elution_vol",
            )
        )

    except NameError:
        pass

    # Just to be safe
    if heater_shaker:
        tip_mixing = False

    # Same for all HDQ Extractions
    deepwell_type = "nest_96_wellplate_2ml_deep"
    if not dry_run:
        settling_time = 2
        num_washes = 3
    if dry_run:
        settling_time = 0.5
        num_washes = 1
    bead_vol = PK_vol = 20
    inc_temp = 55
    AL_total_vol = AL_vol + PK_vol
    binding_buffer_vol = bead_vol + bind_vol
    starting_vol = AL_total_vol + sample_vol
    if trash_chute:
        trash = ctx.load_waste_chute()
    else:
        trash = ctx.load_trash_bin("D3")

    if heater_shaker:
        h_s = ctx.load_module("heaterShakerModuleV1", "D1")
        h_s_adapter = h_s.load_adapter("opentrons_96_deep_well_adapter")
        sample_plate = h_s_adapter.load_labware(deepwell_type, "Sample Plate")
    else:
        sample_plate = ctx.load_labware(deepwell_type, "D1", "Sample Plate")

    samples_m = sample_plate.wells()[0]

    # NOTE: MAG BLOCK will be on slot 6
    if temp_mod:
        temp = ctx.load_module("temperature module gen2", "A3")
        tempblock = temp.load_adapter("opentrons_96_well_aluminum_block")
        elutionplate = tempblock.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "Elution Plate/ Reservoir")
    else:
        elutionplate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "A3", "Elution Plate/ Reservoir")

    magblock = ctx.load_module("magneticBlockV1", "C1")
    waste = ctx.load_labware("nest_1_reservoir_195ml", "B3", "Liquid Waste").wells()[0].top()

    #'#008000','#A52A2A','#00FFFF','#0000FF','#800080','#ADD8E6','#FF0000','#FFFF00','#FF00FF','#00008B','#7FFFD4','#FFC0CB','#FFA500','#00FF00','#C0C0C0'

    lysis_reservoir = ctx.load_labware(deepwell_type, "D2", "Lysis reservoir")
    lysis_res = lysis_reservoir.wells()[0]
    lysis_buffer = ctx.define_liquid(name="Lysis Buffer", description="AL Buffer", display_color="#008000")
    for well in lysis_reservoir.wells():
        well.load_liquid(liquid=lysis_buffer, volume=AL_vol + 92)

    PK_buffer = ctx.define_liquid(name="PK Buffer", description="Proteinase K", display_color="#008000")
    for well in lysis_reservoir.wells():
        well.load_liquid(liquid=PK_buffer, volume=PK_vol + 8)

    bind_reservoir = ctx.load_labware(deepwell_type, "C2", "Beads and binding reservoir")
    bind_res = bind_reservoir.wells()[0]
    bind_buffer = ctx.define_liquid(name="Binding Buffer", description="Binding Buffer", display_color="#A52A2A")
    for well in bind_reservoir.wells():
        well.load_liquid(liquid=bind_buffer, volume=bind_vol + 91.5)

    bead_buffer = ctx.define_liquid(name="Magnetic Beads", description="Magnetic Beads", display_color="#A52A2A")
    for well in bind_reservoir.wells():
        well.load_liquid(liquid=bead_buffer, volume=bead_vol + 8.5)

    wash1_reservoir = ctx.load_labware(deepwell_type, "C3", "Wash 1 reservoir")
    wash1_res = wash1_reservoir.wells()[0]
    wash1_buffer = ctx.define_liquid(name="Wash 1 and 2 Buffer", description="VHB Buffer", display_color="#00FFFF")
    for well in wash1_reservoir.wells():
        well.load_liquid(liquid=wash1_buffer, volume=(wash_vol * 2) + 100)

    wash2_reservoir = ctx.load_labware(deepwell_type, "B1", "Wash 2 reservoir")
    wash2_res = wash2_reservoir.wells()[0]
    wash2_buffer = ctx.define_liquid(name="Wash 3 Buffer", description="SPM Buffer", display_color="#0000FF")
    for well in wash2_reservoir.wells():
        well.load_liquid(liquid=wash2_buffer, volume=wash_vol + 100)

    elution_res = elutionplate.wells()[0]
    elution_buffer = ctx.define_liquid(name="Elution Buffer", description="Elution Buffer", display_color="#800080")
    for well in elutionplate.wells():
        well.load_liquid(liquid=elution_buffer, volume=elution_vol + 5)

    samples = ctx.define_liquid(name="Samples", description="Samples in PBS", display_color="#ADD8E6")
    for well in sample_plate.wells():
        well.load_liquid(liquid=samples, volume=sample_vol)

    # Load tips
    tips = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A1", adapter="opentrons_flex_96_tiprack_adapter").wells()[0]
    tips1 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A2", adapter="opentrons_flex_96_tiprack_adapter").wells()[0]

    # load 96 channel pipette
    pip = ctx.load_instrument("flex_96channel_1000", mount="left")

    pip.flow_rate.aspirate = 50
    pip.flow_rate.dispense = 150
    pip.flow_rate.blow_out = 300

    def resuspend_pellet(vol, plate, reps=3):
        pip.flow_rate.aspirate = 200
        pip.flow_rate.dispense = 300

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

        pip.flow_rate.aspirate = 150
        pip.flow_rate.dispense = 200

    def bead_mix(vol, plate, reps=5):
        pip.flow_rate.aspirate = 200
        pip.flow_rate.dispense = 300

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

        pip.flow_rate.aspirate = 150
        pip.flow_rate.dispense = 200

    # Just in case
    if heater_shaker:
        h_s.close_labware_latch()

    # Start Protocol

    # Transfer and mix lysis
    pip.pick_up_tip(tips)
    pip.aspirate(AL_total_vol, lysis_res)
    pip.dispense(AL_total_vol, samples_m)
    resuspend_pellet(400, samples_m, reps=4 if not dry_run else 1)
    if not tip_mixing:
        pip.return_tip()

    # Mix, then heat
    if heater_shaker:
        h_s.set_and_wait_for_shake_speed(1800)
        ctx.delay(minutes=10 if not dry_run else 0.25, msg="Please wait 10 minutes to allow for proper lysis mixing.")
        if not dry_run:
            h_s.set_and_wait_for_temperature(55)
        ctx.delay(minutes=10 if not dry_run else 0.25, msg="Please allow another 10 minutes of 55C incubation to complete lysis.")
        h_s.deactivate_shaker()
    if not heater_shaker and tip_mixing:
        ctx.comment(
            "This step is usually performed at 55C for the second 10 minutes, if results dont look right, look into our heater-shaker."
        )
        for x in range(3):
            bead_mix(AL_vol, samples_m, reps=10)
            ctx.delay(minutes=2)
        pip.return_tip()
    if not heater_shaker and not tip_mixing:
        if not dry_run:
            ctx.pause(msg="Place on shaker for 10 minutes at 1800 rpm, then increase temp to 55C for the second 10 minutes.")

    # Transfer and mix bind&beads
    pip.pick_up_tip(tips)
    bead_mix(binding_buffer_vol, bind_res, reps=4 if not dry_run else 1)
    pip.aspirate(binding_buffer_vol, bind_res)
    pip.dispense(binding_buffer_vol, samples_m)
    bead_mix(binding_buffer_vol + starting_vol, samples_m, reps=4 if not dry_run else 1)
    if not tip_mixing:
        pip.return_tip()
        pip.home()

    # Shake for binding incubation
    if heater_shaker:
        h_s.set_and_wait_for_shake_speed(rpm=1800)
        ctx.delay(minutes=10 if not dry_run else 0.25, msg="Please allow 10 minutes for the beads to bind the DNA.")
        h_s.deactivate_shaker()
    if not heater_shaker and tip_mixing:
        for x in range(2):
            bead_mix(binding_buffer_vol, samples_m, reps=8)
            ctx.delay(minutes=2)
        pip.return_tip()
    if not heater_shaker and not tip_mixing:
        if not dry_run:
            ctx.pause(msg="Place on shaker for 10 minutes at 1800 rpm.")

    if heater_shaker:
        h_s.open_labware_latch()
    # Transfer plate to magnet
    ctx.move_labware(
        sample_plate,
        magblock,
        use_gripper=USE_GRIPPER,
    )
    if heater_shaker:
        h_s.close_labware_latch()

    ctx.delay(
        minutes=settling_time,
        msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet.",
    )

    # Remove Supernatant and move off magnet
    pip.pick_up_tip(tips)
    pip.aspirate(1000, samples_m.bottom(0.3))
    pip.dispense(1000, waste)
    if starting_vol + binding_buffer_vol > 1000:
        pip.aspirate(1000, samples_m.bottom(0.1))
        pip.dispense(1000, waste)
    pip.return_tip()

    # Transfer plate from magnet to H/S
    if heater_shaker:
        h_s.open_labware_latch()
    ctx.move_labware(
        sample_plate,
        h_s_adapter if heater_shaker else "D1",
        use_gripper=USE_GRIPPER,
    )
    if heater_shaker:
        h_s.close_labware_latch()

    # Washes
    for i in range(num_washes if not dry_run else 1):
        if i == 0 or i == 1:
            wash_res = wash1_res
        else:
            wash_res = wash2_res

        pip.pick_up_tip(tips)
        pip.aspirate(wash_vol, wash_res)
        pip.dispense(wash_vol, samples_m)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=1800)
            ctx.delay(minutes=5 if not dry_run else 0.25)
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            bead_mix(wash_vol, samples_m, reps=12)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker for 5 minutes at 1800 rpm.")

        # Transfer plate to magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER,
        )
        if heater_shaker:
            h_s.close_labware_latch()

        ctx.delay(
            minutes=settling_time,
            msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet.",
        )

        # Remove Supernatant and move off magnet
        pip.pick_up_tip(tips)
        pip.aspirate(1000, samples_m.bottom(0.3))
        pip.dispense(1000, bind_res.top())
        if wash_vol > 1000:
            pip.aspirate(1000, samples_m.bottom(0.3))
            pip.dispense(1000, bind_res.top())
        pip.return_tip()

        # Transfer plate from magnet to H/S
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            h_s_adapter if heater_shaker else "D1",
            use_gripper=USE_GRIPPER,
        )
        if heater_shaker:
            h_s.close_labware_latch()

    # Dry beads
    if dry_run:
        drybeads = 0.5
    else:
        drybeads = 10
    # Number of minutes you want to dry for
    for beaddry in np.arange(drybeads, 0, -0.5):
        ctx.delay(minutes=0.5, msg="There are " + str(beaddry) + " minutes left in the drying step.")

    # Elution
    pip.pick_up_tip(tips1)
    pip.aspirate(elution_vol, elution_res)
    pip.dispense(elution_vol, samples_m)
    resuspend_pellet(elution_vol, samples_m, reps=3 if not dry_run else 1)
    if not tip_mixing:
        pip.return_tip()
        pip.home()

    if heater_shaker:
        h_s.set_and_wait_for_shake_speed(rpm=2000)
        ctx.delay(
            minutes=5 if not dry_run else 0.25,
            msg="Please wait 5 minutes to allow dna to elute from beads.",
        )
        h_s.deactivate_shaker()
    if not heater_shaker and tip_mixing:
        bead_mix(elution_vol, samples_m, reps=12)
        pip.return_tip()
    if not heater_shaker and not tip_mixing:
        if not dry_run:
            ctx.pause(msg="Place on shaker for 5 minutes at 2000 rpm.")

    # Transfer plate to magnet
    if heater_shaker:
        h_s.open_labware_latch()
    ctx.move_labware(
        sample_plate,
        magblock,
        use_gripper=USE_GRIPPER,
    )
    if heater_shaker:
        h_s.close_labware_latch()

    ctx.delay(
        minutes=settling_time,
        msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet.",
    )

    pip.pick_up_tip(tips1)
    pip.aspirate(elution_vol, samples_m)
    pip.dispense(elution_vol, elutionplate.wells()[0])
    pip.return_tip()

    pip.home()
