"""Test Jogging."""
import argparse
import asyncio

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

from opentrons.config.types import CapacitivePassSettings
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

CAP_SETTINGS = CapacitivePassSettings(prep_distance_mm=0,
max_overrun_distance_mm=10,
speed_mm_per_s=1,
sensor_threshold_pf=1.0)

MOUNT = OT3Mount.LEFT
AXIS = OT3Axis.Z_L

async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()
    final_position = await helpers_ot3.jog_mount_ot3(api, mount)
    print(f"Jogged the mount to deck coordinate: {final_position}")
    await api.capacitive_probe(MOUNT, AXIS, final_position, CAP_SETTINGS)



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
