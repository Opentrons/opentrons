import opentrons
import math
from opentrons.protocol_api import COLUMN, SINGLE
from opentrons.protocol_api import COLUMN, ALL
from opentrons import protocol_api
from opentrons import types

metadata = {
    'protocolName': 'neoSwitch Ni-NTA Protein Purification 96CH',
    'author': 'Scarlett Sims, scarlett.sims@neochromosome.com',
    'description': 'The protocol performs protein purification from neoSwitch supernatant using Pierce Magnetic Agarose Ni-NTA Beads from either 96 or 24 well culture plates.'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.21",
}
#define which variables can be altered within a pre-set scope by the user at run time
    #runtime parameters

def add_parameters(parameters):
    parameters.add_int(variable_name="num_col",
                       display_name="Number of Columns of Samples",
                       description="Number of columns of samples in a Deep Well plate",
                       default=12,
                       minimum=1,
                       maximum=12
                       )

    parameters.add_int(variable_name="incubation_min",
                       display_name="Protein Capture Time (min)",
                       description="Incubation period for target binding (minutes)",
                       default=15,
                       minimum=0,
                       maximum=120
                       )
    parameters.add_str(
                        variable_name="sample_plate_type",
                        display_name="Sample Plate Type",
                        choices=[
                            {"display_name": "24 DeepWell Plate 5.0mL", "value": "nest_24_wellplate_10400ul"},
                            {"display_name": "96 DeepWell Plate 2.2mL", "value": "nest_96_wellplate_2ml_deep"},
                        ],
                        default="nest_96_wellplate_2ml_deep",
    )
    parameters.add_int(variable_name="start_point",
                       display_name="Method Start Point",
                       description="Skips to Section Breaks for Error Recovery and Testing",
                       default=1,
                       choices =[
                           {"display_name": "Bead Distribution", "value": 1},
                           {"display_name": "Sample Equilibration", "value": 2},
                           {"display_name": "Sample Addition", "value": 3},
                           {"display_name": "Washing Cycles", "value": 4},
                           {"display_name": "Elution", "value": 5},
                       ]
                       )
    parameters.add_bool(
                        variable_name="clean_beads",
                        display_name="Equilibrate Beads on Deck",
                        description="Load UN-cleaned Ni-NTA Beads for Equilibration by Flex",
                        default=False
                    )


def run(ctx):
#####################Defined Parameters for Reference within Method###################
    ASP_HEIGHT = 1.5
    ASP_HEIGHT_BEAD_EQ = 1.0
    ASP_HEIGHT_ELUTION = 1.0

    MAG_DELAY_MIN = 2
    COOLING_DELAY_MIN = 3

    bead_vol = 50
    final_bead_vol = 50
    bead_wash_vol = 250
    bead_wash_times = 3

    SAMPLE_VOL = 800
    sample_equilibration_vol = 200
    WASH_TIMES = 2
    WASH_VOL = 900
    ELUTION_VOL = 100

    WASTE_VOL_MAX = 2200
    waste_vol_chk = 0

#Shaking/Mixing Parameters
##shake_speed_SA is a "pulse" type shake to put beads into solution for sample addition
    shake_speed_SA = 1800 #rpm
    shake_time_SA = 2 #seconds

##shake_speed_SA_2 is a shake that swirls sample once in solution during sample addition
    shake_speed_SA_2 = 750 #rpm
    shake_time_SA_2 = 5 #seconds

#shake parameters for washing steps
    MIX_SEC = 30
    Mix_bead_wash = 1000
    MIX_SAMPLE_WASH = 750

#parameters for elution
    ELUTION_SPEEND = 750
    ELUTION_MIN = 5
    ELUTION_TIMES = 1 # 1 or 2

#######################  Importing Runtime Parameters with Adjustments as Needed by Incompatible Selections ######################
    incubation_min = ctx.params.incubation_min
    num_col = ctx.params.num_col
    start_point = ctx.params.start_point
    sample_plate_type = ctx.params.sample_plate_type
    clean_beads = ctx.params.clean_beads

    if clean_beads is True and start_point > 1:
        clean_beads = not clean_beads

    if sample_plate_type == "nest_24_wellplate_10400ul" and start_point>2:
        sample_plate_type = "nest_96_wellplate_2ml_deep"
        ctx.pause("Pre-Equilibrated Sample Should be in 96DWPs ONLY. Source Plate Type Adjusted to 96 DWP.")

    if sample_plate_type == "nest_24_wellplate_10400ul" and num_col >6:
        num_col = 6
        ctx.comment("Too Many Columns for 24W Plate Type, Reduced to 6 columns")

###################### Modules and Adapters ######################
    mag = ctx.load_module('magneticBlockV1', 'D2')
    h_s = ctx.load_module('heaterShakerModuleV1', 'D1')
    h_s_adapter = h_s.load_adapter('opentrons_universal_flat_adapter')
    temp = ctx.load_module('thermocyclerModuleV2')
    trash = ctx.load_waste_chute()
    

###################### Load Labware Based on Start Point Parameter ######################

#Labware to Include Always
    beads_res = ctx.load_labware("nest_12_reservoir_15ml", 'B3', 'Nest 12-well Reservoir- See Liquids')
    if start_point== 1: working_plate = mag.load_labware("nest2mldwpflatadapter_96_wellplate_2200ul", 'Empty 96DWP for Bead Prep')
    if start_point== 2 or start_point ==3: working_plate = mag.load_labware("nest2mldwpflatadapter_96_wellplate_2200ul", '96DWP with Equilibrated and Distributed Beads')
    if start_point==4: working_plate = mag.load_labware("nest2mldwpflatadapter_96_wellplate_2200ul",'96DWP with Sample-Bound Beads')
    if start_point==5: working_plate = mag.load_labware("nest2mldwpflatadapter_96_wellplate_2200ul",'96DWP with Sample-Bound and Washed Beads')

#Labware to Exclude if Start Point is after Sample Addition
    if start_point>3:
        pass
    if start_point==3:
        sample_plate = ctx.load_labware(sample_plate_type, 'C2', 'Equilibrated Sample Plate')
    if start_point < 3:
        sample_plate = ctx.load_labware(sample_plate_type, 'C2', 'Sample Plate')

#Labware to Exclude if Start Point is after Wash Steps
    if start_point>4:
        adapter_A2 = ctx.load_adapter("opentrons_flex_96_tiprack_adapter", 'A2')
        tips_elu = adapter_A2.load_labware('opentrons_flex_96_tiprack_200ul', '200uL Elution Tips')

    else:
        tips_elu = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'B4', '200uL Elution tips')
        adapter_A2 = ctx.load_adapter("opentrons_flex_96_tiprack_adapter", 'A2')
        tips_sample = adapter_A2.load_labware('opentrons_flex_96_tiprack_1000ul','1mL Sample Tips')
        tips_sample_loc = tips_sample.wells()[:96]
        wash_res = ctx.load_labware("nest_1_reservoir_290ml", 'B2', 'Wash Buffer Reservoir')
        if clean_beads is True:
            prep_sample_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", 'C4', 'Empty Sample Prep/Waste Plate')
            waste_catch = ctx.load_labware("nest_1_reservoir_290ml", 'C1', 'Waste Catch-Bead Prep')
        else:
            prep_sample_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", 'C1', 'Empty Sample Prep/Waste Plate')


#Labware to Include for Elution Step (Always Add/Not Conditional)
    tips_reused = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'C3', '1mL Tips for Reagent Dispensing')
    tips_reused_loc = tips_reused.wells()[:96]
    final_plate = temp.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", 'Empty 96PCR Plate- Final Elution')

###################### Pipette Characteristics ######################
    p_96 = ctx.load_instrument('flex_96channel_1000')
    default_rate = 700
    p_96.flow_rate.aspirate = default_rate
    p_96.flow_rate.dispense = default_rate

################### Liquids ######################
#define wells in reservoir with selected reagents for easy reference
    beads_well = 0
    sample_eq_well = 2
    elute_well = 6

#Sample in Selected Sample plate
    sample_def = ctx.define_liquid(name="SAMPLES", description="Sample per well", display_color="#52AAFF")  ## Blue
    if sample_plate_type == "nest_24_wellplate_10400ul":
        iteration = 4
        num_col_total = num_col *2
        sample_vol_stock = (SAMPLE_VOL+sample_equilibration_vol)*4
    else:
        iteration = 8
        num_col_total = num_col
        sample_vol_stock = (SAMPLE_VOL+sample_equilibration_vol)
    if start_point>3: pass
    else:
        for well_count in range(num_col * iteration):
            sample_plate.wells()[well_count].load_liquid(liquid=sample_def, volume=sample_vol_stock)

#Sample Equilibration Buffer
    if start_point<3:
        eql_vol_res = sample_equilibration_vol*1.1
        total_eq_vol = eql_vol_res*num_col_total*8
        num_eq_wells = math.ceil(total_eq_vol/8000)
        eql_def = ctx.define_liquid(name="Sample Equilibration Buffer", description="Sample Equilibration Buffer", display_color="#9ACECB")  ## Blue
        for add_samp_eq in range(num_eq_wells):
            if total_eq_vol > 8000:
                seq_volume = 8000
            else:
                seq_volume = total_eq_vol
            if total_eq_vol < 3000:
                seq_volume = 3000
            beads_res.wells()[sample_eq_well+add_samp_eq].load_liquid(liquid=eql_def, volume=seq_volume)
            total_eq_vol = total_eq_vol - seq_volume

#Wash Buffer
    if start_point > 4: pass
    else:
        if clean_beads is True: wash_vol_res = ((WASH_VOL*1.1*WASH_TIMES)+(bead_wash_vol*1.1*bead_wash_times))*8*num_col_total
        else: wash_vol_res = WASH_VOL*1.1*WASH_TIMES*num_col_total*8
        if wash_vol_res < 25000:
            wash_vol_res = 25000
        wash_def = ctx.define_liquid(name="WASH", description="Wash Buffer", display_color="#FF0000")  ## Red
        wash_res.wells()[0].load_liquid(liquid=wash_def, volume=wash_vol_res)

    #Elution Buffer
    elu_vol_res = (ELUTION_VOL*ELUTION_TIMES*1.1*num_col_total*8)
    elu_def = ctx.define_liquid(name="ELUTION", description="Elution Buffer", display_color="#00FFF2")  ## Light Blue
    elu_total_wells= math.ceil(elu_vol_res/8000)
    for add_wells in range(elu_total_wells):
        if elu_vol_res > 8000:
            elu_volume = 8000
        else: elu_volume = elu_vol_res
        if elu_vol_res < 3000:
            elu_volume = 3000
        beads_res.wells()[(elute_well+add_wells)].load_liquid(liquid=elu_def, volume=elu_volume)
        elu_vol_res = elu_vol_res-elu_volume

    #Beads
    beads_vol_res = bead_vol*1.1*num_col_total*8
    if beads_vol_res < 3000:
        beads_vol_res = 3000
    if clean_beads is True:
        beads_def = ctx.define_liquid(name="UNequilibrated BEADS", description="Ni-NTA Bead Slurry (unequilibrated)", display_color="#704848")  ## Brown
        beads_res.wells()[beads_well].load_liquid(liquid=beads_def, volume=beads_vol_res)

    if clean_beads is False and start_point<2:
            beads_def = ctx.define_liquid(name="Cleaned Beads", description="Washed Ni-NTA Bead Slurry", display_color="#704848")  ## Brown
            beads_res.wells()[beads_well].load_liquid(liquid=beads_def, volume=beads_vol_res)

    if clean_beads is False and start_point>1:
            beads_def = ctx.define_liquid(name="Cleaned Beads", description="Washed Ni-NTA Bead Slurry", display_color="#704848")  ## Brown
            for add_beads in range(num_col_total*8):
                working_plate.wells()[add_beads].load_liquid(liquid=beads_def, volume=bead_vol)

#mixing working definition for use in method
    def mix(speend, time):
        ctx.comment('\n\n\n~~~~~~~~Shake to mix~~~~~~~~\n')
        h_s.set_and_wait_for_shake_speed(rpm=speend)
        ctx.delay(seconds=time)
        h_s.deactivate_shaker()
############################################################ Protocol Start ###########################################################
#sets starting index to 0
    tip_index = 0

#temp module should be open unless actively heating or cooling a plate
#for increased lifespan and access to labware with a partial tip offset

    temp.open_lid()

################################################ Bead Distribution ################################################
    if start_point <2:
        h_s.open_labware_latch()
        ctx.comment('Moving Working Plate to Heater Shaker')
        ctx.move_labware(labware=working_plate,
                         new_location=h_s_adapter,
                         use_gripper=True
                         )
        h_s.close_labware_latch()
        p_96.flow_rate.aspirate = 300
        p_96.flow_rate.dispense = 300

# start by adding 50uL Beads to Working Plate
        p_96.configure_nozzle_layout(
            style=COLUMN,
            start="A12",
            tip_racks=[tips_reused])
        ctx.comment('Dispensing Beads to Working Plate')
        p_96.pick_up_tip(tips_reused_loc[(tip_index * 8)])
        calc_beads = num_col_total * bead_vol
        p_96.mix(4,calc_beads, beads_res.wells()[0].bottom(z=ASP_HEIGHT))
        p_96.flow_rate.aspirate = 50
        p_96.flow_rate.dispense = 50
        p_96.aspirate(calc_beads, beads_res.wells()[0].bottom(z=ASP_HEIGHT))
        for add_beads in range(num_col_total):
            p_96.dispense(bead_vol,working_plate.wells()[(add_beads * 8)].bottom(z=3))
        p_96.drop_tip()
        tip_index= tip_index+1

# Adding 250uL Wash Buffer to Working/Bead Plate
        if clean_beads is True:
            p_96.flow_rate.aspirate = default_rate
            p_96.flow_rate.dispense = default_rate

            for wash_beads in range(bead_wash_times):
                ctx.comment('Adding Wash Buffer to Beads')
                p_96.pick_up_tip(tips_reused_loc[(tip_index*8)])
                p_96.flow_rate.aspirate = default_rate
                p_96.flow_rate.dispense = default_rate

                disp_bead_wash= math.ceil((num_col_total * bead_wash_vol) / 1000)
                calc_bead_buffer = num_col_total* bead_wash_vol
                num_cols_remaining = num_col_total

                for wash_beads in range(disp_bead_wash):
                    if calc_bead_buffer>1000:
                        dist_bwash_vol = 1000
                        dist_wells = 4
                    else:
                        dist_bwash_vol = num_cols_remaining * bead_wash_vol
                        dist_wells = num_cols_remaining
                    wash_res_location = wash_res.wells()[0].bottom(z=ASP_HEIGHT)
                    p_96.aspirate(dist_bwash_vol, wash_res_location.move(types.Point(x=-4.5)))
                    for loop_cols in range(dist_wells):
                        p_96.dispense(bead_wash_vol, working_plate.wells()[((loop_cols*8)+(wash_beads*4*8))].top(z=-2))
                    calc_bead_buffer = calc_bead_buffer-(bead_wash_vol*dist_wells)
                    num_cols_remaining = num_cols_remaining - dist_wells
                p_96.drop_tip()
                tip_index = tip_index + 1

                #mix on shaker to resuspend
                mix(Mix_bead_wash, MIX_SEC)

#move plate back to the magnet and wait for beads to bind
                h_s.open_labware_latch()
                ctx.comment('Moving Working Plate to Magnet')
                ctx.move_labware(labware=working_plate,
                                 new_location=mag,
                                 use_gripper=True)
                ctx.delay(minutes=MAG_DELAY_MIN)

                if wash_beads ==0:
                    vol_remove_eq = bead_vol + bead_wash_vol
                else:
                    vol_remove_eq = bead_wash_vol
                disp_bwash_remove = math.ceil((num_col_total * vol_remove_eq / 900))
                calc_bwash_buffer = num_col_total * vol_remove_eq
                num_cols_remaining = num_col_total

#remove bead wash and storage volume

                p_96.pick_up_tip(tips_reused_loc[(tip_index*8)])
                ctx.comment('Removing Wash/Storage Buffer')
                for rem_wash_beads in range(disp_bwash_remove):
                    p_96.flow_rate.aspirate = 20
                    if calc_bwash_buffer>900:
                        rem_bwash_vol = vol_remove_eq*3
                        rem_wells = 3
                    else:
                        rem_bwash_vol = num_cols_remaining * vol_remove_eq
                        rem_wells = num_cols_remaining
                    for loop_cols in range(rem_wells):
                        p_96.aspirate(vol_remove_eq, working_plate.wells()[((loop_cols*8)+(rem_wash_beads*3*8))].bottom(z=ASP_HEIGHT))
                    p_96.dispense(rem_bwash_vol, waste_catch.wells()[(0)].top(z=-5))
                    calc_bead_buffer = calc_bead_buffer-(bead_wash_vol*rem_wells)
                    num_cols_remaining = num_cols_remaining - rem_wells
                p_96.drop_tip()
                tip_index = tip_index + 1

#move plate back to shaker
                h_s.open_labware_latch()
                ctx.comment('Moving Working Plate to Heater Shaker')
                ctx.move_labware(labware=working_plate,
                                 new_location=h_s_adapter,
                                 use_gripper=True)
                h_s.close_labware_latch()

            ctx.move_labware(labware=waste_catch,
                             new_location='D4',
                             use_gripper=True)
            ctx.move_labware(labware=prep_sample_plate,
                             new_location='C1',
                             use_gripper=True)
                # waste_vol = vol_remove_eq * num_col * 8
                # waste_vol_chk = waste_vol_chk + waste_vol

################################################### Equilibrate Sample and Sample Addition ###################################################

    if start_point <3:
        if start_point == 1:
            pass
        else:
#move bead plate off magnet
            h_s.open_labware_latch()
            ctx.comment('Moving Working Plate to Heater Shaker')
            ctx.move_labware(labware=working_plate,
                         new_location=h_s_adapter,
                         use_gripper=True)
            h_s.close_labware_latch()

#add eq buffer to empty plate
        p_96.configure_nozzle_layout(
            style=COLUMN,
            start="A12",
            tip_racks=[tips_reused])

        ctx.comment('Adding Sample Equilibration Buffer to Sample Prep Plate')
        p_96.pick_up_tip(tips_reused_loc[tip_index*8])
        p_96.flow_rate.aspirate = default_rate
        p_96.flow_rate.dispense = default_rate

        disp_eq_buffer = math.ceil((num_col_total*sample_equilibration_vol)/1000)
        calc_buffer = num_col_total*sample_equilibration_vol
        num_cols_remaining = num_col_total
        for loop_eq in range(disp_eq_buffer):
            if calc_buffer >1000:
                dist_buff_vol = 1000
                dist_wells = 5
            else:
                dist_buff_vol = num_cols_remaining*200
                dist_wells = num_cols_remaining
            p_96.aspirate(dist_buff_vol, beads_res.wells()[(sample_eq_well+loop_eq)].bottom(z=1).move(types.Point(x=-2)))
            for loop_wells in range(dist_wells):
                p_96.dispense(sample_equilibration_vol, prep_sample_plate.wells()[(loop_wells*8)+(loop_eq*5*8)].bottom(z=4))
            calc_buffer = calc_buffer - (sample_equilibration_vol*dist_wells)
            num_cols_remaining = num_cols_remaining-dist_wells
        p_96.drop_tip()
        tip_index = tip_index + 1

    #add sample to eq buffer plate and transfer to beads
        p_96.flow_rate.aspirate = 200
        p_96.flow_rate.dispense = 200

        if sample_plate_type == "nest_24_wellplate_10400ul":
            ASP_HEIGHT_REMOVE_SAMP = 5
            y_offset = 4
            x_offset = -5
        else:
            ASP_HEIGHT_REMOVE_SAMP = 3
            y_offset = 0
            x_offset = 0

        bottom_location = sample_plate.wells()[(0)].bottom(z=ASP_HEIGHT_REMOVE_SAMP)
        adjusted_location = bottom_location.move(types.Point(x=x_offset, y=y_offset))

        ctx.comment('Mixing Sample in Equilibration Buffer')
        p_96.configure_nozzle_layout(
            style=ALL,
            tip_racks=[tips_sample])

        p_96.pick_up_tip(tips_sample)
        p_96.aspirate(SAMPLE_VOL, adjusted_location)
        p_96.dispense(SAMPLE_VOL, prep_sample_plate.wells()[(0)].bottom(z=6),push_out=0)
        p_96.mix(3, SAMPLE_VOL-100)
        p_96.aspirate((SAMPLE_VOL + sample_equilibration_vol),prep_sample_plate.wells()[(0)].bottom(z=ASP_HEIGHT))
        p_96.dispense((SAMPLE_VOL + sample_equilibration_vol), working_plate.wells()[(0)].top(z=-2),push_out=0)
        p_96.mix(2, 500, working_plate.wells()[(0)].bottom(z=2))
        p_96.air_gap(20)
        p_96.return_tip()

###################################################### Protein Capture ######################################################
    if start_point < 4:

#move bead plate if not already on heater shaker
        if start_point >2:
            h_s.open_labware_latch()
            ctx.move_labware(labware=working_plate,
                             new_location=h_s_adapter,
                             use_gripper=True
                             )
            h_s.close_labware_latch()
        if start_point <3: pass
        else:
#transfer pre-equilibrated sample to bead plate
            p_96.configure_nozzle_layout(
                style=ALL,
                tip_racks=[tips_sample])
            ctx.comment('Transfer Pre-Equilibrated Sample to Working Plate')

            p_96.pick_up_tip(tips_sample)
            p_96.flow_rate.aspirate = default_rate
            p_96.flow_rate.dispense = 200
            transfer_vol_sample = SAMPLE_VOL + sample_equilibration_vol
            p_96.aspirate(transfer_vol_sample, sample_plate.wells()[(0)].bottom(z=ASP_HEIGHT))
            p_96.dispense(transfer_vol_sample, working_plate.wells()[(0)].top(z=-2), push_out =0)
            p_96.mix(3, transfer_vol_sample/2, working_plate.wells()[(0)].bottom(z=3))
            p_96.touch_tip()
            p_96.air_gap(20)
            p_96.return_tip()

        ctx.comment('Mixing Beads and Sample on Heater Shaker')

#mix with a quick pulse to put beads in solution, then hold for parameter value
        capture_loop= math.ceil((incubation_min*60)/(shake_time_SA+shake_time_SA_2+8))
        h_s.close_labware_latch()


        for zhuzh in range(capture_loop):
            h_s.set_and_wait_for_shake_speed(rpm=shake_speed_SA)
            ctx.delay(seconds=shake_time_SA)
            h_s.deactivate_shaker()
            ctx.delay(seconds=shake_time_SA_2)

#move back to magnet for removal of supernatant
        h_s.open_labware_latch()
        ctx.comment('Moving Working Plate to Magnet')

        ctx.move_labware(labware=working_plate,
                         new_location=mag,
                         use_gripper=True
                         )
        ctx.delay(minutes=MAG_DELAY_MIN)

#remove sample supernatant and return to sample plate
        p_96.flow_rate.aspirate = 100
        p_96.flow_rate.dispense = 200


        transfer_vol_sample = (SAMPLE_VOL +sample_equilibration_vol)
        top_location = sample_plate.wells()[(0)].top(z=-2)
        top_location_above = sample_plate.wells()[(0)].top(z=2)

        if sample_plate_type == "nest_24_wellplate_10400ul":
            y_offset = 4
            x_offset = -5
            top_adjusted_location = top_location.move(types.Point(x=x_offset, y=y_offset))
            top_location_above_adjusted = top_location.move(types.Point(x=x_offset, y=y_offset))

        else:
            top_adjusted_location = top_location
            top_location_above_adjusted = top_location_above

        ctx.comment('Removing Bound Sample Supernatant from Beads and Returning to Sample Plate')

        p_96.pick_up_tip(tips_sample_loc[(0)])
        p_96.aspirate(transfer_vol_sample/2, working_plate.wells()[(0)].bottom((6+ASP_HEIGHT_BEAD_EQ)))
        p_96.flow_rate.aspirate = 20
        p_96.aspirate(transfer_vol_sample/2, working_plate.wells()[(0)].bottom(ASP_HEIGHT_BEAD_EQ))
        p_96.dispense(transfer_vol_sample, top_location_above_adjusted)
        p_96.aspirate(20, top_location_above_adjusted)
        p_96.return_tip()

######################################################### Wash #########################################################
    if start_point < 5:
        for g in range(WASH_TIMES):
            h_s.open_labware_latch()
            ctx.comment('Moving Working Plate to Heater Shaker')

            ctx.move_labware(labware=working_plate,
                                         new_location=h_s_adapter,
                                         use_gripper=True)
            h_s.close_labware_latch()
            p_96.flow_rate.aspirate = default_rate
            p_96.flow_rate.dispense = default_rate

            p_96.configure_nozzle_layout(
                style=COLUMN,
                start= 'A12',
                tip_racks=[tips_reused_loc])

            p_96.pick_up_tip(tips_reused_loc[(tip_index*8)])

            ctx.comment('Add Wash Buffer to Working Plate')

#use adjusted location so single column of tips doesn't land on the ridge, but in the well divets
                #would not be necessary if using alternative labware
            wash_res_location = wash_res.wells()[0].bottom(z=ASP_HEIGHT)
            for g in range(num_col_total):
                p_96.aspirate(WASH_VOL, wash_res_location.move(types.Point(x=-4.5)))
                p_96.dispense(WASH_VOL, working_plate.wells()[(g * 8)].top(z=-2))
            p_96.drop_tip()
            tip_index = tip_index + 1

#shake briefly to wash sample-bound beads
            mix(MIX_SAMPLE_WASH, MIX_SEC)

#move back to magnet to bind beads before wash removal
            h_s.open_labware_latch()
            ctx.move_labware(labware=working_plate,
                             new_location=mag,
                             use_gripper=True
                             )
            ctx.delay(minutes=MAG_DELAY_MIN)

            p_96.configure_nozzle_layout(
                style=ALL,
                tip_racks=[tips_sample_loc])

#remove wash
            p_96.pick_up_tip(tips_sample_loc[(0)])
            p_96.flow_rate.aspirate = 100
            p_96.flow_rate.dispense = default_rate
            ctx.comment('Removing Wash Buffer from Working Plate')
            p_96.aspirate(((WASH_VOL*1.1)/2), working_plate.wells()[(0)].bottom(z=ASP_HEIGHT_BEAD_EQ+6))
            p_96.flow_rate.aspirate = 20
            p_96.aspirate(((WASH_VOL*1.1)/2), working_plate.wells()[(0)].bottom(z=ASP_HEIGHT_BEAD_EQ))
            p_96.dispense(WASH_VOL*1.1, prep_sample_plate.wells()[(0)].top(z=-2))
            p_96.blow_out()
            p_96.air_gap(20)
            p_96.return_tip()

#move labware to make space for elution tips
        ctx.move_labware(labware=tips_sample,
                     new_location='C4',
                     use_gripper=True)
        ctx.move_labware(labware=tips_elu,
                         new_location= adapter_A2,
                         use_gripper=True)

######################################################### Elution #########################################################
    for i in range(ELUTION_TIMES):

#move bead plate to heater shaker for elution
        h_s.open_labware_latch()
        ctx.comment('Moving Working Plate to Heater Shaker')

        ctx.move_labware(labware=working_plate,
                         new_location=h_s_adapter,
                         use_gripper=True
                         )
        h_s.close_labware_latch()

        p_96.flow_rate.aspirate = default_rate
        p_96.flow_rate.dispense = default_rate

        total_elu_vol = ELUTION_VOL*1.1*num_col_total
        elu_loops = math.ceil(total_elu_vol/1000)
        num_cols_remaining = num_col_total


#add elution buffer
        p_96.configure_nozzle_layout(
            style=COLUMN,
            start="A12",
            tip_racks=[tips_reused])
        p_96.pick_up_tip(tips_reused_loc[(tip_index * 8)])
        max_elu_volume = 7000
        used_elu_volume = 0
        ctx.comment('Dispensing Elution Buffer onto Beads')
        for disp_elu in range(elu_loops):
            if total_elu_vol > 1000:
                dist_elu_vol = 990
                dist_wells = 9
            else:
                dist_elu_vol = num_cols_remaining * ELUTION_VOL*1.1
                dist_wells = num_cols_remaining
            if used_elu_volume > max_elu_volume:
                elute_well += 1
                used_elu_volume =0
            p_96.aspirate(dist_elu_vol, beads_res.wells()[(elute_well)].bottom(z=ASP_HEIGHT))
            for j in range(dist_wells):
                p_96.dispense(ELUTION_VOL*1.1, working_plate.wells()[((j*8)+(disp_elu*8*9))].bottom(z=8))
            used_elu_volume += dist_elu_vol*8
            total_elu_vol = total_elu_vol - (ELUTION_VOL*1.1 * dist_wells)
            num_cols_remaining = num_cols_remaining - dist_wells
        p_96.drop_tip()
        tip_index = tip_index + 1

#shake for elution time
        mix(ELUTION_SPEEND,ELUTION_MIN*60)

#capture beads on magnet for elution
        h_s.open_labware_latch()
        ctx.move_labware(labware=working_plate,
                         new_location=mag,
                         use_gripper=True)
        ctx.delay(minutes=MAG_DELAY_MIN)

        temp.open_lid()

#remove elution and put in final plate
        p_96.configure_nozzle_layout(
            tip_racks = tips_elu,
            style=ALL)
        ctx.comment('Removing Elution Buffer and transferring to Final Plate')

        p_96.pick_up_tip(tips_elu)
        p_96.flow_rate.aspirate = 5
        p_96.aspirate(ELUTION_VOL, working_plate.wells()[(0)].bottom(z=ASP_HEIGHT_ELUTION))
        p_96.flow_rate.dispense = 20
        p_96.dispense(ELUTION_VOL, final_plate.wells()[(0)].top(z=-2))
        p_96.air_gap(20)
        # if i == ELUTION_TIMES-1: p_96.drop_tip()
        # else:
        p_96.return_tip()

#close lid until User returns to open
        temp.close_lid()
        temp.set_block_temperature(temperature=4)
#cool down temperature module

#Pause to allow user to control when temp module can be turned off
    ctx.pause('Press Continue to Open Thermocycler Lid.')
    temp.deactivate_block()
    temp.open_lid()