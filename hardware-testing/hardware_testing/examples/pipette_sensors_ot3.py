"""Pipette sensors OT3."""
import argparse
import asyncio
from time import sleep

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount


async def _main(is_simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.3",
        pipette_right="p1000_single_v3.3",
    )
    pip_mounts = [OT3Mount.from_mount(m) for m, p in api.hardware_pipettes.items() if p]
    while True:
        for mount in pip_mounts:
            pascals = await helpers_ot3.get_pressure_ot3(api, mount)
            pico_farads = await helpers_ot3.get_capacitance_ot3(api, mount)
            celsius, humidity = await helpers_ot3.get_temperature_humidity_ot3(
                api, mount
            )
            print(
                f"-----\n"
                f"{mount.name}:\n"
                f"\tpascals={pascals}\n"
                f"\tpico_farads={pico_farads}\n"
                f"\tcelsius={celsius}\n"
                f"\thumidity={humidity}"
            )
        sleep(0.2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
