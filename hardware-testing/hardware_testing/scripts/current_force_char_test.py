"""Test Jogging."""
import argparse
import asyncio
import time
from threading import Thread, Event, currentThread

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from opentrons.config.types import CapacitivePassSettings
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point

from hardware_testing.drivers.mark10 import Mark10

CAP_SETTINGS = CapacitivePassSettings(prep_distance_mm=0,
max_overrun_distance_mm=10,
speed_mm_per_s=1,
sensor_threshold_pf=1.0)

MOUNT = OT3Mount.LEFT
AXIS = OT3Axis.Z_L
TRIALS = 2

def force_record(stop_event, motor_current, trial, test_robot, test_name, file_name):
    ### global stop_threads
    # global stop_threads
    # global in_motion

    # force_thread = currentThread()
    start_time = time.perf_counter()
    # if trial > 0:
    #     test_robot = ""
    # try:
        # in_motion = True
        # stop_threads = False
    print("Start of thread\n")
    max_val = 0
    while True:
    # while not stop_event.is_set():##while getattr(force_thread, "do_run", True):##while not stop_event.is_set():
        reading = float(fg.read_force())
        if reading > max_val:
            max_val = reading
        #print(f"Reading: {reading} N\n")
        cycle_data = [time.perf_counter()-start_time, reading, motor_current, trial, test_robot]
        cycle_data_str = data.convert_list_to_csv_line(cycle_data)
        data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)
        if stop_event.is_set():
            break
    print(f"Max force value: {max_val}\nExiting thread...\n")
    # except KeyboardInterrupt:
    #     print("Test Cancelled")
    # except Exception as e:
    #     print("ERROR OCCURED")
    #     raise e

async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    # global stop_threads
    # global in_motion
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()
    # stop_threads = Event()

    test_tag = input("Enter test tag:\n\t>> ")
    test_robot = input("Enter robot ID:\n\t>> ")

    test_name = "current-force-char-test"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Time (s)', 'Force Read (N)', 'Current (A)', 'Trial', 'Test Robot']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    current_list = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8,
                    0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0]

    final_position = await helpers_ot3.jog_mount_ot3(api, mount)
    print(f"Jogged the mount to deck coordinate: {final_position}")
    ### Jogged the mount to deck coordinate: {<OT3Axis.X: 0>: 413.709, <OT3Axis.Y: 1>: 423.3, <OT3Axis.Z_L: 2>: 499.151, <OT3Axis.P_L: 5>: 0}
    await api.home([AXIS])
    await api.home_plunger(mount)
    for current in current_list:
        for i in range(TRIALS):
    # i = 0
    # current = 0.1
            print(f"Trial {i+1}, Current: {current}\n")
            stop_event = Event()
            # stop_threads = Event()
            # final_position = await helpers_ot3.jog_mount_ot3(api, mount)
            # print(f"Jogged the mount to deck coordinate: {final_position}")

            await api.move_to(mount, Point(final_position[OT3Axis.X],
                                final_position[OT3Axis.Y], final_position[AXIS]))
            await helpers_ot3.update_pick_up_current(api, mount, current)
            force_thread = Thread(target=force_record, args=(stop_event, current,
                                                             i+1, test_robot, test_name, file_name))
            # stop_threads = False
            # in_motion = True
            force_thread.start()
            tip_len = 57 # 50uL Tip
            # tip_len = 85 # 1K tip
            print("pick up tip in main\n")
            await api.pick_up_tip(mount, tip_length=57)
            print("sleep...\n")
            await asyncio.sleep(1)
            # print("set in main\n")
            # stop_threads = True
            # in_motion = False
            stop_event.set()
            ##force_thread.do_run = False
            # print("join in main\n")
            force_thread.join()
            # print("end of loop in main")
            await api.remove_tip(mount)

# def force_record(motor_current, trial, test_robot, test_name, file_name):
#     ### global stop_threads
#
#     force_thread = currentThread()
#     start_time = time.perf_counter()
#     # if trial > 0:
#     #     test_robot = ""
#     try:
#         while getattr(force_thread, "do_run", True):##while not stop_event.is_set():
#             reading = float(fg.read_force())
#             print(f"Reading: {reading} N\n")
#             cycle_data = [time.perf_counter()-start_time, reading, motor_current, trial, test_robot]
#             cycle_data_str = data.convert_list_to_csv_line(cycle_data)
#             data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)
#             # if stop_threads:
#             #     break
#         printf("outside loop\n")
#     except KeyboardInterrupt:
#         print("Test Cancelled")
#     except Exception as e:
#         print("ERROR OCCURED")
#         raise e

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
    parser.add_argument("--port", type=str,
                        default = '/dev/ttyUSB0', help = "Force Gauge Port")
    args = parser.parse_args()
    mount = mount_options[args.mount]

    fg = Mark10.create(port=args.port)
    fg.connect()

    asyncio.run(_main(args.simulate, mount))
