from opentrons import types

metadata = {
    'protocolName': 'His-tagged Protein Purification by PureProteome Nickel Magnetic Beads',
    'author': 'Science Team, Opentrons'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.25",
}

########################


def add_parameters(parameters):
    parameters.add_bool(variable_name="dry_run",
                        display_name="Dry Run",
                        description=("Tips returned to tipracks"),
                        default=False
                        )
    
    parameters.add_int(variable_name="num_sample",
                       display_name="Number of Samples",
                       description="Number of samples to be processed (8 samples per column)",
                       default=96,
                       maximum=96,
                       minimum=1
                       )
    
    parameters.add_bool(variable_name="pause_centri",
                        display_name="Pause for Centrifuge",
                        description=("After adding elution buffer, centrifuge the plate if bubble formation is expected"),
                        default=False
                        ) 
    
    parameters.add_int(variable_name="mag_type",
                       display_name="Magnet Type",
                       description="Which magnet is used?",
                       default=2,
                       choices=[
                               {"display_name": "Millipore 24 Ball Magnet", "value": 1},
                               {"display_name": "Opentrons Magblock v1", "value": 2}
                              ]
                       )

    parameters.add_int(variable_name="pipet_loc",
                       display_name="P1000-8ch Position",
                       description="How the P1000 8-ch pipette is mounted?",
                       default=1,
                       choices=[
                               {"display_name": "on the left", "value": 1},
                               {"display_name": "on the right", "value": 2}
                              ]
                       )
    
VOL_SAMPLE = 20
VOL_BEAD_LYSIS = 100
VOL_WASH = 100 
VOL_ELU = 16 

INCUBATION_SPEED = 1200
MIX_SPEED = 1200

USE_GRIPPER = True

SPEED_DEFAULT = 350

#########################


def run(ctx):

    global dry_run
    global num_sample
    global pause_centri
    global mag_type
    global pipet_loc

    global pipet_delay_sec
    global mag_delay_min 
    global incubation_min 
    global wash_cycle 
    global mix_min 
    global elution_min

    global sample_columns

    dry_run = ctx.params.dry_run
    num_sample = ctx.params.num_sample
    pause_centri = ctx.params.pause_centri
    mag_type = ctx.params.mag_type
    pipet_loc = ctx.params.pipet_loc
    
    mag_delay_min = 0.1 if dry_run else 5
    incubation_min = 0.1 if dry_run else 30
    wash_cycle = 1 if dry_run else 3 
    mix_min = 0.1 if dry_run else 1.0
    elution_min = 0.1 if dry_run else 2

    sample_columns = int(num_sample//8)
    if num_sample%8 != 0: sample_columns = sample_columns + 1
    
    if sample_columns > 12 or sample_columns < 1:
        raise Exception('Invalid column number')

    if pipet_loc == 1:
        p1k_8_loc = 'left'
        p50_8_loc = 'right'
    else:
        p1k_8_loc = 'right'
        p50_8_loc = 'left'



    # deck layout

    hs = ctx.load_module('heaterShakerModuleV1', 'D3')
    hs_adapter = hs.load_adapter('opentrons_universal_flat_adapter')
    hs.close_labware_latch()
    working_plate = hs_adapter.load_labware('axygen_96_wellplate_500ul', 'WORKING PLATE w/ CELL LYSATE & BEADS')
    rxn = working_plate.rows()[0][:sample_columns]
    
    reagent_res = ctx.load_labware('nest_12_reservoir_15ml', 'C3', 'REAGENTS')
    wash = reagent_res.wells()[9:9+wash_cycle]
    elu = reagent_res.wells()[2]

    elution_plate = ctx.load_labware('axygen_96_wellplate_500ul', 'D1', 'ELUATES') 
    eluates = elution_plate.rows()[0][:sample_columns]

    waste_res = ctx.load_labware('nest_1_reservoir_290ml', 'D2', 'WASTE')
    waste = waste_res.wells()[0]

    if mag_type == 1:
        mag = ctx.load_adapter('millipore_24_ball_magnet', 'C2')
    elif mag_type == 2:
        mag = ctx.load_module('magneticBlockV1', 'C2')

    ctx.load_trash_bin('A3')

    tips_1k = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'C1', '1000uL TIPs')
    tips_200 = [ctx.load_labware('opentrons_flex_96_tiprack_200ul', slot, '200uL TIPs')
                for slot in ['B2', 'A2', 'B1', 'A1']]
    
    tips_51 = ctx.load_labware('opentrons_flex_96_tiprack_50ul', 'B3', '50uL Tips 1')
    tips_52 = ctx.load_labware('opentrons_flex_96_tiprack_50ul', 'B4', '50uL Tips 2')

    p1k_8 = ctx.load_instrument('flex_8channel_1000', p1k_8_loc)
    p50_8 = ctx.load_instrument('flex_8channel_50', p50_8_loc)



    #Pure Proteome Liquids

    def_elu = ctx.define_liquid(name="Elution Buffer", description=" ", display_color="#50C878")  ## Green
    vol_elu_per_well = (VOL_ELU * sample_columns * 8) + (VOL_ELU * (sample_columns-1) * 8) + 2000
    reagent_res.wells()[2].load_liquid(liquid=def_elu, volume=vol_elu_per_well)

    def_wash = ctx.define_liquid(name="Wash Buffer", description=" ", display_color="#FFD580")  ## Orange
    vol_wash_per_well = VOL_WASH * (sample_columns-1) * 8 + 2000
    for col in range(wash_cycle):    
        reagent_res.wells()[9+col].load_liquid(liquid=def_wash, volume=(vol_wash_per_well))

    def_samples = ctx.define_liquid(name="Cell Lysate + Beads", description=" ", display_color="#FFA500") 
    for well in working_plate.wells():
        well.load_liquid(liquid=def_samples, volume=VOL_BEAD_LYSIS+VOL_SAMPLE)



    def mix(speed, time):
        hs.set_and_wait_for_shake_speed(rpm=speed)
        ctx.delay(minutes=time)
        hs.deactivate_shaker()

    def discard(vol, tiprack_count):
        for col in rxn:
            p1k_8.tip_racks = [tips_200[tiprack_count]]
            p1k_8.pick_up_tip()  

            p1k_8.aspirate(vol*0.8, col.bottom(z=0.5), rate = 0.05)
            ctx.delay(seconds=1)
            p1k_8.aspirate(vol*0.2+20, col.bottom(z=0.8), rate = 0.01) 
            ctx.delay(seconds=1)

            p1k_8.dispense(p1k_8.current_volume, waste.top(z=-5))
            p1k_8.blow_out()

            if dry_run: p1k_8.return_tip()
            else: p1k_8.drop_tip() 



    # protocol

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("              Mixing               ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    mix(INCUBATION_SPEED,incubation_min) 

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("      Removing Lysis Solutions     ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")    

    hs.open_labware_latch()
    ctx.move_labware(labware = working_plate,
                     new_location = mag,
                     use_gripper=USE_GRIPPER
                     )
    hs.close_labware_latch()

    ctx.delay(minutes=mag_delay_min)

    discard(VOL_BEAD_LYSIS + VOL_SAMPLE, 0) 

    ## Wash

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("          Beginning Washes         ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    hs.open_labware_latch()
    ctx.move_labware(labware = working_plate,
                     new_location = hs_adapter,
                     use_gripper=USE_GRIPPER
                     )
    hs.close_labware_latch()

    for count in range(wash_cycle):
        p1k_8.tip_racks = [tips_1k]
        p1k_8.pick_up_tip()
        p1k_8.aspirate(20, wash[count].bottom(z=2))
        p1k_8.mix(1, VOL_WASH*6 if sample_columns > 6 else VOL_WASH*sample_columns*0.8, wash[count].bottom(z=2))

        if sample_columns > 6:

            p1k_8.aspirate(VOL_WASH*6, wash[count].bottom(z=2))
            for j in range(6):
                p1k_8.dispense(VOL_WASH, rxn[j].top(z=-2))
                ctx.delay(seconds=1)

            p1k_8.aspirate(VOL_WASH*(sample_columns-6), wash[count].bottom(z=2))
            for j in range(sample_columns-6):
                p1k_8.dispense(VOL_WASH, rxn[6+j].top(z=-2))
                ctx.delay(seconds=1)

        else:
            p1k_8.aspirate(VOL_WASH*sample_columns, wash[count].bottom(z=2))
            for j in range(sample_columns):
                p1k_8.dispense(VOL_WASH, rxn[j].top(z=-2))
                ctx.delay(seconds=1)            

        p1k_8.dispense(p1k_8.current_volume, wash[count].top(-5))
        p1k_8.drop_tip() if not dry_run else p1k_8.return_tip()

        mix(MIX_SPEED, mix_min)

        hs.open_labware_latch()
        ctx.move_labware(labware = working_plate,
                         new_location = mag,
                         use_gripper=USE_GRIPPER
                         )
        ctx.delay(minutes=mag_delay_min) 

        discard(VOL_WASH, count+1)

        ctx.move_labware(labware = working_plate,
                         new_location = hs_adapter,
                         use_gripper=USE_GRIPPER
                         )
        hs.close_labware_latch()

    ## Elution

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("      Beginning Elution Steps      ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")
    
    
    for x in range(2): 
        if x == 0:
            p50_8.tip_racks = [tips_51] 
        else: 
            ctx.move_labware(labware = tips_51,
                             new_location = 'C4',
                             use_gripper=USE_GRIPPER
                             )
            ctx.move_labware(labware = tips_52,
                             new_location = 'B3',
                             use_gripper=USE_GRIPPER
                             )
            p50_8.tip_racks = [tips_52]

        for col in rxn:
            p50_8.configure_for_volume(VOL_ELU)
            p50_8.pick_up_tip()
            p50_8.aspirate(VOL_ELU, elu, rate=0.2)
            ctx.delay(seconds=2)
            p50_8.move_to(elu.top(z=0), speed = SPEED_DEFAULT/20)
            p50_8.move_to(col.top(z=0), speed = SPEED_DEFAULT)
            p50_8.dispense(VOL_ELU, col.bottom(z=2), rate=0.1)  
            ctx.delay(seconds=2)
            p50_8.move_to(col.bottom(z=5).move(types.Point(x=col.diameter/2-0.5))) 
            p50_8.move_to(col.bottom(z=5).move(types.Point(x=0))) 
            p50_8.return_tip()

        p50_8.reset_tipracks()
        

        if pause_centri:
            hs.open_labware_latch()
            ctx.pause("Centrifuge the plate: use only if bubbles are forming")
            hs.close_labware_latch()

        mix(MIX_SPEED, elution_min) 

        hs.open_labware_latch()
        ctx.move_labware(labware = working_plate,
                         new_location = mag,
                         use_gripper=USE_GRIPPER
                         )
        hs.close_labware_latch()
        ctx.delay(minutes=mag_delay_min)

        # Transferring Elution to Elution Plate

        for start, end in zip(rxn, eluates):
            p50_8.configure_for_volume(VOL_ELU)
            p50_8.pick_up_tip()
            p50_8.aspirate(VOL_ELU, start.bottom(z=0.5), rate=0.02)
            ctx.delay(seconds=2)
            p50_8.dispense(VOL_ELU, end.bottom(z=1), rate = 0.1)
            ctx.delay(seconds=2)
            if x == 1: 
                count = 3 if not dry_run else 1
                p50_8.mix(count, 25, end.bottom(z=0.5), rate=0.2)
            ctx.delay(seconds=2) 
            p50_8.move_to(end.bottom(z=5).move(types.Point(x=end.diameter/2-0.5)))
            p50_8.move_to(col.bottom(z=5).move(types.Point(x=0))) 
            p50_8.drop_tip() if not dry_run else p50_8.return_tip()

        if x == 0:
            hs.open_labware_latch()
            ctx.move_labware(labware = working_plate,
                             new_location = hs_adapter,
                             use_gripper=USE_GRIPPER
                             )
            hs.close_labware_latch()
   