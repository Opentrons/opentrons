from opentrons.types import Point
import json
import os
import math
import threading
from time import sleep
from opentrons import types
import numpy as np
import smtplib 

metadata = {
    'protocolName': 'Flex ZymoBIOMICS Magbead DNA Extraction: Cells',
    'author': 'Zach Galluzzo <zachary.galluzzo@opentrons.com>',
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.15"
}

"""
Here is where you can modify the magnetic module engage height:
"""
whichwash = 1
tip1k = 0
tip200 = 0
drop_count = 0

HS_SLOT = 1
USE_GRIPPER = True
dry_run = True

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
    #Protocol Parameters
    #48 Sample Max
    num_samples = 48
    deepwell_type = "nest_96_wellplate_2ml_deep"
    res_type = "nest_12_reservoir_15ml"
    wash1_vol = 500
    wash2_vol = wash3_vol = 900
    if not dry_run:
        settling_time = 2
        lysis_incubation = 30
    else:
        settling_time = 0.25
        lysis_incubation = 0.25
    lysis_vol= 220 #200 Shield + 20 PK
    sample_vol= 10 #Sample should be pelleted tissue/bacteria/cells
    starting_vol= lysis_vol+sample_vol 
    binding_buffer_vol= 625
    bind2_vol = 500
    elution_vol= 75

    h_s = ctx.load_module('heaterShakerModuleV1','D1')
    h_s_adapter = h_s.load_adapter('opentrons_96_deep_well_adapter')
    sample_plate = h_s_adapter.load_labware(deepwell_type)
    h_s.close_labware_latch()
    temp = ctx.load_module('temperature module gen2','D3')
    temp_block = temp.load_adapter('opentrons_96_well_aluminum_block')
    magblock = ctx.load_module('magneticBlockV1','C1')
    elutionplate = temp_block.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    waste = ctx.load_labware('nest_1_reservoir_195ml', 'B3','Liquid Waste').wells()[0].top()
    res1 = ctx.load_labware(res_type, 'D2', 'reagent reservoir 1')
    res2 = ctx.load_labware(res_type, 'C2', 'reagent reservoir 2')
    num_cols = math.ceil(num_samples/8)
    
    #Load tips and combine all similar boxes
    tips1000 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'C3')
    tips1001 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B1')
    tips1002 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B2')
    tips = [*tips1000.wells()[num_samples:96],*tips1001.wells(),*tips1002.wells()]
    tips_sn = tips1000.wells()[:num_samples]
    # load instruments
    m1000 = ctx.load_instrument('flex_8channel_1000', 'left')

    """
    Here is where you can define the locations of your reagents.
    """
    lysis_ = res1.wells()[0]
    binding_buffer = res1.wells()[1:4]
    bind2_res = res1.wells()[4:6]
    wash1 = res1.wells()[6:8]
    elution_solution = res1.wells()[-1]
    wash2 = res2.wells()[:6]
    wash3 = res2.wells()[6:]
    

    samples_m = sample_plate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]

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
        if (drop_count >= 150) & (ABR_TEST == False):
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
        num_trans = math.ceil(vol/980)
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

        #Transfer from Magdeck plate to H-S
        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            h_s_adapter,
            use_gripper=USE_GRIPPER
        )
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
        aspbot = well.bottom().move(types.Point(x=0,y=2,z=1))
        asptop = well.bottom().move(types.Point(x=0,y=-2,z=2))
        disbot = well.bottom().move(types.Point(x=0,y=2,z=3))
        distop = well.top().move(types.Point(x=0,y=1,z=-5))

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
                pip.flow_rate.dispense = 100
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
                pip.flow_rate.aspirate = 150
                pip.flow_rate.dispense = 100
                pip.aspirate(vol,asp)
                pip.dispense(vol,asp)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300

    def lysis(vol, source):
        ctx.comment('-----Beginning Lysis Steps-----')
        num_transfers = math.ceil(vol/980)
        tiptrack(m1000, tips)
        for i in range(num_cols):
            src = source
            tvol = vol/num_transfers
            #Mix Shield and PK before transferring first time
            if i == 0:
                for x in range(3 if not dry_run else 1):
                    m1000.aspirate(vol,src.bottom(1))
                    m1000.dispense(vol,src.bottom(8))
            #Transfer Shield and PK
            for t in range(num_transfers):
                m1000.aspirate(tvol,src.bottom(1))
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume,samples_m[i].top())

        #Mix shield and pk with samples
        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000,tips)
            mixing(samples_m[i],m1000,tvol,reps=5 if not dry_run else 1)
            m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()

        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=lysis_incubation if not dry_run else 0.25, msg='Shake at 1800 rpm for 30 minutes.')
        h_s.deactivate_shaker()

    def bind(vol1,vol2):
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
        for i, well in enumerate(samples_m):
            tiptrack(m1000,tips)
            num_trans = math.ceil(vol1/980)
            vol_per_trans = vol1/num_trans
            source = binding_buffer[i//2]
            if i == 0:
                reps=5
            else:
                reps=2
            bead_mixing(source,m1000,vol_per_trans,reps=reps if not dry_run else 1)
            #Transfer beads and binding from source to H-S plate
            for t in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, source.top())
                m1000.transfer(vol_per_trans, source, well.top(), air_gap=20,new_tip='never')
                m1000.air_gap(20)
            bead_mixing(well,m1000,vol_per_trans,reps=8 if not dry_run else 1)
            m1000.blow_out()
            m1000.air_gap(10)
            m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()

        h_s.set_and_wait_for_shake_speed(1800)
        ctx.delay(minutes=10 if not dry_run else 0.25, msg='Shake at 1800 rpm for 10 minutes.')
        h_s.deactivate_shaker()

        #Transfer from H-S plate to Magdeck plate
        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        h_s.close_labware_latch()

        for bindi in np.arange(settling_time+1,0,-0.5): #Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg='There are ' + str(bindi) + ' minutes left in the incubation.')

        # remove initial supernatant
        remove_supernatant(vol1+starting_vol)

        ctx.comment('-----Beginning Bind #2 Steps-----')
        tiptrack(m1000,tips)
        for i, well in enumerate(samples_m):
            num_trans = math.ceil(vol2/980)
            vol_per_trans = vol2/num_trans
            source = bind2_res[i//3]
            if i == 0 or i == 3:
                height = 10
            else:
                height = 1
            #Transfer beads and binding from source to H-S plate
            for t in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, source.top())
                m1000.transfer(vol_per_trans, source.bottom(height), well.top(), air_gap=20,new_tip='never')
                m1000.air_gap(20)

        for i in range(num_cols):
            if i != 0:
                tiptrack(m1000,tips)
            bead_mixing(samples_m[i],m1000,vol_per_trans,reps=3 if not dry_run else 1)
            m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()

        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=1 if not dry_run else 0.25, msg='Shake at 2000 rpm for 1 minutes.')
        h_s.deactivate_shaker()

        #Transfer from H-S plate to Magdeck plate
        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        h_s.close_labware_latch()

        for bindi in np.arange(settling_time+1,0,-0.5): #Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg='There are ' + str(bindi) + ' minutes left in the incubation.')

        # remove initial supernatant
        remove_supernatant(vol2+25)

    def wash(vol, source):

        global whichwash #Defines which wash the protocol is on to log on the app

        if source == wash1:
            whichwash = 1
            const = 6//len(source)
        if source == wash2:
            whichwash = 2
            const = 6//len(source)
            height = 1
        if source == wash3:
            whichwash = 3
            const = 6//len(source)
            height = 1

        ctx.comment("-----Wash #" + str(whichwash) + " is starting now------")

        num_trans = math.ceil(vol/980)
        vol_per_trans = vol/num_trans
        
        tiptrack(m1000,tips)
        for i, m in enumerate(samples_m):
            if source == wash1:
                if i == 0 or i == 3:
                    height = 10
                else:
                    height = 1
            src = source[i//const]
            for n in range(num_trans):
                if m1000.current_volume > 0:
                    m1000.dispense(m1000.current_volume, src.top())
                m1000.transfer(vol_per_trans, src.bottom(height), m.top(), air_gap=20,new_tip='never')
        m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()

        h_s.set_and_wait_for_shake_speed(1800)
        ctx.delay(minutes=5 if not dry_run else 0.25)
        h_s.deactivate_shaker()

        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        h_s.close_labware_latch()

        for washi in np.arange(settling_time,0,-0.5): #settling time timer for washes
            ctx.delay(minutes=0.5, msg='There are ' + str(washi) + ' minutes left in wash ' + str(whichwash) + ' incubation.')

        remove_supernatant(vol)

    def elute(vol):
        tiptrack(m1000,tips)
        for i, m in enumerate(samples_m):
            m1000.aspirate(vol, elution_solution)
            m1000.air_gap(20)
            m1000.dispense(m1000.current_volume, m.top(-3))
        m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()

        h_s.set_and_wait_for_shake_speed(2000)
        ctx.delay(minutes=5 if not dry_run else 0.25,msg='Shake on H-S for 5 minutes at 2000 rpm.')
        h_s.deactivate_shaker()

        #Transfer back to magnet
        h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        h_s.close_labware_latch()

        for elutei in np.arange(settling_time,0,-0.5):
            ctx.delay(minutes=0.5, msg='Incubating on MagDeck for ' + str(elutei) + ' more minutes.')

        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            tiptrack(m1000,tips)
            m1000.flow_rate.dispense = 100
            m1000.flow_rate.aspirate = 25
            m1000.transfer(vol, m.bottom(0.3), e.bottom(5), air_gap=20, new_tip='never') #original = 0.15
            m1000.blow_out(e.top(-2))
            m1000.air_gap(20)
            m1000.return_tip() if TIP_TRASH == False else m1000.drop_tip()


        m1000.flow_rate.aspirate = 150

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    lysis(lysis_vol,lysis_)
    bind(binding_buffer_vol,bind2_vol)
    wash(wash1_vol, wash1)
    if not dry_run:
        wash(wash2_vol, wash2)
        wash(wash3_vol, wash3)
        drybeads = 9 #Number of minutes you want to dry for
        h_s.set_and_wait_for_temperature(55)
    else:
        drybeads = 0.5
    for beaddry in np.arange(drybeads,0,-0.5):
        ctx.delay(minutes=0.5, msg='There are ' + str(beaddry) + ' minutes left in the drying step.')
    elute(elution_vol)