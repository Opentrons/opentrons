from opentrons import types

metadata = {
    'protocolName': 'Bicinchoninic Acid Kit for Protein Determination',
    'author': 'Boren Lin, Opentrons',
    'description': ' '
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.21"
}

########################

NUM_STANDARD = 6
NUM_BLK = 1
NUM_PC = 1

VOL_WR = 200
VOL_SAMPLE = 25


def add_parameters(parameters):
    parameters.add_bool(variable_name="reader_on_deck",
                        display_name="Plate Reader on Deck",
                        description="Absorbance measured by the plate reader module on deck?",
                        default=True
                        )
    parameters.add_bool(variable_name="wavelength_ref",
                        display_name="Reference Wavelength",
                        description="The plate read at reference wavelength (650nm)?",
                        default=True
                        )
    parameters.add_int(variable_name="num_sample",
                       display_name="Number of Samples",
                       description="Number of samples to be assayed (maximum: 40)",
                       default=40,
                       minimum=1,
                       maximum=40
                       )
    parameters.add_int(variable_name="sample_labware",
                       display_name="Sample Labware",
                       description="Labware used for samples?",
                       default=1,
                       choices=[
                               {"display_name": "24 Tube Rack with 1.5mL Tubes", "value": 1},
                               {"display_name": "2mL 96-Well Plate ", "value": 2}
                               ]
                       )
    parameters.add_int(variable_name="standard_labware",
                       display_name="Standard Labware",
                       description="Labware used for standards?",
                       default=1,
                       choices=[
                               {"display_name": "24 Tube Rack with 1.5mL Tubes", "value": 1},
                               {"display_name": "200µL PCR 96-well Plate", "value": 2},
                               {"display_name": "2mL 96-Well Plate ", "value": 3}
                               ]
                       )
    parameters.add_float(variable_name="dilution_1",
                         display_name="First Dilution",
                         description="Samples diluted for 1x, 0.5x, 0.2x?",
                         default=1,
                         choices=[
                                 {"display_name": "1x", "value": 1},
                                 {"display_name": "0.5x", "value": 0.5},
                                 {"display_name": "0.2x", "value": 0.2}
                                 ]
                         )    
    parameters.add_float(variable_name="dilution_2",
                         display_name="Second Dilution",
                         description="Samples diluted for 1x, 0.5x, 0.2x?",
                         default=0.5,
                         choices=[
                                 {"display_name": "1x", "value": 1},
                                 {"display_name": "0.5x", "value": 0.5},
                                 {"display_name": "0.2x", "value": 0.2}
                                 ]
                         )   
    parameters.add_int(variable_name="reagent_prep_on_deck",
                       display_name="Working reagent prep on deck",
                       description="Working reagent (Reagent A and B mixture) prepared on deck?",
                       default=1,
                       choices=[
                               {"display_name": "Yes", "value": 1},
                               {"display_name": "No", "value": 0}
                               ]
                       ) 
    parameters.add_int(variable_name="time_incubation",
                       display_name="Incubation Time",
                       description="Color development - incubation for how long?",
                       default=30,
                       minimum=15,
                       maximum=120,
                       unit='min'
                       )
    parameters.add_int(variable_name="temp_incubation",
                       display_name="Incubation Temperature",
                       description="Color development - incubation at what temperature?",
                       default=1,
                       choices=[
                               {"display_name": "60°C", "value": 2},
                               {"display_name": "37°C", "value": 1},
                               {"display_name": "Room Temperature", "value": 0}
                               ]
                       )
    parameters.add_int(variable_name="cover",
                       display_name="Plate Covering",
                       description="Color development - with plate lid or plate seal?",
                       default=0,
                       choices=[
                               {"display_name": "Plate Lid", "value": 0},
                               {"display_name": "Plate Seal (manually)", "value": 1}
                               ]
                       )
    parameters.add_int(variable_name="pipet_location",
                       display_name="P1000 1-ch Position",
                       description="How P1000 single channel pipette is mounted?",
                       default=1,
                       choices=[
                               {"display_name": "on the right", "value": 1},
                               {"display_name": "on the left", "value": 2}
                               ]
                       )
    
def run(ctx):

    global reader_on_deck
    global wavelength_ref

    global num_sample

    global sample_labware
    global standard_labware   

    global dilution_1
    global dilution_2

    global reagent_prep_on_deck
    global time_incubation
    global temp_incubation
    global temp
    global cover

    global pipet_location

    global num_col
    global vol_wr_well_1
    global vol_wr_well_2
    global vol_a_well_1 
    global vol_a_well_2 
    global vol_b_well_1 
    global vol_b_well_2 

    global vol_dilution_1
    global vol_dilution_2
    global vol_buffer_dilution_1
    global vol_buffer_dilution_2


    reader_on_deck = ctx.params.reader_on_deck
    wavelength_ref = ctx.params.wavelength_ref

    num_sample = ctx.params.num_sample

    sample_labware = ctx.params.sample_labware
    standard_labware = ctx.params.standard_labware 

    dilution_1 = ctx.params.dilution_1
    dilution_2 = ctx.params.dilution_2

    reagent_prep_on_deck = ctx.params.reagent_prep_on_deck
    time_incubation = ctx.params.time_incubation
    temp_incubation = ctx.params.temp_incubation
    cover = ctx.params.cover

    pipet_location = ctx.params.pipet_location

    num_col_sample = int(num_sample//8)
    if num_sample%8 !=0: num_col_sample = num_col_sample + 1 
    ## if sample stock in 96-well setting

    num_col = 2 + num_col_sample * 2
    ## total columns in assay plate for 2 dilutions + standards 

    if num_col > 6:
        vol_wr_well_1 = (6-1)*VOL_WR*8+2000
        vol_wr_well_2 = (num_col-6-1)*VOL_WR*8+2000
        
    else:
        vol_wr_well_1 = (num_col-1)*VOL_WR*8+2000
        vol_wr_well_2 = 0

    vol_a_well_1 = (vol_wr_well_1/51)*50
    vol_a_well_2 = (vol_wr_well_2/51)*50
    vol_b_well_1 = (vol_wr_well_1/51)*1
    vol_b_well_2 = (vol_wr_well_2/51)*1

    vol_dilution_1 = VOL_SAMPLE * dilution_1
    vol_buffer_dilution_1 = VOL_SAMPLE * (1-dilution_1)
    vol_dilution_2 = VOL_SAMPLE * dilution_2
    vol_buffer_dilution_2 = VOL_SAMPLE * (1-dilution_2)

    if temp_incubation == 2: temp = 60
    elif temp_incubation == 1: temp = 37
    
    if pipet_location == 1:
        p1k_1_loc = 'right'
        p1k_8_loc = 'left'
    else:
        p1k_1_loc = 'left'
        p1k_8_loc = 'right'


    # deck layout
    if reader_on_deck:
        reader = ctx.load_module("absorbanceReaderV1", 'D3')

    hs = ctx.load_module('heaterShakerModuleV1', 'D1')
    hs_adapter = hs.load_adapter('opentrons_universal_flat_adapter')

    if reagent_prep_on_deck == 1: 
        reagent_stock_rack = ctx.load_labware('opentrons_10_tuberack_nest_4x50ml_6x15ml_conical', 'A2', 'REAGENTS')
        reagent_a = reagent_stock_rack.wells()[8]
        reagent_b = reagent_stock_rack.wells()[0]

    wr_reservoir = ctx.load_labware('nest_12_reservoir_15ml', 'B2', 'WORKING REAGENT, DILUENT')
    wr_1 = wr_reservoir.wells()[0]
    if num_col > 6: 
        wr_2 = wr_reservoir.wells()[1]

    buffer = wr_reservoir.wells()[11]

    if sample_labware == 1:
        if num_sample > 24: 
            sample_rack_1 = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 'C1', 'SAMPLES')
            sample_rack_2 = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 'B1', 'SAMPLES')
            sample_1 = sample_rack_1.wells()[:24]
            sample_2 = sample_rack_2.wells()[:(num_sample-24)]      
        else: 
            sample_rack_1 = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 'C1', 'SAMPLES')
            sample_1 = sample_rack_1.wells()[:num_sample]

    elif sample_labware == 2:
        sample_rack_1 = ctx.load_labware('nest_96_wellplate_2ml_deep', 'C1', 'SAMPLES')
        sample_1 = sample_rack_1.rows()[0][:num_col_sample]
    
    if standard_labware == 1:
        standard_rack = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 'A1', 'STANDARDS, POSITIVE CTL, BLANK')
        standard = standard_rack.wells()[:(NUM_STANDARD + NUM_BLK + NUM_PC)]

    elif standard_labware == 2:
        standard_rack = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'A1', 'STANDARDS, POSITIVE CTL, BLANK')
        standard = standard_rack.rows()[0][0]

    elif standard_labware == 3:
        standard_rack = ctx.load_labware('nest_96_wellplate_2ml_deep', 'A1', 'STANDARDS, POSITIVE CTL, BLANK')
        standard = standard_rack.rows()[0][0]


    if cover == 0: working_plate_lid = ctx.load_labware('corning_96_wellplate_360ul_flat', 'D2', 'PLATE LID') 
    working_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 'C2', 'WORKING PLATE') 
    rxn_col = working_plate.rows()[0][:num_col]

    standard_in_well_1 = working_plate.wells()[:(NUM_STANDARD + NUM_BLK + NUM_PC)]
    standard_in_well_2 = working_plate.wells()[(NUM_STANDARD + NUM_BLK + NUM_PC):(NUM_STANDARD + NUM_BLK + NUM_PC)*2]
    standard_in_col_1 = working_plate.rows()[0][0]
    standard_in_col_2 = working_plate.rows()[0][1]

    if sample_labware == 1:
        if num_sample > 24: 
            dilution_1_in_well_1 = working_plate.wells()[16:(16+24)]
            dilution_1_in_well_2 = working_plate.wells()[(16+24):(16+24)+(num_sample-24)]
            dilution_2_in_well_1 = working_plate.wells()[(16+24)+(num_sample-24):(16+24)+(num_sample-24)+24]
            dilution_2_in_well_2 = working_plate.wells()[(16+24)+(num_sample-24)+24:(16+24)+(num_sample-24)+24+(num_sample-24)]
        else:
            dilution_1_in_well_1 = working_plate.wells()[16:(16+num_sample)]   
            dilution_1_in_well_2 = working_plate.wells()[16:(16+num_sample)]   
            dilution_2_in_well_1 = working_plate.wells()[(16+num_sample):(16+num_sample+num_sample)]
            dilution_2_in_well_2 = working_plate.wells()[(16+num_sample):(16+num_sample+num_sample)]
    
    dilution_1_in_col = working_plate.rows()[0][2:(2+num_col_sample)]
    dilution_2_in_col = working_plate.rows()[0][(2+num_col_sample):(2+num_col_sample)+num_col_sample]

    ctx.load_trash_bin('A3')

    tips_1000 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B3', 'P1000 TIPS')
    #tips_1000_loc = tips_1000.wells()[:96]
    tips_50 = ctx.load_labware('opentrons_flex_96_tiprack_50ul', 'C3', 'P50 TIPS')
    #tips_50_loc = tips_50.wells()[:96]
    p1k_1 = ctx.load_instrument('flex_1channel_1000', p1k_1_loc) 
    p1k_8 = ctx.load_instrument('flex_8channel_1000', p1k_8_loc) 

    ## volume info 
    if reagent_prep_on_deck == 1: 
        vol_a = ((num_col-1)*VOL_WR*8+3000)/51*50
        vol_b = ((num_col-1)*VOL_WR*8+3000)/51*1
        def_a = ctx.define_liquid(name="Reagent A", description=" ", display_color="#E5E4E2")  ## Gray
        reagent_stock_rack.wells()[8].load_liquid(liquid=def_a, volume=vol_a) 
        def_b = ctx.define_liquid(name="Reagent B", description=" ", display_color="#0000FF")  ## Blue
        reagent_stock_rack.wells()[0].load_liquid(liquid=def_b, volume=vol_b) 

    else:
        if num_col > 6:
            vol_1 = (6-1)*VOL_WR*8+2000 
            vol_2 = (num_col-6-1)*VOL_WR*8+2000 
            def_1 = ctx.define_liquid(name="Working Reagent", description=" ", display_color="#50C878")  ## Green
            wr_reservoir.wells()[0].load_liquid(liquid=def_1, volume=vol_1) 
            def_2 = ctx.define_liquid(name="Working Reagent", description=" ", display_color="#50C878")  ## Green
            wr_reservoir.wells()[1].load_liquid(liquid=def_2, volume=vol_2) 
        else:
            vol_1 = (num_col-1)*VOL_WR*8+2000
            def_1 = ctx.define_liquid(name="Working Reagent", description=" ", display_color="#50C878")  ## Green
            wr_reservoir.wells()[0].load_liquid(liquid=def_1, volume=vol_1)      

    vol_dilu = VOL_SAMPLE*(1-dilution_1)*num_sample + VOL_SAMPLE*(1-dilution_2)*num_sample
    def_dilu = ctx.define_liquid(name="Diluent", description="Buffer for dilution", display_color="#8B8000")  ## Yellow 
    wr_reservoir.wells()[11].load_liquid(liquid=def_dilu, volume=vol_dilu+2000)
    

    vol_unkwn = VOL_SAMPLE * 2 + 10
    if sample_labware == 1:
        if num_sample > 24:
            def_1 = ctx.define_liquid(name="Samples", description="Samples, per tube or well (Slot C1)", display_color="#FF0000")  ## Red
            def_2 = ctx.define_liquid(name="Samples", description="Samples, per tube or well (Slot B1)", display_color="#FF0000")  ## Red
            for p in range(24):
                sample_rack_1.wells()[p].load_liquid(liquid=def_1, volume=vol_unkwn)
            for q in range(num_sample-24):
                sample_rack_2.wells()[q].load_liquid(liquid=def_2, volume=vol_unkwn) 
        else:
            def_1 = ctx.define_liquid(name="Samples", description="Samples, per tube (Slot C1)", display_color="#FF0000")  ## Red
            for p in range(num_sample):
                sample_rack_1.wells()[p].load_liquid(liquid=def_1, volume=vol_unkwn) 
    else:
        def_1 = ctx.define_liquid(name="Samples", description="Samples, per tube or well (Slot C1)", display_color="#FF0000") ## Red
        for p in range(num_sample):
            sample_rack_1.wells()[p].load_liquid(liquid=def_1, volume=vol_unkwn) 


    vol_std = VOL_SAMPLE * 2 + 10
    def_std = ctx.define_liquid(name="Standards", description="Standards, per well", display_color="#FFA500")  ## Orange
    def_pc = ctx.define_liquid(name="Positive Control", description="Positive Control, per well", display_color="#800080")  ## Purple
    def_blk = ctx.define_liquid(name="Blank", description="Blank, per well", display_color="#013220")  # Dark Green
    for r in range(6):
        standard_rack.wells()[r].load_liquid(liquid=def_std, volume=vol_std)
    standard_rack.wells()[6].load_liquid(liquid=def_pc, volume=vol_std)
    standard_rack.wells()[7].load_liquid(liquid=def_blk, volume=vol_std)


    def transfer(vol_1, vol_2, start_loc, end_1_loc, end_2_loc, pip, tips):
        for start, end_1, end_2 in zip(start_loc, end_1_loc, end_2_loc):
            pip.tip_racks = [tips] 

            pip.pick_up_tip()
            pip.mix(2, vol_1+vol_2, start)
            pip.blow_out(start.top(z=0))

            pip.flow_rate.aspirate = 50
            pip.flow_rate.dispense = 200

            pip.aspirate(vol_1, start.bottom(z=1))
            ctx.delay(seconds=2)
            pip.dispense(vol_1, end_1.bottom(z=5), push_out=5)
            ctx.delay(seconds=2)
            pip.move_to(end_1.bottom(z=5).move(types.Point(x=end_1.diameter/2-0.5)))

            pip.aspirate(vol_2, start.bottom(z=1))  
            ctx.delay(seconds=2)         
            pip.dispense(vol_2, end_2.bottom(z=5), push_out=5)
            ctx.delay(seconds=2)
            pip.move_to(end_2.bottom(z=5).move(types.Point(x=end_2.diameter/2-0.5)))

            pip.flow_rate.aspirate = 478
            pip.flow_rate.dispense = 478

            pip.drop_tip()

    # protocol 

    ## add standards
    if standard_labware == 1:  
        transfer(VOL_SAMPLE, VOL_SAMPLE, standard, standard_in_well_1, standard_in_well_2, p1k_1, tips_50)   

    else:
        start = standard
        end_1 = standard_in_col_1
        end_2 = standard_in_col_2
            
        p1k_8.tip_racks = [tips_50] 
        p1k_8.pick_up_tip()
        p1k_8.mix(1, VOL_SAMPLE+VOL_SAMPLE, start)
        p1k_8.blow_out(start.top(z=0))

        p1k_8.flow_rate.aspirate = 50
        p1k_8.flow_rate.dispense = 200

        p1k_8.aspirate(VOL_SAMPLE, start.bottom(z=1))
        ctx.delay(seconds=2)
        p1k_8.dispense(VOL_SAMPLE, end_1.bottom(z=5), push_out=5)
        ctx.delay(seconds=2)
        p1k_8.move_to(end_1.bottom(z=5).move(types.Point(x=end_1.diameter/2-0.5)))

        p1k_8.aspirate(VOL_SAMPLE, start.bottom(z=1))
        ctx.delay(seconds=2)
        p1k_8.dispense(VOL_SAMPLE, end_2.bottom(z=5), push_out=5)
        ctx.delay(seconds=2)
        p1k_8.move_to(end_2.bottom(z=5).move(types.Point(x=end_2.diameter/2-0.5)))

        p1k_8.flow_rate.aspirate = 478
        p1k_8.flow_rate.dispense = 478

        p1k_8.drop_tip()


    ## add buffer as diluent
    if vol_buffer_dilution_1 + vol_buffer_dilution_2 > 0:
        p1k_8.tip_racks = [tips_50] 
        p1k_8.pick_up_tip()
        for end_1, end_2 in zip(dilution_1_in_col, dilution_2_in_col):
            start = buffer
        
            p1k_8.mix(2, vol_buffer_dilution_1 + vol_buffer_dilution_2, buffer)
            p1k_8.blow_out(start.top(z=0))

            p1k_8.flow_rate.aspirate = 50
            p1k_8.flow_rate.dispense = 200

            if vol_buffer_dilution_1 > 0:
                p1k_8.aspirate(vol_buffer_dilution_1, start)
                ctx.delay(seconds=2)
                p1k_8.dispense(vol_buffer_dilution_1, end_1.bottom(z=5), push_out=5)
                ctx.delay(seconds=2)
                p1k_8.move_to(end_1.bottom(z=5).move(types.Point(x=end_1.diameter/2-0.5)))

            if vol_buffer_dilution_2 > 0:
                p1k_8.aspirate(vol_buffer_dilution_2, start)
                ctx.delay(seconds=2)
                p1k_8.dispense(vol_buffer_dilution_2, end_2.bottom(z=5), push_out=5)
                ctx.delay(seconds=2)
                p1k_8.move_to(end_2.bottom(z=5).move(types.Point(x=end_2.diameter/2-0.5)))

            p1k_8.flow_rate.aspirate = 478
            p1k_8.flow_rate.dispense = 478

        p1k_8.drop_tip()


    ## add samples
    if sample_labware == 1: 
        if num_sample > 24:
            sample_start = [sample_1, sample_2]
        else: sample_start = [sample_1]

        dilution_1_end = [dilution_1_in_well_1, dilution_1_in_well_2]
        dilution_2_end = [dilution_2_in_well_1, dilution_2_in_well_2]

        if num_sample > 24: num_rack = 2
        else: num_rack = 1

        for n in range(num_rack):
            transfer(vol_dilution_1, vol_dilution_2, sample_start[n], dilution_1_end[n], dilution_2_end[n], p1k_1, tips_50)
 
    else: 
        transfer(vol_dilution_1, vol_dilution_2, sample_1, dilution_1_in_col, dilution_2_in_col, p1k_8, tips_50)


    ## working reagent prep
    if reagent_prep_on_deck == 1:
        p1k_1.tip_racks = [tips_1000]

        p1k_1.pick_up_tip()
        n = int(vol_a_well_1//900)
        for _ in range(n):
            p1k_1.aspirate(900, reagent_a)
            p1k_1.dispense(900, wr_1.top(z=0))
        if vol_a_well_1%900 != 0:
            vol_last = vol_a_well_1 - (900 * n)
            p1k_1.aspirate(vol_last, reagent_a)
            p1k_1.dispense(vol_last, wr_1.top(z=0))         
        if num_col > 6:
            nn = int(vol_a_well_2//900)
            for _ in range(nn):
                p1k_1.aspirate(900, reagent_a)
                p1k_1.dispense(900, wr_2.top(z=0))
            if vol_a_well_2%900 != 0:
                vol_last = vol_a_well_2 - (900 * nn)
                p1k_1.aspirate(vol_last, reagent_a)
                p1k_1.dispense(vol_last, wr_2.top(z=0))
        p1k_1.drop_tip()

        p1k_1.pick_up_tip() 
        p1k_1.aspirate(vol_b_well_1, reagent_b)
        ctx.delay(seconds=2)
        p1k_1.dispense(vol_b_well_1, wr_1)
        ctx.delay(seconds=2)
        p1k_1.blow_out(wr_1.top(z=0))
        if num_col > 6:
            p1k_1.aspirate(vol_b_well_2, reagent_b)
            ctx.delay(seconds=2)
            p1k_1.dispense(vol_b_well_2, wr_2)
            ctx.delay(seconds=2)
            p1k_1.blow_out(wr_2.top(z=0))
        p1k_1.drop_tip()


    ## add working reagent
    p1k_8.tip_racks = [tips_1000]
    p1k_8.pick_up_tip()

    if reagent_prep_on_deck == 1: 
        if num_col > 6:
            for _ in range(15):
                p1k_8.aspirate(VOL_WR, wr_2) 
                p1k_8.dispense(VOL_WR, wr_2.top(z=0)) 
        for _ in range(15):
            p1k_8.aspirate(VOL_WR, wr_1) 
            p1k_8.dispense(VOL_WR, wr_1.top(z=0))   

    if num_col > 6:
        for i in range(2):   
            p1k_8.mix(1, VOL_WR*3, wr_1)
            p1k_8.aspirate(VOL_WR*3, wr_1)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[i*3]
            p1k_8.dispense(20, end.top(z=0))
            for j in range(3):
                end = rxn_col[i*3+j]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)
        col = num_col - 6
        if col > 3: 
            p1k_8.mix(1, VOL_WR*3, wr_2)
            p1k_8.aspirate(VOL_WR*3, wr_2)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[6]
            p1k_8.dispense(20, end.top(z=0))
            for jj in range(3):
                end = rxn_col[6+jj]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)     
            ii = col - 3
            p1k_8.mix(1, VOL_WR*ii, wr_2)
            p1k_8.aspirate(VOL_WR*ii, wr_2)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[9]
            p1k_8.dispense(20, end.top(z=0))
            for iii in range(ii):
                end = rxn_col[9+iii]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2) 
        else:
            p1k_8.mix(1, VOL_WR*col, wr_2)
            p1k_8.aspirate(VOL_WR*col, wr_2)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[6]
            p1k_8.dispense(20, end.top(z=0))
            for jjj in range(col):
                end = rxn_col[6+jjj]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)               
    else:
        if num_col > 3: 
            p1k_8.mix(1, VOL_WR*3, wr_1)
            p1k_8.aspirate(VOL_WR*3, wr_1)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[0]
            p1k_8.dispense(20, end.top(z=0))
            for g in range(3):
                end = rxn_col[g]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)     
            col = num_col - 3
            p1k_8.mix(1, VOL_WR*col, wr_1)
            p1k_8.aspirate(VOL_WR*col, wr_1)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[3]
            p1k_8.dispense(20, end.top(z=0))
            for h in range(col):
                end = rxn_col[3+h]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2) 
        else:
            p1k_8.mix(1, VOL_WR*num_col, wr_1)
            p1k_8.aspirate(VOL_WR*num_col, wr_1)
            ctx.delay(seconds=2)
            p1k_8.air_gap(20)
            end = rxn_col[0]
            p1k_8.dispense(20, end.top(z=0))
            for hh in range(num_col):
                end = rxn_col[hh]
                p1k_8.dispense(VOL_WR, end.top(z=0))
                ctx.delay(seconds=2)  
    
    p1k_8.drop_tip()


    ## mix and incubate       
    hs.open_labware_latch()

    ctx.move_labware(labware = working_plate,
                     new_location = hs_adapter,
                     use_gripper=True,
                     pick_up_offset={'x':0, 'y':0, 'z':-7},
                     drop_offset={'x':0,'y':0,'z':-8}
                    )
    
    hs.close_labware_latch()
    hs.set_and_wait_for_shake_speed(rpm=1250)
    ctx.delay(seconds=30)
    hs.deactivate_shaker()
    hs.open_labware_latch()

    ctx.move_labware(labware = working_plate,
                     new_location = 'C2',
                     use_gripper=True,
                     pick_up_offset={'x':0, 'y':0, 'z':-6},
                     drop_offset={'x':0,'y':0,'z':-7}
                    ) 
    
    if temp_incubation > 0: 
        hs.set_target_temperature(temp)  

    if cover == 1: ctx.pause('Seal the plate (Slot C2) with plate seal')
    else:
        del ctx.deck['C2']
        ctx.move_labware(labware = working_plate_lid,
                        new_location = 'C2',
                        use_gripper=True,
                        pick_up_offset={'x':0, 'y':0, 'z':-4},
                        drop_offset={'x':0,'y':0,'z':3}
                        ) 
        
        del ctx.deck['C2']
        working_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 'C2', 'WORKING PLATE')     

    if temp_incubation > 0: 
        hs.wait_for_temperature() 

        ctx.move_labware(labware = working_plate,
                        new_location = hs_adapter,
                        use_gripper=True,
                        pick_up_offset={'x':0, 'y':0, 'z':-7},
                        drop_offset={'x':0,'y':0,'z':-8}
                        )
    
    ctx.delay(minutes=time_incubation)
    if temp_incubation > 0: 
        hs.deactivate_heater()

    ## read plate
    if reader_on_deck: 

        if temp_incubation > 0: 
        ### move plate to C2
            ctx.move_labware(labware = working_plate,
                            new_location = 'C2',
                            use_gripper=True,
                            pick_up_offset={'x':0, 'y':0, 'z':-6},
                            drop_offset={'x':-2,'y':0,'z':-7}
                            ) 
            
        if cover == 1: ctx.pause('Remove plate seal (Slot C2)')  
        else:      
        ### move plate lid to D2
            del ctx.deck['C2']
            working_plate_lid = ctx.load_labware('corning_96_wellplate_360ul_flat', 'C2')         
            ctx.move_labware(labware = working_plate_lid,
                            new_location = 'D2',
                            use_gripper=True,
                            pick_up_offset={'x':0, 'y':0, 'z':3},
                            drop_offset={'x':0,'y':0,'z':-5}
                            ) 
            
            working_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 'C2')   

        ### reader initialize
        reader.close_lid()       
        if wavelength_ref:
            reader.initialize('single', [562], reference_wavelength=650)      
        else: reader.initialize('single', [562])

        ### read the plate 
        reader.open_lid()
        ctx.move_labware(labware = working_plate,
                        new_location = reader,
                        use_gripper=True
                        )        
        reader.close_lid()
        reader.read(export_filename="output.csv")

        ### move plate back to C2
        reader.open_lid()
        ctx.move_labware(labware = working_plate, 
                        new_location = 'C2', 
                        use_gripper=True
                        )
        reader.close_lid()
  
    else: 
        ctx.pause('Measure absorbance')
    





 