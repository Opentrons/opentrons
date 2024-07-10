def get_values(*names):
    import json

    _all_values = json.loads(
        """{"trash_chute":false,"USE_GRIPPER":true,"dry_run":false,"temp_mod":true,"heater_shaker":true,"tip_mixing":false,"wash1_vol":500,"wash2_vol":900,"wash3_vol":900,"wash4_vol":900,"lysis_vol":200,"bind_vol":600,"bind2_vol":500,"elution_vol":75,"protocol_filename":"Zymo_Magbead_DNA_Cells-Flex_96_channel"}"""
    )
    return [_all_values[n] for n in names]


from opentrons.types import Point
import json
import math
from opentrons import types
import numpy as np

metadata = {"author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>"}

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
    tip_mixing = False  # this will only be activated if heater_shaker is False

    wash1_vol = 500
    wash2_vol = 900
    wash3_vol = 900
    wash4_vol = 900
    lysis_vol = 200
    bind_vol = 600
    bind2_vol = 500
    elution_vol = 75

    try:
        [
            trash_chute,
            USE_GRIPPER,
            dry_run,
            temp_mod,
            heater_shaker,
            tip_mixing,
            wash1_vol,
            wash2_vol,
            wash3_vol,
            bind_vol,
            lysis_vol,
            elution_vol,
        ] = get_values(  # noqa: F821
            "trash_chute",
            "USE_GRIPPER",
            "dry_run",
            "temp_mod",
            "heater_shaker",
            "tip_mixing",
            "wash1_vol",
            "wash2_vol",
            "wash3_vol",
            "bind_vol",
            "lysis_vol",
            "elution_vol",
        )

    except NameError:
        pass

    # Just to be safe
    if heater_shaker:
        tip_mixing = False

    deepwell_type = "nest_96_wellplate_2ml_deep"
    if not dry_run:
        settling_time = 2
        lysis_incubation = 30
    if dry_run:
        settling_time = 0.25
        lysis_incubation = 0.25
    sample_vol = 10
    bead_vol = 25
    PK_vol = 20
    lysis_total_vol = PK_vol + lysis_vol
    starting_vol = lysis_vol + sample_vol
    binding_buffer_vol = bead_vol + bind_vol

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

    if temp_mod:
        temp = ctx.load_module("temperature module gen2", "A3")
        tempblock = temp.load_adapter("opentrons_96_well_aluminum_block")
        elutionplate = tempblock.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "Elution Plate")
    else:
        elutionplate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "A3", "Elution Plate")

    magblock = ctx.load_module("magneticBlockV1", "C1")

    #'#008000','#A52A2A','#00FFFF','#0000FF','#800080','#ADD8E6','#FF0000','#FFFF00','#FF00FF','#00008B','#7FFFD4','#FFC0CB','#FFA500','#00FF00','#C0C0C0'
    # Defining Liquids

    lysis_reservoir = ctx.load_labware(deepwell_type, "D2", "Lysis ")
    lysis_res = lysis_reservoir.wells()[0]
    lysis_buffer = ctx.define_liquid(name="Lysis Buffer", description="Lysis Buffer", display_color="#008000")
    for well in lysis_reservoir.wells():
        well.load_liquid(liquid=lysis_buffer, volume=lysis_vol + 91)
        pk_buffer = ctx.define_liquid(name="PK Buffer", description="Proteinase K", display_color="#008000")
    for well in lysis_reservoir.wells():
        well.load_liquid(liquid=pk_buffer, volume=PK_vol + 9)

    bind_reservoir = ctx.load_labware(deepwell_type, "C2", "Beads and binding ")
    bind_res = bind_reservoir.wells()[0]
    bind_buffer = ctx.define_liquid(name="Binding Buffer", description="Binding Buffer", display_color="#A52A2A")
    for well in bind_reservoir.wells():
        well.load_liquid(liquid=bind_buffer, volume=bind_vol + 96)
    bead_buffer = ctx.define_liquid(name="Magbeads", description="Magnetic Beads", display_color="#A52A2A")
    for well in bind_reservoir.wells():
        well.load_liquid(liquid=bead_buffer, volume=bead_vol + 4)

    bind2_reservoir = ctx.load_labware(deepwell_type, "C3", "Binding 2 ")
    bind2_res = bind2_reservoir.wells()[0]
    bind2_buffer = ctx.define_liquid(name="Bind Buffer", description="Second Bind Buffer (No beads)", display_color="#00FFFF")
    for well in bind2_reservoir.wells():
        well.load_liquid(liquid=bind2_buffer, volume=bind2_vol + 100)

    wash1_reservoir = ctx.load_labware(deepwell_type, "B1", "Wash 1 ")
    wash1_res = wash1_reservoir.wells()[0]
    wash1_buffer = ctx.define_liquid(name="Wash 1", description="Wash 1 Buffer", display_color="#0000FF")
    for well in wash1_reservoir.wells():
        well.load_liquid(liquid=wash1_buffer, volume=wash1_vol + 100)

    wash2_reservoir = ctx.load_labware(deepwell_type, "B2", "Wash 2 ")
    wash2_res = wash2_reservoir.wells()[0]
    wash2_buffer = ctx.define_liquid(name="Wash 2", description="Wash 2 Buffer", display_color="#800080")
    for well in wash2_reservoir.wells():
        well.load_liquid(liquid=wash2_buffer, volume=(2 * wash2_vol) + 100)

    wash4_reservoir = ctx.load_labware(deepwell_type, "B3", "Wash 3 ")
    wash4_res = wash4_reservoir.wells()[0]
    wash4_buffer = ctx.define_liquid(name="Wash 4", description="Wash 4 Buffer", display_color="#ADD8E6")
    for well in wash4_reservoir.wells():
        well.load_liquid(liquid=wash4_buffer, volume=wash4_vol + 100)

    elution_res = elutionplate.wells()[0]
    elution_buffer = ctx.define_liquid(name="Elution Buffer", description="Elution Buffer", display_color="#FF0000")
    for well in elutionplate.wells():
        well.load_liquid(liquid=elution_buffer, volume=elution_vol + 5)

    # Load tips
    tips = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A1", adapter="opentrons_flex_96_tiprack_adapter").wells()[0]
    tips1 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A2", adapter="opentrons_flex_96_tiprack_adapter").wells()[0]

    # load 96 channel pipette
    pip = ctx.load_instrument("flex_96channel_1000", mount="left")

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

    # Just in case
    if heater_shaker:
        h_s.close_labware_latch()

    # Start Protocol

    # Mix and Transfer Lysis
    ctx.comment("------Mix Shield and PK in , Transfer to Sample Plate, Mix in Sample Plate-----")
    pip.pick_up_tip(tips)
    pip.aspirate(lysis_total_vol, lysis_res)
    pip.air_gap(20)
    pip.dispense(pip.current_volume, samples_m)
    for _ in range(8 if not dry_run else 1):
        pip.aspirate(lysis_total_vol * 0.9, samples_m)
        pip.dispense(pip.current_volume, samples_m.bottom(20))
    if not tip_mixing:
        pip.return_tip()

    # Mix in sample plate
    if heater_shaker:
        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=lysis_incubation, msg="Please wait " + str(lysis_incubation) + " minutes to allow for proper lysis mixing.")
        h_s.deactivate_shaker()
    if not heater_shaker and tip_mixing:
        for x in range(4):
            bead_mix(lysis_total_vol, samples_m, reps=8)
            ctx.delay(minutes=2)
        pip.return_tip()
    if not heater_shaker and not tip_mixing:
        if not dry_run:
            ctx.pause(msg="Place on shaker for 30 minutes at 2000 rpm.")

    # Transfer and mix bind&beads
    ctx.comment("------Mixing Beads with Binding, then Transfer to Sample Plate-----")
    pip.pick_up_tip(tips)
    bead_mix(binding_buffer_vol, bind_res, reps=5 if not dry_run else 1)
    pip.aspirate(binding_buffer_vol, bind_res)
    pip.dispense(binding_buffer_vol, samples_m)
    if binding_buffer_vol + starting_vol < 1000:
        mix_vol = binding_buffer_vol + starting_vol
    else:
        mix_vol = 1000
    bead_mix(mix_vol, samples_m, reps=7 if not dry_run else 1)
    if not tip_mixing:
        pip.return_tip()

    # Shake for binding incubation
    if heater_shaker:
        h_s.set_and_wait_for_shake_speed(rpm=1800)
        ctx.delay(minutes=10 if not dry_run else 0.25, msg="Please allow 10 minutes for the beads to bind the DNA.")
        h_s.deactivate_shaker()
    if not heater_shaker and tip_mixing:
        for x in range(2):
            bead_mix(binding_buffer_vol, samples_m, reps=6)
            ctx.delay(minutes=2)
        pip.return_tip()
    if not heater_shaker and not tip_mixing:
        if not dry_run:
            ctx.pause(msg="Place on shaker for 10 minutes at 1800 rpm.")

    ctx.comment("------Moving Plate to Magnet to Begin Pelleting-----")
    if heater_shaker:
        h_s.open_labware_latch()
    # Transfer plate to magnet
    ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
    if heater_shaker:
        h_s.close_labware_latch()

    ctx.delay(minutes=settling_time, msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet.")

    # Remove Supernatant and move off magnet
    ctx.comment("------Removing Supernatant-----")
    pip.pick_up_tip(tips)
    re_vol = binding_buffer_vol + starting_vol
    pip.aspirate(re_vol, samples_m.bottom(0.3))
    pip.dispense(re_vol, bind_res)
    if re_vol > 1000:
        dif = (starting_vol + binding_buffer_vol) - 1000
        pip.aspirate(dif + 50, samples_m.bottom(0.1))
        pip.dispense(dif + 50, bind_res)
    pip.return_tip()

    # Transfer plate from magnet to H/S
    if heater_shaker:
        h_s.open_labware_latch()
    ctx.move_labware(sample_plate, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
    if heater_shaker:
        h_s.close_labware_latch()

    # Quick Bind #2
    ctx.comment("-----Beginning Bind #2-----")
    pip.pick_up_tip(tips)
    pip.aspirate(bind2_vol, bind2_res)
    pip.air_gap(20)
    pip.dispense(pip.current_volume, samples_m.top())
    resuspend_pellet(bind2_vol, samples_m, reps=4 if not dry_run else 1)
    pip.blow_out()
    if not tip_mixing:
        pip.return_tip()

    ctx.comment("-----Mixing Bind2 with Beads-----")
    if heater_shaker:
        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=1 if not dry_run else 0.25, msg="Shake at 2000 rpm for 1 minutes.")
        h_s.deactivate_shaker()
    if not heater_shaker and tip_mixing:
        bead_mix(bind2_vol, samples_m, reps=5)
        pip.return_tip()
    if not heater_shaker and not tip_mixing:
        if not dry_run:
            ctx.pause(msg="Place on shaker at 2000 rpm for 1 minute.")

    ctx.comment("------Moving Plate to Magnet to Begin Pelleting-----")
    if heater_shaker:
        h_s.open_labware_latch()
    # Transfer plate to magnet
    ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
    if heater_shaker:
        h_s.close_labware_latch()

    ctx.delay(minutes=settling_time, msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet.")

    # Remove Supernatant and move off magnet
    ctx.comment("------Removing Supernatant-----")
    pip.pick_up_tip(tips)
    pip.aspirate(bind2_vol, samples_m.bottom(0.3))
    pip.dispense(bind2_vol, bind_res)
    pip.return_tip()

    # Transfer plate from magnet to H/S
    if heater_shaker:
        h_s.open_labware_latch()
    ctx.move_labware(sample_plate, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
    if heater_shaker:
        h_s.close_labware_latch()

    # Washes
    for i in range(4 if not dry_run else 1):
        if i == 0:
            wash_res = wash1_res
            wash_vol = wash1_vol
            waste_res = bind_res
            whichwash = 1
            height = 1
        if i == 1:
            wash_res = wash2_res
            wash_vol = wash2_vol
            waste_res = bind2_res
            whichwash = 2
            height = 15
        if i == 2:
            wash_res = wash2_res
            wash_vol = wash3_vol
            waste_res = bind2_res
            whichwash = 3
            height = 1
        if i == 3:
            wash_res = wash4_res
            wash_vol = wash4_vol
            waste_res = wash2_res
            whichwash = 4
            height = 1

        ctx.comment("------Beginning Wash #" + str(whichwash) + "-----")
        pip.pick_up_tip(tips)
        pip.aspirate(wash_vol, wash_res.bottom(height))
        pip.dispense(wash_vol, samples_m)
        pip.air_gap(20)
        if not tip_mixing:
            pip.return_tip()
            pip.home()

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

        if heater_shaker:
            h_s.open_labware_latch()
        # Transfer plate to magnet
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ctx.delay(
            minutes=settling_time,
            msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet in wash #" + str(whichwash) + ".",
        )

        # Remove Supernatant and move off magnet
        ctx.comment("------Removing Supernatant-----")
        pip.pick_up_tip(tips)
        pip.aspirate(wash_vol, samples_m.bottom(0.3))
        pip.dispense(wash_vol, waste_res.top())

        pip.return_tip()
        # Transfer plate from magnet to H/S
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

    ctx.comment("------Drying Beads for 10 minutes-----")

    if heater_shaker and not dry_run:
        h_s.set_and_wait_for_temperature(55)

    drybeads = 9 if not dry_run else 0.5  # Number of minutes you want to dry for
    for beaddry in np.arange(drybeads, 0, -0.5):
        ctx.delay(minutes=0.5, msg="There are " + str(beaddry) + " minutes left in the drying step.")

    # Elution
    ctx.comment("------Beginning Elution-----")
    pip.pick_up_tip(tips1)
    pip.flow_rate.aspirate = 25
    pip.aspirate(elution_vol, elution_res)
    pip.dispense(elution_vol, samples_m)
    if not tip_mixing:
        pip.return_tip()
        pip.home()

    if heater_shaker:
        h_s.set_and_wait_for_shake_speed(rpm=2000)
        ctx.delay(minutes=5 if not dry_run else 0.25, msg="Please wait 5 minutes to allow dna to elute from beads.")
        h_s.deactivate_shaker()
    if not heater_shaker and tip_mixing:
        bead_mix(elution_vol, samples_m, reps=12)
        pip.return_tip()
    if not heater_shaker and not tip_mixing:
        if not dry_run:
            ctx.pause(msg="Place plate on shaker at 2000 rpm for 5 minutes.")

    # Transfer plate to magnet
    if heater_shaker:
        h_s.open_labware_latch()
    ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
    if heater_shaker:
        h_s.close_labware_latch()

    ctx.delay(minutes=settling_time, msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet.")

    ctx.comment("------Transfer DNA to Final Elution Plate-----")
    pip.pick_up_tip(tips1)
    pip.aspirate(elution_vol, samples_m.bottom(0.15))
    pip.dispense(elution_vol, elutionplate.wells()[0])
    pip.return_tip()

    pip.home()
