"""Demo OT3 Gantry Functionality."""
# Author: Carlos Ferandez <carlos@opentrons.com
import argparse
import asyncio
import time
from opentrons_shared_data import errors

from hardware_testing.opentrons_api.types import (
    OT3Mount,
    Axis,
    Point,
)
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
)


async def _main(
    mount: OT3Mount, simulate: bool, time_min: int, z_axis: Axis, distance: int
) -> None:
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=simulate, use_defaults=True
    )
    await asyncio.sleep(1)
    await hw_api.cache_instruments()
    timeout_start = time.time()
    timeout = time_min * 60
    count = 0
    x_offset = 80
    y_offset = 44
    try:
        await hw_api.home()
        await asyncio.sleep(1)
        await hw_api.set_lights(rails=True)
        home_position = await hw_api.current_position_ot3(mount)
        try:
            await hw_api.grip(force_newtons=None, stay_engaged=True)
        except errors.exceptions.GripperNotPresentError:
            print("Gripper not attached.")
        print(f"home: {home_position}")
        x_home = home_position[Axis.X] - x_offset
        y_home = home_position[Axis.Y] - y_offset
        z_home = home_position[z_axis]
        while time.time() < timeout_start + timeout:
            # while True:
            print(f"time: {time.time()-timeout_start}")
            await hw_api.move_to(mount, Point(x_home, y_home, z_home))
            await hw_api.move_to(mount, Point(x_home, y_home, z_home - int(distance)))
            count += 1
            print(f"cycle: {count}")
        await hw_api.home()
    except KeyboardInterrupt:
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z, Axis.G])
    finally:
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z, Axis.G])
        await hw_api.clean_up()


def main() -> None:
    """Run gripper and zmount move commands using arguments."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--time_min", type=int, default=60)
    parser.add_argument(
        "--mount", type=str, choices=["left", "right", "gripper"], default="left"
    )
    args = parser.parse_args()
    print(args.mount)
    if args.mount == "left":
        mount = OT3Mount.LEFT
        z_axis = Axis.Z_L
        distance = 115
    elif args.mount == "gripper":
        mount = OT3Mount.GRIPPER
        z_axis = Axis.Z_G
        distance = 190
    else:
        mount = OT3Mount.RIGHT
        z_axis = Axis.Z_R
        distance = 115
    print(f"Mount Testing: {mount}")
    asyncio.run(_main(mount, args.simulate, args.time_min, z_axis, distance))


if __name__ == "__main__":
    main()
