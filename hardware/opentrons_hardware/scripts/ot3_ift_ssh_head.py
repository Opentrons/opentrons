"""A very simple script to run a move group and wait for it to complete."""
import argparse
import asyncio
from numpy import float64
import termios
import sys, tty,time
import logging
import datetime
from typing import Callable
from logging.config import dictConfig
import subprocess
import re

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus import build, CanMessenger,  WaitableCallback
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteName,PipetteTipActionType
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    payloads,
    fields,
)
from opentrons_hardware.firmware_bindings.messages.fields import EepromDataField
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    EnableMotorRequest,
    MotorPositionRequest,
    InstrumentInfoRequest,
    DeviceInfoRequest,
    GetMotorUsageRequest,
    ReadLimitSwitchRequest,
    AttachedToolsRequest
)

from opentrons_hardware.hardware_control.motion import (
    MoveGroupSingleAxisStep,
    MoveStopCondition,
    create_home_step,
    create_backoff_step,
    create_tip_action_backoff_step,
    MoveGroupTipActionStep
)

from opentrons_hardware.hardware_control.limit_switches import get_limit_switches
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.hardware_control.current_settings import set_currents
from opentrons_hardware.drivers.gpio import OT3GPIO

GetInputFunc = Callable[[str], str]
OutputFunc = Callable[[str], None]
from typing import Dict, Tuple
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ReadFromEEPromRequest,
    ReadFromEEPromResponse,
    WriteToEEPromRequest,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    EEPromDataPayload,
    EEPromReadPayload,
)
from opentrons_hardware.firmware_bindings.utils import UInt16Field

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

async def move_for_encode(messenger: CanMessenger, node, position,xy,args) -> None:
    step_size = [0.1, 0.5, 1,5,10, 20, 50]
    step_length_index = 4
    step = step_size[step_length_index]
    pos = 0
    speed = 10
    res = {node: (0,0,0)}
    current = args.current
    await set_pipette_current(messenger,current,node)
    try:
        if xy == "downward":
            pos = pos + step
            position['pipette'] = pos
            res = await move_to(messenger, node, step, speed)
            time.sleep(0.5)
            aa = await read_Usag(messenger, node)
            res2 = await move_to(messenger, node, step, speed)
            time.sleep(0.5)
            aa2 = await read_Usag(messenger, node)
        elif xy == "up":
            pos = pos - step
            position['pipette'] = pos
            res = await move_to(messenger, node, step, -speed)
            time.sleep(0.5)
            
            res2 = await move_to(messenger, node, step, -speed)
        mores1 = res[node][0]
        encoder1 =res[node][1]
        mores2 = res2[node][0]
        encoder2 =res2[node][1]
        diff = float(aa2) - float(aa)
        print("diff",diff)
        try:
            if abs(diff) > 0:
                if xy == "downward":
                    print("READUSAG=Pass")
                elif xy == "up":
                    print("READUSAG=Pass")
            else:
                if xy == "downward":
                    print("READUSAG=Failed")
                elif xy == "up":
                    print("READUSAG=Failed")
                
        except:
            if xy == "downward":
                print("READUSAG=Failed")
            elif xy == "up":
                print("READUSAG=Failed")
    except Exception as err:
        if xy == "downward":
            print("READUSAG=Failed")
        elif xy == "up":
            print("READUSAG=Failed")
async def move_for_tip_motor(messenger: CanMessenger, node, position,xy,args) -> None:
    step_size = [0.1, 0.5, 1,5,10, 20, 50]
    step_length_index = 4
    step = step_size[step_length_index]
    pos = 0
    speed = 10
    res = {node: (0,0,0)}
    current = args.current
    #await set_pipette_current(messenger,current,node)
    try:
        await move_tip_motor(messenger, node, step, speed)
        print("MOVETIPMOTOR=Pass")
    except Exception as errval:
        print("errvalmovemotor:",errval)
        print("MOVETIPMOTOR=Fail")
async def move_for_input(messenger: CanMessenger, node, position,xy,args) -> None:
    step_size = [0.1, 0.5, 1,5,10, 20, 50]
    step_length_index = 4
    step = step_size[step_length_index]
    pos = 0
    speed = 10
    res = {node: (0,0,0)}
    current = args.current
    await set_pipette_current(messenger,current,node)
    try:
        if xy == "downward":
            pos = pos + step
            position['pipette'] = pos
            res = await move_to(messenger, node, step, speed)
            time.sleep(0.1)
            res2 = await move_to(messenger, node, step, speed)
        elif xy == "up":
            pos = pos - step
            position['pipette'] = pos
            res = await move_to(messenger, node, step, -speed)
            time.sleep(0.1)
            res2 = await move_to(messenger, node, step, -speed)
        mores1 = res[node][0]
        encoder1 =res[node][1]
        mores2 = res2[node][0]
        encoder2 =res2[node][1]
        diff = float(encoder2) - float(encoder1)
        print("diff",diff)
        try:
            if abs(diff) > 0:
                if xy == "downward":
                    print("MOVEDOWN=Pass")
                elif xy == "up":
                    print("MOVEUP=Pass")
            else:
                if xy == "downward":
                    print("MOVEDOWN=Failed")
                elif xy == "up":
                    print("MOVEUP=Failed")
                
        except:
            if xy == "downward":
                print("MOVEDOWN=Failed")
            elif xy == "up":
                print("MOVEUP=Failed")
    except Exception as err:
        if xy == "downward":
            print("MOVEDOWN=Failed")
        elif xy == "up":
            print("MOVEUP=Failed")




async def _jog_axis(messenger: CanMessenger, node, position,current = 0.1) -> None:
    step_size = [0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 2
    step = step_size[step_length_index]
    pos = 0
    speed = 10
    res = {node: (0,0,0)}
    information_str = """
        Click  >>   w  << to move up
        Click  >>   s  << to move downward
        Click  >>   h  << to move home
        Click  >>   +   << to Increase the length of each step
        Click  >>   -   << to decrease the length of each step
        Click  >> Enter << to save position
        Click  >> q << to quit the test script
                    """
    print(information_str)
    #await set_pipette_current(messenger,current,node)
    while True:
        input = getch()
        if input == 'w':
            #plus pipette direction
            sys.stdout.flush()
            pos = pos + step
            position['pipette'] = pos
            res = await move_to(messenger, node, step, -speed)

        elif input == 's':
            #minus pipette direction
            sys.stdout.flush()
            pos = pos - step
            position['pipette'] = pos
            res = await move_to(messenger, node, step, speed)

        elif input == 'h':
            sys.stdout.flush()
            await home(messenger, node)
            print("home success")
            continue

        elif input == 'q':
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == '+':
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 5:
                step_length_index = 5
            step = step_size[step_length_index]

        elif input == '-':
            sys.stdout.flush()
            step_length_index = step_length_index -1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == '\r' or input == '\n' or input == '\r\n':
            sys.stdout.flush()
            return position
        print('Coordinates: ', round(position['pipette'], 2), ',',
                                'motor position: ', res[node][0], ', ',
                                'encoder position: ', res[node][1], ', '
                                ' Motor Step: ',
                                step_size[step_length_index],
                                end = '')
        print('\r', end='')

def calc_time(distance, speed):
    time = abs(distance/speed)
    return time
async def set_pipette_current(messenger: CanMessenger, run_current: float,node) -> None:
    # print(args.node)
    # if args.node == "head_l":
    #     node = NodeId.head_l
    # elif args.node == "head_r":
    #     node = NodeId.head_r
    # elif args.node == "gantry_x":
    #     node = NodeId.gantry_x
    # elif args.node == "gantry_y":
    #     node = NodeId.gantry_y
    currents: Dict[NodeId, Tuple[float, float]] = {}
    currents[node] = (float(0.1), float(run_current))

    # async with build.can_messenger(build_settings(args)) as messenger:
    try:
        await set_currents(messenger, currents)
    except asyncio.CancelledError:
        print("set_pipette_current err")
async def home(messenger, node,args):
    home_runner = MoveGroupRunner(
        move_groups=[
            [
                create_backoff_step(
                    {node: float64(5)}
                ),
            ],
        ]
    )
    current = args.current#0.8
    try:
        await set_pipette_current(messenger,current,node)
        await home_runner.run(can_messenger = messenger)
        print("MOVEHOME=Pass")
    except:
        print("MOVEHOME=Failed")

async def home_tip_motor(messenger, node, args):
    """Run a Backoff step for the tip motors"""
    home_runner = MoveGroupRunner(
        move_groups=[
            [
                create_tip_action_backoff_step(
                    {node: float64(5)}
                ),
            ],
        ]
    )

    current = args.current
    try:
        #await set_pipette_current(messenger,current,node)
        await home_runner.run(can_messenger = messenger)
        print("MOVETIPMOTORHOME=Pass")
    except Exception as ree:
        print("err:",ree)
        print("MOVETIPMOTORHOME=Failed")


async def move_tip_motor(messenger: CanMessenger, node, distance, velocity):
    move_runner = MoveGroupRunner(
        # Group 0
        move_groups=[
            [
                {
                    node: MoveGroupTipActionStep(
                        duration_sec=float64(calc_time(distance,
                                                        velocity)),
                        velocity_mm_sec=float64(velocity),
                        action=PipetteTipActionType.clamp,
                        acceleration_mm_sec_sq=float64(0)
                    )
                }
            ]
        ],
    )
    axis_dict= await move_runner.run(can_messenger = messenger)
    return axis_dict

async def move_to(messenger: CanMessenger, node, distance, velocity):
    move_runner = MoveGroupRunner(
        # Group 0
        move_groups=[
            [
                {         
                    node: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(calc_time(distance,
                                                        velocity)),
                    )
                }
            ]
        ],
    )
    axis_dict= await move_runner.run(can_messenger = messenger)
    return axis_dict



def determine_abbreviation(pipette_name):
    if pipette_name == 'p1000_single':
        return 'P1KS'
    elif pipette_name == 'p1000_multi':
        return 'P1KM'
    elif pipette_name == 'p50_single':
        return 'P50S'
    elif pipette_name == 'p50_multi':
        return 'P50M'
    elif pipette_name == 'P1000_96':
        return 'P1KH'
    else:
        raise('Unknown Pipette')

async def read_epprom(messenger: CanMessenger, node):
    await messenger.send(node, InstrumentInfoRequest())
    target = datetime.datetime.now()
    try:
        while True:
            with WaitableCallback(messenger) as wc:
                message, arb = await asyncio.wait_for(wc.read(), 1.0)
                pipette_name = PipetteName(message.payload.name.value).name
                pipette_version = str(message.payload.model.value)
                serial_number = determine_abbreviation(pipette_name) + \
                            pipette_version + \
                            str(message.payload.serial.value.decode('ascii').rstrip('\x00'))
                return serial_number
    except Exception as errval:
        print("errval",errval)
        return "None"

async def read_epprom_gripper(messenger: CanMessenger, node):
    await messenger.send(node, InstrumentInfoRequest())
    target = datetime.datetime.now()
    try:
        while True:
            with WaitableCallback(messenger) as wc:
                message, arb = await asyncio.wait_for(wc.read(), 1.0)
                pipette_name = "GRP"
                pipette_version = str(message.payload.model.value)
                serial_number = pipette_name + \
                            pipette_version + \
                            str(message.payload.serial.value.decode('ascii').rstrip('\x00'))
                return serial_number
    except Exception as errval:
        print("errval",errval)
        return "None"
async def write_epprom(
    eeprom_node_id: NodeId,
    can_messenger: CanMessenger,
    address: int,
    data: bytes,
) -> None:
    """It should be able to read and write eeprom values."""
    await can_messenger.send(
        node_id=eeprom_node_id,
        message=WriteToEEPromRequest(
            payload=EEPromDataPayload(
                address=UInt16Field(address),
                data_length=UInt16Field(len(data)),
                data=EepromDataField(data),
            )
        ),
    )
async def read_epprom_head(
    eeprom_node_id: NodeId,
    can_messenger: CanMessenger,
    address: int,
    data: bytes,
) -> None:
    read_message = ReadFromEEPromRequest(
        payload=EEPromReadPayload(
            address=UInt16Field(address), data_length=UInt16Field(len(data))
        )
    )
    await can_messenger.send(node_id=eeprom_node_id, message=read_message)

    try:
        while True:
            with WaitableCallback(can_messenger) as wc:
                message, arb = await asyncio.wait_for(wc.read(), 1.0)
                aaaaa = message.payload.data.value
                print(aaaaa)
                str(message.payload.serial.value.decode('ascii').rstrip('\x00'))
                eppdata = str(message.payload.data.value.decode('ascii').rstrip('\x00'))
                return eppdata
    except Exception as errval:
        print("errval",errval)
        return "None"



    # response, arbitration_id = await asyncio.wait_for(can_messenger_queue.read(), 1)

    # assert isinstance(response, ReadFromEEPromResponse)
    # assert response.payload.data.value[: len(data)] == data
    # assert response.payload.address.value == address
    # assert response.payload.data_length.value == len(data)
async def read_version(messenger: CanMessenger, node):
    await messenger.send(node, DeviceInfoRequest())
    target = datetime.datetime.now()
    try:
        while True:
            with WaitableCallback(messenger) as wc:
                message, arb = await asyncio.wait_for(wc.read(), 1.0)
                return message
    except Exception as errval:
        #print("errval",errval)
        return 0

async def read_Usag(messenger: CanMessenger, node):
    await messenger.send(node, GetMotorUsageRequest())
    target = datetime.datetime.now()
    try:
        while True:
            with WaitableCallback(messenger) as wc:
                message, arb = await asyncio.wait_for(wc.read(), 1.0)
                eppdata = (message.payload.usage_elements)[0].usage_value
                return eppdata
    except Exception as errval:
        #print("errval",errval)
        return "None"

async def read_limitswitch(messenger: CanMessenger, node):
    await messenger.send(node, ReadLimitSwitchRequest())
    target = datetime.datetime.now()
    try:
        while True:
            with WaitableCallback(messenger) as wc:
                message, arb = await asyncio.wait_for(wc.read(), 1.0)
                eppdata = str(message.payload.switch_status.value)
                return eppdata
    except Exception as errval:
        #print("errval",errval)
        return "None"
        
async def read_detect(messenger: CanMessenger, node,motortype):
    await messenger.send(node, AttachedToolsRequest())
    target = datetime.datetime.now()
    try:
        while True:
            with WaitableCallback(messenger) as wc:
                message, arb = await asyncio.wait_for(wc.read(), 1.0)
                print("message",message)
                if motortype == "a":
                    getval = str(message.payload.a_motor.value)
                elif motortype == "z":
                    getval = str(message.payload.z_motor.value)
                elif motortype == "g":
                    getval = str(message.payload.gripper.value)
                print("getval:",getval)
                if str(getval)=="2":
                    pp = "Fail"
                elif str(getval)=="0":
                    pp = "Pass"
                elif str(getval)=="1":
                    pp = "Pass"
                return pp
    except Exception as errval:
        print("errval",errval)
        return "Fail"

async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    # build a GPIO handler, which will automatically release estop
    # gpio = OT3GPIO(__name__)
    # gpio.deactivate_estop()
    subprocess.run(["systemctl", "stop", "opentrons-robot-server"])
    position = {'pipette': 0}
    if args.node == "head_l":
        node = NodeId.head_l
    elif args.node == "head_r":
        node = NodeId.head_r
    elif args.node == "gantry_x":
        node = NodeId.gantry_x
    elif args.node == "gantry_y":
        node = NodeId.gantry_y
    elif args.node == "pipette_left":
        node = NodeId.pipette_left
    elif args.node == "pipette_right":
        node = NodeId.pipette_right 
    elif args.node == "gripper":
        node = NodeId.gripper   
    elif args.node == "gripper_z":
        node = NodeId.gripper_z   
    elif args.node == "gripper_g":
        node = NodeId.gripper_g   
    elif args.node == "head":
        node = NodeId.head

    driver = await build_driver(build_settings(args))
    messenger = CanMessenger(driver=driver)
    messenger.start()
    if args.home:
        #print('\n')
        #print('-------------------Test Homing--------------------------')
        await home(messenger, node,args)
        #print('Homed')
    if args.hometipmotor:
        await home_tip_motor(messenger,node,args)
    if args.movetipmotor:
        await move_for_tip_motor(messenger, node,position,"downward",args)
    if args.jog:
        print('\n')
        print('----------Read Motor Position and Encoder--------------')
        current = args.current
        await _jog_axis(messenger, node, position,current)

    if args.limit_switch:
        print('\n')
        print('-----------------Read Limit Switch--------------')
        res = await get_limit_switches(messenger, [node])
        print(f'Current Limit switch State: {res}')
        input("Block the limit switch and press enter")
        res = await get_limit_switches(messenger, [node])
        print(f'Current Limit switch State: {res}')

    if args.read_epprom:
        serial_number = await read_epprom(messenger, node)
        print(f'READEPPROM={serial_number}')
    
    if args.downward:
        res = await move_for_input(messenger, node,position,"downward",args)

        #print("move=Pass")
        #return res
    if args.up:
        res = await move_for_input(messenger, node,position,"up",args)
        #print("moveup=Pass")
        #return res
    if args.read_version:
        serial_version = await read_version(messenger, node)
        pattern = r'version=UInt32Field\(value=(\d+)\)'
        match = re.search(pattern, str(serial_version))
        value = 0
        if match:
            value = match.group(1)
        print(f'READVERSION={value}')
    if args.read_epprom_gripper:
        serial_number2 = await read_epprom_gripper(messenger, node)
        print(f'READEPPROMGRP={serial_number2}')
    
    if args.write_epprom:
        dataval = args.eppromdata.encode()
        try:
            await write_epprom(node,messenger, 0,dataval)
            print(f'WRITEEPPOM=Pass')
        except Exception as errv:
            print(f'WRITEEPPOM=Fail')
    if args.read_epprom_head:
        dataval = args.eppromdata
        serial_number = await read_epprom_head(node,messenger ,0,dataval)
        print(f'READHEADEPPROM={serial_number}')
    
    if args.read_usag:
        serial_version = await move_for_encode(messenger, node,position,"downward",args)
        
        #print(f'READUSAG={serial_version}')
    if args.read_limitswitch:
        serial_version = await read_limitswitch(messenger, node)
        print(f'READLIMITSWITCH={serial_version}')
    if args.read_detect:
        motortype = args.motortype
        READDETECT = await read_detect(messenger, node,motortype)
        print(f'READDETECT={READDETECT}')
log = logging.getLogger(__name__)

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "file_handler": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "basic",
            "filename": "HT_tip_handling.log",
            "maxBytes": 5000000,
            "level": logging.INFO,
            "backupCount": 3,
        },
    },
    "loggers": {
        "": {
            "handlers": ["file_handler"],
            "level": logging.INFO,
        },
    },
}


def main() -> None:
    """Entry point."""
    #dictConfig(LOG_CONFIG)
    """
        1. Motor movement - check
        2. Limit switch- check
        3. Encoder - check
        4. EEPROM - kinda working
    """
    parser = argparse.ArgumentParser(
        description="Pipette ICT TEST SCRIPT"
    )
    add_can_args(parser)
    parser.add_argument(
        "--plunger_run_current",
        type=float,
        help="Active current of the plunger",
        default=1.0,
    )
    parser.add_argument(
        "--plunger_hold_current",
        type=float,
        help="Active current of the plunger",
        default=0.1,
    )
    parser.add_argument(
        "--speed",
        type=float,
        help="The speed with which to move the plunger",
        default=10.0,
    )

    parser.add_argument("--limit_switch", action="store_true")
    parser.add_argument("--jog", action="store_true")
    parser.add_argument("--read_epprom", action="store_true")
    parser.add_argument("--read_version", action="store_true")
    parser.add_argument("--read_usag", action="store_true")
    parser.add_argument("--read_epprom_gripper", action="store_true")
    parser.add_argument("--read_epprom_head", action="store_true")

    parser.add_argument("--read_limitswitch", action="store_true")
    parser.add_argument("--read_detect", action="store_true")

    parser.add_argument("--home", action="store_true")
    parser.add_argument("--hometipmotor", action="store_true")
    parser.add_argument("--movetipmotor", action="store_true")
    parser.add_argument("--downward", action="store_true")
    parser.add_argument("--up", action="store_true")
    parser.add_argument(
        "--node", type=str, help="Node id to operate.", default="head_l"
    )
    parser.add_argument(
        "--current", type=str, help="set current.", default=0.8
    )
    parser.add_argument("--write_epprom", action="store_true")
    parser.add_argument(
        "--eppromdata", type=str, help="data", default="aa"
    )
    parser.add_argument(
        "--motortype", type=str, help="z,a,g", default="z"
    )
    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
