import argparse
import asyncio
import time
import sys
from typing import List

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

from opentrons.hardware_control.types import CriticalPoint

async def _bowtie_move(api, homed_position_left: types.Point, homed_position_right: types.Point, load: GantryLoad) -> int:

    pos_max_left = homed_position_left - types.Point(x=1, y=10, z=1)
    pos_min_left = types.Point(x=0, y=95, z=pos_max_left.z - 150)  # stay above deck to be safe
    pos_max_right = homed_position_right - types.Point(x=1, y=10, z=1)
    pos_min_right = types.Point(x=0, y=95, z=pos_max_right.z - 150)  # stay above deck to be safe

    stall_count = 0

    low_tp_points = {
        '0': [pos_max_left, OT3Mount.LEFT],
        '1': [pos_max_right - types.Point(x=0, y=0, z=150), OT3Mount.RIGHT], ## add pick up after 1
        'Tip Pick Up - Right 1': ['', OT3Mount.RIGHT],
        '2': [pos_min_left._replace(z=pos_min_right.z), OT3Mount.RIGHT],
        '3': [pos_min_left._replace(z=pos_min_right.z) + types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
        '4': [Point(-54, 95, 509.15), OT3Mount.LEFT],
        '5': [Point(-54, 95, 509.15) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT], ## add pick up after 5
        'Tip Pick Up - Left 1': ['', OT3Mount.LEFT],
        '6': [pos_min_left._replace(x=-54, y=pos_max_left.y), OT3Mount.LEFT],
        '7': [pos_max_left._replace(x=-54), OT3Mount.LEFT],
        '8': [pos_max_left._replace(x=0) - types.Point(x=0, y=0, z=150), OT3Mount.RIGHT], ## add pick up after 8
        'Tip Pick Up - Right 2': ['', OT3Mount.RIGHT],
        '9': [pos_max_left._replace(x=517, y=pos_min_left.y, z=pos_min_right.z), OT3Mount.RIGHT],
        '10': [pos_max_left._replace(x=517, y=pos_min_left.y, z=pos_min_right.z) + types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
        '11': [Point(463, 95, 509.15), OT3Mount.LEFT],
        '12': [Point(463, 95, 509.15) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT], ## add pick up after 12
        'Tip Pick Up - Left 2': ['', OT3Mount.LEFT],
        '13': [pos_max_left._replace(x=463, z=pos_min_left.z), OT3Mount.LEFT],
        '14': [pos_max_left, OT3Mount.LEFT]
    }

    high_tp_points = [
        pos_max_left,
        pos_min_left._replace(z=pos_max_left.z),
        pos_min_left,
        pos_min_left._replace(y=pos_max_left.y),
        pos_max_left._replace(x=pos_min_left.x),
        pos_max_left._replace(y=pos_min_left.y),
        pos_min_left._replace(x=pos_max_left.x),
        pos_max_left._replace(z=pos_min_left.z),
        pos_max_left
    ]

    if load == GantryLoad.LOW_THROUGHPUT:
        for key in low_tp_points.keys():
            if 'Tip Pick Up' not in key:
                print(f"Move {key}\n")
                try:
                    await api.move_to(low_tp_points[key][1], low_tp_points[key][0], _check_stalls=True)
                except RuntimeError as e:
                    if "collision_detected" in str(e):
                        print("\n--STALL DETECTED--\n")
                        stall_count += 1
                        print("\n------HOMING------\n")
                        await api.home()
            elif api.get_attached_instrument(low_tp_points[key][1]).get('name') != None:
                print(f"{key}\n")
                tip_len = 57
                await api.pick_up_tip(low_tp_points[key][1], tip_len)
    else:
        for count, p in enumerate(high_tp_points):
            print(f"Move {count}\n")
            try:
                await api.move_to(OT3Mount.LEFT, p, _check_stalls=True)
            except RuntimeError as e:
                if "collision_detected" in str(e):
                    print("--STALL DETECTED--\n")
                    stall_count += 1
                    print("------HOMING------\n")
                    await api.home()
    return stall_count

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

    header = ['Time(s)', 'Test Robot', 'Test Configuration', 'Cycle', 'Cycle Stalls',
              'Total Stalls', '', 'Left Mount', 'Right Mount', 'Gripper Attached', '', 'Axis',
              'Max Speed (mm/s)', 'Acceleration (mm^2/s)', 'Hold Current (A)',
              'Run Current (A)', 'Max Speed Discontinuity', 'Direction Change Speed Discontinuity']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    start_time = time.perf_counter()
    homed_pos_left = await api.gantry_position(OT3Mount.LEFT)
    homed_pos_right = await api.gantry_position(OT3Mount.RIGHT)
    stall_count = 0
    total_stalls = 0
    for i in range(cycles):
        print(f"========== Cycle {i + 1}/{cycles} ==========\n")
        stall_count = await _bowtie_move(api, homed_pos_left, homed_pos_right, load)
        total_stalls += stall_count
        if (i == 0 or i == 1 or i == 2):
            cycle_data = [time.perf_counter()-start_time, test_robot, test_config, i+1, stall_count,
                          total_stalls, '', lm, rm, gripper, '', OT3Axis.to_kind(AXES[i]),
                          MAX_SPEED[i], ACCEL[i], HOLD_CURRENT[i], RUN_CURRENT[i],
                          MAX_DISCONTINUITY[i], DIRECTION_CHANGE_DISCONTINUITY[i]]
            rm = ''
            lm = ''
            gripper = ''
        else:
            cycle_data = [time.perf_counter()-start_time, test_robot, test_config, i+1, stall_count, total_stalls]
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
    args = parser.parse_args()
    mount = mount_options[args.mount]

    if not args.simulate:
        input("Gantry-Z-Lifetime: Is the deck totally empty? (press ENTER to continue)")
    asyncio.run(_main(args.simulate, args.cycles, mount))
