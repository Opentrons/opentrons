def get_values(*names):
    import json

    _all_values = json.loads(
        """{"num_samp":8,"real_mode":true,"m50_mount":"left","m200_mount":"right","protocol_filename":"sigdx-part2"}"""
    )
    return [_all_values[n] for n in names]


# flake8: noqa
import math

from opentrons import protocol_api
from opentrons import types
import random
import math

metadata = {
    "ctx.Name": "Twist Targeted Methylation Sequencing Protocol",
    "author": "Rami Farawi <rami.farawi@opentrons.com",
}
requirements = {"robotType": "OT-3", "apiLevel": "2.17"}


def run(ctx: protocol_api.ProtocolContext):

    # real_mode = False
    bead_mode = True

    # m50_mount = 'left'
    # m200_mount = 'right'
    # num_samp = 16

    [num_samp, real_mode, m50_mount, m200_mount] = get_values("num_samp", "real_mode", "m50_mount", "m200_mount")  # noqa: F821

    num_col = math.ceil(num_samp / 8)

    # index_plate = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt',  protocol_api.OFF_DECK)

    # TEMPERATURE MODULES
    wash_temp_mod = ctx.load_module("temperature module gen2", 1)
    wash_plate = wash_temp_mod.load_labware("nest_96_wellplate_2ml_deep")

    sample_temp_mod = ctx.load_module("temperature module gen2", 4)
    # sample_temp_adapter = sample_temp_mod.load_adapter('nest_96_wellplate_2ml_deep')

    if real_mode:
        wash_temp_mod.set_temperature(63)
    if real_mode:
        sample_temp_mod.set_temperature(63)

    # MAGNETIC MODULE
    mag_block = ctx.load_module("magneticBlockV1", 6)

    # DECK LABWARE
    reag_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", 8)
    deep_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", 5)
    sample_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", 2)

    reag_temp_adapter = ctx.load_adapter("opentrons_96_well_aluminum_block", 11)
    temp_reag_plate = reag_temp_adapter.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")

    deck_slots_50 = ["A1", "B1"]
    deck_slots_200 = ["A3", "B3"]
    tiprack_50 = [ctx.load_labware("opentrons_flex_96_tiprack_50ul", slot) for slot in deck_slots_50]
    tiprack_200 = [ctx.load_labware("opentrons_flex_96_tiprack_200ul", slot) for slot in deck_slots_200]

    # WASTE CHUTE + STAGING SLOTS
    staging_slots = ["A4", "B4", "C4", "D4"]
    staging_racks_50 = [ctx.load_labware("opentrons_flex_96_tiprack_50ul", slot) for slot in staging_slots[:2]]
    staging_slots_50 = ["A4", "B4"]
    staging_racks_200 = [ctx.load_labware("opentrons_flex_96_tiprack_200ul", slot) for slot in staging_slots[2:]]
    staging_slots_200 = ["C4", "D4"]
    chute = ctx.load_waste_chute()

    # LOAD PIPETTES
    m50 = ctx.load_instrument("flex_8channel_50", m50_mount, tip_racks=tiprack_50)
    m200 = ctx.load_instrument("flex_8channel_1000", m200_mount, tip_racks=tiprack_200)

    count_50 = 0
    count_200 = 0

    def pick_up(pip):
        nonlocal tiprack_50
        nonlocal tiprack_200
        nonlocal staging_racks_50
        nonlocal staging_racks_200
        nonlocal deck_slots_50
        nonlocal deck_slots_200
        nonlocal count_50
        nonlocal count_200
        nonlocal staging_slots_50
        nonlocal staging_slots_200

        tipracks = tiprack_50 if pip == m50 else tiprack_200
        staging_racks = staging_racks_50 if pip == m50 else staging_racks_200
        deck_slots = deck_slots_50 if pip == m50 else deck_slots_200
        staging_slots_inner = staging_slots_50 if pip == m50 else staging_slots_200
        staging_slots = staging_slots_50 if pip == m50 else staging_slots_200
        count = count_50 if pip == m50 else count_200

        try:
            # pip.tip_racks = tipracks
            pip.pick_up_tip()

        except protocol_api.labware.OutOfTipsError:
            if count == 0:

                pip.tip_racks = tipracks

                # move all tipracks to chute
                for slot in deck_slots:
                    ctx.move_labware(labware=ctx.deck[slot], new_location=chute, use_gripper=True)

                # check to see if we have tipracks in staging slots
                # for i, (new_rack, replace_slot) in enumerate(zip(staging_racks, deck_slots)):

                for s_slot, d_slot in zip(staging_slots_inner, deck_slots):

                    ctx.move_labware(labware=ctx.deck[s_slot], new_location=d_slot, use_gripper=True)

                tipracks = staging_racks
                pip.tip_racks = [ctx.deck[slot] for slot in deck_slots]
                pip.reset_tipracks()
                pip.pick_up_tip()
                if pip == m50:
                    count_50 += 1
                else:
                    count_200 += 1

            # if not tipracks in staging slot (second iteration), replenish
            else:
                # if loop == 17: raise Exception(f"pip is {pip}, deck_slots is {deck_slots}, staging_slots is {staging_slots}")
                for slot in deck_slots:
                    del ctx.deck[slot]
                for slot in staging_slots:
                    del ctx.deck[slot]

                tipracks = [
                    ctx.load_labware("opentrons_flex_96_tiprack_50ul" if pip == m50 else "opentrons_flex_96_tiprack_200ul", slot)
                    for slot in deck_slots
                ]
                staging_racks = [
                    ctx.load_labware("opentrons_flex_96_tiprack_50ul" if pip == m50 else "opentrons_flex_96_tiprack_200ul", slot)
                    for slot in staging_slots
                ]
                ctx.pause("Replace tip racks on deck and on expansion slots")
                pip.reset_tipracks()
                pip.tip_racks = tipracks
                pick_up(pip)
                # for slot in staging_slots:
                #     print(ctx.deck[slot])
                if pip == m50:
                    count_50 = 0
                else:
                    count_200 = 0

    def slow_tip_withdrawal(pipette, well):
        factor_slow = 40
        pipette.default_speed /= factor_slow
        pipette.move_to(well.top(-3))
        pipette.default_speed *= factor_slow

    def dispose_waste(vol, pip, use_trash=False):

        pip.dispense(vol, chute)

    def remove_super(pip, vol, list_of_samples, round, pcr=False, ethanol=False):

        if round == 3:

            for col in list_of_samples:
                pick_up(pip)
                pip.aspirate(vol - 30, col, rate=0.05 if pip == m200 else 0.2)
                ctx.delay(seconds=2)
                pip.aspirate(30, col.bottom(z=0.6))
                dispose_waste(vol, pip)
                pip.drop_tip() if real_mode else pip.return_tip()

        if ethanol:

            if round == 0:

                if pcr:

                    for col in list_of_samples:
                        pick_up(pip)
                        pip.aspirate(vol / 2, col.bottom(z=5))
                        ctx.delay(seconds=2)
                        pip.aspirate(vol / 2, col.bottom(z=0.6))
                        dispose_waste(vol, pip)
                        pip.drop_tip() if real_mode else pip.return_tip()

                else:

                    for col in list_of_samples:
                        pick_up(pip)
                        pip.aspirate(vol - 30, col, rate=0.05)
                        ctx.delay(seconds=2)
                        pip.aspirate(30, col.bottom(z=0.6), rate=0.05)
                        dispose_waste(vol, pip)
                        pip.drop_tip() if real_mode else pip.return_tip()

            elif round == 1:

                if pcr:
                    for col in list_of_samples:
                        pick_up(pip)
                        pick_up(m50)
                        pip.aspirate(vol / 2, col.bottom(z=5))
                        ctx.delay(seconds=2)
                        pip.aspirate(vol / 2, col.bottom(z=0.6))
                        dispose_waste(vol, pip)
                        pip.drop_tip() if real_mode else pip.return_tip()
                        m50.aspirate(20, col, rate=0.05)
                        m50.aspirate(20, col.bottom(z=0.6), rate=0.2)
                        m50.aspirate(10, col.bottom(z=0.40), rate=0.2)
                        m50.move_to(col.bottom(z=0.8))
                        dispose_waste(50, m50)
                        m50.drop_tip() if real_mode else m50.return_tip()
                else:
                    for col in list_of_samples:
                        pick_up(pip)
                        pick_up(m50)
                        pip.aspirate(vol - 20, col, rate=0.2)
                        ctx.delay(seconds=2)
                        pip.aspirate(20, col.bottom(z=0.6), rate=0.2)
                        dispose_waste(vol, pip)
                        pip.drop_tip() if real_mode else pip.return_tip()
                        m50.aspirate(20, col, rate=0.05)
                        m50.aspirate(20, col.bottom(z=0.6), rate=0.2)
                        m50.aspirate(10, col.bottom(z=0.40), rate=0.2)
                        m50.move_to(col.bottom(z=0.8))
                        dispose_waste(50, m50)
                        m50.drop_tip() if real_mode else m50.return_tip()

    def adding_beads(bead_vol, list_of_s, mix_vol, which_beads, premix=False, mix_with_beads=False):

        if premix:
            pick_up(m200)
            m200.aspirate(10, which_beads.top())
            m200.mix(20, 190, which_beads, rate=0.25)
            slow_tip_withdrawal(m200, which_beads)
            m200.dispense(10, which_beads.bottom(z=20))
            m200.blow_out(which_beads.bottom(z=20))
            m200.touch_tip(radius=0.8)
            # m200.drop_tip() if real_mode else m200.return_tip()

        for d in list_of_s:
            if not m200.has_tip:
                pick_up(m200)
            m200.aspirate(bead_vol, which_beads, rate=0.25)
            slow_tip_withdrawal(m200, which_beads)
            m200.dispense(bead_vol, d)
            if mix_with_beads:
                m200.mix(15, mix_vol, d, rate=0.3)
            slow_tip_withdrawal(m200, d)
            ctx.delay(seconds=3)
            m200.blow_out(d.top(z=-1))
            m200.touch_tip(radius=0.8)
            m200.drop_tip() if real_mode else m200.return_tip()

    ethanol_ctr = 0
    ethanol_well_ctr = 0

    def aspirate_ethanol(vol, pip):
        nonlocal ethanol_well_ctr
        nonlocal ethanol_ctr

        pip.aspirate(ethanol_vol, ethanol[ethanol_well_ctr], rate=0.5)
        slow_tip_withdrawal(pip, ethanol[ethanol_well_ctr])
        ethanol_ctr += vol * 8
        if ethanol_ctr >= 8000:
            ethanol_well_ctr += 1
            ethanol_ctr = 0

    def add_reagent(vol, reagent, mix_vol, sample_list, overflow=False, mix=True):

        if not overflow:
            for d in sample_list:
                pick_up(m50)
                m50.aspirate(vol, reagent)
                m50.dispense(vol, d)
                if mix:
                    m50.mix(10 if real_mode else 1, mix_vol, d)
                m50.move_to(d.top())
                ctx.delay(seconds=1)
                m50.blow_out(d.top(-3))
                m50.drop_tip() if real_mode else m50.return_tip()

    def adding_eb(eb_vol, eb_well, list_to_go, eb_mix_vol, first_eb=False):
        if first_eb:
            half_of_the_columns = math.floor(num_col / 2)
            for i, d in enumerate(list_to_go):
                pick_up(m50)
                m50.aspirate(10, eb_well.top())
                m50.aspirate(eb_vol, eb_well.bottom(z=3 if i < half_of_the_columns else 1))
                m50.dispense(eb_vol, d)
                m50.mix(15, eb_mix_vol, d.bottom(z=1), rate=1.2)
                m50.dispense(10, d.bottom(z=5))
                ctx.delay(seconds=2)
                m50.blow_out()
                m50.drop_tip() if real_mode else m50.return_tip()
        else:
            for d in list_to_go:
                pick_up(m50)
                m50.aspirate(10, eb_well.top())
                m50.aspirate(eb_vol, eb_well)
                m50.dispense(eb_vol, d)
                m50.mix(15, eb_mix_vol, d.bottom(z=1), rate=1.2)
                m50.dispense(10, d.top(z=5))
                ctx.delay(seconds=2)
                m50.blow_out()
                m50.drop_tip() if real_mode else m50.return_tip()

    def pause(msg):
        ctx.comment("\n")
        ctx.pause(msg)
        ctx.comment("\n")

    ##########################################################################
    ##########################################################################
    ##########################################################################
    ##########################################################################
    ############################### REAGENTS ##################################
    ##########################################################################
    ##########################################################################
    ##########################################################################
    ##########################################################################

    bead_gap = 15

    samples = deep_plate.rows()[0][:num_col]

    # deepwell
    beads = reag_plate["A1"]
    fast_bind_buffer = reag_plate.rows()[0][1:5]  # A2, A3, A4, A5
    wash_buffer_1 = wash_plate.rows()[0][0:2]
    wash_buffer_2 = wash_plate.rows()[0][2:5]
    water = reag_plate["A6"]
    beads2 = reag_plate["A7"]
    ethanol = reag_plate.rows()[0][7:]

    # pcr PLATE
    primers = temp_reag_plate["A1"]
    amp_mix = temp_reag_plate["A2"]

    total_ethanol = 150 * num_samp * 2
    num_ethanol_wells = math.ceil(total_ethanol / 10000)
    ctx.pause(
        f"""
                  You will need {num_ethanol_wells} ethanol wells in the deepwell plate all with 10mL each, starting at A7, B2.
                  """
    )
    ctx.pause(f"You will need {100*num_col*1.15} of strep beads in column 1 of the deepwell reagent plate on deck, B2.")
    ctx.pause(
        f"You will need {200*num_col*1.15} of fast binding buffer in columns A2, A3, A4, A5 of the deepwell reagent plate on deck, B2."
    )
    ctx.pause(f"You will need water in A6 of the deepwell reagent plate on deck, B2.")
    ctx.pause(f"You will need {90*num_col*1.15} of purification beads in column A7 of the deepwell reagent plate on deck, B2.")
    ctx.pause(
        f"You will need {200*num_col*1.15} of wash buffer 1 in columns 1 and 2 of the deepwell reagent plate on temperature module, D1"
    )
    ctx.pause(
        f"You will need {200*num_col*1.15} of wash buffer 2 in columns 3, 4, 5 of the deepwell reagent plate on temperature module, D1"
    )
    ctx.pause(f"You will need {2.5*num_col*1.15} of primer in column 1 of the pcr plate on cold aluminum block, A2")
    ctx.pause(f"You will need {25*num_col*1.15} of amp mix in column 2 of the pcr plate on cold aluminum block, A2")

    #########################################################################
    ######################### STREP BEAD STUFF #########################
    #########################################################################

    ctx.comment("\n\n----------Adding Beads to Plate----------\n")
    adding_beads(100, samples, which_beads=beads, mix_vol=10, mix_with_beads=False, premix=True)

    for i in range(3):

        if i == 1 and not real_mode:
            continue

        ctx.comment("\n\n----------Adding Fast Binding Buffer----------\n")
        for d in samples:
            pick_up(m200)
            m200.aspirate(200, fast_bind_buffer[i])
            m200.dispense(200, d)
            m200.mix(15, 150, d, rate=0.3)
            slow_tip_withdrawal(m200, d)
            ctx.delay(seconds=1)
            m200.blow_out(d.top(-3))
            m200.drop_tip() if real_mode else m200.return_tip()
            ctx.comment("\n")

        # -- MOVE DEEPWELL TO MAG BLOCK
        ctx.move_labware(labware=deep_plate, new_location=mag_block, use_gripper=True, drop_offset={"x": 0, "y": 0, "z": -4})

        ctx.delay(minutes=1.5 if bead_mode else 0.5)

        if i == 0:
            for d in samples:
                pick_up(m200)
                m200.aspirate(150, d)
                dispose_waste(150, m200)
                m200.aspirate(150, d.bottom(z=0.6))
                dispose_waste(150, m200)
                m200.drop_tip() if real_mode else m200.return_tip()
                ctx.comment("\n")

        else:
            remove_super(m200, 200, samples, round=0 if i <= 1 else 1, ethanol=True)

        # -- MOVE DEEPWELL TO DECK
        ctx.move_labware(labware=deep_plate, new_location=5, use_gripper=True)

    ctx.comment("\n\n----------Adding Fast Binding Buffer----------\n")
    for d in samples:
        pick_up(m200)
        m200.aspirate(200, fast_bind_buffer[3])
        m200.dispense(200, d)
        m200.mix(15, 150, d, rate=0.3)
        slow_tip_withdrawal(m200, d)
        ctx.delay(seconds=1)
        m200.blow_out(d.top(-3))
        m200.drop_tip() if real_mode else m200.return_tip()
        ctx.comment("\n")

    pause("Combine sample and strep beads for 16 hour hybridization. Place back on slot C2")

    # starting this step from slot 5

    # -- MOVE DEEPWELL TO MAG BLOCK
    ctx.move_labware(labware=deep_plate, new_location=mag_block, use_gripper=True, drop_offset={"x": 0, "y": 0, "z": -4})

    ctx.delay(minutes=1.5 if bead_mode else 0.5)

    for d in samples:
        pick_up(m200)
        m200.aspirate(150, d, rate=0.05)
        dispose_waste(150, m200)
        m200.aspirate(150, d.bottom(z=0.6), rate=0.05)
        dispose_waste(150, m200)
        m200.drop_tip() if real_mode else m200.return_tip()
        ctx.comment("\n")

    # -- MOVE DEEPWELL TO TEMP MOD ON SLOT 1
    ctx.move_labware(labware=deep_plate, new_location=sample_temp_mod, use_gripper=True)

    for i in range(2):

        ctx.comment("\n\n----------Adding Wash Buffer 1----------\n")
        for d in samples:
            pick_up(m200)
            m200.aspirate(200, wash_buffer_1[i], rate=0.05)
            m200.dispense(200, d)
            m200.mix(15, 200, d, rate=0.3)
            slow_tip_withdrawal(m200, d)
            ctx.delay(seconds=1)
            m200.blow_out(d.top(-3))
            m200.drop_tip() if real_mode else m200.return_tip()
            ctx.comment("\n")

        ctx.delay(minutes=5 if real_mode else 0.05)

        # -- MOVE DEEPWELL TO MAG BLOCK
        ctx.move_labware(labware=deep_plate, new_location=mag_block, use_gripper=True, drop_offset={"x": 0, "y": 0, "z": -4})

        ctx.delay(minutes=1.5 if bead_mode else 0.5)

        remove_super(m200, 200, samples, round=i, ethanol=True)

        # -- MOVE DEEPWELL TO DECK
        ctx.move_labware(labware=deep_plate, new_location=sample_temp_mod if i == 0 else 5, use_gripper=True)

    if real_mode:
        wash_temp_mod.set_temperature(48)
    if real_mode:
        sample_temp_mod.set_temperature(48)

    # -- MOVE DEEPWELL TO TEMP MOD AT 48
    ctx.move_labware(labware=deep_plate, new_location=sample_temp_mod, use_gripper=True)

    for i in range(3):

        if i == 1 and not real_mode:
            continue

        ctx.comment("\n\n----------Adding Wash Buffer 2----------\n")
        for d in samples:
            pick_up(m200)
            m200.aspirate(200, wash_buffer_2[i], rate=0.05)
            m200.dispense(200, d)
            m200.mix(15, 200, d, rate=0.3)
            slow_tip_withdrawal(m200, d)
            ctx.delay(seconds=1)
            m200.blow_out(d.top(-3))
            m200.drop_tip() if real_mode else m200.return_tip()
            ctx.comment("\n")

        ctx.delay(minutes=5 if real_mode else 0.05)

        # -- MOVE DEEPWELL TO MAG BLOCK
        ctx.move_labware(labware=deep_plate, new_location=mag_block, use_gripper=True, drop_offset={"x": 0, "y": 0, "z": -4})

        ctx.delay(minutes=1.5 if bead_mode else 0.5)

        remove_super(m200, 200, samples, round=0 if i <= 1 else 1, ethanol=True)

        # -- MOVE DEEPWELL TO DECK
        ctx.move_labware(labware=deep_plate, new_location=sample_temp_mod if i <= 1 else 5, use_gripper=True)

    ctx.comment("\n\n----------Adding Water----------\n")
    for d in samples:
        pick_up(m50)
        m50.aspirate(45, water)
        m50.dispense(45, d)
        m50.mix(15, 30, d)
        slow_tip_withdrawal(m50, d)
        ctx.delay(seconds=1)
        m50.blow_out(d.top(-3))
        m50.drop_tip() if real_mode else m50.return_tip()
        ctx.comment("\n")

        # next step, section 2.4

    pause(
        f"""Water added. Store 22.5ul in freezer. Protocol continues with remaining 22.5ul in armadillo plate in D2.
             Load the cold aluminum block with armadillo plate on slot A2, with {2.5*num_col*1.15}ul of ilmn amplification primers in the first column,
             and {25*num_col*1.15}ul of equinox library amp mix in column 2 of the cold aluminum block.
             """
    )

    samples = sample_plate.rows()[0][:num_col]

    ctx.comment("\n\n----------Adding Primer----------\n")
    add_reagent(2.5, primers, 15, samples, overflow=False, mix=True)

    ctx.comment("\n\n----------Adding Library Amp Mix----------\n")
    add_reagent(25, amp_mix, 35, samples, overflow=False, mix=True)

    pause(
        f"""Primers and amp mix added. Plate on slot 2 ready for PCR according to section 2.4.
             """
    )

    ########################### SECOND BEAD WASH #############################
    ########################### SECOND BEAD WASH #############################
    ########################### SECOND BEAD WASH #############################

    ctx.comment("\n\n----------Adding Beads to Sample----------\n")

    adding_beads(90, samples, 100, which_beads=beads2, premix=True, mix_with_beads=True)

    ctx.delay(minutes=5 if real_mode else 0.05)

    # -- MOVE PCR TO MAG BLOCK
    ctx.move_labware(labware=sample_plate, new_location=mag_block, use_gripper=True)

    ctx.delay(minutes=2 if bead_mode else 0.5)

    ctx.comment("\n\n----------REMOVING SUPER TO TRASH----------\n")

    remove_super(m200, 140, samples, round=3)

    for i in range(2):
        ctx.comment("\n\n----------ADDING ETHANOL----------\n")

        ethanol_vol = 150
        pick_up(m200)
        for col in samples:
            aspirate_ethanol(ethanol_vol, m200)
            m200.dispense(ethanol_vol, col.top(), rate=0.4)
            ctx.delay(seconds=3)
            m200.blow_out()
        m200.drop_tip() if real_mode else m200.return_tip()
        ctx.delay(30)

        ctx.comment("\n\n----------REMOVING ETHANOL 2----------\n")
        remove_super(m200, ethanol_vol, samples, round=i, pcr=True, ethanol=True)

    ctx.delay(minutes=2 if bead_mode else 0.5)

    # -- MOVE PCR PLATE TO TEMP MODULE
    ctx.move_labware(labware=sample_plate, new_location=2, use_gripper=True)  # back to temp mod

    ctx.comment("\n\n----------ADDING EB (water)----------\n")
    adding_eb(32, water, samples, 20)

    ctx.delay(minutes=3 if real_mode else 0.05)

    # -- MOVE PCR PLATE TO MAG BLOCK
    ctx.move_labware(labware=sample_plate, new_location=mag_block, use_gripper=True)

    ctx.delay(minutes=2 if bead_mode else 0.5)

    fresh_samples = sample_plate.rows()[0][6 : 6 + num_col]

    ctx.comment("\n\n----------Transferring Sample to PCR Plate----------\n")
    for s, d in zip(samples, fresh_samples):
        pick_up(m50)
        m50.aspirate(32, s.bottom(z=0.6), rate=0.1)
        ctx.delay(seconds=2)
        m50.aspirate(bead_gap, s.bottom(z=0.4))
        m50.dispense(bead_gap, d.bottom(z=6))
        m50.dispense(32, d)
        m50.move_to(d.bottom(z=8))
        ctx.delay(seconds=3)
        m50.blow_out()
        m50.drop_tip() if real_mode else m50.return_tip()

    samples = fresh_samples

    pause("""Samples are in right half of pcr plate on slot 2""")

    ########################### END SECOND BEAD WASH #############################
    ########################### END SECOND BEAD WASH #############################
    ########################### END SECOND BEAD WASH #############################

    # Assigning Liquid and colors
    strep_beads_liq = ctx.define_liquid(
        name="Strep Beads",
        description="Beads",
        display_color="#7EFF42",
    )
    fast_bind_buffer_liq = ctx.define_liquid(
        name="Fast Binding Buffer",
        description="Fast Binding Buffer",
        display_color="#50D5FF",
    )
    wash_buffer_1_liq = ctx.define_liquid(
        name="Wash Buffer 1",
        description="Wash Buffer 1",
        display_color="#B925FF",
    )
    wash_buffer_2_liq = ctx.define_liquid(
        name="Wash Buffer 2",
        description="Wash Buffer 2",
        display_color="#FF9900",
    )
    water_liq = ctx.define_liquid(
        name="Water",
        description="FE2",
        display_color="#0019FF",
    )
    beads2_liq = ctx.define_liquid(
        name="Purification Beads",
        description="FORMAMIDE",
        display_color="#007AFF",
    )
    ethanol_liq = ctx.define_liquid(
        name="Ethanol",
        description="BEADS",
        display_color="#FF0076",
    )
    primers_liq = ctx.define_liquid(
        name="Primers",
        description="Primers",
        display_color="#00FFBC",
    )
    amp_mix_liq = ctx.define_liquid(
        name="Amp Mix",
        description="Amp Mix",
        display_color="#00AAFF",
    )
    samples_liq = ctx.define_liquid(
        name="SAMPLES",
        description="SAMPLES",
        display_color="#008000",
    )
    ethanol_liq = ctx.define_liquid(
        name="ETHANOL",
        description="ETHANOL",
        display_color="#DE3163",
    )

    for column in deep_plate.columns()[:num_col]:
        for well in column:
            well.load_liquid(liquid=samples_liq, volume=50)

    for column in reag_plate.columns()[1:5]:
        for well in column:
            well.load_liquid(liquid=fast_bind_buffer_liq, volume=200 * num_col * 1.15)
    for well in reag_plate.columns()[0]:
        well.load_liquid(liquid=strep_beads_liq, volume=100 * num_col * 1.15)
    for column in wash_plate.columns()[:2]:
        for well in column:
            well.load_liquid(liquid=wash_buffer_1_liq, volume=200 * num_col * 1.15)
    for column in wash_plate.columns()[2:5]:
        for well in column:
            well.load_liquid(liquid=wash_buffer_2_liq, volume=200 * num_col * 1.15)
    for well in reag_plate.columns()[5]:
        well.load_liquid(liquid=water_liq, volume=100 * num_col * 1.15)
    for well in reag_plate.columns()[6]:
        well.load_liquid(liquid=beads2_liq, volume=90 * num_col * 1.15)
    for well in reag_plate.columns()[7]:
        well.load_liquid(liquid=ethanol_liq, volume=300 * num_col)

    for well in temp_reag_plate.columns()[0]:
        well.load_liquid(liquid=primers_liq, volume=2.5 * num_col * 1.15)
    for well in temp_reag_plate.columns()[1]:
        well.load_liquid(liquid=amp_mix_liq, volume=2.5 * num_col * 1.15)

    # for column, column_volume in zip(reag_plate.columns()[2:6], [29, 17.5, 21, 21]):
    #     for well in column:
    #         well.load_liquid(liquid=eb_liq, volume=column_volume)
    # for well in reag_plate.columns()[6]:
    #     well.load_liquid(liquid=tet2_liq, volume=17*1.15*num_col)
    # for well in reag_plate.columns()[7]:
    #     well.load_liquid(liquid=fe2_liq, volume=5*1.15*num_col)
    # for well in temp_reag_plate.columns()[8]:
    #     well.load_liquid(liquid=formamide_liq, volume=5*1.15*num_col)
    #
    #
    # for well in reag_res.wells()[1:1+num_ethanol_wells]:
    #     well.load_liquid(liquid=ethanol_liq, volume=10000)
    #
    # if num_col <= 2:
    #     for well in deep_reag_plate.columns()[0]:
    #         well.load_liquid(liquid=beads_liq, volume=345*1.15*num_col)
    #
    # else:
    #     reag_res['A1'].load_liquid(liquid=beads_liq, volume=345*1.15*num_samp)
    #
    # for well in deep_reag_plate.columns()[1]:
    #     well.load_liquid(liquid=apobec_liq, volume=80*1.15*num_col)
