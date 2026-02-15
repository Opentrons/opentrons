from opentrons import types

metadata = {
    'protocolName': 'His-tagged Protein Purification by PureProteome Nickel Magnetic Beads with Lysis Buffer',
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
    
    parameters.add_bool(variable_name="pause_centri",
                        display_name="Pause for Centrifuge",
                        description=("After adding elution buffer, centrifuge the plate if bubble formation is expected"),
                        default=False
                        ) 
    
    parameters.add_int(variable_name="col_cellytic",
                       display_name="Columns for CelLytic B",
                       description="How many columns will be processed using CelLytic reagent?",
                       default=6,
                       maximum=12,
                       minimum=0
                       )
    
    parameters.add_int(variable_name="col_bugbuster",
                       display_name="Columns for BugBuster",
                       description="How many columns will be processed using BugBuster reagent?",
                       default=6,
                       maximum=12,
                       minimum=0
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

INCUBATION_SPEED = 1500
MIX_SPEED = 1500

USE_GRIPPER = True

SPEED_DEFAULT = 350

#########################


def run(ctx):

    global dry_run
    global pause_centri
    global col_cellytic
    global col_bugbuster
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
    pause_centri = ctx.params.pause_centri
    col_cellytic = ctx.params.col_cellytic
    col_bugbuster = ctx.params.col_bugbuster
    mag_type = ctx.params.mag_type
    pipet_loc = ctx.params.pipet_loc
    
    mag_delay_min = 0.1 if dry_run else 5
    incubation_min = 0.1 if dry_run else 30
    wash_cycle = 1 if dry_run else 3 
    mix_min = 0.1 if dry_run else 1.0
    elution_min = 0.1 if dry_run else 2

    sample_columns = col_cellytic + col_bugbuster
    
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

    working_plate = hs_adapter.load_labware('axygen_96_wellplate_500ul', 'WORKING PLATE w/ FROZEN SAMPLES')
    rxn_cellytic = working_plate.rows()[0][:col_cellytic]
    rxn_bugbuster = working_plate.rows()[0][col_cellytic:sample_columns]
    rxn = working_plate.rows()[0][:sample_columns]
    
    reagent_res = ctx.load_labware('nest_12_reservoir_15ml', 'C3', 'REAGENTS')
    wash = reagent_res.wells()[9:9+wash_cycle]
    celllyticB = reagent_res.wells()[0] 
    bugbuster = reagent_res.wells()[1]
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

    def_celllytic = ctx.define_liquid(name="Beads in CellLytic B", description=" ", display_color="#FFFF00")  ## Yellow
    def_bugbuster = ctx.define_liquid(name="Beads in BugBuster", description=" ", display_color="#BDB76B")  ## Khaki
    def_elu = ctx.define_liquid(name="Elution Buffer", description=" ", display_color="#50C878")  ## Green

    vol_celllytic_per_well = VOL_BEAD_LYSIS * (col_cellytic-1) * 8 + 2000
    vol_bugbuster_per_well = VOL_BEAD_LYSIS * (col_bugbuster-1) * 8 + 2000 
    vol_elu_per_well = (VOL_ELU * sample_columns * 8) + (VOL_ELU * (sample_columns-1) * 8) + 2000

    if col_cellytic > 0:
        reagent_res.wells()[0].load_liquid(liquid=def_celllytic, volume=vol_celllytic_per_well)
    if col_bugbuster > 0:
        reagent_res.wells()[1].load_liquid(liquid=def_bugbuster, volume=vol_bugbuster_per_well)
    reagent_res.wells()[2].load_liquid(liquid=def_elu, volume=vol_elu_per_well)

    def_wash = ctx.define_liquid(name="Wash Buffer", description=" ", display_color="#FFD580")  ## Orange
    vol_wash_per_well = VOL_WASH * (sample_columns-1) * 8 + 2000
    for col in range(wash_cycle):    
        reagent_res.wells()[9+col].load_liquid(liquid=def_wash, volume=(vol_wash_per_well))

    def_samples = ctx.define_liquid(name="Frozen Samples", description=" ", display_color="#FFA500")
    for well in working_plate.wells():
        well.load_liquid(liquid=def_samples, volume=VOL_SAMPLE)



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
            p1k_8.aspirate(vol*0.2+20, col.bottom(z=0.1), rate = 0.01)
            ctx.delay(seconds=1)

            p1k_8.dispense(p1k_8.current_volume, waste.top(z=-5))
            p1k_8.blow_out()

            if dry_run: p1k_8.return_tip()
            else: p1k_8.drop_tip() 

    def bead_mix(mix_vol, reps, loc):
        for i in range(reps):
            p1k_8.aspirate(mix_vol,loc.bottom().move(types.Point(x=0,y=0,z=1)))
            p1k_8.dispense(mix_vol-0.1,loc.bottom().move(types.Point(x=0,y=0,z=5)))
            p1k_8.aspirate(mix_vol,loc.bottom().move(types.Point(x=1,y=0,z=1.5)))
            p1k_8.dispense(mix_vol-0.1,loc.bottom().move(types.Point(x=0,y=1,z=8)))
            p1k_8.aspirate(mix_vol,loc.bottom().move(types.Point(x=0,y=1,z=1)),rate=0.1 if i == (reps-1) else 1)
            p1k_8.dispense(mix_vol-0.1,loc.bottom().move(types.Point(x=1,y=0,z=3)),rate=0.1 if i == (reps-1) else 1)
        p1k_8.dispense(reps*0.3,loc.bottom().move(types.Point(x=1,y=0,z=3)),rate=0.1 if i == (reps-1) else 1)


    # protocol

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("Adding Lysis/ Bead Mixes to Samples")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    # Transferring 100 ul Bead/Lysis Buffer mix to samples (multi-dispense)

    for n in range(2):

        if n == 0: bead_lysis = celllyticB 
        else: bead_lysis = bugbuster

        if n == 0: num_col = col_cellytic 
        else: num_col = col_bugbuster

        if n == 0: rxn_lysis = rxn_cellytic 
        else: rxn_lysis = rxn_bugbuster


        if num_col > 0:

            p1k_8.tip_racks = [tips_1k]
            p1k_8.pick_up_tip()

            if num_col > 8:
                
                bead_mix(VOL_BEAD_LYSIS*8*0.9, 5 if not dry_run else 1, bead_lysis)

                p1k_8.aspirate(VOL_BEAD_LYSIS*8+50, bead_lysis.bottom(z=2), rate = 0.2)
                ctx.delay(seconds=5)
                p1k_8.move_to(bead_lysis.top(z=0), speed = SPEED_DEFAULT/20)
                p1k_8.air_gap(20)
                p1k_8.move_to(rxn_lysis[0].top(z=0), speed = SPEED_DEFAULT)
                p1k_8.dispense(20, rxn_lysis[0].top(z=0))

                for i in range(8):
                    p1k_8.dispense(VOL_BEAD_LYSIS, rxn_lysis[i].top(z=-2), rate = 0.5)
                    ctx.delay(seconds=5)
                    p1k_8.move_to(rxn_lysis[i].top(z=-2).move(types.Point(x=rxn_lysis[i].diameter/2-0.6)))

                p1k_8.aspirate(VOL_BEAD_LYSIS*(num_col-8)+50, bead_lysis.bottom(z=2), rate = 0.2)
                ctx.delay(seconds=5)
                p1k_8.move_to(bead_lysis.top(z=0), speed = SPEED_DEFAULT/20)
                p1k_8.air_gap(20)
                p1k_8.move_to(rxn_lysis[8].top(z=0), speed = SPEED_DEFAULT)
                p1k_8.dispense(20, rxn_lysis[8].top(z=0))

                for i in range(num_col-8):
                    p1k_8.dispense(VOL_BEAD_LYSIS, rxn_lysis[8+i].top(z=-2), rate = 0.5)
                    ctx.delay(seconds=5)
                    p1k_8.move_to(rxn_lysis[8+i].top(z=-2).move(types.Point(x=rxn_lysis[8+i].diameter/2-0.6)))

                p1k_8.dispense(p1k_8.current_volume, bead_lysis.top(-5))
                p1k_8.blow_out()

            else:

                bead_mix(VOL_BEAD_LYSIS*num_col*0.9, 5 if not dry_run else 1, bead_lysis)
                p1k_8.aspirate(VOL_BEAD_LYSIS*num_col+50, bead_lysis.bottom(z=2), rate = 0.2)
                ctx.delay(seconds=5)
                p1k_8.move_to(bead_lysis.top(z=0), speed = SPEED_DEFAULT/20)
                p1k_8.air_gap(20)
                p1k_8.move_to(rxn_lysis[0].top(z=0), speed = SPEED_DEFAULT)
                p1k_8.dispense(20, rxn_lysis[0].top(z=0))

                for i in range(num_col):
                    p1k_8.dispense(VOL_BEAD_LYSIS, rxn_lysis[i].top(z=-2), rate = 0.5)
                    ctx.delay(seconds=5)
                    p1k_8.move_to(rxn_lysis[i].top(z=-2).move(types.Point(x=rxn_lysis[i].diameter/2-0.6)))

                p1k_8.dispense(p1k_8.current_volume, bead_lysis.top(-5))
                p1k_8.blow_out()

            if dry_run: p1k_8.return_tip()
            else: p1k_8.drop_tip()  
 


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

        #Transfer Elution Buffer to Sample Plate

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
            p50_8.move_to(end.bottom(z=5).move(types.Point(x=0)))
            p50_8.drop_tip() if not dry_run else p50_8.return_tip()

        if x == 0:
            hs.open_labware_latch()
            ctx.move_labware(labware = working_plate,
                             new_location = hs_adapter,
                             use_gripper=USE_GRIPPER
                             )
            hs.close_labware_latch()
   