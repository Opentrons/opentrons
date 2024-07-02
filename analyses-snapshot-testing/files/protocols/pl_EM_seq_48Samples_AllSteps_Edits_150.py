def get_values(*names):
    import json

    _all_values = json.loads(
        """{"num_samp":8,"real_mode":true,"end_prep_step":true,"first_wash_step":true,"add_tet_step":true,"second_wash_step":true,"add_formamide_step":true,"third_wash_step":true,"fourth_wash_step":true,"m50_mount":"left","m200_mount":"right","protocol_filename":"EM-seq_48Samples_AllSteps_Edits_150"}"""
    )
    return [_all_values[n] for n in names]


# flake8: noqa
import math

from opentrons import protocol_api
from opentrons import types
import random
import math

metadata = {
    "ctx.Name": "NEBNext® Enzymatic Methyl-seq Kit",
    "author": "Rami Farawi <rami.farawi@opentrons.com",
}
requirements = {"robotType": "Flex", "apiLevel": "2.17"}


def run(ctx: protocol_api.ProtocolContext):

    # real_mode = False
    # m50_mount = 'left'
    # m200_mount = 'right'
    # num_samp = 32
    # real_mode = False
    # end_prep_step = True
    # first_wash_step = True
    # add_tet_step = False
    # second_wash_step = True
    # add_formamide_step = False
    # third_wash_step = False
    # fourth_wash_step = False

    ######## ADD DISPENSES INTO chute

    bead_mode = True

    [
        num_samp,
        real_mode,
        end_prep_step,
        first_wash_step,
        add_tet_step,
        second_wash_step,
        add_formamide_step,
        third_wash_step,
        fourth_wash_step,
        m50_mount,
        m200_mount,
    ] = get_values(  # noqa: F821
        "num_samp",
        "real_mode",
        "end_prep_step",
        "first_wash_step",
        "add_tet_step",
        "second_wash_step",
        "add_formamide_step",
        "third_wash_step",
        "fourth_wash_step",
        "m50_mount",
        "m200_mount",
    )

    num_col = math.ceil(num_samp / 8)

    # index_plate = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt',  protocol_api.OFF_DECK)

    # TEMPERATURE MODULES
    reag_temp_mod = ctx.load_module("temperature module gen2", 1)
    reag_temp_adapter = reag_temp_mod.load_adapter("opentrons_96_well_aluminum_block")
    temp_reag_plate = reag_temp_adapter.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")

    sample_temp_mod = ctx.load_module("temperature module gen2", 4)
    sample_temp_adapter = sample_temp_mod.load_adapter("opentrons_96_well_aluminum_block")
    sample_plate = sample_temp_adapter.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")

    if real_mode:
        reag_temp_mod.set_temperature(4)
    if real_mode:
        sample_temp_mod.set_temperature(4)

    # MAGNETIC MODULE
    mag_block = ctx.load_module("magneticBlockV1", 6)

    # DECK LABWARE

    fresh_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", 2)
    final_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", protocol_api.OFF_DECK)
    reag_res = ctx.load_labware("nest_12_reservoir_15ml", 11)
    deep_reag_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", 8)
    liminal_deep_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", 5)
    # waste = reag_res['A12'].top(z=-3)

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

    # waste_ctr = 0
    # well_ctr = 11

    def dispose_waste(vol, pip, use_trash=False):

        # ctx.comment('\n\n----------DISPOSING WASTE----------\n')

        pip.dispense(vol, chute)

        # nonlocal well_ctr
        # nonlocal waste_ctr
        #
        # # print(waste_ctr, deep_reag_plate.rows()[0][well_ctr])
        # pip.dispense(vol, deep_reag_plate.rows()[0][well_ctr].top(), rate=0.5)
        # ctx.delay(seconds=2)
        # pip.blow_out()
        # waste_ctr += vol
        # if waste_ctr > 1800:
        #     well_ctr -= 1
        #     waste_ctr = 0
        #     if well_ctr == 1:
        #         raise Exception('You have run out of waste storage')

    ethanol_ctr = 10000
    ethanol_well_ctr = 0

    def aspirate_ethanol(vol, pip):
        nonlocal ethanol_well_ctr
        nonlocal ethanol_ctr

        # print(ethanol_ctr, ethanol_well_ctr, ethanol[ethanol_well_ctr])

        pip.aspirate(ethanol_vol, ethanol[ethanol_well_ctr], rate=0.5)
        slow_tip_withdrawal(pip, ethanol[ethanol_well_ctr])
        ethanol_ctr -= vol * 8
        if ethanol_ctr < 1600:
            ethanol_well_ctr += 1
            ethanol_ctr = 10000
        # print(ethanol_ctr, ethanol_well_ctr, ethanol[ethanol_well_ctr])

    def remove_super_no_wash(pip, vol, list_of_samples):

        for _ in range(2):
            for col in list_of_samples:
                pick_up(pip)
                pip.aspirate(vol / 2, col.bottom(z=0.7), rate=0.05)
                dispose_waste(vol / 2, pip)
                pip.drop_tip() if real_mode else pip.return_tip()
            ctx.delay(seconds=60)

    def remove_super(
        pip, vol, list_of_samples, round, eb_vol, eb_well, list_to_go, eb_mix_vol, plate, deck_location, pcr=False, ethanol=False
    ):

        factor = 5 / m200.flow_rate.aspirate
        m200.flow_rate.aspirate = m200.flow_rate.aspirate * factor

        pip_rate = 0.2 if pip == m50 else 1

        if round == 0:  # the first round of ethanol wash where we dont go in with 50

            if pcr:

                for col in list_of_samples:
                    pick_up(pip)
                    pip.aspirate(vol / 2, col.bottom(z=5), rate=pip_rate)
                    ctx.delay(seconds=2)
                    pip.aspirate(vol / 2, col.bottom(z=0.6), rate=pip_rate)
                    dispose_waste(vol, pip)
                    pip.drop_tip() if real_mode else pip.return_tip()

            else:

                for col in list_of_samples:
                    pick_up(pip)
                    pip.aspirate(vol - 30, col, rate=pip_rate)
                    ctx.delay(seconds=2)
                    pip.aspirate(30, col.bottom(z=0.6), rate=pip_rate)
                    dispose_waste(vol, pip)
                    pip.drop_tip() if real_mode else pip.return_tip()

        elif round == 1:  # this is the second round of ethanol where we go in with a 50

            if pcr:

                for i, col in enumerate(list_of_samples):

                    if i % 2 == 0:
                        pick_up(pip)
                        # pick_up(m50)
                        pip.aspirate(vol / 2, col.bottom(z=5), rate=pip_rate)
                        ctx.delay(seconds=2)
                        pip.aspirate(vol / 2, col.bottom(z=0.6), rate=pip_rate)
                        dispose_waste(vol, pip)
                        pip.drop_tip() if real_mode else pip.return_tip()
                        # m50.aspirate(20, col, rate=0.2)
                        # m50.aspirate(20, col.bottom(z=0.6), rate=0.2 if pip == m200 else 0.2)
                        # m50.aspirate(10, col.bottom(z=0.45), rate=0.2 if pip == m200 else 0.2)
                        # dispose_waste(50, m50)
                        # m50.drop_tip() if real_mode else m50.return_tip()

                    elif i % 2 > 0:
                        pick_up(pip)
                        # pick_up(m50)
                        pip.aspirate(vol / 2, col.bottom(z=5), rate=pip_rate)
                        ctx.delay(seconds=2)
                        pip.aspirate(vol / 2, col.bottom(z=0.6), rate=pip_rate)
                        dispose_waste(vol, pip)
                        pip.drop_tip() if real_mode else pip.return_tip()
                        # m50.aspirate(20, col, rate=0.2)
                        # m50.aspirate(20, col.bottom(z=0.6), rate=0.2 if pip == m200 else 0.2)
                        # m50.aspirate(10, col.bottom(z=0.45), rate=0.2 if pip == m200 else 0.2)
                        # dispose_waste(50, m50)
                        # m50.drop_tip() if real_mode else m50.return_tip()

                        ctx.comment("\n ADDING EB \n\n")

                        adding_eb(eb_vol, eb_well, list_to_go[i - 1 : i + 1])

            else:

                for i, col in enumerate(list_of_samples):

                    if i % 2 == 0:

                        pick_up(pip)
                        # pick_up(m50)
                        pip.aspirate(vol - 20, col, rate=pip_rate)
                        ctx.delay(seconds=2)
                        pip.aspirate(20, col.bottom(z=0.6), rate=pip_rate)
                        dispose_waste(vol, pip)
                        pip.drop_tip() if real_mode else pip.return_tip()
                        # m50.aspirate(20, col, rate=0.2)
                        # m50.aspirate(20, col.bottom(z=0.6), rate=0.2 if pip == m200 else 0.2)
                        # m50.aspirate(10, col.bottom(z=0.45), rate=0.2 if pip == m200 else 0.2)
                        # dispose_waste(50, m50)
                        # m50.drop_tip() if real_mode else m50.return_tip()
                        ctx.comment("\n")

                    elif i % 2 > 0:
                        pick_up(pip)
                        # pick_up(m50)
                        pip.aspirate(vol - 20, col, rate=pip_rate)
                        ctx.delay(seconds=2)
                        pip.aspirate(20, col.bottom(z=0.6), rate=pip_rate)
                        dispose_waste(vol, pip)
                        pip.drop_tip() if real_mode else pip.return_tip()
                        # m50.aspirate(20, col, rate=0.2)
                        # m50.aspirate(20, col.bottom(z=0.6), rate=0.2 if pip == m200 else 0.2)
                        # m50.aspirate(10, col.bottom(z=0.45), rate=0.2 if pip == m200 else 0.2)
                        # dispose_waste(50, m50)
                        # m50.drop_tip() if real_mode else m50.return_tip()

                        ctx.comment("\n ADDING EB \n\n")

                        adding_eb(eb_vol, eb_well, list_to_go[i - 1 : i + 1])

            ctx.delay(minutes=0.75 if bead_mode else 0.5)

            # -- MOVE DEEPWELL TO DECK
            ctx.move_labware(labware=plate, new_location=deck_location, use_gripper=True)

            for d in list_to_go:
                pick_up(m50)
                m50.aspirate(10, d.top())
                m50.mix(15, eb_mix_vol, d.bottom(z=1), rate=1.2)
                m50.dispense(10, d.bottom(z=5))
                ctx.delay(seconds=2)
                m50.blow_out()
                m50.touch_tip(radius=0.8, v_offset=-5)
                m50.drop_tip() if real_mode else m50.return_tip()

        m200.flow_rate.aspirate = m200.flow_rate.aspirate / factor

    def adding_beads(bead_vol, list_of_s, mix_vol):

        if num_col > 3:
            pick_up(m200)
            for bead_col in beads[:2]:
                m200.aspirate(10, bead_col.top())
                m200.mix(10, 190, bead_col, rate=0.4)
                m200.mix(2, 190, bead_col, rate=0.20)
                slow_tip_withdrawal(m200, bead_col)
                ctx.delay(seconds=2)
                m200.dispense(10, bead_col.top(-3))
                m200.blow_out(bead_col.bottom(z=20))
            # m200.drop_tip() if real_mode else m200.return_tip()

            isFirst = True  #### Reuse mixing tips for first column of samples

            for bead_col, d in zip(beads, list_of_s):
                if isFirst:
                    m200.aspirate(bead_vol, bead_col, rate=0.25)
                    slow_tip_withdrawal(m200, bead_col)
                    m200.dispense(bead_vol, d, rate=0.3)
                    m200.mix(15, mix_vol, d, rate=0.3)
                    slow_tip_withdrawal(m200, d)
                    ctx.delay(seconds=3)
                    m200.blow_out(d.top(z=-2))
                    m200.drop_tip() if real_mode else m200.return_tip()
                    isFirst = False
                else:
                    pick_up(m200)
                    m200.aspirate(bead_vol, bead_col, rate=0.25)
                    slow_tip_withdrawal(m200, bead_col)
                    m200.dispense(bead_vol, d, rate=0.3)
                    m200.mix(15, mix_vol, d, rate=0.3)
                    slow_tip_withdrawal(m200, d)
                    ctx.delay(seconds=3)
                    m200.blow_out(d.top(z=-2))
                    m200.drop_tip() if real_mode else m200.return_tip()
        else:
            pick_up(m200)
            m200.aspirate(10, beads.top())
            m200.mix(10, 190, beads, rate=0.4)
            m200.mix(2, 190, beads, rate=0.20)
            slow_tip_withdrawal(m200, beads)
            ctx.delay(seconds=2)
            m200.dispense(10, beads.top(-3))
            m200.blow_out(beads.bottom(z=20))
            # m200.drop_tip() if real_mode else m200.return_tip()

            isFirst = True  #### Reuse mixing tips for first column of samples

            for d in list_of_s:
                if isFirst:
                    m200.aspirate(bead_vol, beads, rate=0.25)
                    slow_tip_withdrawal(m200, beads)
                    m200.dispense(bead_vol, d, rate=0.3)
                    m200.mix(15, mix_vol, d, rate=0.3)
                    slow_tip_withdrawal(m200, d)
                    ctx.delay(seconds=3)
                    m200.blow_out(d.top(z=-2))
                    m200.drop_tip() if real_mode else m200.return_tip()
                    isFirst = False
                else:
                    pick_up(m200)
                    m200.aspirate(bead_vol, beads, rate=0.25)
                    slow_tip_withdrawal(m200, beads)
                    m200.dispense(bead_vol, d, rate=0.3)
                    m200.mix(15, mix_vol, d, rate=0.3)
                    slow_tip_withdrawal(m200, d)
                    ctx.delay(seconds=3)
                    m200.blow_out(d.top(z=-2))
                    m200.drop_tip() if real_mode else m200.return_tip()

    def adding_eb(eb_vol, eb_well, list_to_go):
        # if first_eb:
        #     half_of_the_columns = math.floor(num_col/2)
        #     for i, d in enumerate(list_to_go):
        #         pick_up(m50)
        #         m50.aspirate(10, eb_well.top())
        #         m50.aspirate(eb_vol, eb_well.bottom(z=4 if i < half_of_the_columns else 1))
        #         m50.dispense(eb_vol, d)
        #         m50.mix(15, eb_mix_vol, d.bottom(z=1), rate=1.2)
        #         m50.dispense(10, d.bottom(z=5))
        #         ctx.delay(seconds=2)
        #         m50.blow_out()
        #         m50.touch_tip(radius=0.8, v_offset=-5)
        #         m50.drop_tip() if real_mode else m50.return_tip()

        pick_up(m50)
        for d in list_to_go:
            m50.aspirate(10, eb_well.top())
            m50.aspirate(eb_vol, eb_well)
            m50.dispense(eb_vol, d.top())
            # m50.mix(15, eb_mix_vol, d.bottom(z=1), rate=1.2)
            m50.dispense(10, d.top())
            ctx.delay(seconds=2)
            m50.blow_out()
            # m50.touch_tip(radius=0.8, v_offset=-5)
        m50.drop_tip() if real_mode else m50.return_tip()

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

        else:
            half_of_the_columns = math.floor(num_col / 2)
            for i, d in enumerate(sample_list):
                pick_up(m50)
                m50.aspirate(vol, reagent.bottom(z=5 if i < half_of_the_columns else 1))
                m50.dispense(vol, d)
                if mix:
                    m50.mix(15 if real_mode else 1, mix_vol, d)
                m50.move_to(d.top())
                ctx.delay(seconds=1)
                m50.blow_out(d.top(-3))
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

    samples = sample_plate.rows()[0][:num_col]

    # reagent plate on temperature module
    end_prep_mmx = temp_reag_plate["A1"]
    adapters = temp_reag_plate["A2"]
    eb = temp_reag_plate["A3"]  # elution buffer for first wash is a3, second wash a4
    eb2 = temp_reag_plate["A4"]
    eb3 = temp_reag_plate["A5"]
    eb4 = temp_reag_plate["A6"]
    tet2 = temp_reag_plate["A7"]
    fe2 = temp_reag_plate["A8"]
    formamide = temp_reag_plate["A9"]

    # deepwell

    beads = (
        deep_reag_plate["A1"] if num_col <= 3 else [deep_reag_plate["A1"], deep_reag_plate["A2"]] * 100
    )  # BEADS DEPENDENT ON HOW MANY SAMPLES
    apobec = deep_reag_plate["A3"]

    # reservoir

    num_tips = 8
    num_washes = 8  # 4 washes each with 2 ethanol washes
    total_ethanol = 150 * num_col * num_tips * num_washes
    num_ethanol_wells = math.ceil(total_ethanol / 10000)
    ctx.pause(
        f"""You will need {num_ethanol_wells} ethanol wells in the reservoir all with 10mL each, starting at A1.
                  Load {10*num_col*1.15}ul of end prep mastermix in column 1 of D1 on temperature module."""
    )

    if num_col > 3:
        ctx.pause(f"""You will need 2 bead columns in the deepwell plate with {345*num_col*1.15/2} in each column, starting at A1.""")

    else:
        ctx.pause(f"""You will need 1 bead column in the deepwell plate with {345*num_col*1.15}, in A1.""")

    ethanol = reag_res.wells()

    bead_air = 15
    bead_gap = 15

    if end_prep_step:

        ##########################################################################
        ########################## CAPTURE mRNA #########################
        ##########################################################################

        ctx.comment("\n\n----------ADDING END PREP MMX----------\n")

        add_reagent(10, end_prep_mmx, 35, samples)

        pause(
            f"""End Prep MMX added. Place plate in thermal cycler, then back on the temperature module on C1.
                  Load {31*num_col*1.15 if 31*num_col*1.15 <= 200 else 200}ul of ligation mastermix in column 2 of D1 on temperature module."""
        )

        # ##########################################################################
        # ##########################################################################

        ctx.comment("\n\n----------ADDING ADAPTERS----------\n")

        add_reagent(31, adapters, 45, samples, overflow=True)

        pause("Adapters added. Place in thermal cycler according to the end of section 1.3. Place plate back on temperature module on C1.")

        # ##########################################################################
        # ##########################################################################

        ctx.comment("\n\n----------Transferring Sample to Deepwell Plate----------\n")

        factor = 5 / m200.flow_rate.aspirate
        m200.flow_rate.aspirate = m200.flow_rate.aspirate * factor

        for s, d in zip(samples, liminal_deep_plate.rows()[0]):
            pick_up(m200)
            m200.aspirate(94, s.bottom(0.7))
            m200.dispense(94, d)
            ctx.delay(seconds=3)
            m200.blow_out(d.bottom(z=5))
            m200.drop_tip() if real_mode else m200.return_tip()

        m200.flow_rate.aspirate = m200.flow_rate.aspirate / factor

    if first_wash_step:
        #
        # # # ########################### FIRST BEAD WASH #############################
        # # # ########################### FIRST BEAD WASH #############################
        # # # ########################### FIRST BEAD WASH #############################
        # # #
        liminal_samples = liminal_deep_plate.rows()[0][:num_col]

        ctx.comment("\n\n----------Adding Beads to Sample----------\n")
        adding_beads(110, liminal_samples, 130)

        # -- MOVE DEEPWELL TO MAG BLOCK
        ctx.move_labware(labware=liminal_deep_plate, new_location=mag_block, use_gripper=True)

        ctx.delay(minutes=3 if bead_mode else 0.5)

        ctx.comment("\n\n----------REMOVING SUPER TO TRASH----------\n")

        super_vol = 203.5
        for col in liminal_samples:
            pick_up(m200)
            m200.aspirate(110, col, rate=0.05)
            m200.dispense(110, chute, rate=0.4)
            m200.aspirate(110, col.bottom(z=0.6), rate=0.05)
            m200.dispense(110, chute, rate=0.4)
            m200.drop_tip() if real_mode else m200.return_tip()

        for i in range(2):
            ctx.comment("\n\n----------ADDING ETHANOL----------\n")

            ethanol_vol = 150
            pick_up(m200)
            for col in liminal_samples:
                aspirate_ethanol(ethanol_vol, m200)
                m200.dispense(ethanol_vol, col.top(), rate=0.4)
                ctx.delay(seconds=3)
                m200.blow_out()
            m200.drop_tip() if real_mode else m200.return_tip()

            ctx.comment("\n\n----------REMOVING ETHANOL AND ADDING EB----------\n")
            remove_super(m200, ethanol_vol, liminal_samples, i, 29, eb, liminal_samples, 20, liminal_deep_plate, 5, ethanol=True)

        # ctx.delay(minutes=2 if bead_mode else 0.5)
        #
        #    # -- MOVE DEEPWELL TO DECK
        # ctx.move_labware(
        #     labware=liminal_deep_plate,
        #     new_location=5,
        #     use_gripper=True
        # )
        #
        # ctx.comment('\n\n----------ADDING EB----------\n')
        # adding_eb(29, eb, liminal_samples, 20)

        ctx.delay(minutes=1 if real_mode else 0.05)

        # -- MOVE DEEPWELL TO MAG BLOCK
        ctx.move_labware(labware=liminal_deep_plate, new_location=mag_block, use_gripper=True)

        ctx.delay(minutes=3 if bead_mode else 0.5)

        samples = sample_plate.rows()[0][6 : 6 + num_col]  # REISSUE SAMPLES TO RIGHT HALF OF PLATE

        ctx.comment("\n\n----------Transferring Sample to PCR Plate----------\n")

        for s, d in zip(liminal_samples, samples):
            pick_up(m50)
            m50.aspirate(28, s.bottom(z=0.6), rate=0.2)
            ctx.delay(seconds=2)
            m50.aspirate(bead_gap, s.bottom(z=0.6))
            m50.dispense(bead_gap, d.bottom(z=6))
            m50.dispense(28, d)
            m50.move_to(d.bottom(z=8))
            ctx.delay(seconds=3)
            m50.blow_out()
            m50.touch_tip(v_offset=-5, radius=0.75)
            m50.drop_tip() if real_mode else m50.return_tip()

        ctx.move_labware(labware=liminal_deep_plate, new_location=5, use_gripper=True)

        pause(
            """Beads cleanup completed. Continue with 1.5 Oxidation of 5-Methylcytosines and 5-Hydroxymethylcytosines. Samples are on the right half of the plate, starting in column 7."""
        )

        ########################### END FIRST BEAD WASH #############################
        ########################### END FIRST BEAD WASH #############################
        ########################### END FIRST BEAD WASH #############################

        pause(
            f"""First wash completed.
                  Load {17*num_col*1.15}ul of tet2 mastermix in column 7 of D1 on temperature module.
                  Load {5*num_col*1.15}ul of fe2 mastermix in column 8 of D1 on temperature module.
                  """
        )

    if add_tet_step:
        ctx.comment("\n\n----------ADDING TET2 MMX----------\n")
        add_reagent(17, tet2, 35, samples)

        ctx.comment("\n\n----------ADDING FE2 MMX----------\n")
        add_reagent(5, fe2, 40, samples)

        pause("Take the plate to the thermal cycler according to section 1.5 of the SOP. Then, place back on the temperature module.")

    if second_wash_step:
        ########################### SECOND BEAD WASH #############################
        ########################### SECOND BEAD WASH #############################
        ########################### SECOND BEAD WASH #############################

        # samples = sample_plate.rows()[0][6:6+num_col] #un-comment to start at wash 2

        ctx.comment("\n\n----------Adding Beads to Sample----------\n")
        adding_beads(90, samples, 100)

        ctx.delay(minutes=5 if real_mode else 0.05)

        # -- MOVE PCR TO MAG BLOCK
        ctx.move_labware(labware=sample_plate, new_location=mag_block, use_gripper=True)

        ctx.delay(minutes=3 if bead_mode else 0.5)

        ctx.comment("\n\n----------REMOVING SUPER TO TRASH----------\n")

        super_vol = 150

        # Removing super in parts. Actual super volume is 141
        for col in samples:
            pick_up(m200)
            m200.aspirate(57, col, rate=0.05)
            m200.dispense(57, chute, rate=0.4)
            m200.drop_tip() if real_mode else m200.return_tip()

        ctx.delay(seconds=60)

        for col in samples:
            pick_up(m200)
            m200.aspirate(96, col, rate=0.05)
            m200.dispense(96, chute, rate=0.4)
            m200.drop_tip() if real_mode else m200.return_tip()

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

            ctx.comment("\n\n----------REMOVING ETHANOL AND ADDING EB 2----------\n")
            remove_super(m200, ethanol_vol, samples, i, 17.5, eb2, samples, 11, sample_plate, sample_temp_adapter, pcr=True, ethanol=True)

        # ctx.delay(minutes=2 if bead_mode else 0.5)
        #
        # # -- MOVE PCR PLATE TO TEMP MODULE
        # ctx.move_labware(
        #     labware=sample_plate,
        #     new_location=sample_temp_adapter,  # back to temp mod
        #     use_gripper=True
        # )

        # ctx.comment('\n\n----------ADDING EB----------\n')
        # adding_eb(17.5, eb2, samples, 11)

        ctx.delay(minutes=1 if real_mode else 0.05)

        # -- MOVE PCR PLATE TO MAG BLOCK
        ctx.move_labware(labware=sample_plate, new_location=mag_block, use_gripper=True)

        ctx.delay(minutes=3 if bead_mode else 0.5)

        fresh_samples = fresh_plate.rows()[0][:num_col]

        ctx.comment("\n\n----------Transferring Sample to PCR Plate----------\n")
        for s, d in zip(samples, fresh_samples):
            pick_up(m50)
            m50.aspirate(16, s.bottom(z=0.6), rate=0.2)
            ctx.delay(seconds=2)
            m50.aspirate(bead_gap, s.bottom(z=0.6))
            m50.dispense(bead_gap, d.bottom(z=6))
            m50.dispense(16, d)
            m50.move_to(d.bottom(z=8))
            ctx.delay(seconds=3)
            m50.blow_out()
            m50.touch_tip(v_offset=-5, radius=0.75)
            m50.drop_tip() if real_mode else m50.return_tip()

        samples = fresh_samples

        # -- MOVE SAMPLE PLATE OFF DECK
        ctx.move_labware(labware=sample_plate, new_location=chute, use_gripper=True)  # OR MOVE IT WITH CHUTE?

        # -- MOVE NEW SAMPLE PLATE TO TEMPERATURE MODULE
        ctx.move_labware(labware=fresh_plate, new_location=sample_temp_adapter, use_gripper=True)

        pause(
            """Completed step 1.6. Samples are in left half of plate on temperature module.
                 Safe stopping point. Samples at -20C overnight. Otherwise, select Resume for the robot to proceed to 1.7, adding formamide."""
        )

        ########################### END SECOND BEAD WASH #############################
        ########################### END SECOND BEAD WASH #############################
        ########################### END SECOND BEAD WASH #############################

    if add_formamide_step:
        ctx.comment("\n\n----------ADDING FORMAMIDE MMX----------\n")

        pause(f"""Load {5*num_col*1.15}ul of formamide mastermix in column 9 of D1 on temperature module.""")

        add_reagent(5, formamide, 10, samples, mix=False)

        pause(
            f"""
                  Formamide is added to samples WITHOUT pipette mixing. Move to thermal cycler.
                  Load {80*num_col*1.15}ul of apobec mastermix in column 3 of deepwell reagent plate.
            """
        )

        ctx.comment("\n\n----------ADDING APOBEC MMX----------\n")

        for d in samples:
            pick_up(m200)
            m200.aspirate(80, apobec, rate=0.2)
            slow_tip_withdrawal(m200, apobec)
            m200.dispense(80, d)
            m200.mix(10 if real_mode else 1, 80, d, rate=0.2)
            slow_tip_withdrawal(m200, d)
            ctx.delay(seconds=3)
            m200.blow_out(d.top(-3))
            m200.drop_tip() if real_mode else m200.return_tip()

        pause("APOBEC added. Place in thermal cycler according to the end of section 1.8. Place plate back on temperature module on C1.")

    if third_wash_step:
        ########################### THIRD BEAD WASH #############################
        ########################### THIRD BEAD WASH #############################
        ########################### THIRD BEAD WASH #############################

        liminal_samples = liminal_deep_plate.rows()[0][6 : 6 + num_col]

        ctx.comment("\n\n----------Transferring Sample to Deepwell Plate----------\n")
        for s, d in zip(samples, liminal_samples):
            pick_up(m200)
            m200.aspirate(100, s.bottom(z=0.6), rate=0.05)
            ctx.delay(seconds=2)
            m200.aspirate(bead_gap, s.bottom(z=0.6))
            m200.dispense(bead_gap, d.bottom(z=6))
            m200.dispense(100, d)
            m200.move_to(d.bottom(z=8))
            ctx.delay(seconds=3)
            m200.blow_out()
            m200.touch_tip(v_offset=-15, radius=0.45)
            m200.drop_tip() if real_mode else m200.return_tip()

        ctx.comment("\n\n----------Adding Beads to Sample----------\n")
        adding_beads(100, liminal_samples, 130)

        ctx.delay(minutes=5 if real_mode else 0.05)

        # -- MOVE DEEPWELL TO MAG BLOCK
        ctx.move_labware(labware=liminal_deep_plate, new_location=mag_block, use_gripper=True)

        ctx.delay(minutes=3 if bead_mode else 0.5)

        ctx.comment("\n\n----------REMOVING SUPER TO TRASH----------\n")

        super_vol = 200
        for col in liminal_samples:
            pick_up(m200)
            m200.aspirate(super_vol - 20, col, rate=0.05)
            dispose_waste(super_vol - 20, m200)
            m200.aspirate(20, col.bottom(z=0.6), rate=0.05)
            dispose_waste(20, m200)
            m200.drop_tip() if real_mode else m200.return_tip()

        for i in range(2):
            ctx.comment("\n\n----------ADDING ETHANOL----------\n")

            ethanol_vol = 150
            pick_up(m200)
            for col in liminal_samples:
                aspirate_ethanol(ethanol_vol, m200)
                m200.dispense(ethanol_vol, col.top(), rate=0.4)
                ctx.delay(seconds=3)
                m200.blow_out()
            m200.drop_tip() if real_mode else m200.return_tip()

            ctx.comment("\n\n----------REMOVING ETHANOL AND REMOVING EB 3----------\n")
            remove_super(m200, ethanol_vol, liminal_samples, i, 21, eb3, liminal_samples, 14, liminal_deep_plate, 5, ethanol=True)

        # ctx.delay(minutes=2 if bead_mode else 0.5)
        #
        #    # -- MOVE DEEPWELL TO DECK
        # ctx.move_labware(
        #     labware=liminal_deep_plate,
        #     new_location=5,
        #     use_gripper=True
        # )
        #
        # ctx.comment('\n\n----------ADDING EB----------\n')
        # adding_eb(21, eb3, samples, 14)

        ctx.delay(minutes=1 if real_mode else 0.05)

        # -- MOVE DEEPWELL TO MAG BLOCK
        ctx.move_labware(labware=liminal_deep_plate, new_location=mag_block, use_gripper=True)

        ctx.delay(minutes=3 if bead_mode else 0.5)

        samples = fresh_plate.rows()[0][6 : 6 + num_col]  # REISSUE SAMPLES TO RIGHT HALF OF PLATE

        ctx.comment("\n\n----------Transferring Sample to PCR Plate----------\n")
        for s, d in zip(liminal_samples, samples):
            pick_up(m50)
            m50.aspirate(28, s.bottom(z=0.6), rate=0.2)
            ctx.delay(seconds=2)
            m50.aspirate(bead_gap, s.bottom(z=0.6), rate=0.2)
            m50.dispense(bead_gap, d.bottom(z=6))
            m50.dispense(28, d)
            m50.move_to(d.bottom(z=8))
            ctx.delay(seconds=3)
            m50.blow_out()
            m50.touch_tip(v_offset=-5, radius=0.75)
            m50.drop_tip() if real_mode else m50.return_tip()

        ctx.move_labware(labware=liminal_deep_plate, new_location=5, use_gripper=True)

        # -- MOVE PCR PLATE TO DECK
        ctx.move_labware(labware=final_plate, new_location=2, use_gripper=False)

        pause(
            """Samples are in right half of PCR plate. They can go overnight at -20C. Proceed on to 1.10 of SOP manually. Return plate to complete 1.11 of SOP."""
        )

        ########################### END THIRD BEAD WASH #############################
        ########################### END THIRD BEAD WASH #############################
        ########################### END THIRD BEAD WASH #############################

    if fourth_wash_step:
        ########################### START FOURTH WASH #############################
        ########################### START FOURTH WASH #############################
        ########################### START FOURTH WASH #############################

        ctx.comment("\n\n----------Adding Beads to Sample----------\n")
        adding_beads(45, samples, 60)

        ctx.delay(minutes=5 if real_mode else 0.05)

        # -- MOVE PCR PLATE TO MAG BLOCK
        ctx.move_labware(labware=fresh_plate, new_location=mag_block, use_gripper=True)

        ctx.delay(minutes=3 if bead_mode else 0.5)

        ctx.comment("\n\n----------REMOVING SUPER TO TRASH----------\n")

        remove_super_no_wash(m200, 150, samples)

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

            ctx.comment("\n\n----------REMOVING ETHANOL AND ADDING EB 4----------\n")
            remove_super(m200, ethanol_vol, samples, i, 21, eb4, samples, 14, fresh_plate, sample_temp_adapter, pcr=True, ethanol=True)

        # ctx.delay(minutes=2 if bead_mode else 0.5)
        #
        # # MOVING PCR PLATE TO TEMP MOD
        # ctx.move_labware(
        #     labware=fresh_plate,
        #     new_location=sample_temp_adapter,  # back to temp mod
        #     use_gripper=True
        # )
        #
        # ctx.comment('\n\n----------ADDING EB----------\n')
        # adding_eb(21, eb4, samples, 14)

        ctx.delay(minutes=1 if real_mode else 0.05)

        # -- MOVE FRESH PLATE TO MAG BLOCK
        ctx.move_labware(labware=fresh_plate, new_location=mag_block, use_gripper=True)

        ctx.delay(minutes=3 if bead_mode else 0.5)

        final_samples = final_plate.rows()[0][:num_col]

        ctx.comment("\n\n----------Transferring Sample to PCR Plate----------\n")
        for s, d in zip(samples, final_samples):
            pick_up(m50)
            m50.aspirate(20, s.bottom(z=0.6), rate=0.2)
            ctx.delay(seconds=2)
            m50.aspirate(bead_gap, s.bottom(z=0.6))
            m50.dispense(bead_gap, d.bottom(z=6))
            m50.dispense(20, d)
            m50.move_to(d.bottom(z=8))
            ctx.delay(seconds=3)
            m50.blow_out()
            m50.touch_tip(v_offset=-5, radius=0.75)
            m50.drop_tip() if real_mode else m50.return_tip()

        samples = final_samples

        # -- MOVE OLD SAMPLE PLATE OFF DECK
        ctx.move_labware(labware=fresh_plate, new_location=chute, use_gripper=True)  # OR MOVE IT WITH CHUTE?

        # -- MOVE NEW SAMPLE PLATE TO TEMPERATURE MODULE
        ctx.move_labware(labware=final_plate, new_location=sample_temp_adapter, use_gripper=True)

        pause("Protocol completed! Samples are on left half of the plate on the temperature module, on slot D1.")

        ########################### END FOURTH BEAD WASH #############################
        ########################### END FOURTH BEAD WASH #############################
        ########################### END FOURTH BEAD WASH #############################

    # Assigning Liquid and colors
    end_prep_mmx_liq = ctx.define_liquid(
        name="Beads",
        description="Beads",
        display_color="#7EFF42",
    )
    adapters_liq = ctx.define_liquid(
        name="Adapters",
        description="Adapters",
        display_color="#50D5FF",
    )
    eb_liq = ctx.define_liquid(
        name="Elution Buffer",
        description="Elution Buffer",
        display_color="#B925FF",
    )
    tet2_liq = ctx.define_liquid(
        name="TET2",
        description="TET2",
        display_color="#FF9900",
    )
    fe2_liq = ctx.define_liquid(
        name="FE2",
        description="FE2",
        display_color="#0019FF",
    )
    formamide_liq = ctx.define_liquid(
        name="FORMAMIDE",
        description="FORMAMIDE",
        display_color="#007AFF",
    )
    beads_liq = ctx.define_liquid(
        name="BEADS",
        description="BEADS",
        display_color="#FF0076",
    )
    apobec_liq = ctx.define_liquid(
        name="APOBEC",
        description="APOBEC",
        display_color="#00FFBC",
    )
    ethanol_liq = ctx.define_liquid(
        name="ETHANOL",
        description="ETHANOL",
        display_color="#00AAFF",
    )
    samples_liq = ctx.define_liquid(
        name="SAMPLES",
        description="SAMPLES",
        display_color="#008000",
    )

    for column in sample_plate.columns()[:num_col]:
        for well in column:
            well.load_liquid(liquid=samples_liq, volume=50)

    for well in temp_reag_plate.columns()[0]:
        well.load_liquid(liquid=end_prep_mmx_liq, volume=10 * 1.15 * num_col)
    for well in temp_reag_plate.columns()[1]:
        well.load_liquid(liquid=adapters_liq, volume=31 * 1.15 * num_col)
    for column, column_volume in zip(temp_reag_plate.columns()[2:6], [29, 17.5, 21, 21]):
        for well in column:
            well.load_liquid(liquid=eb_liq, volume=column_volume)
    for well in temp_reag_plate.columns()[6]:
        well.load_liquid(liquid=tet2_liq, volume=17 * 1.15 * num_col)
    for well in temp_reag_plate.columns()[7]:
        well.load_liquid(liquid=fe2_liq, volume=5 * 1.15 * num_col)
    for well in temp_reag_plate.columns()[8]:
        well.load_liquid(liquid=formamide_liq, volume=5 * 1.15 * num_col)

    for well in reag_res.wells()[1 : 1 + num_ethanol_wells]:
        well.load_liquid(liquid=ethanol_liq, volume=10000)

    if num_col <= 3:
        for well in deep_reag_plate.columns()[0]:
            well.load_liquid(liquid=beads_liq, volume=345 * 1.15 * num_col)
    else:
        for column in deep_reag_plate.columns()[:2]:
            for well in deep_reag_plate.columns()[0]:
                well.load_liquid(liquid=beads_liq, volume=345 * 1.15 * num_col / 2)

    for well in deep_reag_plate.columns()[2]:
        well.load_liquid(liquid=apobec_liq, volume=80 * 1.15 * num_col)
