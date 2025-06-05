def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "NUM_TARGETS", "type": "dropDown", "label": "Number of capture antibodies coated on ELISA plate?", "default": 2, "options": [{"label": "2", "value": 2}, {"label": "3", "value": 3}, {"label": "4", "value": 4}, {"label": "6", "value": 6}]}, {"name": "NUM_SAMPLES", "type": "int", "label": "Number of samples to be assayed (in duplicate)?", "default": 8}, {"name": "PLATE_SEALED", "type": "dropDown", "label": "ELISA plate covered with a pierceable sealing film?", "default": 1, "options": [{"label": "Yes", "value": 1}, {"label": "No", "value": 0}]}, {"name": "TARGET_CAPTURE_ON_DECK", "type": "dropDown", "label": "Target/antibody incubation on deck?", "default": 1, "options": [{"label": "Yes", "value": 1}, {"label": "No", "value": 0}]}, {"name": "TARGET_CAPTURE_COOLING", "type": "dropDown", "label": "Incubation on deck at 4 degree C?", "default": 1, "options": [{"label": "Yes", "value": 1}, {"label": "No", "value": 0}]}]""")
    return [_all_values[n] for n in names]


from opentrons.types import Point

metadata = {
    'protocolName': 'Invitrogen Uncoated ELISA on Flex - Target Capture (up to 6 targets)',
    'author': 'Boren Lin, Opentrons',
    'source': ''
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}

NUM_TARGETS = 6
# options: 6, 4, 3, 2

## if target number 6, sample number max. 8 (standards + unknowns, duplicate)
## if target number 4, sample number max. 12 (standards + unknowns, duplicate)
## if target number 3, sample number max. 16 (standards + unknowns, duplicate)
## if target number 2, sample number max. 24 (atandards + unknowns, duplicate)

NUM_SAMPLES = 8

PLATE_SEALED = 0 # Yes:1; No:0
TARGET_CAPTURE_ON_DECK = 1 # Yes:1; No:0
# if on deck:
TARGET_CAPTURE_COOLING = 0 # Yes:1; No:0

VOL_CAPTURE_AB = 100
VOL_BLOCK = 100
VOL_SAMPLE = 100
VOL_WASH = 150

H = 0.2

BLOCKING_TIME = 1

USE_GRIPPER = True

def run(ctx):

    global NUM_TARGETS
    global NUM_SAMPLES
    global PLATE_SEALED
    global TARGET_CAPTURE_ON_DECK 
    global TARGET_CAPTURE_COOLING

    try:
        [
            NUM_TARGETS,
            NUM_SAMPLES,
            PLATE_SEALED,
            TARGET_CAPTURE_ON_DECK,
            TARGET_CAPTURE_COOLING
        ] = get_values(
            "NUM_TARGETS",
            "NUM_SAMPLES",
            "PLATE_SEALED",
            "TARGET_CAPTURE_ON_DECK",
            "TARGET_CAPTURE_COOLING"
        )
    except NameError:
        # get_values is not defined
        pass

    NUM_TARGETS = int(NUM_TARGETS)
    NUM_SAMPLES = int(NUM_SAMPLES)
    PLATE_SEALED = int(PLATE_SEALED)
    TARGET_CAPTURE_ON_DECK = int(TARGET_CAPTURE_ON_DECK)
    TARGET_CAPTURE_COOLING = int(TARGET_CAPTURE_COOLING)

    if NUM_TARGETS == 6:
        if NUM_SAMPLES > 8: raise Exception('Invalid sample number')
        else: 
            starting_col = [0, 2, 4, 6, 8, 10] 
            starting_well = [0, 16, 32, 48, 64, 80]
    elif NUM_TARGETS == 4:
        if NUM_SAMPLES > 12: raise Exception('Invalid sample number')
        else:
            starting_col = [0, 3, 6, 9]
            starting_well = [0, 24, 48, 72]
    elif NUM_TARGETS == 3:
        if NUM_SAMPLES > 16: raise Exception('Invalid sample number')
        else:
            starting_col = [0, 4, 8]
            starting_well = [0, 32, 64]
    elif NUM_TARGETS == 2:
        if NUM_SAMPLES > 24: raise Exception('Invalid sample number')
        else:
            starting_col = [0, 6]
            starting_well = [0, 48]
    else: raise Exception('Invalid target number')

    global cols
    cols = int(NUM_SAMPLES*2//8)
    if NUM_SAMPLES*2%8 != 0: cols = cols + 1


    # Load Labware, Module and Pipette
    hs = ctx.load_module('heaterShakerModuleV1', 'D1')
    hs_adapter = hs.load_adapter('opentrons_universal_flat_adapter')
    working_plate = hs_adapter.load_labware('corning_96_wellplate_360ul_flat', 'ELISA PLATE')

    sample_tubes = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 'B3', 'SAMPLES') 
    reagent_plate = ctx.load_labware('nest_12_reservoir_15ml', 'C3', 'REAGENTS')
    wash_plate = ctx.load_labware('nest_1_reservoir_290ml', 'C2', 'WASH BUFFER - max. 290 mL')
    waste_res = ctx.load_labware('nest_1_reservoir_290ml', 'C1', 'WASTE - max. 290 mL')

    ctx.load_trash_bin("A3")

    temp = ctx.load_module('temperature module gen2', 'D3')
    temp_adapter = temp.load_adapter('opentrons_aluminum_flat_bottom_plate')

    tips = [ctx.load_labware('opentrons_flex_96_tiprack_200ul', slot)
                              for slot in ['B2', 'A2']]   
    tips_reused = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'D2', 'REUSED TIPS')
    tips_reused_loc = tips_reused.rows()[0][:12]
    m1000 = ctx.load_instrument('flex_8channel_1000', 'left', tip_racks=tips)    
    s1000 = ctx.load_instrument('flex_1channel_1000', 'right', tip_racks=tips) 
    default_rate = 700
    m1000.flow_rate.aspirate = default_rate
    m1000.flow_rate.dispense = default_rate 
    s1000.flow_rate.aspirate = default_rate
    s1000.flow_rate.dispense = default_rate 

    # Locations
    elisa_by_well = working_plate.wells()[:96]
    elisa_by_col = working_plate.rows()[0][:12]
    sample = sample_tubes.wells()[:24]
    block = reagent_plate.wells()[0]  
    wash_buffer = wash_plate.wells()[0]
    waste = waste_res.wells()[0]

    # Liquid Prep 
    start_plate_def = ctx.define_liquid(name="CAPTURE AB", description="Leftover capture antibody solution after plate coating", display_color="#00FFF2")  ## Light Blue
    for x in starting_col:
        for y in range(cols):
            for z in range(8):
                working_plate.rows()[z][x+y].load_liquid(liquid=start_plate_def, volume=VOL_CAPTURE_AB/(NUM_TARGETS*cols*8))

    block_vol_res = (NUM_TARGETS*cols-1)*8*VOL_BLOCK+2000
    block_def = ctx.define_liquid(name="BLOCK", description="Blocking buffer in reagent plate", display_color="#9ACECB")  ## Blue
    reagent_plate.wells()[0].load_liquid(liquid=block_def, volume=block_vol_res)

    sample_vol_stock = VOL_SAMPLE*2+50
    sample_def = ctx.define_liquid(name="SAMPLES", description="Sample per well", display_color="#52AAFF")  ## Blue
    for count in range(NUM_SAMPLES):
        sample_tubes.wells()[count].load_liquid(liquid=sample_def, volume=sample_vol_stock/(NUM_SAMPLES))

    wash_vol_res = 100*(5+1)*VOL_WASH+24000
    wash_def = ctx.define_liquid(name="WASH", description="1X PBST", display_color="#FF0000")  ## Red
    wash_plate.wells()[0].load_liquid(liquid=wash_def, volume=wash_vol_res)    

    
    def transfer(vol, start):
        m1000.pick_up_tip() 
        start_loc = start
        m1000.mix(5, vol*0.75, start_loc.bottom(z=H*5))
        for ii in starting_col:   
            for k in range(cols):
                end_loc = elisa_by_col[ii+k]                
                m1000.aspirate(vol, start_loc.bottom(z=H*5)) 
                m1000.air_gap(20)
                m1000.flow_rate.dispense = 300
                m1000.dispense(vol+20, end_loc.top(z=-5))
                m1000.flow_rate.dispense = default_rate
                m1000.blow_out()
                if PLATE_SEALED == 1: m1000.move_to(end_loc.top(z=2), speed = 2)
        m1000.drop_tip()

    def wash(vol):
        m1000.pick_up_tip()  
        for ii in starting_col:          
            for k in range(cols):
                start_loc = wash_buffer.bottom(z=H).move(Point(x=(ii+k)*9-49.5))
                end_loc = elisa_by_col[ii+k]
                m1000.aspirate(vol, start_loc)
                m1000.air_gap(20)
                m1000.flow_rate.dispense = 300
                m1000.dispense(vol+20, end_loc.top(z=-5))
                m1000.flow_rate.dispense = default_rate
                m1000.blow_out()
                if PLATE_SEALED == 1: m1000.move_to(end_loc.top(z=2), speed = 2)
        m1000.drop_tip()

    def discard(vol):
        tip_count = 0 
        for ii in starting_col:   
            for k in range(cols):            
                m1000.pick_up_tip(tips_reused_loc[tip_count])  
                start_loc = elisa_by_col[ii+k]    
                m1000.flow_rate.aspirate = 100        
                m1000.aspirate(vol*1.1, start_loc.bottom(z=H).move(Point(x=-2.7))) 
                m1000.flow_rate.aspirate = default_rate
                ctx.delay(seconds=2)
                if PLATE_SEALED == 1: m1000.move_to(start_loc.top(z=2), speed = 2)
                m1000.air_gap(20)
                m1000.dispense(vol*1.1+20, waste.top(z=-5))
                m1000.blow_out()
                m1000.return_tip()
                tip_count = tip_count + 1


    #protocol
    hs.open_labware_latch()
    ctx.pause('Load the ELISA Plate on the Heater Shaker')
    hs.close_labware_latch()

    discard(VOL_CAPTURE_AB)

    for _ in range(5):
        wash(VOL_WASH)
        hs.set_and_wait_for_shake_speed(1000)
        ctx.delay(seconds=5)
        hs.deactivate_shaker()
        discard(VOL_WASH)

    ## Blocking
    transfer(VOL_BLOCK, block)
    hs.set_and_wait_for_shake_speed(500)
    ctx.delay(minutes=BLOCKING_TIME*60)
    hs.deactivate_shaker()
    discard(VOL_BLOCK)
    
    wash(VOL_WASH)
    hs.set_and_wait_for_shake_speed(1000)
    ctx.delay(seconds=5)
    hs.deactivate_shaker()
    discard(VOL_WASH)

    ## Sample incubation
    for count in range(NUM_SAMPLES):
        s1000.pick_up_tip() 
        start_loc = sample[count]
        for ii in starting_well:     
            s1000.aspirate(VOL_SAMPLE*2, start_loc)  
            s1000.flow_rate.dispense = 300              
            for duplicate in range(2):
                end_loc = elisa_by_well[count*2+ii+duplicate]
                s1000.dispense(VOL_SAMPLE, end_loc.top(z=-5))
                if PLATE_SEALED == 1: s1000.move_to(end_loc.top(z=2), speed = 2) 
            s1000.flow_rate.dispense = default_rate
        s1000.drop_tip() 

    ## incubation on deck 
    if TARGET_CAPTURE_ON_DECK == 1:
        if TARGET_CAPTURE_COOLING == 1:
            hs.open_labware_latch()
            ctx.move_labware(labware = working_plate,
                            new_location = temp_adapter,
                            use_gripper=USE_GRIPPER
                            ) 
            temp.set_temperature(4)
            ctx.pause('Incubation on Deck')
            temp.deactivate()
        else:            
            hs.set_and_wait_for_shake_speed(500)
            ctx.pause('Incubation on Deck')
            hs.deactivate_shaker()
            hs.open_labware_latch() 

    ## incubation off deck  
    else:
        hs.open_labware_latch()      
        ctx.pause('Incubation off Deck')
   
    ctx.pause('Proceed to Signal Development')
