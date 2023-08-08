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


FORCE_SPEED = 10

FORCE_TEST_SETTINGS = [{"CURRENT":0.15,
                        "F_AVG": 20},
                       {"CURRENT":0.5,
                        "F_AVG": 40},
                       {"CURRENT":1.5,
                        "F_AVG": 55}]


thread_sensor = False

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


def _record_force(mark10:Mark10):
    global thread_sensor
    global force_output
    # mark10 = _connect_to_mark10_fixture(False)
    try:
        while thread_sensor:
            time.sleep(0.1)
            force = mark10.read_force()
            force_output.append(force)
            LOG.info(f"Force: {force}")
            # write_cb([_convert_node_to_str(NODE), cu_fg, sp_fg, force])
            # FORCE_GAUGE_TEST_RESULTS.append([_convert_node_to_str(NODE), cu_fg, sp_fg, force])
            # print(_convert_node_to_str(NODE), cu_fg, sp_fg, force)
    except Exception as e:
        thread_sensor = False
        print(e)
    except KeyboardInterrupt:
        thread_sensor = False

def analyze_force(force_output: List, avg_pass: float) -> bool:
    """Analyze the Force output from the test to check for pass/fail."""
    # Only average forces higher than half of the max value
    max_force = max(force_output)
    print(f"Max Force: {max_force}")

    if max_force <= 0:
        return False

    count = 0
    sum = 0
    for force in force_output:
        if force > max_force/2:
            count += 1
            sum += force

    average_force = sum/count
    print(f"Average Force: {average_force}")

    if average_force > avg_pass:
        return True
    else:
        return False



async def _force_gauge(api: OT3API, mount: OT3Mount, simulate: bool) -> bool:
    global thread_sensor
    global force_output

    LOG.info("_force_gauge")
    mark10 = _connect_to_mark10_fixture(simulate)
    LOG.info("connected to mark 10")
    ui.print_header(f'Testing {mount.name} Mount')
    z_ax = Axis.by_mount(mount)
    LOG.info(f"Home Axis: {z_ax}")
    await api.home([z_ax])
    home_pos = await api.gantry_position(mount)
    LOG.info(f"Home Position: {home_pos}")
    pre_test_pos = home_pos._replace(z=home_pos.z - 10)
    LOG.info(f"Pre-Test Position: {pre_test_pos}")
    press_pos = home_pos._replace(z=pre_test_pos.z - 35)
    LOG.info(f"Press Position: {press_pos}")

    qc_pass = True
    for test in FORCE_TEST_SETTINGS:
        test_current = test["CURRENT"]
        # Move to just above force gauge
        await api.move_to(mount=mount, abs_position=pre_test_pos)

        ui.print_header(f'Testing Current = {test_current}')
        TH = Thread(target=_record_force, args=(mark10,))
        thread_sensor = True
        force_output = []
        TH.start()
        try:
            async with api._backend.restore_current():
                await api._backend.set_active_current({z_ax:test_current})
                LOG.info(f"Current: {api._backend._current_settings[z_ax].run_current}")
                await api.move_to(mount=mount, abs_position=press_pos,
                                  speed=FORCE_SPEED, _expect_stalls=True)
        finally:
            thread_sensor = False
            TH.join()

        force_pass = analyze_force(force_output, test["F_AVG"])
        if force_pass:
            print("PASS")
        else:
            print("FAIL")
        qc_pass = qc_pass and force_pass
        # we expect a stall has happened during pick up, so we want to
        # update the motor estimation
        await api._update_position_estimation([Axis.by_mount(mount)])

        await api.move_to(mount=mount, abs_position=pre_test_pos)

    return qc_pass

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

async def _run(api: OT3API, arguments: argparse.Namespace) -> bool:
    qc_pass = True

    if not arguments.skip_left:
        ui.print_header("Test mount left")

        if not arguments.skip_force_left:
            ui.print_header("Force_Gauge_Test")
            res = await _force_gauge(api, OT3Mount.LEFT, arguments.simulate)
            qc_pass = res and qc_pass


    if not arguments.skip_right:
        print('----Test mount right----')

        if not arguments.skip_force_right:
            print("Force_Gauge_Test")
            res = await _force_gauge(api, OT3Mount.RIGHT, arguments.simulate)
            qc_pass = res and qc_pass

    return qc_pass



async def _main(arguments: argparse.Namespace) -> None:
    """Main, z-stage test."""
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=arguments.simulate
    )
    await api.set_gantry_load(api.gantry_load)

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

    qc_pass = False



    try:
        qc_pass = await _run(api, arguments)
    except KeyboardInterrupt:
        print("Cancelled")
    except Exception as e:
        raise e
    finally:
        await api.clean_up()
        if qc_pass:
            ui.print_title("Test Done - PASSED")
        else:
            ui.print_title("Test Done - FAILED")


if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser(description="OT3 Z_stage Test")
    # add_can_args(arg_parser)
    arg_parser.add_argument("--simulate", action="store_true")
    arg_parser.add_argument("--operator", type=str, required=True)
    arg_parser.add_argument("--sn", type=str, required=True)
    arg_parser.add_argument("--skip_left", action="store_true")
    arg_parser.add_argument("--skip_right", action="store_true")
    arg_parser.add_argument("--skip_force_left", action="store_true")
    arg_parser.add_argument("--skip_force_right", action="store_true")
    asyncio.run(_main(arg_parser.parse_args()))
