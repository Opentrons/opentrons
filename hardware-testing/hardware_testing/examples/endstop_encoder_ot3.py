"""Endstop and encoder."""
import argparse
import asyncio

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3


async def _main(is_simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    mount = types.OT3Mount.LEFT
    z_ax = types.Axis.by_mount(mount)

    # home the gantry
    await helpers_ot3.home_ot3(api)

    # use the Encoder to check how far we move
    encoder_start = await api.encoder_current_position(mount, refresh=True)
    await api.move_rel(mount, types.Point(z=-100))
    encoder_end = await api.encoder_current_position(mount, refresh=True)
    print(
        f"Encoder tracked the Z moved "
        f"from {encoder_start[z_ax]} "
        f"to {encoder_end[z_ax]}"
    )

    # use the Endstops to quickly move back to the homing position
    switch_pos = helpers_ot3.get_endstop_position_ot3(api, mount)
    await api.move_to(
        mount,
        types.Point(
            x=switch_pos[types.Axis.X],
            y=switch_pos[types.Axis.Y],
            z=switch_pos[z_ax],
        ),
    )
    switches = await api.get_limit_switches()
    if not api.is_simulator and switches[z_ax]:
        raise RuntimeError("Limit switch is NOT pressed when it should be")

    # disengage the XY motors when done
    await api.disengage_axes([types.Axis.X, types.Axis.Y])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
