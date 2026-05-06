metadata = {
    'protocolName': 'Takara In-Fusion Snap Assembly Kit - 5 μL and 10 μL Reaction in 96-well plate',
    'author': 'Boren Lin, Opentrons',
    'source': ''
}

requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.16",
}

def run(ctx):

    # load labware and pipette
    tips = [ctx.load_labware('opentrons_96_filtertiprack_20ul', slot, '20uL Tips')
               for slot in [7, 8]]
    m20 = ctx.load_instrument('p20_multi_gen2', 'left', tip_racks=tips)
    
    reagent_plate = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 5, 'SOURCE PLATE')
    working_plate = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 4, 'DESTINATION PLATE')

    # liquid
    vol_mastermix = [9,4]

    # master mix in col 0 and 6
    # insert in col 1 and 7
    # water in col 2 and 8

    reagent_vol = [63, 28, 10, 10, 10, 10]

    reagent_def = ['PRE-MIXED-MM_FOR 10 UL REACTION', 
                   'PRE-MIXED-MM_FOR 10 UL REACTION',
                   'FRAGMENT_10', 
                   'FRAGMENT_5',
                   'WATER_10', 
                   'WATER_5'
                   ]
    reagent_descrip = ['pre-mixed master mix for a 10 μL reaction volume (per well)', 
                       'pre-mixed master mix for a 5 μL reaction volume (per well)',
                       'insert fragment for a 10 μL reaction volume (per well)', 
                       'insert fragment for a 5 μL reaction volume (per well)',
                       'water for a 10 μL reaction volume (per well)', 
                       'water for a 5 μL reaction volume (per well)'
                       ]
    reagent_color = ['#800080', '#FFA500','#FF00FF', '#008000','#00008b', '#0000FF']
    reagent_loc = [0, 6, 1, 7, 2, 8]
    for i, loc in enumerate(reagent_loc):
        col_vol = reagent_vol[i]
        col_def = ctx.define_liquid(name=reagent_def[i], 
                                    description=reagent_descrip[i], 
                                    display_color=reagent_color[i],
                                    ) 
        for z in range(8):
            reagent_plate.rows()[z][loc].load_liquid(liquid=col_def, volume=col_vol/8)
 

    reagent = reagent_plate.rows()[0][:12]
    reaction = working_plate.rows()[0][:12]
    col_insert = [0,1,3,4,5]
    col_water = 2
          
    # perform
    for i, vol_mm in enumerate(vol_mastermix):

        ## Add Master Mix       
        m20.pick_up_tip()
        for m in range(6):
            start = reagent[i*6]
            if m == 0: m20.mix(2, vol_mm+3, start)
            m20.aspirate(vol_mm, start)
            m20.aspirate(1, start.top(z=2))
            end = reaction[i*6+m]
            m20.dispense(1, end.top(z=2))
            m20.dispense(vol_mm, end.bottom(z=0.5))
            ctx.delay(seconds=2)
            m20.blow_out(end.top(z=2))
        m20.drop_tip()


        ## Add Insert
        for j in col_insert:
            m20.pick_up_tip()
            start = reagent[i*6+1]
            end = reaction[i*6+j]
            m20.flow_rate.aspirate = 2
            m20.flow_rate.dispense = 2 
            m20.aspirate(1, start)
            m20.dispense(1, end)
            m20.aspirate(vol_mm*0.75, end)      
            m20.dispense(vol_mm*0.75, end)     
            ctx.delay(seconds=2)
            m20.blow_out()
            m20.drop_tip()

        ## Add Water
        m20.pick_up_tip()
        start = reagent[i*6+2]
        end = reaction[i*6+col_water]
        m20.flow_rate.aspirate = 2
        m20.flow_rate.dispense = 2 
        m20.aspirate(1, start)
        m20.dispense(1, end)
        m20.aspirate(vol_mm*0.75, end)      
        m20.dispense(vol_mm*0.75, end)       
        ctx.delay(seconds=2)
        m20.blow_out()
        m20.drop_tip()
