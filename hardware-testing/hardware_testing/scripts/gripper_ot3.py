"""Checking Out the OT3 Gripper."""
import argparse
import asyncio
from typing import Optional, List, Tuple

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

# size of things we are using (NOTE: keep Y-Axis as negative)
SLOT_SIZE = types.Point(x=128, y=-86, z=0)
LABWARE_SIZE_ARMADILLO = types.Point(x=127.8, y=-85.55, z=16)
LABWARE_SIZE_EVT_TIPRACK = types.Point(x=127.6, y=-85.8, z=93)
MAG_PLATE_SIZE = types.Point(x=128, y=-86.0, z=39.5)

# offset created by placing labware on the magnetic plate
ARMADILLO_HEIGHT_ON_MAG_PLATE = 45.3
ARMADILLO_OFFSET_ON_MAG_PLATE = types.Point(
    z=ARMADILLO_HEIGHT_ON_MAG_PLATE - LABWARE_SIZE_ARMADILLO.z
)

TRAVEL_HEIGHT = 30

ForcedOffsets = List[Tuple[types.Point, types.Point]]
TEST_OFFSETS: ForcedOffsets = [
    (types.Point(x=0, y=0, z=0), types.Point(x=0, y=0, z=0)),
]

ARMADILLO_GRIP_POINT = LABWARE_SIZE_ARMADILLO * 0.5
ARMADILLO_GRIP_POINT += types.Point(z=LABWARE_SIZE_ARMADILLO.z * 0.5)
LABWARE_SIZE = {"plate": LABWARE_SIZE_ARMADILLO, "tiprack": LABWARE_SIZE_EVT_TIPRACK}
LABWARE_GRIP_HEIGHT = {
    "plate": LABWARE_SIZE_ARMADILLO.z,
    "tiprack": LABWARE_SIZE_EVT_TIPRACK * 0.5,
}

LABWARE_GRIP_FORCE = {"plate": 5, "tiprack": 10}

DEFAULT_PRESS_DOWN_Z = 2

LABWARE_WARP = types.Point()

# TODO: changes for DVT
#       - weaker clips
#       - tall-pegs on only top+left sides
#       - tall-pegs ~5mm from slot-edge


async def _inspect(api: OT3API) -> None:
    if input("ENTER to continue, any key to EXIT: "):
        await _finish(api)


async def _finish(api: OT3API) -> None:
    homed_pos = helpers_ot3.get_gantry_homed_position_ot3(api, types.OT3Mount.GRIPPER)
    await api.ungrip()
    current_pos = await api.gantry_position(mount=types.OT3Mount.GRIPPER)
    await api.move_to(types.OT3Mount.GRIPPER, current_pos._replace(z=homed_pos.z - 2))
    await api.move_to(types.OT3Mount.GRIPPER, homed_pos + types.Point(x=-2, y=-2))
    exit()


def _get_gripper_offset_within_slot(
    labware_key: str, is_grip: bool, has_clips: bool, warp: Optional[float]
) -> types.Point:
    slot_center = SLOT_SIZE * 0.5
    grip_height = LABWARE_GRIP_HEIGHT[labware_key]
    # if-grip-and-clips(x=LABWARE.center, y=SLOT.center, z=LABWARE.grip)
    # else(x=SLOT.center, y=SLOT.center, z=LABWARE.grip)
    if is_grip and has_clips:
        labware_center = LABWARE_SIZE[labware_key] * 0.5
        x = labware_center.x
        if warp:
            x += warp
    else:
        x = slot_center.x
    y = slot_center.y
    z = grip_height
    if not is_grip:
        z -= DEFAULT_PRESS_DOWN_Z
    return types.Point(x=x, y=y, z=z)


async def _gripper_action(
    api: OT3API,
    pos: types.Point,
    force: float,
    is_grip: bool,
    inspect: bool = False,
) -> None:
    mount = types.OT3Mount.GRIPPER
    current_pos = await api.gantry_position(mount)
    travel_height = max(current_pos.z, pos.z + TRAVEL_HEIGHT)
    await api.move_to(mount, current_pos._replace(z=travel_height))
    await api.move_to(mount, pos._replace(z=travel_height))
    await api.move_to(mount, pos)
    if inspect:
        await _inspect(api)
    if is_grip:
        await api.grip(force)
    else:
        await api.ungrip()
    if inspect:
        await _inspect(api)
    await api.move_rel(mount, types.Point(z=TRAVEL_HEIGHT))
    if inspect:
        await _inspect(api)


def _calculate_src_and_dst_points(
    src_slot: int,
    dst_slot: int,
    labware_key: str,
    src_offset: Optional[types.Point],
    dst_offset: Optional[types.Point],
    warp: Optional[float],
) -> Tuple[types.Point, types.Point]:
    # slot top-left corners
    src_slot_loc = helpers_ot3.get_slot_top_left_position_ot3(src_slot)
    dst_slot_loc = helpers_ot3.get_slot_top_left_position_ot3(dst_slot)
    # relative position, within a slot
    src_rel_offset = _get_gripper_offset_within_slot(
        labware_key, is_grip=True, has_clips=True, warp=warp
    )
    dst_rel_offset = _get_gripper_offset_within_slot(
        labware_key, is_grip=False, has_clips=True, warp=warp
    )
    # absolute position, on the deck
    src_loc = src_slot_loc + src_rel_offset
    dst_loc = dst_slot_loc + dst_rel_offset
    # add additional offsets, for testing purposes
    if src_offset:
        src_loc += src_offset
    if dst_offset:
        dst_loc += dst_offset
    print(f"\tSrc Final = {src_loc}")
    print(f"\t\tSlot = {src_slot_loc}")
    print(f"\t\tOffset = {src_rel_offset}")
    if warp:
        print(f"\t\tWarp: {warp}")
    if src_offset:
        print(f"\t\tAdditional Offset = {src_offset}")
    print(f"\tDst Final = {dst_loc}")
    print(f"\t\tSlot = {dst_slot_loc}")
    print(f"\t\tOffset = {dst_rel_offset}")
    if warp:
        print(f"\t\tWarp: {warp}")
    if dst_offset:
        print(f"\t\tAdditional Offset = {dst_offset}")
    return src_loc, dst_loc


async def _slot_to_slot(
    api: OT3API,
    labware_key: str,
    force: Optional[float],
    src_slot: int,
    dst_slot: int,
    src_offset: Optional[types.Point] = None,
    dst_offset: Optional[types.Point] = None,
    warp: Optional[float] = None,
    inspect: bool = True,
) -> None:
    if not force:
        force = LABWARE_GRIP_FORCE[labware_key]
    print(
        f'\nMoving "{labware_key}" from slot #{src_slot} to #{dst_slot} w/ {force} newtons'
    )
    src_loc, dst_loc = _calculate_src_and_dst_points(
        src_slot, dst_slot, labware_key, src_offset, dst_offset, warp=warp
    )
    if inspect:
        await _inspect(api)
    await _gripper_action(api, src_loc, force, is_grip=True, inspect=inspect)
    await _gripper_action(api, dst_loc, force, is_grip=False, inspect=inspect)


async def _main(
    is_simulating: bool,
    labware_key: str,
    slots: List[int],
    inspect: bool = False,
    force: Optional[float] = None,
    warp: Optional[float] = None,
) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()

    if len(slots) == 1:
        slots += [slots[0]]

    async def _run(offsets: Optional[ForcedOffsets]) -> None:
        for i, s in enumerate(slots[:-1]):
            src = slots[i]
            dst = slots[i + 1]
            args = [api, labware_key, force, src, dst]
            if not offsets:
                await _slot_to_slot(*args, inspect=inspect, warp=warp)
            else:
                for _s_offset, _d_offset in offsets:
                    await _slot_to_slot(
                        *args,
                        src_offset=_s_offset,
                        dst_offset=_d_offset,
                        inspect=inspect,
                        warp=warp,
                    )

    while True:
        await _inspect(api)
        await _run(TEST_OFFSETS)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--inspect", action="store_true")
    parser.add_argument("--slots", nargs="+", required=True)
    parser.add_argument("--labware", choices=["plate", "tiprack"], required=True)
    parser.add_argument("--force", type=int, default=5.0)
    parser.add_argument("--warp", type=float)
    args_parsed = parser.parse_args()
    _slots = [int(s) for s in args_parsed.slots]
    asyncio.run(
        _main(
            args_parsed.simulate,
            args_parsed.labware,
            _slots,
            inspect=args_parsed.inspect,
            force=args_parsed.force,
            warp=args_parsed.warp,
        )
    )
