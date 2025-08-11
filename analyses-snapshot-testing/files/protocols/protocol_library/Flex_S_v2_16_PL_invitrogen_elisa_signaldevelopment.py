def get_values(*names):
    import json
    _all_values = json.loads("""{"NUM_TARGETS": 2, "NUM_SAMPLES": 8, "PLATE_SEALED": 1}""")
    return [_all_values[n] for n in names]


from opentrons.types import Point

metadata = {
    'protocolName': 'Invitrogen Uncoated ELISA on Flex - Signal Development (up to 6 targets)',
    'author': 'Boren Lin, Opentrons',
    'source': ''
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}

NUM_TARGETS = 6
# options: 6, 4, 3, 2

## target number 6, sample number max. 8 (standards + unknowns, duplicate)
## target number 4, sample number max. 12 (standards + unknowns, duplicate)
## target number 3, sample number max. 16 (standards + unknowns, duplicate)
## target number 2, sample number max. 24 (atandards + unknowns, duplicate)

NUM_SAMPLES = 8

PLATE_SEALED = 0 # Yes:1; No:0

VOL_SAMPLE = 100
VOL_DETECTION_AB = 100
VOL_HRP = 100
VOL_WASH = 150
VOL_SUBSTRATE = 100
VOL_STOP = 100

H = 0.2

DETECTION_TIME = 1
HRP_TIME = 0.5

USE_GRIPPER = True

def run(ctx):

    global NUM_TARGETS
    global NUM_SAMPLES
    global PLATE_SEALED

    try:
        [
            NUM_TARGETS,
            NUM_SAMPLES,
            PLATE_SEALED,
        ] = get_values(
            "NUM_TARGETS",
            "NUM_SAMPLES",
            "PLATE_SEALED",
        )
    except NameError:
        # get_values is not defined
        pass

    NUM_TARGETS = int(NUM_TARGETS)
    NUM_SAMPLES = int(NUM_SAMPLES)
    PLATE_SEALED = int(PLATE_SEALED)

    if NUM_TARGETS == 6:
        if NUM_SAMPLES > 8: raise Exception('Invalid sample number')
        else: 
            starting_col = [0, 2, 4, 6, 8, 10] 
    elif NUM_TARGETS == 4:
        if NUM_SAMPLES > 12: raise Exception('Invalid sample number')
        else:
            starting_col = [0, 3, 6, 9]
    elif NUM_TARGETS == 3:
        if NUM_SAMPLES > 16: raise Exception('Invalid sample number')
        else:
            starting_col = [0, 4, 8]
    elif NUM_TARGETS == 2:
        if NUM_SAMPLES > 24: raise Exception('Invalid sample number')
        else:
            starting_col = [0, 6]
    else: raise Exception('Invalid target number')

    global cols
    cols = int(NUM_SAMPLES*2//8)
    if NUM_SAMPLES*2%8 != 0: cols = cols + 1


    # Load Labware, Module and Pipette
    hs = ctx.load_module('heaterShakerModuleV1', 'D1')
    hs_adapter = hs.load_adapter('opentrons_universal_flat_adapter')
    working_plate = hs_adapter.load_labware('corning_96_wellplate_360ul_flat', 'ELISA PLATE')

    detection_ab_stock = ctx.load_labware('nest_12_reservoir_15ml', 'C3', 'DETECTION AB')   
    reagent_plate = ctx.load_labware('nest_12_reservoir_15ml', 'B3', 'ENZYME, SUBSTRATE, STOP')
    wash_plate = ctx.load_labware('nest_1_reservoir_290ml', 'C2', 'WASH BUFFER  - max. 290 mL')
    waste_res = ctx.load_labware('nest_1_reservoir_290ml', 'C1', 'WASTE - max. 290 mL')

    ctx.load_trash_bin("A3")

    tips = [ctx.load_labware('opentrons_flex_96_tiprack_200ul', slot)
                              for slot in ['B2', 'A2']]   
    tips_reused = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'D2', 'REUSED TIPS')
    tips_reused_loc = tips_reused.rows()[0][:12]
    m1000 = ctx.load_instrument('flex_8channel_1000', 'left', tip_racks=tips)    
    default_rate = 700
    m1000.flow_rate.aspirate = default_rate
    m1000.flow_rate.dispense = default_rate 

    # Locations
    elisa = working_plate.rows()[0][:12]
    detection_ab = detection_ab_stock.wells()[:NUM_TARGETS]
    hrp = reagent_plate.wells()[0] 
    substrate = reagent_plate.wells()[1] 
    stop = reagent_plate.wells()[2] 
    wash_buffer = wash_plate.wells()[0]
    waste = waste_res.wells()[0]

    # Liquid Prep 
    start_plate_def = ctx.define_liquid(name="SAMPLES", description="Leftover sample solution after target capture", display_color="#52AAFF")  ## Blue
    for x in starting_col:
        for y in range(cols):
            for z in range(8):
                working_plate.rows()[z][x+y].load_liquid(liquid=start_plate_def, volume=VOL_SAMPLE/(NUM_TARGETS*cols*8))

    detection_ab_vol_res = (cols-1)*8*VOL_DETECTION_AB+2000
    detection_ab_def = ctx.define_liquid(name="DETECTION AB", description="Detection antibody solution per well", display_color="#00FFF2")  ## Light Blue
    for x in range(NUM_TARGETS):
        detection_ab_stock.wells()[x].load_liquid(liquid=detection_ab_def, volume=detection_ab_vol_res/NUM_TARGETS)

    reagent_vol = [VOL_HRP, VOL_SUBSTRATE, VOL_STOP]
    reagent_name = ['HRP', 'SUBSTRATE', 'STOP']
    reagent_description = ['HRP enzyme solution', 'TMB substrate solution', 'Stop solution']
    color_code = ['#8B8000', '#FF8C00', '#00A36C'] ## Yellow, Orange, Green
    for reagent in range(3):
        reagent_vol_res = (NUM_TARGETS*cols-1)*8*reagent_vol[reagent]+2000
        reagent_def = ctx.define_liquid(name=reagent_name[reagent], 
                                        description=reagent_description[reagent], 
                                        display_color=color_code[reagent]
                                        )
        reagent_plate.wells()[reagent].load_liquid(liquid=reagent_def, volume=reagent_vol_res)

    wash_vol_res = 100*(5+5+5)*VOL_WASH+24000
    wash_def = ctx.define_liquid(name="WASH", description="1X PBST", display_color="#FF0000")  ## Red
    wash_plate.wells()[0].load_liquid(liquid=wash_def, volume=wash_vol_res)    


    def transfer(vol, start):
        m1000.pick_up_tip() 
        start_loc = start
        m1000.mix(5, vol*0.75, start_loc.bottom(z=H*5))
        for ii in starting_col:   
            for k in range(cols):
                end_loc = elisa[ii+k]                
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
                end_loc = elisa[ii+k]
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
                start_loc = elisa[ii+k]    
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

    discard(VOL_SAMPLE)

    for _ in range(5):
        wash(VOL_WASH)
        hs.set_and_wait_for_shake_speed(1000)
        ctx.delay(seconds=5)
        hs.deactivate_shaker()
        discard(VOL_WASH)
    
    ## Detection antibody binding
    for i, ii in enumerate(starting_col):
        m1000.pick_up_tip()  
        for k in range(cols):
            start_loc = detection_ab[i]
            end_loc = elisa[ii+k]                
            if k == 0: m1000.mix(5, VOL_DETECTION_AB*0.75, start_loc.bottom(z=H*5))
            m1000.aspirate(VOL_DETECTION_AB, start_loc.bottom(z=H*5)) 
            m1000.air_gap(20)
            m1000.dispense(VOL_DETECTION_AB+20, end_loc.top(z=-5))
            m1000.blow_out()
            if PLATE_SEALED == 1: m1000.move_to(end_loc.top(z=2), speed = 2)
        m1000.drop_tip()

    hs.set_and_wait_for_shake_speed(500)
    ctx.delay(minutes=DETECTION_TIME*60)
    hs.deactivate_shaker()
    discard(VOL_DETECTION_AB)

    for _ in range(5):
        wash(VOL_WASH)
        hs.set_and_wait_for_shake_speed(1000)
        ctx.delay(seconds=5)
        hs.deactivate_shaker()
        discard(VOL_WASH)  

    ## HRP binding
    transfer(VOL_HRP, hrp)
    hs.set_and_wait_for_shake_speed(500)
    ctx.delay(minutes=HRP_TIME*60)
    hs.deactivate_shaker()
    discard(VOL_HRP)

    for _ in range(5):
        wash(VOL_WASH)
        hs.set_and_wait_for_shake_speed(1000)
        ctx.delay(seconds=5)
        hs.deactivate_shaker()
        discard(VOL_WASH)     
    
    ## Signal development
    ctx.pause('Add substrate solution into the reagent reservoir')
    transfer(VOL_SUBSTRATE, substrate)
    hs.set_and_wait_for_shake_speed(500)
    ctx.delay(minutes=15)
    hs.deactivate_shaker()

    m1000.pick_up_tip()  
    start_loc = stop
    for ii in starting_col:   
        for k in range(cols):
            end_loc = elisa[ii+k]                
            m1000.aspirate(VOL_STOP, start_loc.bottom(z=H*5)) 
            m1000.air_gap(20)
            m1000.dispense(20, end_loc.top(z=2))
            m1000.dispense(VOL_STOP, end_loc.top(z=-2))
            m1000.blow_out()
            if PLATE_SEALED == 1: m1000.move_to(end_loc.top(z=2), speed = 2)
    m1000.drop_tip()   
    hs.open_labware_latch()
    ctx.pause('Move the ELISA Plate to the Reader')