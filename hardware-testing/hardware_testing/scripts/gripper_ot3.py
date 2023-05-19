"""Checking Out the OT3 Gripper."""
import argparse
import asyncio
from dataclasses import dataclass
from typing import Optional, List, Any, Dict

from opentrons.config.defaults_ot3 import CapacitivePassSettings
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api.types import Point
from hardware_testing.opentrons_api import helpers_ot3

# arbitrary safe distance for relative-movements upward
# along Z, after pick-up/dropping a labware
TRAVEL_HEIGHT = 100

# NOTE: should probably just always be zero offset here
PICK_UP_OFFSETS = {
    "deck": Point(),
    "mag-plate": Point(),
    "heater-shaker": Point(),
    "temp-module": Point(),
    "thermo-cycler": Point(),
}
# NOTE: these depend on if there's clips, or chamfers, etc.
DROP_OFFSETS = {
    "deck": Point(z=-0.5),
    "mag-plate": Point(z=9.5),
    "heater-shaker": Point(z=-2),
    "temp-module": Point(z=-2),
    "thermo-cycler": Point(),
}

# size of things we are using (NOTE: keep Y-Axis as negative)
SLOT_SIZE = types.Point(x=128, y=-86, z=0)
LABWARE_SIZE_ARMADILLO = types.Point(x=127.8, y=-85.55, z=16)
LABWARE_SIZE_EVT_TIPRACK = types.Point(x=127.6, y=-85.8, z=93)
LABWARE_SIZE_NEST_1_WELL_RESERVOIR = types.Point(x=127.4, y=-85.2, z=31)

LABWARE_SIZE = {
    "plate": LABWARE_SIZE_ARMADILLO,
    "tiprack": LABWARE_SIZE_EVT_TIPRACK,
    "reservoir": LABWARE_SIZE_NEST_1_WELL_RESERVOIR,
}
LABWARE_KEYS = list(LABWARE_SIZE.keys())
LABWARE_GRIP_HEIGHT = {
    "plate": LABWARE_SIZE_ARMADILLO.z * 0.5,
    "tiprack": LABWARE_SIZE_EVT_TIPRACK.z * 0.4,
    "reservoir": LABWARE_SIZE_NEST_1_WELL_RESERVOIR.z * 0.5,
}
LABWARE_GRIP_FORCE = {k: 15 for k in LABWARE_KEYS}

DECK_ITEM_OFFSETS = {
    "thermo-cycle": Point(),  # FIXME
    "heater-shaker": Point(),  # FIXME
    "temp-module": Point(),  # FIXME
    "mag-plate": Point(),  # FIXME
    "deck": Point(),
}
ADAPTER_OFFSETS = {
    "universal": Point(),  # FIXME
    "pcr": Point(),  # FIXME
    "non-contact": Point(),  # FIXME
    "flat": Point(),  # FIXME
    "deep": Point(),  # FIXME
    "round-bottom": Point(),  # FIXME
}

PROBE_MOUNT = types.OT3Mount.LEFT
ALUMINUM_SEAL_SETTINGS = CapacitivePassSettings(
    prep_distance_mm=5,
    max_overrun_distance_mm=1,
    speed_mm_per_s=1,
    sensor_threshold_pf=0.5,
)
LABWARE_PROBE_CORNER_TOP_LEFT_XY = {
    "plate": Point(x=5, y=-5),
    "tiprack": Point(x=11.5, y=-9.2),
    "reservoir": Point(x=9.5, y=-6.3),
}

# dict holding all the probed corner Z heights
# - slot
#   - deck-item
#     - labware
#       - List of Z heights relative to deck
MEASURED_CORNERS: Dict[int, Dict[str, Dict[str, List[List[float]]]]] = {
    slot: {
        deck_item: {labware_key: list() for labware_key in LABWARE_KEYS}
        for deck_item in DECK_ITEM_OFFSETS.keys()
    }
    for slot in range(12)
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
    await api.ungrip()
    await api.home()
    exit()


def _get_labware_grip_offset(
    labware_key: str, is_grip: bool, has_clips: bool
) -> types.Point:
    slot_center = SLOT_SIZE * 0.5
    grip_height = LABWARE_GRIP_HEIGHT[labware_key]
    if is_grip and has_clips:
        # center of labware != center of slot
        labware_center = LABWARE_SIZE[labware_key] * 0.5
        x = labware_center.x
    else:
        # center of labware == center of slot
        x = slot_center.x
    y = slot_center.y
    z = grip_height
    return types.Point(x=x, y=y, z=z)


def _get_labware_probe_corners(labware_key: str) -> List[Point]:
    size = LABWARE_SIZE[labware_key]
    offset = LABWARE_PROBE_CORNER_TOP_LEFT_XY[labware_key]
    # NOTE: the Y dimension is defined as negative (-) at the top of this script
    corners = {
        "top-left": Point(x=0, y=0, z=size.z),
        "top-right": Point(x=size.x, y=0, z=size.z),
        "bottom-right": Point(x=size.x, y=size.y, z=size.z),
        "bottom-left": Point(x=0, y=size.y, z=size.z),
    }
    probe_offsets = {
        "top-left": Point(x=offset.x, y=offset.y, z=offset.z),
        "top-right": Point(x=offset.x * -1.0, y=offset.y, z=offset.z),
        "bottom-right": Point(x=offset.x * -1.0, y=offset.y * -1.0, z=offset.z),
        "bottom-left": Point(x=offset.x, y=offset.y * -1.0, z=offset.z),
    }
    return [
        corners["top-left"] + probe_offsets["top-left"],
        corners["top-right"] + probe_offsets["top-right"],
        corners["bottom-right"] + probe_offsets["bottom-right"],
        corners["bottom-left"] + probe_offsets["bottom-left"],
    ]


async def _do_gripper_action(
    api: OT3API,
    pos: types.Point,
    force: float,
    is_grip: bool,
    inspect: bool = False,
) -> None:
    mount = types.OT3Mount.GRIPPER
    current_pos = await api.gantry_position(mount)
    travel_height = max(current_pos.z, TRAVEL_HEIGHT)
    if is_grip:
        await api.ungrip()  # guarantee it
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
    if is_grip:
        # keep bottom of plate >= travel height
        await api.move_rel(mount, types.Point(z=TRAVEL_HEIGHT))
    else:
        await api.move_to(mount, pos._replace(z=TRAVEL_HEIGHT))
    if inspect:
        await _inspect(api)


def _calculate_labware_position_on_deck(slot: int, deck_item: str) -> Point:
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
    return slot_pos + deck_item_offset


def _calculate_grip_position(
    slot: int,
    labware_key: str,
    deck_item: str,
    offset: Optional[types.Point],
) -> Point:
    labware_pos_top_left = _calculate_labware_position_on_deck(slot, deck_item)
    # relative position of labware, within a slot/module
    labware_grip_offset = _get_labware_grip_offset(
        labware_key, is_grip=True, has_clips=True
    )
    # calculate absolute position, on the deck
    deck_pos = labware_pos_top_left + labware_grip_offset
    # add additional offsets, for testing purposes
    if offset:
        deck_pos += offset
    print(f'\tDeck Pos = {deck_pos} ("{deck_item}" at slot {slot})')
    print(f"\t\tLabware Top-Left = {labware_pos_top_left}")
    print(f"\t\tLabware Grip-Offset = {labware_grip_offset}")
    if offset:
        print(f"\t\tAdditional Offset = {offset}")
    return deck_pos


def _calculate_probe_positions(
    slot: int, labware_key: str, deck_item: str
) -> List[Point]:
    labware_pos_top_left = _calculate_labware_position_on_deck(slot, deck_item)
    probe_poses = [
        labware_pos_top_left + probe_corner
        for probe_corner in _get_labware_probe_corners(labware_key)
    ]
    return probe_poses


async def _move_labware(
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
    src_loc = _calculate_grip_position(
        src_slot,
        labware_key,
        src_deck_item,
        src_offset,
    )
    src_loc += PICK_UP_OFFSETS[src_deck_item]
    if inspect:
        await _inspect(api)
    await _do_gripper_action(api, src_loc, force, is_grip=True, inspect=inspect)

    # DROP
    dst_loc = _calculate_grip_position(
        dst_slot,
        labware_key,
        dst_deck_item,
        dst_offset,
    )
    dst_loc += DROP_OFFSETS[dst_deck_item]
    if inspect:
        await _inspect(api)
    await _do_gripper_action(api, dst_loc, force, is_grip=False, inspect=inspect)


async def _probe_labware_corners(
    api: OT3API, labware_key: str, slot: int, deck_item: str
) -> List[float]:
    nominal_corners = _calculate_probe_positions(slot, labware_key, deck_item)
    await api.home([types.Axis.by_mount(PROBE_MOUNT)])
    await api.add_tip(PROBE_MOUNT, api.config.calibration.probe_length)
    found_heights: List[float] = list()
    for corner in nominal_corners:
        current_pos = await api.gantry_position(PROBE_MOUNT)
        await api.move_to(PROBE_MOUNT, corner._replace(z=current_pos.z))
        found_z = await api.capacitive_probe(
            PROBE_MOUNT,
            types.Axis.by_mount(PROBE_MOUNT),
            corner.z,
            ALUMINUM_SEAL_SETTINGS,
        )
        found_heights.append(found_z)
    await api.home([types.Axis.by_mount(PROBE_MOUNT)])
    await api.remove_tip(PROBE_MOUNT)
    print(f'\tLabware Corners ("{deck_item}" at slot {slot})')
    print(f"\t\tTop-Left = {found_heights[0]}")
    print(f"\t\tTop-Right = {found_heights[1]}")
    print(f"\t\tBottom-Right = {found_heights[2]}")
    print(f"\t\tBottom-Left = {found_heights[3]}")
    return found_heights


def _clear_corner_heights() -> None:
    global MEASURED_CORNERS
    for slot, deck_items in MEASURED_CORNERS.items():
        for deck_item, labware_keys in deck_items.items():
            for labware_key in labware_keys.keys():
                MEASURED_CORNERS[slot][deck_item][labware_key] = list()


def _store_corner_heights(
    slot: int, deck_item: str, labware_key: str, heights: List[float]
) -> None:
    global MEASURED_CORNERS
    MEASURED_CORNERS[slot][deck_item][labware_key].append(heights)
    heights_cache = MEASURED_CORNERS[slot][deck_item][labware_key]
    if len(heights_cache) > 1:
        # TODO: check variation, raise error if too high
        pass


def _check_corner_heights_variation() -> None:
    return


async def _run(
    api: OT3API,
    labware_key: str,
    slot_states: GripperSlotStates,
    inspect: bool = False,
    probe: bool = False,
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
        src_slot = slot_states.slots[i]
        dst_slot = slot_states.slots[i + 1]
        src_deck_item = _get_item_from_slot(src_slot)
        dst_deck_item = _get_item_from_slot(dst_slot)
        await _move_labware(
            api,
            labware_key,
            force,
            src_slot,
            dst_slot,
            src_deck_item=src_deck_item,
            dst_deck_item=dst_deck_item,
            src_offset=Point(),  # placeholder for error-tolerance testing
            dst_offset=Point(),  # placeholder for error-tolerance testing
            inspect=inspect,
        )
        if not probe:
            continue
        corner_heights = await _probe_labware_corners(
            api,
            labware_key,
            dst_slot,
            dst_deck_item,
        )
        _store_corner_heights(dst_slot, dst_deck_item, labware_key, corner_heights)
        _check_corner_heights_variation()


async def _main(
    is_simulating: bool,
    labware_key: str,
    slot_states: GripperSlotStates,
    inspect: bool = False,
    probe: bool = False,
    force: Optional[float] = None,
    cycles: int = 1,
) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.4",
        gripper="GRPV1120230327A01",
    )
    if probe:
        assert api.hardware_pipettes[
            PROBE_MOUNT.to_mount()
        ], f"no pipette found on {PROBE_MOUNT.name} mount"
    await api.home()
    if probe and not api.is_simulator:
        input(f"attach probe to {PROBE_MOUNT.name} pipette, then press ENTER:")

    if len(slot_states.slots) == 1:
        slot_states.slots += [slot_states.slots[0]]
    elif cycles > 1 and slot_states.slots[0] != slot_states.slots[-1]:
        slot_states.slots.append(slot_states.slots[0])

    while True:
        if not api.is_simulator:
            await _inspect(api)
        if probe:
            _clear_corner_heights()
        for c in range(cycles):
            print(f"Cycle {c + 1}/{cycles}")
            await _run(api, labware_key, slot_states, inspect, probe, force)
        print("done")
        if api.is_simulator:
            break


def _gather_and_test_slots(args: Any) -> GripperSlotStates:
    # This function checks to make sure that the slots and module
    # positions passed in by the script caller as arguments do not
    # conflict with each other. Eg: no modules overlap on a
    # slot, or no non-module slots are specified where a module is
    # also specified, etc.
    #
    # An error will be raised if slots/modules have a conflict.

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
    parser.add_argument("--probe", action="store_true")
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
            probe=args_parsed.probe,
            force=args_parsed.force,
            cycles=args_parsed.cycles,
        )
    )
