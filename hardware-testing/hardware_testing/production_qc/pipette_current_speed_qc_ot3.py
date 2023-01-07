from typing import Dict, Tuple
import argparse
import asyncio
from numpy import float64
import datetime
import subprocess

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus import build, CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteName

from opentrons_hardware.hardware_control.current_settings import set_currents


from opentrons_hardware.hardware_control.motion import (
    MoveGroupSingleAxisStep,
    create_home_step,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    InstrumentInfoRequest,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args, build_settings


Current_dic = {
    "p1000_single_v43": [0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05],
    "p50_single_v43": [0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05],
    "p1000_single_v33": [0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05],
    "p50_single_v33": [0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05],
    "p1000_single_v34": [0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05],
    "p50_single_v34": [0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05],
    "p1000_multi_v33": [0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05],
    "p50_multi_v33": [0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05],
}
Tolerances = {
    "p1000_single_v43": 0.4,
    "p50_single_v43": 0.4,
    "p1000_single_v33": 0.4,
    "p50_single_v33": 0.4,
    "p1000_single_v34": 0.4,
    "p50_single_v34": 0.4,
    "p1000_multi_v33": 0.4,
    "p50_multi_v33": 0.4,
}

data_format = "||{0:^12}|{1:^12}|{2:^12}||"

CYCLES = 10
move_speed = 15
sus_str = "----_----"


async def set_pipette_current(run_current, args) -> None:

    currents: Dict[NodeId, Tuple[float, float]] = {}
    currents[NodeId.pipette_left] = (float(0), float(run_current))

    async with build.can_messenger(build_settings(args)) as messenger:
        try:
            await set_currents(messenger, currents)
        except asyncio.CancelledError:
            pass


async def home(messenger, node):
    home_runner = MoveGroupRunner(
        move_groups=[[create_home_step({node: float64(100.0)}, {node: float64(-5)})]]
    )
    await home_runner.run(can_messenger=messenger)


def calc_time(distance, speed):
    time = abs(distance / speed)
    return time


async def move_to(messenger: CanMessenger, node, distance, velocity):
    move_runner = MoveGroupRunner(
        # Group 0
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


def determine_abbreviation(pipette_name):
    if pipette_name == "p1000_single":
        return "P1KS"
    elif pipette_name == "p1000_multi":
        return "P1KM"
    elif pipette_name == "p50_single":
        return "P50S"
    elif pipette_name == "p50_multi":
        return "P50M"
    elif pipette_name == "P1000_96":
        return "P1KH"
    else:
        raise ValueError("Unknown Pipette")


async def read_epprom(messenger: CanMessenger, node):
    await messenger.send(node, InstrumentInfoRequest())
    try:
        while True:
            with WaitableCallback(messenger) as wc:
                message, arb = await asyncio.wait_for(wc.read(), 1.0)
                pipette_name = PipetteName(message.payload.name.value).name
                pipette_version = str(message.payload.model.value)
                serial_number = (
                    determine_abbreviation(pipette_name)
                    + pipette_version
                    + str(message.payload.serial.value.decode("ascii").rstrip("\x00"))
                )
                return serial_number
    except asyncio.TimeoutError:
        pass


async def get_pipette_model(messenger: CanMessenger, node):
    await messenger.send(node, InstrumentInfoRequest())
    try:
        while True:
            with WaitableCallback(messenger) as wc:
                message, arb = await asyncio.wait_for(wc.read(), 1.0)
                pipette_name = PipetteName(message.payload.name.value).name
                pipette_version = str(message.payload.model.value)
                pipette_model = "{}_v{}".format(pipette_name, pipette_version)
                # serial_number = determine_abbreviation(pipette_name) + \
                #             pipette_version + \
                #             str(message.payload.serial.value.decode('ascii').rstrip('\x00'))
                return pipette_model
    except asyncio.TimeoutError:
        pass


async def res_check(pipette_model, node, res) -> None:
    motor_pos = res[node][0]
    encoder_pos = res[node][1]
    print("motor position: {} , encoder position: {}".format(motor_pos, encoder_pos))
    diff = float(motor_pos) - float(encoder_pos)
    if abs(diff) > Tolerances[pipette_model]:
        raise Exception("Fail_Lose Step")


async def run(args: argparse.Namespace) -> None:
    subprocess.run(["systemctl", "stop", "opentrons-robot-server"])
    node = NodeId.pipette_left
    driver = await build_driver(build_settings(args))
    messenger = CanMessenger(driver=driver)
    messenger.start()

    print("\n")
    print("-------------------Test Currents--------------------------")
    print("-----------------Read EPPROM--------------")
    serial_number = await read_epprom(messenger, node)
    print(f"SN: {serial_number}")

    print("-----------------Get pipette model--------------")
    pipette_model = await get_pipette_model(messenger, node)
    print(f"Model: {pipette_model}")

    print("-------------------Test Homing--------------------------")
    await home(messenger, node)
    print("Homed")
    while True:
        try:
            re = input("\n    Enter 'q' to exit")
            if re == "q":
                break
            results = {}
            # print(Current_dic)
            for i in Current_dic[str(pipette_model)]:
                results["{}A".format(i)] = sus_str
            for current in Current_dic[str(pipette_model)]:
                print("-------------------Test Homing--------------------------")
                await home(messenger, node)
                print("Homed")
                res = {node: (0, 0, 0)}
                await set_pipette_current(current, args)
                print("    Current test current is {}".format(current))
                # print(Current_dic[pipette_model])
                res = await move_to(messenger, node, 10, move_speed)
                print(
                    "motor position: ",
                    res[node][0],
                    ", ",
                    "encoder position: ",
                    res[node][1],
                )
                # await res_check(pipette_model, node, res)
                try:
                    for t in range(1, CYCLES + 1):
                        print("Cycle-{}".format(t))
                        res = await move_to(messenger, node, 60, move_speed)
                        await res_check(pipette_model, node, res)
                        res = await move_to(messenger, node, 60, -move_speed)
                        await res_check(pipette_model, node, res)
                except Exception as e:
                    print(e)
                    results["{}A".format(current)] = "Fail_Stuck"
                    break

                if sus_str is results["{}A".format(current)]:
                    results["{}A".format(current)] = "Pass_ ----"

            try:
                print(data_format.format("Type", "result", "reason"))
                for i in results:
                    result = results[i].split("_")[0]
                    reason = results[i].split("_")[1]
                    print(data_format.format(i, result, reason))
            except IndexError:
                pass
        except Exception:
            pass


def main() -> None:
    parser = argparse.ArgumentParser(description="Pipette Currents Test SCRIPT")
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

    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
