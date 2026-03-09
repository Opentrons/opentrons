from opentrons.types import Point
import json
import os
import math
import threading
from time import sleep
from opentrons import types
import numpy as np
import smtplib 
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

metadata = {
    'protocolName': 'Thermo MagMax RNA Extraction: Cells Multi-Channel',
    'author': 'Zach Galluzzo <zachary.galluzzo@opentrons.com>',
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.15",
}

"""
Here is where you can modify the magnetic module engage height:
"""
dry_run = False
USE_GRIPPER = True
whichwash = 1
tip = 0
drop_count = 0
waste_vol = 0

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
    #Same for all Extractions
    num_samples = 48
    deepwell_type = "nest_96_wellplate_2ml_deep"
    res_type="nest_12_reservoir_15ml"
    wash_vol= 150
    if not dry_run:
        settling_time = 2
    else:
        settling_time = 0.25
    sample_vol= 50
    lysis_vol = 140
    elution_vol= 50
    starting_vol= sample_vol+lysis_vol
    
    h_s = ctx.load_module('heaterShakerModuleV1','D1')
    h_s_adapter = h_s.load_adapter('opentrons_96_deep_well_adapter')
    sample_plate = h_s_adapter.load_labware(deepwell_type)
    h_s.close_labware_latch()
    temp = ctx.load_module('temperature module gen2','D3')
    temp_block = temp.load_adapter('opentrons_96_well_aluminum_block')
    elutionplate = temp_block.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    if not dry_run:
        temp.set_temperature(4)
    magblock = ctx.load_module('magneticBlockV1','C1')
    waste = ctx.load_labware('nest_1_reservoir_195ml', 'B3','Liquid Waste').wells()[0].top()
    res1 = ctx.load_labware(res_type, 'D2', 'reagent reservoir 1')
    num_cols = math.ceil(num_samples/8)
    
    #Load tips and combine all similar boxes
    tips200 = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'C2')
    tips201 = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'C3')
    tips202 = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'B1')
    tips203 = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'B2')
    tips = [*tips200.wells()[num_samples:96],*tips201.wells(),*tips202.wells(),*tips203.wells()]
    tips_sn = tips200.wells()[:num_samples]

    # load P1000M pipette
    m1000 = ctx.load_instrument('flex_8channel_1000', 'left')

    """
    Here is where you can define the locations of your reagents.
    """
    cells_m = sample_plate.rows()[0][num_cols:2*num_cols]
    samples_m = sample_plate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]

    elution_solution = elution_samples_m
    dnase1 = elutionplate.rows()[0][num_cols:2*num_cols]
    lysis_ = res1.wells()[0]
    stopreaction = res1.wells()[1]
    wash1 = res1.wells()[2]
    wash2 = res1.wells()[3]
    wash3 = res1.wells()[4]
    wash4 = res1.wells()[5]
    wash5 = res1.wells()[6] 

    m1000.flow_rate.aspirate = 50
    m1000.flow_rate.dispense = 150
    m1000.flow_rate.blow_out = 300

    def tiptrack(pip, tipbox):
        global tip
        global drop_count
        pip.pick_up_tip(tipbox[int(tip)])
        tip = tip + 8
        drop_count = drop_count + 8
        if (drop_count >= 250) & (ABR_TEST == False):
            drop_count = 0
            ctx.pause("Please empty the waste bin of all the tips before continuing.")

    def blink():
        for i in range(3):
            ctx.set_rail_lights(True)
            ctx.delay(minutes=0.01666667)
            ctx.set_rail_lights(False)
            ctx.delay(minutes=0.01666667)

    def remove_supernatant(vol):
        ctx.comment("-----Removing Supernatant-----")
        m1000.flow_rate.aspirate = 30
        num_trans = math.ceil(vol/180)
        vol_per_trans = vol/num_trans

        def _waste_track(vol):
            global waste_vol 
            waste_vol = waste_vol + (vol*8)
            if (waste_vol >= 185000) & (ABR_TEST == False):
                m1000.home()
                blink()
                ctx.pause('Please empty liquid waste before resuming.')
                waste_vol = 0

        for i, m in enumerate(samples_m):
            m1000.pick_up_tip(tips_sn[8*i])
            loc = m.bottom(0.5) #original = 0.5
            for _ in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, m.top())
                m1000.move_to(m.center())
                m1000.transfer(vol_per_trans, loc, waste, new_tip='never',air_gap=20)
                m1000.blow_out(waste)
                m1000.air_gap(20)
            m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip(tips_sn[8*i])
        m1000.flow_rate.aspirate = 300
        #Move Plate From Magnet to H-S
        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            h_s_adapter,
            use_gripper=USE_GRIPPER)
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
        aspbot = well.bottom().move(types.Point(x=0,y=0,z=1))
        asptop = well.bottom().move(types.Point(x=2,y=-2,z=1))
        disbot = well.bottom().move(types.Point(x=-2,y=1.5,z=2))
        distop = well.bottom().move(types.Point(x=0,y=0,z=6))

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
                pip.flow_rate.aspirate = 100
                pip.flow_rate.dispense = 75
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
        asp = well.bottom(0.5) #original = 0.5
        disp = well.top(-8)

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
                pip.flow_rate.aspirate = 100
                pip.flow_rate.dispense = 75
                pip.aspirate(vol,asp)
                pip.dispense(vol,asp)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300

    def lysis(vol, source):
        ctx.comment("-----Beginning lysis steps-----")
        num_transfers = math.ceil(vol/180)
        tiptrack(m1000, tips)
        for i in range(num_cols):
            src = source
            tvol = vol/num_transfers
            for t in range(num_transfers):
                m1000.aspirate(tvol,src.bottom(1))
                m1000.dispense(m1000.current_volume,cells_m[i].top(-3))
                
        #mix after adding all reagent to wells with cells
        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000,tips)
            for x in range(8 if not dry_run else 1):
                m1000.aspirate(tvol*.75,cells_m[i].bottom(0.5)) #original = 0.5
                m1000.dispense(tvol*.75,cells_m[i].bottom(8))
                if x == 3:
                    ctx.delay(minutes=0.0167)
                    m1000.blow_out(cells_m[i].bottom(1))
            m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()

        h_s.set_and_wait_for_shake_speed(2200)
        ctx.delay(minutes=1 if not dry_run else 0.25,msg='Please allow 1 minute incubation for cells to lyse')
        h_s.deactivate_shaker()

    def bind():
        """
        `bind` will perform magnetic bead binding on each sample in the
        deepwell plate. Each channel of binding beads will be mixed before
        transfer, and the samples will be mixed with the binding beads after
        the transfer. The magnetic deck activates after the addition to all
        samples, and the supernatant is removed after bead binding.
        :param vol (float): The amount of volume to aspirate from the elution
                            buffer source and dispense to each well containing
                            beads.
        :param park (boolean): Whether to save sample-corresponding tips
                               between adding elution buffer and transferring
                               supernatant to the final clean elutions PCR
                               plate.
        """
        ctx.comment("-----Beginning bind steps-----")
        for i, well in enumerate(samples_m):
            #Transfer cells+lysis/bind to wells with beads
            tiptrack(m1000,tips)
            m1000.aspirate(175,cells_m[i].bottom(0.3)) #original = 0.1
            m1000.air_gap(10)
            m1000.dispense(185,well.bottom(8))
            #Mix after transfer
            bead_mixing(well,m1000,130, reps=5 if not dry_run else 1)
            m1000.air_gap(10)
            m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()

        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=5 if not dry_run else 0.25,msg='Please allow 5 minute incubation for beads to bind to DNA')
        h_s.deactivate_shaker()

        #Transfer from H-S plate to Magdeck plate
        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

        for bindi in np.arange(settling_time,0,-0.5): #Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg='There are ' + str(bindi) + ' minutes left in the incubation.')

        # remove initial supernatant
        remove_supernatant(175)

    def wash(vol, source):

        global whichwash #Defines which wash the protocol is on to log on the app

        if source == wash1:
            whichwash = 1
        if source == wash2:
            whichwash = 2
        if source == wash3:
            whichwash = 3
        if source == wash4:
            whichwash = 4

        ctx.comment("-----Now starting Wash #" + str(whichwash) + "-----")

        tiptrack(m1000,tips)
        num_trans = math.ceil(vol/180)
        vol_per_trans = vol/num_trans
        for i, m in enumerate(samples_m):
            src = source
            for n in range(num_trans):
                m1000.aspirate(vol_per_trans, src)
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume, m.top(-2))
                ctx.delay(seconds=2)
                m1000.blow_out(m.top(-2))
            m1000.air_gap(10)
        m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()

        #Shake for 5 minutes to mix wash with beads
        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=5 if not dry_run else 0.25,msg='Please allow 5 minute incubation for beads to mix in wash buffer')
        h_s.deactivate_shaker()

        #Transfer from H-S plate to Magdeck plate
        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

        for washi in np.arange(settling_time,0,-0.5): #settling time timer for washes
            ctx.delay(minutes=0.5, msg='There are ' + str(washi) + ' minutes left in wash ' + str(whichwash) + ' incubation.')

        remove_supernatant(vol)

    def dnase(vol, source):
        ctx.comment("-----DNAseI Steps Beginning-----")
        num_trans = math.ceil(vol/180)
        vol_per_trans = vol/num_trans
        tiptrack(m1000, tips)
        for i, m in enumerate(samples_m):
            src = source[i]
            m1000.flow_rate.aspirate = 10
            for n in range(num_trans):
                if m1000.current_volume > 0:
                    m1000.dispense(m1000.current_volume, src.top())
                m1000.aspirate(vol_per_trans, src.bottom(0.3)) #original = 0.15
                m1000.dispense(vol_per_trans, m.top(-3))
            m1000.blow_out(m.top(-3))
            m1000.air_gap(20)
        
        m1000.flow_rate.aspirate = 300

        #Is this mixing needed? \/\/\/
        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000,tips)
            mixing(samples_m[i], m1000, 45, reps=5 if not dry_run else 1)
            m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()

        #Shake for 10 minutes to mix DNAseI
        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=10 if not dry_run else 0.25,msg='Please allow 10 minute incubation for DNAse1 to work')
        h_s.deactivate_shaker()

    def stop_reaction(vol, source):
        ctx.comment("-----Adding Stop Solution-----")
        tiptrack(m1000, tips)
        num_trans = math.ceil(vol/180)
        vol_per_trans = vol/num_trans
        for i, m in enumerate(samples_m):    
            src = source
            for n in range(num_trans):
                if m1000.current_volume > 0:
                    m1000.dispense(m1000.current_volume, src.top())
                m1000.transfer(vol_per_trans, src, m.top(), air_gap=20,new_tip='never')
            m1000.blow_out(m.top(-3))
            m1000.air_gap(20)
        
        m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()
            
        #Shake for 3 minutes to mix wash with beads
        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=3 if not dry_run else 0.25,msg='Please allow 3 minute incubation to inactivate DNAse1')
        h_s.deactivate_shaker()

        #Transfer from H-S plate to Magdeck plate
        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

        for stop in np.arange(settling_time,0,-0.5):
            ctx.delay(minutes=0.5,msg='There are ' + str(stop) + ' minutes left in this incubation.')

        remove_supernatant(vol+50)

    def elute(vol):
        ctx.comment("-----Elution Beginning-----")
        tiptrack(m1000,tips)
        m1000.flow_rate.aspirate = 10
        for i, m in enumerate(samples_m):
            loc = m.top(-2)
            m1000.aspirate(vol, elution_solution[i])
            m1000.air_gap(10)
            m1000.dispense(m1000.current_volume, loc)
            m1000.blow_out(m.top(-3))
            m1000.air_gap(10)
           
        m1000.flow_rate.aspirate = 300    

        #Is this mixing needed? \/\/\/
        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000, tips)
            for mixes in range(10):
                m1000.aspirate(elution_vol-10, samples_m[i])
                m1000.dispense(elution_vol-10, samples_m[i].bottom(10))
                if mixes == 9:
                    m1000.flow_rate.dispense = 20
                    m1000.aspirate(elution_vol-10, samples_m[i])
                    m1000.dispense(elution_vol-10, samples_m[i].bottom(10))
                    m1000.flow_rate.dispense = 300
            m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()

        #Shake for 3 minutes to mix wash with beads
        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=3 if not dry_run else 0.25,msg='Please allow 3 minute incubation to elute RNA from beads')
        h_s.deactivate_shaker()
        
        #Transfer from H-S plate to Magdeck plate
        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

        for elutei in np.arange(settling_time,0,-0.5):
            ctx.delay(minutes=0.5, msg='Incubating on MagDeck for ' + str(elutei) + ' more minutes.')

        ctx.comment("-----Trasnferring Sample to Elution Plate-----")
        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            tiptrack(m1000,tips)
            loc = m.bottom(0.3) #original = 0.1
            m1000.transfer(vol, loc, e.bottom(5), air_gap=20, new_tip='never')
            m1000.blow_out(e.top(-2))
            m1000.air_gap(20)
            m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    if not dry_run:
        lysis(lysis_vol,lysis_)
    bind()
    wash(wash_vol, wash1)
    if not dry_run:
        wash(wash_vol, wash2)
        #dnase1 treatment
        dnase(50, dnase1)
        stop_reaction(100, stopreaction)
        #Resume washes
        wash(wash_vol, wash3)
        wash(wash_vol, wash4)
        wash(wash_vol, wash5)
        drybeads = 2 #Number of minutes you want to dry for
    else:
        drybeads = 0.25
    for beaddry in np.arange(drybeads,0,-0.5):
        ctx.delay(minutes=0.5, msg='There are ' + str(beaddry) + ' minutes left in the drying step.')
    elute(elution_vol)