"""Test Jogging."""
import argparse
import asyncio

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

MOUNT = types.OT3Mount.RIGHT


async def _main(is_simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()
    final_position = await helpers_ot3.jog_mount_ot3(api, MOUNT)
    print(f"Jogged the mount to deck coordinate: {final_position}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
