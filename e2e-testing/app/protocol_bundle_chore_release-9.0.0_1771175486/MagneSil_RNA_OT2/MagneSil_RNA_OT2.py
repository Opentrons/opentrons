def get_values(*names):
    import json
    _all_values = json.loads("""{"dry_run": false, "mount": "left", "mag_mod_gen2": true, "temp_mod": true, "res_type": "nest_12_reservoir_15ml", "num_samples": 8, "wash1_vol": 100, "wash2_vol": 100, "wash3_vol": 100, "elution_vol": 50, "sample_vol": 20, "lysis_vol": 150, "dnase_vol": 50, "stop_vol": 100}""")
    return [_all_values[n] for n in names]


from opentrons.types import Point
import json
import math
from opentrons import types
import numpy as np

metadata = {
    'protocolName': 'Promega MagneSil Total RNA Extraction from Cells & Bacteria',
    'author': 'Opentrons <protocols@opentrons.com>',
    'apiLevel': '2.13'
}


"""
Here is where you can modify the magnetic module engage height:
"""
whichwash = 1
tip = 0

# Start protocol
def run(ctx):
    #Changable Protocol Parameters (Change from PL)
    dry_run = False   
    mount = 'left'
    mag_mod_gen2 = True 
    temp_mod = True
    res_type = "nest_12_reservoir_15ml"

    num_samples = 24
    wash1_vol = 100
    wash2_vol = 100
    wash3_vol = 100
    elution_vol = 50  
    sample_vol = 20
    lysis_vol = 150
    dnase_vol = 50
    stop_vol = 100

    try:
        [mount,temp_mod,mag_mod_gen2,dry_run,res_type,num_samples,wash1_vol,wash2_vol,wash3_vol,elution_vol,sample_vol,lysis_vol,dnase_vol,stop_vol] = get_values(  # noqa: F821
        'mount','temp_mod','mag_mod_gen2','dry_run','res_type','num_samples','wash1_vol','wash2_vol','wash3_vol','elution_vol','sample_vol','lysis_vol','dnase_vol','stop_vol')
    except (NameError):
        pass
    
    starting_vol = lysis_vol + sample_vol
    settling_time = 3 if not dry_run else 0.5

    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    if mag_mod_gen2:
        magdeck = ctx.load_module('magnetic module gen2', '6')
        MAG_HEIGHT = 6.8
    else:
        magdeck = ctx.load_module('magnetic module gen1', '6')
        MAG_HEIGHT = 13.6
    magplate = magdeck.load_labware('nest_96_wellplate_2ml_deep', 'Sample Plate on Magnet')
    magdeck.disengage()
    if temp_mod:
        tempdeck = ctx.load_module('Temperature Module Gen2', '1')
        elutionplate = tempdeck.load_labware('opentrons_96_aluminumblock_nest_wellplate_100ul','Elution Plate')
        tempdeck.set_temperature(4)
    else:
        elutionplate = ctx.load_labware('opentrons_96_aluminumblock_nest_wellplate_100ul','1','Elution Plate')
    h_s = ctx.load_module('heaterShakerModuleV1','10')
    h_s_plate = h_s.load_labware('opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep','Sample Plate on Heater-Shaker')
    h_s.close_labware_latch()
    cell_plate = ctx.load_labware('corning_96_wellplate_360ul_flat','8','Cell Plate') #Change to an actual cell culture plate
    
    waste = ctx.load_labware('nest_1_reservoir_195ml', '9','Liquid Waste').wells()[0].top()
    res1 = ctx.load_labware(res_type, '3', 'Reagent Reservoir 1')
    num_cols = math.ceil(num_samples/8)
    tips301 = ctx.load_labware('opentrons_96_filtertiprack_200ul', '2','Tips 1')
    tips302 = ctx.load_labware('opentrons_96_filtertiprack_200ul', '4','Tips 2')
    tips303 = ctx.load_labware('opentrons_96_filtertiprack_200ul', '5','Tips 3')
    tips304 = ctx.load_labware('opentrons_96_filtertiprack_200ul', '7','Tips 4')
    tips300 = [*tips301.wells(),*tips302.wells(),*tips303.wells(),*tips304.wells()]


    # load P300M pipette
    m300 = ctx.load_instrument('p300_multi_gen2', mount)

    """
    Here is where you can define the locations of your reagents.
    """
    wash1 = res1.wells()[2]
    wash2 = res1.wells()[3]
    wash3 = res1.wells()[4]
    lysis_ = res1.wells()[5]
    dnase1 = res1.wells()[0]
    stopreaction = res1.wells()[1]
    elution_solution = res1.wells()[-1]

    mag_samples_m = magplate.rows()[0][:num_cols]
    hs_samples_m = h_s_plate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]
    cell_samples = cell_plate.rows()[0][:num_cols]

    if temp_mod:
        tempdeck.set_temperature(4)

    m300.flow_rate.aspirate = 50
    m300.flow_rate.dispense = 150
    m300.flow_rate.blow_out = 300

    def _pick_up(pip, loc=None):
        global tip
        pip.pick_up_tip(tips300[tip])
        if pip.type == 'multi':
            tip += 8
        else:
            tip += 1


#         if tip_log[pip]['count'] == tip_log[pip]['max'] and not loc:
#             ctx.pause('Replace ' + str(pip.max_volume) + 'µl tipracks before \
# resuming.')
#             pip.reset_tipracks()
#             tip_log[pip]['count'] = 0
#         if loc:
#             pip.pick_up_tip(loc)
#         else:
#             pip.pick_up_tip(tip_log[pip]['tips'][tip_log[pip]['count']])
#             tip_log[pip]['count'] += 1

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
        if pip.type == 'multi':
            drop_count += 8
        else:
            drop_count += 1
        if drop_count >= drop_threshold:
            m300.home()
            ctx.pause('Please empty tips from waste before resuming.')
            ctx.home()  # home before continuing with protocol
            drop_count = 0

    waste_vol = 0
    waste_threshold = 185000

    def remove_supernatant(vol):


        def _waste_track(vol):
            nonlocal waste_vol
            if waste_vol + vol >= waste_threshold:
                m300.home()
                ctx.pause('Please empty liquid waste (slot 11) before resuming.')
                ctx.home()  # home before continuing with protocol

                waste_vol = 0
            waste_vol += vol

        m300.flow_rate.aspirate = 10
        num_trans = math.ceil(vol/180)
        vol_per_trans = vol/num_trans
        for i, m in enumerate(mag_samples_m):
            _pick_up(m300)
            side = -1.5 if i % 2 == 0 else 1.5
            loc = m.bottom(0.5).move(Point(x=side*2))
            for _ in range(num_trans):
                _waste_track(vol_per_trans)
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

    def resuspend_pellet(well, pip, mvol, reps=5):
        """
        'resuspend_pellet' will forcefully dispense liquid over the pellet after
        the magdeck engage in order to more thoroughly resuspend the pellet.
        param well: The current well that the resuspension will occur in.
        param pip: The pipet that is currently attached/ being used.
        param mvol: The volume that is transferred before the mixing steps.
        param reps: The number of mix repetitions that should occur. Note~
        During each mix rep, there are 2 cycles of aspirating from center,
        dispensing at the top and 2 cycles of aspirating from center,
        dispensing at the bottom (5 mixes total)
        """

        rightLeft = int(str(well).split(' ')[0][1:]) % 2
        """
        'rightLeft' will determine which value to use in the list of 'top' and
        'bottom' (below), based on the column of the 'well' used.
        In the case that an Even column is used, the first value of 'top' and
        'bottom' will be used, otherwise, the second value of each will be used.
        """
        center = well.bottom().move(types.Point(x=0,y=0,z=1.2))
        top = [
            well.bottom().move(types.Point(x=-3,y=3,z=1.7)),
            well.bottom().move(types.Point(x=3,y=3,z=1.7))
        ]
        bottom = [
            well.bottom().move(types.Point(x=-3,y=-3,z=1.7)),
            well.bottom().move(types.Point(x=3,y=-3,z=1.7))
        ]

        pip.flow_rate.dispense = 500
        pip.flow_rate.aspirate = 150

        mix_vol = 0.9 * mvol

        pip.move_to(center)
        for x in range(reps):
            for _ in range(2):
                pip.aspirate(mix_vol, center)
                pip.dispense(mix_vol, top[rightLeft])
            for _ in range(2):
                pip.aspirate(mix_vol, center)
                pip.dispense(mix_vol, bottom[rightLeft])
            if x == reps-1:
                pip.flow_rate.dispense = 10
                pip.aspirate(mix_vol, center)
                pip.dispense(mix_vol, center)
                pip.blow_out(center)
                pip.flow_rate.dispense = 150
                pip.flow_rate.aspirate = 50

    def blink():
        for i in range(5):
            ctx.set_rail_lights(True)
            ctx.delay(minutes=0.01666667)
            ctx.set_rail_lights(False)
            ctx.delay(minutes=0.01666667)

    def bead_mixing(well, pip, mvol, reps=8):
        """
        'bead_mixing' will mix liquid that contains beads. This will be done by
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
        center = well.top().move(types.Point(x=0,y=0,z=5))
        aspbot = well.bottom(1)
        asptop = well.bottom(10)
        disbot = well.bottom(3)
        distop = well.top()

        vol = mvol * .9

        pip.move_to(center)
        for _ in range(reps):
            pip.aspirate(vol,aspbot)
            pip.dispense(vol,distop)
            pip.aspirate(vol,asptop)
            pip.dispense(vol,disbot)

    def lysis(vol, source):
        magdeck.engage(MAG_HEIGHT)
        for beads in np.arange(2,0,-0.5): #settling time timer for washes
            ctx.delay(minutes=0.5, msg='There are ' + str(beads) + ' minutes left in bead incubation.')

        m300.flow_rate.aspirate = 10
        #Remove storage buffer from beads- WORKS GREAT!
        for i in range(num_cols):
            _pick_up(m300)
            m300.aspirate(15,mag_samples_m[i].bottom(1.35))
            m300.dispense(m300.current_volume,waste)
            m300.blow_out()
            _drop(m300)
        magdeck.disengage()


        num_transfers = math.ceil(vol/180)
        #Transfer 100 of lysis to cell plate with sample on it
        for i in range(num_cols):
            #Create Mixing Locations
            loc1 = cell_samples[i].bottom().move(types.Point(x=0,y=1,z=1))
            loc1_5 = cell_samples[i].bottom().move(types.Point(x=0.5,y=0.5,z=1))
            loc2 = cell_samples[i].bottom().move(types.Point(x=1,y=0,z=1))
            loc2_5 = cell_samples[i].bottom().move(types.Point(x=0.5,y=-0.5,z=1))
            loc3 = cell_samples[i].bottom().move(types.Point(x=0,y=-1,z=1))
            loc3_5 = cell_samples[i].bottom().move(types.Point(x=-0.5,y=-0.5,z=1))
            loc4 = cell_samples[i].bottom().move(types.Point(x=-1,y=0,z=1))
            loc4_5 = cell_samples[i].bottom().move(types.Point(x=-0.5,y=0.5,z=1))
            loc5 = cell_samples[i].bottom()
            _pick_up(m300)
            src = source
            tvol = (vol)/num_transfers
            m300.flow_rate.aspirate = 150
            m300.flow_rate.dispense = 150
            for t in range(num_transfers):
                m300.aspirate(tvol,src.bottom(1))
                m300.air_gap(10)
                m300.dispense(m300.current_volume,cell_samples[i].top())
                m300.air_gap(10)
                if t == num_transfers-1:
                    for x in range(2):
                        #Can use any mixing locations required to break up pellet
                        m300.aspirate(tvol*.9,loc3)
                        m300.dispense(tvol*.9,loc3)
                        m300.aspirate(tvol*.9,loc3_5)
                        m300.dispense(tvol*.9,loc3_5)
                        m300.aspirate(tvol*.9,loc4)
                        m300.dispense(tvol*.9,loc4)
                        m300.aspirate(tvol*.9,loc3_5)
                        m300.dispense(tvol*.9,loc3_5)
                        m300.aspirate(tvol*.9,loc4)
                        m300.dispense(tvol*.9,loc4)
                        m300.aspirate(tvol*.9,loc3)
                        m300.dispense(tvol*.9,loc3)
                        m300.aspirate(tvol*.9,loc3_5)
                        m300.dispense(tvol*.9,loc3_5)
                        m300.aspirate(tvol*.9,loc3)
                        m300.dispense(tvol*.9,loc3)
                        m300.aspirate(tvol*.9,loc4)
                        m300.dispense(tvol*.9,loc4)
                #Transfer from Cell Plate to Magdeck
                    m300.flow_rate.aspirate = 20
                    m300.flow_rate.dispense = 20
                    m300.aspirate(110, cell_samples[i])
                    m300.air_gap(10)
                    m300.dispense(m300.current_volume, mag_samples_m[i].top(-15))
                    m300.air_gap(10)
                    m300.aspirate(110, cell_samples[i].bottom(0))
                    m300.air_gap(10)
                    m300.dispense(m300.current_volume, mag_samples_m[i])
                    resuspend_pellet(mag_samples_m[i], m300, 100, reps=6)
                    m300.flow_rate.aspirate = 200
                    m300.flow_rate.dispense = 200
                    
            _drop(m300)
        h_s.open_labware_latch()
        blink()
        ctx.pause('Please move plate from Magdeck to Heater-Shaker module before resuming.')
        h_s.close_labware_latch()
        h_s.set_and_wait_for_shake_speed(rpm=2000)
        ctx.delay(minutes=5,msg='Please wait 5 minutes while the beads and the lysis mix with the cells.')
        h_s.deactivate_shaker()
        h_s.open_labware_latch()
        blink()
        ctx.pause('Please move plate from Magdeck to Heater-Shaker module before resuming.')
        h_s.close_labware_latch()

        magdeck.engage(height=MAG_HEIGHT)

        for lysiss in np.arange(settling_time,0,-0.5): #settling time timer for washes
            ctx.delay(minutes=0.5, msg='There are ' + str(lysiss) + ' minutes left in lysis incubation.')

        remove_supernatant(starting_vol)

    def wash(vol, source, resuspend=True):

        global whichwash #Defines which wash the protocol is on to log on the app

        if source == wash1:
            whichwash = 1
        if source == wash2:
            whichwash = 2
        if source == wash3:
            whichwash = 3

        magdeck.disengage()

        num_trans = math.ceil(vol/180)
        vol_per_trans = vol/num_trans
        for i, m in enumerate(mag_samples_m):
            _pick_up(m300)
            src = source
            for n in range(num_trans):
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume, waste.top())
                m300.transfer(vol_per_trans, src, m.top(), air_gap=20, new_tip='never')
                m300.air_gap(10)
            resuspend_pellet(m, m300, vol)
            m300.air_gap(20)
            _drop(m300)

        magdeck.engage(height=MAG_HEIGHT)

        for washi in np.arange(settling_time,0,-0.5): #settling time timer for washes
            ctx.delay(minutes=0.5, msg='There are ' + str(washi) + ' minutes left in wash ' + str(whichwash) + ' incubation.')

        remove_supernatant(vol)

    def dnase(vol, source, resuspend=True):

        magdeck.disengage()

        num_trans = math.ceil(vol/180)
        vol_per_trans = vol/num_trans
        for i, (m, x) in enumerate(zip(mag_samples_m, hs_samples_m)):
            _pick_up(m300)
            src = source
            for n in range(num_trans):
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume, waste.top())
                m300.transfer(vol_per_trans, src, m.top(), air_gap=20, new_tip='never')
                m300.air_gap(20)
            resuspend_pellet(m, m300, 50, reps=8)
            _drop(m300)

        h_s.open_labware_latch()
        blink()
        ctx.pause('Please move plate from Magdeck to Heater-Shaker module before resuming.')
        h_s.close_labware_latch()

        h_s.set_and_wait_for_shake_speed(rpm=2000)
        ctx.delay(minutes=12,msg='Let DNAse incubate at 2000 rpm for 12 minutes.')
        h_s.deactivate_shaker()

    def stop_reaction(vol, source, resuspend=True):

        num_trans = math.ceil(vol/180)
        vol_per_trans = vol/num_trans
        for i, n in enumerate(hs_samples_m):
            _pick_up(m300)
            src = source
            for z in range(num_trans):
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume, waste.top())
                m300.transfer(vol_per_trans, src, n.top(), air_gap=20,
                              new_tip='never')
                m300.air_gap(20)
            if resuspend:
                resuspend_pellet(n, m300, 125, reps=8)
            m300.air_gap(10)
            _drop(m300)

        h_s.set_and_wait_for_shake_speed(rpm=1800)
        ctx.delay(minutes=5,msg='Please allow 5 minutes of shaking at 1800 rpm to stop the reaction.')
        h_s.deactivate_shaker()

        h_s.open_labware_latch()
        blink()
        ctx.pause('Please move plate from Heater-Shaker to Magdeck module before resuming.')
        h_s.close_labware_latch()

        magdeck.engage(height=MAG_HEIGHT)

        for stop in np.arange(settling_time,0,-0.5):
            ctx.delay(minutes = 0.5, msg='There are ' + str(stop) + ' minutes left in the incubation.')

        remove_supernatant(vol+50)

    def elute(vol):

        # resuspend beads in elution
        magdeck.disengage()

        for i, m in enumerate(mag_samples_m):
            _pick_up(m300)
            side = 1 if i % 2 == 0 else -1
            loc = m.bottom(0.5).move(Point(x=side*2))
            m300.aspirate(vol, elution_solution)
            m300.move_to(m.center())
            m300.dispense(vol, loc)
            resuspend_pellet(m, m300, vol, reps = 8)
            _drop(m300)

        h_s.open_labware_latch()
        blink()
        ctx.pause('Please move plate from Magdeck to Heater-Shaker module before resuming.')
        h_s.close_labware_latch()

        h_s.set_and_wait_for_shake_speed(rpm=2000)
        ctx.delay(minutes=3, msg='Please wait for 3 minutes of incubation while the DNA elutes from the beads.')
        h_s.deactivate_shaker()


        h_s.open_labware_latch()
        blink()
        ctx.pause('Please move plate from Heater-Shaker to Magdeck module before resuming.')
        h_s.close_labware_latch()

        magdeck.engage(height=MAG_HEIGHT)
        for elutei in np.arange(settling_time,0,-0.5):
            ctx.delay(minutes=0.5, msg='Incubating on MagDeck for ' + str(elutei) + ' more minutes.')

        for i, (m, e) in enumerate(zip(mag_samples_m, elution_samples_m)):
            _pick_up(m300)
            side = -1 if i % 2 == 0 else 1
            loc = m.bottom(0.15).move(Point(x=side*2))
            m300.transfer(vol+5, loc, e.bottom(5), air_gap=20, new_tip='never')
            m300.blow_out(e.top(-2))
            m300.air_gap(20)
            m300.drop_tip()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    lysis(lysis_vol,lysis_)
    wash(wash1_vol, wash1)
    ctx.delay(minutes=1, msg='Drying beads for 1 minute')
    #dnase 1 treatment
    dnase(dnase_vol, dnase1)
    stop_reaction(stop_vol, stopreaction)
    #resume washes
    wash(wash2_vol, wash2)
    wash(wash3_vol, wash3)
    ctx.delay(minutes=2 if not dry_run else 0.25, msg='Drying beads for 2 minutes')
    elute(elution_vol)
