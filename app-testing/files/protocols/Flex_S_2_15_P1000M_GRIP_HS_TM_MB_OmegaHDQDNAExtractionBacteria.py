from opentrons.types import Point
import json
import os
import math
from time import sleep
from opentrons import types
import numpy as np

metadata = {
    'protocolName': 'Omega HDQ DNA Extraction: Bacteria 96 channel testing',
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

    #*****If drying beads does not produce same results- can eliminate waste in slot 12 and add extra elution reservoir***

    #Same for all HDQ Extractions
    deepwell_type = "nest_96_wellplate_2ml_deep"
    wash_vol= 600
    if not dry_run:
        settling_time = 2
        num_washes = 3
    if dry_run:
        settling_time= 0.5
        num_washes = 1

    h_s = ctx.load_module('heaterShakerModuleV1', HS_SLOT)
    h_s_adapter = h_s.load_adapter('opentrons_96_deep_well_adapter')
    TL_plate = h_s_adapter.load_labware(deepwell_type,'Sample Plate 1')
    TL_samples = TL_plate.wells()[0]
    sample_plate = ctx.load_labware(deepwell_type,'C3','Sample Plate 2')
    samples_m = sample_plate.wells()[0]
    
    temp = ctx.load_module('temperature module gen2','D3')
    temp_block = temp.load_adapter('opentrons_96_well_aluminum_block')
    elutionplate = temp_block.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','Elution Plate/ Reservoir')
    elution_res = elutionplate.wells()[0]
    magblock = ctx.load_module('magneticBlockV1','C1')
    #elution_two = ctx.load_labware(deepwell_type, '12').wells()[0] 

    TL_res = ctx.load_labware(deepwell_type, 'D2','TL reservoir').wells()[0]
    AL_res = ctx.load_labware(deepwell_type, 'C2','AL reservoir').wells()[0]
    wash1_res = ctx.load_labware(deepwell_type, 'B1','Wash 1 reservoir').wells()[0]
    wash2_res = ctx.load_labware(deepwell_type, 'B2','Wash 2 reservoir').wells()[0]
    bind_res = ctx.load_labware(deepwell_type, 'B3','Beads and Binding reservoir').wells()[0]
    
    #Load tips
    tipsbox = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A1',adapter='opentrons_flex_96_tiprack_adapter')
    tips = tipsbox.wells()[0]
    tips1box = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A2',adapter='opentrons_flex_96_tiprack_adapter')
    tips1 = tips1box.wells()[0]

    #Differences between sample types
    AL_vol= 230
    TL_vol = 270
    sample_vol= 200
    inc_temp= 55
    starting_vol= AL_vol+sample_vol 
    binding_buffer_vol= 340
    elution_two_vol= 350
    elution_vol= 100

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
    pip.pick_up_tip(tips)
    #Mix PK and TL buffers
    ctx.comment('----- Mixing TL buffer and PK -----')
    for m in range(3 if not dry_run else 1):
        pip.aspirate(TL_vol,TL_res)
        pip.dispense(TL_vol,TL_res.bottom(30))
    #Transfer TL to plate
    ctx.comment('----- Transferring TL and PK to samples -----')
    pip.aspirate(TL_vol,TL_res)
    pip.air_gap(10)
    pip.dispense(pip.current_volume,TL_samples)
    if not dry_run:
        h_s.set_target_temperature(55)
    ctx.comment('----- Mixing TL buffer with samples -----')
    resuspend_pellet(TL_vol,TL_samples,reps=9 if not dry_run else 1)
    pip.return_tip()

    ctx.comment('----- Mixing and incubating for 30 minutes on Heater-Shaker -----')
    h_s.set_and_wait_for_shake_speed(2000)
    ctx.delay(minutes=30 if not dry_run else 0.25, msg='Shake at 2000 rpm for 30 minutes to allow lysis.')
    h_s.deactivate_shaker()

    #Transfer 200ul of sample + TL buffer to sample plate
    ctx.comment('----- Mixing, the transferring 200 ul of sample to new deep well plate -----')
    pip.pick_up_tip(tips)
    pip.aspirate(sample_vol,TL_samples)
    pip.air_gap(20)
    pip.dispense(pip.current_volume,samples_m)
    pip.blow_out()
    pip.return_tip()

    #Move TL samples off H-S into deck slot and sample plate onto H-S
    ctx.comment('------- Transferring TL and Sample plates -------')
    #Transfer TL samples from H-S to Magnet
    h_s.open_labware_latch()
    ctx.move_labware(
        TL_plate, 
        magblock, 
        use_gripper=USE_GRIPPER
    )
    #Move sample plate onto H-S from deck
    ctx.move_labware(
        sample_plate, 
        h_s_adapter, 
        use_gripper=USE_GRIPPER
    )
    h_s.close_labware_latch()
    #Move plate off magplate onto the deck
    ctx.move_labware(
        TL_plate, 
        6, 
        use_gripper=USE_GRIPPER
    )

    #Transfer and mix AL_lysis
    ctx.comment('------- Starting AL Lysis Steps -------')
    pip.pick_up_tip(tips)
    pip.aspirate(AL_vol,AL_res)
    pip.air_gap(10)
    pip.dispense(pip.current_volume,samples_m)
    resuspend_pellet(starting_vol,samples_m,reps=9 if not dry_run else 1)
    pip.drop_tip(tips)
    
    #Mix, then heat
    h_s.set_and_wait_for_shake_speed(2000)
    ctx.delay(minutes=4 if not dry_run else 0.25,msg='Please wait 4 minutes to allow for proper lysis mixing.')

    h_s.deactivate_shaker()

    #Transfer and mix bind&beads
    ctx.comment('------- Mixing and Transferring Beads and Binding -------')
    pip.pick_up_tip(tips)
    bead_mix(binding_buffer_vol,bind_res, reps=3 if not dry_run else 1)
    pip.aspirate(binding_buffer_vol,bind_res)
    pip.dispense(binding_buffer_vol,samples_m)
    bead_mix(binding_buffer_vol+starting_vol,samples_m,reps=3 if not dry_run else 1)
    pip.return_tip()
    pip.home()

    #Shake for binding incubation
    h_s.set_and_wait_for_shake_speed(rpm=1800)
    ctx.delay(minutes=10 if not dry_run else 0.25,msg='Please allow 10 minutes for the beads to bind the DNA.')

    h_s.deactivate_shaker()

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
    ctx.comment('------- Removing Supernatant -------')
    pip.pick_up_tip(tips)
    pip.aspirate(1000,samples_m.bottom(0.5))
    pip.dispense(1000,bind_res)
    if starting_vol+binding_buffer_vol > 1000:
        pip.aspirate(1000,samples_m.bottom(0.5))
        pip.dispense(1000,bind_res)
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
    for i in range(num_washes):
        if i == 0 or 1:
            wash_res = wash1_res
            waste_res = TL_res
        if i == 2:
            wash_res = wash2_res
            waste_res = bind_res
        ctx.comment('------- Starting Wash #' + str(i+1) + ' -------')
        pip.pick_up_tip(tips)
        pip.aspirate(wash_vol,wash_res)
        pip.dispense(wash_vol,samples_m)
        #resuspend_pellet(wash_vol,samples_m,reps=1 if not dry_run else 1)
        pip.blow_out()
        pip.air_gap(10)
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

        ctx.delay(minutes=settling_time,msg='Please wait ' + str(settling_time) + ' minute(s) for beads to pellet.')

        #Remove Supernatant and move off magnet
        ctx.comment('------- Removing Supernatant -------')
        pip.pick_up_tip(tips)
        pip.aspirate(1000,samples_m.bottom(0.5))
        pip.dispense(1000,waste_res.top())
        if wash_vol > 1000:
            pip.aspirate(1000,samples_m.bottom(0.5))
            pip.dispense(1000,waste_res.top())
        pip.return_tip()

        #if i == 0 or 2 and not dry_run:
        #Transfer plate from magnet to H/S after first two washes
        ctx.move_labware(
            sample_plate, 
            h_s_adapter, 
            use_gripper=USE_GRIPPER
        )
        h_s.close_labware_latch()

    if not dry_run:
        dry_beads= 10
    else:
        dry_beads= 0.5

    for beaddry in np.arange(dry_beads,0,-0.5):
        ctx.delay(minutes=0.5, msg='There are ' + str(beaddry) + ' minutes left in the drying step.')

    #Elution
    ctx.comment('------- Beginning Elution Steps -------')

    pip.pick_up_tip(tips1)
    pip.aspirate(elution_vol, elution_res)
    pip.dispense(elution_vol, samples_m)
    resuspend_pellet(elution_vol,samples_m, reps=3 if not dry_run else 1)
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

    pip.pick_up_tip(tips1)
    pip.aspirate(elution_vol,samples_m)
    pip.dispense(elution_vol,elution_res)
    pip.return_tip()

    pip.home()