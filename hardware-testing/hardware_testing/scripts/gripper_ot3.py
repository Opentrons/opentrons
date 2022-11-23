"""Checking Out the OT3 Gripper."""
import argparse
import asyncio

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

SRC_SLOT = 5
DST_SLOT = 3

MAG_PLATE_OFFSET = types.Point(z=29.25)
WELL_PLATE_SIZE = types.Point(x=127.7, y=-85.5, z=14)
WELL_PLATE_CENTER = WELL_PLATE_SIZE * 0.5

MODULE_UNGRIP_OFFSET = types.Point(z=2)
SLOT_UNGRIP_OFFSET = types.Point(x=0.5, y=-0.5, z=-2)

TRAVEL_HEIGHT = 30


async def _main(is_simulating: bool, force: float) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    mount = types.OT3Mount.GRIPPER
    await api.home()

    async def _gripper_action(
        pos: types.Point, is_grip: bool, has_clips: bool = False
    ) -> None:
        if is_grip:
            checked_pos = pos
        elif has_clips:
            checked_pos = pos + SLOT_UNGRIP_OFFSET
        else:
            checked_pos = pos + MODULE_UNGRIP_OFFSET
        current_pos = await api.gantry_position(mount)
        travel_height = max(current_pos.z, checked_pos.z + TRAVEL_HEIGHT)
        await api.move_to(mount, current_pos._replace(z=travel_height))
        await api.move_to(mount, checked_pos._replace(z=travel_height))
        await api.move_to(mount, checked_pos)
        if is_grip:
            await api.grip(force)
        else:
            await api.ungrip()
        await api.move_rel(mount, types.Point(z=TRAVEL_HEIGHT))

    src_loc = helpers_ot3.get_slot_top_left_position_ot3(SRC_SLOT) + WELL_PLATE_CENTER
    dst_loc = helpers_ot3.get_slot_top_left_position_ot3(DST_SLOT) + MAG_PLATE_OFFSET + WELL_PLATE_CENTER
    while True:
        await _gripper_action(src_loc, is_grip=True, has_clips=True)
        await _gripper_action(dst_loc, is_grip=False, has_clips=True)
        await _gripper_action(dst_loc, is_grip=True, has_clips=True)
        await _gripper_action(src_loc, is_grip=False, has_clips=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--force", type=int, default=5.0)
    args = parser.parse_args()
    asyncio.run(_main(args.simulate, args.force))
