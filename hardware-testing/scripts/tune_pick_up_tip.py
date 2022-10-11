"""Tune Pick-Up-Tip for OT3."""
import argparse
import asyncio
from typing import Tuple

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    ThreadManagedHardwareAPI,
    build_ot3_hardware_api,
    home_ot3,
)

MOUNT = OT3Mount.LEFT
AXIS = OT3Axis.Z_L if MOUNT == OT3Mount.LEFT else OT3Axis.Z_R


def _read_number_from_input(msg: str) -> float:
    try:
        return float(input(msg))
    except Exception as e:
        print(e)
        return _read_number_from_input(msg)


async def _find_tip_pos(api: ThreadManagedHardwareAPI) -> Point:
    print("We need to first find the tip coordinate:")
    while True:
        x = _read_number_from_input("\tX: ")
        y = _read_number_from_input("\tY: ")
        z = _read_number_from_input("\tZ: ")
        p = Point(x=x, y=y, z=z)
        input(f"ENTER to move to {p}")
        await api.move_to(mount=MOUNT, abs_position=p)
        if "y" in input("Look good? (y/n): ").lower():
            return p


def _input_pick_up_tip_params() -> Tuple[float, float, float]:
    print("Enter some parameters for the pick-up-tip sequence:")
    current = _read_number_from_input("\tCurrent (amps): ")
    speed = _read_number_from_input("\tSpeed (mm/sec): ")
    distance = _read_number_from_input("\tDistance (millimeters): ")
    return current, speed, distance


async def _run_pick_up_tip_sequence(
    api: ThreadManagedHardwareAPI, current: float, speed: float, distance: float
) -> None:
    print("picking up tip...")
    await api.pick_up_tip(
        mount=MOUNT, tip_length=78, amps=current, speed=speed, distance=distance
    )
    input("ENTER to drop-tip: ")
    await api.drop_tip(mount=MOUNT)


async def _main(api: ThreadManagedHardwareAPI) -> None:
    await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    input("ENTER to start homing: ")
    await home_ot3(api)
    tip_pos = await _find_tip_pos(api)
    while True:
        input("ENTER to move to the TIP: ")
        await api.move_to(mount=MOUNT, abs_position=tip_pos)
        current, speed, distance = _input_pick_up_tip_params()
        input(f"ENTER to run (current={current}, speed={speed}, distance={distance}): ")
        await _run_pick_up_tip_sequence(api, current, speed, distance)
        await api.remove_tip(mount=MOUNT)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    hw_api = build_ot3_hardware_api(is_simulating=args.simulate)
    asyncio.run(_main(hw_api))
    hw_api.clean_up()
