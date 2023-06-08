"""OT3 Bowtie Test."""
import argparse
import asyncio
from typing import List

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3


def _create_bowtie_points(homed_position: types.Point) -> List[types.Point]:
    pos_max = homed_position - types.Point(x=1, y=1, z=1)
    pos_min = types.Point(x=0, y=45, z=pos_max.z - 200)  # stay above deck to be safe
    bowtie_points = [
        pos_max,  # back-right-up
        pos_min._replace(z=pos_max.z),  # front-left-up
        pos_min,  # front-left-down
        pos_min._replace(y=pos_max.y),  # back-left-down
        pos_max._replace(x=pos_min.x),  # back-left-up
        pos_max._replace(y=pos_min.y),  # front-right-up
        pos_min._replace(x=pos_max.x),  # front-right-down
        pos_max._replace(z=pos_min.z),  # back-right-down
    ]
    return bowtie_points


async def _main(is_simulating: bool, cycles: int, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await helpers_ot3.home_ot3(api)
    bowtie_points = _create_bowtie_points(await api.gantry_position(mount))
    for i in range(cycles):
        print(f"Cycle {i + 1}/{cycles}")
        for p in bowtie_points:
            await api.move_to(mount, p)
    await api.move_to(mount, bowtie_points[0])
    await api.disengage_axes([types.OT3Axis.X, types.OT3Axis.Y])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=1)
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    args = parser.parse_args()
    if args.mount == "left":
        mount = types.OT3Mount.LEFT
    else:
        mount = types.OT3Mount.RIGHT
    if not args.simulate:
        input("BOWTIE-OT3: Is the deck totally empty? (press ENTER to continue)")
    asyncio.run(_main(args.simulate, args.cycles, mount))
