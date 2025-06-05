from opentrons.types import Point
import json
import math
from opentrons import types
import numpy as np

metadata = {
    'author': 'Zach Galluzzo <zachary.galluzzo@opentrons.com>'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.18"
}

"""
Here is where you can modify the magnetic module engage height:
"""
whichwash = 1
sample_max = 48
tip1k = 0
drop_count = 0
waste_vol = 0

def add_parameters(p):
    p.add_int(
        display_name="Number of Samples",
        variable_name="num_samples",
        default=8,
        minimum=1,
        maximum=48,
        description="How many samples will be processed (multiples of 8 work most efficiently- 48 sample max)?"
    )

    p.add_bool(
        display_name="Trash Chute Present?",
        variable_name="trash_chute",
        default=False,
        description="Is there a trash chute present? If False, waste bin loaded in D3."
    )

    p.add_bool(
        display_name="Use Gripper",
        variable_name="USE_GRIPPER",
        default=True,
        description="Is there a gripper present to move labware around the deck?"
    )

    p.add_bool(
        display_name="Dry Run",
        variable_name="dry_run",
        default=False,
        description="True will shorten incubation times and mix reps, false will run according to manual."
    )

    p.add_bool(
        display_name="Heater-Shaker present?",
        variable_name="heater_shaker",
        default=True,
        description="Is there a heater-shaker on deck for this protocol?"
    )

    p.add_str(
        display_name="Deepwell type?",
        variable_name="Macherey_Nagel_DW",
        default="nest_96_wellplate_2ml_deep",
        description="Which type of deep well plate will be used?",
        choices=[
        {"display_name":"Nest 96 Well 2ml Deep Well","value":"nest_96_wellplate_2ml_deep"},
        {"display_name":"M-N Round Bottom Deep Well","value":"macherey_nagel_dwplate_2200ul"}])

    p.add_bool(
        display_name="Temperature Module Present?",
        variable_name="temp_mod",
        default=True,
        description="Is there a temperature module gen2 on deck for this protocol?"
    )

    p.add_str(
        display_name="P1000 Mount",
        variable_name="mount",
        default="left",
        description="Which mount is the p1000 pipette on?",
        choices=[
        {"display_name":"right","value":"right"},
        {"display_name":"left","value":"left"}])

    p.add_str(
        display_name="Reservoir type?",
        variable_name="res_type",
        default="nest_12_reservoir_15ml",
        description="Which type of reservoir will be used?",
        choices=[
        {"display_name":"Nest 12 Well Reservoir (15ml)","value":"nest_12_reservoir_15ml"},
        {"display_name":"USA 12 Well Reservoir (22ml)","value":"usascientific_12_reservoir_22ml"}])

# Start protocol
def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    trash_chute       = ctx.params.trash_chute #If this is true, trash chute is loaded in D3, otherwise trash bin is loaded there
    USE_GRIPPER       = ctx.params.USE_GRIPPER
    dry_run           = ctx.params.dry_run
    heater_shaker     = ctx.params.heater_shaker
    Macherey_Nagel_DW = ctx.params.Macherey_Nagel_DW
    temp_mod          = ctx.params.temp_mod #True or false if you have a temp mod loaded on deck with the elution plate
    mount             = ctx.params.mount
    res_type          = ctx.params.res_type
    num_samples       = ctx.params.num_samples


    #Protocol Parameters
    # trash_chute = False
    # USE_GRIPPER = True
    # dry_run = False
    # Macherey_Nagel_DW = False
    # heater_shaker = True
    # temp_mod = True
    # mount = 'left'
    # res_type="nest_12_reservoir_15ml"
    # #48 Sample Max
    # num_samples = 48

    #FAS/ Science Tunable Parameters
    lysis_vol = 350 #MR1
    bind_vol = 350 #MR2
    wash1_vol= 600 #MR3
    wash2_vol= 900 #MR4
    wash3_vol= 900 #MR4
    dnase_vol = 300
    stop_vol = 350 #MR2
    elution_vol = 100 #MR5

    try:
        [trash_chute,USE_GRIPPER, dry_run,Macherey_Nagel_DW,temp_mod,mount,res_type,num_samples,wash1_vol,wash2_vol,wash3_vol,lysis_vol,bind_vol,dnase_vol,stop_vol,elution_vol] = get_values(  # noqa: F821
        'trash_chute','USE_GRIPPER','dry_run','Macherey_Nagel_DW','temp_mod','mount','res_type','num_samples','wash1_vol','wash2_vol','wash3_vol','lysis_vol','bind_vol','dnase_vol','stop_vol','elution_vol')

    except (NameError):
        pass

    if Macherey_Nagel_DW:
        deepwell_type = "macherey_nagel_dwplate_2200ul"
    else:
        deepwell_type = "nest_96_wellplate_2ml_deep"
    
    pk_vol = 6 #TCEP
    bead_vol = 30
    lysis_total_vol = lysis_vol + pk_vol #350 MR1 + 6 TCEP
    binding_buffer_vol = bind_vol + bead_vol #350 bind (MR2) + 30 b-beads
    if not dry_run:
        settling_time = 4
    else:
        settling_time = 0.25

    if trash_chute:
        trash = ctx.load_waste_chute()
    else:
        trash = ctx.load_trash_bin("D3")
    
    sample_vol = 10 #Sample should be pelleted tissue/bacteria/cells
    starting_vol = lysis_total_vol+sample_vol 
    
    if heater_shaker:
        h_s = ctx.load_module('heaterShakerModuleV1','D1')
        if Macherey_Nagel_DW:
            h_s_adapter = h_s.load_adapter('opentrons_universal_flat_adapter')
        else:
            h_s_adapter = h_s.load_adapter('opentrons_96_deep_well_adapter')
        sample_plate = h_s_adapter.load_labware(deepwell_type,'Sample Plate')
        h_s.close_labware_latch()
    else:
        sample_plate = ctx.load_labware(deepwell_type,'D1','Sample Plate')

    if temp_mod:
        temp = ctx.load_module('temperature module gen2','A3')
        tempblock = temp.load_adapter('opentrons_96_well_aluminum_block')
        elutionplate = tempblock.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','Elution Plate')
    else:
        elutionplate = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A3','Elution Plate')
    magblock = ctx.load_module('magneticBlockV1','C1')
    waste = ctx.load_labware('nest_1_reservoir_195ml', 'B3','Liquid Waste').wells()[0].top()
    res1 = ctx.load_labware(res_type, 'D2', 'reagent reservoir 1')
    res2 = ctx.load_labware(res_type, 'C2', 'reagent reservoir 2')
    num_cols = math.ceil(num_samples/8)
    
    #Load tips and combine all similar boxes
    tips1000 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A1','Tips 1')
    tips1001 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A2','Tips 2')
    tips1002 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B1','Tips 3')
    tips1003 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B2','Tips 4')
    tips = [*tips1000.wells()[(8*num_cols):96],*tips1001.wells(),*tips1002.wells(),*tips1003.wells()]
    tips_sn = tips1000.wells()[:(8*num_cols)]

    # load instruments
    m1000 = ctx.load_instrument('flex_8channel_1000', mount)

    """
    Here is where you can define the locations of your reagents.
    """
    lysis_ = res1.wells()[:2]
    binding_buffer = res1.wells()[2:4]
    dnaseI = res1.wells()[4:6]
    stop = res1.wells()[6:8]
    wash1 = res1.wells()[8:11]
    elution_solution = res1.wells()[-1]
    wash2 = res2.wells()[:6]
    wash3 = res2.wells()[6:]

    samples_m = sample_plate.rows()[0][:num_cols]
    newsamples_m = sample_plate.rows()[0][num_cols:2*num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]
    #Redefine for liquid definitions (per well)
    samps = sample_plate.wells()[:(8*num_cols)]

    colors = ['#008000','#008000','#A52A2A','#A52A2A','#00FFFF','#0000FF','#800080',\
    '#ADD8E6','#FF0000','#FFFF00','#FF00FF','#00008B','#7FFFD4',\
    '#FFC0CB','#FFA500','#00FF00','#C0C0C0']

    #Begin with assigning plate wells before reservoir wells
    samples = ctx.define_liquid(name='Samples',description='Cell Pellet',display_color='#FFA500')
    
    for well in samps:
        well.load_liquid(liquid=samples,volume=0)

    locations = [lysis_,lysis_,binding_buffer,binding_buffer,wash1,wash2,wash3,dnaseI,stop,elution_solution]
    vols = [lysis_vol,pk_vol,bead_vol,bind_vol,wash1_vol,wash2_vol,wash3_vol,dnase_vol,stop_vol,elution_vol]
    liquids = ['Lysis','PK','Beads','Binding','Wash 1','Wash 2','Wash 3','DNAseI','Stop','Elution']

    delete = len(colors)-len(liquids)

    if delete>=1:
        for i in range(delete):
            colors.pop(-1)

    def liquids_(liq,location,color,vol):
        sampnum = 8*(math.ceil(num_samples/8))
        """
        Takes an individual liquid at a time and adds the color to the well
        in the description.
        """
        #Volume Calculation
        if liq == "PK":
            extra_samples = math.ceil(1500/lysis_vol)
        
        elif liq == "Beads":
            extra_samples = math.ceil(1500/bind_vol)
        
        else:
            extra_samples = math.ceil(1500/vol)
        
        #Defining and assigning liquids to wells
        if isinstance(location,list):
            limit = sample_max/len(location) #Calculates samples/ res well
            iterations = math.ceil(sampnum/limit)
            left = sampnum - limit
            while left>limit:
                left = left - limit
            if left > 0:
                last_iteration_samp_num = left
            elif left < 0:
                last_iteration_samp_num = sampnum
            else:
                last_iteration_samp_num = limit

            samples_per_well = []

            for i in range(iterations):
                #append the left over on the last iteration
                if i == (iterations-1):
                    samples_per_well.append(last_iteration_samp_num)
                else:
                    samples_per_well.append(limit)

            liq = ctx.define_liquid(name=str(liq),description=str(liq),display_color=color)
            for sample, well in zip(samples_per_well,location[:len(samples_per_well)]):
                v = vol*(sample+extra_samples)
                well.load_liquid(liquid=liq,volume=v)

        else:
            v = vol*(sampnum+extra_samples)
            liq = ctx.define_liquid(name=str(liq),description=str(liq),display_color=color)
            location.load_liquid(liquid=liq,volume=v)

    for x,(ll,l,c,v) in enumerate(zip(liquids,locations,colors,vols)):
        liquids_(ll,l,c,v)        

    m1000.flow_rate.aspirate = 300
    m1000.flow_rate.dispense = 300
    m1000.flow_rate.blow_out = 300

    def tiptrack(pip, tipbox):
        global tip1k
        global drop_count
        if tipbox == tips:
            m1000.pick_up_tip(tipbox[int(tip1k)])
            tip1k = tip1k + 8

        drop_count = drop_count + 8
        if drop_count >= 250:
            drop_count = 0
            ctx.pause("Please empty the waste bin of all the tips before continuing.")

    def blink():
        for i in range(3):
            ctx.set_rail_lights(True)
            ctx.delay(minutes=0.01666667)
            ctx.set_rail_lights(False)
            ctx.delay(minutes=0.01666667)

    def _waste_track(vol):
            global waste_vol
            waste_vol = waste_vol + (vol*8)
            ctx.comment("Waste Volume = " + str(waste_vol))
            if waste_vol >= 180000:
                blink()
                ctx.pause("Please empty liquid waste before resuming")
                waste_vol = 0

    def remove_supernatant(vol):
        ctx.comment("-----Removing Supernatant-----")
        m1000.flow_rate.aspirate = 20
        num_trans = math.ceil(vol/980)
        vol_per_trans = vol/num_trans
        m1000.flow_rate.aspirate = 50
        for i, m in enumerate(newsamples_m):
            m1000.pick_up_tip(tips_sn[8*i])
            loc = m.bottom(0.2)
            for _ in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, m.top())
                m1000.move_to(m.center())
                _waste_track(vol)
                m1000.transfer(vol_per_trans, loc, waste, new_tip='never',air_gap=20)
                ctx.delay(seconds=1)
                m1000.blow_out()
                m1000.air_gap(20)
            m1000.drop_tip(tips_sn[8*i])
        m1000.flow_rate.aspirate = 300

        #Move Plate From Magnet to H-S
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            h_s_adapter if heater_shaker else "D1",
            use_gripper=USE_GRIPPER
        )
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
        center = well.top().move(types.Point(x=0,y=0,z=5))
        aspbot = well.bottom().move(types.Point(x=1,y=2,z=1))
        asptop = well.bottom().move(types.Point(x=0,y=-2,z=2.5))
        disbot = well.bottom().move(types.Point(x=-1,y=2,z=3))
        distop = well.top().move(types.Point(x=0,y=1,z=0))

        if mvol > 1000:
            mvol = 1000

        vol = mvol * .9

        pip.flow_rate.aspirate = 500
        pip.flow_rate.dispense = 500

        pip.move_to(center)
        for _ in range(reps):
            pip.aspirate(vol,aspbot)
            pip.dispense(vol,distop)
            pip.aspirate(vol,asptop)
            pip.dispense(vol,disbot)
            if _ == reps-1:
                pip.flow_rate.aspirate = 150
                pip.flow_rate.dispense = 75
                pip.aspirate((2*vol/3),aspbot)
                pip.dispense(pip.current_volume,aspbot)

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
        disp = well.top(-15)

        if mvol > 1000:
            mvol = 1000

        vol = mvol * .9

        pip.flow_rate.aspirate = 500
        pip.flow_rate.dispense = 500

        pip.move_to(center)
        for _ in range(reps):
            pip.aspirate(vol,asp)
            pip.dispense(vol,disp)
            pip.aspirate(vol,asp)
            pip.dispense(vol,disp)
            if _ == reps-1:
                pip.flow_rate.aspirate = 150
                pip.flow_rate.dispense = 75
                pip.aspirate(vol,asp)
                pip.dispense(vol,asp)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300

    def lysis(vol, source):
        num_transfers = math.ceil(vol/980)
        tiptrack(m1000, tips)
        for i in range(num_cols):
            src = source[i//3]
            tvol = vol/num_transfers
            mixvol = num_cols*vol
            if mixvol > 1000:
                mixvol = 1000
            if i == 0 or i == 3:
                for x in range(4 if not dry_run else 1): #Mix TCEP and Lysis
                    m1000.aspirate(mixvol,src.bottom(1.1))
                    m1000.dispense(mixvol,src.bottom(20))
            for t in range(num_transfers): #Transfer lysis to samples
                m1000.aspirate(tvol,src.bottom(1))
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume,samples_m[i].top())
        
        for i in range(num_cols): #Mix lysis and cell pellet
            if i != 0:
                tiptrack(m1000,tips)
            for mix in range(12 if not dry_run else 1):
                m1000.aspirate(300, samples_m[i])
                m1000.dispense(300, samples_m[i].bottom(25))
            m1000.flow_rate.aspirate = 20
            m1000.flow_rate.dispense = 20
            m1000.aspirate(300, samples_m[i])
            m1000.dispense(300, samples_m[i].bottom(10))
            m1000.flow_rate.aspirate = 300
            m1000.flow_rate.dispense = 300
            m1000.drop_tip() if not dry_run else m1000.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            h_s.set_and_wait_for_temperature(56)
            ctx.delay(minutes=4 if not dry_run else 0.25, msg='Shake at 2000 rpm for 5 minutes.')
            h_s.deactivate_shaker()
            h_s.deactivate_heater()
        else:
            if not dry_run:
                ctx.pause('Shake plate at 2000 rpm and 56C for 4 minutes, then return plate to D1.')
            else:
                ctx.comment('Normally a shaking step here.')

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
        tiptrack(m1000,tips)
        for i, well2 in enumerate(newsamples_m):
            #Next set of logic uses extra mixing volume when appropriate
            if num_cols > 4:
                if i == 0 or i == 3:
                    mixvol = 1.5*vol
                else:
                    mixvol = vol
            else:
                if num_cols > 1:
                    if i == 0:
                        mixvol = 1.5*vol
                    else:
                        mixvol = vol
                else:
                    mixvol = vol
            num_trans = math.ceil(vol/980)
            vol_per_trans = vol/num_trans
            source = binding_buffer[i//3]
            if i == 0 or i == 3: # use bubbles to lift the settled beads in reservoir
                reps=8
                m1000.aspirate(750,source.top(-1))
                m1000.dispense(750,source.bottom(2)) 
            else:
                reps=4       
            bead_mixing(source,m1000,mixvol,reps=reps if not dry_run else 1)
            #Transfer beads and binding from source to H-S plate
            m1000.flow_rate.dispense = 80
            for t in range(num_trans):
                m1000.aspirate(vol_per_trans,source.bottom(1))
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume,well2.top())
                m1000.air_gap(10)
            
        for i, (well, well2) in enumerate(zip(samples_m,newsamples_m)):
            if i != 0:
                tiptrack(m1000,tips)
            #Transfer sample from original well to well with Beads & Binding
            m1000.aspirate(350,well.bottom(1))
            m1000.air_gap(10)
            m1000.dispense(m1000.current_volume,well2.top(-2))
            m1000.flow_rate.dispense = 300
            bead_mixing(well2,m1000,vol_per_trans+lysis_vol,reps=4 if not dry_run else 1)
            m1000.move_to(well2.top(-5))
            ctx.delay(seconds=0.5)
            m1000.blow_out()
            m1000.drop_tip() if not dry_run else m1000.return_tip()

        ctx.comment("-----Mixing Bind and Lysis-----")
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1800)
            ctx.delay(minutes=5 if not dry_run else 0.25, msg='Shake at 1800 rpm for 5 minutes.')
            h_s.deactivate_shaker()

        else:
            if dry_run:
                ctx.comment('Normally a 5 minute shake here.')
            else:
                ctx.pause(msg='Please shake sample plate 1800 rpm for 5 minutes or carefully vortex occasionally.')

        #Transfer from H-S plate to Magdeck plate
        if heater_shaker:    
            h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()

        for bindi in np.arange(settling_time+1.5,0,-0.5): #Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg='There are ' + str(bindi) + ' minutes left in the incubation.')

        # remove initial supernatant
        remove_supernatant(vol+starting_vol)

        ctx.delay(minutes=2,msg='Please allow 2 minutes for beads to dry at room temperature')

    def wash(vol, source):
        global whichwash #Defines which wash the protocol is on to log on the app

        if source == wash1:
            whichwash = int(1)
            speed = 1800
        if source == wash2:
            whichwash = int(2)
            speed = 1600
        if source == wash3:
            whichwash = int(3)
            speed = 1600
        
        num_trans = math.ceil(vol/980)
        vol_per_trans = vol/num_trans

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            ctx.delay(minutes=0.3, msg='Please allow ~20 second dry shake to loosen the pellet')
            h_s.deactivate_shaker()

        ctx.comment("-----Wash " + str(whichwash) + " is starting now------")
        tiptrack(m1000,tips)
        m1000.flow_rate.aspirate = 125
        m1000.flow_rate.dispense = 125
        for i, m in enumerate(newsamples_m):
            if whichwash == 1:
                src = source[i//2]
            else:
                src = source[i]
            for n in range(num_trans):
                m1000.transfer(vol_per_trans, src, m.top(), air_gap=10,new_tip='never')
        m1000.drop_tip() if not dry_run else m1000.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(speed)
            ctx.delay(minutes=5 if not dry_run else 0.25, msg='Please allow 5 minutes of shaking to properly mix buffer with the beads')
            h_s.deactivate_shaker()
        else:
            if dry_run:
                ctx.comment('Normally a 5 minute shake here.')
            else:
                ctx.pause(msg=f'Place on a shaker at {speed} rpm for 5 minutes then return plate to D1.')

        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()

        for washi in np.arange(settling_time,0,-0.5): #settling time timer for washes
            ctx.delay(minutes=0.5, msg='There are ' + str(washi) + ' minutes left in wash ' + str(whichwash) + ' incubation.')

        remove_supernatant(vol)

        m1000.flow_rate.aspirate = 300
        m1000.flow_rate.dispense = 300

    def dnase(vol, source):
        ctx.comment('-----Beginning DNAseI Steps-----')
        num_trans = math.ceil(vol/980)
        vol_per_trans = vol/num_trans
        
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            ctx.delay(minutes=0.3, msg='Please allow ~20 second dry shake to loosen the pellet')
            h_s.deactivate_shaker()

        tiptrack(m1000, tips)

        for i, m in enumerate(newsamples_m):
            src = source[i//3]
            m1000.flow_rate.aspirate = 100
            for n in range(num_trans):
                m1000.aspirate(vol,src)
                m1000.dispense(vol,m.top(-5))
                m1000.blow_out()

        m1000.flow_rate.aspirate = 300

        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000,tips)
            mixing(newsamples_m[i], m1000, vol, reps=5 if not dry_run else 1)
            m1000.drop_tip() if not dry_run else m1000.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=300)
            ctx.delay(minutes=15 if not dry_run else 0.1,msg='Incubating sample with DNAseI at RT for 15 minutes.')
            h_s.deactivate_shaker()   
        else:
            if dry_run:
                ctx.comment('Normally a 15 minute shake here.')
            else:
                ctx.pause(msg='Place on shaker at 300 rpm for 15 minutes.') 

    def stop_reaction(vol, source):
        ctx.comment('-----Adding Stop Solution to Inactivate DNAseI-----')
        num_trans = math.ceil(vol/980)
        vol_per_trans = vol/num_trans
        tiptrack(m1000, tips)
        for i, m in enumerate(newsamples_m):
            src = source[i//3]
            for n in range(num_trans):
                if m1000.current_volume > 0:
                    m1000.dispense(m1000.current_volume, src.top())
                m1000.transfer(vol_per_trans, src.bottom(1), m.top(), air_gap=20, new_tip='never')
            
        m1000.drop_tip() if not dry_run else m1000.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=1500)
            ctx.delay(minutes=6 if not dry_run else 0.1,msg='Shaking at RT for 6 minutes to inactivate DNAseI.')
            h_s.deactivate_shaker()
        else:
            if dry_run:
                ctx.comment('Normally a 6 minute shake here.')
            else:
                ctx.pause(msg='Place plate on shaker at 1500 rpm for 6 minutes then return plate to D1.')


        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()

        for stop in np.arange(settling_time,0,-0.5):
            ctx.delay(minutes=0.5,msg='There are ' + str(stop) + ' minutes left in this incubation.')

        remove_supernatant(vol+300)

    def elute(vol):
        ctx.comment("-----Beginning Elution Steps-----")
        
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            ctx.delay(minutes=0.3, msg='Please allow ~20 second dry shake to loosen the pellet')
            h_s.deactivate_shaker()

        tiptrack(m1000, tips)
        for i, m in enumerate(newsamples_m):
            m1000.aspirate(vol, elution_solution.bottom(1))
            m1000.dispense(m1000.current_volume, m.top(-2))
            m1000.blow_out(m.top(-2))

        m1000.move_to(newsamples_m[0].top(10))

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            ctx.delay(minutes=5 if not dry_run else 0.25,msg='Shake on H-S for 5 minutes at 2000 rpm.')
            h_s.deactivate_shaker()

        else:
            if dry_run:
                ctx.comment('Normally 5 minutes of shaking here.')
            else:
                ctx.pause(msg='Place plate on shaker at 2000 rpm for 5 minutes then return plate to D1.')

        for i,col in enumerate(newsamples_m):
            if i != 0:
                tiptrack(m1000,tips)
            mixing(col,m1000,vol,reps=4)
            m1000.drop_tip() if not dry_run else m1000.return_tip()

        #Transfer back to magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()

        for elutei in np.arange(settling_time+1.5,0,-0.5):
            ctx.delay(minutes=0.5, msg='Incubating on MagDeck for ' + str(elutei) + ' more minutes.')

        for i, (m, e) in enumerate(zip(newsamples_m, elution_samples_m)):
            tiptrack(m1000,tips)
            m1000.flow_rate.dispense = 100
            m1000.flow_rate.aspirate = 10
            m1000.transfer(vol, m.bottom(0.15), e.bottom(5), air_gap=20, new_tip='never')
            ctx.delay(seconds=0.5)
            m1000.blow_out()
            m1000.flow_rate.aspirate = 300
            m1000.drop_tip() if not dry_run else m1000.return_tip()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    lysis(lysis_total_vol,lysis_)
    bind(binding_buffer_vol)
    dnase(dnase_vol,dnaseI)
    stop_reaction(stop_vol,stop)
    wash(wash1_vol, wash1)
    if not dry_run:
        wash(wash2_vol, wash2)
        wash(wash3_vol, wash3)
        drybeads = 10 # Number of minutes you want to dry for
    else:
        drybeads = 0.5
    for beaddry in np.arange(drybeads,0,-0.5):
        ctx.delay(minutes=0.5, msg='There are ' + str(beaddry) + ' minutes left in the drying step.')
    elute(elution_vol)
    if not dry_run:
        temp.set_temperature(4)