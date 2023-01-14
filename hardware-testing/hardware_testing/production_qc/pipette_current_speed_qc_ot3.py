"""Pipette Current Speed Test."""
import argparse
import asyncio
from numpy import float64
import subprocess
from typing import Dict, Tuple

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
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

NODE = NodeId.pipette_left
PIPETTE_NAMES = {
    "p1000_single": "P1KS",
    "p1000_multi": "P1KM",
    "p50_single": "P50S",
    "p50_multi": "P50M",
    "P1000_96": "P1KH",
}

DEFAULT_CURRENT_SEQUENCE = [0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1, 0.05]
CUSTOM_CURRENT_SEQUENCE = {
    "p1000_single_v33": None,
    "p50_single_v33": None,
    "p1000_single_v34": None,
    "p50_single_v34": None,
    "p1000_multi_v33": None,
    "p50_multi_v33": None,
}
PIPETTE_TOLERANCES_MM = {
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


def _determine_abbreviation(pipette_name: str) -> str:
    if pipette_name not in PIPETTE_NAMES:
        raise ValueError(f"Unknown Pipette: {pipette_name}")
    return PIPETTE_NAMES[pipette_name]


async def _read_epprom(messenger: CanMessenger) -> Tuple[str, str]:
    await messenger.send(NODE, InstrumentInfoRequest())
    with WaitableCallback(messenger) as wc:
        message, _ = await asyncio.wait_for(wc.read(), 1.0)
        payload = message.payload
        payload_name = payload.name  # type: ignore[attr-defined]
        payload_model = payload.model  # type: ignore[attr-defined]
        payload_serial = payload.serial  # type: ignore[attr-defined]
        pipette_name = PipetteName(payload_name.value).name
        pipette_version = str(payload_model.value)
        pipette_id = str(payload_serial.value.decode("ascii").rstrip("\x00"))
        serial_number = (
            _determine_abbreviation(pipette_name) + pipette_version + pipette_id
        )
        model = "{}_v{}".format(pipette_name, pipette_version)
        return serial_number, model


async def _home(messenger: CanMessenger) -> None:
    home_runner = MoveGroupRunner(
        move_groups=[[create_home_step({NODE: float64(100.0)}, {NODE: float64(-5)})]]
    )
    await home_runner.run(can_messenger=messenger)


async def _set_pipette_current(messenger: CanMessenger, run_current: float) -> None:
    currents: Dict[NodeId, Tuple[float, float]] = dict()
    currents[NodeId.pipette_left] = (float(0), float(run_current))
    try:
        await set_currents(messenger, currents)
    except asyncio.CancelledError:
        pass


class LoseStepError(Exception):
    """Lost Step Error."""

    pass


async def _move_to(
    messenger: CanMessenger,
    pipette_model: str,
    distance: float,
    velocity: float,
    check: bool = False,
) -> Tuple[float, float]:
    move_runner = MoveGroupRunner(
        move_groups=[
            [
                {
                    NODE: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(abs(distance / velocity)),
                    )
                }
            ]
        ],
    )
    axis_dict = await move_runner.run(can_messenger=messenger)
    motor_pos = float(axis_dict[NODE][0])
    encoder_pos = float(axis_dict[NODE][1])
    motor_str = str(round(motor_pos, 2))
    encoder_str = str(round(motor_pos, 2))
    if check and abs(motor_pos - encoder_pos) > PIPETTE_TOLERANCES_MM[pipette_model]:
        raise LoseStepError(
            f"ERROR: lost steps (motor={motor_str}, encoder={encoder_str}"
        )
    return motor_pos, encoder_pos


async def _run(messenger: CanMessenger) -> None:
    if "q" in input("\n\tEnter 'q' to exit"):
        raise KeyboardInterrupt()
    results = []
    print("--------------Test Currents--------------")
    print("--------------Read EPPROM----------------")
    serial_number, pipette_model = await _read_epprom(messenger)
    print(f"SN: {serial_number}")
    print(f"Model: {pipette_model}")
    sequence = CUSTOM_CURRENT_SEQUENCE[pipette_model]
    if not sequence:
        sequence = DEFAULT_CURRENT_SEQUENCE
    for current in sequence:
        print("--------------Test Homing--------------")
        await _home(messenger)
        print("homed")
        await _set_pipette_current(messenger, current)
        print(f"current: {current}A")
        mot, enc = await _move_to(messenger, pipette_model, 10, move_speed)
        print(f"motor position: {mot}, encoder position: {enc}")
        try:
            for c in range(CYCLES):
                print(f"cycle: {c + 1}/{CYCLES}")
                mot, enc = await _move_to(
                    messenger, pipette_model, 60, move_speed, check=True
                )
                print(f"motor position: {mot}, encoder position: {enc}")
                mot, enc = await _move_to(
                    messenger, pipette_model, 60, -move_speed, check=True
                )
                print(f"motor position: {mot}, encoder position: {enc}")
            results.append(
                (
                    current,
                    True,
                )
            )
        except LoseStepError as e:
            print(str(e))
            results.append(
                (
                    current,
                    False,
                )
            )
            break

    print(data_format.format("type", "result", "reason"))
    for res in results:
        print(data_format.format(f"{res[0]}A", res[1]))


async def _main(arguments: argparse.Namespace) -> None:
    subprocess.run(["systemctl", "stop", "opentrons-robot-server"])
    driver = await build_driver(build_settings(arguments))
    messenger = CanMessenger(driver=driver)
    messenger.start()
    while True:
        try:
            await _run(messenger)
        except KeyboardInterrupt:
            break
        except Exception:
            pass


if __name__ == "__main__":
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
    asyncio.run(_main(parser.parse_args()))
