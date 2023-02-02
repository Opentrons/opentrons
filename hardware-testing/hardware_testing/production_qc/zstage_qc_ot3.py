import argparse
import asyncio
from numpy import float64
import subprocess
from typing import Dict, Tuple

from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus import CanMessenger, WaitableCallback
from opentrons_hardware.firmware_bindings.constants import NodeId, PipetteName
from opentrons_hardware.hardware_control.current_settings import set_currents
from opentrons_hardware.hardware_control.motion import (
    MoveGroupSingleAxisStep,
    create_home_step,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    InstrumentInfoRequest,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.scripts.can_args import add_can_args, build_settings

from hardware_testing import data
from hardware_testing.drivers import list_ports_and_select,find_port
from hardware_testing.drivers.mark10_fg import Mark10,SimMark10


default_move_speed = 60
default_run_current = 1.4
currents = (0.2, 0.5, 1.0, 1.5)
speeds = (50, 100)
ZSTAGE_TOLERANCES_MM = 0.4

data_format = "||{0:^12}|{1:^12}|{2:^12}||"

CYCLES = 1
sus_str = "----_----"

NODE = NodeId.head_l

# save final test results, to be saved and displayed at the end
FINAL_TEST_RESULTS = []


def _connect_to_mark10_fixture(simulate: bool) -> Mark10:
    if not simulate:
        _port = find_port(0x0483,0xA1AD)
        fixture = Mark10.create(port=_port, slot_side=test_config.fixture_side)
    else:
        fixture = SimMark10()  # type: ignore[assignment]
    fixture.connect()
    return fixture

@dataclass
class CSVCallbacks:
    """CSV callback functions."""

    write: Callable
    pressure: Callable
    results: Callable


@dataclass
class CSVProperties:
    """CSV properties."""

    id: str
    name: str
    path: str


def _create_csv_and_get_callbacks() -> Tuple[CSVProperties, CSVCallbacks]:
    run_id = data.create_run_id()
    test_name = data.create_test_name_from_file(__file__)
    folder_path = data.create_folder_for_test_data(test_name)
    file_name = data.create_file_name(test_name, run_id, 'Z_stage')
    csv_display_name = os.path.join(folder_path, file_name)
    print(f"CSV: {csv_display_name}")
    start_time = time()

    def _append_csv_data(
        data_list: List[Any],
        line_number: Optional[int] = None,
        first_row_value: Optional[str] = None,
        first_row_value_included: bool = False,
    ) -> None:
        # every line in the CSV file begins with the elapsed seconds
        if not first_row_value_included:
            if first_row_value is None:
                first_row_value = str(round(time() - start_time, 2))
            data_list = [first_row_value] + data_list
        data_str = ",".join([str(d) for d in data_list])
        if line_number is None:
            data.append_data_to_file(test_name, file_name, data_str + "\n")
        else:
            data.insert_data_to_file(test_name, file_name, data_str + "\n", line_number)

    def _cache_pressure_data_callback(
        d: List[Any], first_row_value: Optional[str] = None
    ) -> None:
        if first_row_value is None:
            first_row_value = str(round(time() - start_time, 2))
        data_list = [first_row_value] + d
        PRESSURE_DATA_CACHE.append(data_list)

    def _handle_final_test_results(t: str, r: bool) -> None:
        # save final test results to both the CSV and to display at end of script
        _res = [t, _bool_to_pass_fail(r)]
        _append_csv_data(_res)
        FINAL_TEST_RESULTS.append(_res)

    return (
        CSVProperties(id=run_id, name=test_name, path=csv_display_name),
        CSVCallbacks(
            write=_append_csv_data,
            pressure=_cache_pressure_data_callback,
            results=_handle_final_test_results,
        ),
    )



async def _home(messenger: CanMessenger) -> None:
    home_runner = MoveGroupRunner(
        move_groups=[[create_home_step({NODE: float64(100.0)}, {NODE: float64(-5)})]]
    )
    await home_runner.run(can_messenger=messenger)


async def _set_pipette_current(messenger: CanMessenger, run_current: float) -> None:
    currents: Dict[NodeId, Tuple[float, float]] = dict()
    currents[NODE] = (float(0), float(run_current))
    try:
        await set_currents(messenger, currents)
    except asyncio.CancelledError:
        pass


class LoseStepError(Exception):
    """Lost Step Error."""

    pass


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
    encoder_str = str(round(motor_pos, 2))
    if check and abs(motor_pos - encoder_pos) > ZSTAGE_TOLERANCES_MM:
        raise LoseStepError(
            f"ERROR: lost steps (motor={motor_str}, encoder={encoder_str}"
        )
    return motor_pos, encoder_pos



async def _currents_speeds_test(messenger: CanMessenger):
    for cu in currents:
        _set_pipette_current(messenger, cu)
        for sp in speeds:
            print('Start Currents and Speeds testing, Current= {}, Speed= {}::::'.format(cu, sp))
            try:
                mot, enc = await _move_to(
                    messenger, 10, default_move_speed, check=True
                )
                print(f"motor position: {mot}, encoder position: {enc}")
                for c in range(CYCLES):
                    print(f"cycle: {c + 1}/{CYCLES}")
                    mot, enc = await _move_to(
                        messenger, 60, default_move_speed, check=True
                    )
                    print(f"motor position: {mot}, encoder position: {enc}")
                    mot, enc = await _move_to(
                        messenger,60, -default_move_speed, check=True
                    )
                    print(f"motor position: {mot}, encoder position: {enc}")
            except LoseStepError as e:
                print(str(e))
                break

async def _force_gauge():
    pass





async def _run(messenger: CanMessenger) -> None:
    if "q" in input("\n\tEnter 'q' to exit"):
        raise KeyboardInterrupt()
    await _currents_speeds_test(messenger)


async def _main(arguments: argparse.Namespace) -> None:
    subprocess.run(["systemctl", "stop", "opentrons-robot-server"])
    driver = await build_driver(build_settings(arguments))
    messenger = CanMessenger(driver=driver)
    messenger.start()
    while True:
        try:
            await _run(messenger)
        except KeyboardInterrupt:
            break
        except Exception:
            pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipette Currents Test SCRIPT")
    add_can_args(parser)
    parser.add_argument(
        "--plunger_run_current",
        type=float,
        help="Active current of the plunger",
        default=1.0,
    )
    parser.add_argument(
        "--plunger_hold_current",
        type=float,
        help="Active current of the plunger",
        default=0.1,
    )
    parser.add_argument(
        "--speed",
        type=float,
        help="The speed with which to move the plunger",
        default=10.0,
    )
    asyncio.run(_main(parser.parse_args()))