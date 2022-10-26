"""Demo OT3 Gantry Functionality."""
import argparse
import asyncio

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3


async def _main(is_simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    mount = types.OT3Mount.LEFT

    # home the gantry
    await helpers_ot3.home_ot3(api)

    # use the Encoder to check how far we move
    encoder_start = await api.encoder_current_position(mount, refresh=True)
    await api.move_rel(mount, types.Point(z=-100))
    encoder_end = await api.encoder_current_position(mount, refresh=True)
    z_ax = types.OT3Axis.by_mount(mount)
    print(f"Encoder tracked the Z moved "
          f"from {encoder_start[z_ax.to_axis()]} "
          f"to {encoder_end[z_ax.to_axis()]}")

    # use the Endstops to find quickly move back to the homing position
    endstop_pos_by_axis = helpers_ot3.get_endstop_position_ot3(api, mount)
    endstop_pos = types.Point(
        x=endstop_pos_by_axis[types.OT3Axis.X],
        y=endstop_pos_by_axis[types.OT3Axis.Y],
        z=endstop_pos_by_axis[z_ax]
    )
    await api.move_to(mount, endstop_pos)
    switches = await api.get_limit_switches()
    assert switches[z_ax], "ERROR: Limit switch is NOT pressed when it should be"

    # disengage the XY motors when done
    await api.disengage_axes([types.OT3Axis.X, types.OT3Axis.Y])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
