import curses
import asyncio
import argparse

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api import helpers_ot3

DEFAULT_STEP_SIZE = 10
DEFAULT_STEP_INDEX = 3

STEP_LIST = [0.1, 1, 5, 10, 20, 40]
MIN_STEP_INDEX = 0
MAX_STEP_INDEX = len(STEP_LIST) - 1
STARTING_MOUNT = OT3Mount.RIGHT

async def begin_z_leveling(
    stdscr, api: OT3API, mount: OT3Mount
) -> None:
    step_index = DEFAULT_STEP_INDEX
    stdscr.erase()
    while True:
        c = stdscr.getkey()
        stdscr.addstr(f"Received {c} character")
        stdscr.refresh()
        if c == '-':
            stdscr.addstr("Reducing step size")
            temp_idx = step_index - 1
            step_index = min(temp_idx, MIN_STEP_INDEX)
        elif c == '=':
            stdscr.addstr("Increasing step size")
            temp_idx = step_index + 1
            step_index = min(temp_idx, MAX_STEP_INDEX)
        elif c == 'l':
            stdscr.addstr("Changing Mount to Left")
            mount = OT3Mount.LEFT
        elif c == 'r':
            stdscr.addstr("Changing Mount to Right")
            mount = OT3Mount.RIGHT
        elif c == 'j':
            stdscr.addstr("Beginngin jog routine")
            await jog_axis(stdscr, api, mount, step_index)
        elif c == 's':
            stdscr.addstr("Select next slot to move to by inputing numbers 1-11")
            await api.home_z()
            next_slot = None
            while not next_slot:
                next_slot = stdscr.getkey()
            stdscr.addstr(f"Got slot {next_slot}")
            calibration_square_pos = helpers_ot3.get_slot_calibration_square_position_ot3(int(next_slot))
            stdscr.addstr(f"Calibration square pos {calibration_square_pos}")
            await api.move_to(mount, calibration_square_pos._replace(z=30))


async def jog_axis(stdscr, api: OT3API, mount: OT3Mount, step_index: int):
    CONTINUE_JOG = True
    z = False
    while CONTINUE_JOG:
        c = stdscr.getkey()
        stdscr.refresh()
        stdscr.addstr(f"In jog, received {c} character")
        amount = STEP_LIST[step_index]
        if c == 'z':
            z = not z
        elif c == curses.KEY_LEFT:
            stdscr.addstr(f"Jogging left")
            await api.move_rel(mount, Point(x=amount * -1, y=0, z=0))
        elif c == curses.KEY_RIGHT:
            await api.move_rel(mount, Point(x=amount, y=0, z=0))
        elif c == curses.KEY_UP and z:
            await api.move_rel(mount, Point(x=0, y=0, z=amount))
        elif c == curses.KEY_DOWN and z:
            await api.move_rel(mount, Point(x=0, y=0, z=amount * -1))
        elif c == curses.KEY_UP:
            await api.move_rel(mount, Point(x=0, y=amount, z=0))
        elif c == curses.KEY_DOWN:
            await api.move_rel(mount, Point(x=0, y=amount * -1, z=0))
        elif c == 'n':
            stdscr.addstr("Exiting jog.")
            CONTINUE_JOG = False

async def _main(stdscr, simulating) -> None:
    stdscr.refresh()
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulating, use_defaults=True
    )
    await api.home()
    stdscr.erase()
    stdscr.addstr("Homing Finished")
    stdscr.erase()
    await begin_z_leveling(stdscr, api, STARTING_MOUNT)
    return None

def main(stdscr, simulating) -> None:
    asyncio.run(_main(stdscr, simulating))

if __name__ == "__main__":
    print("\nOT-3 Z stage leveling\n")
    arg_parser = argparse.ArgumentParser(description="OT-3 Z stage leveling")
    arg_parser.add_argument("--simulate", type=bool, default=False)
    args = arg_parser.parse_args()

    curses.wrapper(main, args.simulate)
