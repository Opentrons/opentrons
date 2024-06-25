def get_values(*names):
    import json

    _all_values = json.loads(
        """{"trash_chute":false,"USE_GRIPPER":true,"dry_run":false,"mount":"left","temp_mod":true,"heater_shaker":true,"res_type":"nest_12_reservoir_15ml","num_samples":8,"wash1_vol":600,"wash2_vol":600,"wash3_vol":600,"AL_vol":230,"sample_vol":180,"bind_vol":320,"elution_vol":100,"protocol_filename":"Omega_HDQ_DNA_Cells-Flex_multi"}"""
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

"""
Here is where you can modify the magnetic module engage height:
"""
whichwash = 1
sample_max = 48
tip1k = 0
drop_count = 0
waste_vol = 0


# Start protocol
def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    trash_chute = False  # If this is true, trash chute is loaded in D3, otherwise trash bin is loaded there
    USE_GRIPPER = True
    dry_run = False
    mount = "left"
    res_type = "nest_12_reservoir_22ml"
    temp_mod = True  # True or false if you have a temp mod loaded on deck with the elution plate
    heater_shaker = True

    num_samples = 48
    wash1_vol = 600
    wash2_vol = 600
    wash3_vol = 600
    AL_vol = 230
    sample_vol = 180
    bind_vol = 320
    elution_vol = 100

    try:
        [
            res_type,
            temp_mod,
            trash_chute,
            USE_GRIPPER,
            dry_run,
            mount,
            num_samples,
            heater_shaker,
            wash1_vol,
            wash2_vol,
            wash3_vol,
            AL_vol,
            sample_vol,
            bind_vol,
            elution_vol,
        ] = get_values(  # noqa: F821
            "res_type",
            "temp_mod",
            "trash_chute",
            "USE_GRIPPER",
            "dry_run",
            "mount",
            "num_samples",
            "heater_shaker",
            "wash1_vol",
            "wash2_vol",
            "wash3_vol",
            "AL_vol",
            "sample_vol",
            "bind_vol",
            "elution_vol",
        )

    except NameError:
        pass

    # Protocol Parameters
    deepwell_type = "nest_96_wellplate_2ml_deep"
    res_type = "nest_12_reservoir_15ml"
    if not dry_run:
        settling_time = 2
    else:
        settling_time = 0.25
    PK_vol = bead_vol = 20
    AL_total_vol = AL_vol + PK_vol
    starting_vol = AL_vol + sample_vol
    binding_buffer_vol = bind_vol + bead_vol
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

    if temp_mod:
        temp = ctx.load_module("temperature module gen2", "A3")
        temp_block = temp.load_adapter("opentrons_96_well_aluminum_block")
        elutionplate = temp_block.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "Elution Plate")
    else:
        elutionplate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "A3", "Elution Plate")

    magnetic_block = ctx.load_module("magneticBlockV1", "C1")
    waste = ctx.load_labware("nest_1_reservoir_195ml", "B3", "Liquid Waste").wells()[0].top()
    res1 = ctx.load_labware(res_type, "D2", "reagent reservoir 1")
    num_cols = math.ceil(num_samples / 8)

    # Load tips and combine all similar boxes
    tips1000 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A1", "Tips 1")
    tips1001 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A2", "Tips 2")
    tips1002 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "B1", "Tips 3")
    tips = [*tips1000.wells()[8 * (num_cols) : 96], *tips1001.wells(), *tips1002.wells()]
    tips_sn = tips1000.wells()[: 8 * (num_cols)]

    # load instruments
    m1000 = ctx.load_instrument("flex_8channel_1000", mount)

    """
    Here is where you can define the locations of your reagents.
    """
    binding_buffer = res1.wells()[:2]
    AL = res1.wells()[2]
    wash1 = res1.wells()[3:6]
    wash2 = res1.wells()[6:9]
    wash3 = res1.wells()[9:]

    samples_m = sample_plate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]

    colors = [
        "#008000",
        "#008000",
        "#A52A2A",
        "#A52A2A",
        "#00FFFF",
        "#0000FF",
        "#800080",
        "#ADD8E6",
        "#FF0000",
        "#FFFF00",
        "#FF00FF",
        "#00008B",
        "#7FFFD4",
        "#FFC0CB",
        "#FFA500",
        "#00FF00",
        "#C0C0C0",
    ]

    # Begin with assigning plate wells before reservoir wells
    samps = ctx.define_liquid(name="Samples", description="Samples", display_color="#00FF00")
    elution_samps = ctx.define_liquid(name="Elution Buffer", description="Elution Buffer", display_color="#FFA500")

    for well in sample_plate.wells()[:num_samples]:
        well.load_liquid(liquid=samps, volume=sample_vol)

    for well in elutionplate.wells()[:num_samples]:
        well.load_liquid(liquid=elution_samps, volume=elution_vol)

    # Start defining reservoir wells
    locations = [AL, AL, binding_buffer, binding_buffer, wash1, wash2, wash3]
    vols = [AL_vol, PK_vol, bead_vol, bind_vol, wash1_vol, wash2_vol, wash3_vol]
    liquids = ["AL Lysis", "PK", "Beads", "Binding", "Wash 1", "Wash 2", "Wash 3"]

    delete = len(colors) - len(liquids)

    if delete >= 1:
        for i in range(delete):
            colors.pop(-1)

    def liquids_(liq, location, color, vol):
        sampnum = 8 * (math.ceil(num_samples / 8))
        """
        Takes an individual liquid at a time and adds the color to the well
        in the description.
        """
        # Volume Calculation
        if liq == "PK":
            extra_samples = math.ceil(1500 / AL_vol)

        elif liq == "Beads":
            extra_samples = math.ceil(1500 / bind_vol)

        else:
            extra_samples = math.ceil(1500 / vol)

        # Defining and assigning liquids to wells
        if isinstance(location, list):
            limit = sample_max / len(location)  # Calculates samples/ res well
            iterations = math.ceil(sampnum / limit)
            left = sampnum - limit
            while left > limit:
                left = left - limit
            if left > 0:
                last_iteration_samp_num = left
            elif left < 0:
                last_iteration_samp_num = sampnum
            else:
                last_iteration_samp_num = limit

            samples_per_well = []

            for i in range(iterations):
                # append the left over on the last iteration
                if i == (iterations - 1):
                    samples_per_well.append(last_iteration_samp_num)
                else:
                    samples_per_well.append(limit)

            liq = ctx.define_liquid(name=str(liq), description=str(liq), display_color=color)
            for sample, well in zip(samples_per_well, location[: len(samples_per_well)]):
                v = vol * (sample + extra_samples)
                well.load_liquid(liquid=liq, volume=v)
        else:
            v = vol * (sampnum + extra_samples)
            liq = ctx.define_liquid(name=str(liq), description=str(liq), display_color=color)
            location.load_liquid(liquid=liq, volume=v)

    for x, (ll, l, c, v) in enumerate(zip(liquids, locations, colors, vols)):
        liquids_(ll, l, c, v)

    m1000.flow_rate.aspirate = 300
    m1000.flow_rate.dispense = 300
    m1000.flow_rate.blow_out = 300

    def tiptrack(pip, tipbox):
        global tip1k
        global tip200
        global drop_count
        if tipbox == tips:
            m1000.pick_up_tip(tipbox[int(tip1k)])
            tip1k = tip1k + 8
        drop_count = drop_count + 8
        if drop_count >= 150:
            drop_count = 0
            ctx.pause("Please empty the waste bin of all the tips before continuing.")

    def blink():
        for i in range(3):
            ctx.set_rail_lights(True)
            ctx.delay(minutes=0.01666667)
            ctx.set_rail_lights(False)
            ctx.delay(minutes=0.01666667)

    def remove_supernatant(vol):
        ctx.comment("-----Removing Supernatant-----")
        m1000.flow_rate.aspirate = 150
        num_trans = math.ceil(vol / 980)
        vol_per_trans = vol / num_trans

        def _waste_track(vol):
            global waste_vol
            waste_vol = waste_vol + (vol * 8)
            if waste_vol >= 185000:
                m1000.home()
                blink()
                ctx.pause("Please empty liquid waste before resuming.")
                waste_vol = 0

        for i, m in enumerate(samples_m):
            m1000.pick_up_tip(tips_sn[8 * i])
            loc = m.bottom(0.5)
            for _ in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, m.top())
                m1000.move_to(m.center())
                m1000.transfer(vol_per_trans, loc, waste, new_tip="never", air_gap=20)
                m1000.blow_out(waste)
                m1000.air_gap(20)
            m1000.drop_tip(tips_sn[8 * i])
        m1000.flow_rate.aspirate = 300

        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

    def bead_mixing(well, pip, mvol, reps=8):
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
        center = well.top().move(types.Point(x=0, y=0, z=5))
        aspbot = well.bottom().move(types.Point(x=0, y=2, z=1))
        asptop = well.bottom().move(types.Point(x=0, y=-2, z=2.5))
        disbot = well.bottom().move(types.Point(x=0, y=1.5, z=3))
        distop = well.top().move(types.Point(x=0, y=1.5, z=0))

        if mvol > 1000:
            mvol = 1000

        vol = mvol * 0.9

        pip.flow_rate.aspirate = 500
        pip.flow_rate.dispense = 500

        pip.move_to(center)
        for _ in range(reps):
            pip.aspirate(vol, aspbot)
            pip.dispense(vol, distop)
            pip.aspirate(vol, asptop)
            pip.dispense(vol, disbot)
            if _ == reps - 1:
                pip.flow_rate.aspirate = 150
                pip.flow_rate.dispense = 100
                pip.aspirate(vol, aspbot)
                pip.dispense(vol, aspbot)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300

    def mixing(well, pip, mvol, reps=8):
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
        asp = well.bottom(1)
        disp = well.top(-8)

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
                pip.flow_rate.aspirate = 150
                pip.flow_rate.dispense = 100
                pip.aspirate(vol, asp)
                pip.dispense(vol, asp)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300

    def A_lysis(vol, source):
        ctx.comment("-----Mixing then transferring AL buffer-----")
        num_transfers = math.ceil(vol / 980)
        tiptrack(m1000, tips)
        for i in range(num_cols):
            if num_cols >= 5:
                if i == 0:
                    height = 10
                else:
                    height = 1
            else:
                height = 1
            src = source
            tvol = vol / num_transfers
            for t in range(num_transfers):
                if i == 0 and t == 0:
                    for _ in range(3):
                        m1000.aspirate(tvol, src.bottom(1))
                        m1000.dispense(tvol, src.bottom(4))
                m1000.aspirate(tvol, src.bottom(height))
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume, samples_m[i].top())
                m1000.air_gap(20)

        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000, tips)
            mixing(samples_m[i], m1000, tvol - 40, reps=10 if not dry_run else 1)  # vol is 250 AL + 180 sample
            m1000.air_gap(20)
            m1000.drop_tip() if not dry_run else m1000.return_tip()

        ctx.comment("-----Mixing then Heating AL and Sample-----")
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            ctx.delay(minutes=15 if not dry_run else 0.25, msg="Shake at 2000 rpm for 5 minutes.")
            if not dry_run:
                h_s.set_and_wait_for_temperature(55)
            ctx.delay(minutes=10 if not dry_run else 0.25, msg="Incubating at 55C 2000 rpm for 10 minutes.")
            h_s.deactivate_shaker()
        else:
            if not dry_run:
                ctx.pause(
                    msg="Place on shaker for 15 minutes at 2000 rpm. Then increase temperature to 55C and continue shaking for 10 minutes."
                )

        # ctx.pause("Add 5ul RNAse per sample now. Mix and incubate at RT for 2 minutes")

    def bind(vol):
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
        ctx.comment("-----Beginning Bind Steps-----")
        tiptrack(m1000, tips)
        for i, well in enumerate(samples_m):
            num_trans = math.ceil(vol / 980)
            vol_per_trans = vol / num_trans
            source = binding_buffer[i // 3]
            if i == 0:
                reps = 6 if not dry_run else 1
            else:
                reps = 1
            ctx.comment("-----Mixing Beads in Reservoir-----")
            bead_mixing(source, m1000, vol_per_trans, reps=reps if not dry_run else 1)
            # Transfer beads and binding from source to H-S plate
            for t in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, source.top())
                m1000.transfer(vol_per_trans, source, well.top(), air_gap=20, new_tip="never")
                if t < num_trans - 1:
                    m1000.air_gap(20)

        ctx.comment("-----Mixing Beads in Plate-----")
        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000, tips)
            mixing(samples_m[i], m1000, vol + starting_vol, reps=10 if not dry_run else 1)
            m1000.drop_tip() if not dry_run else m1000.return_tip()

        ctx.comment("-----Incubating Beads and Bind on H-S-----")
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1800)
            ctx.delay(minutes=10 if not dry_run else 0.25, msg="Shake at 1800 rpm for 10 minutes.")
            h_s.deactivate_shaker()
        else:
            if not dry_run:
                ctx.pause(msg="Place on shaker for 10 minutes at 1800 rpm.")

        # Transfer from H-S plate to Magdeck plate
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magnetic_block, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        for bindi in np.arange(settling_time + 1, 0, -0.5):  # Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg="There are " + str(bindi) + " minutes left in the incubation.")

        # remove initial supernatant
        remove_supernatant(vol + starting_vol)

    def wash(vol, source):

        global whichwash  # Defines which wash the protocol is on to log on the app

        if source == wash1:
            whichwash = 1
        if source == wash2:
            whichwash = 2
        if source == wash3:
            whichwash = 3

        ctx.comment("-----Beginning Wash #" + str(whichwash) + "-----")

        num_trans = math.ceil(vol / 980)
        vol_per_trans = vol / num_trans
        tiptrack(m1000, tips)
        for i, m in enumerate(samples_m):
            src = source[i // 2]
            for n in range(num_trans):
                if m1000.current_volume > 0:
                    m1000.dispense(m1000.current_volume, src.top())
                m1000.transfer(vol_per_trans, src, m.top(), air_gap=20, new_tip="never")
        m1000.drop_tip() if not dry_run else m1000.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            ctx.delay(minutes=5 if not dry_run else 0.25)
            h_s.deactivate_shaker()
        else:
            if not dry_run:
                ctx.pause(msg="Place on shaker for 5 minutes at 2000 rpm.")

        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magnetic_block, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        for washi in np.arange(settling_time, 0, -0.5):  # settling time timer for washes
            ctx.delay(minutes=0.5, msg="There are " + str(washi) + " minutes left in wash " + str(whichwash) + " incubation.")

        remove_supernatant(vol)

    def elute(vol):
        ctx.comment("-----Beginning Elution Steps-----")
        tiptrack(m1000, tips)
        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            m1000.flow_rate.aspirate = 25
            m1000.aspirate(vol, e.bottom(0.5))
            m1000.air_gap(20)
            m1000.dispense(m1000.current_volume, m.top())
        m1000.flow_rate.aspirate = 150
        m1000.drop_tip() if not dry_run else m1000.return_tip()

        """
        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000, tips)
            for x in range(4 if not dry_run else 1):
                m1000.aspirate(elution_vol*.9,m.bottom(1))
                m1000.dispense(m1000.current_volume,m.bottom(20))
                if i == 3:
                    m1000.flow_rate.aspirate = 50
                    m1000.flow_rate.dispense = 20
                    m1000.aspirate(elution_vol*.9,m.bottom(1))
                    m1000.dispense(m1000.current_volume,m.bottom(1))
                    m1000.flow_rate.aspirate = 300
                    m1000.flow_rate.dispense = 300   
            m1000.drop_tip() if not dry_run else m1000.return_tip()
        """
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2200)
            ctx.delay(minutes=5 if not dry_run else 0.25, msg="Shake on H-S for 5 minutes at 2000 rpm.")
            h_s.deactivate_shaker()
        else:
            if not dry_run:
                ctx.pause(msg="Place on shaker at 2200 rpm for 5 minutes.")

        # Transfer back to magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magnetic_block, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        for elutei in np.arange(settling_time, 0, -0.5):
            ctx.delay(minutes=0.5, msg="Incubating on MagDeck for " + str(elutei) + " more minutes.")

        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            tiptrack(m1000, tips)
            m1000.flow_rate.dispense = 100
            m1000.flow_rate.aspirate = 150
            m1000.transfer(vol, m.bottom(0.15), e.bottom(5), air_gap=20, new_tip="never")
            m1000.blow_out(e.top(-2))
            m1000.air_gap(20)
            m1000.drop_tip() if not dry_run else m1000.return_tip()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    A_lysis(AL_total_vol, AL)
    bind(binding_buffer_vol)
    wash(wash1_vol, wash1)

    if not dry_run:
        drybeads = 10  # Number of minutes you want to dry for
        wash(wash2_vol, wash2)
        wash(wash3_vol, wash3)
    else:
        drybeads = 0.5
    for beaddry in np.arange(drybeads, 0, -0.5):
        ctx.delay(minutes=0.5, msg="There are " + str(beaddry) + " minutes left in the drying step.")
    elute(elution_vol)
