"""Test Jogging the Gripper."""
import argparse
import asyncio

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3


async def _main(is_simulating: bool) -> None:
    mount = types.OT3Mount.GRIPPER
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()
    while True:
        await helpers_ot3.jog_mount_ot3(api, mount)
        while True:
            inp = input("\"g\" to grip, \"u\" to ungrip, \"j\" to jog: ").strip()
            if inp[0] == "g":
                try:
                    force = float(inp[1:])
                    await api.grip(force)
                except Exception as e:
                    print(e)
            elif inp[0] == "u":
                await api.ungrip()
            elif inp[0] == "j":
                break
            else:
                print(f"unexpected input: {inp}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
