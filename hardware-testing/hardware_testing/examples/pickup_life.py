"""Test Jogging."""
import argparse
import asyncio
import termios
import sys,tty,time
import datetime

from typing import List, Optional, Dict, Tuple
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from opentrons.calibration_storage.ot3.pipette_offset import (
    save_pipette_calibration as save_offset_ot3,
)
from opentrons.config.types import GantryLoad, PerPipetteAxisSettings
from opentrons.hardware_control.types import OT3Mount, OT3Axis, Axis, CriticalPoint
from opentrons.types import Mount



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

async def _jog_axis(api: OT3API, mount: OT3Mount) -> None:
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
                                        pos[OT3Axis.by_mount(mount)]),
                                        )
        elif input == 'd':
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
        elif input == 's':
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
                                Point(pos[OT3Axis.X],
                                        pos[OT3Axis.Y],
                                        pos[OT3Axis.by_mount(mount)]+step))
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


async def _pickuplife(api: OT3API, mount: OT3Mount,tipracks_loc:List,cycles=20) -> None:
    raise_position = 20
    tip_column = 0
    for tiprack in range(len(tipracks_loc)):
        for column in range(13):
            tip_column = column * 9
            # move to tip rack
            await api.move_to(mount, Point(tipracks_loc[tiprack][OT3Axis.X]+tip_column,
                                            tipracks_loc[tiprack][OT3Axis.Y],
                                            tipracks_loc[tiprack][OT3Axis.by_mount(mount)]))
            # run cycles
            for cycle in cycles:
                print('Run TipRack_{}_Column_{}_Cycle_{}'.format(tiprack,column,cycle))
                # # home z on before every pick up
                # await api.home_z(mount)
                
                # pick up tips
                await api.pick_up_tip(mount, tip_length = 57.3)
                # # move to raise position
                # current_position = awaitapi.current_position_ot3(mount)
                # await api.move_to(mount, Point(current_position[OT3Axis.X],
                #                                 current_position[OT3Axis.Y],
                #                                 current_position[OT3Axis.by_mount(mount)] + raise_position))

                # drop tips
                await api.drop_tip(mount, home_after = True)




async def _pipettelife(is_simulating: bool, mount: types.OT3Mount,cycles: int, tiprack_num: int) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    # Get pipette id
    pipette = api.hardware_pipettes[mount.to_mount()]
    assert pipette, f"No pipette found on mount: {mount}"
    # Home gantry
    await api.home()
    home_pos = await api.current_position_ot3(mount)
    pos = await api.current_position_ot3(mount)
    # Move to slot 1-tiprack location to the first column
    await api.move_to(mount, Point(175.6,
                                    189.4,
                                    pos[OT3Axis.by_mount(mount)]))
    await api.pick_up_tip(mount, tip_length = 57.3)
    tiprack_loc = []
    for i in range(1,tiprack_num):
        print("Jog to the TipRack_{}".format(i))
        tiprack_loc.append(await _jog_axis(api, mount))
    await _pickuplife(api,mount,tiprack_loc,cycles)

if __name__ == "__main__":
    mount_options = {
        "left": types.OT3Mount.LEFT,
        "right": types.OT3Mount.RIGHT,
        "gripper": types.OT3Mount.GRIPPER,
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument(
        "--mount", type=str, choices=list(mount_options.keys()), default="left"
    )
    parser.add_argument(
        "--cycles", type=int, default="20", help='Run cycles per tip'
    )
    parser.add_argument(
        "--racknum", type=int, default="11", help='TipRack number for pipettelife test'
    )
    args = parser.parse_args()
    mount = mount_options[args.mount]
    cycles = args.cycles
    rack_num = args.racknum
    asyncio.run(_pipettelife(args.simulate, mount,cycles,rack_num))

