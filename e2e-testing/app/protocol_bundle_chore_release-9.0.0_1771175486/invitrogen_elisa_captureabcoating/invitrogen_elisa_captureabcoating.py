def get_values(*names):
    import json
    _all_values = json.loads("""{"NUM_TARGETS": 2, "NUM_SAMPLES": 8, "PLATE_SEALED": 1, "PLATE_COATING_ON_DECK": 1}""")
    return [_all_values[n] for n in names]


from opentrons.types import Point

metadata = {
    'protocolName': 'Invitrogen Uncoated ELISA on Flex - Capture Ab Coating (up to 6 targets)',
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
PLATE_COATING_ON_DECK = 1 # Yes:1; No:0
# if on deck:

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
    global PLATE_COATING_ON_DECK 

    try:
        [
            NUM_TARGETS,
            NUM_SAMPLES,
            PLATE_SEALED,
            PLATE_COATING_ON_DECK,
        ] = get_values(
            "NUM_TARGETS",
            "NUM_SAMPLES",
            "PLATE_SEALED",
            "PLATE_COATING_ON_DECK",
        )
    except NameError:
        # get_values is not defined
        pass

    NUM_TARGETS = int(NUM_TARGETS)
    NUM_SAMPLES = int(NUM_SAMPLES)
    PLATE_SEALED = int(PLATE_SEALED)
    PLATE_COATING_ON_DECK = int(PLATE_COATING_ON_DECK)

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

    capture_ab_stock = ctx.load_labware('nest_12_reservoir_15ml', 'C3', 'CAPTURE AB')  
    ctx.load_trash_bin("A3")

    temp = ctx.load_module('temperature module gen2', 'D3')
    temp_adapter = temp.load_adapter('opentrons_aluminum_flat_bottom_plate')

    tips = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'A2')   
    m1000 = ctx.load_instrument('flex_8channel_1000', 'left', tip_racks=[tips])
    default_rate = 700
    m1000.flow_rate.aspirate = default_rate
    m1000.flow_rate.dispense = default_rate 

    # Locations
    elisa = working_plate.rows()[0][:12]
    capture_ab = capture_ab_stock.wells()[:NUM_TARGETS]

    # Liquid Prep 
    capture_ab_vol_res = (cols-1)*8*VOL_CAPTURE_AB+2000
    capture_ab_def = ctx.define_liquid(name="CAPTURE AB", description="Capture antibody solution per well", display_color="#00FFF2")  ## Light Blue
    for x in range(NUM_TARGETS):
        capture_ab_stock.wells()[x].load_liquid(liquid=capture_ab_def, volume=capture_ab_vol_res/NUM_TARGETS)
            

    #protocol
    hs.open_labware_latch()
    ctx.pause('Seal the ELISA Plate with Slit Seal')
    ctx.pause('Move the ELISA Plate to the Heater Shaker')
    hs.close_labware_latch()

    ## Capture antibody coating
    for i, ii in enumerate(starting_col):
        m1000.pick_up_tip()  
        for k in range(cols):
            start_loc = capture_ab[i]
            end_loc = elisa[ii+k]                
            if k == 0: m1000.mix(5, VOL_CAPTURE_AB*0.75, start_loc.bottom(z=H*5))
            m1000.aspirate(VOL_CAPTURE_AB, start_loc.bottom(z=H*5)) 
            m1000.air_gap(20)
            m1000.dispense(VOL_CAPTURE_AB+20, end_loc.top(z=-5))
            m1000.blow_out()
            if PLATE_SEALED == 1: m1000.move_to(end_loc.top(z=2), speed = 2)
        m1000.drop_tip()

    ## incubation on deck 
    if PLATE_COATING_ON_DECK == 1:
        hs.open_labware_latch()
        ctx.move_labware(labware = working_plate,
                         new_location = temp_adapter,
                         use_gripper=USE_GRIPPER
                        )
        temp.set_temperature(4)
        ctx.pause('Incubation on Deck')
        temp.deactivate()

    ## incubation off deck  
    else:
        hs.open_labware_latch()      
        ctx.pause('Incubation off Deck')
    
    ctx.pause('Proceed to Target Capture')

 