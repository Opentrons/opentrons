import argparse
import asyncio
import time

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point, Axis

from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError


def convert(seconds):
    weeks, seconds = divmod(seconds, 7*24*60*60)
    days, seconds = divmod(seconds, 24*60*60)
    hours, seconds = divmod(seconds, 60*60)
    minutes, seconds = divmod(seconds, 60)

    return "%02d:%02d:%02d:%02d:%02d" % (weeks, days, hours, minutes, seconds)


async def _force_pick_up(api, x_pt, y_pt, z_pt, block_pos) -> tuple:

    stall_count = 0
    await api.move_to(OT3Mount.LEFT, Point(x_pt, y_pt, z_pt))

    print("Moving mount down to calibration block...\n")
    # z_move is hardcoded to move to the block height of 47mm
    z_move = 168
    # if block height is incorrect, use the --calibrate_height arg
    # calculate the z distance to move the pipette to the calibrated block
    # formula:
    # --> measure block height and add 5
    # --> 250.0 - 30.0 - (block height + 5) = z_move distance
    # --> ex: block height = 64mm
    # --> 250.0 - 30.0 - (64 + 5) = 151
    if block_pos:
        z_move = z_pt - 30 - block_pos
    print(f"\t>> z_move: {z_move}\n")
    try:
        await api.move_rel(OT3Mount.LEFT, delta=Point(z=-z_move))  # -151 for 64mm block
        await api.move_rel(OT3Mount.LEFT, delta=Point(z=-30))
    except StallOrCollisionDetectedError:
        print("--STALL DETECTED--\n")
        stall_count += 1
        print("------HOMING------\n")
        await api.home_z(OT3Mount.LEFT)

    if stall_count == 0:
        tip_len = 57
        await api.pick_up_tip(OT3Mount.LEFT, tip_len, prep_after=False)
        await api.remove_tip(OT3Mount.LEFT)

    print("Homing z-axis...\n")
    await api.home_z(OT3Mount.LEFT)

    # record position loss for each cycle
    open_loop_pos = await api.current_position_ot3(OT3Mount.LEFT, refresh=True)
    final_encoder_pos = await api.encoder_current_position_ot3(OT3Mount.LEFT, refresh=True)

    return stall_count, final_encoder_pos, open_loop_pos


async def _main(is_simulating: bool, cycles: int, mount: types.OT3Mount, current: float, calibrate: bool, slot: str,
                speed: float) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating, stall_detection_enable=True)
    await api.cache_instruments()
    await api.home()
    load = api.gantry_load
    axis = OT3Axis.Z_L

    max_speed = helpers_ot3.get_gantry_per_axis_setting_ot3(
                                            api.config.motion_settings.default_max_speed, axis, load)
    accel = helpers_ot3.get_gantry_per_axis_setting_ot3(
                                            api.config.motion_settings.acceleration, axis, load)
    hold_curr = helpers_ot3.get_gantry_per_axis_setting_ot3(
                                            api.config.current_settings.hold_current, axis, load)
    run_curr = helpers_ot3.get_gantry_per_axis_setting_ot3(
                                            api.config.current_settings.run_current, axis, load)
    max_disc = helpers_ot3.get_gantry_per_axis_setting_ot3(
                                            api.config.motion_settings.max_speed_discontinuity, axis, load)
    dir_change_disc = helpers_ot3.get_gantry_per_axis_setting_ot3(
                                            api.config.motion_settings.direction_change_speed_discontinuity, axis, load)

    test_robot = 'Force Pick Up Test'
    test_name = "force-pick-up-lifetime-test"
    test_tag = str(current)

    lm = api.get_attached_instrument(OT3Mount.LEFT).get('name')
    print(f"Left mount: {lm}\n")

    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Time (H:M:S)', 'Test Robot', 'Pick Up Current (A)', 'Cycle', 'Z Stall',
              '', 'Open-Loop Position', 'Encoder Position', 'Difference Z (mm)',
              '', 'Left Mount', '', 'Axis',
              'Max Speed (mm/s)', 'Acceleration (mm^2/s)', 'Hold Current (A)',
              'Run Current (A)', 'Max Speed Discontinuity', 'Direction Change Speed Discontinuity']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    slot_loc = {
        "A1": (13.42, 394.92, 160),
        "A2": (177.32, 394.92, 160),
        "A3": (341.03, 394.92, 160),
        "B1": (13.42, 288.42, 160),
        "B2": (177.32, 288.92, 160),
        "B3": (341.03, 288.92, 160),
        "C1": (13.42, 181.92, 160),
        "C2": (177.32, 181.92, 160),
        "C3": (341.03, 181.92, 160),
        "D1": (13.42, 75.5, 160),
        "D2": (177.32, 75.5, 160),
        "D3": (341.03, 75.5, 160),
    }

    block_pos = False
    xy_pos = [180.0, 181.00]
    if calibrate:
        print(f"Move to slot {slot}")
        await api.move_to(mount, Point(slot_loc[slot][0], slot_loc[slot][1], 250.0))
        await api.move_to(mount, Point(slot_loc[slot][0], slot_loc[slot][1], slot_loc[slot][2]))
        print("Move pipette to center of calibration block. Have nozzles touch surface of the block.")
        calibration_block_position = await helpers_ot3.jog_mount_ot3(api, mount)
        xy_pos[0] = calibration_block_position[OT3Axis.X]
        xy_pos[1] = calibration_block_position[OT3Axis.Y]
        block_pos = calibration_block_position[OT3Axis.Z_L] + 4.0
        print("\ncalibration block position:")
        for key in calibration_block_position:
            print(f"\t{key}: {calibration_block_position[key]}")
        await api.home()

    # get pipette config
    pipette = helpers_ot3._get_pipette_from_mount(api, mount)
    config_model = pipette.pick_up_configurations
    # print current speed and current values
    print(f"Current settings:\n\t>> current: {config_model.current}A\n\t>> speed: {config_model.speed}mm/s\n")
    # set current and speed values
    print(f"Setting pick up current to {current}A\n")
    await helpers_ot3.update_pick_up_current(api, mount, current)
    print(f"Setting pick up speed to {speed}mm/s\n")
    await helpers_ot3.update_pick_up_tip_speed(api, mount, speed)  # config_model.speed = speed
    # print out updated current and speed values
    test_current = config_model.current
    test_speed = config_model.speed
    print(f"96ch pick up current: {test_current}A\n")
    print(f"96ch pick up speed: {test_speed}mm/s\n")

    start_time = time.perf_counter()
    total_stalls = 0
    for i in range(cycles):
        print(f"\n========== Cycle {i + 1}/{cycles} ==========\n")

        cur_pos = await api.gantry_position(OT3Mount.LEFT)
        await api.move_to(OT3Mount.LEFT, Point(xy_pos[0], xy_pos[1], cur_pos[2]))
        stall_count, final_encoder_pos, open_loop_pos = await _force_pick_up(api, x_pt=xy_pos[0], y_pt=xy_pos[1],
                                                                             z_pt=cur_pos[2], block_pos=block_pos)
        total_stalls += stall_count

        print(f"Encoder position:")
        for key in final_encoder_pos:
            print(f"\t{key}: {final_encoder_pos[key]}")
        print(f"\nOpen-loop position:")
        for key in open_loop_pos:
            print(f"\t{key}: {open_loop_pos[key]}")
        diff_pos_z = final_encoder_pos[OT3Axis.Z_L]-open_loop_pos[OT3Axis.Z_L]
        str_open = str(open_loop_pos[OT3Axis.Z_L])
        str_enc = str(final_encoder_pos[OT3Axis.Z_L])

        if i == 0:
            cycle_data = [convert(time.perf_counter()-start_time), test_robot, test_current, i+1, total_stalls,
                          '', str_open, str_enc, diff_pos_z,
                          '', lm, '', OT3Axis.to_kind(axis),
                          max_speed, accel, hold_curr,
                          run_curr, max_disc, dir_change_disc]
            print(f"\nCYCLE DATA: {cycle_data}\n")
            lm = ''
        else:
            cycle_data = [convert(time.perf_counter()-start_time), test_robot, test_current, i+1, total_stalls,
                          '', str_open, str_enc, diff_pos_z]
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
    parser.add_argument("--cycles", type=int, default=10000)
    parser.add_argument("--current", type=float, default=0.75)
    parser.add_argument("--calibrate_height", action="store_true")
    parser.add_argument("--slot", type=str, default="C2")
    parser.add_argument("--speed", type=float, default=10.0)
    args = parser.parse_args()
    mount = mount_options[args.mount]

    asyncio.run(_main(args.simulate, args.cycles, mount, args.current, args.calibrate_height, args.slot, args.speed))
