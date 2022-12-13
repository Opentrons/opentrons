"""OT-3 Auto Calibration."""
import asyncio
import argparse

from opentrons.hardware_control.ot3_calibration import (
    calibrate_pipette,
    calibrate_gripper_jaw,
    calibrate_gripper,
)

from hardware_testing.opentrons_api.types import OT3Mount, GripperProbe
from hardware_testing.opentrons_api import helpers_ot3


async def _main(simulate: bool, slot: int, mount: OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate,
        pipette_left="p1000_single_v3.3",
        pipette_right="p1000_single_v3.3",
        gripper="GRPV102",
        use_defaults=True,
    )
    await api.home()
    if mount == OT3Mount.GRIPPER:
        input("Add probe to gripper FRONT, then press ENTER: ")
        front_offset = await calibrate_gripper_jaw(api, GripperProbe.FRONT, slot)
        input("Add probe to gripper REAR, then press ENTER: ")
        rear_offset = await calibrate_gripper_jaw(api, GripperProbe.REAR, slot)
        offset = calibrate_gripper(api, front_offset, rear_offset)
    else:
        input("Attach calibration probe to the pipette and press Enter\n")
        offset = await calibrate_pipette(api, mount, slot)
    print(f"Offset: {offset}")


if __name__ == "__main__":
    print("\nOT-3 Auto-Calibration\n")
    arg_parser = argparse.ArgumentParser(description="OT-3 Auto-Calibration")
    arg_parser.add_argument(
        "--mount", "-m", choices=["left", "right", "gripper"], required=True
    )
    arg_parser.add_argument("--simulate", action="store_true")
    arg_parser.add_argument("--slot", type=int, default=5)
    args = arg_parser.parse_args()
    ot3_mounts = {
        "left": OT3Mount.LEFT,
        "right": OT3Mount.RIGHT,
        "gripper": OT3Mount.GRIPPER,
    }
    _mount = ot3_mounts[args.mount]
    asyncio.run(_main(args.simulate, args.slot, _mount))
