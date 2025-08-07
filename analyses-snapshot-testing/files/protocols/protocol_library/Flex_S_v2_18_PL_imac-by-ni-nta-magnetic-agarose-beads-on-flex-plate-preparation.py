from opentrons.types import Point

metadata = {
    'protocolName': 'Immobilized Metal Affinity Chromatography by Ni-NTA Magnetic Agarose Beads (plate preparation) - 96-well setting on Opentrons Flex',
    'author': 'Boren Lin, Opentrons',
    'description': 'This protocol prepares reagent plates for automated immobilized metal affinity chromatography (IMAC) using Ni-NTA magnetic agarose beads (up to 96 samples).'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.18",
}

########################

ASP_HEIGHT = 0.2
BEADS_VOL = 100
EQUILIBRATION_VOL1 = 400
EQUILIBRATION_VOL2 = 500
SAMPLE_VOL = 500
WASH_TIMES = 2
WASH_VOL = 500
ELUTION_VOL = 250

def add_parameters(parameters):   
    parameters.add_int(variable_name="num_col",
                       display_name="Columns of Samples",
                       description="How many columns in a 96-well plate filled with samples (up to 12)?",
                       default=12,
                       minimum=1,
                       maximum=12
                       )
    
    parameters.add_int(variable_name="elution_times",
                      display_name="Second Elution",
                      description="Will captured proteins be eluted twice?",
                      default=1,
                      choices=[
                               {"display_name": "Yes", "value": 2},
                               {"display_name": "No", "value": 1}
                              ]
                      ) 
    
    parameters.add_int(variable_name="beads_preload",
                      display_name="Beads Pre-loaded",
                      description="Prepare the working plate with beads pre-loaded?",
                      default=1,
                      choices=[
                               {"display_name": "Yes", "value": 1},
                               {"display_name": "No", "value": 0}
                              ]
                      )   
    
    parameters.add_int(variable_name="pipet_loc",
                      display_name="8-ch Pipette Position",
                      description="How the 8-channel pipette is mounted?",
                      default=1,
                      choices=[
                               {"display_name": "on the right", "value": 1},
                               {"display_name": "on the left", "value": 2}
                              ]
                      )
    
#########################

def run(ctx):

    global num_col
    global elution_times
    global beads_preload
    global pipet_loc

    num_col = ctx.params.num_col
    elution_times = ctx.params.elution_times
    beads_preload = ctx.params.beads_preload    
    pipet_loc = ctx.params.pipet_loc

    if pipet_loc == 1:
        p1k_8_loc = 'right'
        #p1k_1_loc = 'left'
    else:
        p1k_8_loc = 'left'
        #p1k_1_loc = 'right'

    # load labware

    eql_res = ctx.load_labware('nest_96_wellplate_2ml_deep', 'B2', 'equilibration buffer')
    wash_res = ctx.load_labware('nest_96_wellplate_2ml_deep', 'C3', 'wash buffer')
    elution_res = ctx.load_labware('nest_96_wellplate_2ml_deep', 'A2', 'elution buffer')

    eql_stock = ctx.load_labware('nest_1_reservoir_290ml', 'B1', 'equilibration buffer')
    wash_stock = ctx.load_labware('nest_1_reservoir_290ml', 'B3', 'wash buffer')
    elution_stock = ctx.load_labware('nest_1_reservoir_290ml', 'A1', 'elution buffer')

    ctx.load_trash_bin('A3')
    
    if beads_preload == 1: 
        beads_stock = ctx.load_labware('nest_12_reservoir_15ml', 'D2', 'beads')
        h_s = ctx.load_module('heaterShakerModuleV1', 'D1')
        h_s_adapter = h_s.load_adapter('opentrons_96_deep_well_adapter')
        working_plate = h_s_adapter.load_labware("nest_96_wellplate_2ml_deep", 'working plate')

    tips = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'C2')
    p1k_8 = ctx.load_instrument('flex_8channel_1000', p1k_8_loc, tip_racks=[tips]) 
    default_rate = 700
    p1k_8.flow_rate.aspirate = default_rate
    p1k_8.flow_rate.dispense = default_rate

    # liquids
            
    eql_vol_source = (num_col-1)*(EQUILIBRATION_VOL1+EQUILIBRATION_VOL2+50)*8+24000
    eql_def = ctx.define_liquid(name="EQUILIBRATION", description="Equilibration Buffer", display_color="#9ACECB")  ## Blue
    eql_stock.wells()[0].load_liquid(liquid=eql_def, volume=eql_vol_source)     

    wash_vol_source = (num_col-1)*(WASH_VOL*WASH_TIMES+50)*8+24000
    wash_def = ctx.define_liquid(name="WASH", description="Wash Buffer", display_color="#FF0000")  ## Red
    wash_stock.wells()[0].load_liquid(liquid=wash_def, volume=wash_vol_source)    

    elu_vol_source = (num_col-1)*(ELUTION_VOL*elution_times+50)*8+24000
    elu_def = ctx.define_liquid(name="ELUTION", description="Elution Buffer", display_color="#00FFF2")  ## Light Blue
    elution_stock.wells()[0].load_liquid(liquid=elu_def, volume=elu_vol_source)

    eql = eql_res.rows()[0][:num_col]
    wash = wash_res.rows()[0][:num_col]
    elu = elution_res.rows()[0][:num_col] # reagent 1

    eql_source = eql_stock.wells()[0]
    wash_source = wash_stock.wells()[0]
    elu_source = elution_stock.wells()[0]

    if beads_preload == 1:
        if num_col <= 6: 
            beads_vol_stock = (num_col-1)*8*BEADS_VOL+2000
            beads_def = ctx.define_liquid(name="BEADS", description="Ni-NTA Bead Slurry", display_color="#704848")  ## Brown
            beads_stock.wells()[0].load_liquid(liquid=beads_def, volume=beads_vol_stock)  
        else: 
            beads_vol_stock_1 = 6000 
            beads_vol_stock_2 = (num_col-7)*8*BEADS_VOL+2000
            beads_def_1 = ctx.define_liquid(name="BEADS", description="Ni-NTA Bead Slurry", display_color="#704848")  ## Brown
            beads_def_2 = ctx.define_liquid(name="BEADS", description="Ni-NTA Bead Slurry", display_color="#704848")  ## Brown
            beads_stock.wells()[0].load_liquid(liquid=beads_def_1, volume=beads_vol_stock_1)  
            beads_stock.wells()[1].load_liquid(liquid=beads_def_2, volume=beads_vol_stock_2)  

        beads = beads_stock.wells()[0:2]
        working_cols = working_plate.rows()[0][:num_col]

    def transfer_beads(vol, end):
        if num_col <= 6:
            start = beads[0]
            p1k_8.pick_up_tip()
            p1k_8.mix(5, vol*num_col*0.5, start.bottom(z=ASP_HEIGHT))
            p1k_8.mix(5, vol*num_col*0.5, start.bottom(z=ASP_HEIGHT*2))
            p1k_8.aspirate(vol*num_col, start.bottom(z=ASP_HEIGHT))
            p1k_8.air_gap(10)
            end_loc = end[0]
            p1k_8.flow_rate.dispense = 500
            p1k_8.dispense(10, end_loc.top(z=0))
            p1k_8.flow_rate.dispense = default_rate
            for i in range(num_col):
                end_loc = end[i]
                p1k_8.flow_rate.dispense = 500
                p1k_8.dispense(vol, end_loc.top(z=-5))  
                p1k_8.flow_rate.dispense = default_rate
            p1k_8.blow_out()      
            p1k_8.drop_tip()
        else:
            start1 = beads[0]
            p1k_8.pick_up_tip()
            p1k_8.mix(5, vol*6*0.5, start1.bottom(z=ASP_HEIGHT))
            p1k_8.mix(5, vol*6*0.5, start1.bottom(z=ASP_HEIGHT*2))
            p1k_8.aspirate(vol*6, start1.bottom(z=ASP_HEIGHT))
            p1k_8.air_gap(10)
            end_loc = end[0]
            p1k_8.flow_rate.dispense = 500
            p1k_8.dispense(10, end_loc.top(z=0))
            p1k_8.flow_rate.dispense = default_rate
            for i in range(6):
                end_loc = end[i]
                p1k_8.flow_rate.dispense = 500
                p1k_8.dispense(vol, end_loc.top(z=-5))   
                p1k_8.flow_rate.dispense = default_rate
            p1k_8.blow_out() 

            cols = num_col - 6

            start2 = beads[1]
            p1k_8.mix(5, vol*cols*0.5, start2.bottom(z=ASP_HEIGHT))
            p1k_8.mix(5, vol*cols*0.5, start2.bottom(z=ASP_HEIGHT*2))
            p1k_8.aspirate(vol*cols, start2.bottom(z=ASP_HEIGHT))
            p1k_8.air_gap(10)
            end_loc = end[6]
            p1k_8.flow_rate.dispense = 500
            p1k_8.dispense(10, end_loc.top(z=0))
            p1k_8.flow_rate.dispense = default_rate
            for j in range(cols):
                end_loc = end[j+6]
                p1k_8.flow_rate.dispense = 500
                p1k_8.dispense(vol, end_loc.top(z=-5))   
                p1k_8.flow_rate.dispense = default_rate
            p1k_8.blow_out() 
            p1k_8.drop_tip()            

    def transfer_buffer(vol, start, end):
        if vol > 800:
            n = int(vol//800)
            if vol%800 != 0: n = n + 1
            p1k_8.pick_up_tip()
            for _ in range(n):
                for j in range(num_col):
                    start_loc = start.bottom(z=ASP_HEIGHT).move(Point(x=j*9-49.5))
                    end_loc = end[j]
                    p1k_8.aspirate(vol/n, start_loc)
                    p1k_8.air_gap(10)
                    p1k_8.dispense(vol/n+10, end_loc.top(z=-5))        
            p1k_8.drop_tip()
        else:
            p1k_8.pick_up_tip()
            for j in range(num_col):
                start_loc = start.bottom(z=ASP_HEIGHT).move(Point(x=j*9-49.5))
                end_loc = end[j]
                p1k_8.aspirate(vol, start_loc)
                p1k_8.air_gap(10)
                p1k_8.dispense(vol+10, end_loc.top(z=-5))        
            p1k_8.drop_tip()

    # protocol

    if beads_preload == 1: 
        ## working plate w/ beads
        h_s.open_labware_latch()
        ctx.pause('Move the Working Plate to the Shaker')
        h_s.close_labware_latch()
        transfer_beads(BEADS_VOL, working_cols)
        h_s.open_labware_latch()

    ## wash buffer
    transfer_buffer(WASH_VOL*WASH_TIMES+50, wash_source, wash)
    ## equilibration buffer
    transfer_buffer(EQUILIBRATION_VOL1+EQUILIBRATION_VOL2+50, eql_source, eql)  
    ## elution buffer
    transfer_buffer(ELUTION_VOL*elution_times+50, elu_source, elu)