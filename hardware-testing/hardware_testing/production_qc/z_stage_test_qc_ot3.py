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
from statistics import mean

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

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVSection,
    CSVLine,
)

from opentrons_shared_data.errors.exceptions import MoveConditionNotMetError

import logging

LOG = logging.getLogger(__name__)
LOG.setLevel(logging.INFO)

FORCE_SPEED = 10

FORCE_MARGIN = 15 # Percentage
FORCE_TEST_SETTINGS = [{"CURRENT":0.15,
                        "F_MAX": 50},
                       {"CURRENT":0.2,
                        "F_MAX": 73},
                       {"CURRENT":0.3,
                        "F_MAX": 120},
                       {"CURRENT":0.4,
                        "F_MAX": 175},
                       {"CURRENT":0.5,
                        "F_MAX": 220},
                       {"CURRENT":0.6,
                        "F_MAX": 230},
                       {"CURRENT":0.7,
                        "F_MAX": 285},
                       {"CURRENT":1.4,
                        "F_MAX": 530},
                       {"CURRENT":1.5,
                        "F_MAX": 550}]

CYCLES_CURRENT = 5

thread_sensor = False

TEST_PARAMETERS = {"SPEED": FORCE_SPEED,
                   "FORCE_MARGIN": FORCE_MARGIN,
                   "CYCLES": CYCLES_CURRENT}
for i in FORCE_TEST_SETTINGS:
    TEST_PARAMETERS[str(i["CURRENT"])] = i["F_MAX"]

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


def _get_test_tag(current: float) -> str:
    return f"current-{current}"


def _build_csv_report() -> CSVReport:
    _report = CSVReport(
        test_name="z-stage-test-qc-ot3",
        sections=[
            CSVSection(
                title="TEST_PARAMETERS", lines=[CSVLine(parameter,
                                                        [int])
                                                for parameter in TEST_PARAMETERS]
            ),
            CSVSection(
                title=OT3Mount.LEFT.name,
                lines=[
                    CSVLine(
                        _get_test_tag(setting["CURRENT"]),
                        [str, float, str, float, str, float, str, float, CSVResult],
                    )
                    for setting in FORCE_TEST_SETTINGS
                ],
            ),
            CSVSection(
                title=OT3Mount.RIGHT.name,
                lines=[
                    CSVLine(
                        _get_test_tag(setting["CURRENT"]),
                        [str, float, str, float, str, float, str, float, CSVResult],
                    )
                    for setting in FORCE_TEST_SETTINGS
                ],
            )
        ],
    )
    return _report


@dataclass
class CSVCallbacks:
    """CSV callback functions."""

    write: Callable


@dataclass
class CSVProperties:
    """CSV properties."""

    id: str
    name: str
    path: str


def _create_csv_and_get_callbacks(sn:str) -> Tuple[CSVProperties, CSVCallbacks]:
    run_id = data.create_run_id()
    test_name = data.create_test_name_from_file(__file__)
    folder_path = data.create_folder_for_test_data(test_name)
    file_name = data.create_file_name(test_name, run_id, sn)
    csv_display_name = os.path.join(folder_path, file_name)
    print(f"CSV: {csv_display_name}")
    start_time = time.time()

    def _append_csv_data(
        data_list: List[Any],
        line_number: Optional[int] = None,
        first_row_value: Optional[str] = None,
        first_row_value_included: bool = False,
    ) -> None:
        # every line in the CSV file begins with the elapsed seconds
        if not first_row_value_included:
            if first_row_value is None:
                first_row_value = str(round(time.time() - start_time, 2))
            data_list = [first_row_value] + data_list
        data_str = ",".join([str(d) for d in data_list])
        if line_number is None:
            data.append_data_to_file(test_name, file_name, data_str + "\n")
        else:
            data.insert_data_to_file(test_name, file_name, data_str + "\n", line_number)
    return (
        CSVProperties(id=run_id, name=test_name, path=csv_display_name),
        CSVCallbacks(
            write=_append_csv_data,
        ),
    )

def _record_data(
    type: str,
    write_cb: Callable,
    current: float,
    result: bool,
    max_force: float,
    max_force_range: float,
    average_force: float,
    average_force_range: float
) -> None:
    """Record data to csv."""
    write_cb(
        [type]
        + [result]
        + ["Current"]
        + [str(current)]
        + ["Max Force"]
        + [str(max_force)]
        + ["Max Force Range"]
        + [str(max_force_range)]
        + ["Average Force"]
        + [str(average_force)]
        + ["Average Force Range"]
        + [str(average_force_range)]
    )


def _record_force(mark10:Mark10):
    global thread_sensor
    global force_output
    # mark10 = _connect_to_mark10_fixture(False)
    try:
        while thread_sensor:
            force = mark10.read_force()
            force_output.append(force)
            # LOG.info(f"Force: {force}")
            # write_cb([_convert_node_to_str(NODE), cu_fg, sp_fg, force])
            # FORCE_GAUGE_TEST_RESULTS.append([_convert_node_to_str(NODE), cu_fg, sp_fg, force])
            # print(_convert_node_to_str(NODE), cu_fg, sp_fg, force)
    except Exception as e:
        thread_sensor = False
        print(e)
    except KeyboardInterrupt:
        thread_sensor = False

def analyze_force(force_output: List) -> Tuple[bool, float, float]:
    """Analyze the Force output from the test to check for pass/fail."""
    # Only average forces higher than half of the max value
    LOG.debug(f"analyze_force: {force_output}")

    # Check for first 0 to ensure gauge is zeroed
    if not force_output[0] == 0:
        return (False, 0, 0)

    max_force = max(force_output)
    print(f"Max Force: {max_force}")

    # Check max >= to ensure we actually recorded a force
    if max_force <= 0:
        return (False, 0, 0)

    count = 0
    sum = 0
    for force in force_output:
        if force > max_force/2:
            count += 1
            sum += force

    average_force = sum/count
    print(f"Average Force: {average_force}")

    return (True, max_force, average_force)


def check_force(mount: OT3Mount, current: float,
                report: CSVReport,
                average_forces: List, max_forces: List,
                avg_pass: float, max_pass: float) -> bool:
    average_force = round(mean(average_forces), 2)
    max_force = round(mean(max_forces), 2)
    average_force_range = round(max(average_forces)-min(average_forces), 2)
    max_force_range = round(max(max_forces)-min(max_forces), 2)
    LOG.info(f"max_force: {max_force}")
    LOG.info(f"max_force_range: {max_force_range}")
    LOG.info(f"average_force: {average_force}")
    LOG.info(f"average_force_range: {average_force_range}")

    qc_pass = False
    # Allow values within the FORCE_MARGIN percentage to pass
    LL = max_pass * (100-FORCE_MARGIN)/100
    UL = max_pass * (100+FORCE_MARGIN)/100
    if LL < max_force and max_force < UL:
        qc_pass = True
    else:
        qc_pass = False

    # _record_data(mount.name, write_cb, current, qc_pass,
    #              max_force, max_force_range,
    #              average_force, average_force_range)

    _tag = _get_test_tag(current)
    report(
        mount.name,
        _tag,
        ["MAX", max_force, "MAX_RANGE", max_force_range, "AVERAGE", average_force, "AVERAGE_RANGE", average_force_range, CSVResult.from_bool(qc_pass)],
    )

    return qc_pass


async def _force_gauge(api: OT3API, mount: OT3Mount, report: CSVReport, simulate: bool) -> bool:
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
    press_pos = home_pos._replace(z=pre_test_pos.z - 12)
    LOG.info(f"Press Position: {press_pos}")

    qc_pass = True
    # Test each current setting
    for test in FORCE_TEST_SETTINGS:
        # Test each current setting several times and average the results
        max_results = []
        avg_results = []
        test_current = test["CURRENT"]
        for i in range(CYCLES_CURRENT):
            # Move to just above force gauge
            await api.move_to(mount=mount, abs_position=pre_test_pos)

            ui.print_header(f'Cycle {i+1}: Testing Current = {test_current}')
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

            analyzed_valid, analyzed_max, analyzed_avg  = analyze_force(force_output)

            if analyzed_valid:
                max_results.append(analyzed_max)
                avg_results.append(round(analyzed_avg, 1))
            else:
                ui.print_error("DATA INVALID - z-stage did not contact or guage not zeroed")
                qc_pass = False
                break

            # we expect a stall has happened during pick up, so we want to
            # update the motor estimation
            await api._update_position_estimation([Axis.by_mount(mount)])

            await api.move_to(mount=mount, abs_position=pre_test_pos)

        LOG.info(f"max_results: {max_results}")
        LOG.info(f"avg_results: {avg_results}")
        res = check_force(mount, test_current,
                          report,
                          avg_results, max_results,
                          0, test["F_MAX"])
        if res:
            ui.print_header(f"CURRENT: {test_current} - PASS")
        else:
            ui.print_header(f"CURRENT: {test_current} - FAIL")
        qc_pass = qc_pass and res

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

async def _run(api: OT3API, arguments: argparse.Namespace, report: CSVReport) -> bool:
    qc_pass = True

    if not arguments.skip_left:
        ui.print_header("Test mount left")

        if not arguments.skip_force_left:
            ui.print_header("Force_Gauge_Test")
            res = await _force_gauge(api, OT3Mount.LEFT,
                                     report, arguments.simulate)
            qc_pass = res and qc_pass


    if not arguments.skip_right:
        print('----Test mount right----')

        if not arguments.skip_force_right:
            print("Force_Gauge_Test")
            res = await _force_gauge(api, OT3Mount.RIGHT,
                                     report,  arguments.simulate)
            qc_pass = res and qc_pass

    return qc_pass



async def _main(arguments: argparse.Namespace) -> None:
    """Main, z-stage test."""
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=arguments.simulate
    )
    await api.set_gantry_load(api.gantry_load)


    # # callback function for writing new data to CSV file
    # csv_props, csv_cb = _create_csv_and_get_callbacks("SN")
    # # cache the pressure-data header
    # # add metadata to CSV
    # # FIXME: create a set of CSV helpers, such that you can define a test-report
    # #        schema/format/line-length/etc., before having to fill its contents.
    # #        This would be very helpful, because changes to CVS length/contents
    # #        will break the analysis done in our Sheets
    # csv_cb.write(["--------"])
    # csv_cb.write(["METADATA"])
    # csv_cb.write(["test-name", csv_props.name])
    # csv_cb.write(["serial-number", "SN"])
    # csv_cb.write(["operator-name", "OPERATOR"])
    # csv_cb.write(["date", csv_props.id])  # run-id includes a date/time string
    # test_name = Path(__file__).name
    #
    # ui.print_title(test_name.replace("_", " ").upper())
    report = _build_csv_report()
    helpers_ot3.set_csv_report_meta_data_ot3(api, report)

    for k,v in TEST_PARAMETERS.items():
        report("TEST_PARAMETERS", k, [v])

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
        qc_pass = await _run(api, arguments, report)
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
