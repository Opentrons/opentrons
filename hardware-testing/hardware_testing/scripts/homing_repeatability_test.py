"""OT3 Homing Accuracy Test."""
import argparse
import asyncio
import os, time, random

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing import data
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    home_ot3,
    get_endstop_position_ot3,
)

from hardware_testing.drivers import mitutoyo_digimatic_indicator as dial

MOUNT = OT3Mount.RIGHT
LOAD = GantryLoad.NONE
CYCLES = 25
SPEED_XY = 500
SPEED_Z = 65

SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=SPEED_XY,
        acceleration=1000,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Y: GantryLoadSettings(
        max_speed=SPEED_XY,
        acceleration=500,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Z_L: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=500,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=500,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
}

async def random_move(api: OT3API) -> str:
    step_x = 440
    step_y = 370
    step_z = 200
    default_speed = 400
    c_pos= await api.current_position_ot3(mount=MOUNT)

    print("Random move to: ")
    if args.test_z_axis:
        z_pos = random.randrange(step_z)
        print(f"({z_pos} from homed position)")
        x_ax = OT3Axis.X
        y_ax = OT3Axis.Y
        await api.move_rel(mount=MOUNT, delta=Point(z=-z_pos), speed=SPEED_Z)
        return f'({z_pos})'
    else:
        x_pos = random.randrange(step_x)
        y_pos = random.randrange(20.0, step_y)
        if args.equal_distance:
            if x_pos < y_pos:
                y_pos = x_pos
            elif x_pos > y_pos:
                x_pos = y_pos
        print(f"({x_pos},{y_pos})")
        z_ax = OT3Axis.Z_L if MOUNT == OT3Mount.LEFT else OT3Axis.Z_R
        if args.equal_distance:
            await api.move_rel(mount=MOUNT, delta=Point(x=-x_pos, y=-y_pos), speed=default_speed)
        else:
            await api.move_to(mount=MOUNT, abs_position=Point(x=x_pos, y=y_pos, z=c_pos[z_ax]), speed=default_speed)
        # await api.move_to(mount=MOUNT, abs_position=Point(x=x_pos, y=y_pos, z=c_pos[z_ax]), speed=default_speed)
        return f'({x_pos} {y_pos})'

    # if args.equal_distance and not args.test_z_axis:
    #     if x_pos < y_pos:
    #         x_pos = y_pos
    #     elif x_pos > y_pos:
    #         y_pos = x_pos
    #
    # c_pos= await api.current_position_ot3(mount=MOUNT)
    # # await api.move_rel(mount=MOUNT, delta=Point(x=x_pos, y=y_pos), speed=default_speed)
    # if args.test_z_axis:
    #     x_ax = OT3Axis.X
    #     y_ax = OT3Axis.Y
    #     await api.move_to(mount=MOUNT, abs_position=Point(x=c_pos[x_ax], y=c_pos[y_ax], z=z_pos), speed=default_speed)
    #     return f'({z_pos})'
    # else:
    #     z_ax = OT3Axis.Z_L if MOUNT == OT3Mount.LEFT else OT3Axis.Z_R
    #     await api.move_to(mount=MOUNT, abs_position=Point(x=x_pos, y=y_pos, z=c_pos[z_ax]), speed=default_speed)
    #     return f'({x_pos} {y_pos})'


async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=is_simulating)
    await set_gantry_load_per_axis_settings_ot3(api, SETTINGS, load=LOAD)

    if args.test_z_axis:
        test_tag = "Z"
    else:
        test_tag = "XY_EVT1"

    test_name = "homing-repeatability"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    await home_ot3(api)

    starting_read_pos = []

    if args.test_z_axis:
        start_read_z = gauge_z.read()
        starting_read_pos.append(start_read_z)
    else:
        start_read_x = gauge_x.read()
        start_read_y = gauge_y.read()
        starting_read_pos.extend([start_read_x, start_read_y])

    print(f"Set dial indicator(s) to 0\n\t>>Current position: (", end ="")
    for i in range(len(starting_read_pos)):
        if i > 0:
            print(",", end =" ")
        print(f"{starting_read_pos[i]}", end ="")
    print(")")
    input("\n\t>> Continue...")
    if args.test_z_axis:
        init_reading_x = ''
        init_reading_y = ''
        init_reading_z = gauge_z.read()
        print(f"Initial gauge read (Z-Axis) : {init_reading_z} mm\n")
        init_xy_pos = ''
        init_z_pos = 'Initial Position'
        test_axis = 'Z'

    else:
        init_reading_x = gauge_x.read()
        print(f"Initial gauge read (X-Axis) : {init_reading_x} mm\n")
        init_reading_y = gauge_y.read()
        print(f"Initial gauge read (Y-Axis) : {init_reading_y} mm\n")
        init_reading_z = ''
        init_xy_pos = 'Initial Position'
        init_z_pos = ''
        test_axis = 'XY'

    # input(f"Set dial indicator(s) to 0\n\t>>Current position: ({start_read_x}, {start_read_y})\n\t>> Continue...")
    # init_reading_x = gauge_x.read()
    # print(f"Initial gauge read (X-Axis) : {init_reading_x} mm\n")
    # init_reading_y = gauge_y.read()
    # print(f"Initial gauge read (Y-Axis) : {init_reading_y} mm\n")

    input("Press enter to begin test...\n")

    header = ['Cycle', 'Test Axis', 'Return Read X (mm)', 'Return Read Y (mm)', 'Coordinate (X Y)', 'Return Read Z (mm)', 'Coordinate (Z)' 'Speed (mm/s)'] #, 'Delta from Initial Pos (dX dY)']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    init_reading = ['0', test_axis, init_reading_x, init_reading_y, init_xy_pos, init_reading_z, init_z_pos, args.test_home_speed] #, '(0 0)']
    init_reading_str = data.convert_list_to_csv_line(init_reading)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=init_reading_str)


    for cycle in range(CYCLES):
        print(f"Cycle: {cycle+1} out of {CYCLES}")
        coordinates = await random_move(api)
        await home_ot3(api)
        time.sleep(2)

        if args.test_z_axis:
            return_reading_x = ''
            return_reading_y = ''
            return_reading_z = gauge_z.read() - init_reading_z
            print(f"\tReturn reading:\n\tZ: {return_reading_z} mm")
            coordinates_xy = ''
            coordinates_z = coordinates
        else:
            return_reading_x = gauge_x.read() - init_reading_x
            return_reading_y = gauge_y.read() - init_reading_y
            return_reading_z = ''
            print(f"\tReturn reading:\n\tX: {return_reading_x} mm, Y: {return_reading_y} mm")
            coordinates_xy = coordinates
            coordinates_z = ''

        cycle_data = [cycle+1, '', return_reading_x, return_reading_y, coordinates_xy, return_reading_z, coordinates_z, args.test_home_speed]
        cycle_data_str = data.convert_list_to_csv_line(cycle_data)
        data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)

    await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])

if __name__ == "__main__":
    print("\nSTART TEST\n")

    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--equal_distance", action="store_true")
    parser.add_argument("--test_z_axis", action="store_true")
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--speed-xy", type=int, default=SPEED_XY)
    parser.add_argument("--speed-z", type=int, default=SPEED_Z)
    parser.add_argument("--test_home_speed", type=int, default=40)
    parser.add_argument("--mod_port_x", type=str, required=False, \
                        default = "/dev/ttyUSB1")
    parser.add_argument("--mod_port_y", type=str, required=False, \
                        default = "/dev/ttyUSB0")
    parser.add_argument("--mod_port_z", type=str, required=False, \
                        default = "/dev/ttyUSB0")
    args = parser.parse_args()

    CYCLES = args.cycles
    SPEED_XY = args.speed_xy
    SPEED_Z = args.speed_z
    SETTINGS[OT3Axis.X].max_speed = SPEED_XY
    SETTINGS[OT3Axis.Y].max_speed = SPEED_XY
    SETTINGS[OT3Axis.Z_L].max_speed = SPEED_Z
    SETTINGS[OT3Axis.Z_R].max_speed = SPEED_Z

    if args.test_z_axis:
        gauge_z = dial.Mitutoyo_Digimatic_Indicator(port=args.mod_port_z)
        gauge_z.connect()
    else:
        gauge_x = dial.Mitutoyo_Digimatic_Indicator(port=args.mod_port_x)
        gauge_x.connect()
        gauge_y = dial.Mitutoyo_Digimatic_Indicator(port=args.mod_port_y)
        gauge_y.connect()

    asyncio.run(_main(args.simulate))
