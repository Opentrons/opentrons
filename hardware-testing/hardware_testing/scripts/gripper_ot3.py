"""Checking Out the OT3 Gripper."""
import argparse
import asyncio
from dataclasses import dataclass
from typing import Optional, List, Tuple, Any, Dict

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api.types import Point
from hardware_testing.opentrons_api import helpers_ot3

# size of things we are using (NOTE: keep Y-Axis as negative)
SLOT_SIZE = types.Point(x=128, y=-86, z=0)
LABWARE_SIZE_ARMADILLO = types.Point(x=127.8, y=-85.55, z=16)
LABWARE_SIZE_EVT_TIPRACK = types.Point(x=127.6, y=-85.8, z=93)
LABWARE_SIZE_RESERVOIR = types.Point(x=127.8, y=-85.55, z=30)  # FIXME: get real values
MAG_PLATE_SIZE = types.Point(x=128, y=-86.0, z=39.5)

# offset created by placing labware on the magnetic plate
ARMADILLO_HEIGHT_ON_MAG_PLATE = 45.3
ARMADILLO_OFFSET_ON_MAG_PLATE = types.Point(
    z=ARMADILLO_HEIGHT_ON_MAG_PLATE - LABWARE_SIZE_ARMADILLO.z
)

TRAVEL_HEIGHT = 30

ForcedOffsets = List[Tuple[types.Point, types.Point]]

# EDIT BELOW VARIABLES
TEST_OFFSETS: ForcedOffsets = [
    (types.Point(x=0, y=0, z=0), types.Point(x=0, y=0, z=0)),
]
LABWARE_SIZE = {
    "plate": LABWARE_SIZE_ARMADILLO,
    "tiprack": LABWARE_SIZE_EVT_TIPRACK,
    "reservoir": LABWARE_SIZE_RESERVOIR,
}
LABWARE_KEYS = list(LABWARE_SIZE.keys())
LABWARE_GRIP_HEIGHT = {k: LABWARE_SIZE[k].z * 0.5 for k in LABWARE_KEYS}
LABWARE_GRIP_FORCE = {k: 15 for k in LABWARE_KEYS}
LABWARE_WARP = types.Point()


@dataclass
class GripperSlotStates:
    """Gripper slot states."""

    slots: List[int]
    temp_modules: List[int]
    heater_shakers: List[int]
    thermo_cyclers: List[int]
    mag_plates: List[int]


# TODO: changes for DVT
#       - weaker clips
#       - tall-pegs on only top+left sides
#       - tall-pegs ~5mm from slot-edge

SW_OFFSETS_OT2 = {
    "deck": Point(),
    "mag-plate": Point(),
    "heater-shaker-right": Point(x=0.125, y=-1.125, z=68.275),
    "heater-shaker-left": Point(x=-0.125, y=1.125, z=68.275),
    "temp-module": Point(x=-1.45, y=-0.15, z=80.09),
    "thermo-cycler": Point(y=68.06, z=98.26),
}


def _remove_ot2_sw_offset(o: Point, d_item: str, s: int) -> Point:
    if d_item == "heater-shaker":
        if s in [1, 4, 7, 10]:
            o += SW_OFFSETS_OT2[f"{d_item}-left"]
        else:
            o += SW_OFFSETS_OT2[f"{d_item}-right"]
    else:
        o += SW_OFFSETS_OT2[d_item]
    return o


def grip_offset(
    action: str, item: str, slot: Optional[int] = None, adapter: Optional[str] = None
) -> Dict[str, float]:
    """Grip offset."""
    from opentrons.types import Point

    # EDIT these values
    # NOTE: we are still testing to determine our software's defaults
    #       but we also expect users will want to edit these
    _pick_up_offsets = {
        "deck": Point(x=-0.2),
        "mag-plate": Point(),
        "heater-shaker": Point(),
        "temp-module": Point(),
        "thermo-cycler": Point(),
    }
    # EDIT these values
    # NOTE: we are still testing to determine our software's defaults
    #       but we also expect users will want to edit these
    _drop_offsets = {
        "deck": Point(z=-2),
        "mag-plate": Point(z=9.5),
        "heater-shaker": Point(z=-2),
        "temp-module": Point(z=-2),
        "thermo-cycler": Point(),
    }
    # do NOT edit these values
    # NOTE: these values will eventually be in our software
    #       and will not need to be inside a protocol
    _sw_offsets_ot2 = {
        "deck": Point(),
        "mag-plate": Point(),
        "heater-shaker-right": Point(x=0.125, y=-1.125, z=68.275),
        "heater-shaker-left": Point(x=-0.125, y=1.125, z=68.275),
        "temp-module": Point(x=-1.45, y=-0.15, z=80.09),
        "thermo-cycler": Point(y=68.06, z=98.26),
    }
    _hw_offsets_ot3 = {
        "deck": Point(),
        "mag-plate": Point(z=29.5),
        "heater-shaker-right": Point(x=-3, y=-1, z=19),
        "heater-shaker-left": Point(x=3, y=1, z=19),
        "temp-module": Point(x=2.17, z=9),
        "thermo-cycler": Point(x=-19.88, y=67.76, z=-0.04),
    }
    _adapter_offsets = {
        "universal": Point(z=3),
        "pcr": Point(z=3),
        "non-contact": Point(z=2.6),
        "flat": Point(z=1.75),
        "deep": Point(z=1),
        "round-bottom": Point(z=1),
    }
    # make sure arguments are correct
    action_options = ["pick-up", "drop"]
    item_options = list(_hw_offsets_ot3.keys())
    item_options.remove("heater-shaker-left")
    item_options.remove("heater-shaker-right")
    item_options.append("heater-shaker")
    if action not in action_options:
        raise ValueError(
            f'"{action}" not recognized, available options: {action_options}'
        )
    if item not in item_options:
        raise ValueError(f'"{item}" not recognized, available options: {item_options}')
    if item == "heater-shaker":
        assert slot, 'argument slot= is required when using "heater-shaker"'
        if slot in [1, 4, 7, 10]:
            side = "left"
        elif slot in [3, 6, 9, 12]:
            side = "right"
        else:
            raise ValueError("heater shaker must be on either left or right side")
        k = f"{item}-{side}"
        hw_offset = _hw_offsets_ot3[k] - _sw_offsets_ot2[k]
        if adapter:
            _avail_adapters = list(_adapter_offsets.keys())
            assert (
                adapter in _avail_adapters
            ), f'adapter "{adapter}" not found in {_avail_adapters}'
            hw_offset += _adapter_offsets[adapter]
    else:
        hw_offset = _hw_offsets_ot3[item] - _sw_offsets_ot2[item]
    if action == "pick-up":
        offset = hw_offset + _pick_up_offsets[item]
    else:
        offset = hw_offset + _drop_offsets[item]
    # convert from Point() to dict()
    return {"x": offset.x, "y": offset.y, "z": offset.z}


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


def _get_labware_grip_offset(
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
    src_deck_item: str,
    dst_deck_item: str,
    src_offset: Optional[types.Point],
    dst_offset: Optional[types.Point],
    warp: Optional[float],
    adapter: Optional[str],
) -> Tuple[types.Point, types.Point]:
    # slot top-left corners
    src_slot_loc = helpers_ot3.get_slot_top_left_position_ot3(src_slot)
    dst_slot_loc = helpers_ot3.get_slot_top_left_position_ot3(dst_slot)
    # relative position, within a slot
    src_labware_offset = _get_labware_grip_offset(
        labware_key, is_grip=True, has_clips=True, warp=warp
    )
    dst_labware_offset = _get_labware_grip_offset(
        labware_key, is_grip=False, has_clips=True, warp=warp
    )
    # offset the module applies to an inserted labware
    src_module_offset = types.Point(
        **grip_offset("pick-up", src_deck_item, slot=src_slot, adapter=adapter)
    )
    src_module_offset = _remove_ot2_sw_offset(
        src_module_offset, src_deck_item, src_slot
    )
    dst_module_offset = types.Point(
        **grip_offset("drop", dst_deck_item, slot=dst_slot, adapter=adapter)
    )
    dst_module_offset = _remove_ot2_sw_offset(
        dst_module_offset, dst_deck_item, dst_slot
    )
    # absolute position, on the deck
    src_loc = src_slot_loc + src_module_offset + src_labware_offset
    dst_loc = dst_slot_loc + dst_module_offset + dst_labware_offset
    # add additional offsets, for testing purposes
    if src_offset:
        src_loc += src_offset
    if dst_offset:
        dst_loc += dst_offset
    print(f"\tSrc Final = {src_loc}")
    print(f"\t\tSlot = {src_slot_loc}")
    print(f"\t\tOffset = {src_labware_offset}")
    if warp:
        print(f"\t\tWarp: {warp}")
    if src_offset:
        print(f"\t\tAdditional Offset = {src_offset}")
    print(f"\tDst Final = {dst_loc}")
    print(f"\t\tSlot = {dst_slot_loc}")
    print(f"\t\tOffset = {dst_labware_offset}")
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
    src_deck_item: str,
    dst_deck_item: str,
    src_offset: Optional[types.Point] = None,
    dst_offset: Optional[types.Point] = None,
    warp: Optional[float] = None,
    adapter: Optional[str] = None,
    inspect: bool = True,
) -> None:
    if not force:
        force = LABWARE_GRIP_FORCE[labware_key]
    print(
        f'\nMoving "{labware_key}" from slot #{src_slot} to #{dst_slot} w/ {force} newtons'
    )
    src_loc, dst_loc = _calculate_src_and_dst_points(
        src_slot,
        dst_slot,
        labware_key,
        src_deck_item,
        dst_deck_item,
        src_offset,
        dst_offset,
        warp=warp,
        adapter=adapter,
    )
    if inspect:
        await _inspect(api)
    await _gripper_action(api, src_loc, force, is_grip=True, inspect=inspect)
    await _gripper_action(api, dst_loc, force, is_grip=False, inspect=inspect)


async def _run(
    api: OT3API,
    labware_key: str,
    slot_states: GripperSlotStates,
    inspect: bool = False,
    force: Optional[float] = None,
    warp: Optional[float] = None,
    adapter: Optional[str] = None,
) -> None:
    def _get_item_from_slot(slot: int) -> str:
        if slot in slot_states.temp_modules:
            return "temp-module"
        elif slot in slot_states.heater_shakers:
            return "heater-shaker"
        elif slot in slot_states.thermo_cyclers:
            return "thermo-cycler"
        elif slot in slot_states.mag_plates:
            return "mag-plate"
        else:
            return "deck"

    for i, s in enumerate(slot_states.slots[:-1]):
        src = slot_states.slots[i]
        dst = slot_states.slots[i + 1]
        src_deck_item = _get_item_from_slot(src)
        dst_deck_item = _get_item_from_slot(dst)
        for _s_offset, _d_offset in TEST_OFFSETS:
            await _slot_to_slot(
                api,
                labware_key,
                force,
                src,
                dst,
                src_deck_item=src_deck_item,
                dst_deck_item=dst_deck_item,
                src_offset=_s_offset,
                dst_offset=_d_offset,
                inspect=inspect,
                warp=warp,
                adapter=adapter,
            )


async def _main(
    is_simulating: bool,
    labware_key: str,
    slot_states: GripperSlotStates,
    inspect: bool = False,
    force: Optional[float] = None,
    warp: Optional[float] = None,
    adapter: Optional[str] = None,
) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()

    if len(slot_states.slots) == 1:
        slot_states.slots += [slot_states.slots[0]]

    while True:
        await _inspect(api)
        await _run(api, labware_key, slot_states, inspect, force, warp, adapter)


def _gather_and_test_slots(args: Any) -> GripperSlotStates:
    def _slot_array_from_args(a: Any) -> List[int]:
        if a:
            return [int(s) for s in a]
        else:
            return []

    slots = _slot_array_from_args(args.slots)
    slots_temp_modules = _slot_array_from_args(args.temp_module_slots)
    slots_heater_shaker = _slot_array_from_args(args.heater_shaker_slots)
    slots_thermo_cycler = [7] if args.thermo_cycler else []
    slots_mag_plates = _slot_array_from_args(args.mag_plate_slots)

    def _test_slots(
        tag: str, module_slots: List[int], other_modules: List[List[int]]
    ) -> None:
        for s in module_slots:
            assert s in slots, f"{tag} slot {s} not found in slots: {slots}"
            for mod_slots in other_modules:
                assert (
                    s not in mod_slots
                ), f"{tag} slot {s} collides with other module slot"

    _test_slots(
        "thermo-cycler",
        slots_thermo_cycler,
        [slots_heater_shaker, slots_temp_modules, slots_mag_plates],
    )
    _test_slots(
        "heater-shaker",
        slots_heater_shaker,
        [slots_thermo_cycler, slots_temp_modules, slots_mag_plates],
    )
    _test_slots(
        "temp-module",
        slots_temp_modules,
        [slots_thermo_cycler, slots_heater_shaker, slots_mag_plates],
    )
    _test_slots(
        "mag-plate",
        slots_mag_plates,
        [slots_thermo_cycler, slots_heater_shaker, slots_temp_modules],
    )

    slot_states = GripperSlotStates(
        slots=slots,
        temp_modules=slots_temp_modules,
        heater_shakers=slots_heater_shaker,
        thermo_cyclers=slots_thermo_cycler,
        mag_plates=slots_mag_plates,
    )
    return slot_states


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--inspect", action="store_true")
    parser.add_argument("--slots", nargs="+", required=True)
    parser.add_argument("--labware", choices=LABWARE_KEYS, required=True)
    parser.add_argument("--force", type=int, default=5.0)
    parser.add_argument("--warp", type=float)
    parser.add_argument("--temp-module-slots", nargs="+")
    parser.add_argument("--heater-shaker-slots", nargs="+")
    parser.add_argument("--thermo-cycler", action="store_true")
    parser.add_argument("--mag-plate-slots", nargs="+")
    parser.add_argument("--adapter", type=str)
    args_parsed = parser.parse_args()

    asyncio.run(
        _main(
            args_parsed.simulate,
            args_parsed.labware,
            _gather_and_test_slots(args_parsed),
            inspect=args_parsed.inspect,
            force=args_parsed.force,
            warp=args_parsed.warp,
            adapter=args_parsed.adapter,
        )
    )
