"""Firmware Check."""
from asyncio import run

from hardware_testing.opentrons_api import helpers_ot3


async def _main(simulate: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=simulate)
    while True:
        if not api.is_simulator:
            input("\n\npress ENTER to check firmware:")
        await api.cache_instruments()
        for subsys, state in api.attached_subsystems.items():
            print(f" - v{state.current_fw_version}: {subsys.name}")
        await helpers_ot3.update_firmware(api)
        print("done")
        if api.is_simulator:
            break


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    run(_main(args.simulate))
