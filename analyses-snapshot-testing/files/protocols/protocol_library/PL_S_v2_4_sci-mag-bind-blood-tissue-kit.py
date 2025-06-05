def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "num_samples", "type": "int", "label": "number of samples + controls (1-96)", "default": 8}, {"name": "deepwell_type", "type": "dropDown", "label": "96-deepwell plate type", "options": [{"label": "NEST", "value": "nest_96_wellplate_2ml_deep"}, {"label": "USA Scientific", "value": "usascientific_96_wellplate_2.4ml_deep"}]}, {"name": "res_type", "type": "dropDown", "label": "12-well reservoir type", "options": [{"label": "NEST", "value": "nest_12_reservoir_15ml"}, {"label": "USA Scientific", "value": "usascientific_12_reservoir_22ml"}]}, {"name": "starting_vol", "type": "float", "label": "intitial volume (sample + lysis buffer, in ul)", "default": 430}, {"name": "binding_buffer_vol", "type": "float", "label": "binding buffer volume (in ul)", "default": 370}, {"name": "wash1_vol", "type": "float", "label": "wash 1 volume (in ul, up to 500ul)", "default": 500}, {"name": "wash2_vol", "type": "float", "label": "wash 2 volume (in ul, up to 500ul)", "default": 500}, {"name": "wash3_vol", "type": "float", "label": "wash 3 volume (in ul, up to 500ul)", "default": 500}, {"name": "elution_vol", "type": "float", "label": "final elution volume (in ul)", "default": 50}, {"name": "mix_reps", "type": "int", "label": "mix repetitions for bead resuspension", "default": 15}, {"name": "settling_time", "type": "float", "label": "bead settling time (in minutes)", "default": 7}, {"name": "park_tips", "type": "dropDown", "label": "park tips", "options": [{"label": "yes", "value": true}, {"label": "no", "value": false}]}, {"name": "tip_track", "type": "dropDown", "label": "track tips across protocol runs", "options": [{"label": "no", "value": false}, {"label": "yes", "value": true}]}, {"name": "flash", "type": "dropDown", "label": "flash robot on pause", "options": [{"label": "no", "value": false}, {"label": "yes", "value": true}]}, {"name": "p300_mount", "type": "dropDown", "label": "P300 Multi Channel Pipette Mount", "options": [{"label": "Left", "value": "left"}, {"label": "Right", "value": "right"}]}]""")
    return [_all_values[n] for n in names]


import json
import math
import os
import threading
from time import sleep

from opentrons import types
from opentrons.types import Point

metadata = {
    "protocolName": "Mag-BindÂ® Blood & Tissue DNA HDQ 96 Kit",
    "author": "Opentrons <protocols@opentrons.com>",
    "apiLevel": "2.4",
}
"""
Here is where you can modify the magnetic module engage height:
"""
MAG_HEIGHT = 13.6


class CancellationToken:
    def __init__(self):
        self.is_continued = False

    def set_true(self):
        self.is_continued = True

    def set_false(self):
        self.is_continued = False


def turn_on_blinking_notification(hardware, pause):
    while pause.is_continued:
        hardware.set_lights(rails=True)
        sleep(1)
        hardware.set_lights(rails=False)
        sleep(1)


def create_thread(ctx, cancel_token):
    t1 = threading.Thread(target=turn_on_blinking_notification, args=(ctx._hw_manager.hardware, cancel_token))
    t1.start()
    return t1


def run(ctx):
    cancellationToken = CancellationToken()
    [
        num_samples,
        deepwell_type,
        res_type,
        starting_vol,
        binding_buffer_vol,
        wash1_vol,
        wash2_vol,
        wash3_vol,
        elution_vol,
        mix_reps,
        settling_time,
        park_tips,
        tip_track,
        flash,
        p300_mount,
    ] = get_values(
        "num_samples",
        "deepwell_type",
        "res_type",
        "starting_vol",
        "binding_buffer_vol",
        "wash1_vol",
        "wash2_vol",
        "wash3_vol",
        "elution_vol",
        "mix_reps",
        "settling_time",
        "park_tips",
        "tip_track",
        "flash",
        "p300_mount",
    )
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    magdeck = ctx.load_module("magdeck", "6")
    magdeck.disengage()
    magplate = magdeck.load_labware(deepwell_type, "deepwell plate")
    elutionplate = ctx.load_labware("opentrons_96_aluminumblock_nest_wellplate_100ul", "1")
    waste = ctx.load_labware("nest_1_reservoir_195ml", "9", "Liquid Waste").wells()[0].top()
    res2 = ctx.load_labware(res_type, "3", "reagent reservoir 2")
    res1 = ctx.load_labware(res_type, "2", "reagent reservoir 1")
    num_cols = math.ceil(num_samples / 8)
    tips300 = [
        ctx.load_labware("opentrons_96_tiprack_300ul", slot, "200Âµl filtertiprack")
        for slot in ["5", "7", "8", "10", "11"]
    ]
    if park_tips:
        parkingrack = ctx.load_labware("opentrons_96_tiprack_300ul", "4", "tiprack for parking")
        parking_spots = parkingrack.rows()[0][:num_cols]
    else:
        tips300.insert(0, ctx.load_labware("opentrons_96_tiprack_300ul", "4", "200Âµl filtertiprack"))
        parking_spots = [None for none in range(12)]
    m300 = ctx.load_instrument("p300_multi_gen2", p300_mount, tip_racks=tips300)
    """
    Here is where you can define the locations of your reagents.
    """
    binding_buffer = res1.wells()[:4]
    elution_solution = res2.wells()[-1]
    wash1 = res1.wells()[4:8]
    wash2 = res1.wells()[8:]
    wash3 = res2.wells()[:4]
    mag_samples_m = magplate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]
    m300.flow_rate.aspirate = 50
    m300.flow_rate.dispense = 150
    m300.flow_rate.blow_out = 300
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
            ctx.pause("Replace " + str(pip.max_volume) + "Âµl tipracks before resuming.")
            pip.reset_tipracks()
            tip_log["count"][pip] = 0
        if loc:
            pip.pick_up_tip(loc)
        else:
            pip.pick_up_tip(tip_log["tips"][pip][tip_log["count"][pip]])
            tip_log["count"][pip] += 1

    switch = True
    drop_count = 0
    drop_threshold = 120

    def _drop(pip):
        nonlocal switch
        nonlocal drop_count
        side = 30 if switch else -18
        drop_loc = ctx.loaded_labwares[12].wells()[0].top().move(Point(x=side))
        pip.drop_tip(drop_loc)
        switch = not switch
        if pip.type == "multi":
            drop_count += 8
        else:
            drop_count += 1
        if drop_count >= drop_threshold:
            if flash:
                if not ctx._hw_manager.hardware.is_simulator:
                    cancellationToken.set_true()
                thread = create_thread(ctx, cancellationToken)
            m300.home()
            ctx.pause("Please empty tips from waste before resuming.")
            ctx.home()
            if flash:
                cancellationToken.set_false()
                thread.join()
            drop_count = 0

    waste_vol = 0
    waste_threshold = 185000

    def remove_supernatant(vol, park=False):
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
                if flash:
                    if not ctx._hw_manager.hardware.is_simulator:
                        cancellationToken.set_true()
                    thread = create_thread(ctx, cancellationToken)
                m300.home()
                ctx.pause("Please empty liquid waste (slot 11) before resuming.")
                ctx.home()
                if flash:
                    cancellationToken.set_false()
                    thread.join()
                waste_vol = 0
            waste_vol += vol

        m300.flow_rate.aspirate = 30
        num_trans = math.ceil(vol / 200)
        vol_per_trans = vol / num_trans
        for i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
            if park:
                _pick_up(m300, spot)
            else:
                _pick_up(m300)
            side = -1 if i % 2 == 0 else 1
            loc = m.bottom(0.5).move(Point(x=side * 2))
            for _ in range(num_trans):
                _waste_track(vol_per_trans * 8)
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume, m.top())
                m300.move_to(m.center())
                m300.transfer(vol_per_trans, loc, waste, new_tip="never", air_gap=20)
                m300.blow_out(waste)
                m300.air_gap(20)
            _drop(m300)
        m300.flow_rate.aspirate = 150

    def resuspend_pellet(well, pip, mvol, reps=5):
        """
        'resuspend_pellet' will forcefully dispense liquid over the pellet
        after the magdeck engage in order to more thoroughly resuspend the
        pellet. param well: The current well that the resuspension will occur
        in. param pip: The pipet that is currently attached/ being used.
        param mvol: The volume that is transferred before the mixing steps.
        param reps: The number of mix repetitions that should occur. Note~
        During each mix rep, there are 2 cycles of aspirating from center,
        dispensing at the top and 2 cycles of aspirating from center,
        dispensing at the bottom (5 mixes total)
        """
        rightLeft = int(str(well).split(" ")[0][1:]) % 2
        """
        'rightLeft' will determine which value to use in the list of 'top' and
        'bottom' (below), based on the column of the 'well' used.
        In the case that an Even column is used, the first value of 'top' and
        'bottom' will be used, otherwise, the second value of each will be
        used.
        """
        center = well.bottom().move(types.Point(x=0, y=0, z=0.1))
        top = [
            well.bottom().move(types.Point(x=-3.8, y=3.8, z=0.1)),
            well.bottom().move(types.Point(x=3.8, y=3.8, z=0.1)),
        ]
        bottom = [
            well.bottom().move(types.Point(x=-3.8, y=-3.8, z=0.1)),
            well.bottom().move(types.Point(x=3.8, y=-3.8, z=0.1)),
        ]
        pip.flow_rate.dispense = 500
        pip.flow_rate.aspirate = 150
        mix_vol = 0.9 * mvol
        pip.move_to(center)
        for _ in range(reps):
            for _ in range(2):
                pip.aspirate(mix_vol, center)
                pip.dispense(mix_vol, top[rightLeft])
            for _ in range(2):
                pip.aspirate(mix_vol, center)
                pip.dispense(mix_vol, bottom[rightLeft])

    def bind(vol, park=True):
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
        latest_chan = -1
        for i, (well, spot) in enumerate(zip(mag_samples_m, parking_spots)):
            if park:
                _pick_up(m300, spot)
            else:
                _pick_up(m300)
            num_trans = math.ceil(vol / 200)
            vol_per_trans = vol / num_trans
            asp_per_chan = 0.95 * res1.wells()[0].max_volume // (vol_per_trans * 8)
            for t in range(num_trans):
                chan_ind = int((i * num_trans + t) // asp_per_chan)
                source = binding_buffer[chan_ind]
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume, source.top())
                if chan_ind > latest_chan:
                    for _ in range(5):
                        m300.aspirate(180, source.bottom(0.5))
                        m300.dispense(180, source.bottom(5))
                    latest_chan = chan_ind
                m300.transfer(vol_per_trans, source, well.top(), air_gap=20, new_tip="never")
                if t < num_trans - 1:
                    m300.air_gap(20)
            m300.mix(5, 200, well)
            m300.blow_out(well.top(-2))
            m300.air_gap(20)
            if park:
                m300.drop_tip(spot)
            else:
                _drop(m300)
        ctx.delay(minutes=10, msg="Bind off-deck on a heater/shaker")
        magdeck.engage(height=MAG_HEIGHT)
        ctx.delay(minutes=settling_time, msg="Incubating on MagDeck for " + str(settling_time) + " minutes.")
        remove_supernatant(vol + starting_vol, park=park)

    def wash(vol, source, mix_reps=15, park=True, resuspend=True):
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
        :param park (boolean): Whether to save sample-corresponding tips
                               between adding wash buffer and removing
                               supernatant.
        :param resuspend (boolean): Whether to resuspend beads in wash buffer.
        """
        if resuspend and magdeck.status == "engaged":
            magdeck.disengage()
        num_trans = math.ceil(vol / 200)
        vol_per_trans = vol / num_trans
        for i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
            _pick_up(m300)
            src = source[i // (12 // len(source))]
            for n in range(num_trans):
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume, src.top())
                m300.transfer(vol_per_trans, src, m.top(), air_gap=20, new_tip="never")
                if n < num_trans - 1:
                    m300.air_gap(20)
            if resuspend:
                resuspend_pellet(m, m300, 180)
            m300.blow_out(m.top())
            m300.air_gap(20)
            if park:
                m300.drop_tip(spot)
            else:
                _drop(m300)
        if magdeck.status == "disengaged":
            magdeck.engage(height=MAG_HEIGHT)
        ctx.delay(minutes=settling_time, msg="Incubating on MagDeck for " + str(settling_time) + " minutes.")
        remove_supernatant(vol, park=park)

    def elute(vol, park=True):
        """
        `elute` will perform elution from the deepwell extraciton plate to the
        final clean elutions PCR plate to complete the extraction protocol.
        :param vol (float): The amount of volume to aspirate from the elution
                            buffer source and dispense to each well containing
                            beads.
        :param park (boolean): Whether to save sample-corresponding tips
                               between adding elution buffer and transferring
                               supernatant to the final clean elutions PCR
                               plate.
        """
        if magdeck.status == "enagaged":
            magdeck.disengage()
        for i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
            _pick_up(m300)
            side = 1 if i % 2 == 0 else -1
            loc = m.bottom(0.5).move(Point(x=side * 2))
            m300.aspirate(vol, elution_solution)
            m300.move_to(m.center())
            m300.dispense(vol, loc)
            m300.mix(mix_reps, 0.8 * vol, loc)
            m300.blow_out(m.bottom(5))
            m300.air_gap(20)
            if park:
                m300.drop_tip(spot)
            else:
                _drop(m300)
        ctx.delay(minutes=5, msg="Delay for 5 minutes for elution")
        magdeck.engage(height=MAG_HEIGHT)
        ctx.delay(minutes=settling_time, msg="Incubating on MagDeck for " + str(settling_time) + " minutes.")
        for i, (m, e, spot) in enumerate(zip(mag_samples_m, elution_samples_m, parking_spots)):
            if park:
                _pick_up(m300, spot)
            else:
                _pick_up(m300)
            side = -1 if i % 2 == 0 else 1
            loc = m.bottom(0.5).move(Point(x=side * 2))
            m300.transfer(vol, loc, e.bottom(5), air_gap=20, new_tip="never")
            m300.blow_out(e.top(-2))
            m300.air_gap(20)
            m300.drop_tip()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    bind(binding_buffer_vol, park=park_tips)
    wash(wash1_vol, wash1, park=park_tips)
    wash(wash2_vol, wash2, park=park_tips)
    wash(wash3_vol, wash3, park=park_tips)
    ctx.delay(minutes=5, msg="Incubate for 5 minutes to dry beads")
    elute(elution_vol, park=park_tips)
    if tip_track and not ctx.is_simulating():
        if not os.path.isdir(folder_path):
            os.mkdir(folder_path)
        data = {"tips300": tip_log["count"][m300]}
        with open(tip_file_path, "w") as outfile:
            json.dump(data, outfile)
