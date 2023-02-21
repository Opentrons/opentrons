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

    # final_position = await helpers_ot3.jog_mount_ot3(api, mount)
    # print(f"Jogged the mount to deck coordinate: {final_position}")

    # corner_1 = {<OT3Axis.X: 0>: 169.711, <OT3Axis.Y: 1>: 186.312, <OT3Axis.Z_L: 2>: 65.00400000000002, <OT3Axis.P_L: 5>: 0.0}
    # corner_2 = {<OT3Axis.X: 0>: 169.711, <OT3Axis.Y: 1>: 116.31299999999999, <OT3Axis.Z_L: 2>: 65.00400000000002, <OT3Axis.P_L: 5>: 0.0}
    # corner_3 = {<OT3Axis.X: 0>: 284.72, <OT3Axis.Y: 1>: 116.31900000000002, <OT3Axis.Z_L: 2>: 65.00400000000002, <OT3Axis.P_L: 5>: 0.0}
    # corner_4 = {<OT3Axis.X: 0>: 285.715, <OT3Axis.Y: 1>: 186.312, <OT3Axis.Z_L: 2>: 65.0, <OT3Axis.P_L: 5>: 0.0}
    corner_1 = [169.711, 186.312, 65.0]
    corner_2 = [169.711, 116.312, 65.0]
    corner_3 = [284.72, 116.312, 65.0]
    corner_4 = [284.72, 186.312, 65.0]
    corner_positions = [corner_1, corner_2, corner_3, corner_4]

    for i in range(10):
        print(f"Cycle: {i+1}")
        for p in range(len(corner_positions)):
            # if i == 0:
            #     await api.home()
            # else:
            #     await api.home([OT3Axis.Z_L])
            # final_position = await helpers_ot3.jog_mount_ot3(api, mount)
            # print(f"Jogged the mount to deck coordinate: {final_position}")
            await api.move_to(MOUNT, Point(corner_positions[p][0], corner_positions[p][1], corner_positions[p][2]))
            z_pos = await api.capacitive_probe(MOUNT, AXIS, corner_positions[p][2], CAP_SETTINGS) #final_position[OT3Axis.Z_L], CAP_SETTINGS)
            print(f"Probe complete! Position: {z_pos}\nContinue...")
            await api.home([OT3Axis.Z_L])
    # await api.home()

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
