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
    "apiLevel": "2.19"
}

"""
Here is where you can modify the magnetic module engage height:
"""
whichwash   = 1
sample_max  = 48
tip1k       = 0
tipsuper    = 0
drop_count  = 0
waste_vol   = 0

def add_parameters(p):
    p.add_bool(
        display_name="Trash Chute?",
        variable_name="trash_chute",
        default=False,
        description="Select if there is a waste chute present on deck (otherwise trash bin in D3)."
    )
    p.add_bool(
        display_name="Use Gripper?",
        variable_name="USE_GRIPPER",
        default=True,
        description="Is there a gripper attached to the device?"
    )
    p.add_bool(
        display_name="Machaerey-Nagel Deepwell?",
        variable_name="Macherey_Nagel_DW",
        default=False,
        description="If yes, use the Macherey-Nagle deepwell, otherwise the Nest 2ml deepwell."
    )
    p.add_bool(
        display_name="Dry Run",
        variable_name="dry_run",
        default=False,
        description="If on, this will perform a dry run with lower mixing reps and shortened incubations."
    )
    p.add_bool(
        display_name="Include Lysis?",
        variable_name="inc_lysis",
        default=True,
        description="Should the robot perform lysis on deck?"
    )
    p.add_str(
        display_name="Reservoir type",
        variable_name="res_type",
        default="nest_12_reservoir_15ml",
        description="Will you use nests 15 or 22 ml reservoir?",
        choices=[
        {"display_name":"Nest 15 ml Reservoir","value":"nest_12_reservoir_15ml"},
        {"display_name":"Nest 22 ml Reservoir","value":"nest_12_reservoir_22ml"}]
    )
    p.add_str(
        display_name="M1000 Mount",
        variable_name="mount",
        default="left",
        description="Which mount will the 1000ul multi-channel be attached to?",
        choices=[
        {"display_name":"Left","value":"left"},
        {"display_name":"Right","value":"right"}]
    )
    p.add_bool(
        display_name="Temperature module?",
        variable_name="temp_mod",
        default=True,
        description="Is there a temperature module present?"
    )
    p.add_bool(
        display_name="Heater-Shaker module?",
        variable_name="heater_shaker",
        default=True,
        description="Is there a heater-shaker modul present?"
    )
    p.add_bool(
        display_name="Extra Wash?",
        variable_name="extra_wash",
        default=True,
        description="Would you like an extra MB4 wash to improve purity?"
    )
    p.add_bool(
        display_name="Reuse supernatant tips?",
        variable_name="reuse_sup_tips",
        default=False,
        description="Should supernatant tips be reused throughout the protocol?"
    )
    p.add_int(
        display_name="Number of Samples",
        variable_name="num_samples",
        default=48,
        minimum=1,
        maximum=48,
        description="How many samples will be run?"
    )
    p.add_int(
        display_name="Wash 1 (MB3) Volume",
        variable_name="wash1_vol",
        default=600,
        minimum=400,
        maximum=800,
        description="What volume should be used in wash 1?"
    )
    p.add_int(
        display_name="Wash 2 (MB4) Volume",
        variable_name="wash2_vol",
        default=600,
        minimum=400,
        maximum=800,
        description="What volume should be used in wash 2?"
    )
    p.add_int(
        display_name="Wash 3 (Extra MB4) Volume",
        variable_name="wash3_vol",
        default=600,
        minimum=400,
        maximum=800,
        description="What volume should be used in wash 3?"
    )
    p.add_int(
        display_name="Last Wash (MB5) Volume",
        variable_name="wash4_vol",
        default=900,
        minimum=700,
        maximum=1000,
        description="What volume should be used in the final wash?"
    )
    p.add_int(
        display_name="Lysis Volume",
        variable_name="lysis_vol",
        default=200,
        minimum=100,
        maximum=250,
        description="What volume should be used in the lysis step?"
    )
    p.add_int(
        display_name="Bind Volume",
        variable_name="bind_vol",
        default=360,
        minimum=200,
        maximum=500,
        description="What volume should be used in wash 1?"
    )
    p.add_int(
        display_name="Elution Volume",
        variable_name="elution_vol",
        default=100,
        minimum=50,
        maximum=200,
        description="What volume should the DNA be eluted in?"
    )


# Start protocol
def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    
    #Hard Coded Functions
    trash_chute         = ctx.params.trash_chute #If false, waste bin loaded in D3, if True, trash chute loaded there
    USE_GRIPPER         = ctx.params.USE_GRIPPER
    Macherey_Nagel_DW   = ctx.params.Macherey_Nagel_DW
    dry_run             = ctx.params.dry_run
    inc_lysis           = ctx.params.inc_lysis
    mount               = ctx.params.mount
    res_type            = ctx.params.res_type
    temp_mod            = ctx.params.temp_mod #True or false if you have a temp mod loaded on deck with the elution plate
    heater_shaker       = ctx.params.heater_shaker
    extra_wash          = ctx.params.extra_wash
    reuse_sup_tips      = ctx.params.reuse_sup_tips

    num_samples         = ctx.params.num_samples
    wash1_vol           = ctx.params.wash1_vol
    wash2_vol           = ctx.params.wash2_vol
    wash3_vol           = ctx.params.wash3_vol
    wash4_vol           = ctx.params.wash4_vol
    lysis_vol           = ctx.params.lysis_vol
    bind_vol            = ctx.params.bind_vol
    elution_vol         = ctx.params.elution_vol

    # try:
    #     [res_type,temp_mod,trash_chute,USE_GRIPPER, Macherey_Nagel_DW,dry_run,inc_lysis,mount, extra_wash, reuse_sup_tips,num_samples,heater_shaker,wash1_vol,wash2_vol,wash3_vol,wash4_vol,lysis_vol,bind_vol,elution_vol] = get_values(  # noqa: F821
    #     'res_type','temp_mod','trash_chute','USE_GRIPPER','Macherey_Nagel_DW','dry_run','inc_lysis','mount', 'extra_wash', 'reuse_sup_tips','num_samples','heater_shaker','wash1_vol','wash2_vol','wash3_vol','wash4_vol','lysis_vol','bind_vol','elution_vol')

    # except (NameError):
    #     pass
    
    #Protocol Parameters
    if Macherey_Nagel_DW:
        deepwell_type           = "macherey_nagel_dwplate_2200ul"
    else:
        deepwell_type           = "nest_96_wellplate_2ml_deep"    
    if not dry_run:
            settling_time       = 3.5
            lysis_incubation    = 80
    else:
        settling_time           = 0.25
        lysis_incubation        = 0.25
    if trash_chute:
        trash = ctx.load_waste_chute()
    else:
        trash = ctx.load_trash_bin('D3')

    res_type            = "nest_12_reservoir_15ml"
    sample_vol          = 10 #Sample should be pelleted tissue/bacteria/cells
    PK_vol = bead_vol   = 25
    lysis_total_vol     = lysis_vol + PK_vol
    starting_vol        = lysis_total_vol+sample_vol
    binding_buffer_vol  = bind_vol+bead_vol

    if heater_shaker:
        h_s             = ctx.load_module('heaterShakerModuleV1','D1')
        if Macherey_Nagel_DW:
            h_s_adapter = h_s.load_adapter('opentrons_universal_flat_adapter')
        else:
            h_s_adapter = h_s.load_adapter('opentrons_96_deep_well_adapter')
        sample_plate    = h_s_adapter.load_labware(deepwell_type,'Sample Plate')
        h_s.close_labware_latch()
    else:
        sample_plate    = ctx.load_labware(deepwell_type,'D1','Sample Plate')
    
    if temp_mod:
        temp            = ctx.load_module('temperature module gen2','A3')
        temp_block      = temp.load_adapter('opentrons_96_well_aluminum_block')
        elutionplate    = temp_block.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','Elution Plate')
    else:
        elutionplate    = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A3','Elution Plate')

    magblock            = ctx.load_module('magneticBlockV1','C1')
    waste               = ctx.load_labware('nest_1_reservoir_195ml', 'B3','Liquid Waste').wells()[0].top()
    res1                = ctx.load_labware(res_type, 'D2', 'reagent reservoir 1')
    res2                = ctx.load_labware(res_type, 'C2', 'reagent reservoir 2')
    num_cols            = math.ceil(num_samples/8)
    
    # load instruments
    m1000       = ctx.load_instrument('flex_8channel_1000', mount)
    
    #Load tips and combine all similar boxes
    tips1000    = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A1','Tips 1')
    if reuse_sup_tips:
        tips    = [*tips1000.wells()[8*(num_cols):96]]
        tips_sn = tips1000.wells()[:8*(num_cols)]
        if num_cols >= 2:
            tips1001 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A2','Tips 2')
            for well in tips1001.wells():
                tips.append(well)
            if num_cols >= 4:
                tips1002 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B1','Tips 3')
                for well in tips1002.wells():
                    tips.append(well)
                if num_cols == 6:
                    tips1003 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B2','Tips 4')
                    for well in tips1003.wells():
                        tips.append(well)
    else:
        tips = [tips1000]
        if num_cols >= 2:
            tips1001 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A2','Tips 2')
            tips.append(tips1001)
            if num_cols >= 3:
                tips1002 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B1','Tips 3')
                tips.append(tips1002)
                if extra_wash:
                    if num_cols >=4:
                        tips1003 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B2','Tips 4')
                        tips.append(tips1003)
                        if num_cols == 6:
                            tips1004 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'C3','Tips 5')
                            tips.append(tips1004)
                else:
                    if num_cols >= 5:
                        tips1003 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B2','Tips 4')
                        tips.append(tips1003)
                        if num_cols == 6:
                            tips1004 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'C3','Tips 5')
                            tips.append(tips1004)
                            
        m1000.tip_racks = tips

    """
    Here is where you can define the locations of your reagents.
    """
    lysis_              = res1.wells()[0]
    binding_buffer      = res1.wells()[1:3]
    wash1               = res1.wells()[3:6]
    wash2               = res1.wells()[6:9]
    if extra_wash:
        wash3           = res1.wells()[9:]
    wash4               = res2.wells()[:6]
    elution_solution    = res2.wells()[-1]

    samples_m           = sample_plate.rows()[0][:num_cols]
    elution_samples_m   = elutionplate.rows()[0][:num_cols]
    #Recreate for liquid definitions (per well)
    samps               = sample_plate.wells()[:(8*num_cols)]
    elution_samps       = elutionplate.wells()[:(8*num_cols)]

    colors = ['#008000','#008000','#A52A2A','#A52A2A','#00FFFF','#0000FF','#800080',\
    '#ADD8E6','#FF0000','#FFFF00','#FF00FF','#00008B','#7FFFD4',\
    '#FFC0CB','#FFA500','#00FF00','#C0C0C0']

    #Begin with assigning plate wells before reservoir wells
    samples = ctx.define_liquid(name='Samples',description='Cell Pellet',display_color='#FFA500')
    
    for well in samps:
        well.load_liquid(liquid=samples,volume=0)

    if extra_wash:
        locations   = [lysis_,lysis_,binding_buffer,binding_buffer,wash1,wash2,wash3,wash4,elution_solution]
        vols        = [lysis_vol,PK_vol,bead_vol,bind_vol,wash1_vol,wash2_vol,wash3_vol,wash4_vol,elution_vol]
        liquids     = ['Lysis','PK','Beads','Binding','Wash 1 (MB3)','Wash 2 (MB4)','Wash 3 (Extra MB4)','Wash 4 (MB5)','Elution']
    else:
        locations   = [lysis_,lysis_,binding_buffer,binding_buffer,wash1,wash2,wash4,elution_solution]
        vols        = [lysis_vol,PK_vol,bead_vol,bind_vol,wash1_vol,wash2_vol,wash4_vol,elution_vol]
        liquids     = ['Lysis','PK','Beads','Binding','Wash 1 (MB3)','Wash 2 (MB4)','Wash 4 (MB5)','Elution']

    delete      = len(colors)-len(liquids)

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
        global tipsuper
        global drop_count
        if tipbox == tips:
            #ctx.comment(f'\nTipbox: {tipbox}\n Track: #{tip1k}\nTotal: {tipbox[int(tip1k)]}\n')
            m1000.pick_up_tip(tipbox[int(tip1k)])
            tip1k = tip1k + 8
            drop_count = drop_count + 8

        if reuse_sup_tips:
            if tipbox == tips_sn:
                m1000.pick_up_tip(tipbox[int(tipsuper)])
                tipsuper = tipsuper + 8
                if tipsuper == num_cols*8:
                    tipsuper = 0
        
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
        for i, m in enumerate(samples_m):
            m1000.pick_up_tip(tips_sn[8*i]) if reuse_sup_tips else m1000.pick_up_tip()
            loc = m.bottom(0.5)
            for _ in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, m.top())
                m1000.move_to(m.center())
                _waste_track(vol)
                m1000.transfer(vol_per_trans, loc, waste, new_tip='never',air_gap=20)
                m1000.air_gap(20)
            m1000.drop_tip(tips_sn[8*i]) if reuse_sup_tips else m1000.drop_tip()
        m1000.flow_rate.aspirate = 300

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
        aspbot = well.bottom().move(types.Point(x=0,y=1.75,z=1))
        asptop = well.bottom().move(types.Point(x=0,y=-1.75,z=5))
        disbot = well.bottom().move(types.Point(x=0,y=1.75,z=3))
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
                pip.flow_rate.dispense = 20
                pip.aspirate(vol,aspbot)
                pip.dispense(vol,aspbot)

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
                pip.flow_rate.dispense = 100
                pip.aspirate(vol,asp)
                pip.dispense(vol,asp)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300

    def lysis(vol, source):
        num_transfers = math.ceil(vol/980)
        tiptrack(m1000, tips) if reuse_sup_tips else m1000.pick_up_tip()
        for i in range(num_cols):
            src = source
            tvol = vol/num_transfers
            mixvol = num_cols*vol
            if mixvol > 1000:
                mixvol = 1000
            if i == 0:
                for x in range(3 if not dry_run else 1):
                    m1000.aspirate(mixvol,src.bottom())
                    m1000.dispense(mixvol,src.bottom(20))
            for t in range(num_transfers):
                m1000.aspirate(tvol,src.bottom(1))
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume,samples_m[i].top())
        
        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000,tips) if reuse_sup_tips else m1000.pick_up_tip()
            for mix in range(10 if not dry_run else 1):
                m1000.aspirate(190, samples_m[i])
                m1000.dispense(190, samples_m[i].bottom(25))
            m1000.flow_rate.aspirate = 20
            m1000.flow_rate.dispense = 20
            m1000.aspirate(190, samples_m[i])
            m1000.dispense(190, samples_m[i].bottom(10))
            m1000.flow_rate.aspirate = 300
            m1000.flow_rate.dispense = 300
            m1000.drop_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            h_s.set_and_wait_for_temperature(56)
            ctx.delay(minutes=lysis_incubation if not dry_run else 0.25, msg='Shake at 1800 rpm for '+str(lysis_incubation)+' minutes.')
            h_s.deactivate_shaker()
            h_s.deactivate_heater()
        else:
            if not dry_run:
                ctx.pause(msg='Place on shaker at 56C and 2000 rpm for '+str(lysis_incubation)+' minutes.')

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
        for i, well in enumerate(samples_m):
            if num_cols > 4:
                if i == 0 or i == 3:
                    mixvol = 2*vol
                else:
                    mixvol = vol
            else:
                if num_cols > 1:
                    if i == 0:
                        mixvol = 2*vol
                    else:
                        mixvol = vol
                else:
                    mixvol = vol
            tiptrack(m1000,tips) if reuse_sup_tips else m1000.pick_up_tip()
            num_trans = math.ceil(vol/980)
            vol_per_trans = vol/num_trans
            source = binding_buffer[i//3]
            if i == 0 or i == 3:
                reps=6
            else:
                reps=1
            bead_mixing(source,m1000,mixvol,reps=reps if not dry_run else 1)
            ctx.delay(seconds = 2)
            m1000.blow_out(source.top(-3))
            #Transfer beads and binding from source to H-S plate
            m1000.flow_rate.dispense = 80
            for t in range(num_trans):
                m1000.transfer(vol_per_trans, source.bottom(1), well.top(), air_gap=20,new_tip='never')
            m1000.flow_rate.dispense = 300
            bead_mixing(well,m1000,vol_per_trans,reps=6 if not dry_run else 1)
            m1000.drop_tip()

        ctx.comment("-----Mixing Bind and Lysis-----")
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1800)
            ctx.delay(minutes=5 if not dry_run else 0.25, msg='Shake at 1800 rpm for 5 minutes.')
            h_s.deactivate_shaker()
        else:
            if not dry_run:
                ctx.pause(msg='Place on shaker at 1800 rpm for 5 minutes.')

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

        for bindi in np.arange(settling_time+1,0,-0.5): #Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg='There are ' + str(bindi) + ' minutes left in the incubation.')

        # remove initial supernatant
        remove_supernatant(vol+starting_vol)
        #Move Plate From Magnet to H-S
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            h_s_adapter if heater_shaker else 'D1',
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()

    def wash(vol, source):
        global whichwash #Defines which wash the protocol is on to log on the app

        if source == wash1:
            whichwash = int(1)
        if source == wash2:
            whichwash = int(2)
        if extra_wash and source == wash3:
            whichwash = int(3)
        
        num_trans = math.ceil(vol/980)
        vol_per_trans = vol/num_trans

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            ctx.delay(minutes=0.3, msg='Please allow ~20 second dry shake to loosen the pellet')
            h_s.deactivate_shaker()

        ctx.comment("-----Wash " + str(whichwash) + " is starting now------")
        tiptrack(m1000,tips) if reuse_sup_tips else m1000.pick_up_tip()
        for i, m in enumerate(samples_m):
            src = source[i//2]
            for n in range(num_trans):
                m1000.transfer(vol_per_trans, src, m.top(), air_gap=10,new_tip='never')
        m1000.drop_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1900)
            ctx.delay(minutes=5 if not dry_run else 0.25, msg='Please allow 5 minutes of shaking to properly mix buffer in the beads')
            h_s.deactivate_shaker()
        else:
            if not dry_run:
                ctx.pause(msg='Place on shaker at 1900 rpm for 5 minutes.')

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

        if extra_wash and whichwash != 3:
            remove_supernatant(vol)
            if heater_shaker:
                h_s.open_labware_latch()
            ctx.move_labware(
                sample_plate,
                h_s_adapter if heater_shaker else 'D1',
                use_gripper=USE_GRIPPER
            )
            if heater_shaker:
                h_s.close_labware_latch()

        if not extra_wash and whichwash != 2:
            remove_supernatant(vol)
            if heater_shaker:
                h_s.open_labware_latch()
            ctx.move_labware(
                sample_plate,
                h_s_adapter if heater_shaker else 'D1',
                use_gripper=USE_GRIPPER
            )
            if heater_shaker:
                h_s.close_labware_latch()

    def lastwash(vol,source):
        global whichwash
        global tip1k
        whichwash = 4 if extra_wash else 3
        ctx.comment("-----Wash " + str(whichwash) + " is starting now------")
        num_trans = math.ceil(vol/980)
        vol_per_trans = vol/num_trans
        for x, well in enumerate(samples_m):
            tiptrack(m1000,tips_sn) if reuse_sup_tips else m1000.pick_up_tip()
            m1000.flow_rate.aspirate = 300
            m1000.aspirate(wash3_vol,well)
            m1000.dispense(wash3_vol,waste)
            m1000.return_tip()
            tiptrack(m1000,tips) if reuse_sup_tips else m1000.pick_up_tip()
            m1000.flow_rate.dispense = 50
            m1000.aspirate(vol,source[x])
            m1000.dispense(vol,well)
            ctx.delay(seconds=10)
            m1000.flow_rate.aspirate = 30
            m1000.flow_rate.dispense = 150
            m1000.aspirate(vol,well)
            m1000.dispense(vol,waste)
            m1000.drop_tip()
            # m1000.pick_up_tip(tips[tip1k]) if reuse_sup_tips else m1000.pick_up_tip()
            tiptrack(m1000,tips) if reuse_sup_tips else m1000.pick_up_tip()
            m1000.aspirate(elution_vol,elution_solution)
            m1000.dispense(elution_vol,well)
            m1000.return_tip() if reuse_sup_tips else m1000.drop_tip()

        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            h_s_adapter if heater_shaker else 'D1',
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()


    def elute(vol):
        ctx.comment("-----Beginning Elution Steps-----")
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            ctx.delay(minutes=5 if not dry_run else 0.25,msg='Shake on H-S for 5 minutes at 2000 rpm.')
            h_s.deactivate_shaker()
        else:
            if not dry_run:
                ctx.pause(msg='Place on shaker at 2000 rpm for 5 minutes.')

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

        for elutei in np.arange(settling_time,0,-0.5):
            ctx.delay(minutes=0.5, msg='Incubating on MagDeck for ' + str(elutei) + ' more minutes.')

        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            tiptrack(m1000,tips) if reuse_sup_tips else m1000.pick_up_tip()
            m1000.flow_rate.dispense = 100
            m1000.flow_rate.aspirate = 10
            m1000.transfer(vol, m.bottom(0.15), e.bottom(5), air_gap=20, new_tip='never')
            m1000.blow_out(e.top(-2))
            m1000.air_gap(20)
            m1000.flow_rate.aspirate = 300
            m1000.drop_tip()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    if inc_lysis:
        lysis(lysis_total_vol,lysis_)
    bind(binding_buffer_vol)
    wash(wash1_vol, wash1)
    if not dry_run:
        wash(wash2_vol, wash2)
        if extra_wash:
            wash(wash3_vol, wash3)
        lastwash(wash4_vol, wash4)
    elute(elution_vol)
    