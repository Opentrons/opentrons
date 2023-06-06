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

async def jogste(api, position, cp,mount):
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
        Set operating parameters(设置移动的步进) 
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
            end="          ",
        )
        print("\r", end="")

    

async def jog(api, position, cp,mount):
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
            end="          ",
        )
        print("\r", end="")

async def calibrate_tip_racks(api, slot_loc):
    print("Calibrate tip rack positions\n")
    calibrated_slot_loc = {}
    calibrated_step = {}
    ht = 0
    for key in slot_loc.keys():
        print(f"Testing: {key}\n")

        if key == "OT3Mount.LEFT":
            mount = types.OT3Mount.LEFT
            AXIS = OT3Axis.Z_L
        elif key == "OT3Mount.RIGHT":
            mount = types.OT3Mount.RIGHT
            AXIS = OT3Axis.Z_R
            ht = 87

        print(mount)
        await api.move_to(mount, Point(x=slot_loc[key][0], y=slot_loc[key][1] + ht, z=508.15))
        await api.move_to(mount, Point(x=slot_loc[key][0], y=slot_loc[key][1] + ht, z=slot_loc[key][2]))
        cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
        tip_rack_position = await jog(api, cur_pos, CriticalPoint.NOZZLE,mount)
        cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
        steplist = await jogste(api, cur_pos, CriticalPoint.NOZZLE,mount)
        calibrated_step[key] = steplist

        calibrated_slot_loc[key] = (tip_rack_position[OT3Axis.X], tip_rack_position[OT3Axis.Y], tip_rack_position[AXIS])
        await api.home([AXIS])

    json_object = json.dumps(calibrated_slot_loc, indent=0)
    # ("/home/root/calibrated_slot_locations.json", "w")
    with open("/data/testing_data/calibrated_slot_locations.json", "w") as outfile:
        outfile.write(json_object)
    return calibrated_slot_loc,calibrated_step

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
            results = hardware_read[endlen-9:endlen]
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
    

async def _main(is_simulating: bool) -> None:
    #path = '/data/testing_data/calibrated_slot_locations.json'
    mount_options = {
        "left": types.OT3Mount.LEFT,
        "right": types.OT3Mount.RIGHT,
        "gripper": types.OT3Mount.GRIPPER,
    }
    # while True:
    #     print("1、 Z to XY \n 2、Y to XZ")
    #     mountval = input("Select the surface to be test: ")
    #     if mountval == 1:
    #         mount = mount_options["left"]
    #         break
    #     elif mountval == 2:
    #         mount = mount_options["right"]
    #         break
    #     print("input err")

    slot_loc = {
        "B1": (13.42, 288.42, 400.15),
        "B2": (177.32, 288.92, 400.15),
        "B3": (341.03, 288.92, 400.15),
        "C1": (13.42, 181.92, 400.15),
        "C2": (217.32, 91.92, 400.15),
        "C3": (341.03, 181.92, 400.15),
    }

    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()
    #await api.home_plunger(mount)

    # test_tag = "MD"
    # test_robot = "OT3"
    
    test_tag = input("Enter test tag(请输入测试的设备名称):\n\t>> ")
    
    test_robot = input("Enter robot ID(请输入OT3设备名称):\n\t>> ")

    # whereval = "OT3Mount.LEFT"
    # if(mount == OT3Mount.LEFT):
    #     AXIS = OT3Axis.Z_L
    #     whereval = "OT3Mount.LEFT"

    # else:
    #     AXIS = OT3Axis.Z_R
    #     whereval = "OT3Mount.LEFT"

    
    
    hardewar_l = _connect_to_fixture("OT3Mount.LEFT")
    hardewar_R = _connect_to_fixture("OT3Mount.RIGHT")

    print("slot number:\n\t")
    print(slot_loc.keys(),"\n\t")

    aa =True
    try:
        while aa:
            slot = input("Enter slot number(请输入要移到的slot位置编号):\n\t>> ")
            if slot in slot_loc.keys():
                aa = False
    except:
        print("Enter slot number err")
    # mount = mount_options["left"]
    # await api.move_to(mount, Point(x=slot_loc[slot][0], y=slot_loc[slot][1], z=slot_loc[slot][2]))
    # input("312312312312")
    #await api.move_to(mount, Point(slot_loc[slot][0], slot_loc[slot][1], slot_loc[slot][2]))

    l_r_loc = {
        "OT3Mount.LEFT":slot_loc[slot],
        "OT3Mount.RIGHT":slot_loc[slot]

    }
    print(l_r_loc)
    calibrated_slot_loc,calibrated_step = await calibrate_tip_racks(api, l_r_loc)
    
    #test_pip = api.get_attached_instrument(mount)
    test_name = "deck-test"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag,pipid=test_robot)
    header = ["------------------------------------"]
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    txtval = ["slot:",slot]
    header_str = data.convert_list_to_csv_line(txtval)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    txtval = ["robot number:",test_robot]
    header_str = data.convert_list_to_csv_line(txtval)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    txtval = ["test device:",test_tag]
    header_str = data.convert_list_to_csv_line(txtval)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    txtval = ["------------------------------------"]
    header_str = data.convert_list_to_csv_line(txtval)

    balance_block_xy = [117,87]
    balance_block_xz = [117,15]

    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    zijulis = {
        "OT3Mount.LEFT":balance_block_xz[0],
        "OT3Mount.RIGHT":balance_block_xz[0]
        

    }
    mount_options = {
            "OT3Mount.LEFT": types.OT3Mount.LEFT,
            "OT3Mount.RIGHT": types.OT3Mount.RIGHT,
            "OT3Mount.GRIP": types.OT3Mount.GRIPPER,
        }

    deck_dic={"OT3Mount.RIGHT":"Z to XY",
            "OT3Mount.LEFT":"Y to XZ"}
    datalist = []

    try:
        cycle = 3
        for keyv in l_r_loc.keys(): 
            print("keyv",keyv)
            if str(keyv) == "OT3Mount.LEFT":
                mount = types.OT3Mount.LEFT
                AXIS = OT3Axis.Z_L

                await api.move_to(mount, Point(x=calibrated_slot_loc[keyv][0],
                                y=calibrated_slot_loc[keyv][1]-4, z=508.15))

                await api.move_to(mount, Point(x=calibrated_slot_loc[keyv][0],
                                y=calibrated_slot_loc[keyv][1]-4, z=calibrated_slot_loc[keyv][2]))
                await api.move_rel(
                                mount, Point(y=4)
                            )
                distance_xz = round(balance_block_xz[1] / cycle,1)

                hardewar = hardewar_l
                steplist = calibrated_step[keyv]
            elif str(keyv) == "OT3Mount.RIGHT":
                mount = types.OT3Mount.RIGHT
                AXIS = OT3Axis.Z_R
                
                await api.move_to(mount, Point(calibrated_slot_loc[keyv][0],
                                calibrated_slot_loc[keyv][1], 508.15))
                                
                await api.move_to(mount, Point(calibrated_slot_loc[keyv][0],
                                calibrated_slot_loc[keyv][1], calibrated_slot_loc[keyv][2]+5))
                await api.move_rel(
                                mount, Point(z=-5)
                            )
                distance_xy = round(balance_block_xy[1] / cycle,1)
                hardewar = hardewar_R
                steplist = calibrated_step[keyv]
            
            txtval = ["OT3 robot deck",deck_dic[keyv]]
            datalist.append(txtval)
            #header_str = data.convert_list_to_csv_line(txtval)
            #data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

            input("Please set the micrometer to zero,Press enter to start the test(请把千分尺置零)")

            for i in range(cycle):
                Toollength = zijulis[keyv] - steplist[0]
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
                    cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
                    posi = "{0}-{1}-{2}".format(round(cur_pos[OT3Axis.X], 2),round(cur_pos[OT3Axis.Y], 2),round(cur_pos[OT3Axis.by_mount(mount)], 2))
                    print("testig=:::::{}".format(readval))
                    txtval = [posi,readval]
                    datalist.append(txtval)

                    
                    Toollength = Toollength - steplist[0]
                else:
                    if i >= 2:
                        break
                    if mount == OT3Mount.LEFT:
                        await api.move_rel(
                                    mount, Point(z=-distance_xz), speed=steplist[1]
                                )
                    else:
                        await api.move_rel(
                                    mount, Point(y=-distance_xy), speed=steplist[1]
                                )
            await api.home([AXIS])
    except Exception as err:
        print("test err {}".format(err))
    
    for ii in datalist:
        savedata = data.convert_list_to_csv_line(ii)
        data.append_data_to_file(test_name=test_name, file_name=file_name, data=savedata)
    await api.home()

if __name__ == "__main__":
    mount_options = {
        "left": types.OT3Mount.LEFT,
        "right": types.OT3Mount.RIGHT,
        "gripper": types.OT3Mount.GRIPPER,
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    # parser.add_argument(
    #     "--mount", type=str, choices=list(mount_options.keys()), default="left"
    # )
    # parser.add_argument("--pick_up_num", type=int, default=20)
    # parser.add_argument("--tip_rack_num", type=int, default=12)
    #parser.add_argument("--load_cal", action="store_true")
    # parser.add_argument("--test_tag", action="store_true")
    # parser.add_argument("--test_robot", action="store_true")
    #parser.add_argument("--restart_flag", action="store_true")
    # parser.add_argument("--start_slot_row_col_totalTips_totalFailure", type=str, default="1:1:1:1:0")
    # parser.add_argument("--check_tip", action="store_true")
    args = parser.parse_args()
    #mount = mount_options[args.mount]

    asyncio.run(_main(args.simulate))
