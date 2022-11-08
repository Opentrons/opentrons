"""OT3 Bowtie Test."""
import argparse
import asyncio

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

SLOT_1_POS = types.Point(x=63.25, y=38.925, z=12.275)
UNGRIP_Z_OFFSET = types.Point(z=-2)
SLOT_UNGRIP_OFFSET = types.Point(x=0.5, y=-0.5) + UNGRIP_Z_OFFSET
MAG_PLATE_HEIGHT = 29.25
SLOT_SPACING_X = 164.0
SLOT_SPACING_Y = 107.0

HOVER_HEIGHT = 50


async def _fast_home(api: OT3API, mount: types.OT3Mount, pos: types.Point) -> None:
    current_pos = await api.gantry_position(mount)
    await api.move_to(mount, current_pos._replace(z=pos.z))
    await api.move_to(mount, pos)
    await api.home()


async def _find_slot_1_spot(api: OT3API, force: float) -> types.Point:
    grip_position = await helpers_ot3.jog_mount_ot3(api, types.OT3Mount.GRIPPER)
    print(grip_position)
    input("ENTER to grip:")
    await api.home_gripper_jaw()
    await api.grip(force)
    input("ENTER to ungrip:")
    await api.ungrip()
    grip_pnt = types.Point(x=grip_position[types.OT3Axis.X],
                           y=grip_position[types.OT3Axis.Y],
                           z=grip_position[types.OT3Axis.Z])
    if "y" in input("Try again? (y/n): "):
        grip_pnt = await _find_slot_1_spot(api, force)
    return grip_pnt


async def _main(is_simulating: bool, jog_to_find: bool, force: float) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    mount = types.OT3Mount.GRIPPER
    await api.home()
    home_pos = await api.gantry_position(mount)
    near_home_pos = home_pos + types.Point(x=-5, y=-5, z=-5)

    async def _gripper_action(dest_pos: types.Point, is_grip: bool, has_springs: bool) -> None:
        current_pos = await api.gantry_position(mount)
        await api.move_to(mount, dest_pos._replace(z=current_pos.z))
        await api.move_to(mount, dest_pos)
        if has_springs and not is_grip:
            await api.move_rel(mount, UNGRIP_Z_OFFSET * -1)
        if is_grip:
            await api.grip(force)
        else:
            await api.ungrip()
        await api.move_rel(mount, types.Point(z=HOVER_HEIGHT))

    if jog_to_find:
        grip_position = await _find_slot_1_spot(api, force)
        await _fast_home(api, mount, near_home_pos)
    else:
        grip_position = SLOT_1_POS
    mag_grip_position = grip_position + types.Point(x=SLOT_SPACING_X) + types.Point(z=MAG_PLATE_HEIGHT)
    mag_ungrip_position = mag_grip_position + UNGRIP_Z_OFFSET
    ungrip_position = grip_position + SLOT_UNGRIP_OFFSET

    while True:
        await _gripper_action(grip_position, is_grip=True, has_springs=False)
        await _gripper_action(mag_ungrip_position, is_grip=False, has_springs=True)
        await _gripper_action(mag_grip_position, is_grip=True, has_springs=True)
        await _gripper_action(ungrip_position, is_grip=False, has_springs=False)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--find", action="store_true")
    parser.add_argument("--force", type=int, default=5.0)
    args = parser.parse_args()
    asyncio.run(_main(args.simulate, args.find, args.force))
