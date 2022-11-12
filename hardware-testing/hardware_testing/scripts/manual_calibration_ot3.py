"""OT-3 Manual Calibration."""
import asyncio
import argparse

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.calibration_storage.ot3.pipette_offset import (
    save_pipette_calibration as save_offset_ot3,
)

SAFE_Z = 10
XY_STEP_SIZE = 0.1


def _get_z_probe_pos(square_pos: Point) -> Point:
    square = helpers_ot3.CALIBRATION_SQUARE_EVT
    probe = helpers_ot3.CALIBRATION_PROBE_EVT
    safe_z_probe_offset = (square.width / 2) + (probe.diameter / 2)
    z_probe_pos = square_pos + Point(x=safe_z_probe_offset, y=safe_z_probe_offset)
    return z_probe_pos


async def _jog_axis(api: OT3API, mount: OT3Mount, axis: OT3Axis, dir: float) -> None:
    step = XY_STEP_SIZE
    while True:
        inp = input(f'<ENTER> key to jog {step} mm, or type "yes" to save position: ')
        if not inp:
            ax = axis.name.lower()[0]
            await api.move_rel(mount, Point(**{ax: step * dir}))
        if inp:
            if inp.lower()[0] == "y":
                return
            else:
                try:
                    step = float(f"0.{inp}")
                except ValueError:
                    pass


async def main(simulate: bool, slot: int, mount: OT3Mount, test: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate, use_defaults=True
    )
    # Get pipette id
    pipette = api.hardware_pipettes[mount.to_mount()]
    assert pipette, f"No pipette found on mount: {mount}"
    print(
        f"\nStarting Manual Calibration on Deck Slot #{slot} and Pipette {pipette.pipette_id}:\n"
    )

    # Initialize deck slot position
    calibration_square_pos = helpers_ot3.get_slot_calibration_square_position_ot3(slot)
    z_probe_pos = _get_z_probe_pos(calibration_square_pos)

    # Home gantry
    await api.home()
    await api.add_tip(mount, helpers_ot3.CALIBRATION_PROBE_EVT.length)
    home_position = await api.gantry_position(mount)

    # Check to see what the current calibration looks like
    if test:
        current_pos = await api.gantry_position(mount)
        await api.move_to(mount, calibration_square_pos._replace(z=current_pos.z))
        input("ENTER to test previous calibration")
        await api.move_to(mount, calibration_square_pos)
        input("ENTER to re-home")
        await api.home()

    # Reset the current calibration, so no offset is applied during procedure
    helpers_ot3.set_pipette_offset_ot3(api, mount, Point(x=0, y=0, z=0))

    # Move above slot Z center
    above_point = z_probe_pos._replace(z=home_position.z)
    await api.move_to(mount, above_point)
    input("\nRemove all items from deck and press ENTER\n")
    await api.move_to(mount, z_probe_pos + Point(z=SAFE_Z))

    # Jog gantry to find deck height
    print("\n--> Jog to find Z position")
    await _jog_axis(api, mount, OT3Axis.by_mount(mount), -1)
    current_position = await api.gantry_position(mount)
    await api.move_rel(mount, Point(z=SAFE_Z))
    deck_height = float(current_position.z)
    print(f"Found Z = {deck_height}mm")

    # Move to slot center
    current_position = await api.gantry_position(mount)
    await api.move_to(mount, calibration_square_pos._replace(z=current_position.z))
    input("\nPress ENTER to calibrate XY axes")
    xy_start_pos = calibration_square_pos._replace(z=deck_height - 1)
    await api.move_to(mount, xy_start_pos)

    probe_radius = helpers_ot3.CALIBRATION_PROBE_EVT.diameter / 2

    # move to the RIGHT until we hit the square edge
    await _jog_axis(api, mount, OT3Axis.X, 1)
    current_position = await api.gantry_position(mount)
    left_square = current_position.x + probe_radius
    x_center = left_square - (helpers_ot3.CALIBRATION_SQUARE_EVT.width / 2)
    print(f"Found X = {x_center}mm")

    # move back to center of square
    await api.move_to(mount, xy_start_pos)

    # move to the FRONT until we hit the square edge
    await _jog_axis(api, mount, OT3Axis.Y, -1)
    current_position = await api.gantry_position(mount)
    bottom_square = current_position.y - probe_radius
    y_center = bottom_square + (helpers_ot3.CALIBRATION_SQUARE_EVT.height / 2)
    print(f"Found Y = {y_center}mm")

    # Show final calibration results
    found_square_pos = Point(x=x_center, y=y_center, z=deck_height)
    print(f"\nSlot #{slot} Center Position = {found_square_pos}")

    # Save pipette offsets
    offset_position = calibration_square_pos - found_square_pos
    helpers_ot3.set_pipette_offset_ot3(api, mount, offset_position)
    # move back to center of square
    await api.move_to(mount, calibration_square_pos)
    if "y" in input("\n--> Save Pipette Offset? (y/n): ").lower():
        save_offset_ot3(offset_position, pipette.pipette_id, mount.to_mount())
        print("pipette offset saved")


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
    asyncio.run(main(args.simulate, args.slot, _mount, args.test))
