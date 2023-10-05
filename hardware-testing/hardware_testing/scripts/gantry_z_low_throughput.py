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
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError


def convert(seconds):
    weeks, seconds = divmod(seconds, 7*24*60*60)
    days, seconds = divmod(seconds, 24*60*60)
    hours, seconds = divmod(seconds, 60*60)
    minutes, seconds = divmod(seconds, 60)

    return "%02d:%02d:%02d:%02d:%02d" % (weeks, days, hours, minutes, seconds)


def _create_points(x_pt, y_pt, z_pt):
    return {
         0: [Point(454.703, 396.3, 245.0), OT3Mount.LEFT, 'start'],
         1: [Point(508.7, 396.3, 98.34), OT3Mount.RIGHT, 'Z_R'],
         'Tip Pick Up - Right 1': ['', OT3Mount.RIGHT, 'P'],
         2: [Point(0, 75.0, 245.0), OT3Mount.RIGHT, 'XY'],
         3: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT, 'M'],
         4: [Point(x_pt, y_pt, z_pt) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT, 'Z_L'],
         'Tip Pick Up - Left 1': ['', OT3Mount.LEFT, 'P'],
         5: [Point(-54.0, 396.3, 245.0), OT3Mount.LEFT, 'Y'],
         6: [Point(0, 396.3, 99.0), OT3Mount.RIGHT, 'Z_R'],
         'Tip Pick Up - Right 2': ['', OT3Mount.RIGHT, 'P'],

         7: [Point(509.0, 75.0, 245.0), OT3Mount.RIGHT, 'XY'],
         8: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT, 'M'],
         9: [Point(x_pt, y_pt, z_pt) - types.Point(x=0, y=0, z=150), OT3Mount.LEFT, 'Z_L'],
         'Tip Pick Up - Left 2': ['', OT3Mount.LEFT, 'P'],
         10: [Point(454.7, 396.3, 245.0), OT3Mount.LEFT, 'Y']
    }


async def _bowtie_move(api, load: GantryLoad) -> tuple:

    stall_count = xy_count = y_count = z_l_count = z_r_count = 0
    x_pt = -54
    y_pt = 95
    z_pt = 509.15

    low_tp_points = _create_points(x_pt, y_pt, z_pt)

    if load == GantryLoad.LOW_THROUGHPUT:
        for key in low_tp_points.keys():
            if type(key) == int:
                print(f">> Move {key} <<\n")
                if key == 3 or key == 8:
                    cur_pos = await api.current_position_ot3(OT3Mount.LEFT, refresh=True)
                    x_pt = cur_pos[OT3Axis.X]
                    y_pt = cur_pos[OT3Axis.Y]
                    z_pt = cur_pos[OT3Axis.Z_L]
                    low_tp_points = _create_points(x_pt, y_pt, z_pt)
                try:
                    await api.move_to(low_tp_points[key][1], low_tp_points[key][0])
                    print(f"Current position: {await api.gantry_position(low_tp_points[key][1])} on Mount: {low_tp_points[key][1]}")
                    encoder_pos = await api.encoder_current_position_ot3(low_tp_points[key][1], refresh=True)
                    if low_tp_points[key][1] == OT3Mount.LEFT:
                        AXIS = OT3Axis.Z_L
                    else:
                        AXIS = OT3Axis.Z_R
                    print(f"Encoder position: ({encoder_pos[OT3Axis.X]}, {encoder_pos[OT3Axis.Y]}, {encoder_pos[AXIS]})")
                    if key != 10:
                        print(f"Moving to: {low_tp_points[key+1][0]} on {low_tp_points[key+1][1]}\n")
                except StallOrCollisionDetectedError:
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
                    home_z_pos = await api.current_position_ot3(low_tp_points[key][1], refresh=True)
                    await api.move_to(low_tp_points[key][1], Point(low_tp_points[key][0][0], low_tp_points[key][0][1],
                                                                   home_z_pos[STALL_AXIS]))
                    await api.move_to(low_tp_points[key][1], low_tp_points[key][0])

            else:
                print(f">> {key} <<\n")
                print("Moving mount down to calibration block...\n")
                tip_pick_up_pos = await api.current_position_ot3(low_tp_points[key][1], refresh=True)
                await api.move_to(low_tp_points[key][1], Point(tip_pick_up_pos[OT3Axis.X], tip_pick_up_pos[OT3Axis.Y],
                                                               70.5))  # 72mm with rectangular aluminum block
                tip_len = 57
                await api.pick_up_tip(low_tp_points[key][1], tip_len, prep_after=False)
                await api.remove_tip(low_tp_points[key][1])
                if low_tp_points[key][1] == OT3Mount.LEFT:
                    AXIS = OT3Axis.Z_L
                else:
                    AXIS = OT3Axis.Z_R
                await api.home([AXIS])
                await api.move_rel(low_tp_points[key][1], delta=Point(z=-5))

                # record position loss for each cycle
                open_loop_pos = await api.current_position_ot3(OT3Mount.LEFT, refresh=True)
                final_encoder_pos = await api.encoder_current_position_ot3(OT3Mount.LEFT, refresh=True)

    return stall_count, xy_count, y_count, z_l_count, z_r_count, final_encoder_pos, open_loop_pos


async def _main(is_simulating: bool, cycles: int, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating, stall_detection_enable=True)
    await api.cache_instruments()
    await api.home()
    load = api.gantry_load

    AXES = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L]

    MAX_SPEED = []
    ACCEL = []
    HOLD_CURRENT = []
    RUN_CURRENT = []
    MAX_DISCONTINUITY = []
    DIRECTION_CHANGE_DISCONTINUITY = []

    test_robot = 'GLT Low Throughput'
    test_name = "gantry-z-lifetime-test"
    test_config = load.value
    test_tag = load.value
    print(f"\ntest_config: {load.value}\n")

    rm = api.get_attached_instrument(OT3Mount.RIGHT).get('name')
    lm = api.get_attached_instrument(OT3Mount.LEFT).get('name')
    gripper = api.has_gripper()

    if load == GantryLoad.LOW_THROUGHPUT and (rm is None or lm is None):
        sys.exit("Low throughput test requires two pipettes. Exiting test script...\n")

    for i in range(len(AXES)):
        MAX_SPEED.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.default_max_speed, AXES[i], load))
        ACCEL.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.acceleration, AXES[i], load))
        HOLD_CURRENT.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.current_settings.hold_current, AXES[i], load))
        RUN_CURRENT.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.current_settings.run_current, AXES[i], load))
        MAX_DISCONTINUITY.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.max_speed_discontinuity, AXES[i], load))
        DIRECTION_CHANGE_DISCONTINUITY.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.direction_change_speed_discontinuity, AXES[i], load))

    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Time (H:M:S)', 'Test Robot', 'Test Configuration', 'Cycle',
              'XY Stall', 'Y Stall', 'Z_L Stall', 'Z_R Stall', 'Cycle Stalls',
              'Total Stalls', '', 'Open-Loop Position', 'Encoder Position', 'Difference X (mm)', 'Difference Y (mm)',
              'Difference Z (mm)', '', 'Left Mount', 'Right Mount', 'Gripper Attached', '', 'Axis',
              'Max Speed (mm/s)', 'Acceleration (mm^2/s)', 'Hold Current (A)',
              'Run Current (A)', 'Max Speed Discontinuity', 'Direction Change Speed Discontinuity']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    start_time = time.perf_counter()
    total_stalls = 0
    for i in range(cycles):
        print(f"\n========== Cycle {i + 1}/{cycles} ==========\n")
        stall_count, xy_count, y_count, z_l_count, z_r_count, final_encoder_pos, open_loop_pos = await _bowtie_move(api, load)
        total_stalls += stall_count

        print(f"{final_encoder_pos}\n")
        print(f"{open_loop_pos}\n")
        diff_pos_x = final_encoder_pos[OT3Axis.X]-open_loop_pos[OT3Axis.X]
        diff_pos_y = final_encoder_pos[OT3Axis.Y]-open_loop_pos[OT3Axis.Y]
        diff_pos_z = final_encoder_pos[OT3Axis.Z_L]-open_loop_pos[OT3Axis.Z_L]
        str_open = str(open_loop_pos[OT3Axis.X]) + " " + str(open_loop_pos[OT3Axis.Y]) + " " + str(open_loop_pos[OT3Axis.Z_L])
        str_enc = str(final_encoder_pos[OT3Axis.X]) + " " + str(final_encoder_pos[OT3Axis.Y]) + " " + str(final_encoder_pos[OT3Axis.Z_L])

        if i == 0 or i == 1 or i == 2:
            cycle_data = [convert(time.perf_counter()-start_time), test_robot, test_config, i+1,
                          xy_count, y_count, z_l_count, z_r_count, stall_count,
                          total_stalls, '', str_open, str_enc, diff_pos_x, diff_pos_y, diff_pos_z, '',
                          lm, rm, gripper, '', OT3Axis.to_kind(AXES[i]),
                          MAX_SPEED[i], ACCEL[i], HOLD_CURRENT[i],
                          RUN_CURRENT[i], MAX_DISCONTINUITY[i], DIRECTION_CHANGE_DISCONTINUITY[i]]
            print(f"CYCLE DATA: {cycle_data}\n")
            rm = ''
            lm = ''
            gripper = ''
        else:
            cycle_data = [convert(time.perf_counter()-start_time), test_robot, test_config, i+1,
                          xy_count, y_count, z_l_count, z_r_count, stall_count, total_stalls,
                          '', str_open, str_enc, diff_pos_x, diff_pos_y, diff_pos_z]
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

    asyncio.run(_main(args.simulate, args.cycles, mount))
