def get_values(*names):
    import json

    _all_values = json.loads(
        """{"trash_chute":false,"USE_GRIPPER":true,"dry_run":false,"temp_mod":true,"heater_shaker":true,"tip_mixing":false,"sample_vol":300,"wash_vol":400,"stop_vol":500,"lysis_vol":200,"bind_vol":400,"dnase_vol":50,"elution_vol":110,"protocol_filename":"Zymo_Quick-RNA_Cells-Flex_96_Channel"}"""
    )
    return [_all_values[n] for n in names]


from opentrons.types import Point
from opentrons import protocol_api
import json
import math
from opentrons import types
import numpy as np

metadata = {"author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>"}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}


whichwash = 1


def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    USE_GRIPPER = True
    trash_chute = False
    dry_run = True
    temp_mod = True
    heater_shaker = True
    tip_mixing = False  # this will only be activated if heater_shaker is False

    sample_vol = 300
    lysis_vol = 200
    bind_vol = 400
    wash_vol = 400
    stop_vol = 500
    dnase_vol = 50
    elution_vol = 110

    try:
        [
            trash_chute,
            USE_GRIPPER,
            dry_run,
            temp_mod,
            heater_shaker,
            tip_mixing,
            wash_vol,
            sample_vol,
            bind_vol,
            lysis_vol,
            stop_vol,
            dnase_vol,
            elution_vol,
        ] = get_values(  # noqa: F821
            "trash_chute",
            "USE_GRIPPER",
            "dry_run",
            "temp_mod",
            "heater_shaker",
            "tip_mixing",
            "wash_vol",
            "sample_vol",
            "bind_vol",
            "lysis_vol",
            "stop_vol",
            "dnase_vol",
            "elution_vol",
        )

    except NameError:
        pass

    # Just to be safe
    if heater_shaker:
        tip_mixing = False

    # Protocol Parameters
    deepwell_type = "nest_96_wellplate_2ml_deep"
    if not dry_run:
        settling_time = 3
    else:
        settling_time = 0.25
    bead_vol = 30
    binding_buffer_vol = bind_vol + bead_vol  # Beads+Binding
    starting_vol = sample_vol + lysis_vol  # sample volume (300 in shield) + lysis volume

    # Load trash
    if trash_chute:
        trash = ctx.load_waste_chute()
    else:
        trash = ctx.load_trash_bin("D3")

    if heater_shaker:
        h_s = ctx.load_module("heaterShakerModuleV1", "D1")
        h_s_adapter = h_s.load_adapter("opentrons_96_deep_well_adapter")
        sample_plate = h_s_adapter.load_labware(deepwell_type, "Sample Plate")
        h_s.close_labware_latch()
    else:
        sample_plate = ctx.load_labware(deepwell_type, "D1", "Sample Plate")

    samples_m = sample_plate.wells()[0]

    magblock = ctx.load_module("magneticBlockV1", "C1")

    if temp_mod:
        tempdeck = ctx.load_module("Temperature Module Gen2", "A3")
        tempblock = tempdeck.load_adapter("opentrons_96_well_aluminum_block")
        # Keep elution warm during protocol
        elutionplate = tempblock.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "Elution Plate")
    else:
        elutionplate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "A3", "Elution Plate")

    #'#008000','#A52A2A','#00FFFF','#0000FF','#800080','#ADD8E6','#FF0000','#FFFF00','#FF00FF','#00008B','#7FFFD4','#FFC0CB','#FFA500','#00FF00','#C0C0C0'

    # Defining Liquid Reservoirs and Assigning Colors/ Locations
    samples = ctx.define_liquid(name="Samples", description="Sample Volume in Shield", display_color="#00FF00")
    for well in sample_plate.wells():
        well.load_liquid(liquid=samples, volume=sample_vol)

    lysis_reservoir = ctx.load_labware(deepwell_type, "D2", "Lysis Reservoir")  # deleted after use- replaced (by gripper) with wash2 res
    lysis_res = lysis_reservoir.wells()[0]  # deleted after use- replaced (by gripper) with wash2 res
    lysis_buffer = ctx.define_liquid(name="Lysis Buffer", description="Lysis Buffer", display_color="#008000")
    for well in lysis_reservoir.wells():
        well.load_liquid(liquid=lysis_buffer, volume=lysis_vol + 100)

    bind_reservoir = ctx.load_labware(deepwell_type, "C3", "Bind Reservoir")
    bind_res = bind_reservoir.wells()[0]
    bind_buffer = ctx.define_liquid(name="Binding Buffer", description="Binding Buffer", display_color="#A52A2A")
    for well in bind_reservoir.wells():
        well.load_liquid(liquid=bind_buffer, volume=bind_vol + 93)
    bead_buffer = ctx.define_liquid(name="Beads", description="Magnetic Beads", display_color="#A52A2A")
    for well in bind_reservoir.wells():
        well.load_liquid(liquid=bead_buffer, volume=bead_vol + 7)

    wash1_reservoir = ctx.load_labware(deepwell_type, "C2", "Wash 1 Reservoir")
    wash1 = wash1_reservoir.wells()[0]
    wash1_buffer = ctx.define_liquid(name="Wash 1 Buffer", description="Wash 1 Buffer", display_color="#00FFFF")
    for well in wash1_reservoir.wells():
        well.load_liquid(liquid=wash1_buffer, volume=wash_vol + 100)

    wash2_reservoir = magblock.load_labware(
        deepwell_type, "Wash 2 Reservoir"
    )  # loaded on magplate- move to lysis location after lysis is used
    wash2 = wash2_reservoir.wells()[0]  # loaded on magplate- move to lysis location after lysis is used
    wash2_buffer = ctx.define_liquid(name="Wash 2 Buffer", description="Wash 2 Buffer", display_color="#0000FF")
    for well in wash2_reservoir.wells():
        well.load_liquid(liquid=wash2_buffer, volume=wash_vol + 100)

    wash3_reservoir = wash4_reservoir = wash5_reservoir = wash6_reservoir = ctx.load_labware(deepwell_type, "B1", "Wash 3-6 Reservoir")
    wash3 = wash4 = wash5 = wash6 = wash3_reservoir.wells()[0]
    wash3_buffer = ctx.define_liquid(name="Wash 3-6 Buffers", description="Wash 3-6 Buffers (EtOH)", display_color="#800080")
    for well in wash3_reservoir.wells():
        well.load_liquid(liquid=wash3_buffer, volume=(4 * wash_vol) + 100)

    dnase_reservoir = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "B3", "DNAse Reservoir")
    dnase_res = dnase_reservoir.wells()[0]
    dnase_buffer = ctx.define_liquid(name="DNAseI Buffer", description="DNAseI Buffer", display_color="#ADD8E6")
    for well in dnase_reservoir.wells():
        well.load_liquid(liquid=dnase_buffer, volume=dnase_vol + 3)

    stop_reservoir = ctx.load_labware(deepwell_type, "B2", "Stop Reservoir")
    stop_res = stop_reservoir.wells()[0]
    stop_buffer = ctx.define_liquid(name="Stop Buffer", description="Stop Buffer", display_color="#FF0000")
    for well in stop_reservoir.wells():
        well.load_liquid(liquid=stop_buffer, volume=stop_vol + 100)

    elution_res = elutionplate.wells()[0]
    elution_buffer = ctx.define_liquid(name="Elution Buffer", description="Elution Buffer", display_color="#FFFF00")
    for well in elutionplate.wells():
        well.load_liquid(liquid=elution_buffer, volume=elution_vol)

    # Load tips
    tips = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A1", adapter="opentrons_flex_96_tiprack_adapter").wells()[0]
    tips1 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A2", adapter="opentrons_flex_96_tiprack_adapter").wells()[0]

    # load instruments
    pip = ctx.load_instrument("flex_96channel_1000", mount="left")

    pip.flow_rate.aspirate = 50
    pip.flow_rate.dispense = 150
    pip.flow_rate.blow_out = 300

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
            pip.aspirate(transfer_vol, samples_m.bottom(0.25))
            pip.dispense(transfer_vol, waste.top(-2))
        pip.return_tip()

        # Transfer plate from magnet to H/S
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
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
        resuspend_pellet(350, samples_m, reps=4 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=2000)
        if not heater_shaker and tip_mixing:
            bead_mix(vol, samples_m, reps=5)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker at 2000 rpm for 1 minute.")

        # Delete Lysis reservoir from deck
        ctx.move_labware(
            lysis_reservoir, "C4" if USE_GRIPPER else protocol_api.OFF_DECK, use_gripper=USE_GRIPPER  # put in staging area (off deck)
        )

        # Transfer wash2 res from magnet to deck slot
        ctx.move_labware(wash2_reservoir, "D2", use_gripper=USE_GRIPPER)
        if heater_shaker:
            ctx.delay(minutes=1 if not dry_run else 0.25, msg="Please wait 1 minute while the lysis buffer mixes with the sample.")
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
        bead_mix(vol, source, reps=3 if not dry_run else 1)
        # Transfer from reservoir
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        # Mix in plate
        bead_mix(1000, samples_m, reps=4 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=1800)
            ctx.delay(minutes=20 if not dry_run else 0.25, msg="Please wait 20 minutes while the sample binds with the beads.")
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            for x in range(3):
                bead_mix(binding_buffer_vol, samples_m, reps=10)
                ctx.delay(minutes=2)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker at 1800 rpm for 20 minutes.")

        if heater_shaker:
            h_s.open_labware_latch()
        # Transfer plate to magnet
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        for bindi in np.arange(settling_time + 2, 0, -0.5):  # Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg="There are " + str(bindi) + " minutes left in the incubation.")

        # remove initial supernatant
        remove_supernatant(vol + starting_vol, bind_res)

    def wash(vol, source):

        global whichwash  # Defines which wash the protocol is on to log on the app

        if source == wash1:
            waste_res = bind_res
            h = 1
        if source == wash2:
            waste_res = bind_res
            h = 1
        if source == wash3:
            waste_res = wash2
            h = 30
        if source == wash4:
            waste_res = wash2
            h = 20
        if source == wash5:
            waste_res = wash2
            h = 10
        if source == wash6:
            waste_res = wash2
            h = 1

        pip.pick_up_tip(tips)
        pip.aspirate(vol, source.bottom(h))
        pip.dispense(vol, samples_m.top(-2))
        # resuspend_pellet(vol,samples_m,reps=5 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            ctx.delay(minutes=5 if not dry_run else 0.25, msg="Please allow 5 minutes for wash to mix on heater-shaker.")
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            bead_mix(vol, samples_m, reps=12)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker for 5 minutes at 2000 rpm.")

        if heater_shaker:
            h_s.open_labware_latch()
        # Transfer plate to magnet
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        for washi in np.arange(settling_time, 0, -0.5):  # settling time timer for washes
            ctx.delay(minutes=0.5, msg="There are " + str(washi) + " minutes left in wash " + str(whichwash) + " incubation.")

        remove_supernatant(vol, waste_res)

        whichwash += 1

    def dnase(vol, source):
        pip.pick_up_tip(tips)
        pip.flow_rate.aspirate = 10
        pip.aspirate(vol, source.bottom(0.5))
        ctx.delay(seconds=1)
        pip.dispense(vol, samples_m)
        if heater_shaker and not dry_run:
            h_s.set_target_temperature(65)
        resuspend_pellet(vol, samples_m, reps=8 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=2000)
            # minutes should equal 10 minus time it takes to reach 65
            ctx.delay(minutes=9 if not dry_run else 0.25, msg="Please wait 10 minutes while the dnase incubates.")
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            for x in range(2):
                bead_mix(vol, samples_m, reps=10)
                ctx.delay(minutes=1)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker for 10 minutes at 2000 rpm.")

    def stop_reaction(vol, source):

        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        # resuspend_pellet(vol,samples_m,reps=2 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=1800)
            ctx.delay(minutes=10 if not dry_run else 0.1, msg="Please wait 10 minutes while the stop solution inactivates the dnase.")
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            for x in range(2):
                bead_mix(vol, samples_m, reps=10)
                ctx.delay(minutes=1)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker for 10 minutes at 1800 rpm.")

        if heater_shaker:
            h_s.open_labware_latch()
        # Transfer plate to magnet
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        for stop in np.arange(settling_time + 1, 0, -0.5):
            ctx.delay(minutes=0.5, msg="There are " + str(stop) + " minutes left in this incubation.")

        remove_supernatant(vol + 50, wash1)

    def elute(vol, source):
        pip.pick_up_tip(tips1)
        # Transfer
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        # Mix
        resuspend_pellet(vol, samples_m, reps=3 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        # Elution Incubation
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=2000)
            if not dry_run and temp_mod:
                tempdeck.set_temperature(4)
            ctx.delay(minutes=3 if not dry_run else 0.25, msg="Please wait 5 minutes while the sample elutes from the beads.")
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            bead_mix(vol, samples_m, reps=9)
            pip.return_tip()
            if not dry_run and temp_mod:
                tempdeck.set_temperature(4)
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker for 5 minutes at 2000 rpm.")

        if heater_shaker:
            h_s.open_labware_latch()
        # Transfer plate to magnet
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        for elutei in np.arange(settling_time + 2, 0, -0.5):
            ctx.delay(minutes=0.5, msg="Incubating on MagDeck for " + str(elutei) + " more minutes.")

        pip.flow_rate.aspirate = 10

        pip.pick_up_tip(tips1)
        pip.aspirate(vol, samples_m)
        pip.dispense(vol, source)
        pip.return_tip()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    # Start Protocol
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
        wash(wash_vol, wash6)
        if temp_mod:
            tempdeck.set_temperature(55)
        drybeads = 9  # Number of minutes you want to dry for
    else:
        drybeads = 0.5
    for beaddry in np.arange(drybeads, 0, -0.5):
        ctx.delay(minutes=0.5, msg="There are " + str(beaddry) + " minutes left in the drying step.")
    elute(elution_vol, elution_res)
