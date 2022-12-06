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



CUSTOM_AXIS_SETTINGS = {
    types.OT3Axis.X: helpers_ot3.GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Y: helpers_ot3.GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Z_L: helpers_ot3.GantryLoadSettings(
        max_speed=60,
        acceleration=200,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Z_R: helpers_ot3.GantryLoadSettings(
        max_speed=60,
        acceleration=200,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    )
}

DEFAULT_AXIS_SETTINGS = {
    types.OT3Axis.X: helpers_ot3.GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Y: helpers_ot3.GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Z_L: helpers_ot3.GantryLoadSettings(
        max_speed=65,
        acceleration=200,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.OT3Axis.Z_R: helpers_ot3.GantryLoadSettings(
        max_speed=65,
        acceleration=200,
        max_start_stop_speed=1,
        max_change_dir_speed=1,
        hold_current=0.1,
        run_current=1.4,
    )
}

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


async def _pipette(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    # Get pipette id
    # pipette = api.hardware_pipettes[mount.to_mount()]
    # assert pipette, f"No pipette found on mount: {mount}"
    # Home gantry
    await api.home()
    home_pos = await api.current_position_ot3(mount)
    pos = await api.current_position_ot3(mount)
    # Move to slot 1-tiprack location to the first column
    await api.move_to(mount, Point(175.6,
                                    189.4,
                                    pos[OT3Axis.by_mount(mount)]))
    print("Jog to the TipRack")
    tiprack_loc = await _jog_axis(api, mount)
    tip_column = 0
    for col in range(1, 13):
        await api.move_to(mount, Point(tiprack_loc[OT3Axis.X]+tip_column,
                                        tiprack_loc[OT3Axis.Y],
                                        tiprack_loc[OT3Axis.by_mount(mount)]))
        await api.pick_up_tip(mount, tip_length = 57.3)
        await api.home_z(mount)
        tip_attached_home_z_pos = await api.current_position_ot3(mount)
        await api.move_to(mount, Point(tiprack_loc[OT3Axis.X]+tip_column,
                                        tiprack_loc[OT3Axis.Y],
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        pos = await api.current_position_ot3(mount)
        # move to trough
        await api.move_to(mount, Point(340,
                                    189.4,
                                    tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        await api.prepare_for_aspirate(mount)
        pos = await api.current_position_ot3(mount)
        if col <= 1:
            print("Jog to the Trough Liquid Height, 2mm below the liquid")
            trough_pos = await _jog_axis(api, mount)
        # Move to Trough aspiration position
        else:
            await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                            trough_pos[OT3Axis.Y],
                                            tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y],
                                        trough_pos[OT3Axis.by_mount(mount)]))
        await api.aspirate(mount)
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y],
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        # await api.home_z(mount)
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y] -75,
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)])
                                        )
        # Move to the front of the robot to inspect
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y] -75,
                                        tiprack_loc[OT3Axis.by_mount(mount)])
                                        )
        input("Press Enter to Continue")
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y] -75,
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)])
                                        )

        pos = await api.current_position_ot3(mount)
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y],
                                        pos[OT3Axis.by_mount(mount)]
                                ))
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y],
                                        trough_pos[OT3Axis.by_mount(mount)]
                                        ))
        await api.dispense(mount)
        await api.blow_out(mount)
        await api.move_to(mount, Point(trough_pos[OT3Axis.X],
                                        trough_pos[OT3Axis.Y],
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)])
                                        )
        # await api.home_z(mount)
        # Trash
        pos = await api.current_position_ot3(mount)
        await api.move_to(mount, Point(434.8 ,
                                        399.6 ,
                                        tip_attached_home_z_pos[OT3Axis.by_mount(mount)]))
        await api.move_to(mount, Point(434.8 ,399.6 ,53.4))
        await api.drop_tip(mount, home_after = False)
        # await api.home_z(mount)
        tip_column += 9
        pos = await api.current_position_ot3(mount)
        await api.move_to(mount, Point(pos[OT3Axis.X],
                                        pos[OT3Axis.Y],
                                        home_pos[OT3Axis.by_mount(mount)]))
        await api.move_to(mount, Point(tiprack_loc[OT3Axis.X]+tip_column,
                                        tiprack_loc[OT3Axis.Y],
                                        home_pos[OT3Axis.by_mount(mount)]))


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

async def _jog(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()
    final_position = await helpers_ot3.jog_mount_ot3(api, mount)
    print(f"Jogged the mount to deck coordinate: {final_position}")

async def _test(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home_ot3(api)

async def _ot3life(is_simulating: bool, mount: types.OT3Mount,move_speed) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    # Get pipette id
    # pipette = api.hardware_pipettes[mount.to_mount()]
    # assert pipette, f"No pipette found on mount: {mount}"
    # Home gantry
    await api.home()
    home_pos = await api.current_position_ot3(mount)
    pos = await api.current_position_ot3(mount)
    # Move to location to do calibation
    await api.move_to(mount, Point(175.6,
                                   189.4,
                                   pos[OT3Axis.by_mount(mount)]),speed=move_speed)
    print("Jog to the left rear position")
    LR_loc = await _jog_axis(api, mount)
    # Move to location to do calibation
    await api.move_to(mount, Point(175.6,
                                   189.4,
                                   pos[OT3Axis.by_mount(mount)]),speed=move_speed)
    print("Jog to the left front position")
    LF_loc = await _jog_axis(api, mount)
    # Move to location to do calibation
    await api.move_to(mount, Point(175.6,
                                   189.4,
                                   pos[OT3Axis.by_mount(mount)]),speed=move_speed)
    print("Jog to the right rear position")
    RR_loc = await _jog_axis(api, mount)
    # Move to location to do calibation
    await api.move_to(mount, Point(175.6,
                                   189.4,
                                   pos[OT3Axis.by_mount(mount)]),speed=move_speed)
    print("Jog to the right front position")
    RF_loc = await _jog_axis(api, mount)
    await api.home()
    # # Move to location to do calibation
    # await api.move_to(mount, Point(175.6,
    #                                189.4,
    #                                pos[OT3Axis.by_mount(mount)]))
    # print("Jog to the center position")
    # C_loc = await _jog_axis(api, mount)
    condition = True
    starttime = datetime.datetime.now()
    while condition:
        try:
            endtime = datetime.datetime.now()
            deltatime = (endtime - starttime).seconds
            if int(deltatime)/3600 >= 24:
                condition = False
            await api.move_to(mount, Point(RR_loc[OT3Axis.X],
                                           RR_loc[OT3Axis.Y],
                                           RR_loc[OT3Axis.by_mount(mount)]),speed=move_speed)
            await api.move_to(mount, Point(LR_loc[OT3Axis.X],
                                           LR_loc[OT3Axis.Y],
                                           LR_loc[OT3Axis.by_mount(mount)]),speed=move_speed)
            await api.move_to(mount, Point(LF_loc[OT3Axis.X],
                                           LF_loc[OT3Axis.Y],
                                           LF_loc[OT3Axis.by_mount(mount)]),speed=move_speed)
            await api.move_to(mount, Point(RF_loc[OT3Axis.X],
                                           RF_loc[OT3Axis.Y],
                                           RF_loc[OT3Axis.by_mount(mount)]),speed=move_speed)
            # await api.move_to(mount, Point(RR_loc[OT3Axis.X],
            #                                RR_loc[OT3Axis.Y],
            #                                RR_loc[OT3Axis.by_mount(mount)]))
            # await api.home()
            await api.move_to(mount, Point(RR_loc[OT3Axis.X],
                                           RR_loc[OT3Axis.Y],
                                           RR_loc[OT3Axis.by_mount(mount)]),speed=move_speed)
            await api.move_to(mount, Point(LF_loc[OT3Axis.X],
                                           LF_loc[OT3Axis.Y],
                                           LF_loc[OT3Axis.by_mount(mount)]),speed=move_speed)
            await api.move_to(mount, Point(RF_loc[OT3Axis.X],
                                           RF_loc[OT3Axis.Y],
                                           RF_loc[OT3Axis.by_mount(mount)]),speed=move_speed)
            await api.move_to(mount, Point(LR_loc[OT3Axis.X],
                                           LR_loc[OT3Axis.Y],
                                           LR_loc[OT3Axis.by_mount(mount)]),speed=move_speed)
            await api.move_to(mount, Point(RR_loc[OT3Axis.X],
                                           RR_loc[OT3Axis.Y],
                                           RR_loc[OT3Axis.by_mount(mount)]),speed=move_speed)
            # await api.home()
        except Exception as e:
            print(e)

async def _stage_check(api: OT3API,mount: OT3Mount) -> None:
    pos_diff = 5
    z_axis = OT3Axis.by_mount(mount)
    pos = await api.current_position_ot3(mount=mount)
    await api.move_to(mount, Point(pos[OT3Axis.X],
                                   pos[OT3Axis.Y],
                                   320))
    motors_pos_d = await api.current_position_ot3(mount=mount)
    enc_pos_d = await api.encoder_current_position(mount=mount)
    mx_d, my_d, mz_d = [
        round(motors_pos_d[ax], 2) for ax in [OT3Axis.X, OT3Axis.Y, z_axis]
    ]
    ex_d, ey_d, ez_d = [
        round(enc_pos_d[ax.to_axis()], 2) for ax in [OT3Axis.X, OT3Axis.Y, z_axis]
    ]
    print(f"Deck Coordinate_down: X={mx_d}, Y={my_d}, Z={mz_d}")
    print(f"Enc. Coordinate_down: X={ex_d}, Y={ey_d}, Z={ez_d}")
    await api.move_to(mount, Point(pos[OT3Axis.X],
                                   pos[OT3Axis.Y],
                                   480))
    motors_pos_u = await api.current_position_ot3(mount=mount)
    enc_pos_u = await api.encoder_current_position(mount=mount)
    mx_u, my_u, mz_u = [
        round(motors_pos_u[ax], 2) for ax in [OT3Axis.X, OT3Axis.Y, z_axis]
    ]
    ex_u, ey_u, ez_u = [
        round(enc_pos_u[ax.to_axis()], 2) for ax in [OT3Axis.X, OT3Axis.Y, z_axis]
    ]
    print(f"Deck Coordinate_up: X={mx_u}, Y={my_u}, Z={mz_u}")
    print(f"Enc. Coordinate_up: X={ex_u}, Y={ey_u}, Z={ez_u}")

    # if abs(enc_diff) >= pos_diff:
    #     return 'No skipped steps'
    # else:
    #     return 'Has skipped steps'
    return 'Pass'


async def _zstage(is_simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    global DEFAULT_AXIS_SETTINGS
    await api.home()
    pos = await api.current_position_ot3(mount=mount)
    await api.move_to(mount, Point(pos[OT3Axis.X],
                                   pos[OT3Axis.Y],
                                   320))
    await api.home()
    pos = await api.current_position_ot3(mount=mount)
    await api.move_to(mount, Point(pos[OT3Axis.X],
                                   pos[OT3Axis.Y],
                                   320))
    await helpers_ot3.set_gantry_load_per_axis_settings_ot3(api, DEFAULT_AXIS_SETTINGS)
    time.sleep(0.1)
    await api.home()
    currents = (0.2, 0.5, 1.0, 1.5)
    speeds = (50, 100)
    speed_force_gauge = (2, 5, 10, 20)
    results = []
    # Do left mount step check
    print('Start left mount stage check:')
    global CUSTOM_AXIS_SETTINGS

    for cu in currents:
        for sp in speeds:

            print('  Current: {}, Speed: {}::::'.format(cu, sp))
            input('Pause')
            userSetting = helpers_ot3.GantryLoadSettings(
                    max_speed=float(sp),
                    acceleration=200,
                    max_start_stop_speed=1,
                    max_change_dir_speed=1,
                    hold_current=0.1,
                    run_current=float(cu))
            CUSTOM_AXIS_SETTINGS.update({types.OT3Axis.Z_L: userSetting})
            CUSTOM_AXIS_SETTINGS.update({types.OT3Axis.Z_R: userSetting})
            # print(CUSTOM_AXIS_SETTINGS)
            await helpers_ot3.set_gantry_load_per_axis_settings_ot3(api, CUSTOM_AXIS_SETTINGS)
            res = await _stage_check(api, types.OT3Mount.LEFT)
            time.sleep(1)
            print(DEFAULT_AXIS_SETTINGS)

            userSetting = helpers_ot3.GantryLoadSettings(
                max_speed=float(60),
                acceleration=200,
                max_start_stop_speed=1,
                max_change_dir_speed=1,
                hold_current=0.1,
                run_current=float(1.4))
            CUSTOM_AXIS_SETTINGS.update({types.OT3Axis.Z_L: userSetting})
            CUSTOM_AXIS_SETTINGS.update({types.OT3Axis.Z_R: userSetting})
            await helpers_ot3.set_gantry_load_per_axis_settings_ot3(api, CUSTOM_AXIS_SETTINGS)
            time.sleep(1)
            await api.home_z()
            # print('  Current: {}, Speed: {},  Result: {}'.format(cu,sp,res))
    # # Do right mount step check
    # print('Start right mount stage check:')
    # for cu in currents:
    #     for sp in speeds:
    #         res = await _stage_check(sp,cu,api,types.OT3Mount.RIGHT)
    #         print('  Current: {}, Speed: {},  Result: {}'.format(cu,sp,res))
    #
    # # Do force gauge
    # print('Start force gauge record:')
    # for cu in currents:
    #     for sp in speed_force_gauge:
    #         res = await _stage_check(sp, cu, api, types.OT3Mount.RIGHT)
    #         print('  Current: {}, Speed: {},  Result: {}'.format(cu, sp, 'Force gauge'))




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
        "--test", type=str, default="jog",help='Select test program'
    )
    parser.add_argument(
        "--speed", type=float, default="300", help='Gantry move speed'
    )
    parser.add_argument(
        "--cycles", type=int, default="20", help='Run cycles per tip'
    )
    parser.add_argument(
        "--racknum", type=int, default="11", help='TipRack number for pipettelife test'
    )
    args = parser.parse_args()
    type = args.test
    mount = mount_options[args.mount]
    speed = args.speed
    cycles = args.cycles
    rack_num = args.racknum
    if type == 'jog':
        asyncio.run(_jog(args.simulate, mount))
    elif type == 'test':
        asyncio.run(_test(args.simulate, mount))
    elif type == 'ot3':
        asyncio.run(_ot3life(args.simulate, mount,speed))
    elif type == 'pipette':
        asyncio.run(_pipette(args.simulate, mount))
    elif type == 'pipettelife':
        asyncio.run(_pipettelife(args.simulate, mount,cycles,rack_num))
    elif type == 'zstage':
        asyncio.run(_zstage(args.simulate))
