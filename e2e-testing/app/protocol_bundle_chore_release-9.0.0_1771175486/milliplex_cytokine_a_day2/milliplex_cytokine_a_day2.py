from opentrons import types

metadata = {
    'protocolName': 'MILLIPLEX Human Cytokine Panel A - Overnight Assay Day 2',
    'author': 'Science Team, Opentrons'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23"
}


########################

SPEED_SHAKE = 700


def add_parameters(parameters):
    parameters.add_bool(variable_name="dry_run",
                        display_name="Dry Run",
                        description=("All incubation steps skipped and tips returned to tipracks"),
                        default=False
                        )
    parameters.add_int(variable_name="plate_covering",
                       display_name="Plate Covering",
                       description=("Lid or seal the assay plate manually during incubation?"),
                       default=1,
                       choices=[
                                {"display_name": "with Plate Lid", "value": 1},
                                {"display_name": "with Aluminum Seal (manually)", "value": 2}
                               ]
                        )
    parameters.add_int(variable_name="num_sample",
                       display_name="Number of Samples",
                       description="Number of samples to be processed in duplicate (maximum: 38)",
                       default=38,
                       minimum=0,
                       maximum=38
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

    global dry_run
    global plate_covering
    global num_sample
    global pipet_location

    global MPX_kit

    global num_col_reagent_plate

    global num_rxn
    global num_col

    dry_run = ctx.params.dry_run
    plate_covering = ctx.params.plate_covering
    num_sample = ctx.params.num_sample
    pipet_location = ctx.params.pipet_location

    count_full = int((10+num_sample)//8)
    num_col_full = int((10+num_sample)//8)*2
    num_well_in_last_col = (10+num_sample)%8 


    MPX_kit = 'HCYTA-60K'

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

    if pipet_location == 1:
        p1k_1_loc = 'right'
        p1k_8_loc = 'left'
    else:
        p1k_1_loc = 'left'
        p1k_8_loc = 'right'


    # Debugging output
    ctx.comment(f"Selected MILLIPLEX(R) Kit: {MPX_kit}")

    # Define volumes based on selected kit using a dictionary
    kit_volumes_times = {
        "HCYTA-60K": (25, 60, 30, 150)
    }  

    # Assign volumes based on the selected kit
    if MPX_kit in kit_volumes_times:
        vol_DET_SAPE, detection_incubation,SAPE_incubation, sheath_well = kit_volumes_times[MPX_kit]
    else:
        vol_DET_SAPE = 0  # Default value if condition is not met
        detection_incubation = 0  # Default value if condition is not met
        SAPE_incubation = 0  # Default value if condition is not met
        sheath_well = 0  # Default value if condition is not met
        ctx.comment("Warning: No assay associated with the chosen kit, defaulting volumes to 0.")

    # Volume info
    ctx.comment(f"Volume of Detection/SAPE: {vol_DET_SAPE}; Detection Incubation Time: {detection_incubation}; SAPE Incubation Time: {SAPE_incubation}; MILLIPLEX(R) Kit Being Used: {MPX_kit}")
    
    # deck layout
    hs = ctx.load_module('heaterShakerModuleV1', 'D1')
    hs_adapter = hs.load_adapter('opentrons_universal_flat_adapter_type_b')
    assay_plate = hs_adapter.load_labware('milliplex_r_96_well_microtiter_plate', 'ASSAY PLATE')
    rxn_end = assay_plate.rows()[0][:num_col]

    rxn_in_full_col = assay_plate.rows()[0][:num_col_full]
    rxn_end_in_well = assay_plate.wells()[:num_col*8]
    if num_well_in_last_col > 0: 
        rxn_in_last_col_1 = assay_plate.wells()[(num_col_full*8):(num_col_full*8 + num_well_in_last_col)]
        rxn_in_last_col_2 = assay_plate.wells()[(num_col_full*8+8):(num_col_full*8+8 + num_well_in_last_col)]

    buffer_res = ctx.load_labware('nest_12_reservoir_15ml', 'C2', 'SHEATH FLUID')
    sf = buffer_res.wells()[1:3]

    buffer_rack = ctx.load_labware('opentrons_15_tuberack_eppendorf_15ml_conical_amber', 'B1', 'DETECTION ANTIBODIES & SAPE')
    ab_stock = buffer_rack.wells()[3]
    sape_stock = buffer_rack.wells()[4]

    temp_plate = ctx.load_labware('axygen_96_wellplate_500ul', 'D2', 'REAGENT/WORKING PLATE')
    ab = temp_plate.rows()[0][0]
    sape = temp_plate.rows()[0][1]
    ab_in_well = temp_plate.wells()[0:8]
    sape_in_well = temp_plate.wells()[8:16]

    ctx.load_trash_bin("D3")

    tips_1k = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'C3', '1000uL TIPS')
    tips_200 = [ctx.load_labware('opentrons_flex_96_tiprack_200ul', slot, '200uL TIPS')
                for slot in ['B2', 'B3']]

    p1k_1 = ctx.load_instrument('flex_1channel_1000', p1k_1_loc) 
    p1k_8 = ctx.load_instrument('flex_8channel_1000', p1k_8_loc) 

        
    # volume info 
    vol_info = (vol_DET_SAPE*(num_col_full+2)+50)*num_well_in_last_col + (vol_DET_SAPE*num_col_full+50)*(8-num_well_in_last_col) + 300 # added volume     
    def_ab = ctx.define_liquid(name="Detection Antibodies", description=" ", display_color="#330000")  ## Dark
    def_sape = ctx.define_liquid(name="Streptavidin-Phycoerythrin (SAPE)", description=" ", display_color="#FF007F")  ## Pink
    buffer_rack.wells()[3].load_liquid(liquid=def_ab, volume=vol_info) 
    buffer_rack.wells()[4].load_liquid(liquid=def_sape, volume=vol_info) 

    if num_well_in_last_col > 0:
        num_col = num_col_full + 2
    else: num_col = num_col_full

    if num_col > 6:
        vol_sf_1 = 8000
        vol_sf_2 = (num_col-7) * 150 * 8 + 1500
        def_sf_1 = ctx.define_liquid(name="Sheath Fluid", description=" ", display_color="#9966FF")  ## light
        def_sf_2 = ctx.define_liquid(name="Sheath Fluid", description=" ", display_color="#9966FF")  ## light
        buffer_res.wells()[1].load_liquid(liquid=def_sf_1, volume=vol_sf_1)
        buffer_res.wells()[2].load_liquid(liquid=def_sf_2, volume=vol_sf_2)
    else:
        vol_sf_1 = (num_col-1) * 150 * 8 + 1500
        def_sf_1 = ctx.define_liquid(name="Sheath Fluid", description=" ", display_color="#9966FF")  ## light
        buffer_res.wells()[1].load_liquid(liquid=def_sf_1, volume=vol_sf_1)
    


    if plate_covering == 1:

        ctx.load_lid_stack("black_96_well_microtiter_plate_lid", 'C4', 1)

        def cover():
            ctx.move_lid('C4',
                         assay_plate,
                         use_gripper=True,
                         pick_up_offset={'x':0, 'y':0, 'z':0.6},
                         drop_offset={'x':0,'y':0,'z':0}
                         )
      
        def uncover():
            ctx.move_lid(assay_plate,
                         'C4',
                         use_gripper=True,
                         pick_up_offset={'x':0, 'y':0, 'z':1},
                         drop_offset={'x':0,'y':0,'z':0}
                         )


    # protocol 

    #hs.open_labware_latch()
    
    hs.close_labware_latch()

    
    ## add detection ab and shake, and then SAPE 

    stock = [ab_stock, sape_stock]
    in_well = [ab_in_well, sape_in_well]
    reagent = [ab, sape]
    if dry_run: incubation_time = [0.1, 0.1]
    else: incubation_time = [detection_incubation, SAPE_incubation]
    touch_tip = [1, -1]

    for loc_1, loc_2, loc_3, min, touch in zip(stock, in_well, reagent, incubation_time, touch_tip):
        p1k_1.tip_racks = [tips_1k]

        p1k_1.pick_up_tip()
        if num_well_in_last_col > 0:
            for i in range(num_well_in_last_col):
                vol = vol_DET_SAPE * (num_col_full+2) + 35 
                p1k_1.aspirate(vol if i==0 else vol-5, loc_1.bottom(z=2), rate = 0.25)
                ctx.delay(seconds=1)
                p1k_1.dispense(vol_DET_SAPE * (num_col_full+2)+30, loc_2[i].bottom(z=2), rate = 0.25)
                ctx.delay(seconds=1)

        
        for i in range(8-num_well_in_last_col):
            vol = vol_DET_SAPE * (num_col_full+2)+35  
            p1k_1.aspirate(vol if i==0 else vol-15, loc_1.bottom(z=2), rate = 0.25)
            ctx.delay(seconds=1)
            p1k_1.dispense(vol_DET_SAPE * (num_col_full+2)+20, loc_2[num_well_in_last_col+i].bottom(z=2), rate = 0.25)
            ctx.delay(seconds=1)
            p1k_1.default_speed /= 25
            p1k_1.move_to(loc_2[num_well_in_last_col+i].top(z=-1))
            p1k_1.default_speed *= 25
        if dry_run: p1k_1.return_tip()
        else: p1k_1.drop_tip()
        
        p1k_8.tip_racks = tips_200
        
        for i in range(count_full):
            p1k_8.pick_up_tip()

            # if num_col_full > 6:
            p1k_8.aspirate(25*2+5, loc_3.bottom(z=1), rate = 0.25)
            p1k_8.dispense(25*2, loc_3.bottom(z=1), rate = 0.25)
            p1k_8.aspirate(25*2, loc_3.bottom(z=1), rate = 0.25)
            ctx.delay(seconds=1) 
            p1k_8.default_speed /= 20
            p1k_8.move_to(loc_3.top(z=-1))
            p1k_8.default_speed *= 20
            ctx.delay(seconds=1) 

            end_1 = rxn_end[i*2]
            end_2 = rxn_end[i*2+1]

            p1k_8.dispense(25, end_1.bottom(z=0.8), rate = 0.5)
            ctx.delay(seconds=1)

            p1k_8.dispense(25, end_2.bottom(z=0.8), rate = 0.5)
            ctx.delay(seconds=1)

            if dry_run: p1k_8.return_tip()
            else: p1k_8.drop_tip()

            

        if num_well_in_last_col > 0:
            p1k_1.tip_racks = tips_200
            for well in range(num_well_in_last_col):

                p1k_1.pick_up_tip()

                vol_last = 25 * 2

                p1k_1.aspirate(vol_last+5, loc_2[well].bottom(z=1), rate = 0.2)
                p1k_1.dispense(vol_last, loc_2[well].bottom(z=1), rate = 0.2)
                p1k_1.aspirate(vol_last, loc_2[well].bottom(z=1), rate = 0.2)


                for x in [0, 8]:


                    end = rxn_end_in_well[num_col_full*8+well+x]
                    
                    p1k_1.dispense(25, end.bottom(z=0.8), rate = 0.5)
                    ctx.delay(seconds=1)

                      

                if dry_run: p1k_1.return_tip()
                else: p1k_1.drop_tip()

        if plate_covering == 1:
            hs.open_labware_latch()
            cover()
            hs.close_labware_latch()
        
        elif plate_covering == 2:
            hs.open_labware_latch()
            ctx.pause('Seal Assay Plate')
            hs.close_labware_latch()

        hs.set_and_wait_for_shake_speed(rpm=SPEED_SHAKE)
        ctx.delay(minutes=min)
        hs.deactivate_shaker()

        if plate_covering == 1:
            hs.open_labware_latch()
            uncover()
            hs.close_labware_latch()
            
        elif plate_covering == 2:
            hs.open_labware_latch()
            ctx.pause('Remove plate seal')
            hs.close_labware_latch()
            
    
       
    hs.open_labware_latch()
    ctx.pause('Wash Assay Plate off deck and then load Assay Plate on Shaker')
    hs.close_labware_latch()

    ## add sheath fluid and shake
    p1k_8.tip_racks = [tips_1k]
    p1k_8.pick_up_tip()

    if num_col_full > 6:
        p1k_8.aspirate(sheath_well*6+15, sf[0].bottom(z=2), rate = 0.1) 
        ctx.delay(seconds=2)
        for i in range(6):
            p1k_8.dispense(sheath_well, rxn_in_full_col[i].top(z=-2), rate = 0.1)
            ctx.delay(seconds=1)
            p1k_8.default_speed /= 20
            p1k_8.move_to(rxn_in_full_col[i].top(z=-2).move(types.Point(x=touch*(rxn_in_full_col[i].diameter/2+0.05))))
            p1k_8.default_speed *= 20  

                 
        p1k_8.aspirate(sheath_well*(num_col_full-6), sf[1].bottom(z=2), rate = 0.1) 
        ctx.delay(seconds=2)
        for j in range(num_col_full-6):
            p1k_8.dispense(sheath_well, rxn_in_full_col[6+j].top(z=-2), rate = 0.1)
            ctx.delay(seconds=1)
            p1k_8.default_speed /= 20
            p1k_8.move_to(rxn_in_full_col[6+j].top(z=-2).move(types.Point(x=touch*(rxn_in_full_col[6+j].diameter/2+0.05))))
            p1k_8.default_speed *= 20 

    else:
        
        p1k_8.aspirate(sheath_well*num_col_full, sf[0].bottom(z=2), rate = 0.1) 
        ctx.delay(seconds=2)
        for col in range(num_col_full):
            p1k_8.dispense(sheath_well, rxn_in_full_col[col].top(z=-2), rate = 0.25)
            ctx.delay(seconds=1)
            p1k_8.default_speed /= 20
            p1k_8.move_to(rxn_in_full_col[col].top(z=-2).move(types.Point(x=touch*(rxn_in_full_col[col].diameter/2+0.05))))
            p1k_8.default_speed *= 20

    if dry_run: p1k_8.return_tip()
    else: p1k_8.drop_tip()

    if num_well_in_last_col > 0:
        p1k_1.tip_racks = [tips_1k]
        p1k_1.pick_up_tip()

        if num_col_full + 2 > 6:
            sf_loc = sf[1]
        else:
            sf_loc = sf[0]

        if num_well_in_last_col > 4:
            p1k_1.aspirate(sheath_well*4, sf_loc.bottom(z=2), rate = 0.25) 
            ctx.delay(seconds=2)
            for well in range(4):
                p1k_1.dispense(sheath_well, rxn_in_last_col_1[well].top(z=-2), rate = 0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                p1k_1.move_to(rxn_in_last_col_1[well].top(z=-2).move(types.Point(x=touch*(rxn_in_last_col_1[well].diameter/2+0.05))))
                p1k_1.default_speed *= 20
            p1k_1.aspirate(sheath_well*4, sf_loc.bottom(z=1), rate = 0.25) 
            ctx.delay(seconds=2)
            for well in range(4):
                p1k_1.dispense(sheath_well, rxn_in_last_col_2[well].top(z=-2), rate = 0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                p1k_1.move_to(rxn_in_last_col_2[well].top(z=-2).move(types.Point(x=touch*(rxn_in_last_col_2[well].diameter/2+0.05))))
                p1k_1.default_speed *= 20
                    
            p1k_1.aspirate(sheath_well*(num_well_in_last_col-4), sf_loc.bottom(z=2), rate = 0.25) 
            ctx.delay(seconds=2)
            for well in range(num_well_in_last_col-4):
                p1k_1.dispense(sheath_well, rxn_in_last_col_1[4+well].top(z=-2), rate = 0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                p1k_1.move_to(rxn_in_last_col_1[4+well].top(z=-2).move(types.Point(x=touch*(rxn_in_last_col_1[4+well].diameter/2+0.05))))
                p1k_1.default_speed *= 20
            p1k_1.aspirate(sheath_well*(num_well_in_last_col-4), sf_loc.bottom(z=2), rate = 0.25) 
            ctx.delay(seconds=2)
            for well in range(num_well_in_last_col-4):
                p1k_1.dispense(sheath_well, rxn_in_last_col_2[4+well].top(z=-2), rate = 0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                p1k_1.move_to(rxn_in_last_col_2[4+well].top(z=-2).move(types.Point(x=touch*(rxn_in_last_col_2[4+well].diameter/2+0.05))))
                p1k_1.default_speed *= 20
        else:
            p1k_1.aspirate(sheath_well*num_well_in_last_col, sf_loc.bottom(z=2), rate = 0.25) 
            ctx.delay(seconds=1)
            for well in range(num_well_in_last_col):
                p1k_1.dispense(sheath_well, rxn_in_last_col_1[well].top(z=-2), rate = 0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20  
                p1k_1.move_to(rxn_in_last_col_1[well].top(z=-2).move(types.Point(x=touch*(rxn_in_last_col_1[well].diameter/2+0.05))))
                p1k_1.default_speed *= 20          
            p1k_1.aspirate(sheath_well*num_well_in_last_col, sf_loc.bottom(z=2), rate = 0.25) 
            ctx.delay(seconds=1)
            for well in range(num_well_in_last_col):
                p1k_1.dispense(sheath_well, rxn_in_last_col_2[well].top(z=-2), rate = 0.5)
                ctx.delay(seconds=1)
                p1k_1.default_speed /= 20
                p1k_1.move_to(rxn_in_last_col_2[well].top(z=-2).move(types.Point(x=touch*(rxn_in_last_col_2[well].diameter/2+0.05))))
                p1k_1.default_speed *= 20  

        if dry_run: p1k_1.return_tip()
        else: p1k_1.drop_tip()

    if plate_covering == 1:
        hs.open_labware_latch()
        cover()
        hs.close_labware_latch()
        
    elif plate_covering == 2:
        hs.open_labware_latch()
        ctx.pause('Seal Assay Plate')
        hs.close_labware_latch()

    hs.set_and_wait_for_shake_speed(rpm=SPEED_SHAKE)
    ctx.delay(minutes=0.1 if dry_run else 5)
    hs.deactivate_shaker()
    hs.open_labware_latch()
