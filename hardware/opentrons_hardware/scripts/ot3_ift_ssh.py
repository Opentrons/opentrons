"""A very simple script to run a move group and wait for it to complete."""
import argparse
import asyncio
from numpy import float64
import termios
import sys, tty
import logging
import datetime
from typing import Callable
from logging.config import dictConfig
import subprocess

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus import build, CanMessenger,  WaitableCallback
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteName
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    payloads,
    fields,
)

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    EnableMotorRequest,
    MotorPositionRequest,
    InstrumentInfoRequest,
)

from opentrons_hardware.hardware_control.motion import (
    MoveGroupSingleAxisStep,
    MoveStopCondition,
    create_home_step,
    create_backoff_step,
)

from opentrons_hardware.hardware_control.limit_switches import get_limit_switches
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.hardware_control.current_settings import set_currents
from opentrons_hardware.drivers.gpio import OT3GPIO

GetInputFunc = Callable[[str], str]
OutputFunc = Callable[[str], None]
from typing import Dict, Tuple
PIPETTE_NAMES = {
    "p1000_single": "P1KS",
    "p1000_multi": "P1KM",
    "p50_single": "P50S",
    "p50_multi": "P50M",
    "P1000_96": "P1KH",
}
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

async def move_for_input(messenger: CanMessenger, node, position,xy,args) -> None:
    step_size = [0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    pos = 0
    speed = 10
    res = {node: (0,0,0)}
    current = 0.8
    await set_pipette_current(current, args)
    try:
        if xy == "downward":
            pos = pos + step
            position['pipette'] = pos
            res = await move_to(messenger, node, step, speed)
        elif xy == "up":
            pos = pos - step
            position['pipette'] = pos
            res = await move_to(messenger, node, step, -speed)
        mores = res[node][0]
        encoder =res[node][1]
        diff = float(mores) - float(encoder)
        print("diff",diff)
        try:
            if abs(diff) < 2:
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




async def _jog_axis(messenger: CanMessenger, node, position) -> None:
    step_size = [0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
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
async def set_pipette_current(run_current,args) -> None:

    currents: Dict[NodeId, Tuple[float, float]] = {}
    currents[NodeId.pipette_left] = (float(0), float(run_current))

    async with build.can_messenger(build_settings(args)) as messenger:
        try:
            await set_currents(messenger, currents)
        except asyncio.CancelledError:
            pass
async def home(messenger, node, args):
    home_runner = MoveGroupRunner(
        move_groups=[
            [
                create_backoff_step(
                    {node: float64(5)}
                )
            ]
        ]
    )
    current = 0.8
    try:
        await set_pipette_current(current, args)
        await home_runner.run(can_messenger = messenger)
        print("MOVEHOME=Pass")
    except asyncio.TimeoutError:
        print("MOVEHOME=Failed")

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
    except asyncio.TimeoutError:
        return "None"

async def _read_epprom(messenger: CanMessenger, node: NodeId) -> str:
    """Read from the Pipette EPPROM."""
    await messenger.send(node, InstrumentInfoRequest())
    try:
        with WaitableCallback(messenger) as wc:
            message, arb = await asyncio.wait_for(wc.read(), 1.0)
            pipette_val = PipetteName(message.payload.name.value)  # type: ignore[attr-defined]
            pipette_version = "V" + str(message.payload.model.value)  # type: ignore[attr-defined]
            sn = str(message.payload.serial.value.decode("ascii").rstrip("\x00"))  # type: ignore[attr-defined]
            serial_number = determine_abbreviation(pipette_val) + pipette_version + sn
    except asyncio.TimeoutError:
        pass
    finally:
        print(serial_number)
        return serial_number

def _determine_abbreviation(pipette_name: str) -> str:
    if pipette_name not in PIPETTE_NAMES:
        raise ValueError(f"Unknown Pipette: {pipette_name}")
    return PIPETTE_NAMES[pipette_name]

async def  run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    # build a GPIO handler, which will automatically release estop
    # gpio = OT3GPIO(__name__)
    # gpio.deactivate_estop()
    subprocess.run(["systemctl", "stop", "opentrons-robot-server"])
    position = {'pipette': 0}
    node = NodeId.pipette_left
    driver = await build_driver(build_settings(args))
    messenger = CanMessenger(driver=driver)
    messenger.start()
    if args.home:
        #print('\n')
        #print('-------------------Test Homing--------------------------')
        await home(messenger, node,args)
        #print('Homed')

    if args.jog:
        print('\n')
        print('----------Read Motor Position and Encoder--------------')
        await _jog_axis(messenger, node, position)

    if args.limit_switch:
        print('\n')
        print('-----------------Read Limit Switch--------------')
        res = await get_limit_switches(messenger, [node])
        print(f'Current Limit switch State: {res}')
        input("Block the limit switch and press enter")
        res = await get_limit_switches(messenger, [node])
        print(f'Current Limit switch State: {res}')

    if args.read_epprom:
        serial_number = await _read_epprom(messenger, node)
        print(f'READEPPROM={serial_number}')
    
    if args.downward:
        res = await move_for_input(messenger, node,position,"downward",args)
        #print("move=Pass")
        #return res
    if args.up:
        res = await move_for_input(messenger, node,position,"up",args)
        #print("moveup=Pass")
        #return res

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
    parser.add_argument("--home", action="store_true")
    parser.add_argument("--downward", action="store_true")
    parser.add_argument("--up", action="store_true")

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
