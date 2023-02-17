"""Z-Stage Leveling."""
import curses
import asyncio
import argparse

from typing import Any
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import OT3Mount, Point
from hardware_testing.opentrons_api import helpers_ot3

DEFAULT_STEP_SIZE = 10
DEFAULT_STEP_INDEX = 3

STEP_LIST = [0.1, 1, 5, 10, 20]
MIN_STEP_INDEX = 0
MAX_STEP_INDEX = len(STEP_LIST) - 1
STARTING_MOUNT = OT3Mount.RIGHT


async def _refresh_jog_window(jog_win: Any) -> None:
    jog_win.addstr("Jogging Tool\n")
    jog_win.addstr("Commands include: \n")
    jog_win.addstr("w -> move robot backwards\n")
    jog_win.addstr("a -> move robot left\n")
    jog_win.addstr("s -> move robot forwards\n")
    jog_win.addstr("d -> move robot right\n")
    jog_win.insertln()
    jog_win.addstr("- -> decrease increment\n")
    jog_win.addstr("= -> increase increment\n")
    jog_win.insertln()
    jog_win.addstr("z -> change to and from jogging mount\n")
    jog_win.insertln()
    jog_win.addstr("n -> exit jog tool\n")
    jog_win.redrawwin()
    jog_win.refresh()


async def _refresh_intro_window(intro_win: Any) -> None:
    intro_win.addstr("Z Leveling Script\n")
    intro_win.addstr("Commands include: \n")
    intro_win.insertln()
    intro_win.addstr("l -> change mount to left\n")
    intro_win.addstr("r -> change mount to right\n")
    intro_win.addstr("j -> enter jog mode\n")
    intro_win.addstr("s -> move to new slot\n")
    intro_win.redrawwin()
    intro_win.refresh()


async def begin_z_leveling(stdscr: Any, api: OT3API, mount: OT3Mount) -> None:
    """Begin Z Leveling.

    Main application that runs continuously until CTRL-C is pressed.
    """
    intro_win = stdscr.derwin(0, 0)
    await _refresh_intro_window(intro_win)

    y, x = intro_win.getyx()
    stdscr.move(y, x)
    while True:
        c = stdscr.getkey()
        stdscr.addstr(f"Received {c} character\n")
        if c == "l":
            stdscr.addstr("Changing Mount to Left\n")
            stdscr.refresh()
            mount = OT3Mount.LEFT
        elif c == "r":
            stdscr.addstr("Changing Mount to Right")
            mount = OT3Mount.RIGHT
        elif c == "j":
            await jog_axis(stdscr, api, mount)
            stdscr.clear()
            y, x = stdscr.getbegyx()
            stdscr.move(y, x)
            intro_win.move(y, x)
            stdscr.refresh()
            await _refresh_intro_window(intro_win)
        elif c == "s":
            stdscr.addstr("Select next slot to move to by inputing numbers 1-11")
            await api.home_z()
            next_slot = ""
            while len(next_slot) < 2:
                next_slot += stdscr.getkey()
            stdscr.addstr(f"Got slot {next_slot}")
            calibration_square_pos = (
                helpers_ot3.get_slot_calibration_square_position_ot3(int(next_slot))
            )
            calibration_square_pos = calibration_square_pos._replace(z=70)
            stdscr.addstr(f"Calibration square pos {calibration_square_pos}")
            await api.move_to(mount, calibration_square_pos)
        stdscr.move(y, x)
        stdscr.refresh()


async def jog_axis(stdscr: Any, api: OT3API, mount: OT3Mount) -> None:
    """Jog Axis Tool.

    Internal axis jog controls using move_rel
    """
    CONTINUE_JOG = True
    z = False
    step_index = DEFAULT_STEP_INDEX
    jog_win = stdscr.derwin(0, 0)
    await _refresh_jog_window(jog_win)

    y, x = jog_win.getyx()
    stdscr.move(y, x)
    while CONTINUE_JOG:
        c = stdscr.getkey()
        stdscr.addstr(f"In jog, received {c} character\n")
        amount = STEP_LIST[step_index]
        if c == "z":
            z = not z
        elif c == "-":
            temp_idx = step_index - 1
            step_index = min(temp_idx, MIN_STEP_INDEX)
            stdscr.addstr(f"Reducing step size to {STEP_LIST[step_index]}\n")
        elif c == "=":
            temp_idx = step_index + 1
            step_index = min(temp_idx, MAX_STEP_INDEX)
            stdscr.addstr(f"Increasing step size to {STEP_LIST[step_index]}\n")
        elif c == "a":
            stdscr.addstr("Jogging left\n")
            await api.move_rel(mount, Point(x=amount * -1, y=0, z=0))
        elif c == "d":
            stdscr.addstr("Jogging right\n")
            await api.move_rel(mount, Point(x=amount, y=0, z=0))
        elif c == "w" and z:
            stdscr.addstr("Jogging up\n")
            await api.move_rel(mount, Point(x=0, y=0, z=amount))
        elif c == "s" and z:
            stdscr.addstr("Jogging down\n")
            await api.move_rel(mount, Point(x=0, y=0, z=amount * -1))
        elif c == "w":
            stdscr.addstr("Jogging backwards\n")
            await api.move_rel(mount, Point(x=0, y=amount, z=0))
        elif c == "s":
            stdscr.addstr("Jogging forwards\n")
            await api.move_rel(mount, Point(x=0, y=amount * -1, z=0))
        elif c == "n":
            stdscr.addstr("Exiting jog.\n")
            CONTINUE_JOG = False
        stdscr.move(y, x)
        stdscr.refresh()


async def _main(stdscr: Any, simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulating, use_defaults=True
    )
    stdscr.clear()
    stdscr.refresh()
    await api.home()
    stdscr.addstr("Homing Finished")
    stdscr.clear()
    stdscr.refresh()
    await begin_z_leveling(stdscr, api, STARTING_MOUNT)


def main(stdscr: Any, simulating: bool) -> None:
    """Entrypoint."""
    asyncio.run(_main(stdscr, simulating))


if __name__ == "__main__":
    print("\nOT-3 Z stage leveling\n")
    arg_parser = argparse.ArgumentParser(description="OT-3 Z stage leveling")
    arg_parser.add_argument("--simulate", type=bool, default=False)
    args = arg_parser.parse_args()

    curses.wrapper(main, args.simulate)
