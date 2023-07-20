"""Firmware Check."""
from asyncio import run

from hardware_testing.opentrons_api import helpers_ot3


async def _main() -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=False)
    while True:
        input("\n\npress ENTER to check firmware:")
        await api.cache_instruments()
        for subsys, state in api.attached_subsystems.items():
            print(f" - v{state.current_fw_version}: {subsys.name}")
        await helpers_ot3.update_firmware(api)
        print("done")


if __name__ == "__main__":
    run(_main())
