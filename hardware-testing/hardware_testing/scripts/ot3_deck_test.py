import argparse
import asyncio
import time

import os
import sys
import termios, tty
import json

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point

from opentrons.hardware_control.types import CriticalPoint
from hardware_testing.drivers import list_ports_and_select
from hardware_testing.drivers.asair_sensor import AsairSensor
from serial import Serial
import serial

def convert(seconds):
    weeks, seconds = divmod(seconds, 7*24*60*60)
    days, seconds = divmod(seconds, 24*60*60)
    hours, seconds = divmod(seconds, 60*60)
    minutes, seconds = divmod(seconds, 60)

    return "%02d:%02d:%02d:%02d:%02d" % (weeks, days, hours, minutes, seconds)

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

async def jogste(api, position, cp):
    step_size = [0.01, 0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    xy_speed = 60
    za_speed = 65
    information_str = """
        Click  >>   +   << to Increase the length of each step
        Click  >>   -   << to decrease the length of each step
        Click  >> Enter << to save position
        Click  >> q << to quit the test script
        #########################################            
        Set operating parameters 
                    """
    print(information_str)
    while True:
        input = getch()
        
        if input == "q":
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
            return [step_size[step_length_index], xy_speed,position]
             
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

    

async def jog(api, position, cp):
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

async def calibrate_tip_racks(api, mount, slot_loc, AXIS):
    print("Calibrate tip rack positions\n")
    calibrated_slot_loc = {}

    for key in slot_loc.keys():
        print(f"TIP RACK IN SLOT {key}\n")
        await api.move_to(mount, Point(slot_loc[key][0], slot_loc[key][1], 250.0))
        await api.move_to(mount, Point(slot_loc[key][0], slot_loc[key][1], slot_loc[key][2]))
        # tip_rack_position = await helpers_ot3.jog_mount_ot3(api, mount)
        cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
        tip_rack_position = await jog(api, cur_pos, CriticalPoint.NOZZLE)
        calibrated_slot_loc[key] = (tip_rack_position[OT3Axis.X], tip_rack_position[OT3Axis.Y], tip_rack_position[AXIS])
        await api.home([AXIS])

    json_object = json.dumps(calibrated_slot_loc, indent=0)
    # ("/home/root/calibrated_slot_locations.json", "w")
    with open("/data/testing_data/calibrated_slot_locations.json", "w") as outfile:
        outfile.write(json_object)
    return calibrated_slot_loc

def _reading(hardware):
    
    results = None

    time1 = time.time()
    time2 = time.time()
    datalist = []
    while time2 - time1 <= 1.5:
        hardware.flushInput()
        hardware.flushOutput()
        # self.hardware.write(self.command)
        time.sleep(0.05)
        if hardware.inWaiting():# == self.response_length:
            hardware_read = hardware.read(31)
            #print(hardware_read)
            hardware_read = hardware_read.decode("utf-8")
            #print(hardware_read)
            endlen = hardware_read.rfind("\r")
            #print(endlen)
            results = hardware_read[endlen-8:endlen]
            datalist.append(results)
        if len(datalist) >= 2:
            if datalist[-1] == datalist[-2]:
                results = datalist[-1]
                break 
    return results


def _connect_to_fixture(pipp: str=""):
    _port = list_ports_and_select("Dial gauge",pipp)
    hardware = Serial(port=_port,
                                   baudrate=9600,
                                   parity=serial.PARITY_NONE,
                                   stopbits=serial.STOPBITS_TWO,
                                   bytesize=serial.EIGHTBITS)



    hardware.flushInput()
    hardware.flushOutput()
    return hardware
    

async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    #path = '/data/testing_data/calibrated_slot_locations.json'
    slot_loc = {
        "A1": (13.42, 394.92, 200),
        "A2": (177.32, 394.92, 200),
        "A3": (341.03, 394.92, 200),
        "B1": (13.42, 288.42, 200),
        "B2": (177.32, 288.92, 200),
        "B3": (341.03, 288.92, 200),
        "C1": (13.42, 181.92, 200),
        "C2": (177.32, 181.92, 200),
        "C3": (341.03, 181.92, 200),
        "D1": (13.42, 75.5, 200),
        "D2": (177.32, 75.5, 200),
        "D3": (341.03, 75.5, 200),
    }

    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()
    await api.home_plunger(mount)

    test_tag = ""
    test_robot = "MD"
    if args.test_tag:
        test_tag = input("Enter test tag:\n\t>> ")
    if args.test_robot:
        test_robot = input("Enter robot ID:\n\t>> ")

    whereval = "OT3Mount.LEFT"
    if(mount == OT3Mount.LEFT):
        AXIS = OT3Axis.Z_L
        whereval = "OT3Mount.LEFT"


    else:
        AXIS = OT3Axis.Z_R
        whereval = "OT3Mount.LEFT"

    
    
    hardewar = _connect_to_fixture(mount)

    print("slot number:\n\t")
    print(slot_loc.keys(),"\n\t")

    aa =True
    try:
        while aa:
            slot = input("Enter slot number:\n\t>> ")
            if slot in slot_loc.keys():
                aa = False
    except:
        print("Enter slot number err")

    await api.move_to(mount, Point(slot_loc[slot][0], slot_loc[slot][1], slot_loc[slot][2]))

    cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
    tip_rack_position = await jog(api, cur_pos, CriticalPoint.NOZZLE)


    steplist = await jogste(api, cur_pos, CriticalPoint.NOZZLE)

    zijulis = {
        "OT3Mount.LEFT":20,
        "OT3Mount.RIGHT":30
        

    }
    
    test_pip = api.get_attached_instrument(mount)
    test_name = "deck-test"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag,pipid=test_pip["pipette_id"])
    header = ["------------------------------------"]
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    txtval = ["slot:",slot]
    header_str = data.convert_list_to_csv_line(txtval)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    txtval = ["device:",test_robot]
    header_str = data.convert_list_to_csv_line(txtval)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    txtval = ["------------------------------------"]
    header_str = data.convert_list_to_csv_line(txtval)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    datalist = []
    for i in range(3):
        Toollength = zijulis[whereval] - steplist[0]
        move = steplist[0]
        if i%2==0:
            move = steplist[0]
        else:
            move = -steplist[0]

        while Toollength >= 0:
            print("Toollength:::::{}".format(Toollength))
            await api.move_rel(
                        mount, Point(x=move), speed=steplist[1]
                    )
            readval = _reading(hardewar)
            print("testig=:::::{}".format(readval))
            txtval = [time.time(),readval]
            datalist.append(txtval)
            header_str = data.convert_list_to_csv_line(txtval)
            data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)
            Toollength = Toollength - steplist[0]
        else:
            if mount == OT3Mount.LEFT:
                await api.move_rel(
                            mount, Point(z=-5), speed=steplist[1]
                        )
            else:
                await api.move_rel(
                            mount, Point(y=-5), speed=steplist[1]
                        )
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
    # parser.add_argument("--pick_up_num", type=int, default=20)
    # parser.add_argument("--tip_rack_num", type=int, default=12)
    #parser.add_argument("--load_cal", action="store_true")
    parser.add_argument("--test_tag", action="store_true")
    parser.add_argument("--test_robot", action="store_true")
    #parser.add_argument("--restart_flag", action="store_true")
    # parser.add_argument("--start_slot_row_col_totalTips_totalFailure", type=str, default="1:1:1:1:0")
    # parser.add_argument("--check_tip", action="store_true")
    args = parser.parse_args()
    mount = mount_options[args.mount]

    asyncio.run(_main(args.simulate, mount))
