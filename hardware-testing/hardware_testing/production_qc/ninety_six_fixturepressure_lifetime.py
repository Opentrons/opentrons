"""Test Droplets."""
from asyncio import sleep
import argparse
import asyncio
from time import time
from typing import List, Union, Tuple, Optional, Dict, Literal
from pathlib import Path
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.motion_utilities import target_position_from_relative
import os
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from opentrons.hardware_control.types import (
    SubSystem
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Point, Axis
from .pressure import (  # type: ignore[import]
    PRESSURE_FIXTURE_TIP_VOLUME,
    PRESSURE_FIXTURE_ASPIRATE_VOLUME,
    PRESSURE_FIXTURE_EVENT_CONFIGS as PRESSURE_CFG,
    pressure_fixture_a1_location,
    PressureEvent,
    PressureEventConfig,
    PRESSURE_FIXTURE_INSERT_DEPTH,
    PRESSURE_ASPIRATE_DELTA_SPEC,
)

import logging

from hardware_testing.drivers.pressure_fixture import (
    PressureFixtureBase,
    connect_to_fixture,
    connect_to_fixture96
)
from hardware_testing import data
from typing import Optional, Callable, List, Any, Tuple, Dict, cast
def _bool_to_pass_fail(result: bool) -> str:
    return "PASS" if result else "FAIL"

NUM_SECONDS_TO_WAIT = 30
HOVER_HEIGHT_MM = 50
DEPTH_INTO_RESERVOIR_FOR_ASPIRATE = -24
DEPTH_INTO_RESERVOIR_FOR_DISPENSE = DEPTH_INTO_RESERVOIR_FOR_ASPIRATE

RESERVOIR_LABWARE = "nest_1_reservoir_195ml"
PRESSURE_DATA_HEADER = ["PHASE", "CH1", "CH2", "CH3", "CH4", "CH5", "CH6", "CH7", "CH8"
,"CH9","CH10", "CH11", "CH12", "CH13", "CH14", "CH15", "CH16", "CH17", "CH18", "CH19", "CH20", "CH21", "CH22", "CH23", "CH24"
,"CH25","CH26", "CH27", "CH28", "CH29", "CH30", "CH31", "CH32", "CH33", "CH34", "CH35", "CH36", "CH37", "CH38", "CH39", "CH40", 
"CH41","CH42","CH43","CH44","CH45","CH46","CH47","CH48","CH49","CH50","CH51","CH52","CH53", "CH54","CH55","CH56","CH57","CH58",
"CH59","CH60","CH61","CH62","CH63","CH64","CH65","CH66","CH67","CH68","CH69","CH70","CH71","CH72","CH73","CH74","CH75","CH76",
"CH77","CH78","CH79","CH80","CH81","CH82","CH83","CH84","CH85","CH86","CH87","CH88","CH89","CH90","CH91","CH92","CH93","CH94","CH95","CH96"]

TIP_RACK_96_SLOT = 3
TIP_RACK_PARTIAL_SLOT = 5
RESERVOIR_SLOT = 2
TRASH_SLOT = 12
FINAL_TEST_FAIL_INFOR = []


TRASH_HEIGHT = 40  # DVT trash
TIP_RACK_96_ADAPTER_HEIGHT = 11  # DVT adapter

# X moves negative (to left), Y moves positive (to rear)
# move to same spot over labware, regardless of number of tips attached
OFFSET_FOR_1_WELL_LABWARE = Point(x=9 * -11 * 0.5, y=9 * 7 * 0.5)

PARTIAL_CURRENTS: Dict[int, float] = {1: 0.1, 8: 0.55, 12: 0.8, 16: 1.1, 24: 1.5}

PARTIAL_TESTS: Dict[str, Tuple[Point, float]] = {
    # test-name: [offset-from-A1, z-current]
    "1-tip-back-left": (
        Point(x=9 * 11, y=9 * 7),  # A12 Tip
        PARTIAL_CURRENTS[1],
    ),
    "8-tips-left": (
        Point(x=9 * 10),  # A11-H11 Tips
        PARTIAL_CURRENTS[8],
    ),
    "24-tips-left": (
        Point(x=9 * 7),  # A8-H10 Tips
        PARTIAL_CURRENTS[24],
    ),
}
from dataclasses import dataclass, fields

@dataclass
class TestConfig:
    """Test Configurations."""

    operator_name: str
    skip_liquid: bool
    skip_fixture: bool
    skip_diagnostics: bool
    skip_plunger: bool
    skip_tip_presence: bool
    skip_liquid_probe: bool
    fixture_port: str
    fixture_side: str
    fixture_aspirate_sample_count: int
    slot_tip_rack_1000: int
    slot_tip_rack_200: int
    slot_tip_rack_50: int
    slot_reservoir: int
    slot_plate: int
    slot_fixture: int
    slot_trash: int
    num_trials: int
    droplet_wait_seconds: int
    simulate: bool
    skip_all_pressure: bool

@dataclass
class TestConfig_:
    """Test Config."""

    simulate: bool
    pipette: Literal[200, 1000]
    cycles: int

@dataclass
class LabwareLocations:
    """Test Labware Locations."""

    trash: Optional[Point]
    tip_rack_1000: Optional[Point]
    tip_rack_200: Optional[Point]
    tip_rack_50: Optional[Point]
    reservoir: Optional[Point]
    plate_primary: Optional[Point]
    plate_secondary: Optional[Point]
    fixture: Optional[Point]

def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    all_tips_test = [CSVLine("fixturepressure-1000tip", [float, CSVResult])]
    partial_tests = [
        CSVLine(f"droplets-{name}", [float, CSVResult]) for name in PARTIAL_TESTS.keys()
    ]
    return all_tips_test + partial_tests  # type: ignore[return-value]


def get_trash_nominal() -> Point:
    """Get nominal trash position."""
    trash_nominal = helpers_ot3.get_slot_calibration_square_position_ot3(
        TRASH_SLOT
    ) + Point(z=TRASH_HEIGHT)
    # center the 96ch of the 1-well labware
    trash_nominal += OFFSET_FOR_1_WELL_LABWARE
    return trash_nominal


def get_reservoir_nominal() -> Point:
    """Get nominal reservoir position."""
    reservoir_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        RESERVOIR_SLOT, RESERVOIR_LABWARE
    )
    # center the 96ch of the 1-well labware
    reservoir_a1_nominal += OFFSET_FOR_1_WELL_LABWARE
    return reservoir_a1_nominal


def get_tiprack_96_nominal(pipette: Literal[200, 1000]) -> Point:
    """Get nominal tiprack position for 96-tip pick-up."""
    tip_rack_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        TIP_RACK_96_SLOT, f"opentrons_flex_96_tiprack_{pipette}ul"
    )
    return tip_rack_a1_nominal + Point(z=TIP_RACK_96_ADAPTER_HEIGHT)


def get_tiprack_partial_nominal(pipette: Literal[200, 1000]) -> Point:
    """Get nominal tiprack position for partial-tip pick-up."""
    tip_rack_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        TIP_RACK_PARTIAL_SLOT, f"opentrons_flex_96_tiprack_{pipette}ul"
    )
    return tip_rack_a1_nominal


async def aspirate_and_wait(
    api: OT3API, reservoir: Point, volume: int, seconds: int = 30
) -> Tuple[bool, float]:
    """Aspirate and wait."""
    await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, reservoir)
    await api.move_to(
        OT3Mount.LEFT, reservoir + Point(z=DEPTH_INTO_RESERVOIR_FOR_ASPIRATE)
    )
    await api.aspirate(OT3Mount.LEFT, volume)
    await api.move_to(OT3Mount.LEFT, reservoir + Point(z=HOVER_HEIGHT_MM))

    start_time = time()
    for i in range(seconds):
        print(f"waiting {i + 1}/{seconds}")
        if i == 0 or i == seconds - 1:
            await api.set_lights(False, False)
        if not api.is_simulator:
            await sleep(1)
    await api.set_lights(True, True)

    if not api.is_simulator:
        result = ui.get_user_answer("look good")
    else:
        result = True
    duration_seconds = time() - start_time
    print(f"waited for {duration_seconds} seconds")

    await api.move_to(
        OT3Mount.LEFT, reservoir + Point(z=DEPTH_INTO_RESERVOIR_FOR_DISPENSE)
    )
    await api.dispense(OT3Mount.LEFT)
    return result, duration_seconds


async def _drop_tip(api: OT3API, trash: Point, pipette: Literal[200, 1000]) -> None:
    print("drop in trash")
    await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, trash + Point(z=20))
    await api.move_to(OT3Mount.LEFT, trash)
    await api.drop_tip(OT3Mount.LEFT)
    # NOTE: a FW bug (as of v14) will sometimes not fully drop tips.
    #       so here we ask if the operator needs to try again
    while not api.is_simulator and ui.get_user_answer("try dropping again"):
        api.add_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(pipette))
        await api.drop_tip(OT3Mount.LEFT)
    await api.home_z(OT3Mount.LEFT)


async def _partial_pick_up_z_motion(
    api: OT3API, current: float, distance: float, speed: float
) -> None:
    async with api._backend.motor_current(run_currents={Axis.Z_L: current}):
        target_down = target_position_from_relative(
            OT3Mount.LEFT, Point(z=-distance), api._current_position
        )
        await api._move(target_down, speed=speed)
    target_up = target_position_from_relative(
        OT3Mount.LEFT, Point(z=distance), api._current_position
    )
    await api._move(target_up)
    await api._update_position_estimation([Axis.Z_L])

def _save_logging_print(pipette_sn: str,run_id:str):
    try:
       
        logger = logging.getLogger("QCTEST")
        logger.setLevel(logging.DEBUG)
        logger.propagate = False

        
            
        #run_id = data.create_run_id()
        test_name = Path(__file__).parent.name.replace("_", "-")
        folder_path = data.create_folder_for_test_data(test_name)
        run_path = data.create_folder_for_test_data(folder_path / run_id)
        file_name =f"{test_name}_{run_id}_{pipette_sn}.txt"
        csv_display_name = os.path.join(run_path, file_name)
        print(f"log txt: {csv_display_name}")
        file_handler = logging.FileHandler(csv_display_name)
        file_handler.setLevel(logging.DEBUG)

        
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)

        # 创建一个终端处理器
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        formatterconsole = logging.Formatter('%(asctime)s-%(levelname)s- %(message)s')
        console_handler.setFormatter(formatterconsole)

        logger.addHandler(console_handler)
        logger.addHandler(file_handler)
        return logger
    except Exception as eeerr:
        print(f"log err: {eeerr}")

async def _partial_pick_up(
    api: OT3API, position: Point, current: float, pipette: Literal[200, 1000]
) -> None:
    await helpers_ot3.move_to_arched_ot3(
        api,
        OT3Mount.LEFT,
        position,
        safe_height=position.z + 10,
    )
    await _partial_pick_up_z_motion(api, current=current, distance=13, speed=5)
    api.add_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(pipette))
    await api.prepare_for_aspirate(OT3Mount.LEFT)
    await api.home_z(OT3Mount.LEFT)

def _connect_to_fixture() -> PressureFixtureBase:
    fixture = connect_to_fixture96(
       simulate = False
    )
    return fixture

async def _fixture_check_pressure(
    api: OT3API,
    mount: OT3Mount,
    # test_config: TestConfig,
    fixture: Optional[PressureFixtureBase],
    write_cb: Optional[Callable],
    accumulate_raw_data_cb: Optional[Callable],
) -> bool:
    results = []
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip
    pip_vol = int(pip.working_volume)
    print("pip_vol",pip_vol)
    pip_channels = int(pip.channels)
    print("pip_channels",pip_channels)
    delaytime = 8
    # above the fixture
    # r, _ = await _read_pressure_and_check_results(
    #     api,
    #     pip_channels,
    #     pip_vol,
    #     fixture,
    #     PressureEvent.PRE,
    #     write_cb,
    #     accumulate_raw_data_cb,
    #     pip_channels,
    # )
    # results.append(r)
    # insert into the fixture
    # NOTE: unknown amount of pressure here (depends on where Z was calibrated)
    # fixture_depth = PRESSURE_FIXTURE_INSERT_DEPTH[pip_vol]
    # await api.move_rel(mount, Point(z=-fixture_depth))
    print("picking up tips")
    await api.pick_up_tip_96_fixture(
        OT3Mount.LEFT, helpers_ot3.get_default_tip_length(1000)
    )
    # await api.pick_up_tip(
    #     OT3Mount.LEFT, helpers_ot3.get_default_tip_length(50)
    # )
    await asyncio.sleep(delaytime)
    r, inserted_pressure_data = await _read_pressure_and_check_results(
        api,
        pip_channels,
        pip_vol,
        fixture,
        PressureEvent.INSERT,
        write_cb,
        accumulate_raw_data_cb,
        pip_channels,
    )
    results.append(r)
    # aspirate 50uL
    
    await api.aspirate(mount, PRESSURE_FIXTURE_ASPIRATE_VOLUME[pip_vol])
    await asyncio.sleep(delaytime)
    #await api.aspirate(OT3Mount.LEFT, volume)
    if pip_vol == 50:
        asp_evt = PressureEvent.ASPIRATE_P50
    elif pip_vol == 1000:
        asp_evt = PressureEvent.ASPIRATE_P1000
    elif pip_vol == 200:
        asp_evt = PressureEvent.ASPIRATE_P200
    r, _ = await _read_pressure_and_check_results(
        api,
        pip_channels,
        pip_vol,
        fixture,
        asp_evt,
        write_cb,
        accumulate_raw_data_cb,
        pip_channels,
        previous=inserted_pressure_data,
    )
    results.append(r)
    # dispense
    await api.dispense(mount, PRESSURE_FIXTURE_ASPIRATE_VOLUME[pip_vol])
    await asyncio.sleep(delaytime)
    r, _ = await _read_pressure_and_check_results(
        api,
        pip_channels,
        pip_vol,
        fixture,
        PressureEvent.DISPENSE,
        write_cb,
        accumulate_raw_data_cb,
        pip_channels,
    )
    results.append(r)
    # retract out of fixture
    #await api.move_rel(mount, Point(z=fixture_depth))
    await api.move_rel(OT3Mount.LEFT,Point(z=20))
    await api.drop_tip(OT3Mount.LEFT)
    # await asyncio.sleep(10)
    # r, _ = await _read_pressure_and_check_results(
    #     api,
    #     pip_channels,
    #     pip_vol,
    #     fixture,
    #     PressureEvent.POST,
    #     write_cb,
    #     accumulate_raw_data_cb,
    #     pip_channels,
    # )
    # results.append(r)
    return False not in results

async def _read_pressure_and_check_results(
    api: OT3API,
    pipette_channels: int,
    pipette_volume: int,
    fixture: PressureFixtureBase,
    tag: PressureEvent,
    write_cb: CSVReport,
    accumulate_raw_data_cb: Callable,
    channels: int = 1,
    previous: Optional[List[List[float]]] = None,
) -> Tuple[bool, List[List[float]]]:
    
    def print_pressure_datas(data_list):
        row_labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        col_labels = list(range(1, 13))
        cell_width = 9

        # 打印表头
        print(" " * 3 + "".join(f"{col:>{cell_width}}" for col in col_labels))

        # 打印每一行
        for i in range(8):
            row_data = data_list[i * 12:(i + 1) * 12]
            row_str = f"{row_labels[i]}: "
            for val in row_data:
                try:
                    row_str += f"{float(val):>{cell_width}.2f}"
                except:
                    row_str += f"{str(val):>{cell_width}}"
            print(row_str)

    
    pressure_event_config: PressureEventConfig = PRESSURE_CFG[tag]
    if not api.is_simulator:
        await asyncio.sleep(pressure_event_config.stability_delay)
    _samples = []
    for i in range(pressure_event_config.sample_count):
        _samples.append(fixture.read_all_pressure_channel_96())
        next_sample_time = time() + pressure_event_config.sample_delay
        _sample_as_strings = [str(round(p, 2)) for p in _samples[-1]]
        
        ui.print_header(f"{i + 1}/{pressure_event_config.sample_count}: {tag.value}")
        print_pressure_datas(_sample_as_strings)
        csv_data_sample = [tag.value] + _sample_as_strings
        # print(f"{i + 1}/{pressure_event_config.sample_count}: {csv_data_sample}")
        accumulate_raw_data_cb(csv_data_sample)
        delay_time = next_sample_time - time()
        if (
            not api.is_simulator
            and i < pressure_event_config.sample_count - 1
            and delay_time > 0
        ):
            await asyncio.sleep(pressure_event_config.sample_delay)
    _samples_per_channel = [[s[c] for s in _samples] for c in range(channels)]
    _average_per_channel = [sum(s) / len(s) for s in _samples_per_channel]
    test_pass_stability = True
    for c in range(channels):
        _samples_per_channel[c].sort()
        _c_min = min(_samples_per_channel[c][1:])
        _c_max = max(_samples_per_channel[c][1:])
        csv_data_min = [f"pressure-{tag.value}-channel-{c + 1}", "min", _c_min]
        print(csv_data_min)
        write_cb(csv_data_min)
        csv_data_max = [f"pressure-{tag.value}-channel-{c + 1}", "max", _c_max]
        print(csv_data_max)
        write_cb(csv_data_max)
        csv_data_avg = [
            f"pressure-{tag.value}-channel-{c + 1}",
            "average",
            _average_per_channel[c],
        ]
        print(csv_data_avg)
        write_cb(csv_data_avg)
        if _c_max - _c_min > pressure_event_config.stability_threshold:
            print(
                f"ERROR: channel {c + 1} samples are too far apart, "
                f"max={round(_c_max, 2)} and min={round(_c_min, 2)}"
            )
            #printsig = f"01-fixture-pressure:测试工装气压,状态{tag.value},ch{c + 1}气压差变动最大值{round(_c_max, 2)}与最小值 {round(_c_min, 2)}差值 {abs(round(_c_max, 2)-round(_c_min, 2))} 超过阈值{pressure_event_config.stability_threshold}"
            #ui.print_fail(printsig)
            #FINAL_TEST_FAIL_INFOR.append(printsig)
            test_pass_stability = False
            #LOG_GING.error(printsig)
    csv_data_stability = [
        f"pressure-{tag.value}",
        "stability",
        _bool_to_pass_fail(test_pass_stability),
    ]
    print(csv_data_stability)
    write_cb(csv_data_stability)
    _all_samples = [s[c] for s in _samples for c in range(channels)]
    _all_samples.sort()
    _samples_min = min(_all_samples[1:-1])
    _samples_max = max(_all_samples[1:-1])
    if (
        _samples_min < pressure_event_config.min
        or _samples_max > pressure_event_config.max
    ):
        print(
            f"ERROR: samples are out of range, "
            f"max={round(_samples_max, 2)} and min={round(_samples_min, 2)}"
        )
        #LOG_GING.error(
        #    f"ERROR: samples are out of range, "
        #    f"max={round(_samples_max, 2)} and min={round(_samples_min, 2)}")
        #printsig =f"02-fixture-pressure:测试工装气压,状态{tag.value},读取fixture的所有气压最大值{round(_samples_max, 2)}~最小值{round(_samples_min, 2)}超出阈值范围{pressure_event_config.min}~{pressure_event_config.max}"
        #ui.print_fail(printsig)
        #FINAL_TEST_FAIL_INFOR.append(printsig)
        test_pass_accuracy = False
        #LOG_GING.error(printsig)
    else:
        test_pass_accuracy = True
    csv_data_accuracy = [
        f"pressure-{tag.value}",
        "accuracy",
        _bool_to_pass_fail(test_pass_accuracy),
    ]
    print(csv_data_accuracy)
    write_cb(csv_data_accuracy)
    test_pass_delta = True
    if previous:
        assert len(previous[-1]) >= len(_average_per_channel)
        for c in range(channels):
            _delta_target = PRESSURE_ASPIRATE_DELTA_SPEC[pipette_channels][
                pipette_volume
            ]["delta"]
            _delta_margin = PRESSURE_ASPIRATE_DELTA_SPEC[pipette_channels][
                pipette_volume
            ]["margin"]
            _delta_min = _delta_target - (_delta_target * _delta_margin)
            _delta_max = _delta_target + (_delta_target * _delta_margin)
            _delta = abs(_average_per_channel[c] - previous[-1][c])  # absolute value
            if _delta < _delta_min or _delta > _delta_max:
                print(
                    f"ERROR: channel {c + 1} pressure delta ({_delta}) "
                    f"out of range: max={_delta_max}, min={_delta_min}"
                )
                # LOG_GING.error(
                #     f"ERROR: channel {c + 1} pressure delta ({_delta}) "
                #     f"out of range: max={_delta_max}, min={_delta_min}")
                # printsig = f"03-fixture-pressure:测试工装气压,状态{tag.value},ch{c + 1}吸液50ul气压平均值{_average_per_channel[c]}与插入工装时的气压{previous[-1][c]}差值{_delta}不在阈值范围{_delta_max}~{_delta_min}"
                # #print(f"05-03:状态{tag.value},channel {c + 1} 气压值增量 {_delta} 不在阈值范围内, 阈值:{_delta_max}~{_delta_min}")
                # ui.print_fail(printsig)
                # FINAL_TEST_FAIL_INFOR.append(printsig)
                test_pass_delta = False
                # LOG_GING.error(printsig)
        csv_data_delta = [
            f"pressure-{tag.value}",
            "delta",
            _bool_to_pass_fail(test_pass_delta),
        ]
        print(csv_data_delta)
        write_cb(csv_data_delta)
    _passed = test_pass_stability and test_pass_accuracy and test_pass_delta
    return _passed, _samples   

@dataclass
class CSVCallbacks:
    """CSV callback functions."""
    pressure: Callable

PRESSURE_DATA_CACHE = []

def cre_class(

    ) -> Tuple[CSVCallbacks]:
    start_time = time()
    def _cache_pressure_data_callback(
            d: List[Any], first_row_value: Optional[str] = None
        ) -> None:
            if first_row_value is None:
                first_row_value = str(round(time() - start_time, 2))
            data_list = [first_row_value] + d
            PRESSURE_DATA_CACHE.append(data_list)
    return (
      
        CSVCallbacks(
            
            pressure=_cache_pressure_data_callback,
        
        ),
    )

@dataclass
class CSVProperties:
    """CSV properties."""

    id: str
    name: str
    path: str
@dataclass
class CSVCallbacks:
    """CSV callback functions."""

    write: Callable
    pressure: Callable
    results: Callable

FINAL_TEST_RESULTS = []
def _create_csv_and_get_callbacks(
    pipette_sn: str,run_id:str
) -> Tuple[CSVProperties, CSVCallbacks]:
    #run_id = data.create_run_id()
    test_name = Path(__file__).parent.name.replace("_", "-")
    folder_path = data.create_folder_for_test_data(test_name)
    run_path = data.create_folder_for_test_data(folder_path / run_id)
    file_name = data.create_file_name(test_name, run_id, pipette_sn)
    csv_display_name = os.path.join(run_path, file_name)
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
            data.append_data_to_file(test_name, run_id, file_name, data_str + "\n")
        else:
            data.insert_data_to_file(
                test_name, run_id, file_name, data_str + "\n", line_number
            )

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


async def _main(
    cfg: TestConfig
) -> None:
    """Run."""
    # GATHER NOMINAL POSITIONS
    #trash_nominal = get_trash_nominal()
    pipette_string = "p1000_96_v3.4" if cfg.pipette == 1000 else "p200_96_v3.0"
    # BUILD API
    #global FINAL_TEST_FAIL_INFOR
    global LOG_GING
    global FINAL_TEST_FAIL_INFOR
    LOG_GING = ''
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=cfg.simulate,
        pipette_left=pipette_string,
    )
    pips = {OT3Mount.from_mount(m): p for m, p in api.hardware_pipettes.items() if p}
    for mount, pipette in pips.items():
        pipette_sn = helpers_ot3.get_pipette_serial_ot3(pipette)
        print(pipette_sn)
    fixture = _connect_to_fixture()
    tip_rack_96_a1_nominal = get_tiprack_96_nominal(cfg.pipette)
    run_id = data.create_run_id()
    csv_props, csv_cb = _create_csv_and_get_callbacks(pipette_sn,run_id)
    LOG_GING = _save_logging_print(pipette_sn,run_id)
    # tip_rack_partial_a1_nominal = get_tiprack_partial_nominal()
    #reservoir_a1_nominal = get_reservoir_nominal()
    #reservoir_a1_actual: Optional[Point] = None
    # home and move to attach position
    operator = input("OPERATOR name:").strip()
    csv_cb.write(["--------"])
    csv_cb.write(["METADATA"])
    csv_cb.write(["test-name", csv_props.name + "-fixture-pressure"])
    csv_cb.write(["operator-name", operator])
    csv_cb.write(["date", csv_props.id])  # run-id includes a date/time string
    csv_cb.write(["pipette", pipette_sn])
    csv_cb.write(["version", data.get_git_description()])
    csv_cb.write(["firmware", api.fw_version])
    subsystem = SubSystem.of_mount(mount)
    pcba_version = api.attached_subsystems[subsystem].pcba_revision
    csv_cb.write(["pcba-revision", pcba_version])
    # add test configurations to CSV
    csv_cb.write(["-------------------"])
    
    await api.home()
    piot = await helpers_ot3.move_to_arched_ot3(
            api, OT3Mount.LEFT, tip_rack_96_a1_nominal + Point(z=10)
        )
    await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
    
    ui.get_user_ready("Starting to pick up")
    #await api.move_rel(OT3Mount.LEFT,Point(z=30))
    
    current_pos = await api.gantry_position(mount)    
    for ii in range(cfg.cycles):
        try:
            csv_cb.write(["-------------------"])
            csv_cb.write(["CYCLES",ii+1])
            csv_cb.pressure(PRESSURE_DATA_HEADER, first_row_value="")
            test_passed = await _fixture_check_pressure(
                        api, OT3Mount.LEFT, fixture,
                            write_cb=csv_cb.write,accumulate_raw_data_cb=csv_cb.pressure,
                    )
            csv_cb.write(["-------------"])
            csv_cb.write(["PRESSURE-DATA"])
            for press_data in PRESSURE_DATA_CACHE:
                csv_cb.write(press_data, first_row_value_included=True)
            await api.home([Axis.Z_L, Axis.Z_R])
            await api.move_to(mount=mount, abs_position=current_pos)
        except Exception as err:
            print("run fail:",err)
            input("runerr")
            await api.move_rel(OT3Mount.LEFT,Point(z=20))
            await api.drop_tip(OT3Mount.LEFT)
    await api.home([Axis.Z_L, Axis.Z_R])

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--pipette", type=int, choices=[200, 1000], default=200)
    parser.add_argument("--cycles", type=int, default=2000)
    args = parser.parse_args()
    _config = TestConfig_(
        simulate=args.simulate, pipette=args.pipette,cycles=args.cycles
    )
    asyncio.run(_main(_config))
    