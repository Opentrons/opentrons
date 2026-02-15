from opentrons import types

metadata = {
    'protocolName': 'MILLIPLEX Human Cytokine Panel A - Overnight Assay Day 1',
    'author': 'Science Team, Opentrons'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23"
}


########################


def add_parameters(parameters):
    parameters.add_bool(variable_name="dry_run",
                        display_name="Dry Run",
                        description=("All incubation steps skipped and tips returned to tipracks"),
                        default=False
                        )
    parameters.add_int(variable_name="num_sample",
                       display_name="Number of Samples",
                       description="Number of samples to be processed in duplicate (maximum: 38)",
                       default=38,
                       minimum=0,
                       maximum=38
                       )
    parameters.add_int(variable_name="std_dilu",
                      display_name="Standard Curve Dilution Scheme",
                      description="Check standard lot to determine dilution requirement",
                      default=1,
                      choices=[
                               {"display_name": "1:4", "value": 1},
                               {"display_name": "1:5", "value": 2}
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
    parameters.add_str(variable_name="matrix_type",
                      display_name="Sample Matrix Type",
                      description="Type of samples to be processed",
                      default="Serum Matrix",
                      choices=[
                               {"display_name": "Serum Matrix", "value": "Serum Matrix"},
                               {"display_name": "Cell Culture Medium", "value": "Cell Culture Medium"},
                               {"display_name": "Assay Buffer", "value": "Assay Buffer"}
                              ]
                      )

    
def run(ctx):

    global dry_run
    global num_sample
    global std_dilu
    global pipet_location
    global matrix_type

    global num_col_reagent_plate

    global num_rxn
    global num_col

    global vol_assay_well
    global vol_std_transfer
    global MPX_kit

    dry_run = ctx.params.dry_run
    num_sample = ctx.params.num_sample
    std_dilu = ctx.params.std_dilu
    pipet_location = ctx.params.pipet_location
    matrix_type = ctx.params.matrix_type

    if num_sample > 0:

        if num_sample < 7:
            num_col_reagent_plate = 2 

        else:
            num_col_reagent_plate = int((num_sample-6)//8)+2
            if (num_sample-6)%8 != 0: num_col_reagent_plate = num_col_reagent_plate + 1

    else: 
        num_col_reagent_plate = 2
 
    num_rxn = 20 + (num_sample * 2) 
    ## total wells in assay plate  

    num_col = num_col_reagent_plate * 2
    ## total columns in assay plate 

    if std_dilu == 1:
        vol_assay_well = 150
        vol_std_transfer = 50
    else:
        vol_assay_well = 200
        vol_std_transfer = 50        


    if pipet_location == 1:
        p1k_1_loc = 'right'
        p1k_8_loc = 'left'
    else:
        p1k_1_loc = 'left'
        p1k_8_loc = 'right'

    MPX_kit = 'HCYTA-60K'

    ctx.comment(f"Selected Matrix Type: {matrix_type}")   
        

    # deck layout

    hs = ctx.load_module('heaterShakerModuleV1', 'D1')
    hs_adapter = hs.load_adapter('opentrons_universal_flat_adapter_type_b')
    assay_plate = hs_adapter.load_labware('milliplex_r_96_well_microtiter_plate', 'ASSAY PLATE')
    rxn_end = assay_plate.rows()[0][:num_col]
    rxn_end_in_well = assay_plate.wells()[:num_col*8]

    reagent_plate = ctx.load_labware('axygen_96_wellplate_500ul', 'D2', 'REAGENT/WORKING PLATE') 
    rxn_start = reagent_plate.rows()[0][:num_col_reagent_plate] 
    std_prep = reagent_plate.wells()[0:8] 
    bead = reagent_plate.rows()[0][6]
    bead_well = reagent_plate.wells()[48:56]

    buffer_res = ctx.load_labware('nest_12_reservoir_15ml', 'C2', 'ASSAY BUFFER')
    assay_buffer = buffer_res.wells()[0]

    buffer_rack = ctx.load_labware('opentrons_15_tuberack_eppendorf_15ml_conical_amber', 'B1', 'MIXED BEADS & SERUM MATRIX')
    bead_stock = buffer_rack.wells()[0]
    sm = buffer_rack.wells()[1] 

    
    ctx.load_trash_bin("D3")

    tips_1k = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'C3', '1000uL TIPS')
    tips_200 = [ctx.load_labware('opentrons_flex_96_tiprack_200ul', slot, '200uL TIPS')
                for slot in ['B2', 'B3']]

    p1k_1 = ctx.load_instrument('flex_1channel_1000', p1k_1_loc) 
    p1k_8 = ctx.load_instrument('flex_8channel_1000', p1k_8_loc) 


    # liquid info

    ctx.comment(f"Volume of Assay Buffer in Std Curve: {vol_assay_well}; Volume of STD Transfer: {vol_std_transfer}; MILLIPLEX(R) Kit Being Used: {MPX_kit}")

    if num_sample > 0:
        vol_sample = 25 * 2 + 35 
        def_sample = ctx.define_liquid(name="Samples", description=" ", display_color="#50C878")  ## Green
        for well in range(num_sample):
            reagent_plate.wells()[10+well].load_liquid(liquid=def_sample, volume=vol_sample) 

    vol_qc = 25 * 2 + 50
    def_qc1 = ctx.define_liquid(name="QC1", description=" ", display_color="#FF0000")  ## Red 
    def_qc2 = ctx.define_liquid(name="QC2", description=" ", display_color="#FF0000")  ## Red 
    reagent_plate.wells()[8].load_liquid(liquid=def_qc1, volume=vol_qc) 
    reagent_plate.wells()[9].load_liquid(liquid=def_qc2, volume=vol_qc)    


    vol_bead = 25 * num_rxn + 25 * num_rxn * 0.2 + 300
    def_bead = ctx.define_liquid(name="Mixed Beads", description=" ", display_color="#FF5349")  # Red-Orange
    buffer_rack.wells()[0].load_liquid(liquid=def_bead, volume=vol_bead)   

    vol_sm = 25 * 20 + 100
    def_sm = ctx.define_liquid(name=matrix_type, description=matrix_type, display_color="#D2B48C") ## Tan
    buffer_rack.wells()[1].load_liquid(liquid=def_sm, volume=vol_sm)

    vol_std = 250 
    def_std = ctx.define_liquid(name="Standard 7", description=" ", display_color="#0000FF") ## Blue
    reagent_plate.wells()[7].load_liquid(liquid=def_std, volume=vol_std) #chnaged from 15 to 7

    vol_assay = (num_col-3-1) * 25 * 8 + 2000 + 1500
    def_assay = ctx.define_liquid(name="Assay Buffer", description=" ", display_color="#ADD8E6")  # Light blue
    buffer_res.wells()[0].load_liquid(liquid=def_assay, volume=vol_assay)

     


    # protocol 

    ## prepare working standards

    ### add assay buffer
    hs.close_labware_latch()

    p1k_1.tip_racks = [tips_1k]
    p1k_1.pick_up_tip()

    vol = vol_assay_well/2
    
    for _ in range(2):
        p1k_1.aspirate(vol*7+50, assay_buffer.bottom(z=1), rate=0.75)    
        ctx.delay(seconds=0.25)
        p1k_1.dispense(vol*7-50, assay_buffer.bottom(z=1), rate=0.75)
        p1k_1.aspirate(vol*7-50, assay_buffer.bottom(z=1), rate=0.75)
        ctx.delay(seconds=0.25)
        p1k_1.default_speed /= 16
        p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.5,z=-2)))
        ctx.delay(seconds=0.5)
        p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.5,z=4)))
        p1k_1.default_speed *= 16
        for i in range(7):
            p1k_1.dispense(vol, std_prep[i].bottom(z=1), rate=0.25) 
            ctx.delay(seconds=1) 
    if dry_run: p1k_1.return_tip()
    else: p1k_1.drop_tip()
    
    ### make serial dilutions
    p1k_1.tip_racks = tips_200
    for i in reversed(range(6)):
        p1k_1.pick_up_tip()
        p1k_1.aspirate(vol_std_transfer, std_prep[i+2].bottom(z=1), rate=0.25)
        ctx.delay(seconds=1)
        p1k_1.dispense(vol_std_transfer-1, std_prep[i+1].bottom(z=1.5), rate=0.5) 
        ctx.delay(seconds=1)
        for _ in range(10):
            p1k_1.aspirate(100, std_prep[i+1].bottom(z=1.5), rate = 0.75) 
            p1k_1.dispense(99.9, std_prep[i+1].bottom(z=1.5), rate = 0.75)
        p1k_1.dispense(p1k_1.current_volume, std_prep[i+1].bottom(z=3), rate = 0.5) 
        if dry_run: p1k_1.return_tip()
        else: p1k_1.drop_tip()

    ## add serum matrix and assay buffer

    ### add serum matrix
    p1k_1.tip_racks = [tips_1k]
    p1k_1.pick_up_tip()
    p1k_1.aspirate(550, sm.bottom(z=1), rate=0.1)
    p1k_1.default_speed /= 10
    p1k_1.move_to(sm.top(z=-5))
    ctx.delay(seconds=1) 
    p1k_1.move_to(sm.top(z=-5).move(types.Point(x=sm.diameter/2-0.1)))
    ctx.delay(seconds=1) 
    p1k_1.default_speed *= 10
    for well in range(16):
        p1k_1.dispense(25, rxn_end_in_well[well].bottom(z=0.6), rate = 0.1)
        ctx.delay(seconds=1)
    for well in [16, 17, 24, 25]:
        p1k_1.dispense(25, rxn_end_in_well[well].bottom(z=0.6), rate = 0.1)
        ctx.delay(seconds=1)       
    if dry_run: p1k_1.return_tip()
    else: p1k_1.drop_tip()

    ### add assay buffer 
    p1k_1.tip_racks = tips_200
    p1k_8.tip_racks = tips_200

    if num_sample > 0:

        if num_sample < 7:
            p1k_1.pick_up_tip()
            for n in range(2):
                p1k_1.aspirate(25*num_sample+25, assay_buffer.bottom(z=2), rate = 0.2)    
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 16
                p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.6,z=-2)))
                ctx.delay(seconds=0.5)
                p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.6,z=4)))
                p1k_1.default_speed *= 16
                for i in range(num_sample):
                    p1k_1.dispense(25, rxn_end_in_well[8*n+18+i].bottom(z=0.6), rate = 0.2)
                    ctx.delay(seconds=1)
            if dry_run: p1k_1.return_tip()
            else: p1k_1.drop_tip()  

        else:
            p1k_1.pick_up_tip()
            for n in range(2):
                p1k_1.aspirate(25*6+25, assay_buffer.bottom(z=2), rate = 0.25)    
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 16
                p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.6,z=-2)))
                ctx.delay(seconds=0.5)
                p1k_1.move_to(assay_buffer.top().move(types.Point(x=-3.6,z=4)))
                p1k_1.default_speed *= 16
                for i in range(6):
                    p1k_1.dispense(25, rxn_end_in_well[8*n+18+i].bottom(z=0.6), rate = 0.25)
                    ctx.delay(seconds=1)
            if dry_run: p1k_1.return_tip()
            else: p1k_1.drop_tip() 


            if num_col-4 > 6:
                p1k_8.pick_up_tip()
                p1k_8.aspirate(25*6+10, assay_buffer.bottom(z=2), rate = 0.1)    
                p1k_8.default_speed /= 16
                p1k_8.move_to(assay_buffer.top().move(types.Point(x=-3.5,z=-2)))
                ctx.delay(seconds=0.5)
                p1k_8.move_to(assay_buffer.top().move(types.Point(x=-3.5,z=4)))
                p1k_8.default_speed *= 16    
                ctx.delay(seconds=1)                     
                for i in range(6):
                    p1k_8.dispense(25, rxn_end[4+i].bottom(z=0.6), rate = 0.1)
                    ctx.delay(seconds=1)
                p1k_8.aspirate(25*(num_col-4-6), assay_buffer.bottom(z=2), rate = 0.1)    
                p1k_8.default_speed /= 16
                p1k_8.move_to(assay_buffer.top().move(types.Point(x=-3.5,z=-2)))
                ctx.delay(seconds=0.5)
                p1k_8.move_to(assay_buffer.top().move(types.Point(x=-3.5,z=4)))
                p1k_8.default_speed *= 16    
                ctx.delay(seconds=1)                     
                for i in range(num_col-4-6):
                    p1k_8.dispense(25, rxn_end[4+6+i].bottom(z=0.6), rate = 0.1)
                    ctx.delay(seconds=1)              
                if dry_run: p1k_8.return_tip()
                else: p1k_8.drop_tip()
            else:
                p1k_8.pick_up_tip()
                p1k_8.aspirate(25*(num_col-4)+10, assay_buffer.bottom(z=2), rate = 0.1)    
                p1k_8.default_speed /= 16
                p1k_8.move_to(assay_buffer.top().move(types.Point(x=-3.5,z=-2)))
                ctx.delay(seconds=0.5)
                p1k_8.move_to(assay_buffer.top().move(types.Point(x=-3.5,z=4)))
                p1k_8.default_speed *= 16    
                ctx.delay(seconds=1)                     
                for i in range(num_col-4):
                    p1k_8.dispense(25, rxn_end[4+i].bottom(z=0.6), rate = 0.1)
                    ctx.delay(seconds=1)             
                if dry_run: p1k_8.return_tip()
                else: p1k_8.drop_tip()             


    hs.set_and_wait_for_shake_speed(rpm=700)
    ctx.delay(minutes=0.1 if dry_run else 0.1)
    hs.deactivate_shaker()

    ## transfer standards, QC and samples from reagent plate 
    for col in range(num_col_reagent_plate):
        p1k_8.tip_racks = tips_200
        p1k_8.pick_up_tip()
        p1k_8.aspirate(25*2+10, rxn_start[col].bottom(z=1), rate = 0.25) 
        p1k_8.dispense(25*2, rxn_start[col].bottom(z=1), rate = 0.25)
        p1k_8.aspirate(25*2, rxn_start[col].bottom(z=1), rate = 0.25)
        ctx.delay(seconds=1)
        for n in range(2):
            p1k_8.dispense(25, rxn_end[col*2+n].bottom(z=0.8), rate = 0.25)       
            ctx.delay(seconds=1)
        p1k_8.dispense(p1k_8.current_volume, rxn_start[col].bottom(z=3), rate = 0.25)
        if dry_run: p1k_8.return_tip()
        else: p1k_8.drop_tip()

    hs.set_and_wait_for_shake_speed(rpm=700)
    ctx.delay(minutes=0.1 if dry_run else 0.1)
    hs.deactivate_shaker()



    ## add beads
    count = num_sample + 10
    count_full = int(count//8)

    col_full = int(count//8) * 2
    well_last = count%8

    vol_dist = 25 * col_full + 55
    num_well = 8

    ### fill full columns
    if col_full > 0:
        p1k_1.tip_racks = [tips_1k]
        p1k_1.pick_up_tip()

        p1k_1.aspirate(vol_dist+5, bead_stock.bottom(z=2), rate = 0.5) 
        p1k_1.dispense(vol_dist, bead_stock.bottom(z=2), rate = 0.5) 
        p1k_1.aspirate(vol_dist, bead_stock.bottom(z=2), rate = 0.5) 
        p1k_1.dispense(vol_dist, bead_stock.bottom(z=2), rate = 0.5) 
        p1k_1.aspirate(vol_dist, bead_stock.bottom(z=2), rate = 0.5) 
        p1k_1.dispense(vol_dist, bead_stock.bottom(z=2), rate = 0.5) 
         
        for i in range(num_well):
            p1k_1.aspirate(vol_dist, bead_stock.bottom(z=2), rate = 0.5) 
            p1k_1.dispense(vol_dist, bead_stock.bottom(z=2), rate = 0.5) 
            ctx.delay(seconds=1)    

            end = bead_well[i]
            p1k_1.aspirate(vol_dist, bead_stock.bottom(z=2), rate = 0.5) 
            ctx.delay(seconds=1)
            p1k_1.default_speed /= 10
            p1k_1.move_to(bead_stock.top(z=-5))
            ctx.delay(seconds=1) 
            p1k_1.move_to(bead_stock.top(z=-5).move(types.Point(x=bead_stock.diameter/2-0.1)))
            ctx.delay(seconds=1) 
            p1k_1.default_speed *= 10  
            p1k_1.dispense(vol_dist, end.bottom(z=2), rate = 0.5)
            ctx.delay(seconds=1) 
            p1k_1.default_speed /= 20
            p1k_1.move_to(end.top(z=-2))
            p1k_1.default_speed *= 20

        if dry_run: p1k_1.return_tip()
        else: p1k_1.drop_tip()


        p1k_8.tip_racks = tips_200

        for i in range(count_full):

            p1k_8.pick_up_tip()

            p1k_8.aspirate(25*2+5, bead.bottom(z=2), rate = 0.5) 
            p1k_8.dispense(25*2, bead.bottom(z=2), rate = 0.5) 
            p1k_8.aspirate(25*2, bead.bottom(z=2), rate = 0.5) 
            p1k_8.dispense(25*2, bead.bottom(z=2), rate = 0.5) 
            p1k_8.aspirate(25*2, bead.bottom(z=2), rate = 0.5)
            ctx.delay(seconds=1)      

            end_1 = rxn_end[i*2]
            end_2 = rxn_end[i*2+1]

            p1k_8.dispense(25, end_1.bottom(z=0.8), rate = 0.5)
            ctx.delay(seconds=1)

            p1k_8.dispense(25, end_2.bottom(z=0.8), rate = 0.5)
            ctx.delay(seconds=1)

            if dry_run: p1k_8.return_tip()
            else: p1k_8.drop_tip()


    ### fill partial columns
    if well_last > 0:
        p1k_1.tip_racks = tips_200

        for well in range(well_last):

            p1k_1.pick_up_tip()

            vol_last = 25 * 2

            p1k_1.aspirate(vol_last+5, bead_stock.bottom(z=2), rate = 0.5) 
            p1k_1.dispense(vol_last, bead_stock.bottom(z=2), rate = 0.5) 
            p1k_1.aspirate(vol_last, bead_stock.bottom(z=2), rate = 0.5) 
            p1k_1.dispense(vol_last, bead_stock.bottom(z=2), rate = 0.5) 
            p1k_1.aspirate(vol_last, bead_stock.bottom(z=2), rate = 0.5) 
            ctx.delay(seconds=1) 

            for x in [0, 8]:


                end = rxn_end_in_well[col_full*8+well+x]
                
                p1k_1.dispense(25, end.bottom(z=0.8), rate = 0.5)
                ctx.delay(seconds=1)

            if dry_run: p1k_1.return_tip()
            else: p1k_1.drop_tip()



    hs.set_and_wait_for_shake_speed(rpm=700)
    ctx.delay(minutes=0.1 if dry_run else 0.25)
    hs.deactivate_shaker()
    hs.open_labware_latch()
    ctx.comment('Seal Assay Plate and incubate with agitation for 16-18 hours at 2-8 degrees C')
