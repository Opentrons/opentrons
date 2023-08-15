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

from opentrons_hardware.drivers.gpio import OT3GPIO

GetInputFunc = Callable[[str], str]
OutputFunc = Callable[[str], None]

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

async def home(messenger, node):
    home_runner = MoveGroupRunner(
        move_groups=[
            [
                create_backoff_step(
                    {node: float64(5)}
                )
            ]
        ]
    )
    await home_runner.run(can_messenger = messenger)

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
                print(message)
                pipette_name = PipetteName(message.payload.name.value).name
                print(pipette_name)
                pipette_version = str(message.payload.model.value)
                print(pipette_version)
                serial_number = determine_abbreviation(pipette_name) + \
                            pipette_version + \
                            str(message.payload.serial.value.decode('ascii').rstrip('\x00'))
                return serial_number
    except Exception as errval:
        print("errval",errval)
        pass

async def run(args: argparse.Namespace) -> None:
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
        print('\n')
        print('-------------------Test Homing--------------------------')
        await home(messenger, node)
        print('Homed')

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
        print('\n')
        print('-----------------Read EPPROM--------------')
        serial_number = await read_epprom(messenger, node)
        print(f'SN={serial_number}')

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
    dictConfig(LOG_CONFIG)
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

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
