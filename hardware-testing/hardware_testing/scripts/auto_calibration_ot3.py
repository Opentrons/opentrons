"""OT-3 Auto Calibration."""
import asyncio
import argparse
import curses
import re

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_pipette,
    calibrate_gripper,
)

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point, GripperProbe
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.calibration_storage.ot3.pipette_offset import (
    save_pipette_calibration as save_offset_ot3,
)

CHECKPOINT_RE = re.compile("(?P<x>\d+(\.\d*)?)\,(?P<y>\d+(\.\d*)?)\)?", re.X)
CHECKPOINT_Z_SAFE_HEIGHT = 10.0
STEP_SIZES_MM = [0.01, 0.05, 0.1, 0.5, 1.0, 5.0]


async def update_screen(stdscr, api, mount, step_index):
    stdscr.addstr(9, 0, f"Current location: {await api.gantry_position(mount)}\n")
    stdscr.addstr(10, 0, f"Current step size (mm): {STEP_SIZES_MM[step_index]}\n")


async def handle_probe(api, mount):
    while True:
        a = input("Attach calibration probe to the pipette and press Enter\n")
        if a == "":
            break
    if mount == OT3Mount.GRIPPER:
        api.add_gripper_probe(GripperProbe.FRONT)
    else:
        await api.add_tip(mount, api.config.calibration.probe_length)


async def gripper_calibration_sequence(api):
    print("Begin calibration for gripper front probe:\n")

    front_result = await calibrate_gripper(api, GripperProbe.FRONT)
    print(f"Front offset: {front_result}")

    print("Begin calibration for gripper back probe:\n")
    while True:
        a = input(
            "Remove calibration probe from the front and attach the back and press Enter\n"
        )
        if a == "":
            break

    back_result = await calibrate_gripper(api, GripperProbe.REAR)
    print(f"back offset: {back_result}")
    api.add_gripper_probe(GripperProbe.REAR)
    return back_result - front_result


async def pipette_calibration_sequence(api, mount):
    print("Begin calibration for pipette:\n")
    pipette_result = await calibrate_pipette(api, mount)
    await api.add_tip(mount, api.config.calibration.probe_length)
    return pipette_result


async def _jog_z_axis(api: OT3API, mount: OT3Mount) -> Point:
    step_idx = 2
    stdscr = curses.initscr()
    curses.noecho()
    stdscr.keypad(1)
    stdscr.addstr(
        0,
        0,
        "Checking reference location without instrument offset:\n",
        curses.A_STANDOUT,
    )

    stdscr.addstr(
        2,
        0,
        "Instrument is current at the reference xy location, with a z height of "
        f"{CHECKPOINT_Z_SAFE_HEIGHT} mm.\n Jog the gantry in the z axis so the probe "
        "is flushed with the deck. \nKeep note of this location",
    )

    stdscr.addstr(5, 0, f"+/-: change step size, available sizes are {STEP_SIZES_MM}\n")
    stdscr.addstr(6, 0, "UP/DOWN arrow: move z up and down\n")
    stdscr.addstr(7, 0, "esc: exit and save current position as reference point\n")
    await update_screen(stdscr, api, mount, step_idx)

    try:
        while True:
            inp = stdscr.getch()
            if inp == 43:  # b'+'
                step_idx += 1 if step_idx < (len(STEP_SIZES_MM) - 1) else 0
            elif inp == 45:  # b'-'
                step_idx -= 1 if step_idx > 0 else 0
            elif inp == curses.KEY_UP:
                await api.move_rel(mount, Point(0, 0, STEP_SIZES_MM[step_idx]))
            elif inp == curses.KEY_DOWN:
                await api.move_rel(mount, Point(0, 0, STEP_SIZES_MM[step_idx] * -1))
            elif inp == 27:  # ESC
                return await api.gantry_position(mount)
            await update_screen(stdscr, api, mount, step_idx)
            stdscr.refresh()
    finally:
        curses.endwin()


async def _main(simulate: bool, slot: int, mount: OT3Mount, checkpoint: Point) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate,
        pipette_left="p1000_single_v3.3",
        pipette_right="p1000_single_v3.3",
        gripper="GRPV102",
        use_defaults=True,
    )
    # Get pipette id
    if mount == OT3Mount.GRIPPER:
        instr = api._gripper_handler.get_gripper()
        instr_id = instr.gripper_id
    else:
        instr = api._pipette_handler.get_pipette(mount)
        instr_id = instr.pipette_id
    print(
        f"\nStarting Auto-Calibration on Deck Slot #{slot} and Insturment {instr_id}:\n"
    )
    print(
        f"Moving instrument {instr_id} to checkpoint: {checkpoint} without instrument offset\n"
    )

    # Home gantry
    await api.home()
    # Clear instrument offset
    await api.reset_instrument_offset(mount)
    homed_pos = await api.gantry_position(mount)
    # Move to check point
    await api.move_to(mount, checkpoint._replace(z=homed_pos.z))

    await handle_probe(api, mount)

    await api.move_to(mount, checkpoint)

    checkpoint = await _jog_z_axis(api, mount)

    # Perform calibration
    await api.home_z()

    if mount == OT3Mount.GRIPPER:
        api.remove_gripper_probe()
        offset = await gripper_calibration_sequence(api)
    else:
        # calibrate pipette adds a tip
        await api.remove_tip(mount)
        offset = await pipette_calibration_sequence(api, mount)

    print(f"Instrument offset: {offset}")
    await api.move_to(mount, checkpoint)
    checkpoint = await _jog_z_axis(api, mount)


def to_point(s):
    try:
        matches = CHECKPOINT_RE.match(s)
        return Point(
            float(matches.group("x")),
            float(matches.group("y")),
            CHECKPOINT_Z_SAFE_HEIGHT,
        )
    except (TypeError, AttributeError):
        raise argparse.ArgumentTypeError("Check point must be (x,y)")


if __name__ == "__main__":
    print("\nOT-3 Auto-Calibration\n")
    arg_parser = argparse.ArgumentParser(description="OT-3 Auto-Calibration")
    arg_parser.add_argument(
        "--mount", "-m", choices=["left", "right", "gripper"], required=True
    )
    arg_parser.add_argument("--simulate", action="store_true")
    arg_parser.add_argument("--slot", type=int, default=5)
    arg_parser.add_argument("--xycheckpoint", type=to_point, required=True)
    args = arg_parser.parse_args()
    ot3_mounts = {
        "left": OT3Mount.LEFT,
        "right": OT3Mount.RIGHT,
        "gripper": OT3Mount.GRIPPER,
    }
    _mount = ot3_mounts[args.mount]
    asyncio.run(_main(args.simulate, args.slot, _mount, args.xycheckpoint))
