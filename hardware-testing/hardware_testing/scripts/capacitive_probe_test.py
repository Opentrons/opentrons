"""Capacitive Probe Test."""
import argparse
import asyncio

from opentrons.config.types import CapacitivePassSettings
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

async def _main(is_simulating: bool, cycles: int, stable: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, pipette_left="p1000_single_v3.3"
    )
    mount = types.OT3Mount.LEFT
    if not api.hardware_pipettes[mount.to_mount()]:
        raise RuntimeError("No pipette attached")

    # add length to the pipette, to account for the attached probe
    await api.add_tip(mount, PROBE_LENGTH)

    await helpers_ot3.home_ot3(api)
    # for c in range(cycles):
    #     print(f"Cycle {c + 1}/{cycles}")
    #     await _probe_sequence(api, mount, stable)

    # move up, "remove" the probe, then disengage the XY motors when done
    z_ax = types.OT3Axis.by_mount(mount)
    top_z = helpers_ot3.get_endstop_position_ot3(api, mount)[z_ax]
    await api.move_to(mount, ASSUMED_XY_LOCATION._replace(z=top_z))
    await api.remove_tip(mount)
    await api.disengage_axes([types.OT3Axis.X, types.OT3Axis.Y])

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=1)
    parser.add_argument("--stable", type=bool, default=True)
    args = parser.parse_args()
    asyncio.run(_main(args.simulate, args.cycles, args.stable))
