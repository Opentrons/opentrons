"""OT-3 Manual Calibration."""
import asyncio
import argparse
import termios
import sys, tty

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.calibration_storage.ot3.pipette_offset import (
    save_pipette_calibration as save_offset_ot3,
)

SAFE_Z = 10
XY_STEP_SIZE = 0.1
Z_OFFSET_FROM_WASHERS = 100

def getch():
    def _getch():
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            ch = sys.stdin.read(1)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        return ch
    return _getch()

async def _jog_axis(api: OT3API, mount: OT3Mount, axis: OT3Axis) -> None:
    ax = axis.name.lower()[0]
    step_size = [0.1, 0.5, 1, 10, 20]
    step_length_index = 3
    step = step_size[step_length_index]
    while True:
        input = getch()
        if input == 'a':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X]-step,
                                        pos[OT3Axis.Y],
                                        pos[OT3Axis.by_mount(mount)]))
        elif input == 's':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X]+step,
                                        pos[OT3Axis.Y],
                                        pos[OT3Axis.by_mount(mount)]))
        elif input == 'w':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X],
                                        pos[OT3Axis.Y]+step,
                                        pos[OT3Axis.by_mount(mount)]))
                                        # speed = 40)
        elif input == 'z':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X],
                                        pos[OT3Axis.Y]-step,
                                        pos[OT3Axis.by_mount(mount)]))
                                        # speed = 40)
        elif input == 'i':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X]+step,
                                        pos[OT3Axis.Y],
                                        pos[OT3Axis.by_mount(mount)]-step))
        elif input == 'k':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            await api.move_to(mount,
                                Point(pos[OT3Axis.X],
                                        pos[OT3Axis.Y],
                                        pos[OT3Axis.by_mount(mount)]-step))

        elif input == '+':
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 4:
                step_length_index = 4
            step = step_size[step_length_index]

        elif input == '-':
            sys.stdout.flush()
            step_length_index = step_length_index -1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == '\r':
            sys.stdout.flush()
            pos = await api.current_position_ot3(mount)
            return pos

        current_position = await api.current_position_ot3(mount)
        print("Coordinates: X: {} Y: {} Z: {}".format(
                            round(current_position[OT3Axis.X],2),
                            round(current_position[OT3Axis.Y],2),
                            round(current_position[OT3Axis.by_mount(mount)],2)),
                            "      Motor Step: ",
                            step_size[step_length_index],
                            end='')
        print('\r', end='')

async def _main(simulate: bool, slot: int, mount: OT3Mount, test: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate, use_defaults=True
    )
    # Get pipette id
    pipette = api.hardware_pipettes[mount.to_mount()]
    assert pipette, f"No pipette found on mount: {mount}"
    print(
        f"\nStarting Calibration on Deck Slot #{slot} and Pipette {pipette.pipette_id}:\n"
    )

    # Home gantry
    await api.home()
    # await api.add_tip(mount, helpers_ot3.CALIBRATION_PROBE_EVT.length)
    home_position = await api.gantry_position(mount)
    pos = await api.current_position_ot3(mount)
    print(pos)
    await api.move_to(mount, Point(160 ,150, pos[OT3Axis.by_mount(mount)]))
    await _jog_axis(api, mount, OT3Axis.by_mount(mount))
    await api.pick_up_tip(mount, tip_length = 57.3)
    await home_z(mount)
    await move_to(mount, Point(300, 150, pos[OT3Axis.by_mount(mount)]))
    await _jog_axis(api, mount, OT3Axis.by_mount(mount))

if __name__ == "__main__":
    arg_parser = argparse.rser(description="OT-3 Manual Calibration")
    arg_parser.add_argument(
        "--mount", choices=["left", "right", "gripper"], required=True
    )
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
