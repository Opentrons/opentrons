"""A script for sending and receiving data from sensors on the OT3."""
import enum
import logging
import asyncio
import argparse
from numpy import float64
import termios
import sys, tty

from typing import Callable
from logging.config import dictConfig

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    EnableMotorRequest,
    WriteMotorCurrentRequest,
)
from opentrons.hardware_control.backends.ot3utils import (create_move_group)
from opentrons_hardware.hardware_control.motion_planning import (
    Move,
    Coordinates,
)

from hardware_testing import data
from opentrons_hardware.firmware_bindings.utils import UInt32Field
from opentrons_hardware.firmware_bindings.messages import payloads
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteTipActionType
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.hardware_control.motion import (
    MoveGroupTipActionStep,
    MoveGroupSingleAxisStep,
    MoveStopCondition,
    create_home_step,
    MoveType,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner

from opentrons_hardware.drivers.can_bus.build import build_driver


"""Mitutoyo ABSOLUTE Digimatic Indicator ID-S."""
import time
import numpy
import serial  # type: ignore[import]


class Mitutoyo_Digimatic_Indicator:
    """Driver class to use dial indicator."""

    def __init__(self, port: str = "/dev/ttyUSB0", baudrate: int = 9600) -> None:
        """Initialize class."""
        self.PORT = port
        self.BAUDRATE = baudrate
        self.reading_raw = ""
        self.GCODE = {
            "READ": "r",
        }
        self.gauge = serial.Serial()
        self.packet = ""

    def connect(self) -> None:
        """Connect communication ports."""
        try:
            self.gauge = serial.Serial(
                port=self.PORT,
                baudrate=self.BAUDRATE
            )
        except serial.SerialException:
            error = "Unable to access Serial port"
            raise serial.SerialException(error)

    def disconnect(self) -> None:
        """Disconnect communication ports."""
        self.gauge.close()

    def _send_packet(self, packet: str) -> None:
        self.gauge.flush()
        self.gauge.flushInput()
        self.gauge.write(packet.encode("utf-8"))

    def _get_packet(self) -> str:
        self.gauge.flushOutput()
        packet = self.gauge.readline().decode("utf-8")
        return packet

    def read(self) -> float:
        """Reads dial indicator."""
        self.packet = self.GCODE["READ"]
        self._send_packet(self.packet)
        time.sleep(0.001)
        reading = True
        while reading:
            data = self._get_packet()
            if data != "":
                reading = False
        return float(data)

GetInputFunc = Callable[[str], str]
OutputFunc = Callable[[str], None]


class InvalidInput(Exception):
    """Invalid input exception."""
    pass

def prompt_int_input(prompt_name: str) -> int:
    """Prompt to choose a member of the enum.
    Args:
        output_func: Function to output text to user.
        get_user_input: Function to get user input.
        enum_type: an enum type
    Returns:
        The choice.
    """
    try:
        return int(input(f"{prompt_name}: "))
    except (ValueError, IndexError) as e:
        raise InvalidInput(e)

def output_details(i: int, total_i: int) -> None:
    """Print out test details."""
    print(f"\n\033[95mRound {i}/{total_i}:\033[0m")

def calc_time(distance, speed):
    time = abs(distance/speed)
    # print(time)
    return time

async def set_current(messenger: CanMessenger, current: float, node: NodeId):
    await messenger.send(
        node_id=node,
        message=WriteMotorCurrentRequest(
            payload=payloads.MotorCurrentPayload(
                hold_current=UInt32Field(int(0 * (2**16))),
                run_current=UInt32Field(int(current * (2**16))),
            )
        ),
    )

async def hold_current(messenger: CanMessenger, current: float, node: NodeId):
    await messenger.send(
        node_id=node,
        message=WriteMotorCurrentRequest(
            payload=payloads.MotorCurrentPayload(
                hold_current=UInt32Field(int(current * (2**16))),
                run_current=UInt32Field(int(0 * (2**16))),
            )
        ),
    )

def move_pipette_mechanism(distance, velocity):
    pipette_node = NodeId.pipette_left
    move = MoveGroupRunner(
        move_groups=[
            [
                {
                    pipette_node: MoveGroupTipActionStep(
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(calc_time(distance,
                                                velocity)),
                        stop_condition=MoveStopCondition.none,
                        action=PipetteTipActionType.pick_up,
                    )
                }
            ]
        ]
    )
    return move

def home_pipette_jaw():
    velocity = 5.5
    distance = 40
    pipette_node = NodeId.pipette_left
    move = MoveGroupRunner(
        move_groups=[
            [
                {
                    pipette_node: MoveGroupTipActionStep(
                        velocity_mm_sec=float64(-velocity),
                        duration_sec=float64(calc_time(distance,
                                                velocity)),
                        stop_condition=MoveStopCondition.limit_switch,
                        action=PipetteTipActionType.pick_up,
                    )
                }
            ]
        ]
    )
    return move

def move_z_axis(distance, velocity):
    move_z = MoveGroupRunner(
        move_groups=[
            # Group 1
            [
                {
                    NodeId.head_l: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(calc_time(distance,
                                                        velocity)),
                    )
                }
            ],
        ]
    )
    return move_z

def move_x_axis(distance, velocity):
    move_x = MoveGroupRunner(
        move_groups=[
            # Group 1
            [
                {
                    NodeId.gantry_x: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(calc_time(distance,
                                                        velocity)),
                    )
                }
            ],
        ]
    )
    return move_x

def move_to(orgin, coordinate, velocity):
    acceleration = {OT3Axis.X.name: 500,
                    OT3Axis.Y.name: 500,
                    OT3Axis.Z_L.name: 50}
    move = MoveGroupRunner(
        move_groups=[
            # Group 1
            [
                {
                    NodeId.gantry_x: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        # acceleration_mm_sec_sq=float64(acceleration[OT3Axis.X.name]),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(calc_time(coordinate[OT3Axis.X.name],
                                                        velocity)),
                        move_type = MoveType.linear,
                    )
                },
                {
                    NodeId.gantry_y: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        # acceleration_mm_sec_sq=float64(acceleration[OT3Axis.Y.name]),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(calc_time(coordinate[OT3Axis.Y.name],
                                                        velocity)),
                        move_type = MoveType.linear,
                    )
                },
                {
                    NodeId.head_l: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        # acceleration_mm_sec_sq=float64(acceleration[OT3Axis.Z_L.name]),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(calc_time(coordinate[OT3Axis.Z_L.name],
                                                        velocity)),
                        move_type = MoveType.linear,
                    )
                },
            ],
        ]
    )
    return move

def move_y_axis(distance, velocity):
    move_y = MoveGroupRunner(
        move_groups=[
            # Group 1
            [
                {
                    NodeId.gantry_y: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(calc_time(distance,
                                                        velocity)),
                    )
                }
            ],
        ]
    )
    return move_y

def move_plunger(distance, velocity):
    pipette_node = NodeId.pipette_left
    move_plunger_runner = MoveGroupRunner(
        # Group 0
        move_groups=[
            [
                {
                    pipette_node: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(calc_time(distance,
                                                        velocity)),
                    )
                }
            ]
        ],
    )
    return move_plunger_runner

def home_z_axis():
    speed = 10.5
    home_z = MoveGroupRunner(
        move_groups=[
            [
                {
                    NodeId.head_l: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(-speed),
                        duration_sec=float64(100),
                        stop_condition=MoveStopCondition.limit_switch,
                    )
                }
            ]
        ]
    )
    return home_z

def home_gantry_xy():
    speed = 20
    home_z = MoveGroupRunner(
        move_groups=[
            [
                {
                    NodeId.gantry_x: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(-speed),
                        duration_sec=float64(100),
                        stop_condition=MoveStopCondition.limit_switch,
                    )
                }
            ],
            [
                {
                    NodeId.gantry_y: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(-speed),
                        duration_sec=float64(100),
                        stop_condition=MoveStopCondition.limit_switch,
                    )
                }
            ],
        ]
    )
    return home_z

def home_plunger():
    pipette_node = NodeId.pipette_left
    home_plunger_runner = MoveGroupRunner(
        move_groups=[
            [
                create_home_step(
                    {pipette_node: float64(100.0)},
                    {pipette_node: float64(-5)}
                )
            ]
        ]
    )
    return home_plunger_runner

def getch():
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

async def _jog_axis(messenger: CanMessenger , position) -> None:
    step_size = [0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    x_speed = 30
    y_speed = 30
    z_speed = 10.5
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
        Click  >> ESC << to quit the test script
            """
    print(information_str)
    while True:
        input = getch()
        if input == 'a':
            # minus x direction
            sys.stdout.flush()
            x_pos = position[OT3Axis.X.name] + step
            position.update({OT3Axis.X.name: x_pos})
            x_move = move_x_axis(step, x_speed)
            await x_move.run(can_messenger = messenger)

        elif input == 'd':
            #plus x direction
            sys.stdout.flush()
            x_pos = position[OT3Axis.X.name] - step
            # position[OT3Axis.X.name] = position[OT3Axis.X.name] - x_pos
            position.update({OT3Axis.X.name:  x_pos})
            x_move = move_x_axis(step, -x_speed)
            await x_move.run(can_messenger = messenger)

        elif input == 'w':
            #minus y direction
            sys.stdout.flush()
            y_pos = position[OT3Axis.Y.name] - step
            # position[OT3Axis.Y.name] = position[OT3Axis.Y.name]- y_pos
            position.update({OT3Axis.Y.name:  y_pos})
            y_move = move_y_axis(step, -y_speed)
            await y_move.run(can_messenger = messenger)

        elif input == 's':
            #plus y direction
            sys.stdout.flush()
            y_pos = position[OT3Axis.Y.name] + step
            # position[OT3Axis.Y.name] = position[OT3Axis.Y.name] +  y_pos
            position.update({OT3Axis.Y.name:  y_pos})
            y_move = move_y_axis(step, y_speed)
            await y_move.run(can_messenger = messenger)

        elif input == 'i':
            sys.stdout.flush()
            z_pos = position[OT3Axis.Z_L.name]  - step
            # position[OT3Axis.Z_L.name] = position[OT3Axis.Z_L.name] - z_pos
            position.update({OT3Axis.Z_L.name: z_pos})
            z_move = move_z_axis(step, -z_speed)
            await z_move.run(can_messenger = messenger)

        elif input == 'k':
            sys.stdout.flush()
            z_pos = position[OT3Axis.Z_L.name] + step
            # position[OT3Axis.Z_L.name] = position[OT3Axis.Z_L.name] +  z_pos
            position.update({OT3Axis.Z_L.name: z_pos})
            z_move = move_z_axis(step, z_speed)
            await z_move.run(can_messenger = messenger)

        elif input == '+':
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 6:
                step_length_index = 6
            step = step_size[step_length_index]

        elif input == '-':
            sys.stdout.flush()
            step_length_index = step_length_index -1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == 'q':
            sys.stdout.flush()
            quit()

        elif input == '\r':
            sys.stdout.flush()
            print('\r\n')
            return position
        print("Coordinates: X: {} Y: {} Z: {}".format(
                            round(position[OT3Axis.X.name],2),
                            round(position[OT3Axis.Y.name],2),
                            round(position[OT3Axis.Z_L.name],2)),
                            "      Motor Step: ",
                            step_size[step_length_index],
                            end='')
        print('\r', end='')

class OT3Axis(enum.Enum):
    X = 0  # gantry
    Y = 1
    Z_L = 2  # left pipette mount Z
    Z_R = 3  # right pipette mount Z
    Z_G = 4  # gripper mount Z
    P_L = 5  # left pipette plunger
    P_R = 6  # right pipette plunger
    Q = 7  # hi-throughput pipette tiprack grab
    G = 8  # gripper grab

class position_tracker:
    def __init__(self):
        self.current_position = {OT3Axis.X.name: 0,
                                OT3Axis.Y.name: 0,
                                OT3Axis.Z_L.name: 0}

    def current_position(self):
        return self.current_position

    def update_position(self, new_position):
        self.current_position.update(new_position)


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    today = datetime.date.today()
    file_name = '/var/96_pickup_test_{}.csv'.format(today.strftime("%b-%d-%Y"))
    print("Test tip pick up for the 96 channel\n")
    # reps = prompt_int_input("Number of repetitions for pick up and drop tip")
    # delay = prompt_int_input("Delay in seconds between pick up and drop tip")
    slot_loc = {"A1": (13.42 , 394.92,110), "A2": (177.32 , 394.92,110), "A3": (341.03 , 394.92,110),
                "B1": (13.42, 288.42 , 110), "B2": (177.32 , 288.92 ,110), "B3": (341.03, 288.92,110),
                "C1": (13.42, 181.92, 110), "C2": (177.32, 181.92,110), "C3": (341.03, 181.92,110),
                "D1": (13.42, 75.5, 110), "D2": (177.32, 75.5,110), "D3": (341.03, 75.5,110)}
    default_speed = {OT3Axis.X.name: 200,
                    OT3Axis.Y.name: 200,
                    OT3Axis.Z_L.name: 10}
    delay = 2
    # 96 channel can only be mounted to the left
    pipette_node = NodeId.pipette_left
    driver = await build_driver(build_settings(args))
    messenger = CanMessenger(driver=driver)
    messenger.start()
    # await messenger.send(node_id=NodeId.broadcast, message=EnableMotorRequest())
    z_speed = 20
    gantry_speed = 30
    pick_up_speed = 5
    grap_speed = 5.5
    grap_distance = 19
    drop_speed = 5.5
    drop_distance = 27
    pick_up_distance = 12
    trough_calibrate = True
    press = False
    retract_position = 80
    trials = 10
    # grab_tips = move_pipette_mechanism(grap_distance, grap_speed)
    # drop_tips = move_pipette_mechanism(drop_distance, drop_speed)
    # home_jaw = home_pipette_jaw()
    home_z = home_z_axis()
    home_gantry = home_gantry_xy()
    home_pipette = home_plunger()
    position = {OT3Axis.X.name: slot_loc[args.slot][0],
                OT3Axis.Y.name: slot_loc[args.slot][0],
                OT3Axis.Z_L.name: 0}
    origin = {OT3Axis.X.name: 0, OT3Axis.Y.name: 0, OT3Axis.Z_L.name: 0}
    try:
        for t in range(1, trials+1):
            await home_z.run(can_messenger = messenger)
            await home_gantry.run(can_messenger = messenger)
            if t <= 1:
                await move_to(origin, position, gantry_speed).run(can_messenger = messenger)
                tiprack_loc = await _jog_axis(messenger, position)
                position.update(tiprack_loc)
            else:
                gantry_move = {OT3Axis.X.name: tiprack_loc[OT3Axis.X.name],
                                OT3Axis.Y.name: tiprack_loc[OT3Axis.Y.name],
                                OT3Axis.Z_L.name: 0}
                await move_to(origin, gantry_move, gantry_speed).run(can_messenger = messenger)
                z_move = {OT3Axis.X.name: 0,
                                OT3Axis.Y.name: 0,
                                OT3Axis.Z_L.name: tiprack_loc[OT3Axis.Z_L.name]}
                await move_to(origin, z_move, default_speed[OT3Axis.Z_L.name]).run(can_messenger = messenger)
                position.update(tiprack_loc)
            input_current = float(input("Enter Current: "))
            await set_current(messenger, input_current, NodeId.head_l)
            await hold_current(messenger, 1.4, NodeId.gantry_y)
            await hold_current(messenger, 1.4, NodeId.gantry_x)
            await move_z_axis(pick_up_distance, pick_up_speed).run(can_messenger = messenger)
            position.update({OT3Axis.Z_L.name: position[OT3Axis.Z_L.name] + pick_up_distance})
            # position[OT3Axis.Z_L.name] = position[OT3Axis.Z_L.name] + pick_up_distance
            await asyncio.sleep(delay)
            if press:
                slower_speed = 1
                await set_current(messenger, 1.5, NodeId.head_l)
                await move_z_axis(5, -slower_speed).run(can_messenger = messenger)
                position[OT3Axis.Z_L.name] = position[OT3Axis.Z_L.name] + pick_up_distance
                await asyncio.sleep(delay)
                await set_current(messenger, input_current+0.05, NodeId.head_l)
                await hold_current(messenger, 1.4, NodeId.gantry_y)
                await hold_current(messenger, 1.4, NodeId.gantry_x)
                await move_z_axis(5+2, slower_speed).run(can_messenger = messenger)
                position[OT3Axis.Z_L.name] = position[OT3Axis.Z_L.name] + pick_up_distance
                await asyncio.sleep(delay)
            await set_current(messenger, 1.4, NodeId.head_l)
            await home_z.run(can_messenger = messenger)
            position.update({OT3Axis.Z_L.name: 0})
            if t <= 1:
                measure_loc = await _jog_axis(messenger, position)
                position.update(measure_loc)
                await asyncio.sleep(1)
                if args.dial_indicator:
                    pass
                await asyncio.sleep(1)
                # Take Reading
            else:
                await move_z_axis(measure_loc[OT3Axis.Z_L.name], default_speed[OT3Axis.Z_L.name]).run(can_messenger = messenger)
                await asyncio.sleep(1)
                if args.dial_indicator:
                    read_1 = gauge_1.read()
                    read_2 = gauge_2.read()
                    await asyncio.sleep(0.5)
                # Take Reading
            await home_z.run(can_messenger = messenger)
            input("Press Enter to Move to Tiprack")

    except asyncio.CancelledError:
        pass
    finally:
        print("\nTesting finishes...\n")
        await messenger.stop()
        driver.shutdown()


def main() -> None:
    """Entry point."""
    slot_locs = ["A1", "A2", "A3",
                "B1", "B2", "B3:",
                "C1", "C2", "C3",
                "D1", "D2", "D3"]
    parser = argparse.ArgumentParser(
        description="96 channel tip handling testing script."
    )
    add_can_args(parser)
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--calibrate", action="store_true")
    parser.add_argument("--slot", type=str, choices=slot_locs, default="B2")
    args = parser.parse_args()
    if args.dial_indicator:
        gauge_1 = Mitutoyo_Digimatic_Indicator(port='/dev/ttyUSB0')
        gauge_2 = Mitutoyo_Digimatic_Indicator(port='/dev/ttyUSB1')
        gauge_1.connect()
        gauge_2.connect()
        test_n , test_f  = file_setup(test_data)

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
