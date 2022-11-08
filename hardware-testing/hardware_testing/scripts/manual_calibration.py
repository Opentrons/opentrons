"""OT-3 Manual Calibration."""
import asyncio
import argparse
import time

from opentrons.hardware_control.ot3api import OT3API
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
    jog_mount_ot3,
)
from opentrons_shared_data.deck import load
from opentrons.calibration_storage.ot3.pipette_offset import save_pipette_calibration

# List of gantry axes
list_axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]

# Load deck definition
deck_definition = load("ot3_standard", version=3)

# Capacitive probe length
PROBE_LENGTH = 34.5

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Manual Calibration')
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be calibrated', default='l')
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this script')
    return arg_parser

async def _run_manual_calibration(api: OT3API, mount: OT3Mount, slot: int) -> None:
    # Get pipette id
    pipette_id = api._pipette_handler.get_pipette(mount)._pipette_id
    print(f"\nStarting Manual Calibration on Deck Slot #{slot} and Pipette {pipette_id}:\n")

    # Initialize deck slot position
    CORNER = Point(*deck_definition["locations"]["orderedSlots"][slot - 1]["position"])
    CENTER_XY = Point(CORNER.x + 124.0 / 2, CORNER.y + 82.0 / 2, 50)
    CENTER_Z = Point(CORNER.x + 76, CORNER.y + 54, 100)

    # Home grantry
    await home_ot3(api, list_axes)

    # Move above slot Z center
    home_position = await api.gantry_position(mount)
    above_point = CENTER_Z._replace(z=home_position.z)
    await api.move_to(mount, above_point)

    input("\n--> Calibrate Deck Height? (Remove all items from deck and press ENTER)\n")

    # Move to Z-axis center position
    await api.move_to(mount, CENTER_Z)

    # Jog gantry to find deck height
    print("\n--- Jog Z-Axis to find deck height! ---")
    deck_position = await jog_mount_ot3(api, mount)
    deck_height = round(deck_position[OT3Axis.by_mount(mount)], 3)
    print(f"Deck Height = {deck_height}mm")

    # Home Z-axis
    current_position = await api.gantry_position(mount)
    home_z = current_position._replace(z=home_position.z)
    await api.move_to(mount, home_z)

    input("\n--> Calibrate Slot Center? (Remove all items from deck and press ENTER)\n")

    # Move to slot center
    await api.move_to(mount, CENTER_XY)

    # Jog gantry to find slot center
    print("\n--- Jog X-axis and Y-axis to find slot center! ---")
    deck_position = await jog_mount_ot3(api, mount)
    x_center = round(deck_position[OT3Axis.X], 3)
    y_center = round(deck_position[OT3Axis.Y], 3)
    print(f"X Center = {x_center}mm")
    print(f"Y Center = {y_center}mm")

    # Show final calibration results
    slot_center = Point(x=x_center,y=y_center,z=deck_height)
    print(f"\nSlot #{slot} Center Position = {slot_center}")

    # Save pipette offsets
    save_offset = input("\n--> Save Pipette Offset? (y/N): " or "n")
    if save_offset == "y" or save_offset == "Y":
        offset_position = Point(x=x_center - CENTER_XY.x, y=y_center - CENTER_XY.y, z=deck_height)
        save_pipette_calibration(offset_position, pipette_id, mount)
        print("Pipette Offset Saved!")

    # Home Z-axis
    current_position = await api.gantry_position(mount)
    home_z = current_position._replace(z=home_position.z)
    await api.move_to(mount, home_z)

    # Move next to home
    await api.move_to(mount, home_position + Point(x=-5, y=-5, z=0))

async def exit(api: OT3API) -> None:
    await api.disengage_axes(list_axes)

async def main(simulate: bool, slot: int) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=simulate, use_defaults=True)
    mount = OT3Mount.LEFT if args.mount == "l" else OT3Mount.RIGHT
    await api.add_tip(mount, PROBE_LENGTH)
    try:
        await _run_manual_calibration(api, mount, slot)
    except Exception as e:
        await exit(api)
        raise e
    except KeyboardInterrupt:
        await exit(api)
        print("Calibration Cancelled!")
    finally:
        await exit(api)
        print("Calibration Completed!")

if __name__ == '__main__':
    print("\nOT-3 Manual Calibration\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    asyncio.run(main(args.simulate, args.slot))
