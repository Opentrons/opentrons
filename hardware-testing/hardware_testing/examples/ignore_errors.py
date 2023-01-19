"""Test Ignoreing."""
import argparse
import asyncio

from typing import List

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from opentrons_hardware.firmware_bindings.constants import ErrorCode

_UNWANTED_ERRORS: List[ErrorCode] = [
    ErrorCode.estop_released,
    ErrorCode.collision_detected,
    ErrorCode.labware_dropped,
]


async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, ignored_errors=_UNWANTED_ERRORS
    )
    await api.home()
    final_position = await helpers_ot3.jog_mount_ot3(api, mount)
    print(f"Jogged the mount to deck coordinate: {final_position}")


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
    args = parser.parse_args()
    mount = mount_options[args.mount]
    asyncio.run(_main(args.simulate, mount))
