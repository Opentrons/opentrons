from opentrons.types import AxisType, Point
from opentrons.protocol_api import DISPENSE_ACTION, PLUNGER_TOP


metadata = {
    'protocolName': 'Sample Clean-up by Evotips',
    'author': 'Opentrons',
    'description': ''
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.24",
}

def add_parameters(parameters):
    parameters.add_bool(variable_name="test",
                        display_name="Test Run",
                        description=("Protocol paused at several check points "),
                        default=True
                       )
    parameters.add_str(variable_name="labware_sample",
                       display_name="Sample Labware",
                       description=" ",
                       default='eppendorfdeepwellplate96500l_96_wellplate_500ul',
                       choices=[
                               {"display_name": "200µL PCR 96-well Plate", "value": 'opentrons_96_wellplate_200ul_pcr_full_skirt'},
                               {"display_name": "500µL 96-Well Plate ", "value": 'eppendorfdeepwellplate96500l_96_wellplate_500ul'}
                               ]
                      )
    parameters.add_int(variable_name="slot_sample",
                       display_name="Sample Location",
                       description=" ",
                       default=3,
                       choices=[
                               {"display_name": "Slot A1", "value": 0},
                               {"display_name": "Slot B1", "value": 1},
                               {"display_name": "Slot C1", "value": 2},
                               {"display_name": "Slot D1", "value": 3},
                               {"display_name": "Slot B3", "value": 4},
                               {"display_name": "Slot C3", "value": 5}
                               ]
                       )
    parameters.add_str(variable_name="labware_solvent",
                       display_name="Solvent A Labware",
                       description=" ",
                       default='nest_1_reservoir_195ml',
                       choices=[
                               {"display_name": "195mL Reservoir", "value": 'nest_1_reservoir_195ml'},
                               {"display_name": "500µL 96-Well Plate ", "value": 'eppendorfdeepwellplate96500l_96_wellplate_500ul'}
                               ]
                      )
    parameters.add_int(variable_name="slot_solvent",
                       display_name="Solvent A Location",
                       description=" ",
                       default=2,
                       choices=[
                               {"display_name": "Slot A1", "value": 0},
                               {"display_name": "Slot B1", "value": 1},
                               {"display_name": "Slot C1", "value": 2},
                               {"display_name": "Slot D1", "value": 3},
                               {"display_name": "Slot B3", "value": 4},
                               {"display_name": "Slot C3", "value": 5}
                               ]
                       ) 
    parameters.add_str(variable_name="labware_rinse",
                       display_name="Solvent B Labware",
                       description="If rinsing Evotips with Solvent B......",
                       default='',
                       choices=[
                               {"display_name": "N/A", "value": ''},
                               {"display_name": "195mL Reservoir", "value": 'nest_1_reservoir_195ml'},
                               {"display_name": "500µL 96-Well Plate ", "value": 'eppendorfdeepwellplate96500l_96_wellplate_500ul'}
                               ]
                      )
    parameters.add_int(variable_name="slot_rinse",
                       display_name="Solvent B Location",
                       description="If rinsing Evotips with Solvent B......",
                       default=-1,
                       choices=[
                               {"display_name": "N/A", "value": -1},
                               {"display_name": "Slot A1", "value": 0},
                               {"display_name": "Slot B1", "value": 1},
                               {"display_name": "Slot C1", "value": 2},
                               {"display_name": "Slot D1", "value": 3},
                               {"display_name": "Slot B3", "value": 4},
                               {"display_name": "Slot C3", "value": 5}
                               ]
                       )  
    parameters.add_int(variable_name="time_soaking",
                       display_name="Soaking Time",
                       description=" ",
                       default=30,
                       minimum=10,
                       maximum=60,
                       unit="seconds"
                       ) 
    parameters.add_int(variable_name="slot_soaking",
                       display_name="Soaking Plate Location",
                       description=" ",
                       default=1,
                       choices=[
                               {"display_name": "Slot A1", "value": 0},
                               {"display_name": "Slot B1", "value": 1},
                               {"display_name": "Slot C1", "value": 2},
                               {"display_name": "Slot D1", "value": 3},
                               {"display_name": "Slot B3", "value": 4},
                               {"display_name": "Slot C3", "value": 5}
                               ]
                       ) 
    parameters.add_int(variable_name="type_dumpster",
                       display_name="Tip Disposal",
                       description=" ",
                       default=2,
                       choices=[
                               {"display_name": "Trash Bin", "value": 1},
                               {"display_name": "Waste Chute", "value": 2},
                               {"display_name": "Returned to tiprack", "value": 3}
                               ]
                       )


EVOSEP_TEMPORARY_OFFSET = 0
DELAY = 15
DELAY_RINSE = 30


def run(ctx):
    
    global test
    global labware_sample
    global slot_sample
    global labware_solvent
    global slot_solvent
    global labware_rinse
    global slot_rinse
    global time_soaking
    global slot_soaking
    # global vol_extra
    global type_dumpster
    global h_tip_in_well

    test = ctx.params.test
    labware_sample = ctx.params.labware_sample
    slot_sample = ctx.params.slot_sample
    labware_solvent = ctx.params.labware_solvent
    slot_solvent= ctx.params.slot_solvent
    labware_rinse = ctx.params.labware_rinse
    slot_rinse = ctx.params.slot_rinse
    time_soaking = ctx.params.time_soaking
    slot_soaking = ctx.params.slot_soaking
    # vol_extra = ctx.params.vol_extra
    type_dumpster= ctx.params.type_dumpster


    if test: h_tip_in_well = 3
    else: h_tip_in_well = -43


    open_slot = ['A1', 'B1', 'C1', 'D1', 'B3', 'C3']

    sample_plate = ctx.load_labware(labware_sample, open_slot[slot_sample], 'Samples')
    sample = sample_plate.wells()[0]

    sol_a_plate = ctx.load_labware(labware_solvent, open_slot[slot_solvent], 'Solvent A')
    sol_a = sol_a_plate.wells()[0]

    if slot_rinse != -1 and labware_rinse != '':
        sol_b_plate = ctx.load_labware(labware_rinse, open_slot[slot_rinse], 'Solvent B')
        sol_b = sol_b_plate.wells()[0]

    soak_plate = ctx.load_adapter('ev_resin_tips_flex_short_adapter', open_slot[slot_soaking])

    if type_dumpster == 1: ctx.load_trash_bin('D3')
    elif type_dumpster == 2: ctx.load_waste_chute()


    evotips_adapter = ctx.load_adapter('ev_resin_tips_flex_96_tiprack_adapter', 'D2')
    evosep_tips_labware = evotips_adapter.load_labware('ev_resin_tips_flex_96_labware', 'Evotips')
    evotip = evosep_tips_labware.wells()[0]


    if slot_rinse != -1 and labware_rinse != '':
        tipbox_slot = ['A3', 'C2', 'B2']
    else:
        tipbox_slot = ['C2', 'B2']

    tips_200 = ctx.load_labware('opentrons_flex_96_tiprack_200ul', 'A2', '200uL tips', adapter='opentrons_flex_96_tiprack_adapter')
    tips_50 = [ctx.load_labware('opentrons_flex_96_tiprack_50ul', slot, '50uL tips', adapter='opentrons_flex_96_tiprack_adapter')
                               for slot in tipbox_slot]
                               
    p1k_96 = ctx.load_instrument('flex_96channel_1000') 




    robot_api = ctx.robot

    def process_resin_tips(wait, s=1):

        p1k_96.move_to(evotip.top(0))

        move_pip_to_bot = robot_api.plunger_coordinates_for_named_position("left", PLUNGER_TOP)
        robot_api.move_axes_to(axis_map=move_pip_to_bot, speed=15)

        prep_distance = 8.25
        press_distance = 5.5
        ejector_push_mm = 7.0
        retract_distance = -1*(prep_distance + press_distance)
        robot_api.move_axes_relative(axis_map={AxisType.Z_L: -6}, speed=10)

        # Drive Q down 3mm at fast speed - look into the pick up tip fuinction to find slow and fast: 10.0
        robot_api.move_axes_relative(axis_map={AxisType.Q: prep_distance}, speed=10.0)
        # 5.5mm at slow speed - cam action pickup speed: 2.0
        robot_api.move_axes_relative(axis_map={AxisType.Q: press_distance}, speed=2.0)
        # retract cam : 13.75
        robot_api.move_axes_relative(axis_map={AxisType.Q: retract_distance}, speed=5.5)

        # Lower tip presence
        robot_api.move_axes_relative(axis_map={AxisType.Z_L: 2}, speed=10)
        robot_api.move_axes_relative(axis_map={AxisType.Q: ejector_push_mm}, speed=5.5)
        robot_api.move_axes_relative(axis_map={AxisType.Q: -1*ejector_push_mm}, speed=5.5)

        # Lift the Pipette slightly before ejecting
        robot_api.move_axes_relative(axis_map={AxisType.Z_L: 6}, speed=10)


        # speed 0.15 >>> 2 uL/s
        # speed 0.075 >>> 1 uL/s
        # speed 7.5 >>> 100 uL/s
        # 1000 to 600 >>> 400 uL
        # 600 to 470 >>> 130 uL
        dispense_liquid = robot_api.plunger_coordinates_for_volume("left", 600, DISPENSE_ACTION)
        robot_api.move_axes_to(axis_map=dispense_liquid, speed=7.5)
        if s == 1:
            dispense_liquid = robot_api.plunger_coordinates_for_volume("left", 470, DISPENSE_ACTION)
            robot_api.move_axes_to(axis_map=dispense_liquid, speed=0.075)

        ctx.delay(seconds=wait)



        robot_api.move_axes_relative(axis_map={AxisType.Z_L: 8}, speed=10)

        drop_tip_distance = (19.0 + 10.8)
        # Eject the Evo Tips
        robot_api.move_axes_relative(axis_map={AxisType.Q: drop_tip_distance}, speed=10)
        robot_api.move_axes_relative(axis_map={AxisType.Q: -1*drop_tip_distance}, speed=10)

        # Retract the pipette
        robot_api.move_axes_relative(axis_map={AxisType.Z_L: 35}, speed=10)



    # rinsing w/ 20 uL

    if slot_rinse != -1 and labware_rinse != '':
        p1k_96.tip_racks = tips_50
        p1k_96.pick_up_tip()     

        p1k_96.flow_rate.aspirate = 20
        p1k_96.flow_rate.dispense = 5

        p1k_96.aspirate(20, sol_b.bottom(z=2))
        ctx.delay(seconds=1)

        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

        if test: ctx.pause('')

        p1k_96.dispense(20, evotip.top(z=EVOSEP_TEMPORARY_OFFSET-37), push_out=0)  
        ctx.delay(seconds=1)
        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET-30), speed=0.5) 
        p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET+5)) 

        if test: ctx.pause('') 

        if test: 
            p1k_96.return_tip()   
        else:
            if type_dumpster == 3: p1k_96.return_tip()
            else: p1k_96.drop_tip()    


        # soaking tips 

        ctx.move_labware(labware=evosep_tips_labware,
                        new_location=soak_plate,
                        use_gripper=True,
                        pick_up_offset={'x':0, 'y':0, 'z':0},
                        drop_offset={'x':0,'y':0,'z':0}
                        ) 
        
        if test: ctx.pause(' ')
        else: ctx.delay(seconds=time_soaking)

        ctx.move_labware(labware=evosep_tips_labware, 
                        new_location=evotips_adapter, 
                        use_gripper=True
                        )
        

        # sealing tips/applying pressure/unsealing tips

        process_resin_tips(DELAY_RINSE, 0)  



    #### adding 15 uL and then 20 uL

    p1k_96.tip_racks = tips_50
    p1k_96.pick_up_tip()

    p1k_96.flow_rate.aspirate = 6
    p1k_96.flow_rate.dispense = 6

    p1k_96.aspirate(15, sol_a.bottom(z=2))
    ctx.delay(seconds=1)

    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

    if test: ctx.pause('')

    p1k_96.dispense(15, evotip.top(z=EVOSEP_TEMPORARY_OFFSET-39), push_out=0)  ## -36
    ctx.delay(seconds=1)
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET-34), speed=0.5)  ## -31
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET+5))

    if test: 
        p1k_96.return_tip()   
    else:
        if type_dumpster == 3: p1k_96.return_tip()
        else: p1k_96.drop_tip()   

    if test: ctx.pause('')

    
    p1k_96.pick_up_tip()

    p1k_96.aspirate(20, sample.bottom(z=1))
    ctx.delay(seconds=1)

    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

    p1k_96.dispense(20, evotip.top(z=EVOSEP_TEMPORARY_OFFSET-30), push_out=0)  ## -27
    ctx.delay(seconds=1)
    p1k_96.move_to(evotip.top(EVOSEP_TEMPORARY_OFFSET-25), speed=2)  ## -22
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET+5))

    if test: 
        p1k_96.return_tip()   
    else:
        if type_dumpster == 3: p1k_96.return_tip()
        else: p1k_96.drop_tip()

    if test: ctx.pause('')


    #### adding 150 uL

    H = 20
    D = 1

    p1k_96.tip_racks = [tips_200]
    p1k_96.pick_up_tip()

    p1k_96.flow_rate.aspirate = 200
    p1k_96.aspirate(150, sol_a.bottom(z=2))
    ctx.delay(seconds=1)

    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

    p1k_96.flow_rate.dispense = 1
    p1k_96.dispense(50, evotip.top(z=EVOSEP_TEMPORARY_OFFSET-H).move(Point(x=-D, y=D)))
    p1k_96.flow_rate.dispense = 4
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET-H).move(Point(x=0)), speed=5)
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET-H+5).move(Point(x=0)), speed=5)
    p1k_96.dispense(100, evotip.top(z=EVOSEP_TEMPORARY_OFFSET-H+5).move(Point(x=0)))
    ctx.delay(seconds=1)

    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))

    if test: 
        p1k_96.return_tip()   
    else:
        if type_dumpster == 3: p1k_96.return_tip()
        else: p1k_96.drop_tip()

    if test: ctx.pause('')


    # soaking tips 

    ctx.move_labware(labware=evosep_tips_labware,
                     new_location=soak_plate,
                     use_gripper=True
                    ) 
       
    if test: ctx.pause(' ')
    else: ctx.delay(seconds=time_soaking)

    ctx.move_labware(labware=evosep_tips_labware, 
                     new_location=evotips_adapter, 
                     use_gripper=True
                    )


    # sealing tips/applying pressure/unsealing tips

    process_resin_tips(DELAY)

