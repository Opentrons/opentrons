from opentrons.types import Point

metadata = {
    'protocolName': 'Duolink PLA for Microscopy (Component Testing Assay with 96 Square Well Culture Plate) - Day 2',
    'author': 'Opentrons Science Team'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}

########################

NUM_COL = 4

VOL_AB = 80
VOL_PROBE = 80
VOL_LIGATION = 80
VOL_AMP = 80
VOL_DAPI = 80 
VOL_AF = 80 
VOL_RESIDUAL = 40

VOL_WASH = 200

MIN_PROBE = 60
MIN_LIGATION = 30
MIN_AMP = 100
MIN_DAPI = 15

MIN_WASH_A = 5
MIN_WASH_B = 10
MIN_WASH_B_2 = 1
MIN_WASH_PBS = 0.5


DEFAULT_RATE = 700
SLOW = 100 

H_DISCARD = 0.7
D_1K = -3.2
D_200 = -2.1

########################

def add_parameters(parameters):

    parameters.add_bool(variable_name="dry_run",
                        display_name="Dry Run",
                        description="All incubation steps skipped and tips returned to tipracks",
                        default=False
                        )
    parameters.add_bool(variable_name="heat_on_deck",
                        display_name="Incubation on Deck",
                        description="Use Heater-Shaker Module for 37 degree C incubation?",
                        default=True
                        )
    parameters.add_bool(variable_name="use_lid",
                        display_name="Use Plate Lid",
                        description="Use a lid to cover assay plate during incubation?",
                        default=True
                        )
    parameters.add_bool(variable_name="use_temp",
                        display_name="Use Temperature Module",
                        description="Use a Temperature Module to keep reagents cold?",
                        default=True
                        )
    

def run(ctx):

    dry_run = ctx.params.dry_run
    heat_on_deck = ctx.params.heat_on_deck
    use_lid = ctx.params.use_lid
    use_temp = ctx.params.use_temp


    # deck layout
    if use_temp:
        temp_mod = ctx.load_module('temperature module gen2','C1')
        temp_adapter = temp_mod.load_adapter('opentrons_96_deep_well_temp_mod_adapter')
        reagent_plate = temp_adapter.load_labware(
            "nest_96_wellplate_2ml_deep", 'Reagent Plate'
        )

    else: reagent_plate = ctx.load_labware('nest_96_wellplate_2ml_deep', 'C1', 'REAGENTS')
    
    hs = ctx.load_module('heaterShakerModuleV1', 'D1')
    hs_adapter = hs.load_adapter('opentrons_universal_flat_adapter')

    working_plate = ctx.load_labware('ibidi_96_square_well_plate_300ul', 'C2', 'ASSAY PLATE') 
 
    wash_plate = ctx.load_labware('nest_12_reservoir_15ml', 'C3', 'WASH BUFFER A, B, B(0.01x), and PBS')  
    waste_res = ctx.load_labware('nest_1_reservoir_290ml', 'D2', 'LIQUID WASTE')

    ctx.load_trash_bin('D3')

    tips_1k = [ctx.load_labware('opentrons_flex_96_tiprack_1000ul', slot, '1000uL TIPS')
               for slot in ['B3', 'A3']]
    
    tips_200_wash_a = [ctx.load_labware('opentrons_flex_96_tiprack_200ul', slot, '200uL TIPS')
                       for slot in ['B2', 'B1', 'A2']]
    tips_a = [tips_200_wash_a[count].rows()[0][:12]
              for count in range(3)]

    tips_200_reuse = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'A1', '200uL TIPS REUSED')
    tips_reuse_1 = tips_200_reuse.rows()[0][:4]
    tips_reuse_2 = tips_200_reuse.rows()[0][4:8]    
    tips_reuse_3 = tips_200_reuse.rows()[0][8:12]
    reuse_tip_loc = tips_200_reuse.rows()[0][:12]

    p1k_8 = ctx.load_instrument('flex_8channel_1000', 'left') 
    p1k_1 = ctx.load_instrument('flex_1channel_1000', 'right')  
    
    p1k_8.flow_rate.aspirate = DEFAULT_RATE
    p1k_8.flow_rate.dispense = DEFAULT_RATE 
    p1k_1.flow_rate.aspirate = DEFAULT_RATE
    p1k_1.flow_rate.dispense = DEFAULT_RATE 

    # liquid location  
    rxn = working_plate.rows()[0][:NUM_COL]
    probe = reagent_plate.rows()[0][0]    
    lig = reagent_plate.rows()[0][1]   
    amp = reagent_plate.rows()[0][2]
    dapi = reagent_plate.rows()[0][3] 
    af = reagent_plate.rows()[0][4] 

    wash_a_1 = wash_plate.wells()[:2]  
    wash_a_2 = wash_plate.wells()[2:4]  
    wash_a_3 = wash_plate.wells()[4:6]
    wash_b = wash_plate.wells()[6:8]  
    wash_b_2 = wash_plate.wells()[8] 
    wash_pbs =  wash_plate.wells()[9] 

    waste = waste_res.wells()[0]

    # volume info
    vol_re = [VOL_PROBE*4+80, VOL_LIGATION*4+80, VOL_AMP*4+80, VOL_DAPI*4+80, VOL_AF*4+80]
    name_re = ['PLA PROBE SOLUTION', 'LIGATION SOLUTION', 'AMPLIFICATION SOLUTION', 'DAPI', 'ANTI-FADE BUFFER']
    color_re = ["#FF5733",  "#f39c12" , "#52be80", "#a569bd", "#aeb6bf"] ## Red, Yellow, Green, Purple, Gray
    descrip_re = '80uL*4 +80uL per well'
    
    for col, (a, b, c) in enumerate(zip(vol_re, name_re, color_re)):
        def_re = ctx.define_liquid(name=b, description=descrip_re, display_color=c)
        [reagent_plate.rows()[row][col].load_liquid(liquid=def_re, volume=a)
         for row in range(8)]
        
    vol_wa = (200 * 8 * 4) + 1600
    descrip_wa = "8,000uL per well"

    def_wa_a = ctx.define_liquid(name='WASH BUFFER A', description=descrip_wa, display_color='#0080bf') ## Blue
    for well in range(6):
        wash_plate.wells()[well].load_liquid(liquid=def_wa_a, volume=vol_wa)

    def_wa_b = ctx.define_liquid(name='WASH BUFEER B', description=descrip_wa, display_color='#00acdf') ## Blue
    for well in range(2):
        wash_plate.wells()[6+well].load_liquid(liquid=def_wa_b, volume=vol_wa)

    def_wa_b = ctx.define_liquid(name='WASH BUFEER B (0.01x)', description=descrip_wa, display_color='#7ce8ff') ## Blue
    wash_plate.wells()[8].load_liquid(liquid=def_wa_b, volume=vol_wa)

    def_wa_b = ctx.define_liquid(name='PBS', description=descrip_wa, display_color='#ccf9ff') ## Blue
    wash_plate.wells()[9].load_liquid(liquid=def_wa_b, volume=vol_wa)   
    
    vol_from_day1 = VOL_AB
    def_from_day1 = ctx.define_liquid(name='FROM DAY 1', description=" ", display_color='#fff9d8') ## Light Yellow
    [working_plate.wells()[n].load_liquid(liquid=def_from_day1, volume=vol_from_day1)
     for n in range(NUM_COL*8)]
    

    if use_lid:

        ctx.load_lid_stack("ibidi_96_square_well_plate_300ul_lid", 'C4', 1)

        def cover_plate():
            ctx.move_lid('C4',
                         working_plate,
                         use_gripper=True
                         )
      
        def remove_lid():
            ctx.move_lid(working_plate,
                         'C4',
                         use_gripper=True
                         )
        
    def heat(min):
        hs.set_and_wait_for_temperature(37)
        hs.open_labware_latch()
        ctx.move_labware(labware = working_plate,
                        new_location = hs_adapter,
                        use_gripper=True
                        )

        hs.close_labware_latch()
        hs.open_labware_latch()

        ctx.delay(minutes=min)

        ctx.move_labware(labware = working_plate,
                        new_location = 'C2',
                        use_gripper=True
                        )
        hs.deactivate_heater()
        
    def transfer(start, vol):
        p1k_8.tip_racks = tips_1k
        p1k_8.pick_up_tip()     
        p1k_8.aspirate(vol*NUM_COL, start)
        p1k_8.air_gap(10)
        p1k_8.dispense(10, rxn[0].top(z=0))
        p1k_8.flow_rate.dispense = SLOW  
        for col in rxn:  
            p1k_8.move_to(col.top(z=0))
            p1k_8.dispense(vol, col.top(z=-2).move(Point(x=D_1K, y=D_1K)))
            p1k_8.move_to(col.top(z=0))
        p1k_8.blow_out()
        if dry_run: p1k_8.return_tip()
        else: p1k_8.drop_tip()   
        p1k_8.flow_rate.dispense = DEFAULT_RATE 

    def discard(vol, tips, drop_tip=1):
        for i in range(NUM_COL):  
            p1k_8.pick_up_tip(tips[i])   
            p1k_8.flow_rate.aspirate = SLOW      
            p1k_8.move_to(rxn[i].top(z=0))
            p1k_8.aspirate(vol+20, rxn[i].bottom(z=H_DISCARD).move(Point(x=D_200, y=D_200))) 
            ctx.delay(seconds=2)          
            p1k_8.move_to(rxn[i].top(z=0))
            p1k_8.flow_rate.aspirate = DEFAULT_RATE
            p1k_8.dispense(vol+20, waste.top(z=-5))
            p1k_8.blow_out()
            if drop_tip == 1:            
                if dry_run: p1k_8.return_tip()
                else: p1k_8.drop_tip() 
            else: 
                p1k_8.return_tip()           

    def wash(buffer_wash, run, min, tips):
        hs.open_labware_latch()
        ctx.move_labware(labware = working_plate,
                         new_location = hs_adapter,
                         use_gripper=True
                         )
        hs.close_labware_latch()

        for n in range(run):
            p1k_8.tip_racks = tips_1k
            p1k_8.pick_up_tip()  
            p1k_8.aspirate(VOL_WASH*NUM_COL, buffer_wash[n])
            ctx.delay(seconds=1)
            p1k_8.air_gap(10)
            p1k_8.flow_rate.dispense = 80  
            p1k_8.dispense(10, rxn[0].top(z=0))   
            for j in range(NUM_COL):    
                p1k_8.move_to(rxn[j].top(z=0))                  
                p1k_8.dispense(VOL_WASH-10, rxn[j].top(z=-2).move(Point(x=D_1K, y=D_1K)))
                p1k_8.move_to(rxn[j].top(z=0))
            if dry_run: p1k_8.return_tip()
            else: p1k_8.drop_tip()      
            p1k_8.flow_rate.dispense = DEFAULT_RATE 

            hs.set_and_wait_for_shake_speed(500)
            ctx.delay(minutes=min)
            hs.deactivate_shaker()
           
            p1k_8.flow_rate.aspirate = SLOW 
            
            for k in range(NUM_COL):            
                p1k_8.pick_up_tip(tips[4*(n+1)+k])   
                p1k_8.move_to(rxn[k].top(z=0))
                p1k_8.aspirate(VOL_WASH, rxn[k].bottom(z=0.8).move(Point(x=D_200, y=D_200))) 
                ctx.delay(seconds=2)
                p1k_8.move_to(rxn[k].top(z=0))    
                p1k_8.dispense(VOL_WASH, waste.top(z=-5))
                p1k_8.blow_out()
                if dry_run: p1k_8.return_tip()
                else: p1k_8.drop_tip()

        for i in range(NUM_COL):   
            p1k_8.pick_up_tip(reuse_tip_loc[i])   
            p1k_8.flow_rate.aspirate = SLOW      
            start = rxn[i]
            p1k_8.move_to(start.top(z=0))
            p1k_8.aspirate(VOL_RESIDUAL, start.bottom(z=0.8).move(Point(x=D_200, y=D_200))) 
            ctx.delay(seconds=2)
            p1k_8.move_to(start.top(z=0))
            p1k_8.flow_rate.aspirate = DEFAULT_RATE
            p1k_8.dispense(VOL_RESIDUAL, waste.top(z=-5))
            p1k_8.blow_out()
            p1k_8.return_tip()      
            
            p1k_8.flow_rate.aspirate = DEFAULT_RATE

        hs.open_labware_latch()  
        ctx.move_labware(labware = working_plate,
                         new_location = 'C2',
                         use_gripper=True
                         )
            
    def wash_2(buffer_wash, min, tips):
        p1k_8.tip_racks = tips_1k
        p1k_8.pick_up_tip()  
        p1k_8.aspirate(VOL_WASH*NUM_COL, buffer_wash)
        ctx.delay(seconds=1)
        p1k_8.air_gap(10)
        p1k_8.flow_rate.dispense = 80  
        p1k_8.dispense(10, rxn[0].top(z=0))   
        for j in range(NUM_COL):      
            p1k_8.move_to(rxn[j].top(z=0))                    
            p1k_8.dispense(VOL_WASH, rxn[j].top(z=-2).move(Point(x=D_1K, y=D_1K)))
            p1k_8.move_to(rxn[j].top(z=0))    
        if dry_run: p1k_8.return_tip()
        else: p1k_8.drop_tip()      
        p1k_8.flow_rate.dispense = DEFAULT_RATE 

        hs.set_and_wait_for_shake_speed(500)
        ctx.delay(minutes=min)
        hs.deactivate_shaker()
           
        p1k_8.flow_rate.aspirate = SLOW 
            
        for col_rxn, col_tips in zip(rxn, tips):            
            p1k_8.pick_up_tip(col_tips)   
            p1k_8.move_to(col_rxn.top(z=0))
            p1k_8.aspirate(VOL_WASH, col_rxn.bottom(z=0.8).move(Point(x=D_200, y=D_200))) 
            ctx.delay(seconds=2)
            p1k_8.move_to(col_rxn.top(z=0))    
            p1k_8.dispense(VOL_WASH, waste.top(z=-5))
            p1k_8.blow_out()
            p1k_8.return_tip() 
            
        p1k_8.flow_rate.aspirate = DEFAULT_RATE

    # protocol

    if use_temp == False: 
        ctx.pause('Make sure to reset any tips that were used during the first day. Ensure sufficient PLA Probe Solution is already added to each well of column 1 in the reagent plate.')
    if use_temp == True: 
        ctx.pause('Make sure to reset any tips that were used during the first day. Ensure sufficient reagents are added to corresponding wells of columns 1-5 in the reagent plate on the Temperature Module.')

    if use_temp:
           temp_mod.set_temperature(4)



    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("        Discarding Antibody        ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    discard(VOL_AB, tips_a[0])
    wash(wash_a_1, 2 if not dry_run else 1, MIN_WASH_A if not dry_run else 0.1, tips_a[0])

  

    ctx.comment("                                                  ")
    ctx.comment("**************************************************")
    ctx.comment("  Transferring PLA Probe Solution and Incubating  ")
    ctx.comment("**************************************************")
    ctx.comment("                                                  ")

    transfer(probe, VOL_PROBE)

    if use_lid:
        cover_plate()
    else:
        ctx.pause('Please place seal on plate.')

    if heat_on_deck:
        heat(MIN_PROBE if not dry_run else 0.1)
    else:
        ctx.pause('Incubation at 37 degree C for 1 hour - remove seal and return plate to slot C2')

    if use_lid:
        remove_lid()



    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("      Removing Probe Solution      ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    discard(VOL_PROBE, tips_a[1]) 
    wash(wash_a_2, 2 if not dry_run else 1, MIN_WASH_A if not dry_run else 0.1, tips_a[1])



    ctx.comment("                                                  ")
    ctx.comment("**************************************************")
    ctx.comment("  Transferring Ligation Solution and Incubating   ")
    ctx.comment("**************************************************")
    ctx.comment("                                                  ")

    if use_temp == False: 
        ctx.pause('Please add sufficient Ligation Solution to each well of column 2 in the reagent plate.')
    
    transfer(lig, VOL_LIGATION)

    if use_lid:
        cover_plate()
    else:
        ctx.pause('Please place seal on plate.')

    if heat_on_deck:
        heat(MIN_LIGATION if not dry_run else 0.1)
    else:
        ctx.pause('Incubation at 37 degree C for 30 min - remove seal and return plate to slot C2')

    if use_lid:
        remove_lid()



    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("    Removing Ligation Solution     ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    discard(VOL_LIGATION, tips_a[2])
    wash(wash_a_3, 2 if not dry_run else 1, MIN_WASH_A if not dry_run else 0.1, tips_a[2]) 



    ctx.comment("                                                      ")
    ctx.comment("******************************************************")
    ctx.comment("  Transferring Amplification Solution and Incubating  ")
    ctx.comment("******************************************************")
    ctx.comment("                                                      ")

    if use_temp == False: 
        ctx.pause('Please add sufficient Amplification Solution to each well of column 3 in the reagent plate.')
    
    transfer(amp, VOL_AMP)
    
    if use_lid:
        cover_plate()
    else:
        ctx.pause('Please place seal on plate.')

    if heat_on_deck:
        heat(MIN_AMP if not dry_run else 0.1)
    else:
        ctx.pause('Incubation at 37 degree C for 100 min - remove seal and return plate to slot C2')

    if use_lid:
        remove_lid()



    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment(" Discarding Amplification Solution ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    discard(VOL_AMP, tips_reuse_1, 0)



    ctx.comment("                                                                          ")
    ctx.comment("**************************************************************************")
    ctx.comment(" Performing Final Washes, Adding DAPI, Washing again and Adding Anti-fade ")
    ctx.comment("**************************************************************************")
    ctx.comment("                                                                          ")

    hs.open_labware_latch()
    ctx.move_labware(labware = working_plate,
                     new_location = hs_adapter,
                     use_gripper=True
                     )
    hs.close_labware_latch()

    for x in range(2):
        wash_2(wash_b[x], MIN_WASH_B if not dry_run else 0.1, tips_reuse_1) 

    wash_2(wash_b_2, MIN_WASH_B_2 if not dry_run else 0.1, tips_reuse_2) 

    if use_temp == False: 
        ctx.pause('Please add sufficient DAPI and anti-fade to each well of column 4 and 5 in the reagent plate.')
    
    transfer(dapi, VOL_DAPI)

    hs.set_and_wait_for_shake_speed(500)
    ctx.delay(minutes=MIN_DAPI if not dry_run else 0.1)
    hs.deactivate_shaker()

    discard(VOL_DAPI, tips_reuse_2, 0)

    wash_2(wash_pbs, MIN_WASH_PBS if not dry_run else 0.1, tips_reuse_3) 
    transfer(af, VOL_AF)
    
    hs.open_labware_latch()  
    ctx.move_labware(labware = working_plate,
                     new_location = 'C2',
                     use_gripper=True
                     )

    if use_lid:
        cover_plate()