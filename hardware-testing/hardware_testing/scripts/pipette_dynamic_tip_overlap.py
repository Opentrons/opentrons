"""Partial Tip Pick up For the 96 Channel."""
import argparse
import asyncio
import csv
import time
from typing import Dict
import datetime
import os, sys
import termios
import tty
import json

from hardware_testing.opentrons_api.types import (
    OT3Mount,
    Axis,
    Point,
    CriticalPoint,
)
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    update_pick_up_speed,
    _get_pipette_from_mount,
)

from opentrons.hardware_control.motion_utilities import target_position_from_relative
from opentrons import types as top_types
from dataclasses import dataclass

from hardware_testing.opentrons_api import helpers_ot3

from hardware_testing import data
from hardware_testing.drivers import mitutoyo_digimatic_indicator

PRESS_DISTANCE = 15
NOZZLE_DIAMETER = 5
RADIUS = NOZZLE_DIAMETER/2
PREP_PRESS_DISTANCE = 5

@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    pipette: Literal[200, 1000]

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
    data.append_data_to_file(test_name, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return test_name, test_file

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
    pipette = _get_pipette_from_mount(api, mount)
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
                        home_pos-home_offset))
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        home_pos-home_offset))
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        point.z))

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
    pipette = _get_pipette_from_mount(api, mount)
    pipette.get_pick_up_configuration_for_tip_count(tip_count).current_by_tip_count.update({tip_count: current})
    print(f'Settings: {pipette.get_pick_up_configuration_for_tip_count(tip_count)}')

async def update_pick_up_distance(api, mount, tip_count, distance) -> None:
    """Update pick-up-tip current."""
    pipette = _get_pipette_from_mount(api, mount)
    pipette.get_pick_up_configuration_for_tip_count(tip_count).distance = distance
    print(f'Settings: {pipette.get_pick_up_configuration_for_tip_count(tip_count)}')

async def _main(args: argparse.Namespace, cfg: TestConfig) -> None:
    today = datetime.date.today()

    hw_api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=cfg.simulate,
        pipette_left='p1000_96_v3.4',
        stall_detection_enable=False,
    )
    fw_version = await hw_api.fw_version()
    await hw_api.cache_instruments()
    pipette_model = hw_api.get_all_attached_instr()[OT3Mount.LEFT]["pipette_id"]
    print(f"Pipette_model: {pipette_model}")
    dial_data = {'Tip': None,
                'Initial Press Dist(mm)': None,
                'Final Press Dist(mm)': None,
                'TipOverlap Enc(mm)': None,
                'Default EndEffector(mm)': None,
                'New EndEffector(mm)': None,
                'Tip Dial Pos(mm)': None,
                'Nozzle Z Position': None,
                'Nozzle Dial pos': None,
                'Tip Dial Pos': None,
                'Delta': None,
                'Z Comp(mm)': None,
                }
    print(f'Dictionary: {dial_data}')
    instrument = hw_api._pipette_handler.get_pipette(OT3Mount.LEFT)
    details = [pipette_model, 'default-current']
    test_n, test_f = file_setup(dial_data, details)
    try:
        await hw_api.home()
        await hw_api.set_lights(rails=True)
        home_position = await hw_api.current_position_ot3(mount)
        start_time = time.perf_counter()
        cp = CriticalPoint.NOZZLE
        if (args.measure_nozzles):
            home_wo_tip = await hw_api.current_position_ot3(mount, cp)
            initial_dial_loc = Point(
                                deck_slot['deck_slot'][args.dial_slot]['X'],
                                deck_slot['deck_slot'][args.dial_slot]['Y'],
                                home_wo_tip[Axis.by_mount(mount)]
            )
            print("Move Nozzle to Dial Indicator")
            await move_to_point(hw_api, mount, initial_dial_loc, cp)
            current_position = await hw_api.current_position_ot3(mount, cp)
            nozzle_loc = await jog(hw_api, current_position, cp)
            number_of_channels = args.nozzles
            nozzle_count = 0
            measurements = []
            # measurement_map = []
            for tip in range(1, number_of_channels + 1):
                cp = CriticalPoint.NOZZLE
                nozzle_count += 1
                nozzle_position = Point(nozzle_loc[Axis.X],
                                        nozzle_loc[Axis.Y],
                                        nozzle_loc[Axis.by_mount(mount)])
                await move_to_point(hw_api, mount, nozzle_position, cp)
                await asyncio.sleep(1)
                nozzle_measurement = gauge.read()
                # measurement_map.update({nozzle_count: nozzle_measurement})
                print("nozzle-",nozzle_count, "(mm): " , nozzle_measurement, end="")
                print("\r", end="")
                measurements.append(nozzle_measurement)
                # if nozzle_count % number_of_channels == 0:
                #     d_str = ''
                #     for m in measurements:
                #         d_str += str(m) + ','
                #     d_str = d_str[:-1] + '\n'
                #     print(f"{d_str}")
                #     data.append_data_to_file(test_n, test_f, d_str)
                    # Reset Measurements list
                measurements = []
                print("\r\n")
            print(f'Nozzle Measurements: {nozzle_measurement}')
        # Calibrate to tiprack
        if (args.calibrate):
            pickup_loc = await calibrate_tiprack(hw_api, home_position, mount)
            deck_slot['deck_slot'][args.tiprack_slot][Axis.X.name] = pickup_loc.x
            deck_slot['deck_slot'][args.tiprack_slot][Axis.Y.name] = pickup_loc.y
            deck_slot['deck_slot'][args.tiprack_slot]['Z'] = pickup_loc.z
            save_config_(path+cal_fn, deck_slot)
            # Target should be the top of the side of the tip
            # init_tipoverlap_pos = Point(x=pickup_loc.x-RADIUS, 
            #                             y=pickup_loc.y, 
            #                             z=pickup_loc.z-PRESS_DISTANCE)
            target = target_position_from_relative(
                    mount, Point(z=PRESS_DISTANCE), hw_api._current_position
                )
            prep_target = Point(x=pickup_loc.x+RADIUS, 
                                y=pickup_loc.y, 
                                z=pickup_loc.z+PREP_PRESS_DISTANCE)
            await move_to_point(hw_api, mount, prep_target, cp)
            # Ignore the stall from the move command 
            try:
                await hw_api._move(target, speed=10, expect_stalls=True)
            except Exception as e:
                pass
            # Get current position of the top of the tip
            tip_location = await hw_api.current_position_ot3(mount, CriticalPoint.Nozzle)
            print(f'Tip Location: {tip_location}')
            # Let's pressed onto the tip -> stall and measure the encoder position
            await move_to_point(hw_api, mount, pickup_loc, cp)
            # This would be my initial press position
            tip_overlap_dict = await hw_api.pick_up_tip(
                mount, tip_length=(tip_length[args.tip_size]-tip_overlap))
            print(f'Init Position: {tip_location}}')
            print(f'tip_overlap_dict: {tip_overlap_dict}')
            enc_tipoverlap = tip_overlap_dict['final'] - tip_overlap_dict['init']
            print(f'TipOverlap: {enc_tipoverlap}')
            instr = hw_api._pipette_handler.get_pipette(mount)
            current_tipL = instr.current_tip_length
            print(f'current_tipL: {current_tipL}')
            instr.remove_tip()
            current_position = await hw_api.current_position_ot3(mount)
            print(current_position)
            instr.add_tip((tip_length[args.tip_size]-enc_tipoverlap))
            new_tipL = instr.current_tip_length
            print(f'new_current_tipL: {new_tipL}')
            # await hw_api.home([Axis.Z_L])
            # home_with_tip = await hw_api.current_position(mount, cp)

        # await hw_api.home_z(mount)
        cp = CriticalPoint.TIP
        home_w_tip = await hw_api.current_position_ot3(mount, cp)
        # Calibrate Dial Indicator with single tip
        if (args.calibrate):
            initial_dial_loc = Point(nozzle_loc[Axis.X],
                                    nozzle_loc[Axis.Y],
                                    nozzle_loc[Axis.by_mount(mount)])
            print("Move to Dial Indicator")
            await move_to_point(hw_api, mount, initial_dial_loc, cp)
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
        # tips_to_use = (num_of_columns * 8)
        x_coord_offset = 0
        y_coord_offset = 0
        true_tip_count = 1
        trial = 1
        num_of_columns = args.num_cols
        print(f'Trial: {trial}')
        # while True:
        #     measurements = []
        #     encoder_pos = []
        #     cp = CriticalPoint.TIP
        #     if args.dial_indicator:
        #         tip_count = 0
        #         x_offset = 0
        #         y_offset = 0
        #         measurement_map = []
        #         for tip in range(1, tips_to_use + 1):
        #             cp = CriticalPoint.TIP
        #             tip_count += 1
        #             tip_position = Point(dial_loc[0] + x_offset,
        #                                     dial_loc[1] + y_offset,
        #                                     dial_loc[2])
        #             await move_to_point(hw_api, mount, tip_position, cp)
        #             await asyncio.sleep(1)
        #             tip_dist = await hw_api.encoder_current_position_ot3(mount, CriticalPoint.NOZZLE)
        #             encoder_pos.append(tip_dist[Axis.by_mount(mount)])
        #             print(f'tip_position: {tip_dist[Axis.by_mount(mount)]}')
        #             tip_measurement = gauge.read()
        #             print("tip-",tip_count, "(mm): " ,tip_measurement,"\r", end="")
        #             measurements.append(tip_measurement)
        #             # Reset Measurements list
        #             measurements = []
        #             print("\r\n")
        #             x_offset -= 9
        #             if tip_count % num_of_columns == 0:
        #                 y_offset += 9
        #             if tip_count % num_of_columns == 0:
        #                 x_offset = 0
        #         print(measurements)
        #         print(encoder_pos)

        #     cp = CriticalPoint.TIP
        #     drop_tip_location =  Point(30 , 60 , 104.5)
        #      # 299.66 , 389.04 , 104.5
        #     await move_to_point(hw_api, mount, drop_tip_location, cp)
        #     measurement_map.append(true_tip_count)
        #     measurement_map.append(initial_press_dist[Axis.by_mount(mount)])
        #     measurement_map.append(press_dist[Axis.by_mount(mount)])
        #     measurement_map.append(tip_dist[Axis.by_mount(mount)])
        #     measurement_map.append(args.press_comp)
        #     measurement_map.append(enc_tipoverlap)
        #     measurement_map.append(current_tipL)
        #     measurement_map.append(new_tipL)
        #     measurement_map.append(nozzle_loc[Axis.by_mount(mount)])
        #     measurement_map.append(nozzle_measurement)
        #     measurement_map.append(tip_measurement)
        #     d_str = ''
        #     for m in measurement_map:
        #         d_str += str(m) + ','
        #     d_str = d_str[:-1] + '\n'
        #     print(f"{d_str}")
        #     data.append_data_to_file(test_n, test_f, d_str)
        #     input("Press Enter to Continue")
        #     await hw_api.drop_tip(mount)
        #     tips_to_use = args.nozzles
        #     # tips_to_use = num_of_columns * 8
        #     cp = CriticalPoint.NOZZLE
        #     x_dir, y_dir = (1,-1)
        #     true_tip_count += 1
        #     if true_tip_count % 8 == 0:
        #         x_coord_offset = x_coord_offset + x_dir*9
        #         y_coord_offset = 0
        #         y_dir = 0
        #     y_coord_offset = y_coord_offset + y_dir*9
        #     pu_location = Point(pickup_loc[0] + x_coord_offset,
        #                         pickup_loc[1] + y_coord_offset,
        #                         pickup_loc[2])
        #     await move_to_point(hw_api, mount, pu_location, cp)
        #     initial_press_dist = await hw_api.encoder_current_position_ot3(mount, cp)
        #     trial += 1
        #     print(f'Trial: {trial}')
        #     print(f'inital press position: {initial_press_dist[Axis.by_mount(mount)]}')
        #     press_dist = await hw_api.pick_up_tip(mount,
        #                             tip_length=(tip_length[args.tip_size]-tip_overlap),
        #                             presses = 1,
        #                             increment = 0)
        #     print(f'Press Position: {press_dist[Axis.by_mount(mount)]}')
        #     enc_tipoverlap = (initial_press_dist[Axis.by_mount(mount)] - press_dist[Axis.by_mount(mount)]) - args.press_comp
        #     print(f'Enc TipOverlap: {enc_tipoverlap}')
        #     instr = hw_api._pipette_handler.get_pipette(mount)
        #     print(f'current_tipL: {instr.current_tip_length}')
        #     instr.remove_tip()
        #     current_position = await hw_api.current_position_ot3(mount)
        #     print(current_position)
        #     instr.add_tip((tip_length[args.tip_size]-enc_tipoverlap))
        #     print(f'new_current_tipL: {instr.current_tip_length}')
        #     cp = CriticalPoint.TIP
        #     current_position = await hw_api.current_position_ot3(mount, cp)
        #     print(current_position)



    except KeyboardInterrupt:
        await hw_api.disengage_axes([Axis.X, Axis.Y])
    finally:
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
    parser.add_argument("--nozzles", type=int, default=1)
    parser.add_argument("--press_comp", type=float, default = 0)
    parser.add_argument(
        "--dial_port", type=str, default="/dev/ttyUSB0", help="Dial indicator Port"
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
    tip_overlap = 10.5
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    if args.dial_indicator:
        gauge = dial_indicator_setup(port=args.dial_port)
    asyncio.run(_main())