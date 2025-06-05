def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "num_samples", "type": "int", "label": "Number of Samples [1-48 samples]", "default": 48}, {"name": "starting_vol", "type": "int", "label": "Starting Volume", "default": 100}, {"name": "elution_vol", "type": "int", "label": "Elution Volume", "default": 30}, {"name": "NGS_bead_ratio1", "type": "float", "label": "NGS Bead Ratio 1", "default": 0.4}, {"name": "NGS_bead_ratio2", "type": "float", "label": "NGS Bead Ratio 2", "default": 0.6}, {"name": "wash1_vol", "type": "int", "label": "Wash 1 Volume", "default": 200}, {"name": "wash2_vol", "type": "int", "label": "Wash 2 Volume", "default": 200}, {"name": "mix_reps_bind", "type": "int", "label": "Mix Repetitions During Binding [pretested default, changing is not recommended]", "default": 15}, {"name": "mix_reps_wash", "type": "int", "label": "Mix Repetitions during Wash [pretested default, changing is not recommended]", "default": 10}, {"name": "mix_reps_elu", "type": "int", "label": "Mix Repetitions during Elution [pretested default, changing is not recommended]", "default": 20}, {"name": "sep_time", "type": "int", "label": "Separation Time during Wash [pretested default, changing is not recommended]", "default": 5}, {"name": "dry_time", "type": "int", "label": "Time for Air Dry [pretested default, changing is not recommended]", "default": 10}, {"name": "tip_track", "type": "dropDown", "label": "Track Tips Between Runs", "options": [{"label": "No", "value": 0}, {"label": "Yes", "value": 1}]}]""")
    return [_all_values[n] for n in names]


import json
import math
import os

from opentrons.types import Point

metadata = {
    "protocolName": "NucleoMag_NGS_double-size_select_Rev01",
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
        NGS_bead_ratio1,
        NGS_bead_ratio2,
        wash1_vol,
        wash2_vol,
        mix_reps_bind,
        mix_reps_wash,
        mix_reps_elu,
        sep_time,
        dry_time,
        tip_track,
    ] = get_values(
        "num_samples",
        "starting_vol",
        "elution_vol",
        "NGS_bead_ratio1",
        "NGS_bead_ratio2",
        "wash1_vol",
        "wash2_vol",
        "mix_reps_bind",
        "mix_reps_wash",
        "mix_reps_elu",
        "sep_time",
        "dry_time",
        "tip_track",
    )
    NGS_bead_ratio_difference = NGS_bead_ratio2 - NGS_bead_ratio1
    NGS_bead_vol1 = starting_vol * NGS_bead_ratio1
    NGS_bead_vol2 = starting_vol * NGS_bead_ratio_difference
    supernatant_Bind1 = starting_vol + NGS_bead_vol1
    supernatant_Bind2 = supernatant_Bind1 + NGS_bead_vol2
    Mag_height_elution_plate = 8.0
    bottom_tolerance = 2.8
    """
    End of Variable Definition
    """
    """
    define minimum & maximum volumes
    """
    if not 90 <= starting_vol <= 110:
        raise Exception("Starting volume should be from 90-110Âµl.")
    if not 10 <= elution_vol <= 50:
        raise Exception("Elution volume should be from 10-50Âµl.")
    if not num_samples <= 48:
        raise Exception("Number of samples should not exceed 48")
    """
    End of defining minimum & maximum volumes
    """
    """
    Deck and Labware definition
    """
    magdeck = ctx.load_module("magnetic module gen2", "10")
    magdeck.disengage()
    sep_plate = magdeck.load_labware("96_elutionplate_ubottom_by_macherey_nagel", "Separation Plate")
    liquid_waste = ctx.load_labware("agilent_1_reservoir_290ml", "11", "Liquid Waste").wells()[0].top()
    elution_plate = ctx.load_labware("96_elutionplate_ubottom_by_macherey_nagel", "1", "Elution Plate")
    tips300 = [
        ctx.load_labware("opentrons_96_tiprack_300ul", slot, "300Âµl filtertiprack") for slot in ["2", "3", "5", "6"]
    ]
    num_cols = math.ceil(num_samples / 8)
    parkingrack = ctx.load_labware("opentrons_96_tiprack_300ul", "8", "empty tiprack for parking")
    parking_spots = parkingrack.rows()[0][:num_cols]
    buffers = ctx.load_labware("usascientific_12_reservoir_22ml", "7", "NucleoMag Buffers")
    """
    End of Deck and Labware definition
    """
    """
    Define reagents

        Well 1 NGS Bead Suspension
        Well 2 80% Ethanol
        Well 3 80% Ethanol
        Well 4 empty place holder
        Well 12 Elution Buffer / Water

    """
    NGS_Beads = buffers.wells()[0]
    wash1 = buffers.wells()[1]
    wash2 = buffers.wells()[2]
    elution_buffer = buffers.wells()[11]
    """
    End of reagent definition
    """
    """
    tool configuration
    """
    m300 = ctx.load_instrument("p300_multi_gen2", "left", tip_racks=tips300)
    """
    End of tool configuration
    """
    """
    Value calculations
    """
    mag_samples_lm = sep_plate.rows()[0][:num_cols]
    right_side_of_sep_plate = 6 + num_cols
    mag_samples_m = sep_plate.rows()[0][6:right_side_of_sep_plate]
    elution_samples_m = elution_plate.rows()[0][:num_cols]
    """
    End of Calculations
    """
    m300.flow_rate.aspirate = 100
    m300.flow_rate.dispense = 150
    m300.flow_rate.blow_out = 200
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
            ctx.pause("Replace " + str(pip.max_volume) + "Âµl tipracks before             resuming.")
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

    def remove_supernatant(vol, reuse=False, restore=False, last=False):
        """
        `remove_supernatant` will transfer supernatant from the deepwell
        extraction plate to the liquid waste reservoir.
        :param vol (float): The amount of volume to aspirate from all deepwell
                            sample wells and dispense in the liquid waste.
        :param park (boolean): Whether to pick up sample-corresponding tips
                               in the 'parking rack' or to pick up new tips.
        """

        def _waste_track(vol):
            nonlocal waste_vol
            if waste_vol + vol >= waste_threshold:
                ctx.pause("Please empty liquid waste (slot 11) before                 resuming.")
                ctx.home()
                waste_vol = 0
            waste_vol += vol

        if last:
            vol = vol + 20
        num_trans = math.ceil(vol / 200)
        vol_per_trans = vol / num_trans
        for _i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
            if reuse:
                _pick_up(m300, spot)
            else:
                _pick_up(m300)
            for _ in range(num_trans):
                _waste_track(vol_per_trans * 8)
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume, m.top(-10))
                m300.move_to(m.center())
                if _ == num_trans - 1:
                    if last:
                        loc = m.bottom(0.3)
                    else:
                        loc = m.bottom(0.5)
                else:
                    loc = m.bottom(0.7)
                m300.flow_rate.aspirate = 20
                m300.flow_rate.dispense = 120
                m300.transfer(vol_per_trans, loc, liquid_waste, new_tip="never", air_gap=20)
                m300.flow_rate.dispense = 200
                m300.blow_out(liquid_waste)
            if restore:
                m300.drop_tip(spot)
            else:
                _drop(m300)
        m300.flow_rate.aspirate = 120
        m300.flow_rate.aspirate = 150

    def remove_small_fragments(bead_vol):
        """
        `remove_small_fragments` will perform magnetic bead binding on each
        sample in the plate right half.
        The binding beads will be mixed before transfer, and the samples will
        be mixed with the binding beads after
        the transfer. The magnetic deck activates after the addition to all
        samples, and the supernatant is removed after bead binding.
        :param bead_vol (float): The amount of volume of NGS_Bead_Suspension to
        dispense to each well.
        :param reuse (boolean): Whether to save sample-corresponding tips
        between adding binding buffer and removing the supernatant
        :param restore (boolean): Whether to save sample-corresponding tips
        for reuse in the next step
        """
        if magdeck.status == "engaged":
            magdeck.disengage()
        for _i, (well, _spot) in enumerate(zip(mag_samples_m, parking_spots)):
            _pick_up(m300)
            if m300.current_volume > 0:
                m300.dispense(m300.current_volume, NGS_Beads.top())
            m300.flow_rate.aspirate = 10
            m300.aspirate(bead_vol / 2, NGS_Beads.bottom(bottom_tolerance))
            ctx.delay(seconds=2)
            m300.flow_rate.dispense = 20
            m300.dispense(bead_vol / 2, NGS_Beads.bottom(bottom_tolerance))
            ctx.delay(seconds=2)
            m300.flow_rate.dispense = 60
            m300.aspirate(bead_vol, NGS_Beads.bottom(bottom_tolerance))
            ctx.delay(seconds=2)
            m300.dispense(bead_vol, well.top(-3))
            m300.flow_rate.aspirate = 100
            m300.flow_rate.dispense = 150
            loc_mix = well.bottom(0.8)
            m300.mix(mix_reps_bind, supernatant_Bind2 - 10, loc_mix)
            m300.aspirate(15, well.top(-1))
            ctx.delay(seconds=6, msg="Blow out delay")
            m300.dispense(15, well.top(-1))
            m300.blow_out(well.top(-1))
            m300.air_gap(20)
            _drop(m300)
        ctx.delay(minutes=1, msg="Incubate for 1 minutes")
        magdeck.engage(height=Mag_height_elution_plate)
        ctx.delay(minutes=sep_time, msg="Incubating on MagDeck for " + str(sep_time) + " minutes.")
        remove_supernatant(supernatant_Bind2 + 5, reuse=False, restore=False, last=False)

    def remove_big_fragments(bead_vol):
        """
        `remove_big_fragments` will perform magnetic bead binding on each
        sample in the plate left half.
        The binding beads will be mixed before transfer, and the samples will
        be mixed with the binding beads after
        the transfer. The magnetic deck activates after the addition to all
        samples, and the supernatant is transfered to the right half of the
        plate for further processing.
        :param bead_vol (float): The amount of volume of NGS_Bead_Suspension to
        dispense to each well.
        :param reuse (boolean): Whether to save sample-corresponding tips
        between adding binding buffer and removing the supernatant
        :param restore (boolean): Whether to save sample-corresponding tips for
        reuse in the next stepre
        """
        _pick_up(m300)
        for _ in range(5):
            m300.aspirate(100, NGS_Beads.bottom(bottom_tolerance))
            m300.dispense(100, NGS_Beads.bottom(bottom_tolerance))
        m300.aspirate(5, NGS_Beads.top(-10))
        ctx.delay(seconds=1, msg="Blow out delay")
        m300.dispense(5, NGS_Beads.top(-10))
        m300.flow_rate.blow_out = 80
        m300.blow_out(NGS_Beads.top(-10))
        m300.flow_rate.blow_out = 200
        _drop(m300)
        for _i, (well, _spot) in enumerate(zip(mag_samples_lm, parking_spots)):
            _pick_up(m300)
            if m300.current_volume > 0:
                m300.dispense(m300.current_volume, NGS_Beads.top())
            m300.flow_rate.aspirate = 10
            m300.aspirate(bead_vol / 2, NGS_Beads.bottom(bottom_tolerance))
            ctx.delay(seconds=2)
            m300.flow_rate.dispense = 20
            m300.dispense(bead_vol / 2, NGS_Beads.bottom(bottom_tolerance))
            ctx.delay(seconds=2)
            m300.flow_rate.dispense = 60
            m300.aspirate(bead_vol, NGS_Beads.bottom(bottom_tolerance))
            ctx.delay(seconds=2)
            m300.move_to(NGS_Beads.top(-3))
            m300.dispense(bead_vol, well.top(-3))
            m300.flow_rate.aspirate = 100
            m300.flow_rate.dispense = 150
            loc_mix = well.bottom(1)
            m300.mix(mix_reps_bind, supernatant_Bind1 - 10, loc_mix)
            m300.aspirate(15, well.top(-1))
            ctx.delay(seconds=6, msg="Blow out delay")
            m300.dispense(15, well.top(-1))
            m300.blow_out(well.top(-1))
            m300.air_gap(20)
            _drop(m300)
        ctx.delay(minutes=1, msg="Incubate for 1 minutes")
        magdeck.engage(height=Mag_height_elution_plate)
        ctx.delay(minutes=sep_time, msg="Incubating on MagDeck for " + str(sep_time) + " minutes.")
        m300.flow_rate.aspirate = 20
        m300.flow_rate.dispense = 75
        for _j, (left, right, _spot) in enumerate(zip(mag_samples_lm, mag_samples_m, parking_spots)):
            _pick_up(m300)
            m300.transfer(supernatant_Bind1 + 5, left.bottom(0.2), right.bottom(4), air_gap=10, new_tip="never")
            _drop(m300)
        m300.flow_rate.aspirate = 100
        m300.flow_rate.dispense = 150

    def wash(vol, source, mix_reps=mix_reps_wash, reuse=True, restore=True, resuspend=True, last=False):
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
        :param reuse (boolean): Whether to pick-up sample-corresponding tips
            for mixing and supernatant removal
            that were restored in a previous step.
        :param restore (boolean): Whether to park sample-corresponding tips for
            reuse in a later step
        :param resuspend (boolean): Whether to resuspend beads in wash buffer.
        """
        if resuspend and magdeck.status == "engaged":
            magdeck.disengage()
        num_trans = math.ceil(vol / 250)
        vol_per_trans = vol / num_trans
        if reuse:
            _pick_up(m300)
            for _i, m in enumerate(mag_samples_m):
                src = source
                for n in range(num_trans):
                    if m300.current_volume > 0:
                        m300.dispense(m300.current_volume, src.top())
                    m300.flow_rate.dispense = 80
                    m300.transfer(vol_per_trans, src.bottom(bottom_tolerance), m.top(), air_gap=20, new_tip="never")
                    if n < num_trans - 1:
                        m300.air_gap(20)
            _drop(m300)
            if resuspend:
                m300.flow_rate.aspirate = 160
                m300.flow_rate.dispense = 160
                for i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
                    _pick_up(m300, spot)
                    side = 1 if i % 2 == 0 else -1
                    loc_mix = m.bottom(1).move(Point(x=side * 0.5))
                    src = source
                    for _rep in range(mix_reps):
                        m300.aspirate(250, loc_mix)
                        m300.dispense(250, loc_mix)
                    m300.blow_out(m.top(-2))
                    m300.air_gap(20)
                    m300.drop_tip(spot)
                m300.flow_rate.aspirate = 100
                m300.flow_rate.dispense = 200
        else:
            for i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
                _pick_up(m300)
                side = 1 if i % 2 == 0 else -1
                loc_mix = m.bottom(1).move(Point(x=side * 0.5))
                src = source
                for n in range(num_trans):
                    if m300.current_volume > 0:
                        m300.dispense(m300.current_volume, src.top())
                    m300.flow_rate.dispense = 80
                    m300.transfer(vol_per_trans, src.bottom(bottom_tolerance), m.top(), air_gap=20, new_tip="never")
                    if n < num_trans - 1:
                        m300.air_gap(20)
                if resuspend:
                    m300.flow_rate.aspirate = 220
                    m300.flow_rate.dispense = 300
                    for _rep in range(mix_reps):
                        m300.aspirate(250, loc_mix)
                        m300.dispense(250, loc_mix)
                    m300.flow_rate.aspirate = 100
                    m300.flow_rate.dispense = 200
                m300.blow_out(m.top(-2))
                m300.air_gap(20)
                m300.drop_tip(spot)
        m300.flow_rate.aspirate = 100
        m300.flow_rate.dispense = 200
        if magdeck.status == "disengaged":
            magdeck.engage(height=Mag_height_elution_plate)
        ctx.delay(minutes=0.5, msg="Incubating on MagDeck for " + str(sep_time) + " minutes.")
        remove_supernatant(vol, reuse=True, restore=restore, last=last)

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
            loc_mix_dis = m.bottom(1.2).move(Point(x=side * 1.5))
            loc_mix_asp = m.bottom(0.4).move(Point(x=side * 0.5))
            m300.flow_rate.aspirate = 120
            m300.flow_rate.dispense = 120
            m300.aspirate(vol, elution_buffer.bottom(bottom_tolerance))
            m300.move_to(m.center())
            m300.dispense(vol, loc_mix_dis)
            m300.flow_rate.aspirate = 60
            m300.flow_rate.dispense = 90
            for _mix in range(mix_reps_elu):
                m300.aspirate(0.8 * vol, loc_mix_asp)
                m300.dispense(0.8 * vol, loc_mix_dis)
            m300.blow_out(m.bottom(5))
            m300.air_gap(20)
            _drop(m300)
        magdeck.engage(height=Mag_height_elution_plate)
        ctx.delay(minutes=sep_time, msg="Incubating on MagDeck for " + str(sep_time) + " minutes.")
        m300.flow_rate.aspirate = 15
        m300.flow_rate.dispense = 60
        for i, (m, e) in enumerate(zip(mag_samples_m, elution_samples_m)):
            _pick_up(m300)
            side = -1 if i % 2 == 0 else 1
            m300.transfer(vol, m.bottom(0.2), e.bottom(2), air_gap=20, new_tip="never")
            m300.blow_out(e.top(-1))
            m300.air_gap(10)
            m300.drop_tip()
        magdeck.disengage()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    remove_big_fragments(NGS_bead_vol1)
    remove_small_fragments(NGS_bead_vol2)
    wash(wash1_vol, wash1, reuse=False, restore=True, resuspend=False, last=False)
    wash(wash2_vol, wash2, reuse=True, restore=False, resuspend=False, last=True)
    ctx.delay(minutes=dry_time, msg="Air dry")
    elute(elution_vol)
    if tip_track and not ctx.is_simulating():
        if not os.path.isdir(folder_path):
            os.mkdir(folder_path)
        data = {"tips300": tip_log["count"][m300]}
        with open(tip_file_path, "w") as outfile:
            json.dump(data, outfile)
