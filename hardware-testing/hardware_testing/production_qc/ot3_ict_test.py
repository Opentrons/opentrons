"""Script for OT3 ICT Fixture."""
import argparse
import asyncio
from numpy import float64
import termios
import sys
import tty
import select
import datetime
import time
from typing import Callable, Dict, Tuple, List
import subprocess
from enum import Enum, unique
from opentrons_hardware.hardware_control.types import NodeDict

from hardware_testing import data  # type: ignore[import]
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    PipetteName,
    SensorId,
    SensorType,
    SensorThresholdMode,
)

from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    payloads,
    fields,
)

from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    InstrumentInfoRequest,
    ReadFromSensorResponse,
)

from opentrons_hardware.hardware_control.motion import (
    MoveGroupSingleAxisStep,
    create_backoff_step,
)

from opentrons_hardware.firmware_bindings.utils.binary_serializable import Int32Field
from opentrons_hardware.sensors.types import (
    SensorDataType,
    sensor_fixed_point_conversion,
)
from opentrons_hardware.hardware_control.limit_switches import get_limit_switches
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

GetInputFunc = Callable[[str], str]
OutputFunc = Callable[[str], None]

ot3_nodes = {
    "gantry_x": NodeId.gantry_x,
    "gantry_y": NodeId.gantry_y,
    "head_l": NodeId.head_l,
    "head_r": NodeId.head_r,
    "pipette_left": NodeId.pipette_left,
    "pipette_right": NodeId.pipette_right,
    "gripper_z": NodeId.gripper_z,
    "gripper_g": NodeId.gripper_g,
}


@unique
class PipetteAbbreviation(int, Enum):
    """Pipette Abbreviation matchs."""

    P1KS = 0x00
    P1KM = 0x01
    P50S = 0x02
    P50M = 0x03
    P1KH = 0x04
    P50H = 0x05
    unknown = 0xFFFF


def getch() -> str:
    """This function gets a keyboard character from the operator.

    fd: file descriptor stdout, stdin, stderr.
    This functions gets a single input keyboard character from the user.
    """

    def _getch() -> str:
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            ch = sys.stdin.read(1)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        return ch

    return _getch()


def file_setup(test_header: str, node: NodeId, test_type: str) -> str:
    """Setup CSV file."""
    D = datetime.datetime.now().strftime("%Y_%m_%d")
    test_tag = "{}-{}".format(test_type, int(time.time()))
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(node.name)
    test_file = data.create_file_name(node.name, test_id, test_tag)
    data.append_data_to_file(node.name, test_file, str(node.name) + "\n")
    data.append_data_to_file(node.name, test_file, D + "\n")
    data.append_data_to_file(node.name, test_file, test_header + "\n")
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return str(test_file)


async def jog_axis(
    messenger: CanMessenger, node: NodeId, position: Dict[NodeId, float], speed: float
) -> Dict[NodeId, float]:
    """This Function allows a operator to jog the axis based on the buttons presented to them on the screen."""
    test_data = "Time(s), Motor(mm), Encoder(mm)"
    test_f = file_setup(test_data, node, "encoder_test")
    step_size = [0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    res = {node: (0, 0, 0)}
    start_time = time.perf_counter()
    information_str = """
        Click  >>   w  << to move up
        Click  >>   s  << to move downward
        Click  >>   +   << to Increase the length of each step
        Click  >>   -   << to decrease the length of each step
        Click  >> Enter << to save position
        Click  >> q << to quit the test script
                    """
    print(information_str)
    print("\n")
    while True:
        input = getch()
        if input == "w":
            # plus move direction
            sys.stdout.flush()
            position[node] += step
            res = await move_to(messenger, node, step, -speed)  # type: ignore[assignment]
            elasped_time = time.perf_counter() - start_time
            d_str = f"{elasped_time},{res[node][0]}, {res[node][1]} \n"
            data.append_data_to_file(node.name, test_f, d_str)

        elif input == "s":
            # minus move direction
            sys.stdout.flush()
            position[node] -= step
            res = await move_to(messenger, node, step, speed)  # type: ignore[assignment]
            elasped_time = time.perf_counter() - start_time
            d_str = f"{elasped_time},{res[node][0]}, {res[node][1]} \n"
            data.append_data_to_file(node.name, test_f, d_str)

        elif input == "q":
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == "+":
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 5:
                step_length_index = 5
            step = step_size[step_length_index]

        elif input == "-":
            sys.stdout.flush()
            step_length_index = step_length_index - 1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == "\r" or input == "\n" or input == "\r\n":
            sys.stdout.flush()
            return position

        print(
            "Coordinates: ",
            round(position[node], 2),
            ",",
            "motor position: ",
            res[node][0],
            ", ",
            "encoder position: ",
            res[node][1],
            ", " " Motor Step: ",
            step_size[step_length_index],
            end="",
        )
        print("\r", end="")


def calc_time(distance: float, speed: float) -> float:
    """Calculates time based on distance and speed."""
    time = abs(distance / speed)
    return time


async def home(
    messenger: CanMessenger, node: NodeId
) -> NodeDict[Tuple[float, float, bool, bool]]:
    """Homes axis passed to this function."""
    home_runner = MoveGroupRunner(
        move_groups=[[create_backoff_step({node: float64(5)})]]
    )
    axis_dict = await home_runner.run(can_messenger=messenger)
    return axis_dict


async def move_to(
    messenger: CanMessenger, node: NodeId, distance: float, velocity: float
) -> NodeDict[Tuple[float, float, bool, bool]]:
    """Move command for an Axis Node, based on distance and velocity."""
    move_runner = MoveGroupRunner(
        move_groups=[
            [
                {
                    node: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(calc_time(distance, velocity)),
                    )
                }
            ]
        ],
    )
    axis_dict = await move_runner.run(can_messenger=messenger)
    return axis_dict


def determine_abbreviation(pipette_val: int) -> str:
    """Returns the name of the pipette based on the number."""
    return PipetteAbbreviation(pipette_val).name


async def read_epprom(messenger: CanMessenger, node: NodeId) -> str:
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
        return serial_number


async def do_run(
    messenger: CanMessenger,
    callback: WaitableCallback,
    target_node: NodeId,
    target_sensor: SensorType,
    sensor_id: SensorId,
    threshold: float,
    node: NodeId,
) -> List[float]:
    """Configure and start the monitoring."""
    threshold_payload = payloads.SetSensorThresholdRequestPayload(
        sensor=fields.SensorTypeField(SensorType.capacitive),
        sensor_id=fields.SensorIdField(sensor_id),
        threshold=Int32Field(int(threshold * sensor_fixed_point_conversion)),
        mode=fields.SensorThresholdModeField(SensorThresholdMode.absolute),
    )
    threshold_message = message_definitions.SetSensorThresholdRequest(
        payload=threshold_payload
    )
    await messenger.send(target_node, threshold_message)
    stim_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(target_sensor.value),
        sensor_id=fields.SensorIdField(sensor_id),
        binding=fields.SensorOutputBindingField(3),
    )
    stim_message = message_definitions.BindSensorOutputRequest(payload=stim_payload)
    reset_payload = payloads.BindSensorOutputRequestPayload(
        sensor=fields.SensorTypeField(target_sensor.value),
        sensor_id=fields.SensorIdField(sensor_id),
        binding=fields.SensorOutputBindingField(0),
    )
    reset_message = message_definitions.BindSensorOutputRequest(payload=reset_payload)
    # print(f"Sending stimulus to {target_node.name} {target_sensor.name}")
    await messenger.send(target_node, stim_message)
    start = datetime.datetime.now()
    sensor_list = []
    async for message, _arbid in callback:
        if isinstance(message, ReadFromSensorResponse):
            ts = (datetime.datetime.now() - start).total_seconds()
            s = SensorType(message.payload.sensor.value).name
            d = SensorDataType.build(
                message.payload.sensor_data, message.payload.sensor
            )
            rd = message.payload.sensor_data
            sensor_list.append(d.to_float())
            print(f"{ts:.3f}: {s} {d.to_float():5.3f}, \traw data: {str(rd)}")
        if sys.stdin in select.select([sys.stdin], [], [], 0)[0]:
            input()
            await messenger.send(target_node, reset_message)
            break
    return sensor_list


async def read_sensor(
    messenger: CanMessenger,
    node: NodeId,
    threshold: float,
    sensor: SensorType,
    sensor_id: SensorId,
) -> List[float]:
    """Returns sensor data."""
    with WaitableCallback(messenger) as reader:
        data = await do_run(messenger, reader, node, sensor, sensor_id, threshold, node)
    return data


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    # build a GPIO handler, which will automatically release estop
    # gpio = OT3GPIO(__name__)
    # gpio.deactivate_estop()
    node = ot3_nodes[args.node]
    subprocess.run(["systemctl", "stop", "opentrons-robot-server"])
    await asyncio.sleep(1)
    position = {node: 0.0}
    driver = await build_driver(build_settings(args))
    messenger = CanMessenger(driver=driver)
    messenger.start()
    if args.home:
        await asyncio.sleep(2)
        print("\n")
        print("-------------------Test Homing--------------------------")
        await home(messenger, node)
        print("Homed")

    if args.jog:

        await asyncio.sleep(2)
        print("\n")
        print("----------Read Motor Position and Encoder--------------")
        await jog_axis(messenger, node, position, args.speed)

    if args.limit_switch:
        await asyncio.sleep(2)
        print("\n")
        print("-----------------Read Limit Switch--------------")
        # eslint-disable-next-line no-use-before-define
        res = await get_limit_switches(messenger, [node])  # type: ignore[arg-type]
        print(f"Current Limit switch State: {res}")
        input("Block the limit switch and press enter")
        # eslint-disable-next-line no-use-before-define
        res = await get_limit_switches(messenger, [node])  # type: ignore[arg-type]
        print(f"Current Limit switch State: {res}")
        print("Press Enter to Continue")

    if args.read_epprom:
        await asyncio.sleep(2)
        print("\n")
        print("-----------------Read EPPROM--------------")
        serial_number = await read_epprom(messenger, node)
        print(f"SN: {serial_number}")
        await asyncio.sleep(2)

    if args.capacitive:
        await asyncio.sleep(2)
        print("\n")
        print("-----------------Read Capacitive--------------")
        capacitive_data = await read_sensor(
            messenger, node, args.threshold, SensorType.capacitive, SensorId.S0
        )
        print(f"Capacitive(uF): {capacitive_data}")
        await asyncio.sleep(2)

    if args.pressure:
        await asyncio.sleep(2)
        print("\n")
        print("-----------------Read pressure--------------")
        pressure_data = await read_sensor(
            messenger, node, args.threshold, SensorType.pressure, SensorId.S0
        )
        print(f"Pressure(Pa): {pressure_data}")
        await asyncio.sleep(2)

    if args.environment:
        await asyncio.sleep(2)
        print("\n")
        print("-----------------Read Environment--------------")
        environment_data = await read_sensor(
            messenger, node, args.threshold, SensorType.environment, SensorId.S0
        )
        print(f"Environment(C ,RH): {environment_data}")
        await asyncio.sleep(2)

    print("\n")


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description="Pipette ICT TEST SCRIPT.")
    add_can_args(parser)
    parser.add_argument(
        "--speed",
        type=float,
        help="The speed with which to move the plunger.",
        default=10.0,
    )
    parser.add_argument(
        "--home_speed",
        type=float,
        help="The home speed with which to move the plunger.",
        default=5.0,
    )
    parser.add_argument(
        "--node", type=str, help="Node id to operate.", default="pipette_left"
    )

    parser.add_argument(
        "-t", "--threshold", type=float, help="Set sensor threshold.", default=50
    )

    parser.add_argument(
        "--limit_switch", help="Test limit switch.", action="store_true"
    )
    parser.add_argument(
        "--jog", help="Test motor action with jog.", action="store_true"
    )
    parser.add_argument(
        "--read_epprom", help="Test epprom memory.", action="store_true"
    )
    parser.add_argument("--home", help="Test homing routine.", action="store_true")
    parser.add_argument(
        "--capacitive", help="Test capacitive sensor.", action="store_true"
    )
    parser.add_argument("--pressure", help="Test pressure sensor.", action="store_true")
    parser.add_argument(
        "--environment", help="Test environment Sensor.", action="store_true"
    )

    args = parser.parse_args()
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
