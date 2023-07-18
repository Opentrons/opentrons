"""OT-3 Manual Calibration."""
import asyncio
import argparse
from typing import Tuple

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import GripperProbe

from hardware_testing.opentrons_api.types import OT3Mount, Axis, Point
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.calibration_storage.ot3.pipette_offset import save_pipette_calibration
from opentrons.calibration_storage.ot3.gripper_offset import save_gripper_calibration

SAFE_Z = 6
DEFAULT_STEP_SIZE = 0.1
Z_OFFSET_FROM_WASHERS = 3.0

GRIP_FORCE_CALIBRATION = 20

GRIPPER_PROBE_LENGTH = 22

# Height of the bottom of a probe above the deck.
# Must be high enough for the user to reach under to change probes,
# but low enough to be within all mounts' extents.
PROBE_CHANGE_Z = 100

# size of the aluminum block used to visually check gripper calibration
SLOT_SIZE = Point(x=128, y=-86, z=0)
GRIPPER_TEST_BLOCK_SIZE = Point(x=127.7, y=-85.5, z=64)


def _get_z_probe_pos(square_pos: Point) -> Point:
    square = helpers_ot3.CALIBRATION_SQUARE_EVT
    probe = helpers_ot3.CALIBRATION_PROBE_EVT
    safe_z_probe_offset = (square.width / 2) + (probe.diameter / 2)
    z_probe_pos = square_pos + Point(x=safe_z_probe_offset, y=safe_z_probe_offset)
    return z_probe_pos


def _get_instrument_id(api: OT3API, mount: OT3Mount) -> str:
    if mount == OT3Mount.LEFT or mount == OT3Mount.RIGHT:
        pipette = api.hardware_pipettes[mount.to_mount()]
        assert pipette, f"No pipette found on mount: {mount}"
        instr_id = pipette.pipette_id
    else:
        gripper = api.attached_gripper
        assert gripper, "No gripper found"
        instr_id = str(gripper["gripper_id"])
    assert instr_id, f"no instrument ID found on mount: {mount}"
    return instr_id


def _get_user_input_during_gripper_test() -> Tuple[str, float]:
    res = input(
        '"w"=GRIP-WIDTH; "g"=GRIP-FORCE; "u"=UNGRIP; "z"=JOG-Z; "y"=JOG-Y; "s"=STOP '
    )
    res = res.strip().lower()
    try:
        key = res[0]
    except IndexError:
        return _get_user_input_during_gripper_test()
    try:
        value = float(res[1:])
    except (ValueError, IndexError):
        value = 0.0
    return key, value


async def _test_gripper_calibration_with_block(api: OT3API, pos: Point) -> Point:
    input("add the calibration block to the slot, then press ENTER")
    await api.home_gripper_jaw()
    await api.move_to(OT3Mount.GRIPPER, pos)
    while True:
        key, value = _get_user_input_during_gripper_test()
        if key == "w" and value:
            print(f"Jaw width: {value}")
            await api.hold_jaw_width(int(value))
        elif key == "g" and value:
            print(f"Jaw force: {value}")
            await api.grip(value)
        elif key == "u":
            print("Jaw homing")
            await api.home_gripper_jaw()
        elif key == "z" and value:
            await api.move_rel(OT3Mount.GRIPPER, Point(z=value))
            current_pos = await api.gantry_position(mount=OT3Mount.GRIPPER)
            print(f"Gripper Z: {round(current_pos.z, 1)}")
        elif key == "y" and value:
            if abs(value) > 1.0:
                print("must jog Y axis in increments less than 1mm")
            else:
                await api.move_rel(OT3Mount.GRIPPER, Point(y=value))
                current_pos = await api.gantry_position(mount=OT3Mount.GRIPPER)
                print(f"Additional Y Offset: {round(pos.y - current_pos.y, 2)}")
        elif key == "s":
            break
    await api.home_gripper_jaw()
    # get any additional Y-axis offset
    new_pos = await api.gantry_position(mount=OT3Mount.GRIPPER)
    y_offset_from_calibrated_position = pos.y - new_pos.y
    return Point(y=y_offset_from_calibrated_position)


async def _test_current_calibration(api: OT3API, mount: OT3Mount, pos: Point) -> Point:
    current_pos = await api.gantry_position(mount)
    await api.move_to(mount, pos._replace(z=current_pos.z))
    if mount == OT3Mount.GRIPPER:
        return await _test_gripper_calibration_with_block(api, pos)
    else:
        input("ENTER to move to center of slot to test Pipette calibration: ")
        await api.move_to(mount, pos)
        input("Check by EYE, then press ENTER to continue: ")
        pip = api.hardware_pipettes[mount.to_mount()]
        assert pip, f"No pipette found on mount: {mount}"
        is_multi = "multi" in pip.name
        if is_multi and "y" in input("check if level to deck? (y/n):"):
            await _check_multi_channel_to_deck_alignment(api, mount, pos, pos)
        return Point()


async def _jog_axis(api: OT3API, mount: OT3Mount, axis: Axis, direction: float) -> None:
    step = DEFAULT_STEP_SIZE
    ax = axis.name.lower()[0]
    while True:
        inp = input(f'<ENTER> key to jog {step} mm, or type "yes" to save position: ')
        if not inp:
            await api.move_rel(mount, Point(**{ax: step * direction}))
        if inp:
            if inp.lower()[0] == "y":
                return
            else:
                try:
                    tmp_step = float(inp.strip())
                    if abs(tmp_step) > 1.0:
                        print("Cannot jog greater than +/- 1.0 mm")
                        continue
                    else:
                        step = tmp_step
                except ValueError:
                    pass


async def _begin_find_sequence(
    api: OT3API, mount: OT3Mount, expected_pos: Point
) -> None:
    # Move above slot Z center
    z_probe_pos = _get_z_probe_pos(expected_pos) + Point(z=SAFE_Z)
    current_position = await api.gantry_position(mount)
    travel_height = max(current_position.z, z_probe_pos.z)
    await api.move_to(mount, current_position._replace(z=travel_height))
    await api.move_to(mount, z_probe_pos._replace(z=travel_height))
    input("\nRemove all items from deck and press ENTER:\n")
    await api.move_to(mount, z_probe_pos)


async def _find_square_z_pos(api: OT3API, mount: OT3Mount) -> float:
    # Jog gantry to find deck height
    print("\n--> Jog to find Z position")
    await _jog_axis(api, mount, Axis.by_mount(mount), -1)
    current_position = await api.gantry_position(mount)
    await api.move_rel(mount, Point(z=SAFE_Z))
    deck_height = float(current_position.z)
    print(f"Found Z = {deck_height}mm")
    return deck_height


async def _find_square_center(
    api: OT3API,
    mount: OT3Mount,
    expected_pos: Point,
) -> Point:
    await _begin_find_sequence(api, mount, expected_pos)

    # find the Z height
    deck_height = await _find_square_z_pos(api, mount)

    # Move to slot center
    current_position = await api.gantry_position(mount)
    await api.move_to(
        mount,
        expected_pos._replace(z=current_position.z),
    )
    input("\nPress ENTER to calibrate XY axes:")
    xy_start_pos = expected_pos._replace(z=deck_height - 2)
    await api.move_to(mount, xy_start_pos)

    probe_radius = helpers_ot3.CALIBRATION_PROBE_EVT.diameter / 2
    rel_dist_from_edge_to_center = (
        helpers_ot3.CALIBRATION_SQUARE_EVT.width / 2
    ) - probe_radius

    # move to the FRONT until we hit the square edge
    await _jog_axis(api, mount, Axis.Y, -1)
    current_position = await api.gantry_position(mount)
    front_square = current_position.y - probe_radius
    y_front = front_square + (helpers_ot3.CALIBRATION_SQUARE_EVT.height / 2)
    print(f"Found Y-Front = {y_front}mm")
    await api.move_rel(mount, Point(y=rel_dist_from_edge_to_center))

    # move to the FRONT until we hit the square edge
    await _jog_axis(api, mount, Axis.Y, 1)
    current_position = await api.gantry_position(mount)
    rear_square = current_position.y + probe_radius
    y_rear = rear_square - (helpers_ot3.CALIBRATION_SQUARE_EVT.height / 2)
    print(f"Found Y-Rear = {y_rear}mm")
    await api.move_rel(mount, Point(y=-rel_dist_from_edge_to_center))

    # move to the RIGHT until we hit the square edge
    await _jog_axis(api, mount, Axis.X, 1)
    current_position = await api.gantry_position(mount)
    right_square = current_position.x + probe_radius
    x_right = right_square - (helpers_ot3.CALIBRATION_SQUARE_EVT.width / 2)
    print(f"Found X-Right = {x_right}mm")
    await api.move_rel(mount, Point(x=-rel_dist_from_edge_to_center))

    # move to the LEFT until we hit the square edge
    await _jog_axis(api, mount, Axis.X, -1)
    current_position = await api.gantry_position(mount)
    left_square = current_position.x - probe_radius
    x_left = left_square + (helpers_ot3.CALIBRATION_SQUARE_EVT.width / 2)
    print(f"Found X-Left = {x_left}mm")
    await api.move_rel(mount, Point(x=rel_dist_from_edge_to_center))

    x_center = (x_right + x_left) * 0.5
    print(f"Found X-Center = {x_center}mm")

    y_center = (y_front + y_rear) * 0.5
    print(f"Fount Y-Center: {y_center}mm")

    # Show final calibration results
    found_square_pos = Point(x=x_center, y=y_center, z=deck_height)
    print(f"\nSlot Center Position = {found_square_pos}")
    print(f"\tOffset from Expected = {expected_pos - found_square_pos}")
    return found_square_pos


async def _find_square_center_of_gripper_jaw(api: OT3API, expected_pos: Point) -> Point:
    # first, we grip the jaw, so that the jaws are fully pressing inwards
    # this removes wiggle/backlash from jaws during probing
    await api.disengage_axes([Axis.G])
    input("ENTER to GRIP:")
    await api.grip(GRIP_FORCE_CALIBRATION)
    input("add probe to Gripper FRONT, then press ENTER: ")
    # FIXME: (AS) run grip again, to make sure the correct encoder position is read.
    #        This avoids a bug where jaw movements timeout too quickly, so the encoder
    #        position is never read back. This is bad for calibration, b/c the encoder
    #        is used to calculate the position of the calibration pins
    await api.grip(GRIP_FORCE_CALIBRATION)
    api.add_gripper_probe(GripperProbe.FRONT)
    await api.home_z(OT3Mount.GRIPPER)  # home after attaching probe, if motor skips
    found_square_front = await _find_square_center(
        api,
        OT3Mount.GRIPPER,
        expected_pos,
    )
    input("Press ENTER to move to found center:")
    await api.move_to(
        OT3Mount.GRIPPER,
        found_square_front,
    )
    input("Check by EYE, then press ENTER to continue:")
    current_position = await api.gantry_position(
        OT3Mount.GRIPPER,
    )
    await api.move_to(
        OT3Mount.GRIPPER,
        current_position + Point(z=PROBE_CHANGE_Z),
    )
    api.remove_gripper_probe()
    input("add probe to Gripper REAR, then press ENTER: ")
    api.add_gripper_probe(GripperProbe.REAR)
    await api.home_z(OT3Mount.GRIPPER)  # home after attaching probe, if motor skips
    found_square_back = await _find_square_center(
        api,
        OT3Mount.GRIPPER,
        expected_pos,
    )
    input("Press ENTER to move to found center:")
    await api.move_to(
        OT3Mount.GRIPPER,
        found_square_back,
    )
    input("Check by EYE, then press ENTER to continue:")
    current_position = await api.gantry_position(
        OT3Mount.GRIPPER,
    )
    await api.move_to(
        OT3Mount.GRIPPER,
        current_position + Point(z=PROBE_CHANGE_Z),
    )
    input("Remove probe from Gripper, then press ENTER: ")
    api.remove_gripper_probe()
    # ungrip the jaws
    await api.home_gripper_jaw()
    # average the two probes together
    found_square_pos = 0.5 * (found_square_front + found_square_back)
    print(f"\nGripper Slot Center Position = {found_square_pos}")
    print(f"\tOffset from Expected = {expected_pos - found_square_pos}")
    return found_square_pos


def _apply_relative_offset(_offset: Point, _relative: Point) -> Point:
    if not _relative or _relative == Point():
        print("No relative offset to apply")
        return _offset
    res = input(
        f"Add relative offset {_relative} to instrument's current offset? (y/n): "
    )
    if res and res[0].lower() == "y":
        print("applying relative offset")
        _offset += _relative
    else:
        print("skipping relative offset")
    return _offset


async def _check_multi_channel_to_deck_alignment(
    api: OT3API, mount: OT3Mount, expected_pos: Point, found_pos: Point
) -> None:
    current_pos = await api.gantry_position(mount)
    await api.move_to(mount, current_pos._replace(z=100))
    input("add probe to pipette FRONT channel (#8), then press ENTER: ")
    await _begin_find_sequence(api, mount, expected_pos + Point(y=9 * 7))
    front_deck_height = await _find_square_z_pos(api, mount)
    diff = front_deck_height - found_pos.z
    if diff != 0.0:
        above_below_msg = "below" if diff < 0 else "above"
        print(f"FRONT channel is {abs(diff)} mm {above_below_msg} the REAR channel")
        print("is this acceptable?")
        if "n" in input("if not, then home and exit this script? (y/n): "):
            print("homing")
            await api.home()
            exit()
    current_pos = await api.gantry_position(mount)
    await api.move_to(mount, current_pos._replace(z=100))
    input("add probe back to pipette REAR channel (#1), then press ENTER: ")


async def _find_the_square(api: OT3API, mount: OT3Mount, expected_pos: Point) -> Point:
    if mount == OT3Mount.GRIPPER:
        helpers_ot3.set_gripper_offset_ot3(api, Point(x=0, y=0, z=0))
        found_pos = await _find_square_center_of_gripper_jaw(api, expected_pos)
    else:
        helpers_ot3.set_pipette_offset_ot3(api, mount, Point(x=0, y=0, z=0))
        pip = api.hardware_pipettes[mount.to_mount()]
        assert pip, f"No pipette found on mount: {mount}"
        is_multi = "multi" in pip.name
        if is_multi:
            input("add probe to pipette REAR channel (#1), then press ENTER: ")
        else:
            input("add probe to Pipette, then press ENTER: ")
        found_pos = await _find_square_center(api, mount, expected_pos)
    return found_pos


def _apply_offset(
    api: OT3API, mount: OT3Mount, offset: Point, relative_offset: Point
) -> Point:
    calibration_with_offset = _apply_relative_offset(offset, relative_offset)
    if mount == OT3Mount.GRIPPER:
        helpers_ot3.set_gripper_offset_ot3(api, calibration_with_offset)
    else:
        helpers_ot3.set_pipette_offset_ot3(api, mount, calibration_with_offset)
    return calibration_with_offset


async def _init_deck_and_pipette_coordinates(
    api: OT3API, mount: OT3Mount, slot: int, no_washers: bool, short_probe: bool
) -> Point:
    calibration_square_pos = helpers_ot3.get_slot_calibration_square_position_ot3(slot)
    if not no_washers:
        # FIXME: remove this extra height, once longer probe is ready
        calibration_square_pos += Point(z=Z_OFFSET_FROM_WASHERS)
    if mount != OT3Mount.GRIPPER:
        # do this early on, so that all coordinates are using the probe's length
        if short_probe:
            await api.add_tip(mount, helpers_ot3.CALIBRATION_PROBE_EVT.length - 10)
        else:
            await api.add_tip(mount, helpers_ot3.CALIBRATION_PROBE_EVT.length)
    return calibration_square_pos


def _save_to_disk(mount: OT3Mount, instrument_id: str, new_offset: Point) -> None:
    if "y" in input(f"New Offset: {new_offset}\n--> Save to Disk? (y/n): ").lower():
        if mount == OT3Mount.GRIPPER:
            save_gripper_calibration(new_offset, instrument_id)
        else:
            save_pipette_calibration(new_offset, instrument_id, mount.to_mount())
        print("offset saved")
    else:
        print("offset NOT saved")


async def _main(
    simulate: bool,
    slot: int,
    mount: OT3Mount,
    test: bool,
    relative_offset: Point,
    no_washers: bool = False,
    short_probe: bool = False,
) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate, use_defaults=True
    )
    instr_id = _get_instrument_id(api, mount)
    print(
        f"\nStarting Manual Calibration on Deck Slot #{slot} and Instrument {instr_id}:\n"
    )

    # apply the (optional) relative offset passed in
    if mount == OT3Mount.GRIPPER:
        loaded_offset = helpers_ot3.get_gripper_offset_ot3(api)
    else:
        loaded_offset = helpers_ot3.get_pipette_offset_ot3(api, mount)
    print(f"loaded instrument offset: {loaded_offset}")
    instrument_offset = _apply_offset(api, mount, loaded_offset, relative_offset)

    # Initialize deck slot position
    calibration_square_pos = await _init_deck_and_pipette_coordinates(
        api, mount, slot, no_washers, short_probe
    )

    await api.home()

    # find
    if not test:
        found_square_pos = await _find_the_square(api, mount, calibration_square_pos)
        found_offset = calibration_square_pos - found_square_pos
        instrument_offset = _apply_offset(api, mount, found_offset, relative_offset)
        _save_to_disk(mount, instr_id, instrument_offset)

    # test
    if mount == OT3Mount.GRIPPER:
        # make sure we use the un-altered slot position
        slot_center = helpers_ot3.get_slot_calibration_square_position_ot3(slot)
        # default assume the probes are accidentally attached
        # we can jog the Z up/down after it's positioned
        test_z = GRIPPER_PROBE_LENGTH + 2
        test_pos = slot_center._replace(z=test_z)
    else:
        # use whatever point we used during calibration
        test_pos = calibration_square_pos
    additional_offset = await _test_current_calibration(api, mount, test_pos)

    # adjust
    if mount == OT3Mount.GRIPPER and additional_offset != Point():
        res = input(
            f"additional offset {additional_offset}, apply to current calibrated offset? (y/n): "
        )
        if res and res[0].lower() == "y":
            relative_offset += additional_offset
            instrument_offset = _apply_offset(
                api, mount, instrument_offset, relative_offset
            )

    # save
    if not test or relative_offset != Point():
        _save_to_disk(mount, instr_id, instrument_offset)

    # done
    await api.home()


if __name__ == "__main__":
    print("\nOT-3 Manual Calibration\n")
    arg_parser = argparse.ArgumentParser(description="OT-3 Manual Calibration")
    arg_parser.add_argument(
        "--mount", choices=["left", "right", "gripper"], required=True
    )
    arg_parser.add_argument("--slot", type=int, default=5)
    arg_parser.add_argument("--test", action="store_true")
    arg_parser.add_argument("--simulate", action="store_true")
    arg_parser.add_argument("--rel-offset", nargs=3)
    arg_parser.add_argument("--no-washers", action="store_true")
    arg_parser.add_argument("--short-probe", action="store_true")
    args = arg_parser.parse_args()
    ot3_mounts = {
        "left": OT3Mount.LEFT,
        "right": OT3Mount.RIGHT,
        "gripper": OT3Mount.GRIPPER,
    }
    _mount = ot3_mounts[args.mount]
    if args.rel_offset:
        rel_offset = Point(*[float(v) for v in args.rel_offset])
    else:
        rel_offset = Point()
    asyncio.run(
        _main(
            args.simulate,
            args.slot,
            _mount,
            args.test,
            rel_offset,
            args.no_washers,
            args.short_probe,
        )
    )
