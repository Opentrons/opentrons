import argparse
import asyncio
import time
from typing import List

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

from opentrons.hardware_control.types import CriticalPoint

CURRENT_PERCENTAGE = 0.66

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

    # print(f"96Ch?: {high_load}\n")
    test_robot = input("Enter robot ID:\n\t>> ")
    test_name = "gantry-z-lifetime-test"
    if high_load:
        test_config = '96ch + Gripper Config'
        test_tag = '96ch_Gripper'
    else:
        test_config = '2 Multis + Gripper Config'
        test_tag = 'Multi_Pipettes_Gripper'

    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Time(s)', 'Test Robot', 'Test Configuration', 'Cycle']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    start_time = time.perf_counter()
    homed_pos_left = await api.gantry_position(OT3Mount.LEFT)
    homed_pos_right = await api.gantry_position(OT3Mount.RIGHT)
    for i in range(cycles):
        print(f"========== Cycle {i + 1}/{cycles} ==========\n")
        await _bowtie_move(api, homed_pos_left, homed_pos_right, high_load)
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
    parser.add_argument("--cycles", type=int, default=2)
    parser.add_argument("--high_load", action="store_true")
    args = parser.parse_args()
    mount = mount_options[args.mount]

    if not args.simulate:
        input("Gantry-Z-Lifetime: Is the deck totally empty? (press ENTER to continue)")
    asyncio.run(_main(args.simulate, args.cycles, args.high_load, mount))
