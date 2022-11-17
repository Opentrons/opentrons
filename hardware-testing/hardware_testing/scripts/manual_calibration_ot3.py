"""OT-3 Manual Calibration."""
import asyncio
import argparse
from typing import Optional

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point, CriticalPoint
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.calibration_storage.ot3.pipette_offset import save_pipette_calibration
from opentrons.calibration_storage.ot3.gripper_offset import save_gripper_calibration

SAFE_Z = 10
XY_STEP_SIZE = 0.1
Z_OFFSET_FROM_WASHERS = 3.0

# Height of the bottom of a probe above the deck.
# Must be high enough for the user to reach under to change probes,
# but low enough to be within all mounts' extents.
PROBE_CHANGE_Z = 100

# size of the aluminum block used to visually check gripper calibration
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


async def _test_current_calibration(api: OT3API, mount: OT3Mount, pos: Point) -> None:
    cp: Optional[CriticalPoint] = None
    if mount == OT3Mount.GRIPPER:
        cp = CriticalPoint.GRIPPER_JAW_CENTER

    current_pos = await api.gantry_position(mount, critical_point=cp)
    await api.move_to(mount, pos._replace(z=current_pos.z), critical_point=cp)

    if mount == OT3Mount.GRIPPER:
        input("add the calibration block to the slot, then press ENTER")
    else:
        input("ENTER to move to center of slot to test Pipette calibration")

    if mount == OT3Mount.GRIPPER:
        await api.home_gripper_jaw()
        await api.move_to(mount, pos, critical_point=cp)
        jaw_width = 90
        while True:
            res = input('press ENTER to close jaws 1mm more; type "yes" to stop')
            if not res:
                jaw_width -= 1
                await api.hold_jaw_width(jaw_width)
            elif res.strip().lower()[0] == "y":
                break
        await api.home_gripper_jaw()
    else:
        await api.move_to(mount, pos, critical_point=cp)


async def _jog_axis(
    api: OT3API, mount: OT3Mount, axis: OT3Axis, direction: float
) -> None:
    step = XY_STEP_SIZE
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
                    if tmp_step < 0.0 or tmp_step > 1.0:
                        print("Cannot jog greater than 1.0 mm")
                        continue
                    else:
                        step = tmp_step
                except ValueError:
                    pass


async def _find_square_center(
    api: OT3API,
    mount: OT3Mount,
    expected_pos: Point,
    critical_point: Optional[CriticalPoint] = None,
) -> Point:
    # Move above slot Z center
    z_probe_pos = _get_z_probe_pos(expected_pos)
    current_position = await api.gantry_position(mount, critical_point=critical_point)
    above_point = z_probe_pos._replace(z=current_position.z)
    await api.move_to(mount, above_point, critical_point=critical_point)
    input("\nRemove all items from deck and press ENTER\n")
    await api.move_to(
        mount, z_probe_pos + Point(z=SAFE_Z), critical_point=critical_point
    )

    # Jog gantry to find deck height
    print("\n--> Jog to find Z position")
    await _jog_axis(api, mount, OT3Axis.by_mount(mount), -1)
    current_position = await api.gantry_position(mount, critical_point=critical_point)
    await api.move_rel(mount, Point(z=SAFE_Z))
    deck_height = float(current_position.z)
    print(f"Found Z = {deck_height}mm")

    # Move to slot center
    current_position = await api.gantry_position(mount, critical_point=critical_point)
    await api.move_to(
        mount,
        expected_pos._replace(z=current_position.z),
        critical_point=critical_point,
    )
    input("\nPress ENTER to calibrate XY axes")
    xy_start_pos = expected_pos._replace(z=deck_height - 1)
    await api.move_to(mount, xy_start_pos, critical_point=critical_point)

    probe_radius = helpers_ot3.CALIBRATION_PROBE_EVT.diameter / 2

    # move to the RIGHT until we hit the square edge
    await _jog_axis(api, mount, OT3Axis.X, 1)
    current_position = await api.gantry_position(mount, critical_point=critical_point)
    right_square = current_position.x + probe_radius
    x_center = right_square - (helpers_ot3.CALIBRATION_SQUARE_EVT.width / 2)
    print(f"Found X = {x_center}mm")

    # move back to center of square
    await api.move_to(mount, xy_start_pos, critical_point=critical_point)

    # move to the FRONT until we hit the square edge
    await _jog_axis(api, mount, OT3Axis.Y, -1)
    current_position = await api.gantry_position(mount, critical_point=critical_point)
    bottom_square = current_position.y - probe_radius
    y_center = bottom_square + (helpers_ot3.CALIBRATION_SQUARE_EVT.height / 2)
    print(f"Found Y = {y_center}mm")

    # Show final calibration results
    found_square_pos = Point(x=x_center, y=y_center, z=deck_height)
    print(f"\nSlot Center Position = {found_square_pos}")
    return found_square_pos


async def _find_square_center_of_gripper_jaw(api: OT3API, expected_pos: Point) -> Point:
    input("add probe to Gripper FRONT, then press ENTER: ")
    grip_cp = CriticalPoint.GRIPPER_FRONT_CALIBRATION_PIN
    found_square_front = await _find_square_center(
        api,
        OT3Mount.GRIPPER,
        expected_pos,
        critical_point=grip_cp,
    )
    input("Press ENTER to move to found center:")
    await api.move_to(
        OT3Mount.GRIPPER,
        found_square_front,
        critical_point=grip_cp,
    )
    input("Check by EYE, then press ENTER to continue")
    current_position = await api.gantry_position(
        OT3Mount.GRIPPER,
        critical_point=grip_cp,
    )
    await api.move_to(
        OT3Mount.GRIPPER,
        current_position + Point(z=PROBE_CHANGE_Z),
        critical_point=grip_cp,
    )
    input("add probe to Gripper BACK, then press ENTER: ")
    grip_cp = CriticalPoint.GRIPPER_BACK_CALIBRATION_PIN
    found_square_back = await _find_square_center(
        api,
        OT3Mount.GRIPPER,
        expected_pos,
        critical_point=grip_cp,
    )
    input("Press ENTER to move to found center:")
    await api.move_to(
        OT3Mount.GRIPPER,
        found_square_back,
        critical_point=grip_cp,
    )
    input("Check by EYE, then press ENTER to continue")
    current_position = await api.gantry_position(
        OT3Mount.GRIPPER,
        critical_point=grip_cp,
    )
    await api.move_to(
        OT3Mount.GRIPPER,
        current_position + Point(z=PROBE_CHANGE_Z),
        critical_point=grip_cp,
    )
    input("Remove probe from Gripper, then press ENTER: ")
    # average the two probes together
    found_square_pos = 0.5 * (found_square_front + found_square_back)
    return found_square_pos


async def _main(simulate: bool, slot: int, mount: OT3Mount, test: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate, use_defaults=True
    )
    instr_id = _get_instrument_id(api, mount)
    print(
        f"\nStarting Manual Calibration on Deck Slot #{slot} and Instrument {instr_id}:\n"
    )

    # Initialize deck slot position
    ideal_square_pos = helpers_ot3.get_slot_calibration_square_position_ot3(slot)
    # FIXME: remove this extra height, once longer probe is ready
    calibration_square_pos = ideal_square_pos + Point(z=Z_OFFSET_FROM_WASHERS)
    if mount != OT3Mount.GRIPPER:
        # do this early on, so that all coordinates are using the probe's length
        await api.add_tip(mount, helpers_ot3.CALIBRATION_PROBE_EVT.length)

    # Home gantry
    await api.home()

    # Check to see what the current calibration looks like
    if mount == OT3Mount.GRIPPER:
        slot_loc_top_left = helpers_ot3.get_slot_top_left_position_ot3(slot)
        # use the aluminum block, to more precisely check location
        test_pos = slot_loc_top_left + (GRIPPER_TEST_BLOCK_SIZE * 0.5)
    else:
        test_pos = calibration_square_pos

    # test position, then quit the script
    if test:
        await _test_current_calibration(api, mount, test_pos)
        input("ENTER to re-home")
        await api.home()
        return

    # Reset the current calibration, so no offset is applied during procedure
    if mount == OT3Mount.LEFT or mount == OT3Mount.RIGHT:
        helpers_ot3.set_pipette_offset_ot3(api, mount, Point(x=0, y=0, z=0))
    else:
        helpers_ot3.set_gripper_offset_ot3(api, Point(x=0, y=0, z=0))

    # run the calibration procedure
    if mount != OT3Mount.GRIPPER:
        input("add probe to Pipette, then press ENTER: ")
        found_square_pos = await _find_square_center(api, mount, calibration_square_pos)
    else:
        found_square_pos = await _find_square_center_of_gripper_jaw(
            api, calibration_square_pos
        )

    # Save pipette offsets
    offset_position = calibration_square_pos - found_square_pos
    if mount == OT3Mount.GRIPPER:
        helpers_ot3.set_gripper_offset_ot3(api, offset_position)
    else:
        helpers_ot3.set_pipette_offset_ot3(api, mount, offset_position)

    # visually check that it is OK before saving
    await _test_current_calibration(api, mount, test_pos)
    if "y" in input(f"{offset_position}\n--> Save Offset? (y/n): ").lower():
        if mount == OT3Mount.GRIPPER:
            save_gripper_calibration(offset_position, str(instr_id))
        else:
            save_pipette_calibration(offset_position, instr_id, mount.to_mount())
        print("offset saved")
    else:
        print("offset NOT saved")

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
    args = arg_parser.parse_args()
    ot3_mounts = {
        "left": OT3Mount.LEFT,
        "right": OT3Mount.RIGHT,
        "gripper": OT3Mount.GRIPPER,
    }
    _mount = ot3_mounts[args.mount]
    asyncio.run(_main(args.simulate, args.slot, _mount, args.test))
