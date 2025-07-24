from opentrons import types

metadata = {
    'protocolName': 'Protein Quantification and Normalization',
    'author': 'Boren Lin, Opentrons',
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

VOL_PIPET_LIMIT = 5

def add_parameters(parameters):
    parameters.add_bool(variable_name="wavelength_ref",
                        display_name="Reference Wavelength",
                        description=" ",
                        default=False
                        )
    parameters.add_int(variable_name="num_sample",
                       display_name="Number of Samples",
                       description="Number of samples to be assayed. (maximum: 40)",
                       default=40,
                       minimum=1,
                       maximum=40
                       )
    parameters.add_int(variable_name="sample_labware",
                      display_name="Sample Labware",
                      description="Labware used for samples?",
                      default=1,
                      choices=[
                               {"display_name": "200µL PCR 96-well Plate", "value": 1},
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
                      description="Samples will be diluted for 1x, 0.5x, or 0.2x?",
                      default=1,
                      choices=[
                               {"display_name": "1x", "value": 1},
                               {"display_name": "0.5x", "value": 0.5},
                               {"display_name": "0.2x", "value": 0.2}
                              ]
                      )    
    parameters.add_float(variable_name="dilution_2",
                      display_name="Second Dilution",
                      description="Samples will be diluted for 1x, 0.5x, or 0.2x?",
                      default=0.5,
                      choices=[
                               {"display_name": "1x", "value": 1},
                               {"display_name": "0.5x", "value": 0.5},
                               {"display_name": "0.2x", "value": 0.2}
                              ]
                      )   
    parameters.add_int(variable_name="time_incubation",
                       display_name="Incubation Time",
                       description="Color development - incubation for how long?",
                       default=30,
                       minimum=10,
                       maximum=120,
                       unit='min'
                       )
    parameters.add_float(variable_name="std_1",
                       display_name="Standard #1",
                       description="1st standard concentration (highest)",
                       default=1000,
                       minimum=20,
                       maximum=2000,
                       unit='ng/µL'
                       )
    parameters.add_float(variable_name="std_2",
                       display_name="Standard #2",
                       description="2nd standard concentration",
                       default=500,
                       minimum=20,
                       maximum=2000,
                       unit='ng/µL'
                       )
    parameters.add_float(variable_name="std_3",
                       display_name="Standard #3",
                       description="3rd standard concentration",
                       default=250,
                       minimum=20,
                       maximum=2000,
                       unit='ng/µL'
                       )
    parameters.add_float(variable_name="std_4",
                       display_name="Standard #4",
                       description="4th standard concentration",
                       default=125,
                       minimum=20,
                       maximum=2000,
                       unit='ng/µL'
                       )
    parameters.add_float(variable_name="std_5",
                       display_name="Standard #5",
                       description="5th standard concentration",
                       default=62.5,
                       minimum=20,
                       maximum=2000,
                       unit='ng/µL'
                       )
    parameters.add_float(variable_name="std_6",
                       display_name="Standard #6",
                       description="6th standard concentration (lowest)",
                       default=31.25,
                       minimum=20,
                       maximum=2000,
                       unit='ng/µL'
                       )  
    parameters.add_int(variable_name="vol_final",
                       display_name="Normalized Sample Volume",
                       description="Target volume of each sample after normalization?",
                       default=100,
                       minimum=10,
                       maximum=100,
                       unit='µL'
                       )
    parameters.add_int(variable_name="amount_final",
                       display_name="Protein Amount",
                       description="Amount of protein in each sample after normalization?",
                       default=100,
                       minimum=1,
                       maximum=190,
                       unit='µg'
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

    global wavelength_ref
    global num_sample

    global sample_labware  
    global standard_labware   

    global dilution_1
    global dilution_2

    global time_incubation

    global std_1
    global std_2  
    global std_3
    global std_4
    global std_5
    global std_6

    global vol_final
    global amount_final 

    global pipet_location

    global num_col_sample_plate
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


    wavelength_ref = ctx.params.wavelength_ref
    num_sample = ctx.params.num_sample

    sample_labware = ctx.params.sample_labware 
    standard_labware = ctx.params.standard_labware 

    dilution_1 = ctx.params.dilution_1
    dilution_2 = ctx.params.dilution_2

    time_incubation = ctx.params.time_incubation

    std_1 = ctx.params.std_1
    std_2 = ctx.params.std_2
    std_3 = ctx.params.std_3
    std_4 = ctx.params.std_4
    std_5 = ctx.params.std_5
    std_6 = ctx.params.std_6

    vol_final = ctx.params.vol_final
    amount_final = ctx.params.amount_final

    pipet_location = ctx.params.pipet_location

    #################################

    num_col_sample_plate = int(num_sample//8)
    if num_sample%8 !=0: num_col_sample_plate = num_col_sample_plate + 1 
    ## total columns in sample plate 

    num_col = 2 + num_col_sample_plate * 2
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

    conc_std = [std_1, std_2, std_3, std_4, std_5, std_6]
    for chk in range(5):
        if conc_std[chk] <= conc_std[chk+1]: raise Exception('Invalid Standards')
    
    if pipet_location == 1:
        p1k_1_loc = 'right'
        p1k_8_loc = 'left'
    else:
        p1k_1_loc = 'left'
        p1k_8_loc = 'right'


    # deck layout
    reader = ctx.load_module("absorbanceReaderV1", "D3")

    hs = ctx.load_module('heaterShakerModuleV1', 'D1')
    hs_adapter = hs.load_adapter('opentrons_universal_flat_adapter')

    wr_reservoir = ctx.load_labware('nest_12_reservoir_15ml', 'B2', 'WORKING REAGENT, DILUENT')
    wr_1 = wr_reservoir.wells()[0]
    if num_col > 6: 
        wr_2 = wr_reservoir.wells()[1]

    buffer = wr_reservoir.wells()[11]

    if sample_labware == 1:
        sample_plate = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'B1', 'SAMPLES')
        sample = sample_plate.rows()[0][:num_col_sample_plate]
        sample_in_well = sample_plate.wells()[:num_sample] 

    elif standard_labware == 2:
        sample_plate = ctx.load_labware('nest_96_wellplate_2ml_deep', 'B1', 'SAMPLES')
        sample = sample_plate.rows()[0][:num_col_sample_plate]
        sample_in_well = sample_plate.wells()[:num_sample] 

    if standard_labware == 1:
        standard_rack = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 'A1', 'STANDARDS, POSITIVE CTL, BLANK')
        standard = standard_rack.wells()[:(NUM_STANDARD + NUM_BLK + NUM_PC)]

    elif standard_labware == 2:
        standard_rack = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'A1', 'STANDARDS, POSITIVE CTL, BLANK')
        standard = standard_rack.rows()[0][0]

    elif standard_labware == 3:
        standard_rack = ctx.load_labware('nest_96_wellplate_2ml_deep', 'A1', 'STANDARDS, POSITIVE CTL, BLANK')
        standard = standard_rack.rows()[0][0]

    working_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 'C2', 'WORKING PLATE') 
    working_plate_lid = ctx.load_labware('corning_96_wellplate_360ul_flat', 'D2', 'PLATE LID') 
    rxn_col = working_plate.rows()[0][:num_col]

    standard_in_well_1 = working_plate.wells()[:(NUM_STANDARD + NUM_BLK + NUM_PC)]
    standard_in_well_2 = working_plate.wells()[(NUM_STANDARD + NUM_BLK + NUM_PC):(NUM_STANDARD + NUM_BLK + NUM_PC)*2]
    standard_in_col_1 = working_plate.rows()[0][0]
    standard_in_col_2 = working_plate.rows()[0][1]
    
    dilution_1_in_col = working_plate.rows()[0][2:(2+num_col_sample_plate)]
    dilution_2_in_col = working_plate.rows()[0][(2+num_col_sample_plate):(2+num_col_sample_plate)+num_col_sample_plate]


    final_plate = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'C1', 'NORMALIZED SAMPLES')
    final = final_plate.wells()[:num_sample]

    ctx.load_trash_bin('A3')

    tips_200 = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'A2', 'P200 TIPS')
    tips_50 = [ctx.load_labware('opentrons_flex_96_tiprack_50ul', slot, 'P50 TIPS')
               for slot in ['C3', 'B3']]

    p1k_1 = ctx.load_instrument('flex_1channel_1000', p1k_1_loc) 
    p1k_8 = ctx.load_instrument('flex_8channel_1000', p1k_8_loc) 


    # volume info 

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

    vol_dilu = 10000
    def_dilu = ctx.define_liquid(name="Diluent", description="Buffer for dilution", display_color="#8B8000")  ## Yellow 
    wr_reservoir.wells()[11].load_liquid(liquid=def_dilu, volume=vol_dilu+2000)
    

    vol_unkwn = 250
    def_1 = ctx.define_liquid(name="Samples", description="Samples, per tube or well (Slot C1)", display_color="#FF0000") ## Red
    for p in range(num_sample):
        sample_plate.wells()[p].load_liquid(liquid=def_1, volume=vol_unkwn/num_sample) 


    vol_std = VOL_SAMPLE * 2 + 10
    def_std = ctx.define_liquid(name="Standards", description="Standards, per well", display_color="#FFA500")  ## Orange
    def_pc = ctx.define_liquid(name="Positive Control", description="Positive Control, per well", display_color="#800080")  ## Purple
    def_blk = ctx.define_liquid(name="Blank", description="Blank, per well", display_color="#013220")  # Dark Green
    for r in range(6):
        standard_rack.wells()[r].load_liquid(liquid=def_std, volume=vol_std/6)
    standard_rack.wells()[6].load_liquid(liquid=def_pc, volume=vol_std)
    standard_rack.wells()[7].load_liquid(liquid=def_blk, volume=vol_std)


    def transfer(vol_1, vol_2, start_loc, end_1_loc, end_2_loc, pip, tips):
        for start, end_1, end_2 in zip(start_loc, end_1_loc, end_2_loc):
            pip.tip_racks = tips

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
            
        p1k_8.tip_racks = tips_50 
        p1k_8.pick_up_tip()
        p1k_8.mix(2, VOL_SAMPLE+VOL_SAMPLE, start)
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
        p1k_8.tip_racks = tips_50
        p1k_8.pick_up_tip()
        for end_1, end_2 in zip(dilution_1_in_col, dilution_2_in_col):
            start = buffer
        
            p1k_8.mix(2, vol_buffer_dilution_1 + vol_buffer_dilution_2, buffer)
            p1k_8.blow_out(start.top(z=0))

            p1k_8.flow_rate.aspirate = 50

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

        p1k_8.drop_tip()


    ## add samples
    transfer(vol_dilution_1, vol_dilution_2, sample, dilution_1_in_col, dilution_2_in_col, p1k_8, tips_50)


    ## add working reagent
    p1k_8.tip_racks = [tips_200]
    p1k_8.pick_up_tip() 

    if num_col > 6:
        for i in range(6):   
            if i == 0: p1k_8.mix(1, VOL_WR, wr_1)
            p1k_8.aspirate(VOL_WR, wr_1)
            ctx.delay(seconds=1)
            end = rxn_col[i]
            p1k_8.dispense(VOL_WR, end.top(z=0))
            p1k_8.blow_out()
        
        col = num_col - 6
        for i in range(col):
            if i == 0: p1k_8.mix(1, VOL_WR, wr_2)
            p1k_8.aspirate(VOL_WR, wr_2)
            ctx.delay(seconds=1)
            end = rxn_col[6+i]
            p1k_8.dispense(VOL_WR, end.top(z=0))
            p1k_8.blow_out()              

    else:
        for i in range(num_col):
            if i == 0: p1k_8.mix(1, VOL_WR, wr_1)
            p1k_8.aspirate(VOL_WR, wr_1)
            ctx.delay(seconds=1)
            end = rxn_col[i]
            p1k_8.dispense(VOL_WR, end.top(z=0))
            p1k_8.blow_out()  
    
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
    
    hs.set_target_temperature(37)  

    del ctx.deck['C2']
    ctx.move_labware(labware = working_plate_lid,
                    new_location = 'C2',
                    use_gripper=True,
                    pick_up_offset={'x':0, 'y':0, 'z':-4},
                    drop_offset={'x':0,'y':0,'z':3}
                    ) 
    
    hs.wait_for_temperature() 

    del ctx.deck['C2']
    working_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 'C2', 'WORKING PLATE') 

    #hs.set_and_wait_for_temperature(37)

    ctx.move_labware(labware = working_plate,
                     new_location = hs_adapter,
                     use_gripper=True,
                     pick_up_offset={'x':0, 'y':0, 'z':-7},
                     drop_offset={'x':0,'y':0,'z':-8}
                    )
    
    ctx.delay(minutes=time_incubation)
    hs.deactivate_heater()

    ctx.move_labware(labware = working_plate,
                     new_location = 'C2',
                     use_gripper=True,
                     pick_up_offset={'x':0, 'y':0, 'z':-6},
                     drop_offset={'x':-2,'y':0,'z':-7}
                    ) 

    del ctx.deck['C2']
    working_plate_lid = ctx.load_labware('corning_96_wellplate_360ul_flat', 'C2')         
    ctx.move_labware(labware = working_plate_lid,
                     new_location = 'D2',
                     use_gripper=True,
                     pick_up_offset={'x':0, 'y':0, 'z':3},
                     drop_offset={'x':0,'y':0,'z':-5}
                     )  

    ## read plate   
    reader.close_lid()

    if wavelength_ref:
        reader.initialize('single', [562], reference_wavelength=650)      
    else: reader.initialize('single', [562])

    reader.open_lid()
    working_plate = ctx.load_labware('corning_96_wellplate_360ul_flat', 'C2')
    ctx.move_labware(labware = working_plate,
                     new_location = reader,
                     use_gripper=True
                    ) 
    reader.close_lid()
    
    result = reader.read(export_filename="output.csv")

    reader.open_lid()
    ctx.move_labware(labware = working_plate, 
                     new_location = 'C2', 
                     use_gripper=True
                    )
    reader.close_lid()


    ## correct raw data with blank
    full_plate = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1',
                  'A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2',
                  'A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3',
                  'A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4',
                  'A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5',
                  'A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6',
                  'A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7',
                  'A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8',
                  'A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9',
                  'A10', 'B10', 'C10', 'D10', 'E10', 'F10', 'G10', 'H10',
                  'A11', 'B11', 'C11', 'D11', 'E11', 'F11', 'G11', 'H11',
                  'A12', 'B12', 'C12', 'D12', 'E12', 'F12', 'G12', 'H12'
                  ]
    
    od_full_plate = [-1, -1, -1, -1, -1, -1, -1, -1,
                     -1, -1, -1, -1, -1, -1, -1, -1,
                     -1, -1, -1, -1, -1, -1, -1, -1,
                     -1, -1, -1, -1, -1, -1, -1, -1,
                     -1, -1, -1, -1, -1, -1, -1, -1,
                     -1, -1, -1, -1, -1, -1, -1, -1,
                     -1, -1, -1, -1, -1, -1, -1, -1,
                     -1, -1, -1, -1, -1, -1, -1, -1,
                     -1, -1, -1, -1, -1, -1, -1, -1,
                     -1, -1, -1, -1, -1, -1, -1, -1,
                     -1, -1, -1, -1, -1, -1, -1, -1,
                     -1, -1, -1, -1, -1, -1, -1, -1
                    ]

    if result is not None:
        for a, well in enumerate(full_plate):
            od_full_plate[a] = result[562][well]

    for col in range(2):
        display = [0, 0, 0, 0, 0, 0, 0, 0]
        for raw in range(8):
            display[raw] = round(od_full_plate[col*8+raw], 3)
        ctx.pause('Column # '+str(col+1)+': '+str(display))

    od_blk = round((od_full_plate[7]+od_full_plate[7+8])/2, 3)   

    for k in range(96):
        od_full_plate[k] = od_full_plate[k] - od_blk
        if od_full_plate[k] < 0:
            od_full_plate[k] = -1

    ## estimate concentrations of unknowns by point-to-point fit
    od_std = []
    for l in range(6):
        od_std.append(round((od_full_plate[l]+od_full_plate[l+8])/2 - od_blk, 3))
        if l > 0:
            if od_std[l] > od_std[l-1]: raise Exception('Invalid Standards')

    od_unknown_1 = od_full_plate[16:16+num_sample]
    od_unknown_2 = od_full_plate[(16+num_sample):(16+num_sample+num_sample)]

    conc_unknown_1 = []
    conc_unknown_2 = []

    for count in range(num_sample):
        if od_unknown_1[count] < od_std[5] or od_unknown_1[count] > od_std[0]:
            od_unknown_1[count] = -1

        conc_unknown_1.append(-1)

        if od_unknown_2[count] < od_std[5] or od_unknown_2[count] > od_std[0]:
            od_unknown_2[count] = -1

        conc_unknown_2.append(-1)

    for m in range(num_sample):
        for n in range(6):
            if n < 5:
                if od_unknown_1[m] < od_std[n] and od_unknown_1[m] > od_std[n+1]:
                    conc_unknown_1[m] = (1/dilution_1) * (round((od_unknown_1[m] * (conc_std[n+1]-conc_std[n]) - od_std[n] * (conc_std[n+1]-conc_std[n]) + conc_std[n] * (od_std[n+1]-od_std[n]))/(od_std[n+1]-od_std[n]), 3))

                if od_unknown_2[m] < od_std[n] and od_unknown_2[m] > od_std[n+1]:
                    conc_unknown_2[m] = (1/dilution_2) * (round((od_unknown_2[m] * (conc_std[n+1]-conc_std[n]) - od_std[n] * (conc_std[n+1]-conc_std[n]) + conc_std[n] * (od_std[n+1]-od_std[n]))/(od_std[n+1]-od_std[n]), 3))

        if od_unknown_1[m] == od_std[n]: conc_unknown_1[m] = (1/dilution_1) * round(conc_std[n], 3)
        if od_unknown_2[m] == od_std[n]: conc_unknown_2[m] = (1/dilution_2) * round(conc_std[n], 3)


    ## calculate volumes to transfer
    
    conc_unknown_final = []

    for x in range(num_sample):
        if conc_unknown_1[x] > 0:
            if conc_unknown_2[x] > 0:
                conc_unknown_final.append((conc_unknown_1[x]+conc_unknown_2[x])/2)
            else:
                conc_unknown_final.append(conc_unknown_1[x])
        else:
            if conc_unknown_2[x] > 0:
                conc_unknown_final.append(conc_unknown_2[x])         
            else:
                conc_unknown_final.append(-1)

    conc_final = amount_final * 1000 / vol_final

    vol_unknown = []
    vol_diluent = []

    for y in range(num_sample):
        if conc_unknown_final[y] < 0:
            ctx.pause('Sample #'+str(y+1)+': Out of assay range')
            vol_unknown.append(-1)
            vol_diluent.append(-1)
        else:
            if conc_unknown_final[y] < conc_final:
                ctx.pause('Sample #'+str(y+1)+': Estimated concentration lower than target concentration')
                vol_unknown.append(-1)
                vol_diluent.append(-1)
            else:
                vol = int(round(vol_final * conc_final / conc_unknown_final[y]))

                if vol < VOL_PIPET_LIMIT:
                    ctx.pause('Sample #'+str(y+1)+': Sample volume to be transferred lower than pipette limit')
                    vol_unknown.append(-1)
                    vol_diluent.append(-1)     
                elif vol_final-vol < VOL_PIPET_LIMIT: 
                    ctx.pause('Sample #'+str(y+1)+': Diluent volume to be transferred lower than pipette limit')
                    vol_unknown.append(-1)
                    vol_diluent.append(-1)        
                else:                     
                    vol_unknown.append(vol)
                    vol_diluent.append(vol_final-vol)

    
    ## transfer diluent
    i_200 = []
    i_50 = []
    for i, vol in enumerate(vol_diluent):
        if vol > 0:
            if vol > 30: i_200.append(i)
            else: i_50.append(i)

    count_200 = len(i_200)
    count_50 = len(i_50)

    if count_200 > 0:
        p1k_1.tip_racks = [tips_200]
        p1k_1.pick_up_tip()

        for j in range(count_200):
            vol = vol_diluent[i_200[j]]
            well = i_200[j]

            p1k_1.flow_rate.aspirate = vol*2
            p1k_1.flow_rate.dispense = vol*2
         
            p1k_1.aspirate(vol, buffer)
            ctx.delay(seconds=1)
            p1k_1.dispense(vol, final[well].bottom(z=10))
            ctx.delay(seconds=1)
            p1k_1.blow_out(final[well].top(z=0))  

        p1k_1.drop_tip()

    if count_50 > 0:
        p1k_1.tip_racks = tips_50
        p1k_1.pick_up_tip()

        for j in range(count_50):
            vol = vol_diluent[i_50[j]]
            well = i_50[j]

            p1k_1.flow_rate.aspirate = vol*2
            p1k_1.flow_rate.dispense = vol*2
         
            p1k_1.aspirate(vol, buffer)
            ctx.delay(seconds=1)
            p1k_1.dispense(vol, final[well].bottom(5))
            ctx.delay(seconds=1)
            p1k_1.move_to(final[well].bottom(z=8).move(types.Point(x=final[well].diameter/2-0.5)))
            
        p1k_1.drop_tip()


    ## transfer samples          
    for j, vol in enumerate(vol_unknown):
        if vol > 0:
            if vol > 30: 
                p1k_1.tip_racks = [tips_200]
            else: p1k_1.tip_racks = tips_50

            source = sample_in_well[j]

            p1k_1.flow_rate.aspirate = vol
            p1k_1.flow_rate.dispense = vol

            p1k_1.pick_up_tip()
        
            p1k_1.aspirate(10, source.top(z=0))
            p1k_1.aspirate(vol, source)
            ctx.delay(seconds=1)
            p1k_1.dispense(vol+5, final[j].top(z=-2))

            p1k_1.flow_rate.aspirate = 300
            p1k_1.flow_rate.dispense = 300

            p1k_1.mix(2, vol_final*0.3, final[j].bottom(z=2))
            p1k_1.blow_out(final[j].top(z=-2)) 
            p1k_1.move_to(final[j].top(z=-2).move(types.Point(x=final[j].diameter/2-0.5)))

            p1k_1.drop_tip()