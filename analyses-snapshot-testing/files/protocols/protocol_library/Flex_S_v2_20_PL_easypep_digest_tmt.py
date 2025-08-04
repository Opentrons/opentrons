from opentrons import types
from opentrons.protocol_api import PARTIAL_COLUMN, ALL


metadata = {
    'protocolName': 'Sample Prep for MS (EasyPep Digestion and TMT Labeling) - Flex w/ Thermal Cycler',
    'author': 'Boren Lin, Opentrons',
    'source': ''
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}

########################

SAMPLE_VOL = 30

REDU_VOL = 15
ALKY_VOL = 15
ENZY_VOL = 15

FINAL_VOL = 100

REDU_ALKY_TEMP = 50
ENZY_TEMP = 37

TMT_VOL = 30
HA_VOL = 6

DEFAULT_RATE = 700

def add_parameters(parameters):
    parameters.add_bool(variable_name="dry_run",
                        display_name="Dry Run",
                        description=("All incubation steps skipped"),
                        default=False
                        )
    
    parameters.add_bool(variable_name="lid",
                        display_name="Auto-sealing Lids",
                        description=("Use auto-sealing lids during incubation?"),
                        default=True
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
                       minimum=2,
                       maximum=6
                       )

    parameters.add_int(variable_name="redu_alky_time",
                       display_name="Reduction/Alkylation Time",
                       description="Incubation Period for protein reduction/alkylation at 50°C (min)?",
                       default=30,
                       minimum=20,
                       maximum=30
                       )

    parameters.add_int(variable_name="enzy_time",
                       display_name="Digestion Time",
                       description="Incubation Period for protein digestion at 37°C (min)?",
                       default=120,
                       minimum=60,
                       maximum=120
                       )
    
    parameters.add_int(variable_name="pipet_loc",
                      display_name="P1000 1-ch Pipette Position",
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
    global lid
    global num_exp
    global num_tmt
    global redu_alky_time
    global enzy_time
    global pipet_loc

    global tmt_time 
    global ha_time 


    dry_run = ctx.params.dry_run
    lid = ctx.params.lid
    num_exp = ctx.params.num_exp
    num_tmt = ctx.params.num_tmt   
    redu_alky_time = ctx.params.redu_alky_time
    enzy_time = ctx.params.enzy_time 
    pipet_loc = ctx.params.pipet_loc

    if pipet_loc == 1:
        p1k_1_loc = 'right'
        p1k_8_loc = 'left'
    else:
        p1k_1_loc = 'left'
        p1k_8_loc = 'right'

    if dry_run: 
        redu_alky_time = 0.1
        enzy_time = 0.1
        tmt_time = 0.1
        ha_time = 0.1
    else:
        tmt_time = 60
        ha_time = 15


    # deck layout

    tc = ctx.load_module('thermocycler module gen2')

    if lid: 
        lid_3 = ctx.load_labware("opentrons_tough_pcr_auto_sealing_lid", 'A2', 'SEALING LIDs')
        lid_2 = lid_3.load_labware("opentrons_tough_pcr_auto_sealing_lid")
        lid_1 = lid_2.load_labware("opentrons_tough_pcr_auto_sealing_lid")

    working_plate = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'B2', 'WORKING PLATE')

    digest_res = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", 'C3', 'REAGENTs FOR DIGESTION')
    tmt_res = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", 'C1', 'REAGENTs FOR TMT LABELING')

    sample_res = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", 'B3', 'SAMPLEs')
    tube_rack_24 = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 'D1', 'LABELED PROTEIN DIGESTs, COMBINED')


    tips_200 = [ctx.load_labware('opentrons_flex_96_tiprack_200ul', slot, 'P200 TIPs')
                for slot in ['D3', 'C2', 'D2']]
    tips_redu = tips_200[0].rows()[num_tmt-1][0]  
    tips_alky = tips_200[0].rows()[num_tmt-1][1]  
    tips_enzy = tips_200[0].rows()[num_tmt-1][2]  
    tips_ha = tips_200[0].rows()[num_tmt-1][3]

    tips_sample = tips_200[1].rows()[num_tmt-1][:num_exp]
    tips_tmt = tips_200[2].rows()[num_tmt-1][:num_exp]

    tips_combo = tips_200[0].rows()[7][:num_exp]

    p1k_1 = ctx.load_instrument('flex_1channel_1000', p1k_1_loc)
    p1k_8 = ctx.load_instrument('flex_8channel_1000', p1k_8_loc)
    p1k_1.flow_rate.aspirate = DEFAULT_RATE
    p1k_1.flow_rate.dispense = DEFAULT_RATE
    p1k_8.flow_rate.aspirate = DEFAULT_RATE
    p1k_8.flow_rate.dispense = DEFAULT_RATE

    dumpster = ctx.load_trash_bin('A3')



    # location assignment

    rxn = working_plate.rows()[num_tmt-1][:num_exp]
    sample = sample_res.rows()[num_tmt-1][:num_exp] 

    redu = digest_res.rows()[num_tmt-1][0] 
    alky = digest_res.rows()[num_tmt-1][1] 
    enzy = digest_res.rows()[num_tmt-1][2] 
    ha = digest_res.rows()[num_tmt-1][11]

    tmt = tmt_res.rows()[num_tmt-1][:num_exp]


    final = working_plate.rows()[:8][:12]
    final_combo = tube_rack_24.wells()[:num_exp]


    # volume info

    m = num_exp
    n = num_tmt

    ## for sample 
    descrip = 'volume per well (µL): '+str(SAMPLE_VOL+10)
    color_sample = ['#FF0000', '#FF1000', '#FF2000', '#FF3000', '#FF4000', '#FF5000', '#FF6000', '#FF7000', '#FF8000', '#FF9000', '#FFA000', '#FFB000'] ## dark to light
    for x in range(m): 
        def_sample = ctx.define_liquid(name='SAMPLEs for EXPERIMENT #'+str(x+1), description=descrip, display_color=color_sample[x]) ## Green
        for y in range(n):
            sample_res.rows()[y][x].load_liquid(liquid=def_sample, volume=(SAMPLE_VOL+10))

    vol = [REDU_VOL, ALKY_VOL, ENZY_VOL]
    color = ["#50C878", "#704848", "#0096FF"] ## Green, Brown, Blue
    name_liquid = ['REDUCTION SOLUTION', 'ALKYLATION SOLUTION', 'ENZYME RECONSTITUTION SOLUTION']    

    ## for reduction
    def_liq = ctx.define_liquid(name=name_liquid[0], description='volume per well (µL): '+str(vol[0]*m+10), display_color=color[0])
    for x in range(n): 
        digest_res.rows()[x][0].load_liquid(liquid=def_liq, volume=vol[0]*m+10) 

    ## for alkylation    
    def_liq = ctx.define_liquid(name=name_liquid[1], description='volume per well (µL): '+str(vol[1]*m+10), display_color=color[1])
    for x in range(n): 
        digest_res.rows()[x][1].load_liquid(liquid=def_liq, volume=vol[1]*m+10) 

    ## for enzyme
    def_liq = ctx.define_liquid(name=name_liquid[2], description='volume per well (µL): '+str(vol[2]*m+10), display_color=color[2])
    for x in range(n): 
        digest_res.rows()[x][2].load_liquid(liquid=def_liq, volume=vol[2]*m+10)
    

    ## for hydroxylamine
    descrip = 'volume per well (µL): '+str((HA_VOL+5)*m)
    def_liq = ctx.define_liquid(name='5% HYDROXYLAMINE', description=descrip, display_color="#FFBF00") ## yellow
    for x in range(n): 
        digest_res.rows()[x][11].load_liquid(liquid=def_liq, volume=(HA_VOL+5)*m) 

    ## for TMT 
    for y in range(n):
        color_code = ['#1F262A', '#4C4A45', '#786D60', '#A5917B', '#D1B496', '#FED8B1'] ## dark to light
        def_tmt = ctx.define_liquid(name="TMT LABEL REAGENT #"+str(y+1), description="volume per well (µL): "+str(TMT_VOL+10), display_color= color_code[y])
        for x in range(m): tmt_res.rows()[y][x].load_liquid(liquid=def_tmt, volume=(TMT_VOL+10)) 


    def transfer(vol, start, tiprack):
        p1k_8.pick_up_tip(tiprack)

        p1k_8.mix(5, vol, start)
        p1k_8.blow_out(start.top(z=-2))

        for i in range(num_exp):
            p1k_8.aspirate(vol, start.bottom(z=1))
            ctx.delay(seconds=2)
            p1k_8.dispense(vol, rxn[i].top(z=-2))    
            p1k_8.blow_out(rxn[i].top(z=-2)) 
            p1k_8.move_to(rxn[i].top(z=-2).move(types.Point(x=rxn[i].diameter/2-0.5)))

        p1k_8.drop_tip()                  

    # protocol
    loc_in_col = ['H1', 'G1', 'F1', 'E1', 'D1', 'C1', 'B1', 'A1']
    p1k_8.configure_nozzle_layout(style=PARTIAL_COLUMN,
                                  start=loc_in_col[0],
                                  end=loc_in_col[num_tmt-1]
                                  )

    tc.open_lid() 
    tc.set_lid_temperature(temperature=60)

    ctx.pause('Load Reagents for Protein Digestion on Deck')

    ## add reduction and alkylation solution
    transfer(REDU_VOL, redu, tips_redu) 
    transfer(ALKY_VOL, alky, tips_alky)
    
    ## add samples
    for tip, start, end in zip(tips_sample, sample, rxn):
        p1k_8.pick_up_tip(tip)

        p1k_8.flow_rate.aspirate = SAMPLE_VOL*2
        p1k_8.flow_rate.dispense = SAMPLE_VOL*2
        p1k_8.aspirate(SAMPLE_VOL, start.bottom(z=1))
        p1k_8.dispense(SAMPLE_VOL, end.bottom(z=1))

        p1k_8.flow_rate.aspirate = DEFAULT_RATE
        p1k_8.flow_rate.dispense = DEFAULT_RATE
        p1k_8.mix(3, (REDU_VOL+ALKY_VOL+SAMPLE_VOL)*0.5, end.bottom(z=1))          

        p1k_8.blow_out(end.top(z=0))
        p1k_8.drop_tip()
    
    ctx.move_labware(labware = tips_200[1],
                     new_location = 'C4',
                     use_gripper=True,
                    )    

    ## denature
    tc.set_block_temperature(temperature=REDU_ALKY_TEMP, block_max_volume=REDU_VOL+ALKY_VOL+SAMPLE_VOL)
    ctx.move_labware(labware = working_plate,
                     new_location = tc,
                     use_gripper=True,
                    )
    
    if lid:
        ctx.move_labware(labware = lid_1,
                     new_location = working_plate,
                     use_gripper=True,
                    )
        
    tc.close_lid() 
    ctx.delay(minutes=redu_alky_time)
    tc.open_lid()

    if lid:
        ctx.move_labware(labware = lid_1,
                     new_location = dumpster,
                     use_gripper=True,
                    )
        
    ctx.move_labware(labware = working_plate,
                     new_location = 'B2',
                     use_gripper=True,
                    )
 
    ## add enzyme solution and digest
    tc.set_block_temperature(temperature=ENZY_TEMP, block_max_volume=REDU_VOL+ALKY_VOL+SAMPLE_VOL)
    ctx.delay(minutes=0.1 if dry_run else 5) 

    transfer(ENZY_VOL, enzy, tips_enzy)

    ctx.move_labware(labware = working_plate,
                     new_location = tc,
                     use_gripper=True,
                    )
    
    if lid:
        ctx.move_labware(labware = lid_2,
                     new_location = working_plate,
                     use_gripper=True,
                    )
        
    tc.close_lid() 
    ctx.delay(minutes=enzy_time) 
    tc.open_lid() 

    if lid:
        ctx.move_labware(labware = lid_2,
                     new_location = dumpster,
                     use_gripper=True,
                    )
        
    ctx.move_labware(labware = working_plate,
                     new_location = 'B2',
                     use_gripper=True,
                    )
    
    tc.deactivate_lid()
    tc.set_block_temperature(temperature=27)
    tc.deactivate_block()
    #ctx.delay(minutes=0.1 if dry_run else 5)

    ctx.pause('Digestion Complate')
    ctx.pause('Load Reagents for TMT Labeling on Deck')

    ## add TMT reagents
    for tip, start, end in zip(tips_tmt, tmt, rxn):
        p1k_8.pick_up_tip(tip)

        p1k_8.flow_rate.aspirate = TMT_VOL*2
        p1k_8.flow_rate.dispense = TMT_VOL*2
        p1k_8.mix(1, TMT_VOL, start.bottom(z=1))
        p1k_8.aspirate(TMT_VOL, start.bottom(z=1))
        p1k_8.aspirate(10, start.top(z=0))
        p1k_8.dispense(10, end.top(z=0))
        p1k_8.dispense(TMT_VOL, end.bottom(z=1))

        p1k_8.flow_rate.aspirate = DEFAULT_RATE
        p1k_8.flow_rate.dispense = DEFAULT_RATE
        p1k_8.mix(3, (REDU_VOL+ALKY_VOL+SAMPLE_VOL+ENZY_VOL+TMT_VOL)*0.5, end.bottom(z=1))
        p1k_8.blow_out(end.top(z=0))
        p1k_8.drop_tip()
   
    ctx.move_labware(labware = working_plate,
                     new_location = tc,
                     use_gripper=True,
                    )
    
    if lid:
        ctx.move_labware(labware = lid_3,
                     new_location = working_plate,
                     use_gripper=True,
                    )
        
    tc.close_lid() 
    ctx.delay(minutes=tmt_time)
    tc.open_lid() 

    if lid:
        ctx.move_labware(labware = lid_3,
                     new_location = dumpster,
                     use_gripper=True,
                    )
        
    ctx.move_labware(labware = working_plate,
                     new_location = 'B2',
                     use_gripper=True,
                    )

    ## quenching
    p1k_8.pick_up_tip(tips_ha)

    if num_exp > 6: p1k_8.mix(5, HA_VOL*6*0.75, ha)
    else: p1k_8.mix(5, HA_VOL*num_exp*0.75, ha)
    p1k_8.blow_out(ha.top(z=-2))

    for i in range(num_exp):
        p1k_8.mix(1, HA_VOL, ha.bottom(z=1))
        p1k_8.aspirate(HA_VOL, ha.bottom(z=1))
        ctx.delay(seconds=3)
        p1k_8.dispense(HA_VOL, rxn[i].top(z=-2))    
        p1k_8.blow_out(rxn[i].top(z=-2)) 
        p1k_8.move_to(rxn[i].top(z=-2).move(types.Point(x=rxn[i].diameter/2-0.5)))

    p1k_8.drop_tip()

    ctx.delay(minutes=ha_time)

    for col, (tips, end) in enumerate(zip(tips_combo, final_combo)):
        p1k_1.pick_up_tip(tips)
        for row in range(num_tmt):
            start = final[row][col]
            p1k_1.flow_rate.aspirate = FINAL_VOL/2
            p1k_1.flow_rate.dispense = FINAL_VOL/2
            p1k_1.aspirate(FINAL_VOL, start.bottom(z=0.2))
            ctx.delay(seconds=2)
            p1k_1.flow_rate.aspirate = DEFAULT_RATE
            p1k_1.flow_rate.dispense = DEFAULT_RATE
            p1k_1.dispense(FINAL_VOL, end.top(z=-5))
            ctx.delay(seconds=2)
            p1k_1.blow_out()
        p1k_1.drop_tip()

    
    ctx.pause('Peptide Labeling Complete')
