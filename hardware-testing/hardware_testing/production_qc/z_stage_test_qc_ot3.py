"""OT-3 Z-stage test."""
import os,time
import argparse
import asyncio
from numpy import float64
import subprocess
from typing import Optional, Callable, List, Any, Tuple, Dict
from dataclasses import dataclass, fields
from threading import Thread
from pathlib import Path

# from opentrons_hardware.drivers.can_bus.build import build_driver
# from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
# from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteName
# from opentrons_hardware.hardware_control.current_settings import set_currents
# from opentrons_hardware.hardware_control.motion import (
#     MoveGroupSingleAxisStep,
#     create_home_step,
# )
# from opentrons_hardware.firmware_bindings.messages.message_definitions import (
#     InstrumentInfoRequest,
# )
# from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
# from opentrons_hardware.scripts.can_args import add_can_args, build_settings

from opentrons.config.defaults_ot3 import (
    DEFAULT_MAX_SPEEDS,
    DEFAULT_ACCELERATIONS,
    DEFAULT_RUN_CURRENT,
    DEFAULT_HOLD_CURRENT,
)
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api.types import Axis, OT3Mount, Point, OT3AxisKind
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data
from hardware_testing.data import ui

from hardware_testing import data
from hardware_testing.drivers import list_ports_and_select,find_port
from hardware_testing.drivers.mark10.mark10_fg import Mark10,SimMark10

from opentrons_shared_data.errors.exceptions import MoveConditionNotMetError

import logging

LOG = logging.getLogger(__name__)
LOG.setLevel(logging.INFO)


default_move_speed = 15
default_run_current = 1.4
currents = (1.0, 1.5)
speeds = (20, 25)
force_gauge_currents = (0.5, 1.0, 1.5)
force_gauge_speeds = (2, 5, 10, 20)
Z_STAGE_TOLERANCES_MM = 0.4

FORCE_SPEED = 10

data_format = "||{0:^12}|{1:^12}|{2:^12}||"

CYCLES = 1
sus_str = "----_----"
thread_sensor = False
cu_fg = 0.0
sp_fg = 0.0
distance_fg = 0.0


# NODE = NodeId.head_l

# save test results, to be saved and displayed at the end
CURRENTS_SPEEDS_TEST_RESULTS = []
FORCE_GAUGE_TEST_RESULTS = []



# def _convert_node_to_str(Node: NodeId) -> str:
#     if Node == NodeId.head_l:
#         return 'Mount_left'
#     else:
#         return 'Mount_right'
def _connect_to_mark10_fixture(simulate: bool) -> Mark10:
    if not simulate:
        # _port = list_ports_and_select('mark10')
        # fixture = Mark10.create(port=_port)
        # LOG.info(_port)
        fixture = Mark10.create(port='/dev/ttyUSB0')
    else:
        fixture = SimMark10()  # type: ignore[assignment]
    fixture.connect()
    LOG.info(fixture)
    return fixture

# @dataclass
# class CSVCallbacks:
#     """CSV callback functions."""
#
#     write: Callable
#
#
# @dataclass
# class CSVProperties:
#     """CSV properties."""
#
#     id: str
#     name: str
#     path: str
#
#
# def _create_csv_and_get_callbacks(sn:str) -> Tuple[CSVProperties, CSVCallbacks]:
#     run_id = data.create_run_id()
#     test_name = data.create_test_name_from_file(__file__)
#     folder_path = data.create_folder_for_test_data(test_name)
#     file_name = data.create_file_name(test_name, run_id, sn)
#     csv_display_name = os.path.join(folder_path, file_name)
#     print(f"CSV: {csv_display_name}")
#     start_time = time.time()
#
#     def _append_csv_data(
#         data_list: List[Any],
#         line_number: Optional[int] = None,
#         first_row_value: Optional[str] = None,
#         first_row_value_included: bool = False,
#     ) -> None:
#         # every line in the CSV file begins with the elapsed seconds
#         if not first_row_value_included:
#             if first_row_value is None:
#                 first_row_value = str(round(time.time() - start_time, 2))
#             data_list = [first_row_value] + data_list
#         data_str = ",".join([str(d) for d in data_list])
#         if line_number is None:
#             data.append_data_to_file(test_name, file_name, data_str + "\n")
#         else:
#             data.insert_data_to_file(test_name, file_name, data_str + "\n", line_number)
#     return (
#         CSVProperties(id=run_id, name=test_name, path=csv_display_name),
#         CSVCallbacks(
#             write=_append_csv_data,
#         ),
#     )



# async def _home(messenger: CanMessenger) -> None:
#     await _set_current(messenger, default_run_current)
#     home_runner = MoveGroupRunner(
#         move_groups=[[create_home_step({NODE: float64(100.0)}, {NODE: float64(-5)})]]
#     )
#     await home_runner.run(can_messenger=messenger)
#
# async def _homeMount(messenger: CanMessenger) -> None:
#     await _set_current(messenger, default_run_current)
#     # Home mount Left
#     home_runner = MoveGroupRunner(
#         move_groups=[[create_home_step({NodeId.head_l: float64(100.0)}, {NodeId.head_l: float64(-5)})]]
#     )
#     await home_runner.run(can_messenger=messenger)
#     # Home Mount right
#     home_runner = MoveGroupRunner(
#         move_groups=[[create_home_step({NodeId.head_r: float64(100.0)}, {NodeId.head_r: float64(-5)})]]
#     )
#     await home_runner.run(can_messenger=messenger)
#
# async def _home_check(messenger: CanMessenger) -> None:
#     check = True
#     count = 0
#     while check:
#         count += 1
#         mot, enc = await _move_to(
#                     messenger, 1, default_move_speed, check=True
#                 )
#         print("enc",enc)
#         if abs(enc) <= 1.1:
#             check = False
#         elif count > 5:
#             #raise OverHomeCountError
#             print(233333)
#         else:
#             await _home(messenger)




# async def _set_current(messenger: CanMessenger, run_current: float) -> None:
#     currents: Dict[NodeId, Tuple[float, float]] = dict()
#     currents[NODE] = (float(0.1), float(run_current))
#     try:
#         await set_currents(messenger, currents)
#     except asyncio.CancelledError:
#         pass


# class LoseStepError(Exception):
#     """Lost Step Error."""
#
#     pass
#
# class OverHomeCountError(Exception):
#     print('Homed over the max count, please check the z-stage')


def _record_force(mark10:Mark10):
    global thread_sensor
    global cu_fg
    # mark10 = _connect_to_mark10_fixture(False)
    try:
        while thread_sensor:
            time.sleep(0.2)
            force = mark10.read_force()
            # write_cb([_convert_node_to_str(NODE), cu_fg, sp_fg, force])
            # FORCE_GAUGE_TEST_RESULTS.append([_convert_node_to_str(NODE), cu_fg, sp_fg, force])
            # print(_convert_node_to_str(NODE), cu_fg, sp_fg, force)
    except Exception as e:
        thread_sensor = False
        print(e)
    except KeyboardInterrupt:
        thread_sensor = False


async def _force_gauge(api: OT3API, mount: OT3Mount, simulate: bool) -> None:
    global thread_sensor
    global cu_fg
    LOG.info("_force_gauge")
    mark10 = _connect_to_mark10_fixture(simulate)
    LOG.info("connected to mark 10")
    z_ax = Axis.by_mount(mount)
    LOG.info(f"Home Axis: {z_ax}")
    await api.home([z_ax])
    home_pos = await api.gantry_position(mount)
    LOG.info(f"Home Position: {home_pos}")
    pre_test_pos = home_pos._replace(z=home_pos.z - 15)
    LOG.info(f"Pre-Test Position: {pre_test_pos}")
    press_pos = home_pos._replace(z=pre_test_pos.z - 7)
    LOG.info(f"Press Position: {press_pos}")

    for cu_fg in force_gauge_currents:
        # Move to just above force gauge
        await api.move_to(mount=mount, abs_position=pre_test_pos)

        ui.print_header(f'Testing Current = {cu_fg}')
        TH = Thread(target=_record_force, args=(mark10,))
        thread_sensor = True
        TH.start()

        # await api._backend.set_active_current({z_ax: cu_fg})
        await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
            api,
            z_ax,
            api.gantry_load,
            run_current=cu_fg
        )
        LOG.info(f"Current: {api._backend._current_settings[z_ax].run_current}")
        await api.move_to(mount=mount, abs_position=press_pos,
                          speed=FORCE_SPEED, _expect_stalls=True)
        thread_sensor = False
        TH.join()

        # await api._backend.set_active_current({z_ax: 1})
        await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
            api,
            z_ax,
            api.gantry_load,
            run_current=1.0
        )
        # we expect a stall has happened during pick up, so we want to
        # update the motor estimation
        await api._update_position_estimation([Axis.by_mount(mount)])

        await api.move_to(mount=mount, abs_position=pre_test_pos)

        # await _set_current(messenger, default_run_current)
        # await _home(messenger)

# def _results_check() -> None:
#     c_left_count = 0
#     c_right_count = 0
#     f_left_count = 0
#     f_right_count = 0
#     for re in CURRENTS_SPEEDS_TEST_RESULTS:
#         if 'Mount_left' == re[0] and 'PASS' == re[3]:
#             c_left_count += 1
#         elif 'Mount_right' == re[0] and 'PASS' == re[3]:
#             c_right_count += 1
#
#     for re in FORCE_GAUGE_TEST_RESULTS:
#         if 'Mount_left' == re[0] and re[3] > 300:
#             f_left_count += 1
#         elif 'Mount_right' == re[0] and re[3] > 300:
#             f_right_count += 1
#     _print_title('Test Results')
#     print(f'Mount_left Current and Speed Test: --PASS') if c_left_count >= 10 else print(f'Mount_left Current and Speed Test: --FAIL')
#     print(f'Mount_right Current and Speed Test: --PASS') if c_right_count >= 10 else print(f'Mount_right Current and Speed Test: --FAIL')
#     print(f'Mount_left Force Guage Test: --PASS') if f_left_count >= 10 else print(f'Mount_left Force Guage Test: --FAIL')
#     print(f'Mount_right Force Guage Test: --PASS') if f_right_count >= 10 else print(f'Mount_right Force Guage Test: --FAIL')

async def _run(api: OT3API, arguments: argparse.Namespace) -> None:
    # if "q" in input("\n\tEnter 'q' to exit"):
    #     raise KeyboardInterrupt()


    if not arguments.skip_left:
        ui.print_header("Test mount left")

        if not arguments.skip_force_left:
            ui.print_header("Force_Gauge_Test")
            await _force_gauge(api, OT3Mount.LEFT, arguments.simulate)

    if not arguments.skip_right:
        print('----Test mount right----')

        if not arguments.skip_force_right:
            print("Force_Gauge_Test")
            await _force_gauge(api, OT3Mount.RIGHT, arguments.simulate)

    # if not arguments.skip_results_check:
    #     _results_check()

    print('Test Done...')



async def _main(arguments: argparse.Namespace) -> None:
    """Main, z-stage test."""
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=arguments.simulate
    )
    try:
        await api.home([Axis.X,
                        Axis.Y,
                        Axis.by_mount(OT3Mount.LEFT),
                        Axis.by_mount(OT3Mount.RIGHT)])
    except MoveConditionNotMetError:
        await api.home([Axis.X,
                        Axis.Y,
                        Axis.by_mount(OT3Mount.LEFT),
                        Axis.by_mount(OT3Mount.RIGHT)])

    # await api.home([Axis.X])
    # await api.home([Axis.Y])
    # await api.home([Axis.by_mount(OT3Mount.LEFT)])
    # await api.home([Axis.by_mount(OT3Mount.RIGHT)])
    qc_pass = True



    try:
        await _run(api, arguments)
    except KeyboardInterrupt:
        print("Cancelled")
    except Exception as e:
        await api.clean_up()
        if qc_pass:
            ui.print_title("Test Done - PASSED")
        else:
            ui.print_title("Test Done - FAILED")
        raise e

    # subprocess.run(["systemctl", "stop", "opentrons-robot-server"])
    # driver = await build_driver(build_settings(arguments))
    # messenger = CanMessenger(driver=driver)
    # messenger.start()
    # while True:
    #     try:
    #         await _run(messenger,arguments)
    #     except KeyboardInterrupt:
    #         break
    #     except Exception as e:
    #         print(e)


if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser(description="OT3 Z_stage Test")
    # add_can_args(arg_parser)
    arg_parser.add_argument("--simulate", action="store_true")
    arg_parser.add_argument("--operator", type=str, required=True)
    arg_parser.add_argument("--sn", type=str, required=True)
    arg_parser.add_argument("--skip_current_left", action="store_true")
    arg_parser.add_argument("--skip_current_right", action="store_true")
    arg_parser.add_argument("--skip_left", action="store_true")
    arg_parser.add_argument("--skip_right", action="store_true")
    arg_parser.add_argument("--skip_force_left", action="store_true")
    arg_parser.add_argument("--skip_force_right", action="store_true")
    arg_parser.add_argument("--skip_results_check", action="store_true")
    asyncio.run(_main(arg_parser.parse_args()))
