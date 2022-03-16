from opentrons.types import Point
import json
import os
import math

############################################################################
# Note that all delays have been changed to 1 second to speed up execution #
############################################################################


def get_values(*names):
    import json
    _all_values = json.loads(
        """{"num_samples":96,"starting_vol":200,"elution_vol":40}"""
    )
    return [_all_values[n] for n in names]


metadata = {
    'protocolName': 'Beckman Coulter RNAdvance Viral RNA Isolation',
    'author': 'Opentrons <protocols@opentrons.com>',
    'apiLevel': '2.9'
}


"""
Here is where you can modify the magnetic module engage height:
"""
MAG_HEIGHT = 6.8


def run(ctx):
    ctx.home()
    [num_samples, starting_vol, elution_vol] = get_values(  # noqa: F821
        'num_samples', 'starting_vol', 'elution_vol')
    [binding_buffer_vol, wash1_vol, wash2_vol, wash3_vol, mix_reps,
     settling_time, park_tips, tip_track] = [
     200, 400, 400, 400, 10, 1, False, False]

    if not 100 <= starting_vol <= 400:
        raise Exception('Starting volume should be from 100-400µl.')
    if not 40 <= elution_vol <= 100:
        raise Exception('Elution volume should be from 40-100µl.')

    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    magdeck = ctx.load_module('magnetic module gen2', '6')
    magdeck.disengage()
    magplate = magdeck.load_labware('nest_96_wellplate_2ml_deep',
                                    'deepwell plate')
    tempdeck = ctx.load_module('Temperature Module Gen2', '1')
    elutionplate = tempdeck.load_labware(
                'opentrons_96_aluminumblock_nest_wellplate_100ul',
                'elution plate')
    waste = ctx.load_labware('nest_1_reservoir_195ml', '9',
                             'Liquid Waste').wells()[0].top()
    res2 = ctx.load_labware(
        'nest_12_reservoir_15ml', '3', 'reagent reservoir 2')
    res1 = ctx.load_labware(
        'nest_12_reservoir_15ml', '2', 'reagent reservoir 1')
    num_cols = math.ceil(num_samples/8)
    tips300 = [ctx.load_labware('opentrons_96_tiprack_300ul', slot,
                                '200µl filtertiprack')
               for slot in ['4', '7', '8', '10', '11']]
    if park_tips:
        parkingrack = ctx.load_labware(
            'opentrons_96_tiprack_300ul', '5', 'tiprack for parking')
        parking_spots = parkingrack.rows()[0][:num_cols]
    else:
        tips300.insert(0, ctx.load_labware('opentrons_96_tiprack_300ul', '5',
                                           '200µl filtertiprack'))
        parking_spots = [None for none in range(12)]

    # load P300M pipette
    m300 = ctx.load_instrument(
        'p300_multi_gen2', 'left', tip_racks=tips300)

    """
    Here is where you can define the locations of your reagents.
    """
    binding_buffer = res1.wells()[:2]
    elution_solution = res2.wells()[-1]
    wash1 = res1.wells()[4:8]
    wash2 = res1.wells()[8:]
    wash3 = res2.wells()[:4]

    mag_samples_m = magplate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]

    tempdeck.set_temperature(4)

    m300.flow_rate.aspirate = 50
    m300.flow_rate.dispense = 150
    m300.flow_rate.blow_out = 300

    folder_path = '/data/B'
    tip_file_path = folder_path + '/tip_log.json'
    tip_log = {'count': {}}
    if tip_track and not ctx.is_simulating():
        if os.path.isfile(tip_file_path):
            with open(tip_file_path) as json_file:
                data = json.load(json_file)
                if 'tips300' in data:
                    tip_log['count'][m300] = data['tips300']
                else:
                    tip_log['count'][m300] = 0
        else:
            tip_log['count'][m300] = 0
    else:
        tip_log['count'] = {m300: 0}

    tip_log['tips'] = {
        m300: [tip for rack in tips300 for tip in rack.rows()[0]]}
    tip_log['max'] = {m300: len(tip_log['tips'][m300])}

    def _pick_up(pip, loc=None):
        nonlocal tip_log
        if tip_log['count'][pip] == tip_log['max'][pip] and not loc:
            # ctx.pause(
            #     'Replace ' + str(pip.max_volume) + 'µl tipracks before resuming.'
            # )
            pip.reset_tipracks()
            tip_log['count'][pip] = 0
        if loc:
            pip.pick_up_tip(loc)
        else:
            pip.pick_up_tip(tip_log['tips'][pip][tip_log['count'][pip]])
            tip_log['count'][pip] += 1

    switch = True
    drop_count = 0
    # number of tips trash will accommodate before prompting user to empty
    drop_threshold = 120

    def _drop(pip):
        nonlocal switch
        nonlocal drop_count
        side = 30 if switch else -18
        drop_loc = ctx.loaded_labwares[12].wells()[0].top().move(
            Point(x=side))
        pip.drop_tip(drop_loc)
        switch = not switch
        drop_count += 8
        if drop_count == drop_threshold:
            m300.home()
            # ctx.pause('Please empty tips from waste before resuming.')

            ctx.home()  # home before continuing with protocol

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
                # ctx.pause('Please empty liquid waste (slot 11) before resuming.')

                ctx.home()  # home before continuing with protocol
                waste_vol = 0
            waste_vol += vol

        m300.flow_rate.aspirate = 30
        num_trans = math.ceil(vol/200)
        vol_per_trans = vol/num_trans
        for i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
            if park:
                _pick_up(m300, spot)
            else:
                _pick_up(m300)
            side = -1 if i % 2 == 0 else 1
            loc = m.bottom(0.5).move(Point(x=side*2))
            for _ in range(num_trans):
                _waste_track(vol_per_trans*8)
                if m300.current_volume > 0:
                    # void air gap if necessary
                    m300.dispense(m300.current_volume, m.top())
                m300.move_to(m.center())
                m300.transfer(vol_per_trans, loc, waste, new_tip='never',
                              air_gap=20)
                m300.blow_out(waste)
                m300.air_gap(20)
            _drop(m300)
        m300.flow_rate.aspirate = 150

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
        for i, (well, spot) in enumerate(zip(mag_samples_m, parking_spots)):
            if park:
                _pick_up(m300, spot)
            else:
                _pick_up(m300)
            num_trans = math.ceil(vol/200)
            vol_per_trans = vol/num_trans
            for t in range(num_trans):
                src = binding_buffer[i//(12//len(binding_buffer))]
                if m300.current_volume > 0:
                    # void air gap if necessary
                    m300.dispense(m300.current_volume, src.top())
                for _ in range(5):
                    m300.aspirate(180, src.bottom(0.5))
                    m300.dispense(180, src.bottom(5))
                m300.transfer(vol_per_trans, src, well.top(), air_gap=20,
                              new_tip='never')
                if t < num_trans - 1:
                    m300.air_gap(20)
            m300.mix(5, 200, well)
            m300.blow_out(well.top(-2))
            m300.air_gap(20)
            if park:
                m300.drop_tip(spot)
            else:
                _drop(m300)
        # Changed to seconds to speed up
        # ctx.delay(seconds=1, msg='Incubate for 5 minutes')
        magdeck.engage(height=MAG_HEIGHT)
        # ctx.delay(
        #     seconds=settling_time,
        #     msg='Incubating on MagDeck for' + str(settling_time) + ' minutes.'
        # )

        # remove initial supernatant
        remove_supernatant(vol+starting_vol, park=park)

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

        if resuspend and magdeck.status == 'engaged':
            magdeck.disengage()

        num_trans = math.ceil(vol/200)
        vol_per_trans = vol/num_trans
        for i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
            _pick_up(m300)
            side = 1 if i % 2 == 0 else -1
            loc = m.bottom(0.5).move(Point(x=side*2))
            src = source[i//(12//len(source))]
            for n in range(num_trans):
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume, src.top())
                m300.transfer(vol_per_trans, src, m.top(), air_gap=20,
                              new_tip='never')
                if n < num_trans - 1:  # only air_gap if going back to source
                    m300.air_gap(20)
            if resuspend:
                m300.mix(mix_reps, 150, loc)
            m300.blow_out(m.top())
            m300.air_gap(20)
            if park:
                m300.drop_tip(spot)
            else:
                _drop(m300)

        if magdeck.status == 'disengaged':
            magdeck.engage(height=MAG_HEIGHT)
        # Changed to seconds to speed up
        # ctx.delay(seconds=1, msg='Incubating on MagDeck for 7 minutes.')

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

        # resuspend beads in elution
        if magdeck.status == 'enagaged':
            magdeck.disengage()
        for i, (m, spot) in enumerate(zip(mag_samples_m, parking_spots)):
            _pick_up(m300)
            side = 1 if i % 2 == 0 else -1
            loc = m.bottom(0.5).move(Point(x=side*2))
            m300.aspirate(vol, elution_solution)
            m300.move_to(m.center())
            m300.dispense(vol, loc)
            m300.mix(mix_reps, 0.8*vol, loc)
            m300.blow_out(m.bottom(5))
            m300.air_gap(20)
            if park:
                m300.drop_tip(spot)
            else:
                _drop(m300)

        magdeck.engage(height=MAG_HEIGHT)
        # ctx.delay(
        #     seconds=settling_time,
        #     msg='Incubating on MagDeck for ' + str(settling_time) + ' minutes.'
        # )

        for i, (m, e, spot) in enumerate(
                zip(mag_samples_m, elution_samples_m, parking_spots)):
            if park:
                _pick_up(m300, spot)
            else:
                _pick_up(m300)
            side = -1 if i % 2 == 0 else 1
            loc = m.bottom(0.5).move(Point(x=side*2))
            m300.transfer(vol, loc, e.bottom(5), air_gap=20, new_tip='never')
            m300.blow_out(e.top(-2))
            m300.air_gap(20)
            m300.drop_tip()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    bind(binding_buffer_vol, park=park_tips)
    wash(wash1_vol, wash1, park=park_tips, resuspend=True)
    wash(wash2_vol, wash2, park=park_tips, resuspend=False)
    wash(wash3_vol, wash3, park=park_tips, resuspend=False)
    elute(elution_vol, park=park_tips)

    # track final used tip
    if tip_track and not ctx.is_simulating():
        if not os.path.isdir(folder_path):
            os.mkdir(folder_path)
        data = {'tips300': tip_log['count'][m300]}
        with open(tip_file_path, 'w') as outfile:
            json.dump(data, outfile)