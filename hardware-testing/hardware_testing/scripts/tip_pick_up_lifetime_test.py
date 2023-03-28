import argparse
import asyncio
import time

import os
import sys
import termios
import json

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from opentrons.config.types import CapacitivePassSettings
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

from opentrons.hardware_control.types import CriticalPoint

COLUMNS = 12
ROWS = 8

def getch():
    """
    fd: file descriptor stdout, stdin, stderr
    This functions gets a single input keyboard character from the user
    """

    def _getch():
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            ch = sys.stdin.read(1)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        return ch

    return _getch()

async def jog(api, position, cp) -> Dict[OT3Axis, float]:
    step_size = [0.01, 0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    xy_speed = 60
    za_speed = 65
    information_str = """
        Click  >>   i   << to move up
        Click  >>   k   << to move down
        Click  >>   a  << to move left
        Click  >>   d  << to move right
        Click  >>   w  << to move forward
        Click  >>   s  << to move back
        Click  >>   +   << to Increase the length of each step
        Click  >>   -   << to decrease the length of each step
        Click  >> Enter << to save position
        Click  >> q << to quit the test script
                    """
    print(information_str)
    while True:
        input = getch()
        if input == "a":
            # minus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(-step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "d":
            # plus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "w":
            # minus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "s":
            # plus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, -step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "i":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, step_size[step_length_index]), speed=za_speed
            )

        elif input == "k":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, -step_size[step_length_index]), speed=za_speed
            )

        elif input == "q":
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == "+":
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 7:
                step_length_index = 7
            step = step_size[step_length_index]

        elif input == "-":
            sys.stdout.flush()
            step_length_index = step_length_index - 1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == "\r":
            sys.stdout.flush()
            position = await api.current_position_ot3(
                mount, refresh=True, critical_point=cp
            )
            print("\r\n")
            return position
        position = await api.current_position_ot3(
            mount, refresh=True, critical_point=cp
        )

        print(
            "Coordinates: ",
            round(position[OT3Axis.X], 2),
            ",",
            round(position[OT3Axis.Y], 2),
            ",",
            round(position[OT3Axis.by_mount(mount)], 2),
            " Motor Step: ",
            step_size[step_length_index],
            end="",
        )
        print("\r", end="")

def calibrate_tip_racks(api, mount, slot_loc):
    print("Calibrate tip rack positions\n")
    calibrated_slot_loc = {}
    
    for key in slot_loc.keys()
        print(f"TIP RACK IN SLOT {key}\n")
        await api.move_to(mount, Point(slot_loc[key][0], slot_loc[key][1], slot_loc[key][2]))
        # tip_rack_position = await helpers_ot3.jog_mount_ot3(api, mount)
        cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
        tip_rack_position = await jog(api, cur_pos, CriticalPoint.NOZZLE)
        calibrated_slot_loc[key] = (tip_rack_position[OT3Axis.X], tip_rack_position[OT3Axis.Y], tip_rack_position[AXIS])

    json_object = json.dumps(calibrated_slot_loc, indent=11)
    with open("calibrated_slot_locations.json", "w") as outfile:
        outfile.write(json_object)
    return calibrated_slot_loc

async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()

    test_tag = "" #input("Enter test tag:\n\t>> ")
    test_robot = input("Enter robot ID:\n\t>> ")

    if(mount == OT3Mount.LEFT):
        AXIS = OT3Axis.Z_L
    else:
        AXIS = OT3Axis.Z_R

    TIP_RACKS = args.tip_rack_num #11
    PICKUPS_PER_TIP = args.pick_up_num #20

    test_name = "tip-pick-up-lifetime-test"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Test Robot', 'Test Pipette', 'Tip Rack', 'Tip Number', 'Total Tips',
                'Tip Presence - Tip Pick Up (P/F)', 'Tip Presence - Tip Eject (P/F)', 'Total Failures']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    # tip_rack_pos_list = []
    total_failures = 0
    test_pip = await api.get_attached_instrument(mount)
    if(len(test_pip) == 0):
        print(f"No pipette recognized on {mount.name} mount\n")
        sys.exit()
    if(test_pip['name'] == 'p1000_single_gen3'):
        tip_len = 85
    else if(test_pip['name'] == 'p50_single_gen3'):
        tip_len = 57

    slot_loc = {
        "A1": (13.42, 394.92, 110),
        "A2": (177.32, 394.92, 110),
        "B1": (13.42, 288.42, 110),
        "B2": (177.32, 288.92, 110),
        "B3": (341.03, 288.92, 110),
        "C1": (13.42, 181.92, 110),
        "C2": (177.32, 181.92, 110),
        "C3": (341.03, 181.92, 110),
        "D1": (13.42, 75.5, 110),
        "D2": (177.32, 75.5, 110),
        "D3": (341.03, 75.5, 110),
    }
    # "A3": (341.03, 394.92, 110),
    # calibrated_slot_loc = {}

    # optional arg for tip rack calibration
    if(!args.nc):
        # print("Calibrate tip rack positions\n")
        # calibrated_slot_loc = {}
        # for key in slot_loc.keys()
        #     print(f"TIP RACK IN SLOT {key}\n")
        #     await api.move_to(mount, Point(slot_loc[key][0], slot_loc[key][1], slot_loc[key][2]))
        #     # tip_rack_position = await helpers_ot3.jog_mount_ot3(api, mount)
        #     cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
        #     tip_rack_position = await jog(api, cur_pos, CriticalPoint.NOZZLE)
        #     calibrated_slot_loc[key] = (tip_rack_position[OT3Axis.X], tip_rack_position[OT3Axis.Y], tip_rack_position[AXIS])
        #     # tip_rack_pos_list.append(tip_rack_position)
        #
        # json_object = json.dumps(calibrated_slot_loc, indent=11)
        # with open("calibrated_slot_locations.json", "w") as outfile:
        #     outfile.write(json_object)
        calibrated_slot_loc = calibrate_tip_racks(api, mount, slot_loc)
    else:
        ### import calibrated json file
        path = './calibrated_slot_locations.json'
        if(os.path.isFile(path)):
            with open('calibrated_slot_locations.json', 'r') as openfile:
                calibrated_slot_loc = json.load(openfile)
        else:
            print("Slot locations calibration file not found.\n")
            calibrated_slot_loc = calibrate_tip_racks(api, mount, slot_loc)

    for tip_rack_pos in tip_rack_pos_list:
        await api.home([AXIS])
        await api.move_to(mount, Point(tip_rack_pos[OT3Axis.X],
                    tip_rack_pos[OT3Axis.Y], tip_rack_pos[OT3Axis.Z_L]))
        for col in range(COLUMNS):
            for row in range(ROWS):
                print(f"Column: {col+1}, Row: {row+1}\n")
                for pick_up in range(PICKUPS_PER_TIP):
                    print(f"Tip Pick Up #{pick_up+1}\n")
                    await api.pick_up_tip(mount, tip_len)
                    ### check tip presence after tip pick up
                    tip_presence_pick_up = True
                    if(tip_presence_pick_up):
                        print("\t>> Tip detected!\n")
                    else:
                        print("\t>> Tip not detected!\n")
                        total_failures += 1
                    ### move plunger from blowout to top, back to blow_out
                    plunger_pos = await helpers_ot3.get_plunger_positions_ot3(api, mount)

                    top_pos = plunger_pos[0]
                    blow_out_pos = plunger_pos[2]

                    await helpers_ot3.move_plunger_absolute_ot3(api, mount, blow_out_pos)
                    await helpers_ot3.move_plunger_absolute_ot3(api, mount, top_pos)
                    await helpers_ot3.move_plunger_absolute_ot3(api, mount, blow_out_pos)

                    ### check tip presence after tip drop
                    await api.drop_tip(mount)
                    tip_presence_eject = False
                    if(!tip_presence_eject):
                        print("\t>> Tip detected after ejecting tip!\n")
                        print("\t>> Canceling script...\n")
                        total_failures += 1
                        ### save test data before exiting
                        cycle_data = [test_robot, test_pip['name'], rack+1, pick_up+1,
                            total_pick_ups, tip_presence_pick_up, tip_presence_eject, total_failures]
                        cycle_data_str = data.convert_list_to_csv_line(cycle_data)
                        data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)
                        sys.exit()
                    else:
                        print("\t>> Tip not detected!\n")
                        ### save test data and continue loop
                        cycle_data = [test_robot, test_pip['name'], rack+1, pick_up+1,
                            total_pick_ups, tip_presence_pick_up, tip_presence_eject, total_failures]
                        cycle_data_str = data.convert_list_to_csv_line(cycle_data)
                        data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)
                ### adjust row increment
                await api.move_to(mount, Point(tip_rack_pos[OT3Axis.X-9*col],
                            tip_rack_pos[OT3Axis.Y-9*row], tip_rack_pos[OT3Axis.Z_L]))
            ### adjust column increment
            await api.move_to(mount, Point(tip_rack_pos[OT3Axis.X-9*col],
                        tip_rack_pos[OT3Axis.Y], tip_rack_pos[OT3Axis.Z_L]))

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
    parser.add_argument("--pick_up_num", type=int, default=20)
    parser.add_argument("--tip_rack_num", type=int, default=11)
    parser.add_argument("--nc", type=bool, default=False)
    args = parser.parse_args()
    mount = mount_options[args.mount]

    asyncio.run(_main(args.simulate, mount))
