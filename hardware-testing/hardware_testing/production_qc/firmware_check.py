"""Firmware Check."""
from asyncio import run
from typing import List

from hardware_testing.opentrons_api import helpers_ot3

from opentrons.hardware_control.types import SubSystem


async def _main(simulate: bool, subsystems: List[SubSystem]) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=simulate)
    while True:
        if not api.is_simulator:
            input("\n\npress ENTER to check firmware:")
        await api.cache_instruments()
        for subsys, state in api.attached_subsystems.items():
            print(f" - v{state.current_fw_version}: {subsys.name}")
        await helpers_ot3.update_firmware(api, subsystems=subsystems)
        print("done")
        if api.is_simulator:
            break


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    ot3_subsystems = [s for s in SubSystem if s != SubSystem.motor_controller_board]
    for s in ot3_subsystems:
        parser.add_argument(f"--{s.name.replace('_', '-')}", action="store_true")
    args = parser.parse_args()
    _subsystems = []
    for s in ot3_subsystems:
        if getattr(args, f"{s.name}"):
            _subsystems.append(s)
    if not _subsystems:
        _subsystems = ot3_subsystems
    run(_main(args.simulate, _subsystems))
