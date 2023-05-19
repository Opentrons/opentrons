"""Pick-Up-Tip OT3."""
import argparse
import asyncio

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

TIP_POS = types.Point(x=100, y=100, z=100)


async def _main(is_simulating: bool) -> None:
    mount = types.OT3Mount.LEFT
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, pipette_left="p1000_single_v3.3"
    )
    # home
    await helpers_ot3.home_ot3(api)
    # move to the tip
    await helpers_ot3.move_to_arched_ot3(api, mount, TIP_POS)
    # overwrite the default current/distance
    await helpers_ot3.update_pick_up_current(api, mount, current=0.25)
    await helpers_ot3.update_pick_up_distance(api, mount, distance=0.25)
    # pickup the tip
    await api.pick_up_tip(mount, tip_length=40)
    # drop the tip (in place)
    await api.drop_tip(mount)
    # disengage XY axes when done
    await api.disengage_axes([types.Axis.X, types.Axis.Y])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
