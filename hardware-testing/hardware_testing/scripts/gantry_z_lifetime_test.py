import argparse
import asyncio
import time
from typing import List
import sys

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

from opentrons.hardware_control.types import CriticalPoint

def convert(seconds):
    seconds = seconds % (24 * 3600)
    hour = seconds // 3600
    seconds %= 3600
    minutes = seconds // 60
    seconds %= 60

    return "%d:%02d:%02d" % (hour, minutes, seconds)

def _create_points(pos_max_left, pos_max_right, pos_min_left, pos_min_right, x_pt, y_pt, z_pt):
    return {
         0: [Point(454.703, 396.3, 245.0), OT3Mount.LEFT, 'start'],# [pos_max_left, OT3Mount.LEFT],
         1: [Point(508.7, 396.3, 98.34), OT3Mount.RIGHT, 'Z_R'],# [pos_max_right - types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
         'Tip Pick Up - Right 1': ['', OT3Mount.RIGHT, 'P'],
         # 2: [Point(0, 75.0, 98.34), OT3Mount.RIGHT],# [pos_min_left._replace(z=pos_min_right.z), OT3Mount.RIGHT],
         2: [Point(0, 75.0, 245.0), OT3Mount.RIGHT, 'XY'],# [pos_min_left._replace(z=pos_min_right.z) + types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
         3: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT, 'M'],# Point(-54, 95, 509.15)
         4: [Point(x_pt, y_pt, z_pt) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT, 'Z_L'],# Point(-54, 95, 509.15)
         'Tip Pick Up - Left 1': ['', OT3Mount.LEFT, 'P'],
         # 6: [Point(-54.0, 396.3, 99.0), OT3Mount.LEFT],# [pos_min_left._replace(x=x_pt, y=pos_max_left.y), OT3Mount.LEFT], #x=-54
         5: [Point(-54.0, 396.3, 245.0), OT3Mount.LEFT, 'Y'],# [pos_max_left._replace(x=x_pt), OT3Mount.LEFT], #x=-54
         6: [Point(0, 396.3, 99.0), OT3Mount.RIGHT, 'Z_R'],# [pos_max_left._replace(x=0) - types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
         'Tip Pick Up - Right 2': ['', OT3Mount.RIGHT, 'P'],
         # 9: [Point(510.0, 75.0, 99.0), OT3Mount.RIGHT],# [pos_max_left._replace(x=510, y=pos_min_left.y, z=pos_min_right.z), OT3Mount.RIGHT],
         7: [Point(510.0, 75.0, 245.0), OT3Mount.RIGHT, 'XY'],# [pos_max_left._replace(x=510, y=pos_min_left.y, z=pos_min_right.z) + types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
         8: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT, 'M'], #Point(463, 95, 509.15)
         9: [Point(x_pt, y_pt, z_pt) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT, 'Z_L'], #Point(463, 95, 509.15)
        'Tip Pick Up - Left 2': ['', OT3Mount.LEFT, 'P'],
        # 13: [Point(455.7, 396.3, 99.0), OT3Mount.LEFT],# [pos_max_left._replace(x=x_pt, z=pos_min_left.z), OT3Mount.LEFT],
        10: [Point(454.7, 396.3, 245.0), OT3Mount.LEFT, 'Y']#[pos_max_left, OT3Mount.LEFT]
    }

async def _bowtie_move(api, homed_position_left: types.Point, homed_position_right: types.Point, load: GantryLoad) -> int:

    pos_max_left = homed_position_left - types.Point(x=1, y=21, z=1)
    pos_min_left = types.Point(x=0, y=75, z=pos_max_left.z - 150)  # stay above deck to be safe
    pos_max_right = homed_position_right - types.Point(x=1, y=21, z=1)
    pos_min_right = types.Point(x=0, y=75, z=pos_max_right.z - 150)  # stay above deck to be safe

    stall_count = xy_count = y_count = z_l_count = z_r_count = 0
    x_pt = -54
    y_pt = 95
    z_pt = 509.15

    low_tp_points = _create_points(pos_max_left, pos_max_right, pos_min_left, pos_min_right, x_pt, y_pt, z_pt)

    high_tp_points = {
        0: pos_max_left, # back right and up
        1: pos_min_left._replace(z=pos_max_left.z), # front left and up
        2: pos_min_left, # front left and down
        'Tip Pick Up - 1': '',
        3: pos_min_left._replace(y=pos_max_left.y), # back left and down
        4: pos_max_left._replace(x=pos_min_left.x), # back left and up
        5: pos_max_left._replace(y=pos_min_left.y), # front right and up
        6: pos_min_left._replace(x=pos_max_left.x), # front right and down
        'Tip Pick Up - 2': '',
        7: pos_max_left._replace(z=pos_min_left.z), # back right and down
        8: pos_max_left # back right and up
    }

    if load == GantryLoad.LOW_THROUGHPUT:
        for key in low_tp_points.keys():
            if type(key) == int:
                print(f">> Move {key} <<\n")
                if key == 3 or key == 8: # 4 and 11
                    cur_pos = await api.current_position_ot3(OT3Mount.LEFT)
                    x_pt = cur_pos[OT3Axis.X]
                    y_pt = cur_pos[OT3Axis.Y]
                    z_pt = cur_pos[OT3Axis.Z_L]
                    low_tp_points = _create_points(pos_max_left, pos_max_right, pos_min_left, pos_min_right, x_pt, y_pt, z_pt)
                    # low_tp_points.update({key: [Point(cur_pos[OT3Axis.X], cur_pos[OT3Axis.Y], cur_pos[OT3Axis.Z_L]), low_tp_points[key][1]]})
                    # low_tp_points.update({(key+1): [Point(cur_pos[OT3Axis.X], cur_pos[OT3Axis.Y], cur_pos[OT3Axis.Z_L] - 150)], low_tp_points[key+1][1]})
                try:
                    await api.move_to(low_tp_points[key][1], low_tp_points[key][0], _check_stalls=True)
                    print(f"Current position: {await api.gantry_position(low_tp_points[key][1])} on Mount: {low_tp_points[key][1]}")
                    encoder_pos = await api.encoder_current_position_ot3(low_tp_points[key][1])
                    if low_tp_points[key][1] == OT3Mount.LEFT:
                        AXIS = OT3Axis.Z_L
                    else:
                        AXIS = OT3Axis.Z_R
                    print(f"Encoder position: ({encoder_pos[OT3Axis.X]}, {encoder_pos[OT3Axis.Y]}, {encoder_pos[AXIS]})")
                    if key != 10:#14:
                        print(f"Moving to: {low_tp_points[key+1][0]} on {low_tp_points[key+1][1]}\n")
                    ###input("\t>>")
                    # multi_pos = await helpers_ot3.jog_mount_ot3(api, low_tp_points[key][1])
                    # print(f"Multi position: {multi_pos}\n")
                except RuntimeError as e:
                    if "collision_detected" in str(e):
                        print("--STALL DETECTED--\n")
                        print(f"Axis/Axes stalled: {low_tp_points[key][2]}\n")
                        stall_count += 1
                        if low_tp_points[key][1] == OT3Mount.LEFT:
                            STALL_AXIS = OT3Axis.Z_L
                            z_l_count += 1
                        else:
                            STALL_AXIS = OT3Axis.Z_R
                            z_r_count += 1
                        print("------HOMING------\n")
                        if 'X' in low_tp_points[key][2]:
                            await api.home()
                            xy_count += 1
                        elif low_tp_points[key][2] == 'Y':
                            await api.home([OT3Axis.Y])
                            y_count += 1
                        elif 'Z' in low_tp_points[key][2]:
                            await api.home([STALL_AXIS])

                        print(f"Total stalls for this cycle: {stall_count} (XY: {xy_count}, Y: {y_count}, Z_L: {z_l_count}, Z_R: {z_r_count})\n")
                        # await api.home()
                        home_z_pos = await api.current_position_ot3(low_tp_points[key][1])
                        await api.move_to(low_tp_points[key][1], Point(low_tp_points[key][0][0], low_tp_points[key][0][1], home_z_pos[STALL_AXIS]))
                        await api.move_to(low_tp_points[key][1], low_tp_points[key][0])

            else:
                print(f">> {key} <<\n")
                print("Moving mount down to calibration block...\n")
                tip_pick_up_pos = await api.current_position_ot3(low_tp_points[key][1])
                await api.move_to(low_tp_points[key][1], Point(tip_pick_up_pos[OT3Axis.X], tip_pick_up_pos[OT3Axis.Y], 72))
                tip_len = 57
                # input("/n/t>>")
                await api.pick_up_tip(low_tp_points[key][1], tip_len, prep_after=False)
                await api.remove_tip(low_tp_points[key][1])
                if low_tp_points[key][1] == OT3Mount.LEFT:
                    AXIS = OT3Axis.Z_L
                else:
                    AXIS = OT3Axis.Z_R
                await api.home([AXIS])
                await api.move_rel(low_tp_points[key][1], delta=Point(z=-5))
                # await api.move_to(low_tp_points[key][1], Point(tip_pick_up_pos[OT3Axis.X], tip_pick_up_pos[OT3Axis.Y], tip_pick_up_pos[AXIS]))

    else:
        for count, p in enumerate(high_tp_points):
            if type(key) == int:
                print(f">> Move {count} <<\n")
                try:
                    await api.move_to(OT3Mount.LEFT, p, _check_stalls=True)
                except RuntimeError as e:
                    if "collision_detected" in str(e):
                        print("--STALL DETECTED--\n")
                        stall_count += 1
                        print(f"Total stalls for this cycle: {stall_count}\n")
                        print("------HOMING------\n")
                        await api.home()
                        home_z_pos = await api.current_position_ot3(OT3Mount.LEFT)
                        await api.move_to(OT3Mount.LEFT, Point(high_tp_points[key][0], high_tp_points[key][1], home_z_pos[OT3Axis.Z_L]))
                        await api.move_to(OT3Mount.LEFT, high_tp_points[key])

            else:
                print(f">> {key} <<\n")
                print("Moving mount down to calibration block...\n")
                tip_pick_up_pos = await api.current_position_ot3(OT3Mount.LEFT)
                pip_pos = await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
                print(f"96Ch position: {pip_pos}\n")
                pip_z_pt = input("\nEnter Z coordinate for tip pick up: >>")
                await api.move_to(OT3Mount.LEFT, Point(tip_pick_up_pos[OT3Axis.X], tip_pick_up_pos[OT3Axis.Y], pip_z_pt))
                tip_len = 57
                await api.pick_up_tip(OT3Mount.LEFT, tip_len, prep_after=False)
                await api.remove_tip(OT3Mount.LEFT)
                await api.home([OT3Axis.Z_L])
                #await api.move_rel(low_tp_points[key][1], delta=Point(z=-5))

    return stall_count, xy_count, y_count, z_l_count, z_r_count

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
    print(f"\ntest_config: {load.value}\n")

    while(1):
        rm = api.get_attached_instrument(OT3Mount.RIGHT).get('name')
        lm = api.get_attached_instrument(OT3Mount.LEFT).get('name')
        gripper = api.has_gripper()

        if load == GantryLoad.LOW_THROUGHPUT and (rm == None or lm == None):
            input("Low throughput test requires two pipettes. Attach pipettes and press enter.\n")
            continue
        else:
            break

    for i in range(len(AXES)):
        MAX_SPEED.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.default_max_speed, AXES[i], load))
        ACCEL.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.acceleration, AXES[i], load))
        HOLD_CURRENT.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.current_settings.hold_current, AXES[i], load))
        RUN_CURRENT.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.current_settings.run_current, AXES[i], load))
        MAX_DISCONTINUITY.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.max_speed_discontinuity, AXES[i], load))
        DIRECTION_CHANGE_DISCONTINUITY.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.direction_change_speed_discontinuity, AXES[i], load))

    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Time (H:M:S)', 'Test Robot', 'Test Configuration', 'Cycle', 'Cycle Stalls',
              'XY Stall', 'Y Stall', 'Z_L Stall', 'Z_R Stall',
              'Total Stalls', '', 'Left Mount', 'Right Mount', 'Gripper Attached', '', 'Axis',
              'Max Speed (mm/s)', 'Acceleration (mm^2/s)', 'Hold Current (A)',
              'Run Current (A)', 'Max Speed Discontinuity', 'Direction Change Speed Discontinuity']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    start_time = time.perf_counter()
    homed_pos_left = await api.gantry_position(OT3Mount.LEFT)
    homed_pos_right = await api.gantry_position(OT3Mount.RIGHT)
    stall_count = xy_count = y_count = z_l_count = z_r_count = 0
    total_stalls = 0
    for i in range(cycles):
        print(f"\n========== Cycle {i + 1}/{cycles} ==========\n")
        stall_count, xy_count, y_count, z_l_count, z_r_count = await _bowtie_move(api, homed_pos_left, homed_pos_right, load)
        total_stalls += stall_count
        if (i == 0 or i == 1 or i == 2):
            cycle_data = [convert(time.perf_counter()-start_time), test_robot, test_config, i+1, stall_count,
                          xy_count, y_count, z_l_count, z_r_count,
                          total_stalls, '', lm, rm, gripper, '', OT3Axis.to_kind(AXES[i]),
                          MAX_SPEED[i], ACCEL[i], HOLD_CURRENT[i],
                          RUN_CURRENT[i], MAX_DISCONTINUITY[i], DIRECTION_CHANGE_DISCONTINUITY[i]]
            rm = ''
            lm = ''
            gripper = ''
        else:
            cycle_data = [convert(time.perf_counter()-start_time), test_robot, test_config, i+1, stall_count,
                            xy_count, y_count, z_l_count, z_r_count, total_stalls]
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
