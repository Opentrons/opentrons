from opentrons.types import Point
import json
import os
import math
from time import sleep
from opentrons import types
import numpy as np

metadata = {
    'protocolName': 'Flex ZymoBIOMICS Magbead DNA Extraction: Cells or Bacteria 96 channel',
    'author': 'Zach Galluzzo <zachary.galluzzo@opentrons.com>'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.15",
}

dry_run = False
HS_SLOT = 1
USE_GRIPPER = True

ABR_TEST                = True
if ABR_TEST == True:
    DRYRUN              = True          # True = skip incubation times, shorten mix, for testing purposes
    TIP_TRASH           = False         # True = Used tips go in Trash, False = Used tips go back into rack
else:
    DRYRUN              = False          # True = skip incubation times, shorten mix, for testing purposes
    TIP_TRASH           = True 

# Start protocol
def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    deepwell_type = "nest_96_wellplate_2ml_deep"
    wash1_vol = 500
    wash2_vol = wash3_vol = wash4_vol = 900
    if not dry_run:
        settling_time = 2
        lysis_incubation = 30
    if dry_run:
        settling_time= 0.25
        lysis_incubation = 0.25

    h_s = ctx.load_module('heaterShakerModuleV1', HS_SLOT)
    h_s_adapter = h_s.load_adapter('opentrons_96_deep_well_adapter')
    sample_plate = h_s_adapter.load_labware(deepwell_type,'Sample Plate')
    samples_m = sample_plate.wells()[0]
    
    temp = ctx.load_module('temperature module gen2','D3')
    tempblock = temp.load_adapter('opentrons_96_well_aluminum_block')
    elutionplate = tempblock.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','Elution Plate/ Reservoir')
    magblock = ctx.load_module('magneticBlockV1','C1')

    lysis_res = ctx.load_labware(deepwell_type, 'D2','Lysis reservoir').wells()[0] 
    bind_res = ctx.load_labware(deepwell_type, 'C2','Beads and binding reservoir').wells()[0] 
    bind2_res = ctx.load_labware(deepwell_type, 'C3','Binding 2 reservoir').wells()[0]
    wash1_res = ctx.load_labware(deepwell_type, 'B1','Wash 1 reservoir').wells()[0]
    wash2_res = ctx.load_labware(deepwell_type, 'B2','Wash 2 reservoir').wells()[0]
    wash4_res = ctx.load_labware(deepwell_type, 'B3','Wash 3 reservoir').wells()[0]
    elution_res = elutionplate.wells()[0]

    #Load tips
    tips = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A1',adapter='opentrons_flex_96_tiprack_adapter').wells()[0]
    tips1 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A2',adapter='opentrons_flex_96_tiprack_adapter').wells()[0]

    #Differences between sample types
    lysis_vol = 220 #Shield 
    sample_vol = 10
    starting_vol = lysis_vol+sample_vol 
    binding_buffer_vol = 625
    bind2_vol = 500
    elution_vol = 75

    # load 96 channel pipette
    pip = ctx.load_instrument('flex_96channel_1000', mount="left")

    pip.flow_rate.aspirate = 50
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
    h_s.close_labware_latch()

    #Start Protocol

    #Mix and Transfer Lysis
    ctx.comment('------Mix Shield and PK in Reservoir, Transfer to Sample Plate, Mix in Sample Plate-----')
    pip.pick_up_tip(tips)
    pip.aspirate(lysis_vol,lysis_res)
    pip.air_gap(20)
    pip.dispense(pip.current_volume,samples_m)
    for _ in range(8 if not dry_run else 1):
        pip.aspirate(lysis_vol*0.9,samples_m)
        pip.dispense(pip.current_volume, samples_m.bottom(20))
    pip.return_tip()
    
    #Mix in sample plate
    h_s.set_and_wait_for_shake_speed(2000)
    ctx.delay(minutes=lysis_incubation,msg='Please wait 30 minutes to allow for proper lysis mixing.')
    h_s.deactivate_shaker()

    #Transfer and mix bind&beads
    ctx.comment('------Mixing Beads with Binding, then Transfer to Sample Plate-----')
    pip.pick_up_tip(tips)
    bead_mix(binding_buffer_vol,bind_res, reps=5 if not dry_run else 1)
    pip.aspirate(binding_buffer_vol,bind_res)
    pip.dispense(binding_buffer_vol,samples_m)
    if binding_buffer_vol+starting_vol < 1000:
        mix_vol = binding_buffer_vol+starting_vol
    else:
        mix_vol = 1000
    bead_mix(mix_vol,samples_m,reps=7 if not dry_run else 1)
    pip.return_tip()

    #Shake for binding incubation
    h_s.set_and_wait_for_shake_speed(rpm=1800)
    ctx.delay(minutes=10 if not dry_run else 0.25,msg='Please allow 10 minutes for the beads to bind the DNA.')
    h_s.deactivate_shaker()

    ctx.comment('------Moving Plate to Magnet to Begin Pelleting-----')
    h_s.open_labware_latch()
    #Transfer plate to magnet
    ctx.move_labware(
        sample_plate, 
        magblock, 
        use_gripper=USE_GRIPPER
    )
    h_s.close_labware_latch()

    ctx.delay(minutes=settling_time,msg='Please wait ' + str(settling_time) + ' minute(s) for beads to pellet.')

    #Remove Supernatant and move off magnet
    ctx.comment('------Removing Supernatant-----')
    pip.pick_up_tip(tips)
    re_vol = binding_buffer_vol+starting_vol
    pip.aspirate(re_vol,samples_m.bottom(0.5)) 
    pip.dispense(re_vol,bind_res)
    if re_vol > 1000:
        dif = (starting_vol+binding_buffer_vol)-1000
        pip.aspirate(dif+50,samples_m.bottom(0.5))
        pip.dispense(dif+50,bind_res)
    pip.return_tip()

    #Transfer plate from magnet to H/S
    h_s.open_labware_latch()
    ctx.move_labware(
        sample_plate, 
        h_s_adapter, 
        use_gripper=USE_GRIPPER
    )
    
    h_s.close_labware_latch()

    #Quick Bind #2
    ctx.comment('-----Beginning Bind #2-----')
    pip.pick_up_tip(tips)
    pip.aspirate(bind2_vol,bind2_res)
    pip.air_gap(20)
    pip.dispense(pip.current_volume,samples_m.top())
    resuspend_pellet(bind2_vol,samples_m,reps=4 if not dry_run else 1)
    pip.blow_out()
    pip.return_tip()

    ctx.comment('-----Mixing Bind2 with Beads-----')
    h_s.set_and_wait_for_shake_speed(2000)
    ctx.delay(minutes=1 if not dry_run else 0.25, msg='Shake at 2000 rpm for 1 minutes.')
    h_s.deactivate_shaker()

    ctx.comment('------Moving Plate to Magnet to Begin Pelleting-----')
    h_s.open_labware_latch()
    #Transfer plate to magnet
    ctx.move_labware(
        sample_plate, 
        magblock, 
        use_gripper=USE_GRIPPER
    )
    h_s.close_labware_latch()

    ctx.delay(minutes=settling_time,msg='Please wait ' + str(settling_time) + ' minute(s) for beads to pellet.')

    #Remove Supernatant and move off magnet
    ctx.comment('------Removing Supernatant-----')
    pip.pick_up_tip(tips)
    pip.aspirate(bind2_vol,samples_m.bottom(0.5))
    pip.dispense(bind2_vol,bind_res)
    pip.return_tip()

    #Transfer plate from magnet to H/S
    h_s.open_labware_latch()
    ctx.move_labware(
        sample_plate, 
        h_s_adapter, 
        use_gripper=USE_GRIPPER
    )
    h_s.close_labware_latch()

    #Washes
    for i in range(4 if not dry_run else 1):
        if i == 0:
            wash_res = wash1_res
            wash_vol = wash1_vol
            waste_res = bind_res
            whichwash = 1
            height = 1
        if i == 1:
            wash_res = wash2_res
            wash_vol = wash2_vol
            waste_res = bind2_res
            whichwash = 2
            height = 15
        if i == 2:
            wash_res = wash2_res
            wash_vol = wash3_vol
            waste_res = bind2_res
            whichwash = 3
            height = 1
        if i == 3:
            wash_res = wash4_res
            wash_vol = wash4_vol
            waste_res = wash2_res
            whichwash = 4
            height = 1

        ctx.comment('------Beginning Wash #' + str(whichwash)+'-----')
        pip.pick_up_tip(tips)
        pip.aspirate(wash_vol,wash_res.bottom(height))
        pip.dispense(wash_vol,samples_m)
        pip.air_gap(20)
        pip.return_tip()
        pip.home()

        h_s.set_and_wait_for_shake_speed(rpm=1800)
        ctx.delay(minutes=5 if not dry_run else 0.25)
        h_s.deactivate_shaker()
        h_s.open_labware_latch()

        #Transfer plate to magnet
        ctx.move_labware(
            sample_plate, 
            magblock, 
            use_gripper=USE_GRIPPER
        )

        ctx.delay(minutes=settling_time,msg='Please wait ' + str(settling_time) + ' minute(s) for beads to pellet in wash #' + str(whichwash)+'.')

        #Remove Supernatant and move off magnet
        ctx.comment('------Removing Supernatant-----')
        pip.pick_up_tip(tips)
        pip.aspirate(wash_vol,samples_m.bottom(0.5)) 
        pip.dispense(wash_vol,waste_res.top())

        pip.return_tip()
        #Transfer plate from magnet to H/S
        ctx.move_labware(
            sample_plate, 
            h_s_adapter, 
            use_gripper=USE_GRIPPER
        )
        h_s.close_labware_latch()

    ctx.comment('------Drying Beads for 10 minutes-----')
    
    if not dry_run:
        h_s.set_and_wait_for_temperature(55)
    
    drybeads =9 if not dry_run else 0.5 # Number of minutes you want to dry for
    for beaddry in np.arange(drybeads,0,-0.5):
        ctx.delay(minutes=0.5, msg='There are ' + str(beaddry) + ' minutes left in the drying step.')

    #Elution
    ctx.comment('------Beginning Elution-----')
    pip.pick_up_tip(tips1)
    pip.flow_rate.aspirate = 25
    pip.aspirate(elution_vol, elution_res)
    pip.dispense(elution_vol, samples_m)
    pip.return_tip()
    pip.home()

    h_s.set_and_wait_for_shake_speed(rpm=2000)
    ctx.delay(minutes=5 if not dry_run else 0.25, msg='Please wait 5 minutes to allow dna to elute from beads.')
    h_s.deactivate_shaker()
    h_s.open_labware_latch()

    #Transfer plate to magnet
    ctx.move_labware(
        sample_plate, 
        magblock, 
        use_gripper=USE_GRIPPER
    )

    ctx.delay(minutes=settling_time,msg='Please wait ' + str(settling_time) + ' minute(s) for beads to pellet.')

    ctx.comment('------Transfer DNA to Final Elution Plate-----')
    pip.pick_up_tip(tips1)
    pip.aspirate(elution_vol,samples_m.bottom(0.5)) 
    pip.dispense(elution_vol,elutionplate.wells()[0])
    pip.return_tip()

    pip.home()