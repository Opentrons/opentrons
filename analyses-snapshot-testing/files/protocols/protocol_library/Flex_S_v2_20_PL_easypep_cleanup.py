metadata = {
    'protocolName': 'Sample Prep for MS (EasyPep Cleanup) - Flex w/ Thermal Cycler',
    'author': 'Boren Lin, Opentrons',
    'source': ''
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}

########################

CLEANUP_SAMPLE_VOL = 75

BEAD_VOL = 20
BIND_RINSE_VOL = 200

BIND_SAMPLE_VOL = 920
BIND_SPEED = 1200

WASH_VOL = 250

ELU_VOL = 150
ELU_SPEED = 1200
ELU_TIME = 3

DEFAULT_RATE = 700

def add_parameters(parameters):  
    parameters.add_bool(variable_name="dry_run",
                        display_name="Dry Run",
                        description=("All incubation steps skipped"),
                        default=False
                        )
     
    parameters.add_int(variable_name="num_exp",
                       display_name="Number of Experiments",
                       description="How many multiplex isobaric experiments?",
                       default=12,
                       minimum=1,
                       maximum=12
                       )
    
    parameters.add_int(variable_name="num_tmt",
                       display_name="Number of TMT Reagents",
                       description="How many isobaric mass-tagging reagents?",
                       default=6,
                       minimum=1,
                       maximum=6
                       )
    
    parameters.add_int(variable_name="bind_time",
                       display_name="Incubation Time",
                       description="Incubation Period for peptide binding (min)?",
                       default=60,
                       minimum=30,
                       maximum=60
                       )

    parameters.add_int(variable_name="pipet_loc",
                      display_name="1-ch Pipette Position",
                      description="How the single channel pipette is mounted?",
                      default=1,
                      choices=[
                               {"display_name": "on the right", "value": 1},
                               {"display_name": "on the left", "value": 2}
                              ]
                      )
    
#########################

def run(ctx):

    global dry_run
    global num_exp
    global num_tmt
    global bind_time
    global pipet_loc


    dry_run = ctx.params.dry_run
    num_exp = ctx.params.num_exp
    num_tmt = ctx.params.num_tmt    
    bind_time = ctx.params.bind_time 
    pipet_loc = ctx.params.pipet_loc

    if pipet_loc == 1:
        p1k_1_loc = 'right'
        p1k_8_loc = 'left'
    else:
        p1k_1_loc = 'left'
        p1k_8_loc = 'right'


    if dry_run: 
        bind_time = 0.1


    # deck layout

    hs = ctx.load_module('heaterShakerModuleV1', 'D3')
    hs_adapter = hs.load_adapter('opentrons_96_deep_well_adapter')
    working_plate = hs_adapter.load_labware('nest_96_wellplate_2ml_deep', 'WORKING PLATE')

    mag = ctx.load_module('magneticBlockV1', 'C2')  
    
    waste_res = ctx.load_labware('nest_1_reservoir_290ml', 'B2', 'LIQUID WASTE')   
    ctx.load_trash_bin('A3')

    tube_rack_24 = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 'D1', 'COMBINED LABELED PROTEIN DIGESTs, BEAD SLURRY & ELUTION SOLUTION')
    well_plate_12 = ctx.load_labware('nest_12_reservoir_15ml', 'D2', 'BIND SOLUTION & WASH SOLUTION')
  
    tube_rack_24_2 = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 'B3', 'FINAL PRODUCTs')
    
    tips_200 = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'C1', 'P200 TIPs')
    tips_1k_1 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'C3', 'P1000 TIPs')
    tips_1k_2 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A2', 'P1000 TIPs')

    p1k_1 = ctx.load_instrument('flex_1channel_1000', p1k_1_loc)
    p1k_8 = ctx.load_instrument('flex_8channel_1000', p1k_8_loc)
    p1k_1.flow_rate.aspirate = DEFAULT_RATE
    p1k_1.flow_rate.dispense = DEFAULT_RATE
    p1k_8.flow_rate.aspirate = DEFAULT_RATE
    p1k_8.flow_rate.dispense = DEFAULT_RATE



    # location assignment

    if num_exp > 6:
        sample_comb_1 = tube_rack_24.wells()[:6]
        sample_comb_2 = tube_rack_24.wells()[6:6+(num_exp-6)]

        exp_1 = working_plate.wells()[:6]
        exp_2 = working_plate.wells()[8:8+(num_exp-6)]

        final_1 = tube_rack_24_2.wells()[:6]
        final_2 = tube_rack_24_2.wells()[6:6+(num_exp-6)]

    else:
        sample_comb_1 = tube_rack_24.wells()[:num_exp]
        exp_1 = working_plate.wells()[:num_exp]
        final_1 = tube_rack_24_2.wells()[:num_exp]

    bead = tube_rack_24.wells()[16] 
    elu = tube_rack_24.wells()[20:22] 

    bind = well_plate_12.wells()[0:2]
    wash = well_plate_12.wells()[11]

    waste = waste_res.wells()[0]

    tips_bead = tips_200.wells()[0]
    tips_elu = tips_1k_1.wells()[0]

    if num_exp > 6:
        tip_sample_1 = tips_200.wells()[1:1+6]
        tip_sample_2 = tips_200.wells()[1+6:(1+6)+(num_exp-6)]

        tip_final_1 = tips_200.wells()[(1+6)+(num_exp-6):(1+6)+(num_exp-6)+6]
        tip_final_2 = tips_200.wells()[(1+6)+(num_exp-6)+6:((1+6)+(num_exp-6)+6)+(num_exp-6)]

        tips_1_1 = tips_1k_1.rows()[8-6][::2]
        tips_1_2 = tips_1k_1.rows()[8-(num_exp-6)][1::2] 

        tips_2_1 = tips_1k_2.rows()[8-6][::2]
        tips_2_2 = tips_1k_2.rows()[8-(num_exp-6)][1::2] 
       
    else:    
        tip_sample_1 = tips_200.wells()[1:1+num_exp]
        tip_sample_2 = tips_200.wells()[1:1+num_exp] 

        tip_final_1 = tips_200.wells()[1+num_exp:(1+num_exp)+num_exp]
        tip_final_2 = tips_200.wells()[1+num_exp:(1+num_exp)+num_exp]

        tips_1_1 = tips_1k_1.rows()[8-num_exp][:6]
        tips_1_2 = tips_1k_1.rows()[8-num_exp][:6] 

        tips_2_1 = tips_1k_1.rows()[8-num_exp][6:]
        tips_2_2 = tips_1k_1.rows()[8-num_exp][6:] 

    # volume info

    ## for samples
    color_sample = ['#FF0000', '#FF1000', '#FF2000', '#FF3000', '#FF4000', '#FF5000', '#FF6000', '#FF7000', '#FF8000', '#FF9000', '#FFA000', '#FFB000'] ## dark to light
    if num_exp > 6:
        for count in range(6):
            def_sample = ctx.define_liquid(name='COMBINED LABELED PROTEIN DIGEST #'+str(count+1), description=' ', display_color=color_sample[count]) 
            tube_rack_24.wells()[count].load_liquid(liquid=def_sample, volume=100*num_tmt)
        for count in range(num_exp-6):
            def_sample = ctx.define_liquid(name='COMBINED LABELED PROTEIN DIGEST #'+str(count+7), description=' ', display_color=color_sample[6+count]) 
            tube_rack_24.wells()[6+count].load_liquid(liquid=def_sample, volume=100*num_tmt)
    else:
        for count in range(num_exp):
            def_sample = ctx.define_liquid(name='COMBINED LABELED PROTEIN DIGEST #'+str(count+1), description=' ', display_color=color_sample[count]) 
            tube_rack_24.wells()[count].load_liquid(liquid=def_sample, volume=100*num_tmt)

    ##for others  
    color = ["#704848", "#50C878", "#0096FF", "#BF40BF"] ## Brown, Green, Blue, Purple
    name_liquid = ['BEADS', 'BIND SOLUTION', 'WASH SOLUTION', 'ELUTION SOLUTION'] 

    def_bead = ctx.define_liquid(name=name_liquid[0], description=' ', display_color=color[0])
    tube_rack_24.wells()[16].load_liquid(liquid=def_bead, volume=BEAD_VOL*(num_exp+1)) 

    def_wash = ctx.define_liquid(name=name_liquid[2], description=' ', display_color=color[2])
    well_plate_12.wells()[11].load_liquid(liquid=def_wash, volume=WASH_VOL*(num_exp*2-1)+2000) 

    if num_exp > 6:
        def_bind_1 = ctx.define_liquid(name=name_liquid[1], description=' ', display_color=color[1])
        well_plate_12.wells()[0].load_liquid(liquid=def_bind_1, volume=BIND_SAMPLE_VOL*(6-1)+BIND_RINSE_VOL*6+2000)
        def_bind_2 = ctx.define_liquid(name=name_liquid[1], description=' ', display_color=color[1])
        well_plate_12.wells()[1].load_liquid(liquid=def_bind_2, volume=BIND_SAMPLE_VOL*(num_exp-6-1)+BIND_RINSE_VOL*(num_exp-6)+2000)

        def_elu_1 = ctx.define_liquid(name=name_liquid[3], description=' ', display_color=color[3])
        tube_rack_24.wells()[20].load_liquid(liquid=def_elu_1, volume=ELU_VOL*(6+1))
        def_elu_2 = ctx.define_liquid(name=name_liquid[3], description=' ', display_color=color[3])
        tube_rack_24.wells()[21].load_liquid(liquid=def_elu_2, volume=ELU_VOL*(num_exp-6+1))

    else:
        def_bind_1 = ctx.define_liquid(name=name_liquid[1], description=' ', display_color=color[1])
        well_plate_12.wells()[0].load_liquid(liquid=def_bind_1, volume=BIND_SAMPLE_VOL*(num_exp-1)+BIND_RINSE_VOL*(num_exp)+2000)

        def_elu_1 = ctx.define_liquid(name=name_liquid[3], description=' ', display_color=color[3])
        tube_rack_24.wells()[20].load_liquid(liquid=def_elu_1, volume=ELU_VOL*(num_exp+1))



    def add_1ch(tips_loc, vol, source_1, source_2, drop_h):

        p1k_1.pick_up_tip(tips_loc)

        if num_exp > 6:
            p1k_1.mix(2, vol*6, source_1.bottom(z=1))
            p1k_1.flow_rate.aspirate = vol*6
            p1k_1.flow_rate.dispense = vol*6
            p1k_1.aspirate(vol*6, source_1.bottom(z=1))
            p1k_1.air_gap(10)
            p1k_1.dispense(10, exp_1[0].top(z=0))
            p1k_1.flow_rate.aspirate = vol
            p1k_1.flow_rate.dispense = vol
            for end in exp_1:
                p1k_1.dispense(vol, end.top(z=drop_h))
            p1k_1.blow_out()

            p1k_1.flow_rate.aspirate = DEFAULT_RATE
            p1k_1.flow_rate.dispense = DEFAULT_RATE

            p1k_1.mix(2, vol*6, source_2.bottom(z=1))
            p1k_1.flow_rate.aspirate = vol*6
            p1k_1.flow_rate.dispense = vol*6
            p1k_1.aspirate(vol*(num_exp-6), source_2.bottom(z=1))
            p1k_1.air_gap(10)
            p1k_1.dispense(10, exp_2[0].top(z=0))
            p1k_1.flow_rate.aspirate = vol
            p1k_1.flow_rate.dispense = vol
            for end in exp_2:
                p1k_1.dispense(vol, end.top(z=drop_h))
            p1k_1.blow_out()

            p1k_1.flow_rate.aspirate = DEFAULT_RATE
            p1k_1.flow_rate.dispense = DEFAULT_RATE

        else: 
            p1k_1.mix(2, vol*num_exp, source_1.bottom(z=1))
            p1k_1.flow_rate.aspirate = vol*6
            p1k_1.flow_rate.dispense = vol*6
            p1k_1.aspirate(vol*num_exp, source_1.bottom(z=1))
            p1k_1.air_gap(10)
            p1k_1.dispense(10, exp_1[0].top(z=0))
            p1k_1.flow_rate.aspirate = vol
            p1k_1.flow_rate.dispense = vol
            for end in exp_1:
                p1k_1.dispense(vol, end.top(z=drop_h))
            p1k_1.blow_out()

            p1k_1.flow_rate.aspirate = DEFAULT_RATE
            p1k_1.flow_rate.dispense = DEFAULT_RATE

        p1k_1.drop_tip()


    def add_8ch(tips_loc_1, tips_loc_2, vol, source_1, source_2, drop_h): 
        
        p1k_8.pick_up_tip(tips_loc_1)
        p1k_8.aspirate(vol, source_1.bottom(z=1))
        ctx.delay(seconds=1)
        p1k_8.air_gap(10)
        p1k_8.dispense(vol+10, exp_1[0].top(z=drop_h))
        p1k_8.mix(5, vol*0.75, exp_1[0].bottom(z=2))
        p1k_8.blow_out(exp_1[0].top(z=drop_h))
        p1k_8.drop_tip()

        if num_exp > 6:
            p1k_8.pick_up_tip(tips_loc_2)
            p1k_8.aspirate(vol, source_2.bottom(z=1))
            ctx.delay(seconds=1)
            p1k_8.air_gap(10)
            p1k_8.dispense(vol+10, exp_2[0].top(z=drop_h))
            p1k_8.mix(5, vol*0.75, exp_2[0].bottom(z=2))
            p1k_8.blow_out(exp_2[0].top(z=drop_h))
            p1k_8.drop_tip()

    def remove_liq(tips_loc_1, tips_loc_2, mag_time, vol):

        hs.open_labware_latch()
        ctx.move_labware(labware = working_plate,
                        new_location = mag,
                        use_gripper=True
                        )
        ctx.delay(minutes=0.1 if dry_run else mag_time)

        p1k_8.pick_up_tip(tips_loc_1)
        p1k_8.flow_rate.aspirate = 100
        p1k_8.aspirate(vol, exp_1[0].bottom(z=0.2))
        ctx.delay(seconds=2)
        p1k_8.dispense(vol, waste.top(z=-2))
        p1k_8.drop_tip()

        if num_exp > 6:
            p1k_8.pick_up_tip(tips_loc_2)
            p1k_8.flow_rate.aspirate = 100
            p1k_8.aspirate(vol, exp_2[0].bottom(z=0.2))
            ctx.delay(seconds=2)
            p1k_8.dispense(vol, waste.top(z=-2))
            p1k_8.drop_tip()
        
        p1k_8.flow_rate.aspirate = DEFAULT_RATE

        ctx.move_labware(labware = working_plate,
                         new_location = hs_adapter,
                         use_gripper=True
                        )
        hs.close_labware_latch()   


    # protocol

    hs.open_labware_latch()
    ctx.pause('Load Working Plate on Heater Shaker')
    hs.close_labware_latch()

    ## prepare beads

    add_1ch(tips_bead, BEAD_VOL, bead, bead, -30)
    add_8ch(tips_1_1[0], tips_1_2[0], BIND_RINSE_VOL, bind[0], bind[1], -20)

    hs.set_and_wait_for_shake_speed(rpm=2000)
    ctx.delay(seconds=10)
    hs.deactivate_shaker()

    remove_liq(tips_1_1[1], tips_1_2[1], 1, (BEAD_VOL+BIND_RINSE_VOL)*1.1)

    ## bind peptides
    add_8ch(tips_1_1[2], tips_1_2[2], BIND_SAMPLE_VOL, bind[0], bind[1], -10)
 
    for tips, start, end in zip(tip_sample_1, sample_comb_1, exp_1):
        p1k_1.pick_up_tip(tips)
        p1k_1.mix(2, CLEANUP_SAMPLE_VOL, start.bottom(z=1))
        p1k_1.aspirate(CLEANUP_SAMPLE_VOL, start.bottom(z=1))
        ctx.delay(seconds=2)
        p1k_1.air_gap(10)
        p1k_1.dispense(CLEANUP_SAMPLE_VOL+10, end.top(z=-10))      
        ctx.delay(seconds=2)
        p1k_1.drop_tip()

    if num_exp > 6:
        for tips, start, end in zip(tip_sample_2, sample_comb_2, exp_2):
            p1k_1.pick_up_tip(tips)
            p1k_1.mix(2, CLEANUP_SAMPLE_VOL, start.bottom(z=1))
            p1k_1.aspirate(CLEANUP_SAMPLE_VOL, start.bottom(z=1))
            ctx.delay(seconds=2)
            p1k_1.air_gap(10)
            p1k_1.dispense(CLEANUP_SAMPLE_VOL+10, end.top(z=-10))      
            ctx.delay(seconds=2)
            p1k_1.drop_tip()

    hs.set_and_wait_for_shake_speed(rpm=BIND_SPEED)
    ctx.delay(seconds=bind_time*60)
    hs.deactivate_shaker()

    ctx.pause('Load Wash and Elution Buffers')

    remove_liq(tips_1_1[3], tips_1_2[3], 3, BIND_SAMPLE_VOL+CLEANUP_SAMPLE_VOL)

    ## wash x2

    add_8ch(tips_1_1[4], tips_1_2[4], WASH_VOL, wash, wash, -20)

    hs.set_and_wait_for_shake_speed(rpm=2000)
    ctx.delay(seconds=10)
    hs.deactivate_shaker()

    remove_liq(tips_1_1[5], tips_1_2[5], 2, WASH_VOL*1.1)

    add_8ch(tips_2_1[0], tips_2_2[0], WASH_VOL, wash, wash, -20)

    hs.set_and_wait_for_shake_speed(rpm=2000)
    ctx.delay(seconds=10)
    hs.deactivate_shaker()

    remove_liq(tips_2_1[1], tips_2_2[1], 2, WASH_VOL*1.1)

    ## elution
    add_1ch(tips_elu, ELU_VOL, elu[0], elu[1], -20)

    hs.set_and_wait_for_shake_speed(rpm=2000)
    ctx.delay(seconds=10)
    hs.set_and_wait_for_shake_speed(rpm=ELU_SPEED)
    ctx.delay(seconds=ELU_TIME*60 if not dry_run else 10)
    hs.deactivate_shaker()

    hs.open_labware_latch()
    ctx.move_labware(labware = working_plate,
                     new_location = mag,
                     use_gripper=True
                    )
    ctx.delay(minutes=2 if not dry_run else 0.1)

    for tips, start, end in zip(tip_final_1, exp_1, final_1):
        p1k_1.pick_up_tip(tips)
        p1k_1.flow_rate.aspirate = ELU_VOL/5
        p1k_1.aspirate(ELU_VOL, start.bottom(z=0.2))
        ctx.delay(seconds=2)
        p1k_1.dispense(ELU_VOL, end.bottom(z=15))      
        ctx.delay(seconds=2)
        p1k_1.blow_out()
        p1k_1.drop_tip()

    if num_exp > 6:
        for tips, start, end in zip(tip_final_2, exp_2, final_2):
            p1k_1.pick_up_tip(tips)
            p1k_1.flow_rate.aspirate = ELU_VOL/5
            p1k_1.aspirate(ELU_VOL, start.bottom(z=0.2))
            ctx.delay(seconds=2)
            p1k_1.dispense(ELU_VOL, end.bottom(z=15))      
            ctx.delay(seconds=2)
            p1k_1.blow_out()
            p1k_1.drop_tip()

    ctx.pause('Eluted Peptides Ready for LC-MS')