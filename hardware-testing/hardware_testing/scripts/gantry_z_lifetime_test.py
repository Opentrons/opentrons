import argparse
import asyncio
import time
from typing import List

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

from opentrons.hardware_control.types import CriticalPoint

async def _bowtie_move(api, homed_position_left: types.Point, homed_position_right: types.Point, _96ch: bool):

    pos_max_left = homed_position_left - types.Point(x=1, y=1, z=1)
    pos_min_left = types.Point(x=0, y=25, z=pos_max_left.z - 200)  # stay above deck to be safe
    pos_max_right = homed_position_right - types.Point(x=1, y=1, z=1)
    pos_min_right = types.Point(x=0, y=25, z=pos_max_right.z - 200)  # stay above deck to be safe

    await api.move_to(OT3Mount.LEFT, pos_max_left) # back-right-up
    if not _96ch:
        print("Moving right mount down...\n")
        await api.move_rel(OT3Mount.RIGHT, delta=Point(z=-200)) # move right mount down
        print("Moving to front-left...\n")
        await api.move_to(OT3Mount.RIGHT, pos_min_left._replace(z=pos_min_right.z)) # move to front-left with right mount down
        print("Moving right mount up...\n")
        await api.move_rel(OT3Mount.RIGHT, delta=Point(z=200)) # move right mount up
        cur_pos = await api.current_position_ot3(OT3Mount.LEFT)
        await api.move_to(OT3Mount.LEFT, Point(cur_pos[OT3Axis.X], cur_pos[OT3Axis.Y], cur_pos[OT3Axis.Z_L])) #pos_min_left) # front-left-down
        print("Moving left mount down...\n")
        await api.move_rel(OT3Mount.LEFT, delta=Point(z=-200))
        print("Moving to back-left...\n")
        await api.move_to(OT3Mount.LEFT, pos_min_left._replace(x=cur_pos[OT3Axis.X], y=pos_max_left.y))# back-left-down
        print("Moving left mount up...\n")
        await api.move_to(OT3Mount.LEFT, pos_max_left._replace(x=cur_pos[OT3Axis.X])) #pos_min_left.x)) # back-left-up
        print("Moving right mount down...\n")
        await api.move_rel(OT3Mount.RIGHT, delta=Point(z=-200))
        print("Moving to front-right...\n")
        # print(f"Point: {pos_max_left._replace(x=517.7, y=pos_min_left.y, z=pos_min_right.z)}\n")
        await api.move_to(OT3Mount.RIGHT, pos_max_left._replace(x=517.703, y=pos_min_left.y, z=pos_min_right.z)) # front-right-up
        print("Moving right mount up...\n")
        await api.move_rel(OT3Mount.RIGHT, delta=Point(z=200))
        # print(f"current position of right mount: {await api.gantry_position(OT3Mount.RIGHT)}\n")
        # print(f"current position of left mount: {await api.gantry_position(OT3Mount.LEFT)}\n")
        cur_pos = await api.current_position_ot3(OT3Mount.LEFT)
        await api.move_to(OT3Mount.LEFT, Point(cur_pos[OT3Axis.X], cur_pos[OT3Axis.Y], cur_pos[OT3Axis.Z_L])) #pos_min_left._replace(x=pos_max_left.x)) # front-right-down
        print("Moving left mount down...\n")
        await api.move_rel(OT3Mount.LEFT, delta=Point(z=-200))
        print("Moving to back-right...\n")
        await api.move_to(OT3Mount.LEFT, pos_max_left._replace(x=cur_pos[OT3Axis.X], z=pos_min_left.z)) # back-right-down
    else:
        print("Moving to front-left...\n")
        await api.move_to(OT3Mount.LEFT, pos_min_left._replace(z=pos_max_left.z)) # front-left-up
        print("Moving mount down...\n")
        await api.move_to(OT3Mount.LEFT, pos_min_left) # front-left-down
        print("Moving to back-left...\n")
        await api.move_to(OT3Mount.LEFT, pos_min_left._replace(y=pos_max_left.y)) # back-left-down
        print("Moving mount up...\n")
        await api.move_to(OT3Mount.LEFT, pos_max_left._replace(x=pos_min_left.x)) # back-left-up
        print("Moving to front-right...\n")
        await api.move_to(OT3Mount.LEFT, pos_max_left._replace(y=pos_min_left.y)) # front-right-up
        print("Moving mount down...\n")
        await api.move_to(OT3Mount.LEFT, pos_min_left._replace(x=pos_max_left.x)) # front-right-down
        print("Moving to back-right...\n")
        await api.move_to(OT3Mount.LEFT, pos_max_left._replace(z=pos_min_left.z)) # back-right-down

    await api.move_to(OT3Mount.LEFT, pos_max_left)

async def _main(is_simulating: bool, cycles: int, high_load: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()

    AXES = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L]

    MAX_SPEED = []
    ACCEL = []
    HOLD_CURRENT = []
    RUN_CURRENT = []
    MAX_DISCONTINUITY = []
    DIRECTION_CHANGE_DISCONTINUITY = []
    # PARAM_LISTS = [MAX_SPEED, ACCEL, HOLD_CURRENT, RUN_CURRENT, MAX_DISCONTINUITY, DIRECTION_CHANGE_DISCONTINUITY]
    #
    # PARAM_SETTINGS = [default_max_speed, acceleration, hold_current,
    #                   run_current, max_speed_discontinuity, direction_change_speed_discontinuity]

    # print(f"96Ch?: {high_load}\n")
    test_robot = input("Enter robot ID:\n\t>> ")
    test_name = "gantry-z-lifetime-test"
    if high_load:
        test_config = '96ch + Gripper Config'
        test_tag = '96ch_Gripper'
        GANTRY_LOAD = GantryLoad.HIGH_THROUGHPUT
        # MAX_SPEED_X = api.config.motion_settings.default_max_speed.high_throughput[OT3Axis.X]
        # MAX_SPEED_Y = api.config.motion_settings.default_max_speed.high_throughput[OT3Axis.Y]
        # MAX_SPEED_Z = api.config.motion_settings.default_max_speed.high_throughput[OT3Axis.Z]
        # ACCEL_X = api.config.motion_settings.acceleration.high_throughput[OT3Axis.X]
        # ACCEL_Y = api.config.motion_settings.acceleration.high_throughput[OT3Axis.Y]
        # ACCEL_Z = api.config.motion_settings.acceleration.high_throughput[OT3Axis.Z]
        # HOLD_CURRENT_X = api.config.motion_settings.hold_current.high_throughput[OT3Axis.X]
        # HOLD_CURRENT_Y = api.config.motion_settings.hold_current.high_throughput[OT3Axis.Y]
        # HOLD_CURRENT_Z = api.config.motion_settings.hold_current.high_throughput[OT3Axis.Z]
        # RUN_CURRENT_X = api.config.motion_settings.run_current.high_throughput[OT3Axis.X]
        # RUN_CURRENT_Y = api.config.motion_settings.run_current.high_throughput[OT3Axis.Y]
        # RUN_CURRENT_Z = api.config.motion_settings.run_current.high_throughput[OT3Axis.Z]
    else:
        test_config = '2 Singles + Gripper Config'
        test_tag = 'Single_Pipettes_Gripper'
        GANTRY_LOAD = GantryLoad.LOW_THROUGHPUT
        # MAX_SPEED_X = api.config.motion_settings.default_max_speed.low_throughput[OT3Axis.X]
        # MAX_SPEED_Y = api.config.motion_settings.default_max_speed.low_throughput[OT3Axis.Y]
        # MAX_SPEED_Z = api.config.motion_settings.default_max_speed.low_throughput[OT3Axis.Z]
        # ACCEL_X = api.config.motion_settings.acceleration.low_throughput[OT3Axis.X]
        # ACCEL_Y = api.config.motion_settings.acceleration.low_throughput[OT3Axis.Y]
        # ACCEL_Z = api.config.motion_settings.acceleration.low_throughput[OT3Axis.Z]
        # HOLD_CURRENT_X = api.config.motion_settings.hold_current.low_throughput[OT3Axis.X]
        # HOLD_CURRENT_Y = api.config.motion_settings.hold_current.low_throughput[OT3Axis.Y]
        # HOLD_CURRENT_Z = api.config.motion_settings.hold_current.low_throughput[OT3Axis.Z]
        # RUN_CURRENT_X = api.config.motion_settings.run_current.low_throughput[OT3Axis.X]
        # RUN_CURRENT_Y = api.config.motion_settings.run_current.low_throughput[OT3Axis.Y]
        # RUN_CURRENT_Z = api.config.motion_settings.run_current.low_throughput[OT3Axis.Z]

    for i in range(len(AXES)):
        MAX_SPEED.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.default_max_speed, AXES[i], GANTRY_LOAD))
        ACCEL.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.acceleration, AXES[i], GANTRY_LOAD))
        HOLD_CURRENT.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.current_settings.hold_current, AXES[i], GANTRY_LOAD))
        RUN_CURRENT.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.current_settings.run_current, AXES[i], GANTRY_LOAD))
        MAX_DISCONTINUITY.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.max_speed_discontinuity, AXES[i], GANTRY_LOAD))
        DIRECTION_CHANGE_DISCONTINUITY.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.direction_change_speed_discontinuity, AXES[i], GANTRY_LOAD))


    # settings = api.config.motion_settings
    #
    # for i in range(len(PARAM_LISTS)):
    #     for j in range(len(AXES)):
    #         if high_load:
    #             PARAM_LISTS[i][j] = settings.PARAM_SETTINGS[i].high_throughput[AXES[j]]
    #         else:
    #             PARAM_LISTS[i][j] = settings.PARAM_SETTINGS[i].low_throughput[AXES[j]]
    #     print(f"PARAM_LISTS: {PARAM_LISTS[i]}\n")


    # await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(api,
    #         OT3Axis.X, GANTRY_LOAD, hold_current=0.7, run_current=1.5)
    # await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(api,
    #         OT3Axis.Y, GANTRY_LOAD, hold_current=0.7, run_current=1.5)
    # await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(api,
    #         OT3Axis.Z, GANTRY_LOAD, hold_current=1.5, run_current=1.5)
    #
    # await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(api,
    #         OT3Axis.X, GANTRY_LOAD, default_max_speed=, acceleration=,
    #         max_speed_discontinuity=10, direction_change_speed_discontinuity=5)
    # await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(api,
    #         OT3Axis.Y, GANTRY_LOAD, default_max_speed=, acceleration=,
    #         max_speed_discontinuity=10, direction_change_speed_discontinuity=5)
    # await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(api,
    #         OT3Axis.Z, GANTRY_LOAD, default_max_speed=, acceleration=,
    #         max_speed_discontinuity=10, direction_change_speed_discontinuity=1)

    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Time(s)', 'Test Robot', 'Test Configuration', 'Cycle', '', 'Axis',
              'Max Speed (mm/s)', 'Acceleration (mm^2/s)', 'Hold Current (A)',
              'Run Current (A)', 'Max Speed Discontinuity', 'Direction Change Speed Discontinuity']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    start_time = time.perf_counter()
    homed_pos_left = await api.gantry_position(OT3Mount.LEFT)
    homed_pos_right = await api.gantry_position(OT3Mount.RIGHT)
    for i in range(cycles):
        print(f"========== Cycle {i + 1}/{cycles} ==========\n")
        await _bowtie_move(api, homed_pos_left, homed_pos_right, high_load)
        if (i == 0 or i == 1 or i == 2):
            cycle_data = [time.perf_counter()-start_time, test_robot, test_config, i+1, '',
                          AXES[i], MAX_SPEED[i], ACCEL[i], HOLD_CURRENT[i], RUN_CURRENT[i],
                          MAX_DISCONTINUITY[i], DIRECTION_CHANGE_DISCONTINUITY[i]]
        else:
            cycle_data = [time.perf_counter()-start_time, test_robot, test_config, i+1]
        cycle_data_str = data.convert_list_to_csv_line(cycle_data)
        data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)
    await api.home()

if __name__ == "__main__":
    mount_options = {
        "left": types.OT3Mount.LEFT,
        "right": types.OT3Mount.RIGHT,
        "gripper": types.OT3Mount.GRIPPER,
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument(
        "--mount", type=str, choices=list(mount_options.keys()), default="left"
    )
    parser.add_argument("--cycles", type=int, default=5)
    parser.add_argument("--high_load", action="store_true")
    args = parser.parse_args()
    mount = mount_options[args.mount]

    if not args.simulate:
        input("Gantry-Z-Lifetime: Is the deck totally empty? (press ENTER to continue)")
    asyncio.run(_main(args.simulate, args.cycles, args.high_load, mount))
