"""Multi-Channel Pipette Dynamic Tip Overlap Test."""
import argparse
import asyncio
import csv
import time
from typing import Dict, Literal
import datetime
import os, sys
import termios
import tty
import json
from dataclasses import dataclass

from hardware_testing.opentrons_api.types import (
    OT3Mount,
    Axis,
    Point,
    CriticalPoint,
)

from opentrons.hardware_control.motion_utilities import target_position_from_relative

from hardware_testing.opentrons_api import helpers_ot3

from hardware_testing import data
from hardware_testing.drivers import mitutoyo_digimatic_indicator

PRESS_DISTANCE = 15
NOZZLE_DIAMETER = 5
RADIUS = NOZZLE_DIAMETER/2 + 2.0
PREP_PRESS_DISTANCE = 5
TIP_PRESS_MOTOR_CURRENT = 0.55

@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    pipette: Literal[50, 200, 1000]

def dict_keys_to_line(dict):
    return str.join(",", list(dict.keys())) + "\n"

def file_setup(test_data, details):
    today = datetime.date.today()
    test_name = "{}-dynamic-tipoverlap-test-{}".format(
        details[0],  # Pipette model
        details[1],  # Motor Current
    )
    test_header = dict_keys_to_line(test_data)
    test_tag = "-{}".format(today.strftime("%b-%d-%Y"))
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(test_name)
    test_file = data.create_file_name(test_name, test_id, test_tag)
    data.append_data_to_file(test_name, test_id, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return test_name, test_file, test_id

def dial_indicator_setup(port):
    gauge = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port=port)
    gauge.connect()
    return gauge

def getch():
    """
    fd: file descriptor stdout, stdin, stderr
    This functions gets a single input keyboard character from the user
    """

    def _getch():
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            ch = sys.stdin.read(1)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        return ch

    return _getch()

async def jog(api, position, cp) -> Dict[Axis, float]:
    step_size = [0.01, 0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    xy_speed = 60
    za_speed = 65
    information_str = """
        Click  >>   i   << to move up
        Click  >>   k   << to move down
        Click  >>   a  << to move left
        Click  >>   d  << to move right
        Click  >>   w  << to move forward
        Click  >>   s  << to move back
        Click  >>   +   << to Increase the length of each step
        Click  >>   -   << to decrease the length of each step
        Click  >> Enter << to save position
        Click  >> q << to quit the test script
                    """
    print(information_str)
    while True:
        input = getch()
        if input == "a":
            # minus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(-step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "d":
            # plus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "w":
            # minus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "s":
            # plus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, -step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "i":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, step_size[step_length_index]), speed=za_speed
            )

        elif input == "k":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, -step_size[step_length_index]), speed=za_speed
            )

        elif input == "q":
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == "+":
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 7:
                step_length_index = 7
            step = step_size[step_length_index]

        elif input == "-":
            sys.stdout.flush()
            step_length_index = step_length_index - 1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == "\r":
            sys.stdout.flush()
            await api._update_position_estimation([Axis.by_mount(mount)])
            position = await api.encoder_current_position_ot3(
                mount, critical_point=cp, refresh=True
            )
            print("\r\n")
            return position
        await api._update_position_estimation([Axis.by_mount(mount)])
        position = await api.encoder_current_position_ot3(
            mount, critical_point=cp, refresh = True
        )

        print(
            "Coordinates: ",
            round(position[Axis.X], 2),
            ",",
            round(position[Axis.Y], 2),
            ",",
            round(position[Axis.by_mount(mount)], 2),
            " Motor Step: ",
            step_size[step_length_index],
            end="",
        )
        print("\r", end="")

async def update_pickup_tip_speed(api, mount, speed) -> None:
    """Update drop-tip current."""
    pipette = helpers_ot3._get_pipette_from_mount(api, mount)
    config_model = pipette.pick_up_configurations
    config_model.speed = speed
    pipette.pick_up_configurations = config_model
    print(pipette.pick_up_configurations)

async def move_to_point(api, mount, point, cp):
    home_pos = api.get_instrument_max_height(mount, cp)
    home_offset = 5
    pos = await api.current_position_ot3(mount, refresh=True, critical_point = cp)
    await api.move_to(mount,
                    Point(pos[Axis.X],
                        pos[Axis.Y],
                        home_pos-home_offset),
                    speed=None,
                    expect_stalls=False)
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        home_pos-home_offset),
                    speed=None,
                    expect_stalls=False)
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        point.z),
                    speed=None,
                    expect_stalls=False)
    
async def move_direct(api, mount, point, cp):
    offset = 5
    pos = await api.current_position_ot3(mount, refresh=True, critical_point = cp)
    # input("Presss Enter to Continue 0")
    await api.move_to(mount,
                    Point(pos[Axis.X],
                        pos[Axis.Y],
                        pos[Axis.by_mount(mount)] + offset),
                    speed=None,
                    expect_stalls=False)
    # input("Press Enter to continue 1")
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        pos[Axis.by_mount(mount)] + offset),
                    speed=None,
                    expect_stalls=False)
    # input("Press Enter to Continue 2")
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        point.z),
                    speed=None,
                    expect_stalls=False
                    )

def load_config_(filename: str) -> Dict:
    """This function loads a given config file"""
    try:
        with open(filename, 'r') as file:
            data = json.load(file)
    except FileNotFoundError:
        print('Warning: {0} not found'.format(filename))
        data = {}
    except json.decoder.JSONDecodeError:
        print('Error: {0} is corrupt'.format(filename))
        data = {}
    return data

def save_config_(filename: str, data: str) -> Dict:
    """This function saves a given config file with data"""
    try:
        with open(filename, 'w') as file:
            json.dump(
                data, file, sort_keys=True, indent=4, separators=(',', ': ')
                    )
    except FileNotFoundError:
        print('Warning: {0} not found'.format(filename))
        data = {}
    except json.decoder.JSONDecodeError:
        print('Error: {0} is corrupt'.format(filename))
        data = {}
    return data

async def move_to_tip(api, mount, point, cp):
    home_pos = api.get_instrument_max_height(mount, cp)
    home_offset = 0
    pos = await api.current_position_ot3(mount, refresh=True, critical_point = cp)
    await api.move_to(mount,
                    Point(pos[Axis.X],
                        pos[Axis.Y],
                        home_pos-home_offset),
                    speed=None,
                    critical_point = cp,
                    expect_stalls=False,
                    )
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        home_pos-home_offset),
                    speed=None,
                    critical_point = cp,
                    expect_stalls=False)
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        point.z),
                    speed=None,
                    critical_point = CriticalPoint.NOZZLE,
                    expect_stalls=False)

async def calibrate_tiprack(api, home_position, mount):
    cp = CriticalPoint.NOZZLE
    tiprack_loc = Point(
                    deck_slot['deck_slot'][args.tiprack_slot]['X'],
                    deck_slot['deck_slot'][args.tiprack_slot]['Y'],
                    deck_slot['deck_slot'][args.tiprack_slot]['Z'])
    print(tiprack_loc)
    print("Calibrate for Pick up tip")
    await move_to_point(api, mount, tiprack_loc, cp)
    current_position = await api.current_position_ot3(mount, cp)
    tiprack_loc = await jog(api, current_position, cp)
    tiprack_loc = Point(tiprack_loc[Axis.X],
                        tiprack_loc[Axis.Y],
                        tiprack_loc[Axis.by_mount(mount)])
    return tiprack_loc

async def update_pick_up_current(api, mount, tip_count, current) -> None:
    """Update pick-up-tip current."""
    pipette = helpers_ot3._get_pipette_from_mount(api, mount)
    pipette.get_pick_up_configuration_for_tip_count(tip_count).current_by_tip_count.update({tip_count: current})
    print(f'Settings: {pipette.get_pick_up_configuration_for_tip_count(tip_count)}')

async def update_pick_up_distance(api, mount, tip_count, distance) -> None:
    """Update pick-up-tip current."""
    pipette = helpers_ot3._get_pipette_from_mount(api, mount)
    pipette.get_pick_up_configuration_for_tip_count(tip_count).distance = distance
    print(f'Settings: {pipette.get_pick_up_configuration_for_tip_count(tip_count)}')

async def _main(args: argparse.Namespace, cfg: TestConfig) -> None:
    today = datetime.date.today()

    hw_api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=cfg.simulate,
        pipette_left='p1000_96_v3.4',
        stall_detection_enable=False,
    )
    fw = hw_api.get_fw_version()
    print(f'fw version: {fw}')
    await hw_api.cache_instruments()
    settings = helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(hw_api, 
                                                                        Axis.by_mount(mount))
    default_current = settings.run_current
    print(f"Default run Current: {default_current}")
    pipette_model = hw_api.get_all_attached_instr()[OT3Mount.LEFT]["pipette_id"]
    instrument = hw_api._pipette_handler.get_pipette(mount)
    spec = hw_api._pipette_handler.plan_lt_pick_up_tip(
        mount,
        instrument.nozzle_manager.current_configuration.tip_count,
        presses = 1,
        increment = 0
        )
    print(f"Pipette_model: {pipette_model}")
    dial_data = {'Tip': None,
                'Initial Press Dist(mm)': None,
                'Final Press Dist(mm)': None,
                'TipOverlap Enc(mm)': None,
                'PressComp(mm)': None,
                'tip_enc_pos(mm)': None,
                'CurrentTipLength': None,
                'NewTipLength': None,
                'Nozzle Z Position': None,
                'Nozzle 1': None,
                'Nozzle 2': None,
                'Nozzle 3': None,
                'Nozzle 4': None,
                'Nozzle 5': None,
                'Nozzle 6': None,
                'Nozzle 7': None,
                'Nozzle 8': None,
                'Tip 1': None,
                'Tip 2': None,
                'Tip 3': None,
                'Tip 4': None,
                'Tip 5': None,
                'Tip 6': None,
                'Tip 7': None,
                'Tip 8': None,
                'New TipL 1': None,
                'New TipL 2': None,
                'New TipL 3': None,
                'New TipL 4': None,
                'New TipL 5': None,
                'New TipL 6': None,
                'New TipL 7': None,
                'New TipL 8': None,
                'Motor Current': None,
                }
    print(f'Dictionary: {dial_data}')
    instrument = hw_api._pipette_handler.get_pipette(OT3Mount.LEFT)
    details = [pipette_model, 'default-current']
    test_n, test_f, test_ID = file_setup(dial_data, details)
    try:
        await hw_api.home()
        await hw_api.set_lights(rails=True)
        home_position = await hw_api.current_position_ot3(mount)
        start_time = time.perf_counter()
        cp = CriticalPoint.NOZZLE
        measurements = []

        if (args.measure_nozzles):
            home_wo_tip = await hw_api.current_position_ot3(mount, cp)
            initial_dial_loc = Point(
                                deck_slot['deck_slot'][args.dial_slot]['X'],
                                deck_slot['deck_slot'][args.dial_slot]['Y'],
                                deck_slot['deck_slot'][args.dial_slot]['Z'],
                                # home_wo_tip[Axis.by_mount(mount)]
            )
            print("Move Nozzle to Dial Indicator")
            await move_to_point(hw_api, mount, initial_dial_loc, cp)
            current_position = await hw_api.current_position_ot3(mount, cp)
            nozzle_loc = await jog(hw_api, current_position, cp)
            nozzle_loc = Point(
                                nozzle_loc[Axis.X],
                                nozzle_loc[Axis.Y],
                                nozzle_loc[Axis.by_mount(mount)])
            deck_slot['deck_slot'][args.dial_slot][Axis.X.name] = nozzle_loc.x
            deck_slot['deck_slot'][args.dial_slot][Axis.Y.name] = nozzle_loc.y
            deck_slot['deck_slot'][args.dial_slot]['Z'] = nozzle_loc.z
            save_config_(path+cal_fn, deck_slot)
            number_of_channels = args.nozzles
            num_of_columns = args.num_cols
            x_offset = 0
            y_offset = 0
            nozzle_measurement_map = []
            for noz in range(1, number_of_channels + 1):
                cp = CriticalPoint.NOZZLE
                nozzle_position = Point(nozzle_loc.x + x_offset,
                                        nozzle_loc.y + y_offset,
                                        nozzle_loc.z)
                await move_to_point(hw_api, mount, nozzle_position, cp)
                time.sleep(0.5)
                nozzle_measurement = gauge.read()
                time.sleep(0.5)
                nozzle_measurement_map.append(nozzle_measurement)
                print("nozzle-",noz, "(mm): " , nozzle_measurement, end="")
                print("\r", end="")
                print("\r\n")
                if noz % num_of_columns == 0:
                    y_offset += 9
                if noz % num_of_columns == 0:
                    x_offset = 0
            print(f'Nozzle Measurements: {nozzle_measurement_map}')
        # Calibrate to tiprack
        if (args.calibrate):
            pickup_loc = await calibrate_tiprack(hw_api, home_position, mount)
            deck_slot['deck_slot'][args.tiprack_slot][Axis.X.name] = pickup_loc.x
            deck_slot['deck_slot'][args.tiprack_slot][Axis.Y.name] = pickup_loc.y
            deck_slot['deck_slot'][args.tiprack_slot]['Z'] = pickup_loc.z
            save_config_(path+cal_fn, deck_slot)
            # Target should be the top of the side of the tip
            prep_target = Point(x=pickup_loc.x+RADIUS, 
                                y=pickup_loc.y, 
                                z=pickup_loc.z+PREP_PRESS_DISTANCE)
            
            await move_direct(hw_api, mount, prep_target, cp)
            async with hw_api._backend.motor_current(run_currents={Axis.by_mount(mount): TIP_PRESS_MOTOR_CURRENT}):
                target = Point(x=pickup_loc.x+RADIUS, 
                                y=pickup_loc.y, 
                                z=pickup_loc.z-PRESS_DISTANCE)
                await hw_api.move_to(mount=mount, 
                                    abs_position=target, 
                                    speed=10, 
                                    critical_point=CriticalPoint.NOZZLE,
                                    max_speeds=None,
                                    expect_stalls=True)
            tip_overlap_measurements = []
            await hw_api._update_position_estimation([Axis.by_mount(mount)])
            init_tipoverlap = (await hw_api.encoder_current_position_ot3(mount, cp, refresh=True))[Axis.by_mount(mount)]
            print(f'init_tipoverlap: {init_tipoverlap}')
            pickup_location = Point(x=pickup_loc.x, y=pickup_loc.y,z=init_tipoverlap) 
            # Let's pressed onto the tip -> stall and measure the encoder position
            await move_direct(hw_api, mount, pickup_location, cp)
            # This would be my initial press position
            # the first tip overlap value passed to pickup tip is a placeholder
            tip_overlap_dict = await hw_api.pick_up_tip(
                                        mount, 
                                        tip_length=(tip_length[args.tip_size]-tip_overlap))
            print(f'Init Position: {init_tipoverlap}')
            print(f'tip_overlap_dict: {tip_overlap_dict}')
            enc_tipoverlap =  (tip_overlap_dict['init'] - tip_overlap_dict['final'])+args.press_comp
            print(f'TipOverlap(mm): {enc_tipoverlap}')
            tip_overlap_measurements.append(enc_tipoverlap)
            instr = hw_api._pipette_handler.get_pipette(mount)
            current_tipL = instr.current_tip_length
            print(f'current_tip end effector: {current_tipL}')
            current_position = (await hw_api.current_position_ot3(mount))[Axis.by_mount(mount)]
            print(f'current_position: {current_position}')

        cp = CriticalPoint.TIP
        #Calibrate Dial Indicator with single tip
        if (args.calibrate):
            initial_dial_loc = Point(nozzle_loc.x,
                                    nozzle_loc.y,
                                    nozzle_loc.z + (tip_length[args.tip_size]-tip_overlap))
            print("Move to Dial Indicator")
            await move_to_tip(hw_api, mount, initial_dial_loc, cp)
            current_position = await hw_api.current_position_ot3(mount, cp)
            dial_loc = await jog(hw_api, current_position, cp)
            dial_loc = Point(dial_loc[Axis.X],
                                dial_loc[Axis.Y],
                                dial_loc[Axis.by_mount(mount)])
            deck_slot['deck_slot'][args.dial_slot][Axis.X.name] = dial_loc.x
            deck_slot['deck_slot'][args.dial_slot][Axis.Y.name] = dial_loc.y
            deck_slot['deck_slot'][args.dial_slot]['Z'] = dial_loc.z
            save_config_(path+cal_fn, deck_slot)

        tips_to_use = args.nozzles
        x_coord_offset = 0
        y_coord_offset = 0
        true_tip_count = 8
        total_tips = int(96/8)
        trial = 1
        num_of_columns = args.num_cols
        measurements_2_map = []
        print(f'Trial: {trial}')
        for tip in range(1, total_tips+1):
            if tip == 13:
                break
            encoder_pos = []
            measurement_map=[]
            cp = CriticalPoint.TIP
            if args.dial_indicator:
                x_offset = 0
                y_offset = 0
                tip_measurement_map = []
                measurements_2_map = []
                for tip_count in range(1, tips_to_use + 1):
                    cp = CriticalPoint.TIP
                    instr.remove_tip()
                    current_position = await hw_api.current_position_ot3(mount)
                    tipL = (tip_length[args.tip_size]-tip_overlap)
                    instr.add_tip(tipL)
                    tip_position = Point(dial_loc[0] + x_offset,
                                            dial_loc[1] + y_offset,
                                            dial_loc[2] + (tip_length[args.tip_size]-tip_overlap))
                    await move_to_tip(hw_api, mount, tip_position, cp)
                    tip_dist = await hw_api.encoder_current_position_ot3(mount, CriticalPoint.NOZZLE)
                    encoder_pos.append(tip_dist[Axis.by_mount(mount)])
                    time.sleep(0.5)
                    tip_measurement = gauge.read()
                    time.sleep(0.5)
                    print("tip-",tip_count, "(mm): " ,tip_measurement,"\r", end="")
                    tip_measurement_map.append(tip_measurement)
                    print("\r\n")
                    instr.remove_tip()
                    current_position = await hw_api.current_position_ot3(mount)
                    new_tipL = (tip_length[args.tip_size]-enc_tipoverlap)
                    instr.add_tip(new_tipL)
                    tip_position = Point(dial_loc[0] + x_offset,
                                            dial_loc[1] + y_offset,
                                            dial_loc[2] + (tip_length[args.tip_size]-enc_tipoverlap))
                    await move_to_tip(hw_api, mount, tip_position, cp)
                    time.sleep(0.5)
                    tip_measurement_2 = gauge.read()
                    time.sleep(0.5)
                    measurements_2_map.append(tip_measurement_2)
                    print("tip-",tip_count, "(mm): " ,tip_measurement_2,"\r", end="")
                    print("\r\n")
                    x_offset -= 9
                    if tip_count % num_of_columns == 0:
                        y_offset += 9
                    if tip_count % num_of_columns == 0:
                        x_offset = 0
                print(f'Tip Position: {tip_measurement_map}')
                print(f'New Tip Position: {measurements_2_map}')
                print(f'TipOverlap Measurements: {tip_overlap_measurements}')

            cp = CriticalPoint.TIP
            drop_tip_location =  Point(pickup_location.x,
                                       pickup_location.y,
                                       pickup_location.z-(tip_length[args.tip_size]-tip_length[args.tip_size]*0.5))
             # 299.66 , 389.04 , 104.5
            await move_to_point(hw_api, mount, drop_tip_location, cp)
            measurement_map.append(true_tip_count)
            measurement_map.append(init_tipoverlap)
            measurement_map.append(tip_overlap_dict['final'])
            measurement_map.append(enc_tipoverlap)
            measurement_map.append(args.press_comp)
            measurement_map.append(tip_dist[Axis.by_mount(mount)])
            measurement_map.append(current_tipL)
            measurement_map.append(new_tipL)
            measurement_map.append(nozzle_loc.z)
            d_str = ''
            for m in measurement_map:
                d_str += str(m) + ','
            print(f"{d_str}")
            for m in nozzle_measurement_map:
                d_str += str(m) + ','
            print(f"{d_str}")
            for m in tip_measurement_map:
                d_str += str(m) + ','
            print(f"{d_str}")
            for m in measurements_2_map:
                d_str += str(m) + ','
            d_str += str(TIP_PRESS_MOTOR_CURRENT) + ','
            d_str = d_str[:-1] + '\n'
            print(f"{d_str}")
            data.append_data_to_file(test_n, test_ID, test_f, d_str)
            await hw_api.drop_tip(mount)
            tips_to_use = args.nozzles
            # tips_to_use = num_of_columns * 8
            cp = CriticalPoint.NOZZLE
            x_dir, y_dir = (1,-1)
            true_tip_count += 8
            if true_tip_count % 8 == 0:
                x_coord_offset = x_coord_offset + x_dir*9
                y_coord_offset = 0
            pickup_location = Point(pickup_loc[0] + x_coord_offset,
                                pickup_loc[1] + y_coord_offset,
                                pickup_loc[2])
            print(f'pick up location: {pickup_location}')
            await move_to_point(hw_api, mount, pickup_location, cp)
            if args.every_press == True:
                #-----------Get the top of the tip by pressing on it with low current--------------
                prep_target = Point(x=pickup_location.x+RADIUS,
                                    y=pickup_location.y,
                                    z=pickup_location.z+PREP_PRESS_DISTANCE)

                await move_direct(hw_api, mount, prep_target, cp)

                async with hw_api._backend.motor_current(run_currents={Axis.by_mount(mount): TIP_PRESS_MOTOR_CURRENT }):       
                    target = Point(x=pickup_location.x+RADIUS, 
                                    y=pickup_location.y, 
                                    z=pickup_location.z-PRESS_DISTANCE)
                    await hw_api.move_to(mount=mount, 
                                        abs_position=target, 
                                        speed=10, 
                                        critical_point=CriticalPoint.NOZZLE,
                                        max_speeds=None,
                                        expect_stalls=True)
                await hw_api._update_position_estimation([Axis.by_mount(mount)])
                init_tipoverlap = (await hw_api.encoder_current_position_ot3(mount, cp, refresh=True))[Axis.by_mount(mount)]
                print(f'init_tipoverlap: {init_tipoverlap}')
            #------------------------------------------------------------------------------------
            pick_up_location = Point(x=pickup_location.x, y=pickup_location.y,z=init_tipoverlap) 

            await move_direct(hw_api, mount, pick_up_location, cp)
            trial += 1
            print(f'Trial: {trial}')
            tip_overlap_dict = await hw_api.pick_up_tip(mount,
                                    tip_length=(tip_length[args.tip_size]-tip_overlap),
                                    presses = 1,
                                    increment = 0)
            print(f'Init Position: {init_tipoverlap}')
            print(f'Tip overlap positions: {tip_overlap_dict}')
            enc_tipoverlap = (tip_overlap_dict['init'] - tip_overlap_dict['final']) + args.press_comp
            print(f'Enc TipOverlap: {enc_tipoverlap}')
            tip_overlap_measurements.append(enc_tipoverlap)
            instr = hw_api._pipette_handler.get_pipette(mount)
            print(f'current_tipL: {instr.current_tip_length}')
            current_position = await hw_api.current_position_ot3(mount)
            new_tipL = (tip_length[args.tip_size]-enc_tipoverlap)
            print(f'new_current_tipL: {new_tipL}')
            cp = CriticalPoint.TIP
            current_position = await hw_api.current_position_ot3(mount, cp)

    except KeyboardInterrupt:
        await hw_api.disengage_axes([Axis.X, Axis.Y])
    finally:
        await hw_api.home()
        await hw_api.disengage_axes([Axis.X, Axis.Y])
        await hw_api.clean_up()

if __name__ == "__main__":
    slot_locs = [
        "A1",
        "A2",
        "A3",
        "B1",
        "B2",
        "B3:",
        "C1",
        "C2",
        "C3",
        "D1",
        "D2",
        "D3",
    ]
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--trough", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C2")
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--calibrate", action="store_true")
    parser.add_argument("--measure_nozzles", action="store_true")
    parser.add_argument("--columns", action="store_true")
    parser.add_argument("--num_cols", type=float, default=1)
    parser.add_argument("--rows", action="store_true")
    parser.add_argument("--num_rows", type=float, default=1)
    parser.add_argument("--tip_size", type=str, default="T1K", help="Tip Size")
    parser.add_argument("--nozzles", type=int, default=8)
    parser.add_argument("--press_comp", type=float, default = 0.0)
    parser.add_argument("--pipette", type=int, choices=[50, 200, 1000], default=1000)
    parser.add_argument("--every_press", action="store_true")
    parser.add_argument("--dial_port", type=str, default="/dev/ttyUSB1", help="Dial indicator Port"
    )
    args = parser.parse_args()
    path = '/data/testing_data/'
    cal_fn = 'calibrations.json'
    if args.calibrate:
        with open(path + cal_fn, 'r') as openfile:
            deck_slot = json.load(openfile)
            print(deck_slot)
    else:
        with open(path + cal_fn, 'r') as openfile:
            deck_slot = json.load(openfile)
    tip_length = {"T1K": 95.6, "T200": 58.35, "T50": 57.9}
    tip_overlap = {"T1K": 9.67, "T200": 9.42, "T50": 9.27}
    tip_overlap = tip_overlap[args.tip_size]
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    if args.dial_indicator:
        gauge = dial_indicator_setup(port=args.dial_port)

    _config = TestConfig(simulate=args.simulate, pipette=args.pipette)

    asyncio.run(_main(args, _config))