from opentrons import protocol_api
import math
import numpy


metadata = {
    'protocolName': 'Twist Library Preparation with Enzymatic Fragmention 2.0, tip track',
    'author': 'DAndra Howell <dandra.howell@opentrons.com>',
    'source': 'Protocol Library',
    }

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.18",
}

def add_parameters(parameters):
    parameters.add_int(
        display_name="Samples",
        variable_name="Samples",
        default=8,
        minimum=1,
        maximum=24,
        description="Number of samples you would like to run"
        )

    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="PCR_Cycles",
        default=7,
        minimum=3,
        maximum=12,
        description="Number of amplification cycles"
        )

    parameters.add_bool(
        display_name="Dry Run",
        variable_name="DryRun",
        description="Dry runs will skip incubations on the thermocycler and return used tips to the appropriate tip racks",
        default=False
        )

    parameters.add_bool(
        display_name="On Deck Thermocycler",
        variable_name="on_deck_thermo",
        description="Will you be using an Opentrons Thermocycler?",
        default=True
        )

    parameters.add_int(
        display_name="Fragmentation Temperature",
        variable_name="Frag_Temp",
        default=37,
        minimum=30,
        maximum=37,
        description="Fragmentation temperature in celcius"
        )

    parameters.add_int(
        display_name="Fragmentation Time",
        variable_name="Frag_Time",
        default=20,
        minimum=5,
        maximum=40,
        description="Length of time in minutes for Fragmention"
        )
    parameters.add_int(
        display_name="Adapter Volume",
        variable_name="Adap_Vol",
        default=5,
        minimum=1,
        maximum=5,
        description="Volume of adapters (ul) you would like to be added for ligation step"
        )
    parameters.add_int(
        display_name="Column on Primer Plate",
        variable_name="Primer_start",
        description="Choose which column on the primer plate you want to use first (useful for partially used plates)",
        default=1,
        minimum=1,
        maximum=12,
        )

tt_50               = 0
tt_200              = 0
p50_rack_count      = 0
p200_rack_count     = 0
tip50               = 50
tip200              = 200
p50_racks_ondeck    = []
p200_racks_ondeck   = []
p50_racks_offdeck   = []
p200_racks_offdeck  = []
Available_on_deck_slots=['A2','B2','B3','C3']
Available_off_deck_slots=['A4','B4','C4']
p50_racks_to_dump           = []
p200_racks_to_dump          = []

def run(ctx):
    #Parameters
    Samples=ctx.params.Samples
    PCR_Cycles=ctx.params.PCR_Cycles
    DryRun=ctx.params.DryRun
    on_deck_thermo=ctx.params.on_deck_thermo
    Frag_Temp=ctx.params.Frag_Temp
    Frag_Time=ctx.params.Frag_Time
    Adap_Vol=ctx.params.Adap_Vol
    Primer_start=ctx.params.Primer_start
    Columns=math.ceil(Samples/8)

    
    #Hardware and Consumables
    temp_block          = ctx.load_module('temperature module gen2', 'C1')
    temp_adapter        = temp_block.load_adapter('opentrons_96_well_aluminum_block')
    reagent_plate       = temp_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    mag_block           = ctx.load_module('magneticBlockV1', 'A3')
    if on_deck_thermo==True:
        thermocycler        = ctx.load_module('thermocycler module gen2')
        sample_plate_1      = thermocycler.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','Sample_Plate')
    else:
        sample_plate_1      =ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','B1','Sample_Plate')
    samples             = sample_plate_1.rows()[0][:12]
    reservoir           = ctx.load_labware('nest_96_wellplate_2ml_deep','D2')
    chute           =ctx.load_waste_chute()
    Primer_Plate        =ctx.load_labware('eppendorf_96_wellplate_150ul','C2','Twist UDI Primers')

    # ========= REAGENT PLATE ======== 
    FRERAT              = reagent_plate.wells_by_name()['A1']
    Adapter             = reagent_plate.wells_by_name()['A2']
    LIG                 = reagent_plate.wells_by_name()['A3']
    PCR                 = reagent_plate.wells_by_name()['A4']
    Primers             =Primer_Plate.rows()[0][Primer_start-1:12]

    # =========== RESERVOIR ==========
    AMPure              = reservoir['A1'] 
    RSB                 = reservoir['A2']   
    ETOH= reservoir.rows()[0][2:2+Columns]
    

    # pipette
    p1000 = ctx.load_instrument("flex_8channel_1000", "left")
    p50 = ctx.load_instrument("flex_8channel_50", "right")
    p50.flow_rate.blow_out=3
    p1000.flow_rate.blow_out=40

    def move_gripper(labware,new_location):
        ctx.move_labware(
        labware,
        new_location,
        use_gripper=True,
        )

    def move_offdeck(labware,new_location): #manually move labware from off deck locations onto deck
        ctx.move_labware(
        labware,
        new_location,
        use_gripper=False,
        )

    def mix(mix,volume,reagent):
        p50.flow_rate.aspirate=12
        p50.configure_for_volume(volume)
        for x in range (mix):
            p50.aspirate(volume,reagent.bottom(.4))
            p50.dispense(volume,reagent.bottom(1),push_out=0)
        ctx.delay(seconds=4)
        p50.blow_out(reagent.top(-10))
        #p50.flow_rate.aspirate=8

    def drop_tip(pipette):
        if DryRun==True:
            pipette.return_tip()
        else:
            pipette.drop_tip()
    
    #Commands
    def tiptrack(pipette):
        global tt_50
        global tt_200
        global p50_racks_ondeck
        global p200_racks_ondeck
        global p50_racks_offdeck
        global p200_racks_offdeck
        global p50_rack_count
        global p200_rack_count


        if pipette == tip50:
            if tt_50 == 0: #If this is the first column of tip box and these aren't reused tips
                ctx.comment('Troubleshoot')
                if len(Available_on_deck_slots) > 0: 
                    """
                    If there are open deck slots --> need to add a new tip box before pickup
                    """
                    p50_rack_count += 1
                    tt_50 += 12
                    addtiprack = ctx.load_labware('opentrons_flex_96_tiprack_50ul',Available_on_deck_slots[0],f'50 ul Tip Rack #{p50_rack_count}')
                    ctx.comment(f'Adding 50 ul tip rack #{p50_rack_count} to slot {Available_on_deck_slots[0]}')
                    Available_on_deck_slots.pop(0)
                    p50_racks_ondeck.append(addtiprack)
                    p50_racks_to_dump.append(addtiprack)
                    p50.tip_racks.append(addtiprack)
                elif len(Available_on_deck_slots) == 0 and len(Available_off_deck_slots) > 0:
                    p50_rack_count += 1
                    tt_50 += 12
                    addtiprack = ctx.load_labware('opentrons_flex_96_tiprack_50ul',Available_off_deck_slots[0],f'50 ul Tip Rack #{p50_rack_count}')
                    Available_off_deck_slots.pop(0) #Load rack into staging area slot to be moved on deck- want this slot removed so we know when we need manual addition
                    ctx.comment(f'Adding 50 ul tip rack #{p50_rack_count}')
                    p50_racks_offdeck.append(addtiprack) #used in TipSwap then deleted once it is moved
                    p50.tip_racks.append(addtiprack) #lets pipette know it can use this rack now
                    TipSwap(50) #Throw first tip box out and replace with a box from staging area
                elif len(Available_on_deck_slots) == 0 and len(Available_off_deck_slots) == 0: #If there are no tip racks on deck or in staging area to use
                    ctx.pause('Please place a new 50ul Tip Rack in slot A4')
                    p50_rack_count+=1
                    tt_50+=12
                    addtiprack = ctx.load_labware('opentrons_flex_96_tiprack_50ul','A4',f'50 ul Tip Rack #{p50_rack_count}')
                    ctx.comment(f'Adding 50 ul tip rack #{p50_rack_count}')
                    p50_racks_offdeck.append(addtiprack) #used in TipSwap, then deleted once it is moved
                    p50.tip_racks.append(addtiprack) #lets pipette know it can use this rack now
                    TipSwap(50) #Throw first tip box out and replace with a box from staging area
            tt_50 -= 1

        if pipette == tip200:
            if tt_200 == 0: #If this is the first column of tip box and these aren't reused tips
                if len(Available_on_deck_slots) > 0: 
                    """
                    If there are open deck slots --> need to add a new tip box before pickup
                    """
                    p200_rack_count += 1
                    tt_200 += 12
                    addtiprack = ctx.load_labware('opentrons_flex_96_tiprack_200ul',Available_on_deck_slots[0],f'200 ul Tip Rack #{p200_rack_count}')
                    ctx.comment(f'Adding 200 ul tip rack #{p200_rack_count} to slot {Available_on_deck_slots[0]}')
                    Available_on_deck_slots.pop(0)
                    p200_racks_ondeck.append(addtiprack)
                    p200_racks_to_dump.append(addtiprack)
                    p1000.tip_racks.append(addtiprack)
                elif len(Available_on_deck_slots) == 0 and len(Available_off_deck_slots) > 0:
                    p200_rack_count += 1
                    tt_200 += 12
                    addtiprack = ctx.load_labware('opentrons_flex_96_tiprack_200ul',Available_off_deck_slots[0],f'200 ul Tip Rack #{p200_rack_count}')
                    Available_off_deck_slots.pop(0) #Load rack into staging area slot to be moved on deck- want this slot removed so we know when we need manual addition
                    ctx.comment(f'Adding 200 ul tip rack #{p200_rack_count}')
                    p200_racks_offdeck.append(addtiprack) #used in TipSwap then deleted once it is moved
                    p1000.tip_racks.append(addtiprack) #lets pipette know it can use this rack now
                    TipSwap(200) #Throw first tip box out and replace with a box from staging area
                elif len(Available_on_deck_slots) == 0 and len(Available_off_deck_slots) == 0: #If there are no tip racks on deck or in staging area to use
                    ctx.pause('Please place a new 200ul Tip Rack in slot B4')
                    p200_rack_count+=1
                    tt_200+=12
                    addtiprack = ctx.load_labware('opentrons_flex_96_tiprack_200ul','B4',f'200 ul Tip Rack #{p200_rack_count}')
                    ctx.comment(f'Adding 200 ul tip rack #{p200_rack_count}')
                    p200_racks_offdeck.append(addtiprack) #used in TipSwap, then deleted once it is moved
                    p1000.tip_racks.append(addtiprack) #lets pipette know it can use this rack now
                    TipSwap(200) #Throw first tip box out and replace with a box from staging area
            tt_200 -= 1
                    
    def TipSwap(tipvol):
        if tipvol == 50:
            rack_to_dispose = p50_racks_to_dump[0]
            rack_to_add     = p50_racks_offdeck[0]
            deck_slot       = p50_racks_to_dump[0].parent
            old_deck_slot   = p50_racks_offdeck[0].parent

            p50_racks_ondeck.append(rack_to_add)
            p50_racks_to_dump.pop(0)
            p50_racks_to_dump.append(rack_to_add)
            p50_racks_ondeck.pop(0)
            p50_racks_offdeck.pop(0)


        if tipvol == 200:
            rack_to_dispose = p200_racks_to_dump[0]
            rack_to_add     = p200_racks_offdeck[0]
            deck_slot       = p200_racks_to_dump[0].parent
            old_deck_slot   = p200_racks_offdeck[0].parent

            p200_racks_ondeck.append(rack_to_add)
            p200_racks_to_dump.pop(0)
            p200_racks_to_dump.append(rack_to_add)
            p200_racks_ondeck.pop(0)
            p200_racks_offdeck.pop(0)

        if DryRun==True:
            ctx.move_labware(
                labware         =rack_to_dispose,
                new_location    =chute,
                use_gripper     =False
            )
        else:
            ctx.move_labware(
                labware         =rack_to_dispose,
                new_location    =chute,
                use_gripper     =True
            )
        ctx.move_labware(
            labware         =rack_to_add,
            new_location    =deck_slot,
            use_gripper     =True
        )
        


    ############################################################################################################################
    if on_deck_thermo==True:
        thermocycler.open_lid()
    if DryRun == False:
        ctx.comment("SETTING THERMO and TEMP BLOCK Temperature")
        temp_block.set_temperature(4)
        if on_deck_thermo==True:
            thermocycler.set_block_temperature(4)
            thermocycler.set_lid_temperature(105)   

    #FRERAT
    #############################################################################################################################
    p50.flow_rate.aspirate=12
    p50.flow_rate.dispense=15
    #Adding FRERAT MM 
    for a in range(Columns):
        tiptrack(tip50)
        p50.pick_up_tip()
        p50.aspirate(10,FRERAT.bottom(.4))
        ctx.delay(seconds=3)
        p50.dispense(10,samples[a],push_out=0)
        p50.blow_out(samples[a].top(-10))
        mix(20,40,samples[a])
        drop_tip(p50)
    if on_deck_thermo==True:
        thermocycler.close_lid()
        if DryRun == False:
            profile_FRERAT = [
                {'temperature': Frag_Temp, 'hold_time_minutes': Frag_Time},
                {'temperature': 65, 'hold_time_minutes': 30}
                ]
            thermocycler.execute_profile(steps=profile_FRERAT, repetitions=1, block_max_volume=50)
            thermocycler.set_block_temperature(4)
        thermocycler.open_lid()
        thermocycler.deactivate_lid()
    else:
        ctx.pause('Transfer sample plate to thermocycler and begin Fragmentation Program')
        move_offdeck(sample_plate_1,protocol_api.OFF_DECK)
        ctx.pause('Quick Spin plate and return sample plate to D1')
        ctx.move_labware(
            sample_plate_1,
            'D1',
            use_gripper=False)

    #Ligation
    #########################################################################################################################
    #Adding adapter
    for b in range(Columns):
        tiptrack(tip50)
        p50.pick_up_tip()
        p50.aspirate(Adap_Vol,Adapter.bottom(.4))
        ctx.delay(seconds=3)
        p50.dispense(Adap_Vol,samples[b].bottom(z=.4),push_out=0)
        p50.blow_out(samples[b].top(-10))
        #mix(5,45,samples[b])
        drop_tip(p50)
    #Adding LIG MM
    for c in range(Columns):
        tiptrack(tip50)
        p50.pick_up_tip()
        p50.aspirate(20, LIG.bottom(.4))
        ctx.delay(seconds=3)
        p50.dispense(20,samples[c],push_out=0)
        p50.blow_out(samples[c].top(-10))
        mix(15,50,samples[c])
        drop_tip(p50)

    if on_deck_thermo==True:
        ctx.move_labware(sample_plate_1,'D1',use_gripper=True)
        if DryRun==False:
            thermocycler.set_block_temperature(20)
        ctx.move_labware(sample_plate_1,thermocycler,use_gripper=True)
        thermocycler.close_lid()
        if DryRun == False:
            profile_LIG = [
                {'temperature': 20, 'hold_time_minutes': 15}
                ]
            thermocycler.execute_profile(steps=profile_LIG, repetitions=1, block_max_volume=80)
            thermocycler.set_block_temperature(4)
        thermocycler.open_lid()
    else:
        ctx.pause('Transfer sample plate to thermocycler and begin Ligation Program')
        move_offdeck(sample_plate_1,protocol_api.OFF_DECK)
        ctx.pause('Quick Spin plate and return sample plate to D1')
        ctx.move_labware(
            sample_plate_1,
            'D1',
            use_gripper=False)
    
        
    # Purify 1
    ########################################################################################################################
    if on_deck_thermo==True:
        ctx.move_labware(sample_plate_1,'D1',use_gripper=True)
    tiptrack(tip200)
    p1000.pick_up_tip()
    p1000.flow_rate.aspirate=3000
    p1000.flow_rate.dispense=3000
    if Columns==1:
        p1000.mix(40,110,AMPure)
    else:
        p1000.mix(40,200,AMPure)
    ctx.delay(seconds=5)
    p1000.blow_out(AMPure.bottom(12))
    drop_tip(p1000)
    p1000.flow_rate.aspirate=140
    p1000.flow_rate.dispense=100
    #Adding Ampure to NA
    for d in range(Columns):
        tiptrack(tip200)
        p1000.pick_up_tip()
        p1000.aspirate(60,AMPure.bottom(z=.4))
        ctx.delay(seconds=3)
        p1000.dispense(60, samples[d],push_out=0)
        p1000.blow_out(samples[d].top(-4))
        p1000.mix(15,120,samples[d].bottom(1))
        p1000.blow_out(samples[d].top(-4))
        drop_tip(p1000)
    ctx.delay(minutes=5)
    ctx.move_labware(sample_plate_1,mag_block,use_gripper=True)
    ctx.delay(minutes=4)
    for e in range(Columns): #Removing Sup
        tiptrack(tip200)
        p1000.pick_up_tip()
        p1000.flow_rate.aspirate=100
        p1000.aspirate(125,samples[e].bottom(.6))
        ctx.delay(seconds=3)
        p1000.dispense(125,chute)
        p1000.flow_rate.aspirate=140
        drop_tip(p1000)
    #ETOH washes
    for z in range(2):
        for x in range(Columns): #adding EtOH
            tiptrack(tip200)
            p1000.pick_up_tip()
            p1000.aspirate(180, ETOH[x])
            p1000.dispense(180, samples[x].top(-3))
            drop_tip(p1000)
        ctx.delay(seconds=30)
        for x in range(Columns): #remove EtOH
            tiptrack(tip200)
            p1000.pick_up_tip()
            p1000.aspirate(85,samples[x].bottom(z=6))
            p1000.aspirate(95,samples[x])
            p1000.dispense(180,chute)
            drop_tip(p1000)
    for x in range(Columns): #remove residual liquid
        tiptrack(tip50)
        p50.pick_up_tip()
        p50.aspirate(50,samples[x].bottom(.4))
        p50.dispense(50,chute)
        drop_tip(p50)
    ctx.delay(minutes=2.5)
    ctx.move_labware(sample_plate_1,'D1',use_gripper=True)
    for x in range(Columns):
        tiptrack(tip50)
        p50.pick_up_tip()
        p50.aspirate(17,RSB.bottom(.4))
        p50.dispense(17,samples[x].bottom(.5),push_out=0)
        p50.blow_out(samples[x].top(-10))
        mix(20,15,samples[x])
        drop_tip(p50)
    ctx.delay(minutes=2)
    ctx.move_labware(sample_plate_1, mag_block,use_gripper=True)
    ctx.delay(minutes=2.5)
    for x in range(Columns):
        tiptrack(tip50)
        p50.pick_up_tip()
        p50.aspirate(15, samples[x].bottom(z=.4))
        p50.dispense(15, samples[x+4])
        drop_tip(p50)

    #Amplification
    #####################################################################################################################################
    if on_deck_thermo==True:
        ctx.move_labware(sample_plate_1,thermocycler,use_gripper=True)
        if DryRun == False:
            thermocycler.set_lid_temperature(105)
    for x in range(Columns): #Poke holes and aspirate
        tiptrack(tip200)
        p1000.pick_up_tip()
        p1000.move_to(Primers[x].top(-10))
        p1000.touch_tip(Primers[x],radius=1.8,v_offset=-4,speed=6)
        drop_tip(p1000)
        tiptrack(tip50)
        p50.pick_up_tip()
        p50.aspirate(10,Primers[x].bottom(z=.5))
        ctx.delay(seconds=3)
        p50.dispense(10,samples[x+4].top(-10))
        p50.blow_out(samples[x+4].top(-10))
        drop_tip(p50)

    for z in range(Columns):
        #Adding Amp Mix
        tiptrack(tip50)
        p50.pick_up_tip()
        p50.aspirate(25,PCR.bottom(.4))
        ctx.delay(seconds=3)
        p50.dispense(25,samples[z+4],push_out=0)
        mix(20,40,samples[z+4])
        drop_tip(p50)
    if on_deck_thermo==True:
        #Thermocycler Program
        if DryRun == False:
            thermocycler.close_lid()
            profile_PCR_1 = [
                {'temperature': 98, 'hold_time_seconds': 45}
                ]
            thermocycler.execute_profile(steps=profile_PCR_1, repetitions=1, block_max_volume=50)
            profile_PCR_2 = [
                {'temperature': 98, 'hold_time_seconds': 15},
                {'temperature': 60, 'hold_time_seconds': 30},
                {'temperature': 72, 'hold_time_seconds': 30}
                ]
            thermocycler.execute_profile(steps=profile_PCR_2, repetitions=PCR_Cycles, block_max_volume=50)
            profile_PCR_3 = [
                {'temperature': 72, 'hold_time_minutes': 1}
                ]
            thermocycler.execute_profile(steps=profile_PCR_3, repetitions=1, block_max_volume=50)
            thermocycler.set_block_temperature(4)
            thermocycler.open_lid()
    else:
        ctx.pause('Transfer sample plate to thermocycler and begin PCR Program')
        move_offdeck(sample_plate_1,protocol_api.OFF_DECK)
        ctx.pause('Quick Spin plate and return sample plate to D1')
        ctx.move_labware(
            sample_plate_1,
            'D1',
            use_gripper=False)
    
    # Purify 2
    ###############################################################################################################################
    if on_deck_thermo==True:
        ctx.move_labware(sample_plate_1,'D1',use_gripper=True)
    tiptrack(tip200)
    p1000.pick_up_tip()
    p1000.flow_rate.aspirate=3000
    p1000.flow_rate.dispense=3000
    p1000.mix(30,55*Columns,AMPure)
    ctx.delay(seconds=3)
    p1000.blow_out(AMPure.bottom(12))
    drop_tip(p1000)
    p1000.flow_rate.aspirate=140
    p1000.flow_rate.dispense=100
    #Adding Ampure to NA
    for d in range(Columns):
        tiptrack(tip200)
        p1000.pick_up_tip()
        p1000.aspirate(50,AMPure.bottom(z=.4))
        ctx.delay(seconds=3)
        p1000.dispense(50, samples[d+4],push_out=0)
        p1000.blow_out(samples[d+4].top(-4))
        p1000.mix(15,90,samples[d+4])
        p1000.blow_out(samples[d+4].top(-4))
        drop_tip(p1000)
    ctx.delay(minutes=5)
    ctx.move_labware(sample_plate_1,mag_block,use_gripper=True)
    ctx.delay(minutes=3)
    for e in range(Columns): #Remove Sup
        tiptrack(tip200)
        p1000.pick_up_tip()
        p1000.flow_rate.aspirate=100
        p1000.aspirate(95,samples[e+4].bottom(.4))
        ctx.delay(seconds=3)
        p1000.dispense(95,chute)
        drop_tip(p1000)
        p1000.flow_rate.aspirate=140
    #ETOH washes
    for z in range(2):
        for x in range(Columns): #adding EtOH
            tiptrack(tip200)
            p1000.pick_up_tip()
            p1000.aspirate(180, ETOH[x])
            p1000.dispense(180, samples[x+4].top(-3))
            drop_tip(p1000)
        ctx.delay(seconds=30)
        for x in range(Columns): #remove EtOH
            tiptrack(tip200)
            p1000.pick_up_tip()
            p1000.aspirate(85,samples[x+4].bottom(z=6))
            p1000.aspirate(95,samples[x+4].bottom(.5))
            p1000.dispense(180,chute)
            drop_tip(p1000)
    for x in range(Columns): #remove residual liquid
        tiptrack(tip50)
        p50.pick_up_tip()
        p50.aspirate(50,samples[x+4].bottom(.3))
        p50.dispense(50,chute)
        drop_tip(p50)
    ctx.delay(minutes=2.5)
    ctx.move_labware(sample_plate_1,'D1',use_gripper=True)
    for x in range(Columns):
        tiptrack(tip50)
        p50.pick_up_tip()
        p50.aspirate(22,RSB.bottom(.4))
        p50.dispense(22,samples[x+4].bottom(.5),push_out=0)
        p50.blow_out(samples[x+4].top(-10))
        mix(20,18,samples[x+4])
        drop_tip(p50)
    ctx.delay(minutes=2)
    ctx.move_labware(sample_plate_1, mag_block,use_gripper=True)
    ctx.delay(minutes=2.5)
    for x in range(Columns):
        tiptrack(tip50)
        p50.pick_up_tip()
        p50.aspirate(20, samples[x+4].bottom(z=.5))
        ctx.delay(seconds=3)
        p50.dispense(20, samples[x+8])
        drop_tip(p50)
    if on_deck_thermo==True:
        thermocycler.deactivate_lid()
        thermocycler.deactivate_block()
    temp_block.deactivate()
    ctx.home()

    #                                           Liquids Definitions and Assignments
    ########################################################################################################################################################
    FRERAT_=ctx.define_liquid(name="Enzymatic Fragmention Master Mix", description="Fragmentation, End Repair and A-Tailing Mix", display_color="#cc3399")
    for well in reagent_plate.wells()[0:8]:
        well.load_liquid(liquid=FRERAT_,volume=12*Columns)
    Adapter_=ctx.define_liquid(name="Twist Universal Adapters", description="Adapter", display_color="#ff6699")
    for well in reagent_plate.wells()[8:16]:
        well.load_liquid(liquid=Adapter_,volume=5.7*Columns)
    LIG_=ctx.define_liquid(name="Ligation Mix", description="Ligation Mix", display_color="#ffcc99")
    for well in reagent_plate.wells()[16:24]:
        well.load_liquid(liquid=LIG_,volume=22*Columns)
    PCR_=ctx.define_liquid(name="Equinox Library Amp Mix (2x)", description="PCR Mix", display_color="#ff9966")
    for well in reagent_plate.wells()[24:32]:
        well.load_liquid(liquid=PCR_,volume=27.5*Columns)
    Samples_=ctx.define_liquid(name="Samples", description="Samples", display_color="#009933")
    for well in sample_plate_1.wells()[:Columns*8]:
        well.load_liquid(liquid=Samples_, volume=40)
    Amp_=ctx.define_liquid(name="DNA Purification Beads", description="AmpureXP Beads", display_color="#663300")
    for well in reservoir.wells()[0:8]:
        well.load_liquid(liquid=Amp_, volume=130*Columns)
    EtOH_=ctx.define_liquid(name="80% Ethanol", description="80% Ethanol", display_color="#00cc99")
    for well in reservoir.wells()[16:16+Samples]:
        well.load_liquid(liquid=EtOH_, volume=800)
    RSB_=ctx.define_liquid(name="Buffer EB", description="Resuspension Buffer", display_color="#99ff99")
    for well in reservoir.wells()[8:16]:
        well.load_liquid(liquid=RSB_, volume=43*Columns)

