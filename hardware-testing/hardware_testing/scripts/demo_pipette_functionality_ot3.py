"""Demo OT3 Gantry Functionality."""
import argparse
import asyncio
from typing import Tuple

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    ThreadManagedHardwareAPI,
    build_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    home_ot3,
    home_pipette
    get_endstop_position_ot3,
)

MOUNT = OT3Mount.LEFT
LOAD = GantryLoad.NONE
PIPETTE_SPEED = 10


def _create_relative_point(axis: OT3Axis, distance: float) -> Point:
    if axis == OT3Axis.X:
        return Point(x=distance)
    elif axis == OT3Axis.Y:
        return Point(y=distance)
    elif axis == OT3Axis.Z_L or axis == OT3Axis.Z_R:
        return Point(z=distance)
    raise ValueError(f"Unexpected axis: {axis}")


async def _test_home_pipette(api: ThreadManagedHardwareAPI, mount: MountOT3) -> None:
    await home_pipette(mount)


async def _test_move_plunger(
    api: ThreadManagedHardwareAPI, mount: MountOT3, plunger_distance: float)-> None:
    await api._backend.set_active_current({OT3Axis.from_axis(mount)})
    target_pos = target_position_from_plunger(OT3Mount.from_mount(mount),
                                              plunger_distance,
                                              api.current_position)
    await api._move(target_pos,
                    speed = PIPETTE_SPEED,
                    home_flagged_axes = False,
                    )


async def _test_encoder(
    api: ThreadManagedHardwareAPI, axis: OT3Axis, distance: float = -10
) -> None:
    pos_start = await api.current_position(mount=MOUNT, refresh=True)
    enc_start = await api.encoder_current_position(mount=MOUNT, refresh=True)
    rel_pnt = _create_relative_point(axis, distance)
    input("ready?")
    await api.move_rel(mount=MOUNT, delta=rel_pnt)
    pos_end = await api.current_position_ot3(mount=MOUNT, refresh=True)
    enc_end = await api.encoder_current_position(mount=MOUNT, refresh=True)
    print(f"Position:\n\tstart={pos_start}\n\tend={pos_end}")
    print(f"Encoder:\n\tstart={enc_start}\n\tend={enc_end}")


async def _test_limit_switch(
    api: ThreadManagedHardwareAPI, axis: OT3Axis, tolerance: float = 0.5
) -> None:
    def _points_before_after_switch(tolerance_delta: Point) -> Tuple[Point, Point]:
        endstop_pos = get_endstop_position_ot3(api, mount=MOUNT)
        pos_not_touching = endstop_pos - tolerance_delta
        pos_touching = endstop_pos + tolerance_delta
        return pos_not_touching, pos_touching

    # calculate two positions: 1) before the switch, and 2) after the switch
    poses = _points_before_after_switch(_create_relative_point(axis, tolerance))
    # now move close, but don't touch
    await api.move_to(mount=MOUNT, abs_position=poses[0])
    switches = await api.get_limit_switches()
    assert (
        switches[axis] is False
    ), f"switch on axis {axis} is PRESSED when it should not be"
    # finally, move so that we definitely are touching the switch
    await api.move_to(mount=MOUNT, abs_position=poses[1])
    switches = await api.get_limit_switches()
    assert (
        switches[axis] is True
    ), f"switch on axis {axis} is NOT pressed when it should be"


async def _main(api: ThreadManagedHardwareAPI) -> None:
    await _test_home_pipette(api, MOUNT)
    await _test_encoder(api, axis=OT3Axis.by_mount(MOUNT))
    await api.disengage_axes([OT3Axis.by_mount(MOUNT)])
    input("ENTER to re-engage")
    await api.engage_axes([OT3Axis.by_mount(MOUNT)])
    input("ENTER to home")
    await _safe_home(api, mount)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    hw_api = build_ot3_hardware_api(is_simulating=args.simulate, use_defaults=True)

    asyncio.run(_main(hw_api))
    hw_api.clean_up()
