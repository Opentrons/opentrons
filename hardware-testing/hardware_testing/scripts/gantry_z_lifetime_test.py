import argparse
import asyncio
import time
from typing import List
import sys
import json

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

async def _bowtie_move(api, homed_position_left: types.Point, homed_position_right: types.Point, load: GantryLoad) -> int:

    pos_max_left = homed_position_left - types.Point(x=1, y=21, z=1)
    pos_min_left = types.Point(x=-65, y=75, z=pos_max_left.z - 150)  # stay above deck to be safe
    pos_max_right = homed_position_right - types.Point(x=1, y=21, z=1)
    pos_min_right = types.Point(x=0, y=75, z=pos_max_right.z - 150)  # stay above deck to be safe

    print(f"pos_max_left: {pos_max_left}\n")
    print(f"pos_min_left: {pos_min_left}\n")
    print(f"pos_max_right: {pos_max_right}\n")
    print(f"pos_min_right: {pos_min_right}\n")

    stall_count = xy_count = y_count = z_l_count = z_r_count = 0
    x_pt = -54
    y_pt = 95
    z_pt = 509.15

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

    for key in high_tp_points.keys():
        if type(key) == int:
            print(f">> Move {key} <<\n")
            try:
                await api.move_to(OT3Mount.LEFT, high_tp_points[key])
            except StallOrCollisionDetectedError: # opentrons_shared_data.errors.exceptions.StallOrCollisionDetectedError: #RuntimeError as e:
                #if "collision_detected" in str(e):
                print("--STALL DETECTED--\n")
                stall_count += 1
                print(f"Total stalls for this cycle: {stall_count}\n")
                print("------HOMING------\n")
                await api.home()
                home_z_pos = await api.current_position_ot3(OT3Mount.LEFT, refresh=True)
                await api.move_to(OT3Mount.LEFT, Point(high_tp_points[key][0], high_tp_points[key][1], home_z_pos[OT3Axis.Z_L]))
                await api.move_to(OT3Mount.LEFT, high_tp_points[key])

        else:
            print(f">> {key} <<\n")
            print("Moving mount down to calibration block...\n")
            tip_pick_up_pos = await api.current_position_ot3(OT3Mount.LEFT, refresh=True)
            # pip_pos = await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
            # print(f"96Ch position: {pip_pos}\n")
            ### pip_z_pt = 332.65 + 1.5 + 25 # 80 # input("\nEnter Z coordinate for tip pick up: >>")
            await api.move_to(OT3Mount.LEFT, Point(tip_pick_up_pos[OT3Axis.X], tip_pick_up_pos[OT3Axis.Y], tip_pick_up_pos[OT3Axis.Z_L] - 30.0)) #pip_z_pt))
            tip_len = 57
            await api.pick_up_tip(OT3Mount.LEFT, tip_len, prep_after=False)
            await api.remove_tip(OT3Mount.LEFT)
            await api.move_to(OT3Mount.LEFT, Point(tip_pick_up_pos[OT3Axis.X], tip_pick_up_pos[OT3Axis.Y], tip_pick_up_pos[OT3Axis.Z_L]))

            # record position loss for each cycle
            open_loop_pos = await api.current_position_ot3(OT3Mount.LEFT, refresh=True)
            final_encoder_pos = await api.encoder_current_position_ot3(OT3Mount.LEFT, refresh=True)

            # await api.home([OT3Axis.Z_L])
            #await api.move_rel(low_tp_points[key][1], delta=Point(z=-5))

    return stall_count, xy_count, y_count, z_l_count, z_r_count, final_encoder_pos, open_loop_pos

async def _main(is_simulating: bool, cycles: int, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating, stall_detection_enable=True)
    await api.cache_instruments()
    await api.home()
    # await api.set_gantry_load(api.gantry_load.HIGH_THROUGHPUT)
    load = api.gantry_load

    AXES = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L]

    MAX_SPEED = []
    ACCEL = []
    HOLD_CURRENT = []
    RUN_CURRENT = []
    MAX_DISCONTINUITY = []
    DIRECTION_CHANGE_DISCONTINUITY = []

    test_robot = 'GL2'# input("Enter robot ID:\n\t>> ")
    test_name = "gantry-z-lifetime-test"
    test_config = load.value
    test_tag = load.value
    print(f"\ntest_config: {load.value}\n")

    while(1):
        rm = api.get_attached_instrument(OT3Mount.RIGHT).get('name')
        lm = api.get_attached_instrument(OT3Mount.LEFT).get('name')
        gripper = api.has_gripper()

        if load == GantryLoad.LOW_THROUGHPUT and (rm == None or lm == None):
            print("Low throughput test requires two pipettes. Attach pipettes and press enter.\n") #input
            continue
        else:
            print(f"Left mount: {lm}\n")
            print(f"Right mount (should be empty): {rm}\n")
            break

    for i in range(len(AXES)):
        MAX_SPEED.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.default_max_speed, AXES[i], load))
        ACCEL.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.acceleration, AXES[i], load))
        HOLD_CURRENT.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.current_settings.hold_current, AXES[i], load))
        RUN_CURRENT.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.current_settings.run_current, AXES[i], load))
        MAX_DISCONTINUITY.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.max_speed_discontinuity, AXES[i], load))
        DIRECTION_CHANGE_DISCONTINUITY.append(helpers_ot3.get_gantry_per_axis_setting_ot3(api.config.motion_settings.direction_change_speed_discontinuity, AXES[i], load))

    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Time (H:M:S)', 'Test Robot', 'Test Configuration', 'Pick Up Current (A)', 'Cycle',
              'XY Stall', 'Y Stall', 'Z_L Stall', 'Z_R Stall', 'Cycle Stalls',
              'Total Stalls', '', 'Open-Loop Position', 'Encoder Position', 'Difference X (mm)', 'Difference Y (mm)', 'Difference Z (mm)',
              '', 'Left Mount', 'Right Mount', 'Gripper Attached', '', 'Axis',
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

        # if (i + 1) % 20 == 0:
        #     # set current to 1.5A
        #     print("Setting pick up current to 1.5A\n")
        #     await helpers_ot3.update_pick_up_current(api, mount, 1.5)
        # else:
        # set current to 0.75A
        print("Setting pick up current to 0.75A\n")
        await helpers_ot3.update_pick_up_current(api, mount, 0.75)

        # opentrons.opentrons_shared_data.data.pipette.definitions.2.general.ninety_six_channel.p1000.3_4.json
        # path = '/opt/opentrons-robot-server/opentrons_shared_data/data/pipette/definitions/2/general/ninety_six_channel/p1000/3_4.json'
        #
        # with open(path, 'r') as openfile:
        #         pip_data = json.load(openfile)
        #         test_current = pip_data['pickUpTipConfigurations']['current']

        pipette = helpers_ot3._get_pipette_from_mount(api, mount)
        config_model = pipette.pick_up_configurations
        test_current = config_model.current

        print(f"96ch pick up current: {test_current}A\n")

        stall_count, xy_count, y_count, z_l_count, z_r_count, final_encoder_pos, open_loop_pos = await _bowtie_move(api, homed_pos_left, homed_pos_right, load)
        total_stalls += stall_count

        print(f"{final_encoder_pos}\n")
        print(f"{open_loop_pos}\n")
        diff_pos_x = final_encoder_pos[OT3Axis.X]-open_loop_pos[OT3Axis.X]
        diff_pos_y = final_encoder_pos[OT3Axis.Y]-open_loop_pos[OT3Axis.Y]
        diff_pos_z = final_encoder_pos[OT3Axis.Z_L]-open_loop_pos[OT3Axis.Z_L]
        str_open = str(open_loop_pos[OT3Axis.X]) + " " + str(open_loop_pos[OT3Axis.Y]) + " " + str(open_loop_pos[OT3Axis.Z_L])
        str_enc = str(final_encoder_pos[OT3Axis.X]) + " " + str(final_encoder_pos[OT3Axis.Y]) + " " + str(final_encoder_pos[OT3Axis.Z_L])

        if (i == 0 or i == 1 or i == 2):
            cycle_data = [convert(time.perf_counter()-start_time), test_robot, test_config, test_current, i+1,
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
            cycle_data = [convert(time.perf_counter()-start_time), test_robot, test_config, test_current, i+1,
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
    # parser.add_argument("--high_load", action="store_true")
    args = parser.parse_args()
    mount = mount_options[args.mount]

    # if not args.simulate:
    #     input("Gantry-Z-Lifetime: Is the deck totally empty? (press ENTER to continue)")
    asyncio.run(_main(args.simulate, args.cycles, mount))
