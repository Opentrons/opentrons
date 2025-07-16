metadata = {
    'protocolName': 'Trypsin Digestion for LC/MS - Flex w/ Thermal Cycler',
    'author': 'Boren Lin, Opentrons',
    'source': ''
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.18",
}

########################


SAMPLE_VOL = 50
ABC_VOL = 50
DTT_VOL = 10
IAA_VOL = 10
TRYPSIN_VOL = 10

DTT_TEMP = 55
DTT_TIME = 30
IAA_TEMP = 22
IAA_TIME = 30
TRYPSIN_TEMP = 37


def add_parameters(parameters):   
    parameters.add_int(variable_name="num_samples",
                       display_name="Number of Samples",
                       description="How many samples to be processed?",
                       default=96,
                       minimum=1,
                       maximum=96
                       )
    
    parameters.add_int(variable_name="labware_samples",
                      display_name="Labware for Samples",
                      description="Samples filled in 1.5 mL tubes (24 tubes per rack) or a 96-well plate?",
                      default=24,
                      choices=[
                               {"display_name": "1.5 mL tube", "value": 24},
                               {"display_name": "96-well plate", "value": 96}
                              ]  
                       ) 
    
    parameters.add_int(variable_name="digest_time",
                       display_name="Digestion Period",
                       description="How long for digestion (enter 0 if incubation will be stopped manually)?",
                       default=12,
                       minimum=0,
                       maximum=24
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

    global num_samples
    global labware_samples
    global digest_time
    global pipet_loc

    num_samples = ctx.params.num_samples
    labware_samples = ctx.params.labware_samples    
    digest_time = ctx.params.digest_time 
    pipet_loc = ctx.params.pipet_loc

    if pipet_loc == 1:
        p1k_1_loc = 'right'
        p1k_8_loc = 'left'
    else:
        p1k_1_loc = 'left'
        p1k_8_loc = 'right'

    num_col = int(num_samples//8)
    if num_samples%8 != 0: num_col = num_col + 1

    if digest_time > 0: digest_time_preset = 1
    else: digest_time_preset = 0

    # desk setup
    tc = ctx.load_module('thermocycler module gen2')
    sample_digested_plate = tc.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'WORKING PLATE - DIGESTION')
    reagent_res = ctx.load_labware("nest_96_wellplate_2ml_deep", 'D3', 'REAGENTS')
    # ABC, DTT, IAA, Trypsin
   
    tips_200_reused = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'B3', '200uL TIPS, REUSED')
    tip_loc_reused = tips_200_reused.wells()[:96]
    tips_200 = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'C3', '200uL TIPS')
    tip_loc = tips_200.wells()[:96]
    p1k_8 = ctx.load_instrument('flex_8channel_1000', p1k_8_loc)
    if labware_samples == 24: p1k_1 = ctx.load_instrument('flex_1channel_1000', p1k_1_loc)
                            
    # assign locations
    abc = reagent_res.rows()[0][0] 
    dtt = reagent_res.rows()[0][1] 
    iaa = reagent_res.rows()[0][2] 
    trypsin = reagent_res.rows()[0][3] 
    sample_digested_in_col = sample_digested_plate.rows()[0][:num_col]
    sample_digested_in_well = sample_digested_plate.wells()[:num_samples]

    # liquid info and deck payout
    vol_abc = (ABC_VOL*num_col) + 20
    vol_dtt = (DTT_VOL*num_col) + 20
    vol_iaa = (IAA_VOL*num_col) + 20
    vol_trypsin = (TRYPSIN_VOL*num_col) + 20

    def_abc = ctx.define_liquid(name="ABC", description="100 mM ABC in MS grade water, volume per well", display_color="#704848")  ## Brown
    def_dtt = ctx.define_liquid(name="DTT", description="60 mM DTT in MS grade water, volume per well", display_color="#00FFF2")  ## Light Blue
    def_iaa = ctx.define_liquid(name="IAA", description="187.5 mM IAA in 100 mM ABC, volume per well", display_color="#FFA500")  ## Orange
    def_trypsin = ctx.define_liquid(name="TRYPSIN", description="0.2 ug/uL Trypsin in MS grade water, volume per well", display_color="#0EFF00") ## Green

    for p in range(8):
        reagent_res.rows()[p][0].load_liquid(liquid=def_abc, volume=vol_abc/8)   
        reagent_res.rows()[p][1].load_liquid(liquid=def_dtt, volume=vol_dtt/8)
        reagent_res.rows()[p][2].load_liquid(liquid=def_iaa, volume=vol_iaa/8)
        reagent_res.rows()[p][3].load_liquid(liquid=def_trypsin, volume=vol_trypsin/8) 
 
    def transfer(vol1, start, end, tip, mix_skip=0):  
        p1k_8.pick_up_tip(tip)
        for i in range(num_col):             
            start_loc = start
            end_loc = end[i]
            p1k_8.aspirate(10, start_loc.top(z=0))
            p1k_8.aspirate(vol1, start_loc.bottom(z=0.2))
            ctx.delay(seconds=3)
            p1k_8.air_gap(10)
            p1k_8.dispense(10, end_loc.top(z=0))
            p1k_8.dispense(vol1+10, end_loc.top(z=0))
            p1k_8.blow_out()
        p1k_8.return_tip()
        if mix_skip==0: 
            for i in range(num_col):
                p1k_8.pick_up_tip(tip_loc_reused[i*8]) 
                end_loc = end[i]
                p1k_8.mix(5, 75, end_loc.bottom(z=0.2))
                p1k_8.blow_out(end_loc.top(z=0))
                p1k_8.touch_tip()
                p1k_8.return_tip()

    # protocol

    tc.open_lid() 
    ctx.pause('Load Reagent Plate on Slot D3')

    ## add sample 
    if labware_samples == 24:
        num_rack_full = int(num_samples//24)
        num_tube_last_rack = int(num_samples%24) 

        slot = ['A2', 'B2', 'C2', 'D2']

        if num_rack_full == 0:
            rack_loc = slot[0]
            sample_rack = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', rack_loc, 'SAMPLES')
            sample = sample_rack.wells()[:24]
            vol_sample = SAMPLE_VOL + 20
            def_sample = ctx.define_liquid(name="SAMPLES (Slot "+slot[0]+")", description="Protein samples, volume per tube", display_color="#FF0000")  ## Red

            for i in range(num_samples):
                start = sample[i]
                end = sample_digested_in_well[i]
                p1k_1.pick_up_tip(tip_loc_reused[i])
                p1k_1.aspirate(SAMPLE_VOL, start.bottom(z=0.2))
                ctx.delay(seconds=3)
                p1k_1.air_gap(10)
                p1k_1.dispense(10, end.top(z=0))
                p1k_1.dispense(SAMPLE_VOL, end.bottom(z=0.5))
                p1k_1.touch_tip()
                p1k_1.return_tip()   

                sample_rack.wells()[i].load_liquid(liquid=def_sample, volume=vol_sample/num_samples)   
        
        else:
            for n in range(num_rack_full):
                sample_rack = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', slot[n], 'SAMPLES')
                sample = sample_rack.wells()[:24]
                vol_sample = SAMPLE_VOL + 20
                def_sample = ctx.define_liquid(name="SAMPLES (Slot "+slot[n]+")", description="Protein samples, volume per tube", display_color="#FF0000")  ## Red

                for i in range(24):
                    start = sample[i]
                    end = sample_digested_in_well[n*24+i]
                    p1k_1.pick_up_tip(tip_loc_reused[n*24+i])
                    p1k_1.aspirate(SAMPLE_VOL, start.bottom(z=0.2))
                    ctx.delay(seconds=3)
                    p1k_1.air_gap(10)
                    p1k_1.dispense(10, end.top(z=0))
                    p1k_1.dispense(SAMPLE_VOL, end.bottom(z=0.5))
                    p1k_1.touch_tip()
                    p1k_1.return_tip()

                    sample_rack.wells()[i].load_liquid(liquid=def_sample, volume=vol_sample/24) 

            if num_tube_last_rack != 0:
                last_rack_loc = slot[num_rack_full]
                sample_rack = ctx.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', last_rack_loc, 'SAMPLES')
                sample = sample_rack.wells()[:24]
                vol_sample = SAMPLE_VOL + 20
                def_sample = ctx.define_liquid(name="SAMPLES (Slot "+slot[num_rack_full]+")", description="Protein samples, volume per tube", display_color="#FF0000")  ## Red

                for i in range(num_tube_last_rack):
                    start = sample[i]
                    end = sample_digested_in_well[num_rack_full*24+i]
                    p1k_1.pick_up_tip(tip_loc_reused[num_rack_full*24+i])
                    p1k_1.aspirate(SAMPLE_VOL, start.bottom(z=0.2))
                    ctx.delay(seconds=3)
                    p1k_1.air_gap(10)
                    p1k_1.dispense(10, end.top(z=0))
                    p1k_1.dispense(SAMPLE_VOL, end.bottom(z=0.5))
                    p1k_1.touch_tip()
                    p1k_1.return_tip()        

                    sample_rack.wells()[i].load_liquid(liquid=def_sample, volume=vol_sample/num_tube_last_rack) 

    elif labware_samples == 96: 
        sample_plate = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'A2', 'SAMPLES')
        sample = sample_plate.rows()[0][:num_col] 
        vol_sample = SAMPLE_VOL + 20
        def_sample = ctx.define_liquid(name="SAMPLES", description="Protein samples, volume per well", display_color="#FF0000")  ## Red
        for well in range(num_samples): 
            sample_plate.wells()[well].load_liquid(liquid=def_sample, volume=vol_sample/num_samples) 

        for i in range(num_col):            
            start = sample[i]
            end = sample_digested_in_col[i]
            p1k_8.pick_up_tip(tip_loc_reused[i*8])
            p1k_8.aspirate(SAMPLE_VOL, start.bottom(z=0.2))
            ctx.delay(seconds=3)
            p1k_8.air_gap(10)
            p1k_8.dispense(10, end.top(z=0))
            p1k_8.dispense(SAMPLE_VOL, end.bottom(z=0.5))
            p1k_8.touch_tip()
            p1k_8.return_tip() 

    ## add ABC 
    transfer(ABC_VOL, abc, sample_digested_in_col, tip_loc[0], 1)

    ## add DTT and incubate
    transfer(DTT_VOL, dtt, sample_digested_in_col, tip_loc[8])

    tc.set_lid_temperature(temperature=70)
    tc.close_lid() 
    tc.set_block_temperature(temperature=DTT_TEMP, block_max_volume=100)
    ctx.delay(minutes=DTT_TIME)

    ## add IAA and incubate
    tc.set_block_temperature(temperature=IAA_TEMP, block_max_volume=100)
    ctx.delay(minutes=5)
    tc.open_lid() 
    transfer(IAA_VOL, iaa, sample_digested_in_col, tip_loc[16])

    ctx.delay(minutes=IAA_TIME) 

    ## add Trypsin and incubate
    transfer(TRYPSIN_VOL, trypsin, sample_digested_in_col, tip_loc[24])
    tc.close_lid() 
    tc.set_block_temperature(temperature=TRYPSIN_TEMP, block_max_volume=100)
    if digest_time_preset == 1: ctx.delay(minutes=digest_time*60)
    else: ctx.pause('Incubation for 1-24 hours')
    tc.deactivate_block()
    ctx.delay(minutes=10) 

    tc.deactivate_lid()
    tc.open_lid() 
    
    ## Digestion Complete
