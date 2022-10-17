"""Demo OT3 Gantry Functionality."""
import argparse
import ast
import asyncio
import csv
import time
from typing import Tuple, Dict, Optional
from threading import Thread
import datetime
import os

from opentrons.hardware_control.motion_utilities import target_position_from_plunger
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point, Axis
from hardware_testing.opentrons_api.helpers_ot3 import (
    OT3API,
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    home_ot3,
    get_endstop_position_ot3,
    move_plunger_absolute_ot3,
    update_pick_up_current,
    update_pick_up_distance
)

from hardware_testing import data
from hardware_testing.drivers.mark10 import Mark10

MOUNT = OT3Mount.LEFT
PIPETTE_SPEED = 10

SPEED_XY = 500
SPEED_Z = 250

pick_up_speed = 5
press_distance = 15
aspirate_depth = 7
volume = 50
liquid_retract_dist = 12
liquid_retract_speed = 5
retract_dist = 100
retract_speed = 60

leak_test_time = 30

def _create_relative_point(axis: OT3Axis, distance: float) -> Point:
    if axis == OT3Axis.X:
        return Point(x=distance)
    elif axis == OT3Axis.Y:
        return Point(y=distance)
    elif axis == OT3Axis.Z_L or axis == OT3Axis.Z_R:
        return Point(z=distance)
    raise ValueError(f"Unexpected axis: {axis}")

async def get_encoder_position(
    api: OT3API, mount: OT3Mount) -> Dict[OT3Axis, float]:
    enc_position = await api.encoder_current_position(mount=MOUNT, refresh=True)
    return enc_position

async def jog(api: OT3API)-> Dict[OT3Axis, float]:
    motion = True
    cur_pos = await api.current_position_ot3(MOUNT)
    print(f"X: {cur_pos[OT3Axis.X]}, Y: {cur_pos[OT3Axis.Y]}, Z: {cur_pos[OT3Axis.by_mount(MOUNT)]}")
    print(f"Enter coordinates as example: 100,10,3")
    while motion:
        coord = ast.literal_eval(input('Enter Coordinates as: '))
        print(f"Tuple type: {isinstance(coord, Tuple)}")
        if isinstance(coord, Tuple):
            await api.move_to(MOUNT, Point(coord[0], coord[1], coord[2]), speed=90)
            cur_pos = await api.current_position_ot3(MOUNT)
            print(f"X: {cur_pos[OT3Axis.X]}, Y: {cur_pos[OT3Axis.Y]}, Z: {cur_pos[OT3Axis.by_mount(MOUNT)]}")
        else:
            motion = False
    return  await api.current_position_ot3(MOUNT)

async def set_default_current_settings(api: OT3API, load: Optional[GantryLoad] = None):
    default_run_settings = {
        OT3Axis.X: GantryLoadSettings(
            max_speed=SPEED_XY,
            acceleration=2000,
            max_start_stop_speed=0,
            max_change_dir_speed=0,
            hold_current=0.1,
            run_current=1.4,
        ),
        OT3Axis.Y: GantryLoadSettings(
            max_speed=SPEED_XY,
            acceleration=2000,
            max_start_stop_speed=0,
            max_change_dir_speed=0,
            hold_current=0.1,
            run_current=1.4,
        ),
        OT3Axis.Z_L: GantryLoadSettings(
            max_speed=SPEED_Z,
            acceleration=1500,
            max_start_stop_speed=0,
            max_change_dir_speed=0,
            hold_current=0.1,
            run_current=1.0,
        ),
        OT3Axis.Z_R: GantryLoadSettings(
            max_speed=SPEED_Z,
            acceleration=1500,
            max_start_stop_speed=0,
            max_change_dir_speed=0,
            hold_current=0.1,
            run_current=1.0,
        ),
    }
    # if load is None:
    #     LOAD = api._gantry_load
    await set_gantry_load_per_axis_settings_ot3(api,
                                        default_run_settings,
                                        load=None
                                        )
    # await api.set_gantry_load(gantry_load=LOAD)

async def set_current_settings(api: OT3API, motor_current: float, load: Optional[GantryLoad] = None):
    z_pickup_run_settings = {
        OT3Axis.X: GantryLoadSettings(
            max_speed=SPEED_XY,
            acceleration=2000,
            max_start_stop_speed=0,
            max_change_dir_speed=0,
            hold_current=0.1,
            run_current=1.4,
        ),
        OT3Axis.Y: GantryLoadSettings(
            max_speed=SPEED_XY,
            acceleration=2000,
            max_start_stop_speed=0,
            max_change_dir_speed=0,
            hold_current=0.1,
            run_current=1.4,
        ),
        OT3Axis.Z_L: GantryLoadSettings(
            max_speed=SPEED_Z,
            acceleration=1500,
            max_start_stop_speed=0,
            max_change_dir_speed=0,
            hold_current=0.1,
            run_current=motor_current,
        ),
        OT3Axis.Z_R: GantryLoadSettings(
            max_speed=SPEED_Z,
            acceleration=1500,
            max_start_stop_speed=0,
            max_change_dir_speed=0,
            hold_current=0.1,
            run_current=motor_current,
        ),
    }
    # if load is None:
    #     LOAD = api._gantry_load
    await set_gantry_load_per_axis_settings_ot3(api,
                                            z_pickup_run_settings,
                                            load=None)
    # await api.set_gantry_load(gantry_load=LOAD)

async def pick_up_function(api: OT3API,
                            loc, speed, press_distance):
    # Pick up tip function
    await api.move_to(MOUNT,
                        Point(loc[0], loc[1], loc_[2]-press_distance),
                        speed = speed)

async def update_tip_spec(api, action):
    if action == 'pickup':
        realmount = OT3Mount.from_mount(MOUNT)
        spec, _add_tip_to_instrs = api._pipette_handler.plan_check_pick_up_tip(
            realmount, 78.5, None, None
        )
        _add_tip_to_instrs()
    elif action == 'drop_tip':
        realmount = OT3Mount.from_mount(MOUNT)
        spec, _remove = self._pipette_handler.plan_check_drop_tip(realmount, home_after)
        _remove()
    else:
        raise("Pass a pickup or drop_tip to function")

async def countdown(count_time: float):
    """
    This function loops through a countdown before checking the leak visually
    """
    time_suspend = 0
    while time_suspend < count_time:
        await asyncio.sleep(1)
        time_suspend +=1
        print(f"Remaining: {count_time-time_suspend} (s)", end='')
        print('\r', end='')
    print('')

async def _main() -> None:
    hw_api = await build_async_ot3_hardware_api(is_simulating=args.simulate,
                                    use_defaults=True)
    await set_default_current_settings(hw_api, load=None)
    await home_ot3(hw_api, [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    await hw_api.cache_instruments()
    global encoder_position
    global encoder_end
    global stop_threads
    global motion
    encoder_end = None
    await hw_api.home_plunger(MOUNT)
    # fg_loc = X: 186.0, Y: 34.0, Z: 125.0
    if args.fg_jog:
        # fg_loc = await jog(hw_api)
        # fg_loc = [fg_loc[OT3Axis.X], fg_loc[OT3Axis.Y], fg_loc[OT3Axis.by_mount(MOUNT)]]
        # fg_loc = [186.0, 34.0, 125.0]
        fg_loc = [22.5 , 34, 125]
        # 22.5, 34, 125,
    if args.tiprack:
        #tiprack_loc = await jog(hw_api)
        #tiprack_loc = [tiprack_loc[OT3Axis.X], tiprack_loc[OT3Axis.Y], tiprack_loc[OT3Axis.by_mount(MOUNT)]]
        tiprack_loc = [136.7, 62.3, 80]
        #X: 137.0, Y: 62.3, Z: 80.0
    if args.trough:
        await hw_api.add_tip(MOUNT, 58.5)
        trough_loc = await jog(hw_api)
        trough_loc = [trough_loc[OT3Axis.X], trough_loc[OT3Axis.Y], trough_loc[OT3Axis.by_mount(MOUNT)]]
        await hw_api.home_z(MOUNT, allow_home_other = False)
        await hw_api.remove_tip(MOUNT)
        # trough_loc = [300, 40, 85-78.5]
        #X: 300.0, Y: 40.0, Z: 85.0
    # await hw_api.disengage_axes([OT3Axis.of_main_tool_actuator(MOUNT)])
    try:
        while True:
            await set_default_current_settings(hw_api, load=None)
            cur_pos = await hw_api.current_position_ot3(MOUNT)
            z_pos = cur_pos[OT3Axis.by_mount(MOUNT)]
            m_current = float(input("motor_current in amps: "))
            await hw_api.move_to(MOUNT, Point(fg_loc[0], fg_loc[1], z_pos))
            # Move pipette to Force Gauge calibrated location
            await hw_api.move_to(MOUNT, Point(fg_loc[0], fg_loc[1], fg_loc[2]), speed = 65)

            encoder_position = await get_encoder_position(hw_api, MOUNT)
            encoder_position = encoder_position[Axis.Z]
            location = 'Force_Gauge'
            force_thread = Thread(target=force_record, args=(m_current, location, ))
            force_thread.start()
            await set_current_settings(hw_api, m_current)
            # Move pipette to Force Gauge press location
            await hw_api.move_to(MOUNT,
                                Point(fg_loc[0], fg_loc[1], fg_loc[2] - press_distance),
                                speed = pick_up_speed)
            await asyncio.sleep(1)
            encoder_position = await get_encoder_position(hw_api, MOUNT)
            encoder_position = encoder_position[Axis.Z]
            print(encoder_position)
            motion = False
            stop_threads = True
            force_thread.join() #Thread Finished
            await set_default_current_settings(hw_api, load=None)
            await hw_api.home_z(MOUNT, allow_home_other = False)
            # Obtain the current position of the Z mount
            cur_pos = await hw_api.current_position_ot3(MOUNT)
            z_pos = cur_pos[OT3Axis.by_mount(MOUNT)]
            # Move over to the TipRack location and
            await hw_api.move_to(MOUNT, Point(tiprack_loc[0], tiprack_loc[1], z_pos))

            await set_default_current_settings(hw_api, load=None)
            # Move Pipette to top of Tip Rack Location
            await hw_api.move_to(MOUNT, Point(tiprack_loc[0], tiprack_loc[1], tiprack_loc[2]), speed = 65)
            location = 'Tiprack'
            # Start recording the encoder
            encoder_position = await get_encoder_position(hw_api, MOUNT)
            encoder_position = encoder_position[Axis.Z]
            enc_thread = Thread(target=force_record, args=(m_current,location,))
            enc_thread.start()
            # Press Pipette into the tip
            await set_current_settings(hw_api, m_current)
            await hw_api.move_to(MOUNT,
                                Point(tiprack_loc[0],
                                    tiprack_loc[1],
                                    tiprack_loc[2]-press_distance),
                                    speed = pick_up_speed
                            )
            await hw_api.add_tip(MOUNT, 58.5)
            await asyncio.sleep(2)
            encoder_end = await get_encoder_position(hw_api, MOUNT)
            encoder_end = encoder_end[Axis.Z]
            stop_threads = True
            enc_thread.join() #Thread Finished
            # Reset Current Settings
            await set_default_current_settings(hw_api, load=None)
            # Home Z
            await hw_api.home_z(MOUNT, allow_home_other = False)
            input("Feel the Tip")

            cur_pos = await hw_api.current_position_ot3(MOUNT)
            z_pos = cur_pos[OT3Axis.by_mount(MOUNT)]
            await hw_api.move_to(MOUNT, Point(trough_loc[0], trough_loc[1], z_pos))
            await hw_api.move_to(MOUNT, Point(trough_loc[0], trough_loc[1], trough_loc[2]+10), speed = 65)
            await hw_api.move_to(MOUNT, Point(trough_loc[0], trough_loc[1], trough_loc[2]-aspirate_depth), speed = 1)
            await hw_api.prepare_for_aspirate(MOUNT)
            await hw_api.aspirate(MOUNT)

            cur_pos = await hw_api.current_position_ot3(MOUNT)
            z_pos = cur_pos[OT3Axis.by_mount(MOUNT)]
            await hw_api.move_to(MOUNT,
                                Point(trough_loc[0],
                                        trough_loc[1],
                                        z_pos+liquid_retract_dist),
                                speed = liquid_retract_speed)
            cur_pos = await hw_api.current_position_ot3(MOUNT)
            z_pos = cur_pos[OT3Axis.by_mount(MOUNT)]
            await hw_api.move_to(MOUNT,
                                Point(trough_loc[0],
                                        trough_loc[1],
                                        z_pos+retract_dist),
                                speed = retract_speed)
            await hw_api.home_z(MOUNT, allow_home_other = False)
            await countdown(count_time = leak_test_time)
            input("Check to see if the pipette is leaking")
            await hw_api.move_to(MOUNT, Point(trough_loc[0],
                                        trough_loc[1],
                                        trough_loc[2]+10),
                                        speed = 65)
            await hw_api.move_to(MOUNT, Point(trough_loc[0],
                                        trough_loc[1],
                                        trough_loc[2]-aspirate_depth),
                                        speed = 5)
            await hw_api.dispense(MOUNT)
            await hw_api.blow_out(MOUNT)
            await hw_api.home_z(MOUNT, allow_home_other = False)
            await hw_api.drop_tip(MOUNT)
            await hw_api.remove_tip(MOUNT)

        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    except KeyboardInterrupt:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await hw_api.clean_up()



def force_record(motor_current, location):
    dir = os.getcwd()
    global encoder_position
    global encoder_end
    global stop_threads
    global motion
    encoder_end = None
    file_name = "/results/force_pu_test_%s-%s-%s.csv" %(motor_current,
                            datetime.datetime.now().strftime("%m-%d-%y_%H-%M"),
                            location)
    print(dir+file_name)
    with open(dir+file_name, 'w', newline='') as f:
        test_data = {'Time(s)':None,
                    'Force(N)':None,
                    'M_current(amps)':None,
                    'encoder_pos(mm)': None,
                    'end_enc_pos(mm)': None}
        log_file = csv.DictWriter(f, test_data)
        log_file.writeheader()
        fg._timer.start()
        try:
            motion = True
            stop_threads = False
            while motion:
                reading = float(fg.read_force())
                test_data['Time(s)'] = fg._timer.elasped_time()
                test_data['Force(N)'] = reading
                test_data['M_current(amps)'] = motor_current
                test_data['encoder_pos(mm)'] = encoder_position
                test_data['end_enc_pos(mm)'] = encoder_end
                log_file.writerow(test_data)
                print(test_data)
                f.flush()
                if stop_threads:
                    break
        except KeyboardInterrupt:
            print("Test Cancelled")
            test_data['Errors'] = "Test Cancelled"
            f.flush()
        except Exception as e:
            print("ERROR OCCURED")
            test_data['Errors'] = e
            f.flush()
            raise e
        print("Test done")
        f.flush()
        f.close()

def enc_record(motor_current, location):
    dir = os.getcwd()
    global encoder_position
    global encoder_end
    global stop_threads
    global motion
    encoder_end = None
    file_name = "/results/enc_pu_test_%s-%s-%s.csv" %(motor_current,
                            datetime.datetime.now().strftime("%m-%d-%y_%H-%M"),
                            location)
    print(file_name)
    print(dir+file_name)
    with open(dir+file_name, 'wb', newline='') as f:
        test_data = {'time(s)':None,
                    'start_enc_pos':None,
                    'end_enc_pos(mm)': None}
        log_file = csv.DictWriter(f, test_data)
        log_file.writeheader()
        fg._timer.start()
        try:
            motion = True
            stop_threads = False
            while motion:
                test_data['time(s)'] = fg._timer.elasped_time()
                test_data['start_enc_pos(mm)'] = encoder_position
                test_data['end_enc_pos(mm)'] = encoder_end
                log_file.writerow(test_data)
                print(test_data)
                f.flush()
                if stop_threads:
                    break
        except KeyboardInterrupt:
            print("Test Cancelled")
            test_data['Errors'] = "Test Cancelled"
            f.flush()
        except Exception as e:
            print("ERROR OCCURED")
            test_data['Errors'] = e
            f.flush()
            raise e
        print("Test done")
        f.flush()
        f.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--fg_jog", action="store_true")
    parser.add_argument("--trough", action="store_true")
    parser.add_argument("--tiprack", action="store_true")
    parser.add_argument("--cycles", type=int,
                            default = 1000, help = "Number of Cycles to run")
    parser.add_argument("--port", type=str,
                        default = '/dev/ttyUSB0', help = "Force Gauge Port")
    args = parser.parse_args()

    fg = Mark10.create(port=args.port)
    fg.connect()
    asyncio.run(_main())
