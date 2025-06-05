def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "PIPET_LOCATION", "type": "dropDown", "label": "P1000 pipet on the left or right?", "options": [{"label": "Right", "value": 1}, {"label": "Left", "value": 2}]}, {"name": "plate_type_1", "type": "dropDown", "label": "Type of plate on Slot 11", "options": [{"label": "24", "value": 24}, {"label": "6", "value": 6}, {"label": "12", "value": 12}, {"label": "0, if no plate", "value": 0}]}, {"name": "plate_type_2", "type": "dropDown", "label": "Type of plate on Slot 8", "options": [{"label": "24", "value": 24}, {"label": "6", "value": 6}, {"label": "12", "value": 12}, {"label": "0, if no plate", "value": 0}]}, {"name": "plate_type_3", "type": "dropDown", "label": "Type of plate on Slot 5", "options": [{"label": "24", "value": 24}, {"label": "6", "value": 6}, {"label": "12", "value": 12}, {"label": "0, if no plate", "value": 0}]}, {"name": "plate_type_4", "type": "dropDown", "label": "Type of plate on Slot 2", "options": [{"label": "24", "value": 24}, {"label": "6", "value": 6}, {"label": "12", "value": 12}, {"label": "0, if no plate", "value": 0}]}]""")
    return [_all_values[n] for n in names]


metadata = {
    'protocolName': 'Cell Culture Preparation (up to 4 plates)',
    'author': 'Boren Lin, Opentrons',
    'description': '',
    'apiLevel': '2.15'
}

def run(ctx): 

    PLATE_SLOT = [11, 8, 5, 2]

    PIPET_LOCATION = 1
    # 1: p1000 at right; 2: p1000 at left
    if PIPET_LOCATION == 1: 
        p1000_loc = 'right'
    elif PIPET_LOCATION == 2: 
        p1000_loc = 'left'

    plate_type_1 = 24
    plate_type_2 = 24
    plate_type_3 = 24
    plate_type_4 = 24  

    try:
        [PIPET_LOCATION, 
         plate_type_1, 
         plate_type_2, 
         plate_type_3, 
         plate_type_4
        ] = get_values(
         "PIPET_LOCATION", 
         "plate_type_1", 
         "plate_type_2", 
         "plate_type_3", 
         "plate_type_4"
        )
    except NameError:
        # get_values is not defined, so proceed with defaults
        pass 

    PLATE_TYPE_EACH_PLATE = []
    for i in range(4):
        PLATE_TYPE_EACH_PLATE.append(int(locals()["plate_type_" + str(i+1)]))

    cell_stock = ctx.load_labware('opentrons_15_tuberack_nest_15ml_conical', 4, 'cell stock')
    tiprack_1000 = ctx.load_labware('opentrons_96_filtertiprack_1000ul', 7)
    s1000 = ctx.load_instrument('p1000_single_gen2', p1000_loc, tip_racks=[tiprack_1000]) 

    ## protocol
    ctx.comment('\n\n\n~~~~~~~~ADD CELLS~~~~~~~~\n') 
    for n in range(4):
        if PLATE_TYPE_EACH_PLATE[n] != 0:
            num_well = PLATE_TYPE_EACH_PLATE[n] 

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

            vol_cell_source = (num_well+1)*500*vol_cell_factor
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
                for j in range(num_well):
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


    