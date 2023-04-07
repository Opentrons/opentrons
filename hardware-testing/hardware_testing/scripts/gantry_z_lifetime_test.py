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

def _create_points(pos_max_left, pos_max_right, pos_min_left, pos_min_right, x_pt, y_pt, z_pt):
    return {
         0: [Point(454.703, 396.3, 245.0), OT3Mount.LEFT],# [pos_max_left, OT3Mount.LEFT],
         1: [Point(508.7, 396.3, 98.34), OT3Mount.RIGHT],# [pos_max_right - types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
         'Tip Pick Up - Right 1': ['', OT3Mount.RIGHT],
         # 2: [Point(0, 75.0, 98.34), OT3Mount.RIGHT],# [pos_min_left._replace(z=pos_min_right.z), OT3Mount.RIGHT],
         2: [Point(0, 75.0, 245.0), OT3Mount.RIGHT],# [pos_min_left._replace(z=pos_min_right.z) + types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
         3: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT],# Point(-54, 95, 509.15)
         4: [Point(x_pt, y_pt, z_pt) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT],# Point(-54, 95, 509.15)
         'Tip Pick Up - Left 1': ['', OT3Mount.LEFT],
         # 6: [Point(-54.0, 396.3, 99.0), OT3Mount.LEFT],# [pos_min_left._replace(x=x_pt, y=pos_max_left.y), OT3Mount.LEFT], #x=-54
         5: [Point(-54.0, 396.3, 245.0), OT3Mount.LEFT],# [pos_max_left._replace(x=x_pt), OT3Mount.LEFT], #x=-54
         6: [Point(0, 396.3, 99.0), OT3Mount.RIGHT],# [pos_max_left._replace(x=0) - types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
         'Tip Pick Up - Right 2': ['', OT3Mount.RIGHT],
         # 9: [Point(510.0, 75.0, 99.0), OT3Mount.RIGHT],# [pos_max_left._replace(x=510, y=pos_min_left.y, z=pos_min_right.z), OT3Mount.RIGHT],
         7: [Point(510.0, 75.0, 245.0), OT3Mount.RIGHT],# [pos_max_left._replace(x=510, y=pos_min_left.y, z=pos_min_right.z) + types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
         8: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT], #Point(463, 95, 509.15)
         9: [Point(x_pt, y_pt, z_pt) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT], #Point(463, 95, 509.15)
        'Tip Pick Up - Left 2': ['', OT3Mount.LEFT],
        # 13: [Point(455.7, 396.3, 99.0), OT3Mount.LEFT],# [pos_max_left._replace(x=x_pt, z=pos_min_left.z), OT3Mount.LEFT],
        10: [Point(454.7, 396.3, 245.0), OT3Mount.LEFT]#[pos_max_left, OT3Mount.LEFT]
    }

        #  0: [pos_max_left, OT3Mount.LEFT],
        #  1: [pos_max_right - types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
        #  'Tip Pick Up - Right 1': ['', OT3Mount.RIGHT],
        #  2: [pos_min_left._replace(z=pos_max_right.z), OT3Mount.RIGHT], #[pos_min_left._replace(z=pos_min_right.z), OT3Mount.RIGHT],
        #  #3: [pos_min_left._replace(z=pos_min_right.z) + types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
        #  3: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT], #Point(-54, 95, 509.15)
        #  4: [Point(x_pt, y_pt, z_pt) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT], #Point(-54, 95, 509.15)
        #  'Tip Pick Up - Left 1': ['', OT3Mount.LEFT],
        #  5: [pos_min_left._replace(x=x_pt, y=pos_max_left.y, z=pos_max_left.z), OT3Mount.LEFT],#[pos_min_left._replace(x=x_pt, y=pos_max_left.y), OT3Mount.LEFT], #x=-54
        #  6: [pos_max_left._replace(x=x_pt), OT3Mount.LEFT], #x=-54
        #  7: [pos_max_left._replace(x=0) - types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
        #  'Tip Pick Up - Right 2': ['', OT3Mount.RIGHT],
        #  8: [pos_max_left._replace(x=510, y=pos_min_left.y, z=pos_max_right.z), OT3Mount.RIGHT],#[pos_max_left._replace(x=510, y=pos_min_left.y, z=pos_min_right.z), OT3Mount.RIGHT],
        # #10: [pos_max_left._replace(x=510, y=pos_min_left.y, z=pos_min_right.z) + types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
        # 9: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT], #Point(463, 95, 509.15)
        # 10: [Point(x_pt, y_pt, z_pt) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT], #Point(463, 95, 509.15)
        # 'Tip Pick Up - Left 2': ['', OT3Mount.LEFT],
        # 11: [pos_max_left._replace(x=x_pt), OT3Mount.LEFT],#[pos_max_left._replace(x=x_pt, z=pos_min_left.z), OT3Mount.LEFT],
        # 12: [pos_max_left, OT3Mount.LEFT]

async def _bowtie_move(api, homed_position_left: types.Point, homed_position_right: types.Point, load: GantryLoad) -> int:

    pos_max_left = homed_position_left - types.Point(x=1, y=21, z=1)
    pos_min_left = types.Point(x=0, y=75, z=pos_max_left.z - 150)  # stay above deck to be safe
    pos_max_right = homed_position_right - types.Point(x=1, y=21, z=1)
    pos_min_right = types.Point(x=0, y=75, z=pos_max_right.z - 150)  # stay above deck to be safe

    stall_count = 0
    x_pt = -54
    y_pt = 95
    z_pt = 509.15

    low_tp_points = _create_points(pos_max_left, pos_max_right, pos_min_left, pos_min_right, x_pt, y_pt, z_pt)

    # low_tp_points = {
    #     0: [pos_max_left, OT3Mount.LEFT],
    #     1: [pos_max_right - types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
    #     2: [pos_min_left._replace(z=pos_min_right.z), OT3Mount.RIGHT],
    #     3: [pos_min_left._replace(z=pos_min_right.z) + types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
    #     4: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT], #Point(-54, 95, 509.15)
    #     5: [Point(x_pt, y_pt, z_pt) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT], #Point(-54, 95, 509.15)
    #     6: [pos_min_left._replace(x=x_pt, y=pos_max_left.y), OT3Mount.LEFT], #x=-54
    #     7: [pos_max_left._replace(x=x_pt), OT3Mount.LEFT], #x=-54
    #     8: [pos_max_left._replace(x=0) - types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
    #     9: [pos_max_left._replace(x=517, y=pos_min_left.y, z=pos_min_right.z), OT3Mount.RIGHT],
    #     10: [pos_max_left._replace(x=517, y=pos_min_left.y, z=pos_min_right.z) + types.Point(x=0, y=0, z=150), OT3Mount.RIGHT],
    #     11: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT], #Point(463, 95, 509.15)
    #     12: [Point(x_pt, y_pt, z_pt) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT], #Point(463, 95, 509.15)
    #     13: [pos_max_left._replace(x=x_pt, z=pos_min_left.z), OT3Mount.LEFT],
    #     14: [pos_max_left, OT3Mount.LEFT]
    # }

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

    #await api.move_to(OT3Mount.LEFT, pos_max_left) # back-right-up
    if load == GantryLoad.LOW_THROUGHPUT:
        for key in low_tp_points.keys():
            # print(f"Move {key}\n")
            # print(f"current position of right mount: {await api.gantry_position(OT3Mount.RIGHT)}\n")
            # print(f"current position of left mount: {await api.gantry_position(OT3Mount.LEFT)}\n")
            # print(f"keys: {low_tp_points[key][1]}, {low_tp_points[key][0]}\n")
            if type(key) == int:
                print(f"Move {key}\n")
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
                    print(f"\nCurrent position: {await api.gantry_position(low_tp_points[key][1])} on Mount: {low_tp_points[key][1]}\n")
                    encoder_pos = await api.encoder_current_position_ot3(low_tp_points[key][1])
                    if low_tp_points[key][1] == OT3Mount.LEFT:
                        AXIS = OT3Axis.Z_L
                    else:
                        AXIS = OT3Axis.Z_R
                    print(f"Encoder position: ({encoder_pos[OT3Axis.X]}, {encoder_pos[OT3Axis.Y]}, {encoder_pos[AXIS]})\n")
                    if key != 10:#14:
                        print(f"Moving to: {low_tp_points[key+1][0]} on {low_tp_points[key+1][1]}\n")
                    ###input("\t>>")
                    # multi_pos = await helpers_ot3.jog_mount_ot3(api, low_tp_points[key][1])
                    # print(f"Multi position: {multi_pos}\n")
                except RuntimeError as e:
                    if "collision_detected" in str(e):
                        print("--STALL DETECTED--\n")
                        stall_count += 1
                        print(f"Total stalls for this cycle: {stall_count}\n")
                        # stall_pos = await api.current_position_ot3(low_tp_points[key][1])
                        # encoder_stall_pos = await api.encoder_current_position_ot3(low_tp_points[key][1])
                        # print(f"Current position: {stall_pos}\nEncoder position: {encoder_stall_pos}\n")
                        if low_tp_points[key][1] == OT3Mount.LEFT:
                            STALL_AXIS = OT3Axis.Z_L
                        else:
                            STALL_AXIS = OT3Axis.Z_R
                        print("------HOMING------\n")
                        await api.home()
                        await api.home()
                        await api.home()
                        home_z_pos = await api.current_position_ot3(low_tp_points[key][1])
                        await api.move_to(low_tp_points[key][1], Point(low_tp_points[key][0][0], low_tp_points[key][0][1], home_z_pos[STALL_AXIS]))
                        await api.move_to(low_tp_points[key][1], low_tp_points[key][0])

                        # input("\nExit?\n\t>>")
                        # sys.exit("EXITING\n") ###
                        # await api.home()
            else:
                print(f"{key}\n")
                print("Moving mount down to calibration block...\n")
                tip_pick_up_pos = await api.current_position_ot3(low_tp_points[key][1])
                await api.move_to(low_tp_points[key][1], Point(tip_pick_up_pos[OT3Axis.X], tip_pick_up_pos[OT3Axis.Y], 72))
                tip_len = 57
                # input("/n/t>>")
                await api.pick_up_tip(low_tp_points[key][1], tip_len)
                await api.remove_tip(low_tp_points[key][1])
                if low_tp_points[key][1] == OT3Mount.LEFT:
                    AXIS = OT3Axis.Z_L
                else:
                    AXIS = OT3Axis.Z_R
                await api.home([AXIS])
                await api.move_rel(low_tp_points[key][1], delta=Point(z=-5))
                # await api.move_to(low_tp_points[key][1], Point(tip_pick_up_pos[OT3Axis.X], tip_pick_up_pos[OT3Axis.Y], tip_pick_up_pos[AXIS]))

        # print("Moving right mount down...\n")
        # await api.move_rel(OT3Mount.RIGHT, delta=Point(z=-150), _check_stalls=True) # move right mount down
        # print("Moving to front-left...\n")
        # await api.move_to(OT3Mount.RIGHT, pos_min_left._replace(z=pos_min_right.z), _check_stalls=True) # move to front-left with right mount down
        # print("Moving right mount up...\n")
        # await api.move_rel(OT3Mount.RIGHT, delta=Point(z=150), _check_stalls=True) # move right mount up
        # cur_pos = await api.current_position_ot3(OT3Mount.LEFT)
        # print(f"current pos for point 4:{cur_pos}\n")
        # await api.move_to(OT3Mount.LEFT, Point(cur_pos[OT3Axis.X], cur_pos[OT3Axis.Y], cur_pos[OT3Axis.Z_L]), _check_stalls=True) #pos_min_left) # front-left-down
        # print("Moving left mount down...\n")
        # await api.move_rel(OT3Mount.LEFT, delta=Point(z=-150), _check_stalls=True)
        # print("Moving to back-left...\n")
        # await api.move_to(OT3Mount.LEFT, pos_min_left._replace(x=cur_pos[OT3Axis.X], y=pos_max_left.y), _check_stalls=True)# back-left-down
        # print("Moving left mount up...\n")
        # await api.move_to(OT3Mount.LEFT, pos_max_left._replace(x=cur_pos[OT3Axis.X]), _check_stalls=True) #pos_min_left.x)) # back-left-up
        # print("Moving right mount down...\n")
        # await api.move_rel(OT3Mount.RIGHT, delta=Point(z=-150), _check_stalls=True)
        # print("Moving to front-right...\n")
        # # print(f"Point: {pos_max_left._replace(x=517.7, y=pos_min_left.y, z=pos_min_right.z)}\n")
        # await api.move_to(OT3Mount.RIGHT, pos_max_left._replace(x=517, y=pos_min_left.y, z=pos_min_right.z), _check_stalls=True) # front-right-up
        # print("Moving right mount up...\n")
        # await api.move_rel(OT3Mount.RIGHT, delta=Point(z=150), _check_stalls=True)
        # # print(f"current position of right mount: {await api.gantry_position(OT3Mount.RIGHT)}\n")
        # # print(f"current position of left mount: {await api.gantry_position(OT3Mount.LEFT)}\n")
        # cur_pos = await api.current_position_ot3(OT3Mount.LEFT)
        # print(f"current pos for point 11:{cur_pos}\n")
        # await api.move_to(OT3Mount.LEFT, Point(cur_pos[OT3Axis.X], cur_pos[OT3Axis.Y], cur_pos[OT3Axis.Z_L]), _check_stalls=True) #pos_min_left._replace(x=pos_max_left.x)) # front-right-down
        # print("Moving left mount down...\n")
        # await api.move_rel(OT3Mount.LEFT, delta=Point(z=-150), _check_stalls=True)
        # print("Moving to back-right...\n")
        # await api.move_to(OT3Mount.LEFT, pos_max_left._replace(x=cur_pos[OT3Axis.X], z=pos_min_left.z), _check_stalls=True) # back-right-down
    else:
        for count, p in enumerate(high_tp_points):
            if type(key) == int:
                print(f"Move {count}\n")
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
                print(f"{key}\n")
                print("Moving mount down to calibration block...\n")
                tip_pick_up_pos = await api.current_position_ot3(OT3Mount.LEFT)
                await api.move_to(OT3Mount.LEFT, Point(tip_pick_up_pos[OT3Axis.X], tip_pick_up_pos[OT3Axis.Y], 100))
                tip_len = 57
                await api.pick_up_tip(OT3Mount.LEFT, tip_len)
                await api.remove_tip(OT3Mount.LEFT)
                await api.home([OT3Axis.Z_L])
                #await api.move_rel(low_tp_points[key][1], delta=Point(z=-5))

    #     print("Moving to front-left...\n")
    #     await api.move_to(OT3Mount.LEFT, pos_min_left._replace(z=pos_max_left.z), _check_stalls=True) # front-left-up
    #     print("Moving mount down...\n")
    #     await api.move_to(OT3Mount.LEFT, pos_min_left, _check_stalls=True) # front-left-down
    #     print("Moving to back-left...\n")
    #     await api.move_to(OT3Mount.LEFT, pos_min_left._replace(y=pos_max_left.y), _check_stalls=True) # back-left-down
    #     print("Moving mount up...\n")
    #     await api.move_to(OT3Mount.LEFT, pos_max_left._replace(x=pos_min_left.x), _check_stalls=True) # back-left-up
    #     print("Moving to front-right...\n")
    #     await api.move_to(OT3Mount.LEFT, pos_max_left._replace(y=pos_min_left.y), _check_stalls=True) # front-right-up
    #     print("Moving mount down...\n")
    #     await api.move_to(OT3Mount.LEFT, pos_min_left._replace(x=pos_max_left.x), _check_stalls=True) # front-right-down
    #     print("Moving to back-right...\n")
    #     await api.move_to(OT3Mount.LEFT, pos_max_left._replace(z=pos_min_left.z), _check_stalls=True) # back-right-down
    #
    # await api.move_to(OT3Mount.LEFT, pos_max_left, _check_stalls=True)
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
                          MAX_SPEED[i], ACCEL[i], HOLD_CURRENT[i],
                          RUN_CURRENT[i], MAX_DISCONTINUITY[i], DIRECTION_CHANGE_DISCONTINUITY[i]]
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
    # parser.add_argument("--high_load", action="store_true")
    args = parser.parse_args()
    mount = mount_options[args.mount]

    if not args.simulate:
        input("Gantry-Z-Lifetime: Is the deck totally empty? (press ENTER to continue)")
    asyncio.run(_main(args.simulate, args.cycles, mount))
