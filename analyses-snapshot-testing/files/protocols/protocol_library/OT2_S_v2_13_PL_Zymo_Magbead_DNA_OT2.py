def get_values(*names):
    import json
    _all_values = json.loads("""{"dry_run": false, "mount": "left", "mag_mod_gen2": true, "res_type": "nest_12_reservoir_15ml", "num_samples": 8, "wash1_vol": 500, "wash2_vol": 900, "wash3_vol": 900, "lysis_vol": 200, "sample_vol": 10, "bind_vol": 625, "elution_vol": 100}""")
    return [_all_values[n] for n in names]


def get_values(*names):
            import json
            _all_values = json.loads("""{"dry_run":false,"mount":"left","mag_mod_gen2":true,"res_type":"nest_12_reservoir_15ml","num_samples":8,"wash1_vol":500,"wash2_vol":900,"wash3_vol":900,"lysis_vol":200,"sample_vol":10,"bind_vol":625,"elution_vol":100,"protocol_filename":"Zymo_Magbead_DNA_Kit_OT-2"}""")
            return [_all_values[n] for n in names]


from opentrons.types import Point
import json
import math
from opentrons import types
import numpy as np

metadata = {
    'protocolName': 'ZymoBIOMICs Magbead DNA Extraction from Cells',
    'author': 'Zach Galluzzo <zachary.galluzzo@opentrons.com>',
    'apiLevel': '2.13'
}

"""
Here is where you can modify the magnetic module engage height:
"""
whichwash = 1
tip = 0
drop_count = 0
waste_vol = 0

# Start protocol
def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    #Parameters that customers can change
    dry_run = False
    mount = 'left'
    mag_mod_gen2 = True
    res_type = "nest_12_reservoir_15ml"

    num_samples = 24
    wash1_vol= 500
    wash2_vol= 900
    wash3_vol= 900
    lysis_vol= 200
    sample_vol= 10
    bind_vol= 625
    elution_vol= 100

    try:
        [dry_run,mount,mag_mod_gen2,res_type,num_samples,wash1_vol,wash2_vol,wash3_vol,lysis_vol,sample_vol,bind_vol,elution_vol] = get_values(
        'dry_run','mount','mag_mod_gen2','res_type','num_samples','wash1_vol','wash2_vol','wash3_vol','lysis_vol','sample_vol','bind_vol','elution_vol')

    except (NameError):
        pass

    #Non-changing Variables
    settling_time= 5  if not dry_run else 0.25
    starting_vol= lysis_vol+sample_vol 

    if mag_mod_gen2:
        magdeck = ctx.load_module('magnetic module gen2', '6')
        MAG_HEIGHT = 6.8
    else:
        magdeck = ctx.load_module('magnetic module gen1', '6')
        MAG_HEIGHT = 13.6
    magdeck.disengage()
    magplate = magdeck.load_labware('nest_96_wellplate_2ml_deep','Sample Plate on Magnet')
    h_s = ctx.load_module('heaterShakerModuleV1','10')
    h_s_plate = h_s.load_labware('opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep','Sample Plate on H-S')
    h_s.close_labware_latch()
    elutionplate = ctx.load_labware('opentrons_96_aluminumblock_nest_wellplate_100ul','1','Elution Plate')
    waste = ctx.load_labware('nest_1_reservoir_195ml', '9','Liquid Waste').wells()[0].top()
    res1 = ctx.load_labware(res_type, '3', 'Reagent Reservoir 1')
    num_cols = math.ceil(num_samples/8)
    
    #Load tips and combine all similar boxes
    tips300 = ctx.load_labware('opentrons_96_filtertiprack_200ul', '2','Tips 1')
    tips301 = ctx.load_labware('opentrons_96_filtertiprack_200ul', '4','Tips 2')
    tips302 = ctx.load_labware('opentrons_96_filtertiprack_200ul', '5','Tips 3')
    tips303 = ctx.load_labware('opentrons_96_filtertiprack_200ul', '7','Tips 4')
    tips = [*tips300.wells(),*tips301.wells(),*tips302.wells(),*tips303.wells()]

    # load P300M pipette
    m300 = ctx.load_instrument('p300_multi_gen2', mount)

    """
    Here is where you can define the locations of your reagents.
    """
    binding_buffer = res1.wells()[:2]
    elution_solution = res1.wells()[-1]
    wash1 = res1.wells()[2:4]
    wash2 = res1.wells()[4:7]
    wash3 = res1.wells()[7:10]
    lysis_ = res1.wells()[10]

    mag_samples_m = magplate.rows()[0][:num_cols]
    hs_samples_m = h_s_plate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]

    m300.flow_rate.aspirate = 50
    m300.flow_rate.dispense = 150
    m300.flow_rate.blow_out = 300

    def tiptrack(pip, tipbox):
        global tip
        global drop_count
        pip.pick_up_tip(tipbox[int(tip)])
        tip = tip + 8
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
        m300.flow_rate.aspirate = 30
        num_trans = math.ceil(vol/180)
        vol_per_trans = vol/num_trans

        def _waste_track(vol):
            global waste_vol 
            waste_vol = waste_vol + (vol*8)
            if waste_vol >= 185000:
                m300.home()
                blink()
                ctx.pause('Please empty liquid waste before resuming.')
                waste_vol = 0

        for i, m in enumerate(mag_samples_m):
            tiptrack(m300,tips)
            loc = m.bottom(0.5)
            for _ in range(num_trans):
                if m300.current_volume > 0:
                    # void air gap if necessary
                    m300.dispense(m300.current_volume, m.top())
                m300.move_to(m.center())
                m300.transfer(vol_per_trans, loc, waste, new_tip='never',air_gap=20)
                _waste_track(vol_per_trans)
                m300.blow_out(waste)
                m300.air_gap(20)
            m300.drop_tip() if not dry_run else m300.return_tip()
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
        center = well.bottom().move(types.Point(x=0,y=0,z=2))
        top = [
            well.bottom().move(types.Point(x=-3,y=3,z=2)),
            well.bottom().move(types.Point(x=3,y=3,z=2))
        ]
        bottom = [
            well.bottom().move(types.Point(x=-3,y=-3,z=2)),
            well.bottom().move(types.Point(x=3,y=-3,z=2))
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
        aspbot = well.bottom(3)
        asptop = well.bottom(10)
        disbot = well.bottom(5)
        distop = well.top()

        vol = mvol * .9

        pip.move_to(center)
        for _ in range(reps):
            pip.aspirate(vol,aspbot)
            pip.dispense(vol,distop)
            pip.aspirate(vol,asptop)
            pip.dispense(vol,disbot)

    def lysis(vol, source):
        ctx.comment('-----Beginning Lysis Steps-----')
        num_transfers = math.ceil(vol/190)
        for i in range(num_cols):
            tiptrack(m300, tips)
            src = source
            tvol = vol/num_transfers
            if i == 0:
                for x in range(3 if not dry_run else 1):
                    m300.aspirate(tvol,src.bottom(0.3))
                    m300.dispense(tvol,src.bottom(8))
            for t in range(num_transfers):
                m300.aspirate(tvol,src.bottom(1))
                m300.air_gap(5)
                m300.dispense(m300.current_volume,hs_samples_m[i].top())
                m300.air_gap(5)
                if t == num_transfers-1:
                    for x in range(10 if not dry_run else 1):
                        if x == 9:
                            m300.flow_rate.aspirate = 20
                            m300.flow_rate.dispense = 20
                        m300.aspirate(tvol,hs_samples_m[i])
                        m300.dispense(tvol,hs_samples_m[i].top())
                    m300.drop_tip() if not dry_run else m300.return_tip()

        m300.flow_rate.aspirate = 200
        m300.flow_rate.dispense = 200

        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=30 if not dry_run else 0.25, msg='Shake at 2000 rpm for 30 minutes.')
        h_s.deactivate_shaker()

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
        ctx.comment('-----Beginning Binding Steps-----')
        latest_chan = -1
        for i, well in enumerate(hs_samples_m):
            wall1 = mag_samples_m[i].top().move(types.Point(x=3,y=0,z=-1))
            wall2 = mag_samples_m[i].top().move(types.Point(x=0,y=3,z=-1))
            wall3 = mag_samples_m[i].top().move(types.Point(x=-3,y=0,z=-1))
            wall4 = mag_samples_m[i].top().move(types.Point(x=0,y=-3,z=-1))
            tiptrack(m300,tips)
            num_trans = math.ceil(vol/190)
            vol_per_trans = vol/num_trans
            source = binding_buffer[i//len(binding_buffer)]
            if i == 0:
                reps=6
            else:
                reps=3
            bead_mixing(source,m300,200,reps=reps if not dry_run else 1)
            #Transfer beads and binding from source to H-S plate
            for t in range(num_trans):
                if m300.current_volume > 0:
                    # void air gap if necessary
                    m300.dispense(m300.current_volume, source.top())
                m300.transfer(vol_per_trans, source, well.top(), air_gap=20,new_tip='never')
                if t < num_trans - 1:
                    m300.air_gap(20)

            bead_mixing(well,m300,180,reps=25 if not dry_run else 1)

            #Wash walls of well after bead mixing
            m300.aspirate(180,well)
            m300.dispense(180, wall1)
            m300.aspirate(180,well)
            m300.dispense(180, wall2)
            m300.aspirate(180,well)
            m300.dispense(180, wall3)
            m300.aspirate(180,well)
            m300.dispense(180, wall4)
            m300.flow_rate.dispense = 10
            m300.aspirate(180,well)
            m300.dispense(180,well)
            m300.flow_rate.dispense = 150

            m300.blow_out(well.top(-2))
            m300.air_gap(20)
            m300.drop_tip() if not dry_run else m300.return_tip()

        h_s.set_and_wait_for_shake_speed(1800)
        ctx.delay(minutes=10 if not dry_run else 0.25, msg='Shake at 1800 rpm for 10 minutes.')
        h_s.deactivate_shaker()

        ctx.comment('------Transferring Sample from H-S Plate to Magdeck Plate------')
        #Transfer from H-S plate to Magdeck plate
        for x in range(num_cols):
            tiptrack(m300,tips)
            num_trans = math.ceil((vol+starting_vol)/190)
            vol_per_trans = (vol+starting_vol)/num_trans
            for y in range(num_trans):
                #Mix before transferring
                m300.aspirate(vol_per_trans,hs_samples_m[x])
                m300.dispense(vol_per_trans,hs_samples_m[x].center())
                m300.aspirate(vol_per_trans,hs_samples_m[x])
                m300.dispense(vol_per_trans,hs_samples_m[x].center())
                #Slow down for actual transfer
                if y == num_trans-1:
                    m300.flow_rate.dispense = 10
                    m300.flow_rate.aspirate = 15
                    vol_per_trans = vol_per_trans + 10
                #Make actual transfer
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume,hs_samples_m[x])
                m300.aspirate(vol_per_trans,hs_samples_m[x])
                m300.dispense(m300.current_volume,mag_samples_m[x])
                m300.flow_rate.dispense = 150
                m300.flow_rate.aspirate = 200
            m300.drop_tip() if not dry_run else m300.return_tip()

        magdeck.engage(height=MAG_HEIGHT)
        for bindi in np.arange(settling_time+1,0,-0.5): #Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg='There are ' + str(bindi) + ' minutes left in the incubation.')

        # remove initial supernatant
        remove_supernatant(vol+starting_vol)

    def wash(vol, source):

        global whichwash #Defines which wash the protocol is on to log on the app

        if source == wash1:
            whichwash = 1
        if source == wash2:
            whichwash = 2
        if source == wash3:
            whichwash = 3

        magdeck.disengage()

        ctx.comment('------Wash ' + str(whichwash) + ' is beginning------')

        num_trans = math.ceil(vol/190)
        vol_per_trans = vol/num_trans
        tiptrack(m300,tips)
        #Add wash with same tip before mixing
        for i, m in enumerate(mag_samples_m):
            if whichwash == 1:
                src = source[i//len(source)]
            else:
                src = source[i]
            for n in range(num_trans):
                if m300.current_volume > 0:
                    m300.dispense(m300.current_volume, src.top())
                m300.transfer(vol_per_trans, src, m.top(), air_gap=20,new_tip='never')
                if n < num_trans - 1:  # only air_gap if going back to source
                    m300.air_gap(20)
            m300.blow_out(m.top())
            m300.air_gap(20)
            
        #Mixing each column after wash has already been added
        for x, col in enumerate(mag_samples_m):
            if x != 0:
                tiptrack(m300,tips)
            resuspend_pellet(col, m300, 200, reps=12 if not dry_run else 1)
            m300.drop_tip() if not dry_run else m300.return_tip()

        if magdeck.status == 'disengaged':
            magdeck.engage(height=MAG_HEIGHT)

        for washi in np.arange(settling_time,0,-0.5): #settling time timer for washes
            ctx.delay(minutes=0.5, msg='There are ' + str(washi) + ' minutes left in wash ' + str(whichwash) + ' incubation.')

        remove_supernatant(vol)

    def elute(vol):
        ctx.comment('-----Beginning Elution Steps-----')
        # resuspend beads in elution
        magdeck.disengage()

        tiptrack(m300,tips)
        for i, m in enumerate(mag_samples_m):
            side = 1 if i % 2 == 0 else -1
            loc = m.top(-3).move(Point(x=side*2))
            m300.aspirate(vol, elution_solution)
            m300.move_to(m.center())
            m300.dispense(vol, loc)
            
        for x, (col,hs_col) in enumerate(zip(mag_samples_m,hs_samples_m)):
            if x != 0:
                tiptrack(m300,tips)
            ctx.comment('------Mixing Elution with Beads in Plate------')
            resuspend_pellet(col, m300, elution_vol)
            ctx.comment('------Transferring Sample from Magdeck Plate to H-S Plate------')
            #Transfer from magnet to H-S
            m300.flow_rate.dispense = 10
            m300.flow_rate.aspirate = 15
            m300.aspirate(vol,col)
            m300.dispense(vol,col.bottom(2))
            m300.aspirate(vol,col)
            m300.dispense(vol,col.bottom(2))
            m300.aspirate(vol,col)
            m300.air_gap(10)
            m300.dispense(m300.current_volume,hs_col)
            m300.aspirate(vol/2,col)
            m300.air_gap(10)
            m300.dispense(m300.current_volume,hs_col)
            m300.blow_out(hs_col.bottom(5))
            m300.air_gap(20)
            m300.drop_tip() if not dry_run else m300.return_tip()

        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=5 if not dry_run else 0.25,msg='Shake on H-S for 5 minutes at 2000 rpm.')
        h_s.deactivate_shaker()

        ctx.comment('------Transferring Sample from H-S Plate to Magdeck Plate------')
        #Transfer back to magnet
        for i in range(num_cols):
            tiptrack(m300,tips)
            m300.aspirate(vol,hs_samples_m[i])
            m300.dispense(vol,hs_samples_m[i])
            m300.aspirate(vol,hs_samples_m[i])
            m300.air_gap(10)
            m300.dispense(m300.current_volume,mag_samples_m[i])
            m300.aspirate(vol/2,hs_samples_m[i])
            m300.air_gap(10)
            m300.dispense(m300.current_volume,mag_samples_m[i])
            m300.blow_out(mag_samples_m[i].bottom(.5))
            m300.drop_tip() if not dry_run else m300.return_tip()

        magdeck.engage(height=MAG_HEIGHT)
        
        for elutei in np.arange(settling_time,0,-0.5):
            ctx.delay(minutes=0.5, msg='Incubating on MagDeck for ' + str(elutei) + ' more minutes.')

        for i, (m, e) in enumerate(
                zip(mag_samples_m, elution_samples_m)):
            tiptrack(m300,tips)
            m300.flow_rate.dispense = 10
            m300.flow_rate.aspirate = 15
            side = -1 if i % 2 == 0 else 1
            loc = m.bottom(0.5).move(Point(x=side*2))
            m300.transfer(vol, loc, e.bottom(5), air_gap=20, new_tip='never')
            m300.blow_out(e.top(-2))
            m300.air_gap(20)
            m300.drop_tip() if not dry_run else m300.return_tip()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    lysis(lysis_vol,lysis_)
    bind(bind_vol)
    wash(wash1_vol, wash1)
    if not dry_run:
        wash(wash2_vol, wash2)
        wash(wash3_vol, wash3)
        drybeads = 10 #Number of minutes you want to dry for
        h_s.set_and_wait_for_temperature(55)
    else:
        drybeads = 0.5
    for beaddry in np.arange(drybeads,0,-0.5):
        ctx.delay(minutes=0.5, msg='There are ' + str(beaddry) + ' minutes left in the drying step.')
    elute(elution_vol)
    h_s.deactivate_heater()
