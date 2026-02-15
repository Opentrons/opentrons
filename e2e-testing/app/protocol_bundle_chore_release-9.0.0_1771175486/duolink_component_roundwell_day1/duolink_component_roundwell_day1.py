from opentrons.types import Point

metadata = {
    'protocolName': 'Duolink PLA for Microscopy (Component Testing Assay with 96 Round Well Culture Plate) - Day 1',
    'author': 'Opentrons Science Team'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}

########################

NUM_COL = 4

VOL_BLOCK = 40
VOL_AB = 40

MIN_BLOCK = 60

H_DISCARD = 0.7 
D_1K = -2.3
D_200 = -2.1

DEFAULT_RATE = 700
SLOW = 100

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


def run(ctx):

    dry_run = ctx.params.dry_run
    heat_on_deck = ctx.params.heat_on_deck
    use_lid = ctx.params.use_lid


    # deck layout
    if heat_on_deck:
        hs = ctx.load_module('heaterShakerModuleV1', 'D1')
        hs_adapter = hs.load_adapter('opentrons_universal_flat_adapter')

    working_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 'C2', 'ASSAY PLATE') 

    reagent_plate = ctx.load_labware('nest_96_wellplate_2ml_deep', 'C1', 'REAGENTS')
    waste_res = ctx.load_labware('nest_1_reservoir_290ml', 'D2', 'LIQUID WASTE')
    waste = waste_res.wells()[0]
    
    ctx.load_trash_bin('D3')

    tips_1k = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B3', '1000uL TIPS')
    tips_200 = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'B2', '200uL TIPS')

    p1k_8 = ctx.load_instrument('flex_8channel_1000', 'left') 
    p1k_1 = ctx.load_instrument('flex_1channel_1000', 'right')  
    
    p1k_8.flow_rate.aspirate = DEFAULT_RATE
    p1k_8.flow_rate.dispense = DEFAULT_RATE 
    p1k_1.flow_rate.aspirate = DEFAULT_RATE
    p1k_1.flow_rate.dispense = DEFAULT_RATE 

    # liquid location  
    rxn = working_plate.rows()[0][:NUM_COL]
    rxn_well = working_plate.wells()[:NUM_COL*8]
    ab = reagent_plate.wells()[:4]
    block = reagent_plate.rows()[0][1]

    # volume info 
    vol_to_be_transfer_ab = 40 * 8 + 40 
    vol_to_be_transfer_re = 40 * 4 + 40 

    def_ab_1 = ctx.define_liquid(name="ANTIBODY SOLUTION 1", description="", display_color="#98FB98")  ## green
    reagent_plate.wells()[0].load_liquid(liquid=def_ab_1, volume=vol_to_be_transfer_ab) 
    def_ab_2 = ctx.define_liquid(name="ANTIBODY SOLUTION 2", description="", display_color="#98FB98")  ## green
    reagent_plate.wells()[1].load_liquid(liquid=def_ab_2, volume=vol_to_be_transfer_ab) 
    def_ab_3 = ctx.define_liquid(name="ANTIBODY SOLUTION 3", description="", display_color="#98FB98")  ## green
    reagent_plate.wells()[2].load_liquid(liquid=def_ab_3, volume=vol_to_be_transfer_ab) 
    def_ab_4 = ctx.define_liquid(name="ANTIBODY SOLUTION 4", description="", display_color="#98FB98")  ## green
    reagent_plate.wells()[3].load_liquid(liquid=def_ab_4, volume=vol_to_be_transfer_ab) 

    def_block = ctx.define_liquid(name="BLOCKING SOLUTION", description="40uL*4 + 40uL per well", display_color="#FFC200")  ## yellow
    [reagent_plate.rows()[row][1].load_liquid(liquid=def_block, volume=vol_to_be_transfer_re) 
          for row in range(8)]



    if use_lid:

        ctx.load_lid_stack("corning_96_wellplate_360ul_lid", 'C4', 1)

        def cover_plate():
            ctx.move_lid('C4',
                         working_plate,
                         use_gripper=True,
                         pick_up_offset={'x':0, 'y':0, 'z':1},
                         drop_offset={'x':0,'y':0,'z':0}
                         )
      
        def remove_lid():
            ctx.move_lid(working_plate,
                         'C4',
                         use_gripper=True,
                         pick_up_offset={'x':0, 'y':0, 'z':0},
                         drop_offset={'x':0,'y':0,'z':0}
                         )
        
    def heat(min):
        hs.set_and_wait_for_temperature(37)
        hs.open_labware_latch()
        ctx.move_labware(labware = working_plate,
                        new_location = hs_adapter,
                        use_gripper=True,
                        pick_up_offset={'x':0, 'y':0, 'z':-7},
                        drop_offset={'x':0,'y':0,'z':-7} 
                        )

        hs.close_labware_latch()
        hs.open_labware_latch()

        ctx.delay(minutes=min)

        ctx.move_labware(labware = working_plate,
                        new_location = 'C2',
                        use_gripper=True,
                        pick_up_offset={'x':0, 'y':0, 'z':-7},
                        drop_offset={'x':0,'y':0,'z':-7}
                        )
        hs.deactivate_heater()

    def transfer(start, vol):
        p1k_8.tip_racks = [tips_1k]
        p1k_8.pick_up_tip()     
        p1k_8.aspirate(vol*NUM_COL, start)
        p1k_8.air_gap(10)
        p1k_8.dispense(10, rxn[0].top(z=0))
        p1k_8.flow_rate.dispense = SLOW  
        for col in rxn:  
            p1k_8.move_to(col.top(z=0))
            p1k_8.dispense(vol, col.top(z=-3).move(Point(x=D_1K, y=D_1K)))
            p1k_8.move_to(col.top(z=0))
        p1k_8.blow_out()
        if dry_run: p1k_8.return_tip()
        else: p1k_8.drop_tip()   
        p1k_8.flow_rate.dispense = DEFAULT_RATE 

    def discard(vol):
        for col in rxn:    
            p1k_8.tip_racks = [tips_200]        
            p1k_8.pick_up_tip()   
            p1k_8.flow_rate.aspirate = SLOW      
            p1k_8.move_to(col.top(z=0))
            p1k_8.aspirate(vol+20, col.bottom(z=H_DISCARD).move(Point(x=D_200, y=D_200))) 
            ctx.delay(seconds=2)          
            p1k_8.move_to(col.top(z=0))
            p1k_8.flow_rate.aspirate = DEFAULT_RATE
            p1k_8.dispense(vol+20, waste.top(z=-5))
            p1k_8.blow_out()
            if dry_run: p1k_8.return_tip()
            else: p1k_8.drop_tip() 


    # protocol

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("  Transferring Blocking Solution   ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    transfer(block, VOL_BLOCK)



    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("  Incubating on the Heater-Shaker  ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    if use_lid:
        cover_plate()
    else:
        ctx.pause('Please place seal on plate.')

    if heat_on_deck:
        heat(MIN_BLOCK if not dry_run else 0.1)
    else:
        ctx.pause('Incubation at 37 degree C for 1 hour - remove seal and return plate to slot C2')

    if use_lid:
        remove_lid()



    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("    Removing Blocking Solution     ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    discard(VOL_BLOCK)



    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("  Transferring Primary Antibody    ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    for ab_count in range(NUM_COL):
        p1k_1.tip_racks = [tips_1k]
        p1k_1.pick_up_tip()
        p1k_1.mix(3 if not dry_run else 1, VOL_AB*8*0.5, ab[ab_count])
        p1k_1.aspirate(VOL_AB*8, ab[ab_count])
        p1k_1.air_gap(10)
        p1k_1.dispense(10, rxn_well[ab_count*8].top(z=0))
        p1k_1.flow_rate.dispense = SLOW 
        for well_count in range(8):  
            end = rxn_well[ab_count*8+well_count]
            p1k_1.move_to(end.top(z=0))
            p1k_1.dispense(VOL_AB, end.top(z=-3).move(Point(x=D_1K, y=D_1K)))
            p1k_1.move_to(end.top(z=0))
        p1k_1.blow_out()
        if dry_run: p1k_1.return_tip()
        else: p1k_1.drop_tip()      
        p1k_1.flow_rate.dispense = DEFAULT_RATE 

    if use_lid:
        cover_plate()
        ctx.pause('Incubate at 4 degree C overnight')
    else:
        ctx.pause('Please place seal on plate and incubate at 4 degree C overnight')
    