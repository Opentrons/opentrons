def get_values(*names):
    import json
    _all_values = json.loads("""{"num_samples": 48, "starting_vol": 400, "elution_vol": 100, "binding_buffer_vol": 600, "bead_vol": 25, "wash1_vol": 600, "wash2_vol": 600, "wash3_vol": 600, "wash4_vol": 0, "mix_reps_bind": 25, "mix_reps_wash": 20, "mix_reps_elu": 25, "sep_time_bind": 5, "sep_time_wash": 2, "sep_time_elu": 5, "dry_time": 30, "tip_track": 0}""")
    return [_all_values[n] for n in names]


import json
import math
import os

from opentrons.types import Point

metadata = {
    "protocolName": "NucleoMag_DNA_Food_Rev01",
    "author": "Macherey-Nagel <automation-bio@mn-net.com>",
    "apiLevel": "2.9",
}


def run(ctx):
    """
    Variable definition
    """
    [
        num_samples,
        starting_vol,
        elution_vol,
        binding_buffer_vol,
        bead_vol,
        wash1_vol,
        wash2_vol,
        wash3_vol,
        wash4_vol,
        mix_reps_bind,
        mix_reps_wash,
        mix_reps_elu,
        sep_time_bind,
        sep_time_wash,
        sep_time_elu,
        dry_time,
        tip_track,
    ] = [48, 400, 100, 600, 25, 600, 600, 600, 0, 25, 20, 25, 5, 2, 5, 30, False]
    total_vol_per_sample = starting_vol + binding_buffer_vol + wash1_vol + wash2_vol + wash3_vol + wash4_vol
    run_liq_waste_vol = num_samples * total_vol_per_sample
    Mag_height_SQW = 5.5
    bottom_tolerance = 2.8
    max_num_sample = 48
    max_num_columns = max_num_sample // 8
    """
    End of Variable Definition
    """
    """
    define minimum & maximum volumes
    """
    if not 350 <= starting_vol <= 500:
        raise Exception("Starting volume should be from 350 - 500Âµl.")
    if not 50 <= elution_vol <= 200:
        raise Exception("Elution volume should be from 50 - 200Âµl.")
    if not run_liq_waste_vol <= 290000:
        raise Exception("Number of samples exceeds maximum liquid waste volume of 400mL.")
    if not num_samples <= max_num_sample:
        raise Exception("Number of samples exceeds maximum number of 48 samples.")
    """
    End of defining minimum & maximum volumes
    """
    """
    Deck and Labware definition
    """
    magdeck = ctx.load_module("magnetic module gen2", "10")
    magdeck.disengage()
    sep_plate = magdeck.load_labware("96_squarewell_block_macherey_nagel", "Separation Plate")
    liquid_waste = ctx.load_labware("agilent_1_reservoir_290ml", "11", "Liquid Waste").wells()[0].top()
    elution_plate = ctx.load_labware("96_elutionplate_ubottom_by_macherey_nagel", "1", "Elution Plate")
    tips300 = [
        ctx.load_labware("opentrons_96_tiprack_300ul", slot, "300Âµl filtertiprack") for slot in ["2", "3", "5", "6"]
    ]
    tips1000 = ctx.load_labware("opentrons_96_tiprack_1000ul", "9", "1000Âµl filtertiprack")
    num_cols = math.ceil(num_samples / 8)
    parkingrack = ctx.load_labware("opentrons_96_tiprack_300ul", "8", "empty tiprack for parking")
    parking_spots = parkingrack.rows()[0][:num_cols]
    buffers = ctx.load_labware("usascientific_12_reservoir_22ml", "7", "NucleoMag Buffers")
    beads = ctx.load_labware("opentrons_24_tuberack_generic_2ml_screwcap", "4", "NucleoMag B-Beads").wells()[0]
    """
    End of Deck and Labware definition
    """
    """
    Define reagents

        Well 1 & 2 Binding Buffer CB
        Well 3 & 4 Wash Buffer CMW for 1st Wash
        Well 5 & 6 Wash Buffer CQW for 2nd Wash
        Well 7 & 8 Wash Buffer 80% Ethanol for 3rd Wash
        Well 9 & 10 empty Placeholder for optional 4th wash
        Well 11 empty
        Well 12 Elution Buffer CE

    """
    binding_buffer = buffers.wells()[:2]
    wash1 = buffers.wells()[2:4]
    wash2 = buffers.wells()[4:6]
    wash3 = buffers.wells()[6:8]
    buffers.wells()[8:10]
    buffers.wells()[10]
    elution_buffer = buffers.wells()[11]
    """
    End of reagent definition
    """
    """
    tool configuration
    """
    m300 = ctx.load_instrument("p300_multi_gen2", "left", tip_racks=tips300)
    s1000 = ctx.load_instrument("p1000_single_gen2", "right", tip_racks=[tips1000])
    """
    End of tool configuration
    """
    """
    Value calculations
    """
    mag_samples_s = sep_plate.wells()[:num_samples]
    mag_samples_m = sep_plate.rows()[0][:num_cols]
    elution_samples_m = elution_plate.rows()[0][:num_cols]
    """
    End of Calculations
    """
    m300.flow_rate.aspirate = 100
    m300.flow_rate.dispense = 150
    m300.flow_rate.blow_out = 200
    s1000.flow_rate.aspirate = 750
    s1000.flow_rate.dispense = 900
    m300.well_bottom_clearance.aspirate = 5
    m300.well_bottom_clearance.dispense = 25
    """
    tip logging and waste handling
    """
    folder_path = "/data/B"
    tip_file_path = folder_path + "/tip_log.json"
    tip_log = {"count": {}}
    if tip_track and not ctx.is_simulating():
        if os.path.isfile(tip_file_path):
            with open(tip_file_path) as json_file:
                data = json.load(json_file)
                if "tips300" in data:
                    tip_log["count"][m300] = data["tips300"]
                else:
                    tip_log["count"][m300] = 0
        else:
            tip_log["count"][m300] = 0
    else:
        tip_log["count"] = {m300: 0}
    tip_log["tips"] = {m300: [tip for rack in tips300 for tip in rack.rows()[0]]}
    tip_log["max"] = {m300: len(tip_log["tips"][m300])}

    def _pick_up(pip, loc=None):
        nonlocal tip_log
        if tip_log["count"][pip] == tip_log["max"][pip] and not loc:
            ctx.pause("Replace " + str(pip.max_volume) + "Âµl tipracks before \\ resuming.")
            pip.reset_tipracks()
            tip_log["count"][pip] = 0
        if loc:
            pip.pick_up_tip(loc)
        else:
            pip.pick_up_tip(tip_log["tips"][pip][tip_log["count"][pip]])
            tip_log["count"][pip] += 1

    switch = True
    drop_count = 0
    drop_threshold = 192

    def _drop(pip):
        nonlocal switch
        nonlocal drop_count
        side = 30 if switch else -18
        drop_loc = ctx.loaded_labwares[12].wells()[0].top().move(Point(x=side))
        pip.drop_tip(drop_loc)
        switch = not switch
        drop_count += 8
        if drop_count == drop_threshold:
            m300.home()
            ctx.pause("Please empty tips from waste before resuming.")
            ctx.home()
            drop_count = 0

    waste_vol = 0
    waste_threshold = 300000
    """
    End of tip logging and wase handling
    """

    def remove_supernatant(vol, reuse=False, restore=False, last=False, blowout=True):
        """
        `remove_supernatant` will transfer supernatant from the deepwell
        extraction plate to the liquid waste reservoir.
        :param vol (float): The amount of volume to aspirate from all deepwell
                            sample wells and dispense in the liquid waste.
        :param reuse (boolean): Whether to pick up previously restored sample-corresponding tips
                               from the 'parking rack' or to pick up new tips.
        :param restore (boolean): Whether to park used tips in the 'parking rack' or discard them to waste.
        :param last (boolean): Does perform the supernatant removal at the lowest hight possible with an extra over aspiration volume for the last wash step to optimize drying performance
        """

        def _waste_track(vol):
            nonlocal waste_vol
            if waste_vol + vol >= waste_threshold:
                ctx.pause("Please empty liquid waste (slot 11) before \\ resuming.")
                ctx.home()
                waste_vol = 0
            waste_vol += vol

        if last:
            vol = vol + 60
        num_trans = math.ceil(vol / 200)
        vol_per_trans = vol / num_trans
        m300.flow_rate.aspirate = 15
        m300.flow_rate.dispense = 90
        for i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
            if reuse:
                _pick_up(m300, spot)
            else:
                _pick_up(m300)
            side = -1 if i % 2 == 0 else 1
            for _ in range(num_trans):
                _waste_track(vol_per_trans * 8)
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume, m.top(-10))
                m300.move_to(m.center())
                if _ == num_trans - 1:
                    if last:
                        loc = m.bottom(0.7).move(Point(x=side * 0.5))
                    else:
                        loc = m.bottom(0.8).move(Point(x=side * 0.7))
                else:
                    loc = m.bottom(1.0).move(Point(x=side * 1))
                m300.transfer(vol_per_trans, loc, liquid_waste, new_tip="never", air_gap=20)
                if _ == num_trans - 1:
                    if blowout:
                        m300.blow_out(liquid_waste)
                        m300.aspirate(20, liquid_waste)
                else:
                    if blowout:
                        m300.blow_out(liquid_waste)
                    m300.aspirate(20, liquid_waste)
            if last:
                m300.aspirate(20, m.bottom(0.6))
                m300.aspirate(20, m.bottom(0.7))
                m300.aspirate(20, m.bottom(0.8))
                m300.dispense(m300.current_volume, liquid_waste)
                m300.aspirate(20, liquid_waste)
            if restore:
                m300.drop_tip(spot)
            else:
                _drop(m300)
        m300.flow_rate.aspirate = 90
        m300.flow_rate.dispense = 150

    def bind(vol, bead_vol, reuse=True, restore=False):
        """
        `bind` will perform magnetic bead binding on each sample in the
        deepwell plate. The binding beads will be mixed before
        transfer (with s1000 tool), and the samples will be mixed with the binding beads after
        the transfer (with m300 tool). The magnetic deck activates after the addition to all
        samples, and the supernatant is removed after bead binding.
        :param vol (float): Amount of volume of Binding Buffer to add to each well.
        :param bead_vol (float): The amount of volume of NucleoMag B-Beads to dispense to each well.
        :param reuse (boolean): Whether to save sample-corresponding tips
                               between adding binding buffer and removing the supernatant
        :param restore (boolean): Whether to save sample-corresponding tips for reuse in the next stepre
        """
        if magdeck.status == "engaged":
            magdeck.disengage()
        bead_aspirate_vol_total = num_samples * bead_vol + 50
        if bead_aspirate_vol_total >= 800:
            bead_aspirate_vol = bead_aspirate_vol_total / 2
        else:
            bead_aspirate_vol = bead_aspirate_vol_total
        bead_mix_vol_temp = num_samples * bead_vol
        if bead_mix_vol_temp >= 900:
            bead_mix_vol = 900
        else:
            bead_mix_vol = bead_mix_vol_temp - 100
        air_gap_vol = 20
        bead_dispense_vol = bead_vol + air_gap_vol
        s1000.pick_up_tip()
        for _x in range(3):
            s1000.aspirate(bead_mix_vol, beads.bottom(5))
            s1000.dispense(bead_mix_vol, beads.bottom(5))
        for _x in range(7):
            s1000.aspirate(bead_mix_vol, beads.bottom(3))
            s1000.dispense(bead_mix_vol, beads.bottom(3))
        s1000.aspirate(bead_aspirate_vol, beads.bottom(3))
        s1000.air_gap(air_gap_vol)
        s1000.flow_rate.dispense = 1000
        for loop, well in enumerate(mag_samples_s):
            if loop == 24:
                s1000.aspirate(bead_aspirate_vol, beads.bottom(3))
            s1000.dispense(bead_dispense_vol, well.top(-2))
            s1000.air_gap(air_gap_vol)
        for i, (well, spot) in enumerate(zip(mag_samples_m, parking_spots)):
            _pick_up(m300)
            num_trans = math.ceil(vol / 200)
            vol_per_trans = vol / num_trans
            m300.flow_rate.aspirate = 100
            for t in range(num_trans):
                src = binding_buffer[i // (max_num_columns // len(binding_buffer))]
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume, src.top())
                m300.aspirate(vol_per_trans, src.bottom(bottom_tolerance))
                m300.aspirate(20, src.top(2))
                ctx.delay(seconds=5, msg="drop delay")
                m300.dispense(vol_per_trans + 20, well.top(-3))
                if t < num_trans - 1:
                    m300.air_gap(20)
            side = 1 if i % 2 == 0 else -1
            loc_mix_asp_bottom = well.bottom(2)
            loc_mix_asp_top = well.bottom(5)
            loc_mix_dis_bottom = well.bottom(1)
            loc_mix_dis_pellet = well.bottom(1.5).move(Point(x=side * 0.8))
            loc_mix_dis_top = well.bottom(15)
            """ optimized mix """
            m300.flow_rate.aspirate = 60
            m300.flow_rate.dispense = 300
            for _x in range(10):
                m300.aspirate(250, loc_mix_asp_top)
                m300.dispense(250, loc_mix_dis_pellet)
            for _x in range(2):
                m300.aspirate(200, loc_mix_asp_top)
                m300.dispense(200, loc_mix_dis_bottom)
            m300.flow_rate.aspirate = 150
            for _x in range(mix_reps_bind - 7):
                m300.aspirate(250, loc_mix_asp_bottom)
                m300.dispense(250, loc_mix_dis_top)
            m300.flow_rate.aspirate = 100
            m300.flow_rate.dispense = 200
            """ end of optimized mix """
            m300.aspirate(15, well.top(-10))
            ctx.delay(seconds=3, msg="Blow out delay")
            m300.dispense(15, well.top(-10))
            m300.blow_out(well.bottom(22))
            m300.air_gap(5)
            if reuse:
                m300.drop_tip(spot)
            else:
                _drop(m300)
        ctx.delay(minutes=2, msg="Incubate for 2 minutes")
        magdeck.engage(height=Mag_height_SQW)
        ctx.delay(minutes=sep_time_bind, msg="Incubating on MagDeck for " + str(sep_time_bind) + " minutes.")
        remove_supernatant(vol + bead_vol + starting_vol, reuse=reuse, restore=restore, last=False)

    def wash(vol, source, mix_reps=mix_reps_wash, reuse=True, restore=True, resuspend=True, last=False, blowout=True):
        """
        `wash` will perform bead washing for the extraction protocol.
        :param vol (float): The amount of volume to aspirate from each
                            source and dispense to each well containing beads.
        :param source (List[Well]): A list of wells from where liquid will be
                                    aspirated. If the length of the source list
                                    > 1, `wash` automatically calculates
                                    the index of the source that should be
                                    accessed.
        :param mix_reps (int): The number of repititions to mix the beads with
                               specified wash buffer (ignored if resuspend is
                               False).
        :param reuse (boolean): Whether to pick-up sample-corresponding tips for mixing and supernatant removal
                                that were restored in a previous step.
        :param restore (boolean): Whether to park sample-corresponding tips for reuse in a later step
        :param resuspend (boolean): Whether to resuspend beads in wash buffer.
        """
        if resuspend and magdeck.status == "engaged":
            magdeck.disengage()
        num_trans = math.ceil(vol / 250)
        vol_per_trans = vol / num_trans
        if reuse:
            _pick_up(m300)
            for i, m in enumerate(mag_samples_m):
                src = source[i // (max_num_columns // len(source))]
                for n in range(num_trans):
                    if m300.current_volume > 0:
                        m300.dispense(m300.current_volume, src.top())
                    m300.aspirate(vol_per_trans, src.bottom(bottom_tolerance))
                    m300.aspirate(20, src.top(2))
                    ctx.delay(seconds=5, msg="drop delay")
                    m300.dispense(vol_per_trans + 20, m.top())
                    if n < num_trans - 1:
                        m300.air_gap(20)
            _drop(m300)
            if resuspend:
                m300.flow_rate.aspirate = 220
                m300.flow_rate.dispense = 300
                for i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
                    _pick_up(m300, spot)
                    side = 1 if i % 2 == 0 else -1
                    """ new mix locations """
                    loc_mix_asp_bottom = m.bottom(1.5)
                    loc_mix_asp_top = m.bottom(5)
                    loc_mix_dis_pellet = m.bottom(1.5).move(Point(x=side * 0.8))
                    loc_mix_dis_top = m.bottom(12)
                    """ end of new mix locations """
                    src = source[i // (10 // len(source))]
                    """ optimized mix """
                    for _x in range(10):
                        m300.aspirate(250, loc_mix_asp_top)
                        m300.dispense(250, loc_mix_dis_pellet)
                    for _x in range(mix_reps - 5):
                        m300.aspirate(250, loc_mix_asp_bottom)
                        m300.dispense(250, loc_mix_dis_top)
                    """ end of optimized mix """
                    m300.blow_out(m.bottom(13))
                    m300.air_gap(20)
                    m300.drop_tip(spot)
                m300.flow_rate.aspirate = 100
                m300.flow_rate.dispense = 200
        else:
            for i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
                _pick_up(m300)
                side = 1 if i % 2 == 0 else -1
                """ new mix locations """
                loc_mix_asp_bottom = m.bottom(1.5)
                loc_mix_asp_top = m.bottom(5)
                loc_mix_dis_bottom = m.bottom(1)
                loc_mix_dis_pellet = m.bottom(1.5).move(Point(x=side * 0.8))
                loc_mix_dis_top = m.bottom(12)
                """ end of new mix locations """
                src = source[i // (10 // len(source))]
                for n in range(num_trans):
                    if m300.current_volume > 0:
                        m300.dispense(m300.current_volume, src.top())
                    m300.transfer(vol_per_trans, src.bottom(bottom_tolerance), m.top(), air_gap=20, new_tip="never")
                    if n < num_trans - 1:
                        m300.air_gap(20)
                if resuspend:
                    m300.flow_rate.aspirate = 80
                    m300.flow_rate.dispense = 300
                    """ optimized mix """
                    for _x in range(10):
                        m300.aspirate(250, loc_mix_asp_top)
                        m300.dispense(250, loc_mix_dis_pellet)
                    for _x in range(2):
                        m300.aspirate(200, loc_mix_asp_top)
                        m300.dispense(200, loc_mix_dis_bottom)
                    for _x in range(mix_reps - 7):
                        m300.aspirate(250, loc_mix_asp_bottom)
                        m300.dispense(250, loc_mix_dis_top)
                    """ end of optimized mix """
                    m300.flow_rate.aspirate = 120
                    m300.flow_rate.dispense = 200
                m300.blow_out(m.bottom(13))
                m300.air_gap(20)
                m300.drop_tip(spot)
        if magdeck.status == "disengaged":
            magdeck.engage(height=Mag_height_SQW)
        ctx.delay(minutes=sep_time_wash, msg="Incubating on MagDeck for " + str(sep_time_wash) + " minutes.")
        remove_supernatant(vol, reuse=True, restore=restore, last=last, blowout=blowout)

    def elute(vol):
        """
        `elute` will perform elution from the deepwell extraciton plate to the
        final clean elutions PCR plate to complete the extraction protocol.
        :param vol (float): The amount of volume to aspirate from the elution
                            buffer source and dispense to each well containing
                            beads.
        """
        magdeck.disengage()
        for i, m in enumerate(mag_samples_m):
            _pick_up(m300)
            side = 1 if i % 2 == 0 else -1
            loc_mix_asp_bottom = m.bottom(1.2)
            loc_mix_dis_pellet = m.bottom(1.5).move(Point(x=side * 1.5))
            m300.aspirate(vol, elution_buffer.bottom(bottom_tolerance))
            m300.move_to(m.center())
            m300.dispense(vol, loc_mix_dis_pellet)
            m300.flow_rate.aspirate = 220
            m300.flow_rate.dispense = 300
            for _mix in range(mix_reps_elu):
                m300.aspirate(0.8 * vol, loc_mix_asp_bottom)
                m300.dispense(0.8 * vol, loc_mix_dis_pellet)
            m300.flow_rate.aspirate = 60
            m300.flow_rate.dispense = 100
            m300.blow_out(m.bottom(7))
            m300.air_gap(20)
            _drop(m300)
        magdeck.engage(height=Mag_height_SQW)
        ctx.delay(minutes=sep_time_elu, msg="Incubating on MagDeck for " + str(sep_time_elu) + " minutes.")
        m300.flow_rate.aspirate = 30
        for i, (m, e) in enumerate(zip(mag_samples_m, elution_samples_m)):
            _pick_up(m300)
            side = -1 if i % 2 == 0 else 1
            loc = m.bottom(0.9).move(Point(x=side * 0.8))
            m300.transfer(vol, loc, e.bottom(5), air_gap=20, new_tip="never")
            m300.blow_out(e.top(-1))
            m300.air_gap(10)
            m300.drop_tip()
        magdeck.disengage()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    bind(binding_buffer_vol, bead_vol, reuse=True, restore=False)
    wash(wash1_vol, wash1, reuse=False, restore=False, resuspend=True, last=False, blowout=False)
    wash(wash2_vol, wash2, reuse=False, restore=False, resuspend=True, last=False, blowout=False)
    wash(wash3_vol, wash3, reuse=False, restore=False, resuspend=True, last=True, blowout=False)
    ctx.delay(minutes=dry_time, msg="Air dry")
    elute(elution_vol)
    if tip_track and not ctx.is_simulating():
        if not os.path.isdir(folder_path):
            os.mkdir(folder_path)
        data = {"tips300": tip_log["count"][m300]}
        with open(tip_file_path, "w") as outfile:
            json.dump(data, outfile)
