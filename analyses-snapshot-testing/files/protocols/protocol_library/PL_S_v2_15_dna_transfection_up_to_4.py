def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "TRANSFECTION_TYPE", "type": "dropDown", "label": "Conventional or Reverse Transfection?", "options": [{"label": "Conventional", "value": 1}, {"label": "Reverse", "value": 2}]}, {"name": "PIPET_LOCATION", "type": "dropDown", "label": "P300 pipet on the left or right?", "options": [{"label": "Left", "value": 1}, {"label": "Right", "value": 2}]}, {"name": "plate_type_1", "type": "dropDown", "label": "Type of plate on Slot 11 (Plate #1)", "options": [{"label": "24", "value": 24}, {"label": "6", "value": 6}, {"label": "12", "value": 12}, {"label": "0, if no plate", "value": 0}]}, {"name": "plate_mm_1", "type": "int", "label": "Number of master mixes (up to 6) - Plate #1 ", "default": 6}, {"name": "plate_repl_1", "type": "int", "label": "Number of replicates - Plate #1 ", "default": 4}, {"name": "plate_type_2", "type": "dropDown", "label": "Type of plate on Slot 8 (Plate #2)", "options": [{"label": "24", "value": 24}, {"label": "6", "value": 6}, {"label": "12", "value": 12}, {"label": "0, if no plate", "value": 0}]}, {"name": "plate_mm_2", "type": "int", "label": "Number of master mixes (up to 6) - Plate #2", "default": 6}, {"name": "plate_repl_2", "type": "int", "label": "Number of replicates - Plate #2", "default": 4}, {"name": "plate_type_3", "type": "dropDown", "label": "Type of plate on Slot 5 (Plate #3)", "options": [{"label": "24", "value": 24}, {"label": "6", "value": 6}, {"label": "12", "value": 12}, {"label": "0, if no plate", "value": 0}]}, {"name": "plate_mm_3", "type": "int", "label": "Number of master mixes (up to 6) - Plate #3", "default": 6}, {"name": "plate_repl_3", "type": "int", "label": "Number of replicates - Plate #3 ", "default": 4}, {"name": "plate_type_4", "type": "dropDown", "label": "Type of plate on Slot 2 (Plate #4)", "options": [{"label": "24", "value": 24}, {"label": "6", "value": 6}, {"label": "12", "value": 12}, {"label": "0, if no plate", "value": 0}]}, {"name": "plate_mm_4", "type": "int", "label": "Number of master mixes (up to 6) - Plate #4", "default": 6}, {"name": "plate_repl_4", "type": "int", "label": "Number of replicates - Plate #4 ", "default": 4}]""")
    return [_all_values[n] for n in names]


from opentrons.types import Point

metadata = {
    'protocolName': 'DNA Transfection (up to 4 plates)',
    'author': 'Boren Lin, Opentrons',
    'description': '',
    'apiLevel': '2.15'
}

def run(ctx): 

    PLATE_SLOT = [11, 8, 5, 2]
    TRANSFECTION_TYPE = 1
    # 1: conventional; 2: reverse
    PIPET_LOCATION = 1
    # 1: p300 at left; 2: p300 at right

    
    try:
        [TRANSFECTION_TYPE, PIPET_LOCATION] = get_values("TRANSFECTION_TYPE", "PIPET_LOCATION")
    except NameError:
        # get_values is not defined, so proceed with defaults
        pass 

    plate_type_1 = 24
    plate_mm_1 = 6
    plate_repl_1 = 4
    plate_type_2 = 24
    plate_mm_2 = 6
    plate_repl_2 = 4
    plate_type_3 = 24
    plate_mm_3 = 6
    plate_repl_3 = 4
    plate_type_4 = 24
    plate_mm_4 = 6
    plate_repl_4 = 4
  
    try:
        [   plate_type_1,
            plate_mm_1,
            plate_repl_1,
            plate_type_2,
            plate_mm_2,
            plate_repl_2,
            plate_type_3,
            plate_mm_3,
            plate_repl_3,
            plate_type_4,
            plate_mm_4,
            plate_repl_4
        ] = get_values(
            "plate_type_1",
            "plate_mm_1",
            "plate_repl_1",
            "plate_type_2",
            "plate_mm_2",
            "plate_repl_2",
            "plate_type_3",
            "plate_mm_3",
            "plate_repl_3",
            "plate_type_4",
            "plate_mm_4",
            "plate_repl_4"
        )
    except NameError:
        # get_values is not defined, so proceed with defaults
        pass

    if PIPET_LOCATION == 1: 
        p300_loc = 'left'
        if TRANSFECTION_TYPE == 2:
            p1000_loc ='right'
    elif PIPET_LOCATION == 2: 
        p300_loc = 'right'
        if TRANSFECTION_TYPE == 2:
            p1000_loc ='left'

    PLATE_TYPE_EACH_PLATE = []
    NUM_MASTERMIX_EACH_PLATE = []
    NUM_REPLICATE_EACH_PLATE = []
    for i in range(4):
        PLATE_TYPE_EACH_PLATE.append(int(locals()["plate_type_" + str(i+1)]))
        NUM_MASTERMIX_EACH_PLATE.append(int(locals()["plate_mm_" + str(i+1)]))
        NUM_REPLICATE_EACH_PLATE.append(int(locals()["plate_repl_" + str(i+1)]))
        if PLATE_TYPE_EACH_PLATE[i] == 0:
           NUM_MASTERMIX_EACH_PLATE[i] = 0 
           NUM_REPLICATE_EACH_PLATE[i] = 0
        if NUM_MASTERMIX_EACH_PLATE[i] * NUM_REPLICATE_EACH_PLATE[i] > PLATE_TYPE_EACH_PLATE[i]:
            raise Exception("Invalid mastermix or replicate number")


    mastermix_stock = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 6, 'master mix')
    mastermix = mastermix_stock.rows()[:4][:6]

    tiprack_300 = ctx.load_labware('opentrons_96_filtertiprack_200ul', 9)
    s300 = ctx.load_instrument('p300_single_gen2', p300_loc, tip_racks=[tiprack_300]) 
    if TRANSFECTION_TYPE == 2:
        cell_stock = ctx.load_labware('opentrons_15_tuberack_nest_15ml_conical', 4, 'cell stock')
        tiprack_1000 = ctx.load_labware('opentrons_96_filtertiprack_1000ul', 7)
        s1000 = ctx.load_instrument('p1000_single_gen2', p1000_loc, tip_racks=[tiprack_1000]) 


    ## protocol
    ctx.comment('\n\n\n~~~~~~~~ADD MASTER MIX~~~~~~~~\n')
    for n in range(4):
        if PLATE_TYPE_EACH_PLATE[n] != 0:
            num_well = PLATE_TYPE_EACH_PLATE[n] 
            num_mm = NUM_MASTERMIX_EACH_PLATE[n] 
            num_repl =  NUM_REPLICATE_EACH_PLATE[n] 

            if num_well == 6: 
                labware_def = 'corning_6_wellplate_16.8ml_flat'
                vol_mastermix = 100
                well_diameter = 34.8
 
            elif num_well == 12: 
                labware_def = 'corning_12_wellplate_6.9ml_flat'
                vol_mastermix = 50
                well_diameter = 22.1
                
            elif num_well == 24: 
                labware_def = 'corning_24_wellplate_3.4ml_flat'
                vol_mastermix = 25
                well_diameter = 15.6

            plate = "Plate #" + str(n+1)
            slot = PLATE_SLOT[n]

            working_plate = ctx.load_labware(labware_def, slot, plate)
            working_wells = working_plate.wells()[:num_well]

            if TRANSFECTION_TYPE == 1:
                vol_cell = 2000 * 6 / num_well
                cell_def = ctx.define_liquid(name="CELL CULTURE PLATE "+str(n+1), description="Cells seeded 24h in advance (culture medium per well)", display_color="#FF0000")  ## Red
                for well in range(num_well): working_plate.wells()[well].load_liquid(liquid=cell_def, volume=vol_cell/num_well) 

            for mm in range(num_mm): 
                vol_mm = vol_mastermix * num_repl
                mm_def = ctx.define_liquid(name="MASTER MIX "+str(mm+1)+" PLATE "+str(n+1), description="DNA and transfection reagent mixture", display_color="#704848")  ## Brown
                mastermix_stock.rows()[n][mm].load_liquid(liquid=mm_def, volume=vol_mm)   

            start_well = 0
            for i in range(num_mm):
                end_well = start_well + num_repl
                s300.pick_up_tip()
                start = mastermix[n][i]
                s300.mix(5, vol_mastermix, start.bottom(z=1), rate = 2)
                s300.mix(5, vol_mastermix, start.bottom(z=3), rate = 2) 
                for j in range(start_well, end_well):                      
                    end = working_wells[j]  
                    s300.aspirate(vol_mastermix, start.bottom(z=1), rate = 2) 
                    s300.air_gap(20)  
                    s300.dispense(20, end.top(z=2), rate = 2)  
                    if vol_mastermix/5 < 20:
                        s300.dispense(vol_mastermix, end.top(z=-14), rate = 0.5)  
                    else: 
                        s300.dispense(vol_mastermix/5, end.top(z=-14), rate = 0.5)   
                        s300.default_speed = 150  
                        for xx in [-0.25, 0.25]:
                            for yy in [-0.25, 0.25]:
                                drop_loc = end.top(z=-14).move(Point(x=well_diameter*xx, y=well_diameter*yy))          
                                s300.dispense(vol_mastermix/5, drop_loc, rate = 0.5) 
                        s300.default_speed = 400 
                s300.drop_tip()
                start_well = start_well + num_repl  

    

    ctx.comment('\n\n\n~~~~~~~~ADD CELLS~~~~~~~~\n') 
    if TRANSFECTION_TYPE == 2:
        del ctx.deck[2]
        del ctx.deck[5]
        del ctx.deck[8]
        del ctx.deck[11]
        for n in range(4):
            if PLATE_TYPE_EACH_PLATE[n] != 0:
                num_well = PLATE_TYPE_EACH_PLATE[n] 
                num_mm = NUM_MASTERMIX_EACH_PLATE[n] 
                num_repl =  NUM_REPLICATE_EACH_PLATE[n] 

                if num_well == 6: 
                    labware_def = 'corning_6_wellplate_16.8ml_flat'
                    vol_cell_factor = 4
    
                elif num_well == 12: 
                    labware_def = 'corning_12_wellplate_6.9ml_flat'
                    vol_cell_factor = 2
                    
                elif num_well == 24: 
                    labware_def = 'corning_24_wellplate_3.4ml_flat'
                    vol_cell_factor = 1

                plate = "Plate #" + str(n+1)
                slot = PLATE_SLOT[n]

                working_plate = ctx.load_labware(labware_def, slot, plate)
                working_wells = working_plate.wells()[:num_well]

                cells_source = cell_stock.wells()[n]

                vol_cell_source = (num_mm*num_repl+1)*500*vol_cell_factor
                cell_source_def = ctx.define_liquid(name="CELL SUSPENSION "+str(n+1), description="Cells in culture medium",  display_color="#00FFF2")  ## Light Blue
                cell_stock.wells()[n].load_liquid(liquid=cell_source_def, volume=vol_cell_source) 

                s1000.pick_up_tip() 
                start = cells_source
                h_high = vol_cell_source/200
                if vol_cell_source > 5000: h_low = vol_cell_source/200 - 20
                else: h_low = 5
                s1000.mix(3, 750, start.bottom(z=h_low), rate = 2)
                s1000.mix(3, 750, start.bottom(z=h_high), rate = 2)
                s1000.mix(3, 750, start.bottom(z=h_low), rate = 2)  

                vol_count = 0      
                for _ in range(vol_cell_factor):
                    for j in range(num_mm*num_repl):
                        end = working_wells[j]
                        if vol_cell_source <= 6000: h = 1
                        elif vol_cell_source > 6000 and vol_cell_source - vol_count > 6000: h = 45
                        elif vol_cell_source > 6000 and vol_cell_source - vol_count <= 6000: h = 1
                        s1000.aspirate(500, start.bottom(z=h), rate = 2)
                        s1000.air_gap(50)
                        s1000.dispense(500+50, end.top(z=-10), rate = 2)
                        s1000.blow_out(end.top(z=-2)) 
                        vol_count = 500 + vol_count
                s1000.drop_tip()


    

    