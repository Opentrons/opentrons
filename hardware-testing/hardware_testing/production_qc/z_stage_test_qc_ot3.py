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



default_move_speed = 15
default_run_current = 1.4
currents = (1.0, 1.5)
speeds = (20, 25)
force_gauge_currents = (0.5, 1.0, 1.5)
force_gauge_speeds = (2, 5, 10, 20)
Z_STAGE_TOLERANCES_MM = 0.4

data_format = "||{0:^12}|{1:^12}|{2:^12}||"

CYCLES = 1
sus_str = "----_----"
thread_sensor = False
cu_fg = 0.0
sp_fg = 0.0
distance_fg = 0.0


NODE = NodeId.head_l

# save test results, to be saved and displayed at the end
CURRENTS_SPEEDS_TEST_RESULTS = []
FORCE_GAUGE_TEST_RESULTS = []



def _convert_node_to_str(Node: NodeId) -> str:
    if Node == NodeId.head_l:
        return 'Mount_left'
    else:
        return 'Mount_right'
def _connect_to_mark10_fixture(simulate: bool) -> Mark10:
    if not simulate:
        # _port = list_ports_and_select('mark10')
        fixture = Mark10.create(port='/dev/ttyUSB0')
    else:
        fixture = SimMark10()  # type: ignore[assignment]
    fixture.connect()
    return fixture

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



async def _home(messenger: CanMessenger) -> None:
    await _set_current(messenger, default_run_current)
    home_runner = MoveGroupRunner(
        move_groups=[[create_home_step({NODE: float64(100.0)}, {NODE: float64(-5)})]]
    )
    await home_runner.run(can_messenger=messenger)

async def _homeMount(messenger: CanMessenger) -> None:
    await _set_current(messenger, default_run_current)
    # Home mount Left
    home_runner = MoveGroupRunner(
        move_groups=[[create_home_step({NodeId.head_l: float64(100.0)}, {NodeId.head_l: float64(-5)})]]
    )
    await home_runner.run(can_messenger=messenger)
    # Home Mount right
    home_runner = MoveGroupRunner(
        move_groups=[[create_home_step({NodeId.head_r: float64(100.0)}, {NodeId.head_r: float64(-5)})]]
    )
    await home_runner.run(can_messenger=messenger)

async def _home_check(messenger: CanMessenger) -> None:
    check = True
    count = 0
    while check:
        count += 1
        mot, enc = await _move_to(
                    messenger, 1, default_move_speed, check=True
                )
        print("enc",enc)
        if abs(enc) <= 1.1:
            check = False
        elif count > 5:
            #raise OverHomeCountError
            print(233333)
        else:
            await _home(messenger)




async def _set_current(messenger: CanMessenger, run_current: float) -> None:
    currents: Dict[NodeId, Tuple[float, float]] = dict()
    currents[NODE] = (float(0.1), float(run_current))
    try:
        await set_currents(messenger, currents)
    except asyncio.CancelledError:
        pass


class LoseStepError(Exception):
    """Lost Step Error."""

    pass

class OverHomeCountError(Exception):
    print('Homed over the max count, please check the z-stage')

async def _move_to(
    messenger: CanMessenger,
    distance: float,
    velocity: float,
    check: bool = False,
) -> Tuple[float, float]:
    move_runner = MoveGroupRunner(
        move_groups=[
            [
                {
                    NODE: MoveGroupSingleAxisStep(
                        distance_mm=float64(0),
                        velocity_mm_sec=float64(velocity),
                        duration_sec=float64(abs(distance / velocity)),
                    )
                }
            ]
        ],
    )
    axis_dict = await move_runner.run(can_messenger=messenger)
    motor_pos = float(axis_dict[NODE][0])
    encoder_pos = float(axis_dict[NODE][1])
    motor_str = str(round(motor_pos, 2))
    encoder_str = str(round(encoder_pos, 2))
    if check and abs(motor_pos - abs(encoder_pos)) > Z_STAGE_TOLERANCES_MM:
        raise LoseStepError(
            f"ERROR: lost steps (motor={motor_str}, encoder={encoder_str}"
        )
    return motor_pos, encoder_pos



async def _currents_speeds_test(messenger: CanMessenger,write_cb: Callable):
    print('-----------Home----------')
    await _home(messenger)
    mot, enc = await _move_to(
        messenger, 5, default_move_speed, check=True
    )
    print(f"motor position: {mot}, encoder position: {enc}")
    for cu in currents:
        for sp in speeds:
            print('Start Currents and Speeds testing, Current= {}, Speed= {}::::'.format(cu, sp))
            try:
                await _set_current(messenger, cu)
                for c in range(CYCLES):
                    # print(f"cycle: {c + 1}/{CYCLES}")
                    mot, enc = await _move_to(
                        messenger, 80, sp, check=True
                    )
                    print(f"motor position: {mot}, encoder position: {enc}")
                    mot, enc = await _move_to(
                        messenger, 80, -sp, check=True
                    )
                    print(f"motor position: {mot}, encoder position: {enc}")
                    try:
                        write_cb([_convert_node_to_str(NODE), cu, sp, 'PASS'])
                        CURRENTS_SPEEDS_TEST_RESULTS.append([_convert_node_to_str(NODE), cu, sp, 'PASS'])
                    except Exception as e:
                        print(e)
            except LoseStepError as e:
                print(44444444)
                print(str(e))
                await _set_current(messenger, default_run_current)
                print(5555555)
                await _home(messenger)
                #await _home_check(messenger)
                print(6666666)
                mot, enc = await _move_to(
                    messenger, 15, default_move_speed, check=False
                )
                print(7777777)
                print(f"motor position: {mot}, encoder position: {enc}")
                write_cb([_convert_node_to_str(NODE), cu, sp, 'FAIL'])
                CURRENTS_SPEEDS_TEST_RESULTS.append([_convert_node_to_str(NODE), cu, sp, 'FAIL'])


def _record_force(mark10:Mark10,messenger: CanMessenger,write_cb: Callable):
    global thread_sensor
    global cu_fg, sp_fg, distance_fg
    # mark10 = _connect_to_mark10_fixture(False)
    try:
        while thread_sensor:
            time.sleep(0.2)
            force = mark10.read_force()
            write_cb([_convert_node_to_str(NODE), cu_fg, sp_fg, force])
            FORCE_GAUGE_TEST_RESULTS.append([_convert_node_to_str(NODE), cu_fg, sp_fg, force])
            print(_convert_node_to_str(NODE), cu_fg, sp_fg, force)
    except Exception as e:
        thread_sensor = False
        print(e)
    except KeyboardInterrupt:
        thread_sensor = False

async def _force_gauge(messenger: CanMessenger,write_cb: Callable):
    global thread_sensor
    global cu_fg, sp_fg, distance_fg
    mark10 = _connect_to_mark10_fixture(False)
    for cu_fg in force_gauge_currents:
        for sp_fg in force_gauge_speeds:
            await _set_current(messenger, default_run_current)
            await _home(messenger)
            await _move_to(
                messenger, 85, default_move_speed, check=True
            )
            print(f'current = {cu_fg},speed = {sp_fg}')
            TH = Thread(target=_record_force, args=(mark10,messenger,write_cb))
            try:
                print('Start record force...')
                thread_sensor = True
                TH.start()
                distance_fg = 95
                await _set_current(messenger, cu_fg)
                await _move_to(
                    messenger, distance_fg, sp_fg, check=True
                )
            except LoseStepError as e:
                thread_sensor = False
                TH.join()
                print(e)
                await _set_current(messenger, default_run_current)
                mot, enc = await _move_to(
                    messenger, 75, -default_move_speed, check=False
                )
                print(88888888888888)
                await _home(messenger)
                #await _home_check(messenger)

def _print_title(title: str) -> None:
    PRINT_HEADER_NUM_SPACES = 4
    PRINT_HEADER_DASHES = "-" * PRINT_HEADER_NUM_SPACES
    PRINT_TITLE_POUNDS = "#" * PRINT_HEADER_NUM_SPACES
    PRINT_HEADER_SPACES = " " * (PRINT_HEADER_NUM_SPACES - 1)
    PRINT_HEADER_ASTERISK = "*"
    """Print title."""
    """
    #####################
    #   Example Title   #
    #####################
    """
    length = len(title)
    pounds = PRINT_TITLE_POUNDS + ("#" * length) + PRINT_TITLE_POUNDS
    middle = f"#{PRINT_HEADER_SPACES}" f"{title}" f"{PRINT_HEADER_SPACES}#"
    print(f"\n{pounds}\n{middle}\n{pounds}\n")

def _results_check() -> None:
    c_left_count = 0
    c_right_count = 0
    f_left_count = 0
    f_right_count = 0
    for re in CURRENTS_SPEEDS_TEST_RESULTS:
        if 'Mount_left' == re[0] and 'PASS' == re[3]:
            c_left_count += 1
        elif 'Mount_right' == re[0] and 'PASS' == re[3]:
            c_right_count += 1

    for re in FORCE_GAUGE_TEST_RESULTS:
        if 'Mount_left' == re[0] and re[3] > 300:
            f_left_count += 1
        elif 'Mount_right' == re[0] and re[3] > 300:
            f_right_count += 1
    _print_title('Test Results')
    print(f'Mount_left Current and Speed Test: --PASS') if c_left_count >= 10 else print(f'Mount_left Current and Speed Test: --FAIL')
    print(f'Mount_right Current and Speed Test: --PASS') if c_right_count >= 10 else print(f'Mount_right Current and Speed Test: --FAIL')
    print(f'Mount_left Force Guage Test: --PASS') if f_left_count >= 10 else print(f'Mount_left Force Guage Test: --FAIL')
    print(f'Mount_right Force Guage Test: --PASS') if f_right_count >= 10 else print(f'Mount_right Force Guage Test: --FAIL')

async def _run(api: OT3API, arguments: argparse.Namespace) -> None:
    if "q" in input("\n\tEnter 'q' to exit"):
        raise KeyboardInterrupt()

    _operator, _z_stage_id = await get_test_metadata(api, arguments)

    api.home([OT3.Axis_Z])
    # global NODE
    # print(11111111)
    # await _homeMount(messenger)
    # print(22222222)


    # callback function for writing new data to CSV file
    csv_props, csv_cb = _create_csv_and_get_callbacks(arguments.sn)
    print(333333)
    # cache the pressure-data header
    # add metadata to CSV
    # FIXME: create a set of CSV helpers, such that you can define a test-report
    #        schema/format/line-length/etc., before having to fill its contents.
    #        This would be very helpful, because changes to CVS length/contents
    #        will break the analysis done in our Sheets
    csv_cb.write(["--------"])
    csv_cb.write(["METADATA"])
    csv_cb.write(["test-name", csv_props.name])
    csv_cb.write(["serial-number", _z_stage_id])
    csv_cb.write(["operator-name", _operator])
    csv_cb.write(["date", csv_props.id])  # run-id includes a date/time string
    test_name = Path(__file__).name
    ui.print_title(test_name.replace("_", " ").upper())

    if not arguments.skip_left:
        ui.print_header("Test mount left")
        csv_cb.write(["----Test mount left----"])
        NODE = NodeId.head_l
        await _home(messenger)
        # run the test
        if not arguments.skip_current_left:
            csv_cb.write(["----"])
            csv_cb.write(["Currents_Speeds_Test"])
            csv_cb.write(["----"])
            print("Currents_Speeds_Test")
            csv_cb.write(['Mount', 'Current', 'Speed', 'Result'])
            await _currents_speeds_test(messenger, csv_cb.write)

        if not arguments.skip_force_left:
            csv_cb.write(["----"])
            csv_cb.write(["Force_Gauge_Test"])
            csv_cb.write(["----"])
            csv_cb.write(['Mount', 'Current', 'Speed', 'Force'])
            print("Force_Gauge_Test")
            await _force_gauge(messenger, csv_cb.write)

    if not arguments.skip_right:
        print('----Test mount right----')
        csv_cb.write(["----Test mount right----"])
        NODE = NodeId.head_r
        await _home(messenger)
        # run the test
        if not arguments.skip_current_right:
            csv_cb.write(["----"])
            csv_cb.write(["Currents_Speeds_Test"])
            csv_cb.write(["----"])
            print("Currents_Speeds_Test")
            csv_cb.write(['Mount', 'Current', 'Speed', 'Result'])
            await _currents_speeds_test(messenger, csv_cb.write)

        if not arguments.skip_force_right:
            csv_cb.write(["----"])
            csv_cb.write(["Force_Gauge_Test"])
            csv_cb.write(["----"])
            csv_cb.write(['Mount', 'Current', 'Speed', 'Force'])
            print("Force_Gauge_Test")
            await _force_gauge(messenger, csv_cb.write)

    if not arguments.skip_results_check:
        _results_check()

    print('Test Done...')


async def get_test_metadata(
    api: OT3API, arguments: argparse.Namespace
) -> Tuple[str, str]:
    """Get the operator name and robot serial number."""
    if arguments.no_input:
        _operator = "None"
        _robot_id = api._backend.eeprom_data.serial_number
        if not _robot_id:
            ui.print_error("no serial number saved on this robot")
            _robot_id = "None"
    else:
        if arguments.simulate:
            _robot_id = "ot3-simulated-A01"
            _operator = "simulation"
        else:
            _robot_id = api._backend.eeprom_data.serial_number
            if not _robot_id:
                ui.print_error("no serial number saved on this robot")
                _robot_id = input("enter ROBOT SERIAL number: ").strip()
            _operator = input("enter OPERATOR name: ")

    return (_operator, _robot_id)


async def _main(arguments: argparse.Namespace) -> None:
    """Main, z-stage test."""
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=arguments.simulate
    )

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
    add_can_args(arg_parser)
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
