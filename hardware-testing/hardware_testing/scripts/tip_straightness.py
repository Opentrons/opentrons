"""Demo OT3 Gantry Functionality."""
import argparse
import ast
import asyncio
import csv
import time
from typing import Tuple, Dict, Optional
from threading import Thread
import datetime
import os
import sys
import termios
import tty
import json

from opentrons.hardware_control.motion_utilities import target_position_from_plunger
from hardware_testing.opentrons_api.types import (
    OT3Mount,
    OT3Axis,
    Point,
    CriticalPoint,
)

from opentrons_shared_data.deck import (
    get_calibration_square_position_in_slot,
)

from opentrons.hardware_control.ot3_calibration import (
    find_calibration_structure_height,
    find_slot_center_binary,
)

from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    home_ot3,
    get_plunger_positions_ot3,
    update_pick_up_current,
    update_pick_up_distance,
    _get_pipette_from_mount,
    get_slot_calibration_square_position_ot3
)

from opentrons.config.types import (
    CapacitivePassSettings,
)


def plate_definition(target_hole):
    starting_hole_mm_x = 14.33
    starting_hole_mm_y = 11.2
    columns = 12
    rows = 4
    x_spacing = 9
    y_spacing = 18
    lookup_holes = {'1':(0,0),
                    '2':(0,1),
                    '3':(0,2),
                    '4':(0,3),
                    '5':(0,4),
                    '6':(0,5),
                    '7':(0,6),
                    '8':(0,7),
                    '9':(0,8),
                    '10':(0,9),
                    '11':(0,10),
                    '12':(0,11),
                    '13':(1,0),
                    '14':(1,1),
                    '15':(1,2),
                    '16':(1,3),
                    '17':(1,4),
                    '18':(1,5),
                    '19':(1,6),
                    '20':(1,7),
                    '21':(1,8),
                    '22':(1,9),
                    '23':(1,10),
                    '24':(1,11),
                    '25':(2,0),
                    '26':(2,1),
                    '27':(2,2),
                    '28':(2,3),
                    '29':(2,4),
                    '30':(2,5),
                    '31':(2,6),
                    '32':(2,7),
                    '33':(2,8),
                    '34':(2,9),
                    '35':(2,10),
                    '36':(2,11),
                    '37':(3,0),
                    '39':(3,2),
                    '41':(3,4),
                    '43':(3,6),
                    '45':(3,8),
                    '47':(3,10),
                    }

    calculate_x_distance = lookup_holes[str(target_hole)][1]*x_spacing + starting_hole_mm_x
    calculate_y_distance = lookup_holes[str(target_hole)][0]*y_spacing + starting_hole_mm_y
    return Point(calculate_x_distance, calculate_y_distance, 0)

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


async def jog(api, position, cp) -> Dict[OT3Axis, float]:
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
    # print(information_str)
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
            position = await api.current_position_ot3(
                mount, refresh=True, critical_point=cp
            )
            print("\r\n")
            return position
        position = await api.current_position_ot3(
            mount, refresh=True, critical_point=cp
        )

        print(
            "Coordinates: ",
            round(position[OT3Axis.X], 2),
            ",",
            round(position[OT3Axis.Y], 2),
            ",",
            round(position[OT3Axis.by_mount(mount)], 2),
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

def replace_coordinates(coordinates, axis, new_value):
    coord = list(coordinates)
    coord[axis] = new_value
    coord = tuple(coord)
    return Point(coord[0], coord[1], coord[2])

async def z_calibrate_gage_block(api, mount, probe_axis, cp, capacitive_settings, gage_block):

    z_axis = 2
    z_retract_mm = 10
    current_position = await api.current_position_ot3(mount)
    capacitive_loc = await jog(api, current_position, cp)
    capacitive_loc = Point( x = capacitive_loc[OT3Axis.X],
                         y = capacitive_loc[OT3Axis.Y],
                         z = capacitive_loc[OT3Axis.by_mount(mount)])
    # Probe the left side of the gage block
    point = await api.capacitive_nozzle(
            mount = mount,
            moving_axis = probe_axis,
            target_pos = gage_block['Z'] - gage_block['offset'],
            direction = -1.0,
            pass_settings = capacitive_settings
    )
    z_measured_gage_location = await api.encoder_current_position_ot3(mount, cp)
    print(f"Z measured_gage_location: {z_measured_gage_location[probe_axis]}")

    coordinates = await api.current_position_ot3(mount)
    coordinates = Point( x = coordinates[OT3Axis.X],
                                y = coordinates[OT3Axis.Y],
                                z = coordinates[OT3Axis.by_mount(mount)])

    # Retract away from the gage
    coordinates = replace_coordinates(coordinates,
                                z_axis,
                                coordinates[z_axis] + z_retract_mm)
    await api.move_to(mount, coordinates)

    return z_measured_gage_location


async def xy_calibrate_gage_block(api, mount, probe_axis, cp, capacitive_settings, gage_block):
    """This function is used to calibrate the gage block with nozzle or probe"""
    """
    gage_block = {'X': nominal_center.x,
                    'Y': nominal_center.Y,
                    'Z': nominal_center.Z,
                    'offset': offset_from_ceneter}
    """
    z_axis = 2
    retract_mm = 0.3
    z_retract_mm = 10
    current_position = await api.current_position_ot3(mount)
    capacitive_loc = await jog(api, current_position, cp)
    capacitive_loc = Point( x = capacitive_loc[OT3Axis.X],
                            y = capacitive_loc[OT3Axis.Y],
                            z = capacitive_loc[OT3Axis.by_mount(mount)])
    coordinates = replace_coordinates(capacitive_loc,
                                probe_axis.value,
                                gage_block[probe_axis.name] - gage_block['offset'])
    print(coordinates)
    # Probe one side of the probe
    await api.move_to(mount, coordinates)

    # Probe the left side of the gage block
    point = await api.capacitive_nozzle(
            mount = mount,
            moving_axis = probe_axis,
            target_pos = gage_block[probe_axis.name] - gage_block['offset'],
            direction = 1.0,
            pass_settings = capacitive_settings
    )
    measured_gage_location_1 = await api.encoder_current_position_ot3(mount, cp)
    print(f"measured_gage_location_1: {measured_gage_location_1[probe_axis]}")
    coordinates = await api.current_position_ot3(mount)
    # Convert to Point
    coordinates = Point( x = coordinates[OT3Axis.X],
                                y = coordinates[OT3Axis.Y],
                                z = coordinates[OT3Axis.by_mount(mount)])

    # Retract away from the gage
    coordinates = replace_coordinates(coordinates,
                                probe_axis.value,
                                coordinates[probe_axis.value] - retract_mm)
    await api.move_to(mount, coordinates)
    # Retract on Z Axis
    coordinates = replace_coordinates(coordinates,
                                z_axis,
                                coordinates[z_axis] + z_retract_mm)
    # Retract from Block and move to the right side of the block
    await api.move_to(mount, coordinates)

    # Move to the other side of the gage block
    coordinates = replace_coordinates(coordinates,
                                probe_axis.value,
                                gage_block[probe_axis.name] + gage_block['offset'])
    # Move to the right
    await api.move_to(mount, coordinates)

    # Move down on Z Axis
    coordinates = replace_coordinates(coordinates,
                                z_axis,
                                coordinates[z_axis] - z_retract_mm)
    # Move Down on Z Axis
    await api.move_to(mount, coordinates)
    # Probe the other side of the probe
    point = await api.capacitive_nozzle(
            mount = mount,
            moving_axis = probe_axis,
            target_pos = gage_block[probe_axis.name] + gage_block['offset'],
            direction = -1.0,
            pass_settings = capacitive_settings
    )

    measured_gage_location_2 = await api.encoder_current_position_ot3(mount, cp)
    print(f"measured_gage_location_2: {measured_gage_location_2[probe_axis]}")
    # Retract from Gage Block
    coordinates = await api.current_position_ot3(mount)
    # Convert to Point
    coordinates = Point( x = coordinates[OT3Axis.X],
                                y = coordinates[OT3Axis.Y],
                                z = coordinates[OT3Axis.by_mount(mount)])
    # Retract away from the gage
    coordinates = replace_coordinates(coordinates,
                                probe_axis.value,
                                coordinates[probe_axis.value] + retract_mm)
    # Move to the right
    await api.move_to(mount, coordinates)

    # Retract on Z Axis
    coordinates = replace_coordinates(coordinates,
                                z_axis,
                                coordinates[z_axis] + z_retract_mm)
    # Move to the right
    await api.move_to(mount, coordinates)

    return measured_gage_location_1[probe_axis], measured_gage_location_2[probe_axis]



async def _main() -> None:
    today = datetime.date.today()
    tips_to_use = 12
    slot_loc = {
        "A1": (13.42, 394.92, 110),
        "A2": (177.32, 394.92, 110),
        "A3": (341.03, 394.0, 110),
        "B1": (13.42, 288.42, 110),
        "B2": (177.32, 288.92, 110),
        "B3": (341.03, 288.92, 110),
        "C1": (13.42, 181.92, 110),
        "C2": (177.32, 181.92, 110),
        "C3": (341.03, 181.92, 110),
        "D1": (13.42, 75.5, 110),
        "D2": (177.32, 75.5, 110),
        "D3": (341.03, 75.5, 110),
    }
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    tip_length = {"T1K": 85.7, "T200": 48.35, "T50": 47.9}
    print(hw_api.get_all_attached_instr()[mount])
    pipette_model = hw_api.get_all_attached_instr()[mount]['pipette_id']
    print(pipette_model)
    dial_data = {"Ch1": None,
                "Ch2": None,
                "Ch3": None,
                "Ch4": None,
                "Ch5": None,
                "Ch6": None,
                "Ch7": None,
                "Ch8": None,
                "Trial": None,
                "pipette_model": None}
    # m_current = float(input("motor_current in amps: "))
    # pick_up_speed = float(input("pick up tip speed in mm/s: "))
    pick_up_speed = 10
    # details = [pipette_model, m_current]
    await home_ot3(hw_api, [OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.X, OT3Axis.Y])
    await hw_api.home_plunger(mount)
    await hw_api.set_lights(rails = True)
    plunger_pos = get_plunger_positions_ot3(hw_api, mount)
    home_position = await hw_api.current_position_ot3(mount)
    start_time = time.perf_counter()

    if args.tip_size == "T1K":
        home_with_tip_position = 164.3  # T1K
    if args.tip_size == "T200":
        home_with_tip_position = 201.64999999999998  # 200
    elif args.tip_size == "T50":
        home_with_tip_position = 192.1  # T50

    xy_probe_settings = CapacitivePassSettings(
        prep_distance_mm= 0.6,
        max_overrun_distance_mm= args.max_overrun_distance_mm, # 8
        speed_mm_per_s= args.probe_speed,
        sensor_threshold_pf= args.probe_threshold_pf,
        )
    z_probe_settings = CapacitivePassSettings(
        prep_distance_mm = 0.6,
        max_overrun_distance_mm = args.max_overrun_distance_mm,
        speed_mm_per_s = args.probe_speed,
        sensor_threshold_pf = args.probe_threshold_pf
    )

    xy_nozzle_settings = CapacitivePassSettings(
        prep_distance_mm= 0.6,
        max_overrun_distance_mm= args.max_overrun_distance_mm, # 8
        speed_mm_per_s= args.probe_speed,
        sensor_threshold_pf= args.nozzle_threshold_pf,
        )
    z_nozzle_settings = CapacitivePassSettings(
        prep_distance_mm = 0.6,
        max_overrun_distance_mm = args.max_overrun_distance_mm,
        speed_mm_per_s = args.probe_speed,
        sensor_threshold_pf = args.nozzle_threshold_pf
    )

    nominal_center = get_calibration_square_position_in_slot(8)
    print(f"Nominal Center: {nominal_center}")
    # Retract distance
    xy_retract_mm = 0.3
    z_retract_mm = 10
    tip_count = 0
    x_offset = 0
    y_offset = 0
    try:
        # await hw_api.move_to(
        #     mount,
        #     Point(
        #         nominal_center.x,
        #         nominal_center.y,
        #         home_position[OT3Axis.by_mount(mount)],
        #     ),
        # )
        # cp = CriticalPoint.NOZZLE
        # print("Move to left edge of the gage block.")
        # current_position = await hw_api.current_position_ot3(mount)
        # x_gage_block_mm = 9.2
        # nozzle_nominal_diameter = 5.15
        # tolerance = 2
        # x_offset_from_center = x_gage_block_mm/2 + nozzle_nominal_diameter/2 + tolerance
        # gage_block_settings = {'X': nominal_center.x,
        #                 'Y': nominal_center.y,
        #                 'Z': nominal_center.z,
        #                 'offset': x_offset_from_center}
        # # Find the X edges of the gage block
        # x_minus, x_plus = await xy_calibrate_gage_block(hw_api, mount, OT3Axis.X, cp, xy_nozzle_settings, gage_block_settings)
        # x_measured_gage = (x_plus - nozzle_nominal_diameter/2) - (x_minus + nozzle_nominal_diameter/2)
        # print("X-Measured Gage: ", x_measured_gage)
        # center_x = (x_plus - nozzle_nominal_diameter/2) - x_measured_gage/2
        # current_position = await hw_api.current_position_ot3(mount)
        # await hw_api.move_to(mount,
        #                         Point(  center_x,
        #                                 current_position[OT3Axis.Y],
        #                                 current_position[OT3Axis.by_mount(mount)]))
        # tolerance = 2
        # y_gage_block_mm = 3.32
        # y_offset_from_center = y_gage_block_mm/2 + nozzle_nominal_diameter/2 + tolerance
        # gage_block_settings = {'X': nominal_center.x,
        #                 'Y': nominal_center.y,
        #                 'Z': nominal_center.z,
        #                 'offset': y_offset_from_center}
        # # find the y edges of the gage block
        # y_minus, y_plus = await xy_calibrate_gage_block(hw_api, mount, OT3Axis.Y, cp, xy_nozzle_settings, gage_block_settings)
        # y_measured_gage = (y_plus - nozzle_nominal_diameter/2) - (y_minus + nozzle_nominal_diameter/2)
        # print("Y-Measured Gage: ", y_measured_gage)
        # current_position = await hw_api.current_position_ot3(mount)
        # await hw_api.move_to(mount,
        #                         Point( current_position[OT3Axis.X],
        #                                 current_position[OT3Axis.Y],
        #                                 current_position[OT3Axis.by_mount(mount)] + z_retract_mm))
        # center_x = (x_plus - nozzle_nominal_diameter/2) - x_measured_gage/2
        # center_y = (y_plus - nozzle_nominal_diameter/2) - y_measured_gage/2
        # await hw_api.move_to(mount,
        #                         Point( center_x,
        #                                 center_y,
        #                                 current_position[OT3Axis.by_mount(mount)] + z_retract_mm))
        # tolerance = 2
        # z_offset_from_center = z_retract_mm + tolerance
        # calibrated_height = 50
        # gage_block_settings = {'X': center_x,
        #                 'Y': center_y,
        #                 'Z': calibrated_height,
        #                 'offset': z_offset_from_center}
        #
        # z_measured_gage = await z_calibrate_gage_block(hw_api, mount,
        #                     OT3Axis.by_mount(mount),
        #                     cp, z_nozzle_settings, gage_block_settings)
        # print("Z measured gage: ", z_measured_gage)
        # await hw_api.home_z(mount)
        # input("Insert the Probe Attachment")
        # # ------------------------------Probe attachment-----------------------
        # x_gage_block_mm = 9.2
        # nozzle_nominal_diameter = 4.0
        # tolerance = 3
        # x_offset_from_center = x_gage_block_mm/2 + nozzle_nominal_diameter/2 + tolerance
        # gage_block_settings = {'X': nominal_center.x,
        #                 'Y': nominal_center.y,
        #                 'Z': nominal_center.z,
        #                 'offset': x_offset_from_center}
        # # Find the X edges of the gage block
        # x_minus, x_plus = await xy_calibrate_gage_block(hw_api, mount, OT3Axis.X, cp, xy_probe_settings, gage_block_settings)
        # probe_x_measured_gage = (x_plus - nozzle_nominal_diameter/2) - (x_minus + nozzle_nominal_diameter/2)
        # print("X-Measured Gage probe: ", probe_x_measured_gage)
        # probe_x_center =  (x_plus - nozzle_nominal_diameter/2) - probe_x_measured_gage/2
        # current_position = await hw_api.current_position_ot3(mount)
        # await hw_api.move_to(mount,
        #                         Point(  probe_x_center,
        #                                 current_position[OT3Axis.Y],
        #                                 current_position[OT3Axis.by_mount(mount)]))
        # await hw_api.move_to(mount,
        #                         Point(  probe_x_center,
        #                                 current_position[OT3Axis.Y] - 10,
        #                                 current_position[OT3Axis.by_mount(mount)]))
        # tolerance = 2
        # y_gage_block_mm = 3.32
        # y_offset_from_center = y_gage_block_mm/2 + nozzle_nominal_diameter/2 + tolerance
        # gage_block_settings = {'X': nominal_center.x,
        #                 'Y': nominal_center.y,
        #                 'Z': nominal_center.z,
        #                 'offset': y_offset_from_center}
        # # find the y edges of the gage block
        # y_minus, y_plus = await xy_calibrate_gage_block(hw_api, mount, OT3Axis.Y, cp, xy_probe_settings, gage_block_settings)
        # probe_y_measured_gage = (y_plus - nozzle_nominal_diameter/2) - (y_minus + nozzle_nominal_diameter/2)
        # print("Y-Measured Gage probe: ", probe_y_measured_gage)
        # probe_y_center = (y_plus - nozzle_nominal_diameter/2) - probe_y_measured_gage/2
        # current_position = await hw_api.current_position_ot3(mount)
        # await hw_api.move_to(mount,
        #                         Point( current_position[OT3Axis.X],
        #                                 current_position[OT3Axis.Y],
        #                                 current_position[OT3Axis.by_mount(mount)] + z_retract_mm))
        # center_x = (x_plus - nozzle_nominal_diameter/2) - x_measured_gage/2
        # center_y = (y_plus - nozzle_nominal_diameter/2) - y_measured_gage/2
        # await hw_api.move_to(mount,
        #                         Point( center_x,
        #                                 center_y,
        #                                 current_position[OT3Axis.by_mount(mount)] + z_retract_mm))
        # tolerance = 2
        # z_offset_from_center = z_retract_mm + tolerance
        # calibrated_height = 50
        # gage_block_settings = {'X': center_x,
        #                 'Y': center_y,
        #                 'Z': calibrated_height,
        #                 'offset': z_offset_from_center}
        #
        # z_measured_gage = await z_calibrate_gage_block(hw_api, mount,
        #                     OT3Axis.by_mount(mount),
        #                     cp, z_probe_settings, gage_block_settings)
        # print("Z-Measured Gage", z_measured_gage)
        # --------------------------Deck Slot Calibration -------------------------
        expected = get_calibration_square_position_in_slot(slot=5)  # or any other slot
        print(expected)
        expected = Point(expected.x, expected.y, expected.z + 44.5)
        found_z= await find_calibration_structure_height(hw_api, mount, expected)
        found_xyz = await find_slot_center_binary(hw_api, mount, expected._replace(z=found_z))
        print(found_xyz)
        await hw_api.home_z(mount)
        input("remove probe attachment")
        if args.tiprack:
            await hw_api.move_to(
                mount,
                Point(
                    slot_loc["B1"][0],
                    slot_loc["B1"][1],
                    home_position[OT3Axis.by_mount(mount)],
                ),
            )
            cp = CriticalPoint.NOZZLE
            print("Move to Tiprack")
            current_position = await hw_api.current_position_ot3(mount)
            tiprack_loc = await jog(hw_api, current_position, cp)
            # Start recording the encoder
            init_tip_loc = await hw_api.encoder_current_position_ot3(
                mount, CriticalPoint.NOZZLE
            )
            print(f"Start encoder: {init_tip_loc}")
            init_tip_loc = init_tip_loc[OT3Axis.by_mount(mount)]
            encoder_position = init_tip_loc
            init_tip_loc = await hw_api.encoder_current_position_ot3(
                mount, CriticalPoint.NOZZLE
            )
            # await update_pick_up_current(hw_api, mount, m_current)
            await update_pickup_tip_speed(hw_api, mount, pick_up_speed)
            # pick up tip
            final_tip_loc = await hw_api.pick_up_tip(
                mount, tip_length=tip_length[args.tip_size]
            )
            await home_ot3(hw_api, [OT3Axis.by_mount(mount)])
            home_with_tip_position = await hw_api.current_position_ot3(mount, critical_point= CriticalPoint.TIP)
            home_with_tip_position = home_with_tip_position[OT3Axis.by_mount(mount)]
            await hw_api.move_to(
                mount,
                Point(
                    current_position[OT3Axis.X],
                    current_position[OT3Axis.Y],
                    home_with_tip_position,
                ),
                critical_point=CriticalPoint.TIP,
            )

            encoder_end = final_tip_loc[OT3Axis.by_mount(mount)]
            final_tip_loc = await hw_api.encoder_current_position_ot3(mount, CriticalPoint.NOZZLE)
            print(f"End Encoder: {final_tip_loc}")
            final_tip_loc = final_tip_loc[OT3Axis.by_mount(mount)]
            location = "Tiprack"
            tip_count = 1
            # test_details = [start_time, m_current, location, init_tip_loc, final_tip_loc, tip_count]
            tiprack_loc = [
                tiprack_loc[OT3Axis.X],
                tiprack_loc[OT3Axis.Y],
                tiprack_loc[OT3Axis.by_mount(mount)],
            ]
        cp = CriticalPoint.TIP
        current_position = await hw_api.current_position_ot3(mount, cp)
        hole_location = plate_definition(16)
        plate_tolerance = 1
        plate_thickness = 3.0 + plate_tolerance
        dimensions_plate = Point(127.75, 85.5, tip_length[args.tip_size] + plate_thickness)
        edge_location = Point(found_xyz.x - dimensions_plate.x/2,
                        found_xyz.y + dimensions_plate.y/2,
                        found_xyz.z + dimensions_plate.z)
        await hw_api.move_to(mount, Point(
                                    edge_location.x,
                                    edge_location.y,
                                    current_position[OT3Axis.by_mount(mount)]
                                    ),
                                    critical_point = cp)

        await hw_api.move_to(mount, Point(edge_location.x,
                                    edge_location.y,
                                    home_with_tip_position - edge_location.z),
                                    critical_point = cp)
        while True:
            hole_val = input("Which hole: ")
            hole_location = plate_definition(hole_val)
            hole = Point(hole_location.x,
                        hole_location.y,
                        home_with_tip_position - edge_location.z)
            await hw_api.move_to(mount, Point(
                        edge_location.x + hole.x,
                        edge_location.y - hole.y,
                        hole.z))
            current_position = await hw_api.current_position_ot3(mount, cp)
            await jog(hw_api, current_position, cp)

        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    except KeyboardInterrupt:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
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
    parser.add_argument("--tiprack", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=2)
    parser.add_argument("--tip_size", type=str, default="T1K", help="Tip Size")
    parser.add_argument("--prep_distance_mm", type = float, default = 5, help="Prep Probe Distance")
    parser.add_argument("--max_overrun_distance_mm", type = float, default = 6, help = "Max Probe Distance")
    parser.add_argument("--probe_speed", type = int, default = 0.3, help = "Probe Speed")
    parser.add_argument("--probe_threshold_pf", type = float, default = 3.0, help = "capacitive probe threshold")
    parser.add_argument("--nozzle_threshold_pf", type = float, default = 0.6, help = "capacitive Nozzle threshold")

    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    asyncio.run(_main())
