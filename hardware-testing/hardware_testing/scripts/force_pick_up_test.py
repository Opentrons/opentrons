import argparse
import asyncio
import time

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError


def convert(seconds):
    weeks, seconds = divmod(seconds, 7*24*60*60)
    days, seconds = divmod(seconds, 24*60*60)
    hours, seconds = divmod(seconds, 60*60)
    minutes, seconds = divmod(seconds, 60)

    return "%02d:%02d:%02d:%02d:%02d" % (weeks, days, hours, minutes, seconds)


async def _force_pick_up(api, z_pt) -> tuple:

    stall_count = 0
    await api.move_to(OT3Mount.LEFT, Point(178.109, 182.346, z_pt))

    print("Moving mount down to calibration block...\n")
    try:
        await api.move_rel(OT3Mount.LEFT, delta=Point(z=-151))
        await api.move_rel(OT3Mount.LEFT, delta=Point(z=-30))
    except StallOrCollisionDetectedError:
        print("--STALL DETECTED--\n")
        stall_count += 1
        print("------HOMING------\n")
        await api.home_z()

    tip_len = 57
    await api.pick_up_tip(OT3Mount.LEFT, tip_len, prep_after=False)
    await api.remove_tip(OT3Mount.LEFT)

    print("Homing z-axis...\n")
    await api.home_z(OT3Mount.LEFT)

    # record position loss for each cycle
    open_loop_pos = await api.current_position_ot3(OT3Mount.LEFT, refresh=True)
    final_encoder_pos = await api.encoder_current_position_ot3(OT3Mount.LEFT, refresh=True)

    return stall_count, final_encoder_pos, open_loop_pos


async def _main(is_simulating: bool, cycles: int, mount: types.OT3Mount, current: float) -> None:
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

    start_time = time.perf_counter()
    total_stalls = 0
    for i in range(cycles):
        print(f"\n========== Cycle {i + 1}/{cycles} ==========\n")

        print(f"Setting pick up current to {current}A\n")
        await helpers_ot3.update_pick_up_current(api, mount, current)

        pipette = helpers_ot3._get_pipette_from_mount(api, mount)
        config_model = pipette.pick_up_configurations
        test_current = config_model.current
        print(f"96ch pick up current: {test_current}A\n")

        cur_pos = await api.gantry_position(OT3Mount.LEFT)
        await api.move_to(OT3Mount.LEFT, Point(178.109, 182.346, cur_pos[2]))
        stall_count, final_encoder_pos, open_loop_pos = await _force_pick_up(api, z_pt=cur_pos[2])
        total_stalls += stall_count

        print(f"{final_encoder_pos}\n")
        print(f"{open_loop_pos}\n")
        diff_pos_z = final_encoder_pos[OT3Axis.Z_L]-open_loop_pos[OT3Axis.Z_L]
        str_open = str(open_loop_pos[OT3Axis.Z_L])
        str_enc = str(final_encoder_pos[OT3Axis.Z_L])

        if i == 0:
            cycle_data = [convert(time.perf_counter()-start_time), test_robot, test_current, i+1, total_stalls,
                          '', str_open, str_enc, diff_pos_z,
                          '', lm, '', OT3Axis.to_kind(axis),
                          max_speed, accel, hold_curr,
                          run_curr, max_disc, dir_change_disc]
            print(f"CYCLE DATA: {cycle_data}\n")
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
    parser.add_argument("--cycles", type=int, default=5)
    parser.add_argument("--current", type=float, default=0.75)
    args = parser.parse_args()
    mount = mount_options[args.mount]

    asyncio.run(_main(args.simulate, args.cycles, mount, args.current))
