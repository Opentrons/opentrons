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

PICK_UP_OFFSETS = {
    "deck": Point(x=-0.2),
    "mag-plate": Point(),
    "heater-shaker": Point(),
    "temp-module": Point(),
    "thermo-cycler": Point(),
}
DROP_OFFSETS = {
    "deck": Point(z=-2),
    "mag-plate": Point(z=9.5),
    "heater-shaker": Point(z=-2),
    "temp-module": Point(z=-2),
    "thermo-cycler": Point(),
}

ForcedOffsets = List[Tuple[types.Point, types.Point]]

LABWARE_SIZE = {
    "plate": LABWARE_SIZE_ARMADILLO,
    "tiprack": LABWARE_SIZE_EVT_TIPRACK,
    "reservoir": LABWARE_SIZE_RESERVOIR,
}
LABWARE_KEYS = list(LABWARE_SIZE.keys())
LABWARE_GRIP_HEIGHT = {
    "plate": LABWARE_SIZE_ARMADILLO.z * 0.5,
    "tiprack": LABWARE_SIZE_EVT_TIPRACK.z * 0.4,
    "reservoir": LABWARE_SIZE_RESERVOIR.z * 0.5,
}
LABWARE_GRIP_FORCE = {k: 15 for k in LABWARE_KEYS}
LABWARE_WARP = types.Point()

DECK_ITEM_OFFSETS = {
    "thermo-cycle": None,
    "heater-shaker": None,
    "temp-module": None,
    "mag-plate": None,
    "deck": Point(),
}
ADAPTER_OFFSETS = {
    "universal": Point(z=3),
    "pcr": Point(z=3),
    "non-contact": Point(z=2.6),
    "flat": Point(z=1.75),
    "deep": Point(z=1),
    "round-bottom": Point(z=1),
}


@dataclass
class GripperSlotStates:
    """Gripper slot states."""

    slots: List[int]
    temp_modules: List[int]
    heater_shakers: List[int]
    thermo_cyclers: List[int]
    mag_plates: List[int]


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
    labware_key: str, is_grip: bool, has_clips: bool
) -> types.Point:
    slot_center = SLOT_SIZE * 0.5
    grip_height = LABWARE_GRIP_HEIGHT[labware_key]
    # if-grip-and-clips(x=LABWARE.center, y=SLOT.center, z=LABWARE.grip)
    # else(x=SLOT.center, y=SLOT.center, z=LABWARE.grip)
    if is_grip and has_clips:
        labware_center = LABWARE_SIZE[labware_key] * 0.5
        x = labware_center.x
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


def _calculate_position_on_deck(
    slot: int,
    labware_key: str,
    deck_item: str,
    offset: Optional[types.Point],
) -> Point:
    # slot top-left corner
    slot_pos = helpers_ot3.get_slot_top_left_position_ot3(slot)
    # offset the module applies to an inserted labware
    # FIXME: we are only assuming deck slots for now
    #        need to include module offsets, which are a
    #        combination of both A) nominal offsets, and
    #        B) calibration offset
    # FIXME: also include adapter offsets here
    assert deck_item == "deck", "currently not supporting modules"
    deck_item_offset = DECK_ITEM_OFFSETS[deck_item]
    # relative position of labware, within a slot/module
    labware_offset = _get_labware_grip_offset(
        labware_key, is_grip=True, has_clips=True
    )
    # calculate absolute position, on the deck
    deck_pos = slot_pos + deck_item_offset + labware_offset
    # add additional offsets, for testing purposes
    if offset:
        deck_pos += offset
    print(f"\tDeck Pos = {deck_pos}")
    print(f"\t\tSlot = {slot_pos}")
    print(f"\t\tDeck-Item = {deck_item_offset}")
    print(f"\t\tLabware = {labware_offset}")
    if offset:
        print(f"\t\tAdditional Offset = {offset}")
    return deck_pos


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
    inspect: bool = True,
) -> None:
    if not force:
        force = LABWARE_GRIP_FORCE[labware_key]
    print(
        f'\nMoving "{labware_key}" from slot #{src_slot} to #{dst_slot} w/ {force} newtons'
    )

    # PICK-UP
    src_loc = _calculate_position_on_deck(
        src_slot,
        labware_key,
        src_deck_item,
        src_offset,
    )
    src_loc += PICK_UP_OFFSETS[src_deck_item]
    if inspect:
        await _inspect(api)
    await _gripper_action(api, src_loc, force, is_grip=True, inspect=inspect)

    # DROP
    dst_loc = _calculate_position_on_deck(
        dst_slot,
        labware_key,
        dst_deck_item,
        dst_offset,
    )
    dst_loc += DROP_OFFSETS[dst_deck_item]
    if inspect:
        await _inspect(api)
    await _gripper_action(api, dst_loc, force, is_grip=True, inspect=inspect)


async def _run(
    api: OT3API,
    labware_key: str,
    slot_states: GripperSlotStates,
    inspect: bool = False,
    force: Optional[float] = None,
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
        await _slot_to_slot(
            api,
            labware_key,
            force,
            src,
            dst,
            src_deck_item=src_deck_item,
            dst_deck_item=dst_deck_item,
            src_offset=Point(),  # placeholder for error-tolerance testing
            dst_offset=Point(),  # placeholder for error-tolerance testing
            inspect=inspect,
        )


async def _main(
    is_simulating: bool,
    labware_key: str,
    slot_states: GripperSlotStates,
    inspect: bool = False,
    force: Optional[float] = None,
    cycles: int = 1,
) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating, gripper="GRPV3320230327A01")
    await api.home()

    if len(slot_states.slots) == 1:
        slot_states.slots += [slot_states.slots[0]]
    elif cycles > 1 and slot_states.slots[0] != slot_states.slots[-1]:
        slot_states.slots.append(slot_states.slots[0])

    while True:
        if not api.is_simulator:
            await _inspect(api)
        for c in range(cycles):
            print(f"Cycle {c + 1}/{cycles}")
            await _run(api, labware_key, slot_states, inspect, force)
        if api.is_simulator:
            break


def _gather_and_test_slots(args: Any) -> GripperSlotStates:
    """
    This function checks to make sure that the slots and module
    positions passed in by the script caller as arguments do not
    conflict with each other. Eg: no modules overlap on a
    slot, or no non-module slots are specified where a module is
    also specified, etc.

    An error will be raised if slots/modules have a conflict.
    """
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
    parser.add_argument("--cycles", type=int, default=1)
    parser.add_argument("--force", type=int, default=5.0)
    parser.add_argument("--temp-module-slots", nargs="+")
    parser.add_argument("--heater-shaker-slots", nargs="+")
    parser.add_argument("--thermo-cycler", action="store_true")
    parser.add_argument("--mag-plate-slots", nargs="+")
    args_parsed = parser.parse_args()

    asyncio.run(
        _main(
            args_parsed.simulate,
            args_parsed.labware,
            _gather_and_test_slots(args_parsed),
            inspect=args_parsed.inspect,
            force=args_parsed.force,
            cycles=args_parsed.cycles,
        )
    )
