"""Demo OT3 Gantry Functionality."""
# Author: Carlos Ferandez <carlos@opentrons.com
import argparse
import asyncio
import time

from hardware_testing.opentrons_api.types import (
    OT3Mount,
    Axis,
    Point,
)
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
)


async def _main() -> None:
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    await asyncio.sleep(1)
    await hw_api.cache_instruments()
    timeout_start = time.time()
    timeout = 60 * 60 * 3
    count = 0
    x_offset = 80
    y_offset = 44
    try:
        await hw_api.home()
        await asyncio.sleep(1)
        await hw_api.set_lights(rails=True)
        home_position = await hw_api.current_position_ot3(mount)
        await hw_api.grip(force_newtons=None, stay_engaged=True)
        print(f"home: {home_position}")
        x_home = home_position[Axis.X] - x_offset
        y_home = home_position[Axis.Y] - y_offset
        z_home = home_position[Axis.Z_G]
        while time.time() < timeout_start + timeout:
            # while True:
            print(f"time: {time.time()-timeout_start}")
            await hw_api.move_to(mount, Point(x_home, y_home, z_home))
            await hw_api.move_to(mount, Point(x_home, y_home, z_home - 190))
            count += 1
            print(f"cycle: {count}")
        await hw_api.home()
    except KeyboardInterrupt:
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.G])
    finally:
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.G])
        await hw_api.clean_up()


if __name__ == "__main__":
    slot_locs = [
        "A1",
        "A2",
        "A3",
        "B1",
        "B2",
        "B3:",
        "C1",
        "C2",
        "C3",
        "D1",
        "D2",
        "D3",
    ]
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--trough", action="store_true")
    parser.add_argument("--tiprack", action="store_true")
    parser.add_argument(
        "--mount", type=str, choices=["left", "right", "gripper"], default="gripper"
    )
    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
    if args.mount == "gripper":
        mount = OT3Mount.GRIPPER
    else:
        mount = OT3Mount.RIGHT
    asyncio.run(_main())
