"""Checking Out the OT3 Gripper."""
import argparse
import asyncio
from typing import Optional

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

SRC_SLOT = 5
DST_SLOT = 3

# size of the labware we are using
# NOTE: keep Y-Axis as negative (-)
WELL_PLATE_SIZE = types.Point(x=127.7, y=-85.5, z=41)

# offset created by placing labware on the magnetic plate
MAG_PLATE_OFFSET = types.Point(x=0, y=0, z=29.25)

# some default offsets, per movement type
CLIPS_GRIP_OFFSET = types.Point(x=0.5, y=-0.5)
CLIPS_UNGRIP_OFFSET = types.Point(x=0.5, y=-0.5, z=-2.0)
NO_CLIPS_GRIP_OFFSET = types.Point()
NO_CLIPS_UNGRIP_OFFSET = types.Point(z=2)

TRAVEL_HEIGHT = 30


def _get_gripper_action_offset(is_grip: bool, has_clips: bool) -> types.Point:
    if has_clips:
        if is_grip:
            return CLIPS_GRIP_OFFSET
        else:
            return CLIPS_UNGRIP_OFFSET
    else:
        if is_grip:
            return NO_CLIPS_GRIP_OFFSET
        else:
            return NO_CLIPS_UNGRIP_OFFSET


async def _gripper_action(
    api: OT3API, pos: types.Point, force: float, is_grip: bool, has_clips: bool = False
) -> None:
    action_offset = _get_gripper_action_offset(is_grip=is_grip, has_clips=has_clips)
    pos_with_offset = pos + action_offset
    mount = types.OT3Mount.GRIPPER
    current_pos = await api.gantry_position(mount)
    travel_height = max(current_pos.z, pos_with_offset.z + TRAVEL_HEIGHT)
    await api.move_to(mount, current_pos._replace(z=travel_height))
    await api.move_to(mount, pos_with_offset._replace(z=travel_height))
    await api.move_to(mount, pos_with_offset)
    if is_grip:
        await api.grip(force)
    else:
        await api.ungrip()
    await api.move_rel(mount, types.Point(z=TRAVEL_HEIGHT))


async def _main(is_simulating: bool, force: float) -> None:
    plate_center = WELL_PLATE_SIZE * 0.5
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()

    async def _grip_deck(pos: types.Point, _f: float) -> None:
        await _gripper_action(api, pos, _f, is_grip=True, has_clips=True)

    async def _ungrip_deck(pos: types.Point) -> None:
        await _gripper_action(api, pos, 0.0, is_grip=False, has_clips=True)

    async def _slot_to_slot(
        src_slot: int,
        dst_slot: int,
        src_offset: Optional[types.Point] = None,
        dst_offset: Optional[types.Point] = None,
    ) -> None:
        src_loc = helpers_ot3.get_slot_top_left_position_ot3(src_slot)
        dst_loc = helpers_ot3.get_slot_top_left_position_ot3(dst_slot)
        if src_offset:
            src_loc += src_offset
        if dst_offset:
            dst_loc += dst_offset
        print(f"Moving from slot #{src_slot} (Point:{src_loc}) to #{dst_slot} (Point:{dst_loc})")
        await _grip_deck(src_loc + plate_center, force)
        await _ungrip_deck(dst_loc + plate_center)

    slot_order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1]
    for i, s in enumerate(slot_order[:-1]):
        src = slot_order[i]
        dst = slot_order[i + 1]
        await _slot_to_slot(src, dst)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--force", type=int, default=5.0)
    args = parser.parse_args()
    asyncio.run(_main(args.simulate, args.force))
