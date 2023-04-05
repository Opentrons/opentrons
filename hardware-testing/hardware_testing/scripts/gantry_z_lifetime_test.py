import argparse
import asyncio
import time
from typing import List

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

from opentrons.hardware_control.types import CriticalPoint

async def _bowtie_move(api, homed_position_left: types.Point, homed_position_right: types.Point, load: GantryLoad, stall_count: int):

    pos_max_left = homed_position_left - types.Point(x=1, y=10, z=1)
    pos_min_left = types.Point(x=0, y=95, z=pos_max_left.z - 150)  # stay above deck to be safe
    pos_max_right = homed_position_right - types.Point(x=1, y=10, z=1)
    pos_min_right = types.Point(x=0, y=95, z=pos_max_right.z - 150)  # stay above deck to be safe

    low_tp_points = {
        '0': [pos_max_left, OT3Axis.LEFT],
        '1': [pos_max_right - types.Point(x=0, y=0, z=150), OT3Axis.RIGHT],
        '2': [, OT3Axis.RIGHT],
        '3': [, OT3Axis.RIGHT],
        '4': [, OT3Axis.LEFT],
        '5': [, OT3Axis.LEFT],
        '6': [, OT3Axis.LEFT],
        '7': [, OT3Axis.LEFT],
        '8': [, OT3Axis.RIGHT],
        '9': [, OT3Axis.RIGHT],
        '10': [, OT3Axis.RIGHT],
        '11': [, OT3Axis.LEFT],
        '12': [, OT3Axis.LEFT],
        '13': [, OT3Axis.LEFT],
        '14': [, OT3Axis.LEFT],
    }

    high_tp_points = []

    await api.move_to(OT3Mount.LEFT, pos_max_left) # back-right-up
    if load == GantryLoad.LOW_THROUGHPUT:
        print("Moving right mount down...\n")
        await api.move_rel(OT3Mount.RIGHT, delta=Point(z=-150), _check_stalls=True) # move right mount down
        print("Moving to front-left...\n")
        await api.move_to(OT3Mount.RIGHT, pos_min_left._replace(z=pos_min_right.z), _check_stalls=True) # move to front-left with right mount down
        print("Moving right mount up...\n")
        await api.move_rel(OT3Mount.RIGHT, delta=Point(z=150), _check_stalls=True) # move right mount up
        cur_pos = await api.current_position_ot3(OT3Mount.LEFT)
        print(f"current pos:{cur_pos}\n")
        await api.move_to(OT3Mount.LEFT, Point(cur_pos[OT3Axis.X], cur_pos[OT3Axis.Y], cur_pos[OT3Axis.Z_L]), _check_stalls=True) #pos_min_left) # front-left-down
        print("Moving left mount down...\n")
        await api.move_rel(OT3Mount.LEFT, delta=Point(z=-150), _check_stalls=True)
        print("Moving to back-left...\n")
        await api.move_to(OT3Mount.LEFT, pos_min_left._replace(x=cur_pos[OT3Axis.X], y=pos_max_left.y), _check_stalls=True)# back-left-down
        print("Moving left mount up...\n")
        await api.move_to(OT3Mount.LEFT, pos_max_left._replace(x=cur_pos[OT3Axis.X]), _check_stalls=True) #pos_min_left.x)) # back-left-up
        print("Moving right mount down...\n")
        await api.move_rel(OT3Mount.RIGHT, delta=Point(z=-150), _check_stalls=True)
        print("Moving to front-right...\n")
        # print(f"Point: {pos_max_left._replace(x=517.7, y=pos_min_left.y, z=pos_min_right.z)}\n")
        await api.move_to(OT3Mount.RIGHT, pos_max_left._replace(x=517, y=pos_min_left.y, z=pos_min_right.z), _check_stalls=True) # front-right-up
        print("Moving right mount up...\n")
        await api.move_rel(OT3Mount.RIGHT, delta=Point(z=150), _check_stalls=True)
        # print(f"current position of right mount: {await api.gantry_position(OT3Mount.RIGHT)}\n")
        # print(f"current position of left mount: {await api.gantry_position(OT3Mount.LEFT)}\n")
        cur_pos = await api.current_position_ot3(OT3Mount.LEFT)
        print(f"current pos:{cur_pos}\n")
        await api.move_to(OT3Mount.LEFT, Point(cur_pos[OT3Axis.X], cur_pos[OT3Axis.Y], cur_pos[OT3Axis.Z_L]), _check_stalls=True) #pos_min_left._replace(x=pos_max_left.x)) # front-right-down
        print("Moving left mount down...\n")
        await api.move_rel(OT3Mount.LEFT, delta=Point(z=-150), _check_stalls=True)
        print("Moving to back-right...\n")
        await api.move_to(OT3Mount.LEFT, pos_max_left._replace(x=cur_pos[OT3Axis.X], z=pos_min_left.z), _check_stalls=True) # back-right-down
    else:
        print("Moving to front-left...\n")
        await api.move_to(OT3Mount.LEFT, pos_min_left._replace(z=pos_max_left.z), _check_stalls=True) # front-left-up
        print("Moving mount down...\n")
        await api.move_to(OT3Mount.LEFT, pos_min_left, _check_stalls=True) # front-left-down
        print("Moving to back-left...\n")
        await api.move_to(OT3Mount.LEFT, pos_min_left._replace(y=pos_max_left.y), _check_stalls=True) # back-left-down
        print("Moving mount up...\n")
        await api.move_to(OT3Mount.LEFT, pos_max_left._replace(x=pos_min_left.x), _check_stalls=True) # back-left-up
        print("Moving to front-right...\n")
        await api.move_to(OT3Mount.LEFT, pos_max_left._replace(y=pos_min_left.y), _check_stalls=True) # front-right-up
        print("Moving mount down...\n")
        await api.move_to(OT3Mount.LEFT, pos_min_left._replace(x=pos_max_left.x), _check_stalls=True) # front-right-down
        print("Moving to back-right...\n")
        await api.move_to(OT3Mount.LEFT, pos_max_left._replace(z=pos_min_left.z), _check_stalls=True) # back-right-down

    await api.move_to(OT3Mount.LEFT, pos_max_left, _check_stalls=True)

async def _main(is_simulating: bool, cycles: int, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()
    load = api.gantry_load

    AXES = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L]

    MAX_SPEED = []
    ACCEL = []
    HOLD_CURRENT = []
    RUN_CURRENT = []
    MAX_DISCONTINUITY = []
    DIRECTION_CHANGE_DISCONTINUITY = []

    test_robot = input("Enter robot ID:\n\t>> ")
    test_name = "gantry-z-lifetime-test"
    test_config = load.value
    test_tag = load.value
    print(f"test_config: {load.value}\n")

    rm = api.get_attached_instrument(OT3Mount.RIGHT).get('name')
    lm = api.get_attached_instrument(OT3Mount.LEFT).get('name')
    gripper = api.has_gripper()

    for i in range(len(AXES)):
        MAX_SPEED.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.default_max_speed, AXES[i], load))
        ACCEL.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.acceleration, AXES[i], load))
        HOLD_CURRENT.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.current_settings.hold_current, AXES[i], load))
        RUN_CURRENT.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.current_settings.run_current, AXES[i], load))
        MAX_DISCONTINUITY.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.max_speed_discontinuity, AXES[i], load))
        DIRECTION_CHANGE_DISCONTINUITY.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.direction_change_speed_discontinuity, AXES[i], load))

    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Time(s)', 'Test Robot', 'Test Configuration', 'Cycle', '', 'Left Mount', 'Right Mount', 'Gripper Attached', '', 'Axis',
              'Max Speed (mm/s)', 'Acceleration (mm^2/s)', 'Hold Current (A)',
              'Run Current (A)', 'Max Speed Discontinuity', 'Direction Change Speed Discontinuity']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    start_time = time.perf_counter()
    homed_pos_left = await api.gantry_position(OT3Mount.LEFT)
    homed_pos_right = await api.gantry_position(OT3Mount.RIGHT)
    for i in range(cycles):
        print(f"========== Cycle {i + 1}/{cycles} ==========\n")
        await _bowtie_move(api, homed_pos_left, homed_pos_right, load)
        if (i == 0 or i == 1 or i == 2):
            cycle_data = [time.perf_counter()-start_time, test_robot, test_config, i+1, '', lm, rm, gripper, '',
                          OT3Axis.to_kind(AXES[i]), MAX_SPEED[i], ACCEL[i], HOLD_CURRENT[i], RUN_CURRENT[i],
                          MAX_DISCONTINUITY[i], DIRECTION_CHANGE_DISCONTINUITY[i]]
            rm = ''
            lm = ''
            gripper = ''
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
    # parser.add_argument("--high_load", action="store_true")
    args = parser.parse_args()
    mount = mount_options[args.mount]

    if not args.simulate:
        input("Gantry-Z-Lifetime: Is the deck totally empty? (press ENTER to continue)")
    asyncio.run(_main(args.simulate, args.cycles, mount))
