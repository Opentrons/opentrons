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

async def random_move(api: OT3API) -> None:
    step_x = 440
    step_y = 370
    step_z = 200
    default_speed = 400

    x_pos = random.randrange(step_x)
    y_pos = random.randrange(step_y)

    print(f"Random move to: ({x_pos},{y_pos})")
    # await api.move_rel(mount=MOUNT, delta=Point(x=x_pos, y=y_pos), speed=default_speed)
    z_ax = OT3Axis.Z_L if MOUNT == OT3Mount.LEFT else OT3Axis.Z_R
    c_pos = await api.current_position_ot3(mount=MOUNT)
    await api.move_to(mount=MOUNT, abs_position=Point(x=x_pos, y=y_pos, z=c_pos[z_ax]), speed=default_speed)


async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=is_simulating)
    await set_gantry_load_per_axis_settings_ot3(api, SETTINGS, load=LOAD)
    await api.set_gantry_load(gantry_load=LOAD)

    test_name = "homing-repeatability"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag="XY")

    await home_ot3(api)

    input("Set dial indicators to 0\n\t>> Continue...")
    init_reading_x = gauge_x.read()
    print(f"Initial gauge read (X-Axis) : {init_reading_x} mm\n")
    init_reading_y = gauge_y.read()
    print(f"Initial gauge read (Y-Axis) : {init_reading_y} mm\n")

    input("Press enter to begin test...\n")

    header = ['Cycle', 'Init Read X (mm)', 'Return Read X (mm)', 'Init Read Y (mm)', 'Return Read Y (mm)']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    init_reading = ['0', init_reading_x, '', init_reading_y, '']
    init_reading_str = data.convert_list_to_csv_line(init_reading)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=init_reading_str)


    for cycle in range(CYCLES):
        await random_move(api)
        await home_ot3(api)
        return_reading_x = gauge_x.read() - init_reading_x
        return_reading_y = gauge_y.read() - init_reading_y
        print(f"\tReturn reading:\n\t X:{return_reading_x} mm, Y: {return_reading_y} mm")

        cycle_data = [cycle, init_reading_x, return_reading_x, init_reading_y, return_reading_y]
        cycle_data_str = data.convert_list_to_csv_line(cycle_data)
        data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)

    await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])

if __name__ == "__main__":
    print("\nSTART TEST\n")

    # print("Which axis do you want to test?\n\t>  XY\n\t>  Z")
    # axis_input = input('\n\t>> ').lower()
    #
    # if 'xy' in axis_input:
    #     test_axis = 'XY Axes'
    # elif 'z' in axis_input:
    #     test_axis = 'Z Axis'
    # else:
    #     sys.exit(f"Enter valid text axis. Test terminated.\n")

    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--speed-xy", type=int, default=SPEED_XY)
    parser.add_argument("--speed-z", type=int, default=SPEED_Z)
    parser.add_argument("--mod_port_x", type=str, required=False, \
                        default = "/dev/ttyUSB1")
    parser.add_argument("--mod_port_y", type=str, required=False, \
                        default = "/dev/ttyUSB0")
    args = parser.parse_args()

    CYCLES = args.cycles
    SPEED_XY = args.speed_xy
    SPEED_Z = args.speed_z
    SETTINGS[OT3Axis.X].max_speed = SPEED_XY
    SETTINGS[OT3Axis.Y].max_speed = SPEED_XY
    SETTINGS[OT3Axis.Z_L].max_speed = SPEED_Z
    SETTINGS[OT3Axis.Z_R].max_speed = SPEED_Z

    gauge_x = dial.Mitutoyo_Digimatic_Indicator(port=args.mod_port_x)
    gauge_x.connect()
    gauge_y = dial.Mitutoyo_Digimatic_Indicator(port=args.mod_port_y)
    gauge_y.connect()

    asyncio.run(_main(args.simulate))
