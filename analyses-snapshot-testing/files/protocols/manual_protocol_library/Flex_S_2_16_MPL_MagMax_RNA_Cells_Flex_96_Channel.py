def get_values(*names):
    import json

    _all_values = json.loads(
        """{"trash_chute":false,"USE_GRIPPER":true,"dry_run":false,"temp_mod":true,"heater_shaker":true,"tip_mixing":false,"wash_vol":150,"lysis_vol":140,"sample_vol":10,"stop_vol":100,"dnase_vol":50,"elution_vol":50,"protocol_filename":"MagMax_RNA_Cells-Flex_96_Channel"}"""
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
    trash_chute = False  # If false, waste bin loaded in D3, if True, trash chute loaded there
    USE_GRIPPER = True
    dry_run = False
    temp_mod = True
    heater_shaker = True
    tip_mixing = False

    wash_vol = 150
    sample_vol = 10
    dnase_vol = 50
    elution_vol = 50
    lysis_vol = 140
    stop_vol = 100

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
            lysis_vol,
            dnase_vol,
            stop_vol,
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
            "lysis_vol",
            "dnase_vol",
            "stop_vol",
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
        settling_time = 2
    else:
        settling_time = 0.25
    bead_vol = 20
    starting_vol = sample_vol + lysis_vol
    if trash_chute:
        trash = ctx.load_waste_chute()
    else:
        trash = ctx.load_trash_bin("D3")

    if heater_shaker:
        h_s = ctx.load_module("heaterShakerModuleV1", "D1")
        h_s_adapter = h_s.load_adapter("opentrons_96_deep_well_adapter")
        sample_plate = h_s_adapter.load_labware(deepwell_type, "Sample Plate")  # Plate with just beads

        h_s.close_labware_latch()
    else:
        sample_plate = ctx.load_labware(deepwell_type, "D1", "Sample Plate")

    samples_m = sample_plate.wells()[0]

    beads = ctx.define_liquid(name="Beads", description="Magnetic Beads", display_color="#A52A2A")
    for well in sample_plate.wells():
        well.load_liquid(liquid=beads, volume=bead_vol)

    if temp_mod:
        tempdeck = ctx.load_module("Temperature Module Gen2", "A3")
        tempblock = tempdeck.load_adapter("opentrons_96_well_aluminum_block")
        elutionplate = tempblock.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "Elution Plate")
    else:
        elutionplate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "A3", "Elution Plate")

    magblock = ctx.load_module("magneticBlockV1", "C1")
    cell_plate = magblock.load_labware(deepwell_type, "Cell Plate")  # Cell pellets
    cells_m = cell_plate.wells()[0]

    if not dry_run:
        tempdeck.set_temperature(4)

    #'#008000','#A52A2A','#00FFFF','#0000FF','#800080','#ADD8E6','#FF0000','#FFFF00','#FF00FF','#00008B','#7FFFD4','#FFC0CB','#FFA500','#00FF00','#C0C0C0'

    # Defining Liquid Reservoirs and Assigning Colors/ Locations

    lysis_reservoir = ctx.load_labware(deepwell_type, "C2", "Lysis reservoir")
    lysis_res = lysis_reservoir.wells()[0]
    lysis_buffer = ctx.define_liquid(name="Lysis Buffer", description="Lysis Buffer", display_color="#008000")
    for well in lysis_reservoir.wells():
        well.load_liquid(liquid=lysis_buffer, volume=lysis_vol + 100)

    wash1_reservoir = ctx.load_labware(deepwell_type, "C3", "Wash 1 reservoir")
    wash1 = wash1_reservoir.wells()[0]
    wash1_buffer = ctx.define_liquid(name="Wash 1 Buffer", description="Wash 1 Buffer", display_color="#00008B")
    for well in wash1_reservoir.wells():
        well.load_liquid(liquid=wash1_buffer, volume=wash_vol + 100)

    wash2_res = ctx.load_labware(deepwell_type, "B3", "Washes 2-4 reservoir")
    wash2 = wash3 = wash4 = wash2_res.wells()[0]
    wash2_buffer = ctx.define_liquid(name="Washes 2-4 Buffer", description="Washes 2-4 Buffer", display_color="#00FFFF")
    for well in wash2_res.wells():
        well.load_liquid(liquid=wash2_buffer, volume=(3 * wash_vol) + 100)

    wash5_plate = ctx.load_labware(deepwell_type, "D2", "Washes 5 reservoir")
    wash5 = wash5_plate.wells()[0]
    wash5_buffer = ctx.define_liquid(name="Wash 5 Buffer", description="Wash 5 Buffer", display_color="#0000FF")
    for well in wash5_plate.wells():
        well.load_liquid(liquid=wash5_buffer, volume=wash_vol + 100)

    dnase_reservoir = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "B1", "DNAse Reservoir")
    dnase_res = dnase_reservoir.wells()[0]
    dnase_buffer = ctx.define_liquid(name="DNAseI Buffer", description="DNAseI Buffer", display_color="#800080")
    for well in dnase_reservoir.wells():
        well.load_liquid(liquid=dnase_buffer, volume=dnase_vol + 3)

    stop_reservoir = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "B2", "Stop Reservoir")
    stop_res = stop_reservoir.wells()[0]
    stop_buffer = ctx.define_liquid(name="Stop Buffer", description="Stop Buffer", display_color="#ADD8E6")
    for well in stop_reservoir.wells():
        well.load_liquid(liquid=stop_buffer, volume=stop_vol + 10)

    elution_res = elutionplate.wells()[0]
    elution_buffer = ctx.define_liquid(name="Elution Buffer", description="Elution Buffer", display_color="#FF00FF")
    for well in elutionplate.wells():
        well.load_liquid(liquid=elution_buffer, volume=elution_vol + 5)

    # Load tips
    tips = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "A1", adapter="opentrons_flex_96_tiprack_adapter").wells()[0]
    tips1 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "A2", adapter="opentrons_flex_96_tiprack_adapter").wells()[0]

    # load 96 channel pipette
    pip = ctx.load_instrument("flex_96channel_1000", mount="left")

    pip.flow_rate.aspirate = 50
    pip.flow_rate.dispense = 150
    pip.flow_rate.blow_out = 300

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

    def mixing(well, mvol, reps=8):
        """
        'mixing' will mix liquid that contains beads. This will be done by
        aspirating from the bottom of the well and dispensing from the top as to
        mix the beads with the other liquids as much as possible. Aspiration and
        dispensing will also be reversed for a short to to ensure maximal mixing.
        param well: The current well that the mixing will occur in.
        param pip: The pipet that is currently attached/ being used.
        param mvol: The volume that is transferred before the mixing steps.
        param reps: The number of mix repetitions that should occur. Note~
        During each mix rep, there are 2 cycles of aspirating from bottom,
        dispensing at the top and 2 cycles of aspirating from middle,
        dispensing at the bottom
        """
        center = well.top(5)
        asp = well.bottom(1.5)
        disp = well.bottom(20)

        if mvol > 1000:
            mvol = 1000

        vol = mvol * 0.9

        pip.flow_rate.aspirate = 500
        pip.flow_rate.dispense = 500

        pip.move_to(center)
        for _ in range(reps):
            pip.aspirate(vol, asp)
            pip.dispense(vol, disp)
            pip.aspirate(vol, asp)
            pip.dispense(vol, disp)
            if _ == reps - 1:
                pip.flow_rate.aspirate = 100
                pip.flow_rate.dispense = 50
                pip.aspirate(vol, asp)
                pip.dispense(vol, asp)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300

    def lysis(vol, source):
        ctx.comment("--------Beginning Lysis--------")
        pip.pick_up_tip(tips)
        pip.flow_rate.aspirate = 80
        pip.aspirate(vol, source)
        pip.dispense(vol, cells_m)
        pip.flow_rate.aspirate = 300
        mixing(cells_m, vol, reps=12 if not dry_run else 1)

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
        ctx.comment("--------Beginning Bind Transfer--------")
        # Transfer cells+lysis/bind to wells with beads
        pip.aspirate(175, cells_m)
        pip.air_gap(10)
        pip.dispense(185, samples_m)
        bead_mix(140, samples_m, reps=5 if not dry_run else 1)
        pip.air_gap(10)
        if not tip_mixing:
            pip.return_tip()

        # Incubate for beads to bind DNA
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=2000)

            # Move empty cell plate off deck
            ctx.move_labware(cell_plate, "C4" if USE_GRIPPER else protocol_api.OFF_DECK, use_gripper=False)

            ctx.delay(minutes=4.5 if not dry_run else 0.25, msg="Please wait 5 minutes while the sample binds with the beads.")
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            bead_mix(140, samples_m, reps=13)
            pip.return_tip()

            # Move empty cell plate off deck
            ctx.move_labware(cell_plate, "C4" if USE_GRIPPER else protocol_api.OFF_DECK, use_gripper=False)

        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker for 5 minutes at 2000 rpm.")
            # Move empty cell plate off deck
            ctx.move_labware(cell_plate, "C4" if USE_GRIPPER else protocol_api.OFF_DECK, use_gripper=False)

        # Transfer plate to magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        for bindi in np.arange(settling_time + 2 if not dry_run else settling_time, 0, -0.5):  # Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg="There are " + str(bindi) + " minutes left in the incubation.")

        # remove initial supernatant
        remove_supernatant(175, lysis_res)

    def wash(vol, source, waste):

        global whichwash  # Defines which wash the protocol is on to log on the app

        ctx.comment("--------Beginning Wash #" + str(whichwash) + "--------")

        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        ctx.delay(seconds=1)
        pip.blow_out(samples_m.top(-3))
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            ctx.delay(minutes=5 if not dry_run else 0.25, msg="Please allow 5 minutes for wash to mix on heater-shaker.")
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            bead_mix(vol, samples_m, reps=13)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker for 5 minutes at 2000 rpm.")

        # Transfer plate to magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        for washi in np.arange(settling_time, 0, -0.5):  # settling time timer for washes
            ctx.delay(minutes=0.5, msg="There are " + str(washi) + " minutes left in wash " + str(whichwash) + " incubation.")

        remove_supernatant(vol, lysis_res)

        whichwash = whichwash + 1

    def dnase(vol, source):
        ctx.comment("--------Beginning DNAseI Step--------")
        pip.flow_rate.aspirate = 20
        pip.flow_rate.dispense = 50

        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        resuspend_pellet(45, samples_m, reps=4 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=2000)
            ctx.delay(minutes=10 if not dry_run else 0.25, msg="Please wait 10 minutes while the dnase incubates.")
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            for x in range(2):
                bead_mix(vol, samples_m, reps=10)
                ctx.delay(minutes=2)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker at 2000 rpm for 10 minutes.")

        pip.flow_rate.aspirate = 50
        pip.flow_rate.dispense = 150

    def stop_reaction(vol, source):
        ctx.comment("--------Beginning Stop Reaction--------")

        pip.pick_up_tip(tips)
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        mixing(samples_m, vol, reps=2 if not dry_run else 1)
        pip.blow_out(samples_m.top(-3))
        pip.air_gap(10)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=2200)
            ctx.delay(minutes=3 if not dry_run else 0.25, msg="Please wait 3 minutes while the stop solution inactivates the dnase.")
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            bead_mix(vol, samples_m, reps=10)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker for 3 minutes at 2200 rpm.")

        # Transfer plate to magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        for stop in np.arange(settling_time + 2, 0, -0.5):
            ctx.delay(minutes=0.5, msg="There are " + str(stop) + " minutes left in this incubation.")

        remove_supernatant(vol + dnase_vol, lysis_res)

    def elute(vol, source):
        ctx.comment("--------Beginning Elution--------")
        pip.pick_up_tip(tips1)
        # Transfer
        pip.aspirate(vol, source)
        pip.dispense(vol, samples_m)
        # Mix
        for r in range(10 if not dry_run else 1):
            pip.aspirate(40, samples_m.bottom(1.5))
            pip.dispense(40, samples_m.bottom(5))
            if r == 9:
                pip.flow_rate.dispense = 20
                pip.aspirate(40, samples_m)
                pip.dispense(40, samples_m.bottom(5))
                pip.flow_rate.dispense = 300
        if not tip_mixing:
            pip.return_tip()

        # Elution Incubation
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=2000)
            ctx.delay(minutes=3 if not dry_run else 0.25, msg="Please allow 3 minutes for elution buffer to elute RNA from beads.")
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            bead_mix(vol, samples_m, reps=10)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg="Place on shaker for 3 minutes at 2000 rpm.")

        # Transfer plate to magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        for elutei in np.arange(settling_time + 2, 0, -0.5):
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
    # Start Protocol
    lysis(lysis_vol, lysis_res)
    bind()
    wash(wash_vol, wash1, lysis_res)
    if not dry_run:
        wash(wash_vol, wash2, lysis_res)
    # dnase1 treatment
    dnase(dnase_vol, dnase_res)
    stop_reaction(stop_vol, stop_res)
    # Resume washes
    if not dry_run:
        wash(wash_vol, wash3, lysis_res)
        wash(wash_vol, wash4, lysis_res)
        wash(wash_vol, wash5, lysis_res)
    drybeads = 2 if not dry_run else 0.5  # Number of minutes you want to dry for
    for beaddry in np.arange(drybeads, 0, -0.5):
        ctx.delay(minutes=0.5, msg="There are " + str(beaddry) + " minutes left in the drying step.")
    elute(elution_vol, elution_res)
