def get_values(*names):
    import json
    _all_values = json.loads("""{"trash_chute": false, "USE_GRIPPER": true, "Macherey_Nagel_DW": false, "dry_run": false, "temp_mod": true, "heater_shaker": true, "tip_mixing": false, "wash1_vol": 600, "wash2_vol": 600, "wash3_vol": 900, "sample_vol": 10, "bind_vol": 360, "lysis_vol": 200, "elution_vol": 100}""")
    return [_all_values[n] for n in names]


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
    "apiLevel": "2.16",
}

# Start protocol
def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    trash_chute         = False #If false, waste bin loaded in D3, if True, trash chute loaded there
    USE_GRIPPER         = True
    Macherey_Nagel_DW   = False
    dry_run             = False
    temp_mod            = True
    heater_shaker       = True
    tip_mixing          = False

    wash1_vol           = 600
    wash2_vol           = 600
    wash3_vol           = 900
    sample_vol          = 10
    bind_vol            = 360
    lysis_vol           = 200
    elution_vol         = 100

    try:
        [trash_chute,USE_GRIPPER, Macherey_Nagel_DW,dry_run,temp_mod,heater_shaker,tip_mixing,wash1_vol,wash2_vol,wash3_vol,sample_vol,bind_vol,lysis_vol,elution_vol] = get_values(  # noqa: F821
        'trash_chute','USE_GRIPPER','Macherey_Nagel_DW','dry_run','temp_mod','heater_shaker','tip_mixing','wash1_vol','wash2_vol','wash3_vol','sample_vol','bind_vol','lysis_vol','elution_vol')

    except (NameError):
        pass

    #Just to be safe
    if heater_shaker:
        tip_mixing      = False
    
    if Macherey_Nagel_DW:
        deepwell_type       = "macherey_nagel_dwplate_2200ul"
    else:
        deepwell_type       = "nest_96_wellplate_2ml_deep"
    res_type                = "nest_96_wellplate_2ml_deep"
    if not dry_run:
        settling_time       = 3.5
        lysis_incubation    = 80
    if dry_run:
        settling_time       = 0.25
        lysis_incubation    = 0.25
    bead_vol = PK_vol       = 25 
    binding_buffer_vol      = bind_vol + bead_vol
    lysis_total_vol         = lysis_vol + PK_vol
    starting_vol            = lysis_vol+sample_vol
    if trash_chute:
        trash = ctx.load_waste_chute()
    else:
        trash = ctx.load_trash_bin('D3')

    if heater_shaker:
        h_s                 = ctx.load_module('heaterShakerModuleV1', 'D1')
        if Macherey_Nagel_DW:
            h_s_adapter     = h_s.load_adapter('opentrons_universal_flat_adapter')
        else:
            h_s_adapter     = h_s.load_adapter('opentrons_96_deep_well_adapter')
        sample_plate        = h_s_adapter.load_labware(deepwell_type,'Sample Plate')
    else:
        sample_plate        = ctx.load_labware(deepwell_type,'D1','Sample Plate')
    samples_m               = sample_plate.wells()[0]

    samps                   = ctx.define_liquid(name='Samples',description='Sample Pellets',display_color='#FFA500')
    for well in sample_plate.wells():
        well.load_liquid(liquid=samps,volume=0)
    
    if temp_mod:
        temp                = ctx.load_module('temperature module gen2','A3')
        tempblock           = temp.load_adapter('opentrons_96_well_aluminum_block')
        elutionplate        = tempblock.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','Elution Plate/ Reservoir')
    else:
        elutionplate        = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A3','Elution Plate/ Reservoir')
    magblock                = ctx.load_module('magneticBlockV1','C1')
    waste_                  = ctx.load_labware('nest_1_reservoir_195ml', 'B3','Liquid Waste').wells()[0].top()

    #'#008000','#A52A2A','#00FFFF','#0000FF','#800080','#ADD8E6','#FF0000','#FFFF00','#FF00FF','#00008B','#7FFFD4','#FFC0CB','#FFA500','#00FF00','#C0C0C0'

    #Defining Liquid Reservoirs and Assigning Colors/ Locations

    lysis_reservoir     = ctx.load_labware(res_type, 'D2','Lysis reservoir')
    lysis_res           = lysis_reservoir.wells()[0]
    lysis_buffer        = ctx.define_liquid(name='lysis buffer',description='lysis buffer',display_color='#008000')
    for well in lysis_reservoir.wells():
        well.load_liquid(liquid=lysis_buffer,volume=lysis_vol+89)
    
    PK_buffer           = ctx.define_liquid(name='PK Buffer',description='PK Buffer',display_color='#008000')
    for well in lysis_reservoir.wells():
        well.load_liquid(liquid=PK_buffer,volume=PK_vol+11) 
    
    bind_reservoir      = ctx.load_labware(res_type, 'C2','Beads and binding reservoir')
    bind_res            = bind_reservoir.wells()[0] 
    binding_buffer      = ctx.define_liquid(name='binding buffer',description='binding buffer',display_color='#A52A2A')
    for well in bind_reservoir.wells():
        well.load_liquid(liquid=binding_buffer,volume=bind_vol+100)
    
    wash1_reservoir     = ctx.load_labware(res_type, 'C3','Wash 1 reservoir')
    wash1_res           = wash1_reservoir.wells()[0]
    wash1_buffer        = ctx.define_liquid(name='Wash 1 buffer',description='Wash 1 buffer',display_color='#00FFFF')
    for well in wash1_reservoir.wells():
        well.load_liquid(liquid=wash1_buffer,volume=wash1_vol+100)
    
    wash2_reservoir     = ctx.load_labware(res_type, 'B1','Wash 2 reservoir')
    wash2_res           = wash2_reservoir.wells()[0]
    wash2_buffer        = ctx.define_liquid(name='Wash 2 buffer',description='Wash 2 buffer',display_color='#0000FF')
    for well in wash2_reservoir.wells():
        well.load_liquid(liquid=wash2_buffer,volume=wash2_vol+100)
    
    wash3_reservoir     = ctx.load_labware(res_type, 'B2','Wash 3 reservoir')     
    wash3_res           = wash3_reservoir.wells()[0]
    wash3_buffer        = ctx.define_liquid(name='Wash 3 buffer',description='Wash 3 buffer',display_color='#800080')
    for well in wash3_reservoir.wells():
        well.load_liquid(liquid=wash3_buffer,volume=wash3_vol+100)
    
    elution_res         = elutionplate.wells()[0]
    elution_buffer      = ctx.define_liquid(name='elution buffer',description='elution buffer',display_color='#ADD8E6')
    for well in elutionplate.wells():
        well.load_liquid(liquid=elution_buffer,volume=elution_vol)

    #Load tips
    tips    = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A1',adapter='opentrons_flex_96_tiprack_adapter').wells()[0]
    tips1   = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A2',adapter='opentrons_flex_96_tiprack_adapter').wells()[0]


    # load 96 channel pipette
    pip     = ctx.load_instrument('flex_96channel_1000', mount="left")

    pip.flow_rate.aspirate = 100
    pip.flow_rate.dispense = 150
    pip.flow_rate.blow_out = 300

    def resuspend_pellet(vol,plate,reps=3):
        pip.flow_rate.aspirate = 150
        pip.flow_rate.dispense = 200

        loc1 = plate.bottom().move(types.Point(x=1,y=0,z=1))
        loc2 = plate.bottom().move(types.Point(x=0.75,y=0.75,z=1))
        loc3 = plate.bottom().move(types.Point(x=0,y=1,z=1))
        loc4 = plate.bottom().move(types.Point(x=-0.75,y=0.75,z=1))
        loc5 = plate.bottom().move(types.Point(x=-1,y=0,z=1))
        loc6 = plate.bottom().move(types.Point(x=-0.75,y=0-0.75,z=1))
        loc7 = plate.bottom().move(types.Point(x=0,y=-1,z=1))
        loc8 = plate.bottom().move(types.Point(x=0.75,y=-0.75,z=1))

        if vol>1000:
            vol = 1000

        mixvol = vol*.9

        for _ in range(reps):
            pip.aspirate(mixvol,loc1)
            pip.dispense(mixvol,loc1)
            pip.aspirate(mixvol,loc2)
            pip.dispense(mixvol,loc2)
            pip.aspirate(mixvol,loc3)
            pip.dispense(mixvol,loc3)
            pip.aspirate(mixvol,loc4)
            pip.dispense(mixvol,loc4)
            pip.aspirate(mixvol,loc5)
            pip.dispense(mixvol,loc5)
            pip.aspirate(mixvol,loc6)
            pip.dispense(mixvol,loc6)
            pip.aspirate(mixvol,loc7)
            pip.dispense(mixvol,loc7)
            pip.aspirate(mixvol,loc8)
            pip.dispense(mixvol,loc8)
            if _ == reps-1:
                pip.flow_rate.aspirate = 50
                pip.flow_rate.dispense = 30
                pip.aspirate(mixvol,loc8)
                pip.dispense(mixvol,loc8)

        pip.flow_rate.aspirate = 50
        pip.flow_rate.dispense = 150


    def bead_mix(vol,plate,reps=5):
        pip.flow_rate.aspirate = 150
        pip.flow_rate.dispense = 200

        loc1 = plate.bottom().move(types.Point(x=0,y=0,z=1))
        loc2 = plate.bottom().move(types.Point(x=0,y=0,z=8))
        loc3 = plate.bottom().move(types.Point(x=0,y=0,z=16))
        loc4 = plate.bottom().move(types.Point(x=0,y=0,z=24))

        if vol>1000:
            vol = 1000

        mixvol = vol*.9

        for _ in range(reps):
            pip.aspirate(mixvol,loc1)
            pip.dispense(mixvol,loc1)
            pip.aspirate(mixvol,loc1)
            pip.dispense(mixvol,loc2)
            pip.aspirate(mixvol,loc1)
            pip.dispense(mixvol,loc3)
            pip.aspirate(mixvol,loc1)
            pip.dispense(mixvol,loc4)
            if _ == reps-1:
                pip.flow_rate.aspirate = 50
                pip.flow_rate.dispense = 30
                pip.aspirate(mixvol,loc1)
                pip.dispense(mixvol,loc1)

        pip.flow_rate.aspirate = 50
        pip.flow_rate.dispense = 150

    #Just in case
    if heater_shaker:
        h_s.close_labware_latch()

    #Start Protocol

    #Transfer and mix lysis
    ctx.comment("-------Lysis is starting now-------")
    pip.pick_up_tip(tips)
    for x in range(4 if not dry_run else 1): #Mix PK and Lysis
        pip.aspirate(lysis_total_vol,lysis_res)
        pip.dispense(lysis_total_vol,lysis_res.top(-5))    
    pip.aspirate(lysis_total_vol,lysis_res)
    pip.dispense(lysis_total_vol,samples_m)
    resuspend_pellet(lysis_total_vol,samples_m,reps=5 if not dry_run else 1)
    if not tip_mixing:
        pip.return_tip()
    
    #Mix, then heat
    if heater_shaker:
        h_s.set_and_wait_for_shake_speed(1500)
        ctx.delay(minutes=lysis_incubation,msg='Please wait '+str(lysis_incubation)+' minutes to allow for proper lysis mixing.')
        h_s.deactivate_shaker()
    if not heater_shaker and tip_mixing:
        for x in range(10):
            bead_mix(lysis_total_vol,samples_m,reps=12)
            ctx.delay(minutes=2)
        pip.return_tip()
    if not heater_shaker and not tip_mixing:
        if not dry_run:
            ctx.pause(msg='Place on shaker for '+str(lysis_incubation)+' minutes at 1500 rpm.')

    #Transfer and mix bind&beads
    ctx.comment("-------Bind steps are starting now-------")
    pip.pick_up_tip(tips)
    bead_mix(binding_buffer_vol,bind_res, reps=5 if not dry_run else 1)
    pip.aspirate(binding_buffer_vol,bind_res)
    pip.dispense(binding_buffer_vol,samples_m)
    if binding_buffer_vol+starting_vol < 1000:
        mix_vol = binding_buffer_vol+starting_vol
    else:
        mix_vol = 1000
    bead_mix(mix_vol,samples_m,reps=7 if not dry_run else 1)
    if not tip_mixing:
        pip.return_tip()

    #Shake for binding incubation
    if heater_shaker:
        h_s.set_and_wait_for_shake_speed(rpm=1800)
        ctx.delay(minutes=5 if not dry_run else 0.25,msg='Please allow 5 minutes for the beads to bind the DNA.')
        h_s.deactivate_shaker()
    if not heater_shaker and tip_mixing:
        bead_mix(mix_vol,samples_m,reps=13)
        pip.return_tip()
    if not heater_shaker and not tip_mixing:
        if not dry_run:
            ctx.pause(msg='Place on shaker at 1800 rpm for 5 minutes.')

    if heater_shaker:
        h_s.open_labware_latch()
    #Transfer plate to magnet
    ctx.move_labware(
        sample_plate, 
        magblock, 
        use_gripper=USE_GRIPPER
    )
    if heater_shaker:
        h_s.close_labware_latch()

    ctx.delay(minutes=settling_time,msg='Please wait ' + str(settling_time) + ' minute(s) for beads to pellet.')

    #Remove Supernatant and move off magnet
    ctx.comment("-------Removing Supernatant-------")
    pip.pick_up_tip(tips)
    pip.flow_rate.aspirate = 35
    pip.aspirate(1000,samples_m.bottom(0.3))
    pip.dispense(1000,waste_)
    if starting_vol+binding_buffer_vol > 1000:
        rest = (starting_vol+binding_buffer_vol)-900
        pip.aspirate(rest,samples_m.bottom(0.1))
        pip.dispense(rest,waste_)
    pip.return_tip()
    pip.flow_rate.aspirate = 100

    #Transfer plate from magnet to H/S
    if heater_shaker:
        h_s.open_labware_latch()
    ctx.move_labware(
        sample_plate, 
        h_s_adapter if heater_shaker else 'D1', 
        use_gripper=USE_GRIPPER
    )
    if heater_shaker:
        h_s.close_labware_latch()

    #Washes
    for i in range(2):
        if i == 0:
            wash_res = wash1_res
            wash_vol = wash1_vol
            w=1
        else:
            wash_res = wash2_res
            wash_vol = wash2_vol
            w=2
        ctx.comment("-------Wash "+str(w)+" is starting now-------")

        #Quick H-S shake to loosen pellet
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1800)
            ctx.delay(seconds = 20,msg='Please wait 20 seconds to loosen pellet before dispensing wash')
            h_s.deactivate_shaker()

        pip.pick_up_tip(tips)
        pip.aspirate(wash_vol,wash_res)
        pip.dispense(wash_vol,samples_m)
        if not tip_mixing:
            pip.return_tip()
            pip.home()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=1800)
            ctx.delay(minutes=5 if not dry_run else 0.25,msg='5 minutes in Wash '+str(w)+' incubation.')
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            bead_mix(wash_vol,samples_m,reps=13)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg='Place on shaker for 5 minutes at 1800 rpm.')

        #Transfer plate to magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate, 
            magblock, 
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()

        ctx.delay(minutes=settling_time,msg='Please wait ' + str(settling_time) + ' minute(s) for beads to pellet in Wash '+str(w))

        #Remove Supernatant and move off magnet
        ctx.comment("-------Removing Supernatant-------")
        pip.pick_up_tip(tips)
        pip.flow_rate.aspirate = 35
        pip.aspirate(wash_vol+50,samples_m.bottom(0.3))
        pip.dispense(wash_vol+50,waste_)
        pip.flow_rate.aspirate = 100
        if i == 0:
            pip.return_tip()
            #Transfer plate from magnet to H/S
            if heater_shaker:
                h_s.open_labware_latch()
            ctx.move_labware(
                sample_plate, 
                h_s_adapter if heater_shaker else 'D1', 
                use_gripper=USE_GRIPPER
            )
            if heater_shaker:
                h_s.close_labware_latch()

    if not dry_run:
        #Wash3
        ctx.comment("-------Wash 3 is starting now-------")
        pip.aspirate(wash3_vol,wash3_res)
        pip.flow_rate.dispense = 30
        pip.dispense(wash3_vol,samples_m)
        pip.air_gap(10)
        ctx.delay(seconds=20,msg='Please allow 45 seconds for wash buffer to settle and clear well.')

        pip.flow_rate.dispense = 150

        #Clear Wash 3 from samples
        pip.aspirate(wash3_vol,samples_m.bottom(.15))
        pip.dispense(wash3_vol,wash3_res)
        pip.blow_out(wash3_res)
        pip.air_gap(10)
        pip.return_tip()

    else:
        pip.return_tip()

    #Transfer plate from magnet to H/S
    if heater_shaker:
        h_s.open_labware_latch()
    ctx.move_labware(
        sample_plate, 
        h_s_adapter if heater_shaker else 'D1', 
        use_gripper=USE_GRIPPER
    )
    if heater_shaker:
        h_s.close_labware_latch()

    pip.flow_rate.aspirate = 35

    #Elution
    pip.pick_up_tip(tips1)
    pip.aspirate(elution_vol, elution_res)
    pip.dispense(elution_vol, samples_m)
    if not tip_mixing:
        pip.return_tip()

    if heater_shaker:
        h_s.set_and_wait_for_shake_speed(rpm=2000)
        ctx.delay(minutes=5 if not dry_run else 0.25, msg='Please wait 5 minutes to allow dna to elute from beads.')
        h_s.deactivate_shaker()
    if not heater_shaker and tip_mixing:
        bead_mix(elution_vol,samples_m,reps=13)
        pip.return_tip()
    if not heater_shaker and not tip_mixing:
        if not dry_run:
            ctx.pause(msg='Place on shaker for 5 minutes at 2000 rpm.')

    #Transfer plate to magnet
    if heater_shaker:
        h_s.open_labware_latch()
    ctx.move_labware(
        sample_plate, 
        magblock, 
        use_gripper=USE_GRIPPER
    )
    if heater_shaker:
        h_s.close_labware_latch()

    ctx.delay(minutes=settling_time,msg='Please wait ' + str(settling_time) + ' minute(s) for beads to pellet.')

    pip.pick_up_tip(tips1)
    pip.aspirate(elution_vol,samples_m.bottom(0.15))
    pip.dispense(elution_vol,elutionplate.wells()[0])
    pip.return_tip()

    pip.home()
