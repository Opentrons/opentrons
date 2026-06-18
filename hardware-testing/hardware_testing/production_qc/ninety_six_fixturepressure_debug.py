"""Test Droplets."""
from asyncio import sleep
import argparse
import asyncio
import math
import statistics
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


def _channel_status_label(channel_passed: bool, retest_mode: bool) -> str:
    if channel_passed:
        return "PASS"
    if retest_mode:
        return "MECHANICAL_FAIL_AFTER_RETEST"
    return "SUSPECT_MECHANICAL"


class StopTestError(RuntimeError):
    """Raised when the test should stop immediately."""

NUM_SECONDS_TO_WAIT = 30
LEAK_RATE_WINDOW_SECONDS = 60
INSERT_PRESSURE_MIN = 500.0
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
CHANNEL_LEAK_HISTORY: Dict[str, List[List[float]]] = {}
INSERT_PRESSURE_FAILED_COUNTS: Dict[int, int] = {}
INSERT_PRESSURE_LAST_FAILED_VALUE: Dict[int, float] = {}


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
    repeat_count: int
    leak_threshold_1ul: float
    leak_threshold_50ul: float
    leak_threshold_200ul: float
    cv_threshold_1ul: float
    cv_threshold_50ul: float
    cv_threshold_200ul: float
    fail_count_threshold: int
    retest_mode: bool
    leak_rate_offsets_1ul: Dict[int, float]
    leak_rate_offsets_50ul: Dict[int, float]
    leak_rate_offsets_200ul: Dict[int, float]

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


async def _pick_up_tip_96_hold_gear_engaged(
    api: OT3API, mount: OT3Mount, tip_length: float
) -> None:
    """Pick up 96 tips while keeping gear-motor position engaged after pickup.

    Sequence:
    1) move plunger bottom
    2) execute HT tip action without post-action gear home (hold engaged)
    3) add tip state + prepare for aspirate
    """
    instrument = api._pipette_handler.get_pipette(mount)
    await api._move_to_plunger_bottom(mount, rate=1.0)

    if (
        api.gantry_load.name == "HIGH_THROUGHPUT"
        and instrument.nozzle_manager.current_configuration.configuration.name == "FULL"
    ):
        spec = api._pipette_handler.plan_ht_pick_up_tip(
            instrument.nozzle_manager.current_configuration.tip_count
        )
        if spec.z_distance_to_tiprack:
            await api.move_rel(mount, Point(z=spec.z_distance_to_tiprack))

        # Keep engaged: run tip_action directly and intentionally skip the
        # trailing home_gear_motors() in api._tip_motor_action().
        currents = spec.tip_action_moves[0].currents
        async with api._backend.motor_current(run_currents=currents):
            if api._backend.gear_motor_position is None:
                await api.home_gear_motors()
            gear_origin_float = api._backend.gear_motor_position or 0.0
            move_targets = [
                (move_segment.distance, move_segment.speed or 400)
                for move_segment in spec.tip_action_moves
            ]
            await api._backend.tip_action(origin=gear_origin_float, targets=move_targets)

        # Intentionally skip shake-off moves to keep the pickup mechanism
        # in a continuously engaged state until pressure test is complete.
    else:
        # Fallback to default 96 routine for non-HT/full configuration.
        await api.tip_pickup_moves_96(mount)

    api.add_tip(mount, tip_length)
    await api.prepare_for_aspirate(mount)


async def _release_gear_then_drop_tip(api: OT3API) -> None:
    """Finalize tip removal in required order:
    1) home gear motors (release pull state)
    2) move up a little
    3) drop tip
    """
    await api.home_gear_motors()
    await api.move_rel(OT3Mount.LEFT, Point(z=20))
    await api.drop_tip(OT3Mount.LEFT)

def _connect_to_fixture() -> PressureFixtureBase:
    fixture = connect_to_fixture96(
       simulate = False
    )
    return fixture

async def _fixture_check_pressure(
    api: OT3API,
    mount: OT3Mount,
    # test_config: TestConfig,
    cfg: TestConfig_,
    fixture: Optional[PressureFixtureBase],
    write_cb: Optional[Callable],
    accumulate_raw_data_cb: Optional[Callable],
    repeat_index: int,
) -> bool:
    results = []
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip
    pip_vol = int(pip.working_volume)
    print("pip_vol",pip_vol)
    pip_channels = int(pip.channels)
    print("pip_channels",pip_channels)
    delaytime = 3 #
    # above the fixture
    r, _ = await _read_pressure_and_check_results(
        api,
        pip_channels,
        pip_vol,
        fixture,
        PressureEvent.PRE,
        cfg,
        write_cb,
        accumulate_raw_data_cb,
        pip_channels,
        repeat_index=repeat_index,
    )
    results.append(r)
    # insert into the fixture
    # NOTE: unknown amount of pressure here (depends on where Z was calibrated)
    # fixture_depth = PRESSURE_FIXTURE_INSERT_DEPTH[pip_vol]
    # await api.move_rel(mount, Point(z=-fixture_depth))
    print("picking up tips (hold gear engaged)")
    await _pick_up_tip_96_hold_gear_engaged(
        api,
        OT3Mount.LEFT,
        helpers_ot3.get_default_tip_length(1000),
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
        cfg,
        write_cb,
        accumulate_raw_data_cb,
        pip_channels,
        repeat_index=repeat_index,
    )
    results.append(r)
    # aspirate 50uL
    
    aspiratevol = PRESSURE_FIXTURE_ASPIRATE_VOLUME[pip_vol]

    for aspval in aspiratevol:
        print("aspirate:",aspval)
        write_cb(["aspirate-dispense",aspval,"ul"])
        await api.aspirate(mount, aspval)
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
            cfg,
            write_cb,
            accumulate_raw_data_cb,
            pip_channels,
            previous=inserted_pressure_data,
            aspirate_dispense=aspval,
            repeat_index=repeat_index,
        )
        results.append(r)
        # dispense
        
        print("dispense:",aspval)
        await api.dispense(mount, aspval)
        await asyncio.sleep(delaytime)
        r, _ = await _read_pressure_and_check_results(
            api,
            pip_channels,
            pip_vol,
            fixture,
            PressureEvent.DISPENSE,
            cfg,
            write_cb,
            accumulate_raw_data_cb,
            pip_channels,
            aspirate_dispense=aspval,
            repeat_index=repeat_index,
        )
        results.append(r)
        await api.prepare_for_aspirate(OT3Mount.LEFT)
    # retract out of fixture
    #await api.move_rel(mount, Point(z=fixture_depth))
    # Release gears only after pressure testing, then drop tip.
    await _release_gear_then_drop_tip(api)
    await asyncio.sleep(delaytime)
    r, _ = await _read_pressure_and_check_results(
        api,
        pip_channels,
        pip_vol,
        fixture,
        PressureEvent.POST,
        cfg,
        write_cb,
        accumulate_raw_data_cb,
        pip_channels,
        repeat_index=repeat_index,
    )
    results.append(r)
    return False not in results

async def _read_pressure_and_check_results(
    api: OT3API,
    pipette_channels: int,
    pipette_volume: int,
    fixture: PressureFixtureBase,
    tag: PressureEvent,
    cfg: TestConfig_,
    write_cb: CSVReport,
    accumulate_raw_data_cb: Callable,
    channels: int = 1,
    previous: Optional[List[List[float]]] = None,
    aspirate_dispense:int=None,
    repeat_index: int = 1,
) -> Tuple[bool, List[List[float]]]:
    previous_average_per_channel: Optional[List[float]] = None
    leak_rate_offsets = _leak_rate_offsets_for_aspirate_volume(cfg, aspirate_dispense)

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
    if previous:
        previous_average_per_channel = [
            sum(sample[c] for sample in previous) / len(previous) for c in range(channels)
        ]
    for i in range(pressure_event_config.sample_count):
        sample_start_time = time()
        _samples.append(fixture.read_all_pressure_channel_96())
        _sample_as_strings = [str(round(p, 2)) for p in _samples[-1]]
        
        ui.print_header(f"{i + 1}/{pressure_event_config.sample_count}: {tag.value}")
        print_pressure_datas(_sample_as_strings)
        if tag.value == "holding" or tag.value == "dispensed":
            phase_label = f"{tag.value}-{aspirate_dispense}ul-{repeat_index}"
            csv_data_sample = [phase_label] + _sample_as_strings
        else:
            phase_label = f"{tag.value}-{repeat_index}"
            csv_data_sample = [phase_label] + _sample_as_strings
        # print(f"{i + 1}/{pressure_event_config.sample_count}: {csv_data_sample}")
        print("tag.value:",tag.value)
        # if tag.value == "holding" or tag.value == "dispensed":
        #     accumulate_raw_data_cb(["aspirate_dispense",aspirate_dispense,"ul"])

        accumulate_raw_data_cb(csv_data_sample)
        delay_time = pressure_event_config.sample_delay - (time() - sample_start_time)
        if (
            not api.is_simulator
            and i < pressure_event_config.sample_count - 1
            and delay_time > 0
        ):
            await asyncio.sleep(delay_time)
    _samples_per_channel = [[s[c] for s in _samples] for c in range(channels)]
    _average_per_channel = [sum(s) / len(s) for s in _samples_per_channel]
    leak_rates_per_channel: List[float] = []
    test_pass_stability = True
    for c in range(channels):
        channel_samples = _samples_per_channel[c]
        channel_number = c + 1
        if tag == PressureEvent.INSERT and all(
            math.isclose(sample, 0.0, abs_tol=1e-9) for sample in channel_samples
        ):
            printsig = (
                f"stop-test:测试工装气压,状态{tag.value},"
                f"ch{channel_number}在insert阶段采样数据全部为0,"
                "程序自动停止测试，原因工装可能存在线脱落。"
            )
            ui.print_fail(printsig)
            FINAL_TEST_FAIL_INFOR.append(printsig)
            LOG_GING.error(printsig)
            write_cb(
                [
                    f"pressure-{tag.value}-channel-{channel_number}",
                    "insert-all-zero",
                    "FAIL",
                ]
            )
            raise StopTestError(printsig)
        sorted_samples = sorted(channel_samples)
        # Use symmetric trimming when possible to reduce spike sensitivity.
        # For very small sample counts, fall back to untrimmed data.
        if len(sorted_samples) >= 3:
            calc_samples = sorted_samples[1:-1]
        else:
            calc_samples = sorted_samples
            warnsig = (
                f"warning: pressure-{tag.value}-channel-{channel_number} "
                f"sample-count={len(sorted_samples)} too small for symmetric trim, "
                "fallback to untrimmed leak-rate calculation."
            )
            print(warnsig)
            LOG_GING.warning(warnsig)
        if not calc_samples:
            calc_samples = sorted_samples
        _c_min = min(calc_samples)
        _c_max = max(calc_samples)
        leak_rate = (_c_max - _c_min) / LEAK_RATE_WINDOW_SECONDS
        leak_rate += leak_rate_offsets.get(channel_number, 0.0)
        leak_rates_per_channel.append(leak_rate)
        csv_data_min = [f"pressure-{tag.value}-channel-{channel_number}", "min", _c_min]
        print(csv_data_min)
        write_cb(csv_data_min)
        csv_data_max = [f"pressure-{tag.value}-channel-{channel_number}", "max", _c_max]
        print(csv_data_max)
        write_cb(csv_data_max)
        csv_data_leak_rate = [
            f"pressure-{tag.value}-channel-{channel_number}",
            f"{LEAK_RATE_WINDOW_SECONDS}s-leak-rate",
            round(leak_rate, 4),
        ]
        print(csv_data_leak_rate)
        write_cb(csv_data_leak_rate)
        csv_data_avg = [
            f"pressure-{tag.value}-channel-{channel_number}",
            "average",
            _average_per_channel[c],
        ]
        print(csv_data_avg)
        write_cb(csv_data_avg)
        if tag == PressureEvent.INSERT:
            insert_pressure_passed = _average_per_channel[c] > INSERT_PRESSURE_MIN
            csv_data_insert_pressure = [
                f"pressure-{tag.value}-channel-{channel_number}",
                "insert-pressure-gt-500",
                _bool_to_pass_fail(insert_pressure_passed),
            ]
            print(csv_data_insert_pressure)
            write_cb(csv_data_insert_pressure)
            if not insert_pressure_passed:
                INSERT_PRESSURE_FAILED_COUNTS[channel_number] = (
                    INSERT_PRESSURE_FAILED_COUNTS.get(channel_number, 0) + 1
                )
                INSERT_PRESSURE_LAST_FAILED_VALUE[channel_number] = _average_per_channel[c]
                printsig = (
                    f"04-fixture-pressure:测试工装气压,状态{tag.value},"
                    f"ch{channel_number}插入工装平均气压{round(_average_per_channel[c], 2)}"
                    f"不大于阈值{INSERT_PRESSURE_MIN}"
                )
                ui.print_fail(printsig)
                FINAL_TEST_FAIL_INFOR.append(printsig)
                LOG_GING.error(printsig)
        if _c_max - _c_min > pressure_event_config.stability_threshold:
            print(
                f"ERROR: channel {channel_number} samples are too far apart, "
                f"max={round(_c_max, 2)} and min={round(_c_min, 2)}"
            )
            printsig = f"01-fixture-pressure:测试工装气压,状态{tag.value},ch{channel_number}气压差变动最大值{round(_c_max, 2)}与最小值 {round(_c_min, 2)}差值 {abs(round(_c_max, 2)-round(_c_min, 2))} 超过阈值{pressure_event_config.stability_threshold}"
            ui.print_fail(printsig)
            FINAL_TEST_FAIL_INFOR.append(printsig)
            test_pass_stability = False
            LOG_GING.error(printsig)
    csv_data_stability = [
        f"pressure-{tag.value}",
        "stability",
        _bool_to_pass_fail(test_pass_stability),
    ]
    print(csv_data_stability)
    write_cb(csv_data_stability)
    if tag == PressureEvent.INSERT:
        insert_failed_channels = sum(
            1 for c in range(channels) if _average_per_channel[c] <= INSERT_PRESSURE_MIN
        )
        csv_data_insert_gate = [
            f"pressure-{tag.value}",
            "insert-pressure-failed-channels",
            insert_failed_channels,
        ]
        print(csv_data_insert_gate)
        write_cb(csv_data_insert_gate)
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
        LOG_GING.error(
            f"ERROR: samples are out of range, "
            f"max={round(_samples_max, 2)} and min={round(_samples_min, 2)}")
        printsig =f"02-fixture-pressure:测试工装气压,状态{tag.value},读取fixture的所有气压最大值{round(_samples_max, 2)}~最小值{round(_samples_min, 2)}超出阈值范围{pressure_event_config.min}~{pressure_event_config.max}"
        #print(f"05-02:状态{tag.value},读取的气压最大值 {round(_samples_max, 2)} 最小值 {round(_samples_min, 2)} 超出阈值范围, 阈值:{pressure_event_config.min}~{pressure_event_config.max}")
        ui.print_fail(printsig)
        FINAL_TEST_FAIL_INFOR.append(printsig)
        test_pass_accuracy = False
        LOG_GING.error(printsig)
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
    deltas_per_channel: List[float] = []
    if previous and previous_average_per_channel:
        assert len(previous_average_per_channel) >= len(_average_per_channel)
        for c in range(channels):
            _delta_target = PRESSURE_ASPIRATE_DELTA_SPEC[pipette_channels][
                pipette_volume
            ]["delta"]
            _delta_margin = PRESSURE_ASPIRATE_DELTA_SPEC[pipette_channels][
                pipette_volume
            ]["margin"]
            _delta_min = _delta_target - (_delta_target * _delta_margin)
            _delta_max = _delta_target + (_delta_target * _delta_margin)
            _delta = abs(_average_per_channel[c] - previous_average_per_channel[c])
            deltas_per_channel.append(_delta)
            if _delta < _delta_min or _delta > _delta_max:
                print(
                    f"ERROR: channel {c + 1} pressure delta ({_delta}) "
                    f"out of range: max={_delta_max}, min={_delta_min}"
                )
                LOG_GING.error(
                    f"ERROR: channel {c + 1} pressure delta ({_delta}) "
                    f"out of range: max={_delta_max}, min={_delta_min}")
                printsig = f"03-fixture-pressure:测试工装气压,状态{tag.value},ch{c + 1}吸液50ul气压平均值{_average_per_channel[c]}与插入工装平均气压{previous_average_per_channel[c]}差值{_delta}不在阈值范围{_delta_max}~{_delta_min}"
                #print(f"05-03:状态{tag.value},channel {c + 1} 气压值增量 {_delta} 不在阈值范围内, 阈值:{_delta_max}~{_delta_min}")
                ui.print_fail(printsig)
                FINAL_TEST_FAIL_INFOR.append(printsig)
                test_pass_delta = False
                LOG_GING.error(printsig)
        csv_data_delta = [
            f"pressure-{tag.value}",
            "delta",
            _bool_to_pass_fail(test_pass_delta),
        ]
        print(csv_data_delta)
        write_cb(csv_data_delta)
        phase_name = _holding_phase_name(tag, aspirate_dispense)
        if phase_name:
            _record_channel_leak_values(phase_name, leak_rates_per_channel, channels)
    _passed = test_pass_stability and test_pass_accuracy and test_pass_delta
    return _passed, _samples   

@dataclass
class CSVCallbacks:
    """CSV callback functions."""
    pressure: Callable

PRESSURE_DATA_CACHE = []
DEFAULT_LEAK_RATE_OFFSETS: Dict[int, float] = {}


def _parse_leak_rate_offsets(value: str) -> Dict[int, float]:
    offsets: Dict[int, float] = {}
    if not value.strip():
        return offsets
    for item in value.split(","):
        item = item.strip()
        if not item:
            continue
        try:
            channel_text, offset_text = item.split(":", 1)
        except ValueError as exc:
            raise argparse.ArgumentTypeError(
                "fixture channel offsets must look like 9:-0.73,12:-4.50,86:-0.84"
            ) from exc
        channel = int(channel_text.strip())
        offset = float(offset_text.strip())
        if channel < 1 or channel > 96:
            raise argparse.ArgumentTypeError(
                f"channel must be between 1 and 96, got {channel}"
            )
        offsets[channel] = offset
    return offsets


def _leak_rate_offsets_for_aspirate_volume(
    cfg: TestConfig_, aspirate_dispense: Optional[int]
) -> Dict[int, float]:
    if aspirate_dispense == 1:
        return cfg.leak_rate_offsets_1ul
    if aspirate_dispense == 50:
        return cfg.leak_rate_offsets_50ul
    if aspirate_dispense == 200:
        return cfg.leak_rate_offsets_200ul
    return {}


def _holding_phase_name(
    tag: PressureEvent, aspirate_dispense: Optional[float]
) -> Optional[str]:
    if tag.value != PressureEvent.ASPIRATE_P50.value:
        return None
    if aspirate_dispense is None:
        return tag.value
    return f"{tag.value}-{aspirate_dispense}ul"


def _record_channel_leak_values(
    phase_name: str, leak_rates: List[float], channels: int
) -> None:
    phase_history = CHANNEL_LEAK_HISTORY.setdefault(
        phase_name, [[] for _ in range(channels)]
    )
    if len(phase_history) < channels:
        phase_history.extend([[] for _ in range(channels - len(phase_history))])
    for channel_index, leak_rate in enumerate(leak_rates[:channels]):
        phase_history[channel_index].append(leak_rate)


def _calculate_cv(values: List[float]) -> float:
    if len(values) <= 1:
        return 0.0
    mean_value = statistics.fmean(values)
    std_dev = statistics.pstdev(values)
    if math.isclose(mean_value, 0.0, abs_tol=1e-9):
        return 0.0 if math.isclose(std_dev, 0.0, abs_tol=1e-9) else math.inf
    return std_dev / abs(mean_value)


def _calculate_mad(values: List[float]) -> float:
    if not values:
        return 0.0
    median_value = statistics.median(values)
    deviations = [abs(value - median_value) for value in values]
    return statistics.median(deviations)


def _phase_volume_key(phase_name: str) -> str:
    if "1.0ul" in phase_name:
        return "1ul"
    if "50.0ul" in phase_name:
        return "50ul"
    if "200.0ul" in phase_name:
        return "200ul"
    return "default"


def _phase_sort_order(phase_name: str) -> Tuple[int, str]:
    phase_key = _phase_volume_key(phase_name)
    order_map = {
        "1ul": 0,
        "50ul": 1,
        "200ul": 2,
        "default": 3,
    }
    return (order_map.get(phase_key, 99), phase_name)


def _thresholds_for_phase(
    phase_name: str,
    leak_thresholds: Dict[str, float],
    cv_thresholds: Dict[str, float],
) -> Tuple[float, float]:
    phase_key = _phase_volume_key(phase_name)
    leak_threshold = leak_thresholds.get(
        phase_key, leak_thresholds.get("default", 1.0)
    )
    cv_threshold = cv_thresholds.get(
        phase_key, cv_thresholds.get("default", 0.2)
    )
    return leak_threshold, cv_threshold


def _summarize_channel_leak_history(
    write_cb: Callable,
    leak_thresholds: Dict[str, float],
    cv_thresholds: Dict[str, float],
    fail_count_threshold: int,
    retest_mode: bool,
) -> Tuple[bool, List[List[Any]]]:
    overall_pass = True
    if not CHANNEL_LEAK_HISTORY:
        return overall_pass, []
    write_cb(["-------------"])
    write_cb(["CHANNEL-LEAK-STATS"])
    compact_summary_rows: List[List[Any]] = []
    for phase_name, channel_histories in sorted(
        CHANNEL_LEAK_HISTORY.items(),
        key=lambda item: _phase_sort_order(item[0]),
    ):
        leak_threshold, cv_threshold = _thresholds_for_phase(
            phase_name, leak_thresholds, cv_thresholds
        )
        for channel_index, channel_values in enumerate(channel_histories, start=1):
            if not channel_values:
                continue
            median_value = statistics.median(channel_values)
            cv_value = _calculate_cv(channel_values)
            mad_value = _calculate_mad(channel_values)
            fail_count = sum(value > leak_threshold for value in channel_values)
            insert_fail_count = INSERT_PRESSURE_FAILED_COUNTS.get(channel_index, 0)
            if insert_fail_count >= fail_count_threshold:
                channel_passed = False
                decision_reason = "insert-pressure-fail-count-threshold"
            elif median_value <= leak_threshold:
                channel_passed = True
                decision_reason = "median-ok"
            elif cv_value <= cv_threshold:
                channel_passed = False
                decision_reason = "high-median-low-cv"
            else:
                channel_passed = fail_count <= fail_count_threshold
                decision_reason = (
                    "high-median-high-cv-failcount-ok"
                    if channel_passed
                    else "high-median-high-cv-failcount-fail"
                )
            channel_status = _channel_status_label(channel_passed, retest_mode)
            overall_pass = overall_pass and channel_passed
            channel_tag = f"channel-leak-{phase_name}-ch{channel_index}"
            write_cb(
                [
                    channel_tag,
                    f"{LEAK_RATE_WINDOW_SECONDS}s-leak-rate-values",
                    "|".join(f"{v:.4f}" for v in channel_values),
                ]
            )
            write_cb(
                [
                    channel_tag,
                    f"{LEAK_RATE_WINDOW_SECONDS}s-leak-rate-median",
                    round(median_value, 4),
                ]
            )
            write_cb([channel_tag, "leak-threshold", leak_threshold])
            write_cb(
                [
                    channel_tag,
                    f"{LEAK_RATE_WINDOW_SECONDS}s-leak-rate-cv",
                    "inf" if math.isinf(cv_value) else round(cv_value, 4),
                ]
            )
            write_cb([channel_tag, "cv-threshold", cv_threshold])
            write_cb(
                [
                    channel_tag,
                    f"{LEAK_RATE_WINDOW_SECONDS}s-leak-rate-mad",
                    round(mad_value, 4),
                ]
            )
            write_cb([channel_tag, "fail-count", fail_count])
            write_cb([channel_tag, "insert-fail-count", insert_fail_count])
            if channel_index in INSERT_PRESSURE_LAST_FAILED_VALUE:
                write_cb(
                    [
                        channel_tag,
                        "last-insert-average-pressure",
                        round(INSERT_PRESSURE_LAST_FAILED_VALUE[channel_index], 4),
                    ]
                )
            write_cb([channel_tag, "decision-reason", decision_reason])
            write_cb([channel_tag, "status", channel_status])
            write_cb([channel_tag, "pass", _bool_to_pass_fail(channel_passed)])
            compact_summary_rows.append(
                [
                    phase_name,
                    f"CH{channel_index}",
                    leak_threshold,
                    round(median_value, 4),
                    cv_threshold,
                    "inf" if math.isinf(cv_value) else round(cv_value, 4),
                    round(mad_value, 4),
                    fail_count,
                    insert_fail_count,
                    channel_status,
                    _bool_to_pass_fail(channel_passed),
                ]
            )
    write_cb(["-------------"])
    write_cb(["CHANNEL-LEAK-SUMMARY"])
    write_cb(
        [
            "phase",
            "channel",
            "leak-threshold",
            f"{LEAK_RATE_WINDOW_SECONDS}s-leak-rate-median",
            "cv-threshold",
            f"{LEAK_RATE_WINDOW_SECONDS}s-leak-rate-cv",
            f"{LEAK_RATE_WINDOW_SECONDS}s-leak-rate-mad",
            "fail-count",
            "insert-fail-count",
            "status",
            "pass",
        ]
    )
    for row in compact_summary_rows:
        write_cb(row)
    abnormal_rows = [row for row in compact_summary_rows if row[-1] != "PASS"]
    return overall_pass, abnormal_rows


def _print_abnormal_channels_terminal_only(abnormal_rows: List[List[Any]]) -> None:
    if not abnormal_rows:
        print("Abnormal channels: none")
        return
    print("Abnormal channels:")
    for row in abnormal_rows:
        phase = row[0]
        channel = row[1]
        leak_threshold = row[2]
        leak_rate_median = row[3]
        cv_threshold = row[4]
        leak_rate_cv = row[5]
        leak_rate_mad = row[6]
        fail_count = row[7]
        insert_fail_count = row[8]
        status = row[9]
        print(
            f" - {phase} {channel}: status={status}, "
            f"median={leak_rate_median}, threshold={leak_threshold}, "
            f"cv={leak_rate_cv}, cv-threshold={cv_threshold}, "
            f"mad={leak_rate_mad}, fail-count={fail_count}, "
            f"insert-fail-count={insert_fail_count}"
        )

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
    cfg: TestConfig_
) -> None:
    """Run."""
    # GATHER NOMINAL POSITIONS
    #trash_nominal = get_trash_nominal()
    pipette_string = "p1000_96_v3.4" if cfg.pipette == 1000 else "p200_96_v3.0"
    # BUILD API
    #global FINAL_TEST_FAIL_INFOR
    global LOG_GING
    global FINAL_TEST_FAIL_INFOR
    global PRESSURE_DATA_CACHE
    global CHANNEL_LEAK_HISTORY
    global INSERT_PRESSURE_FAILED_COUNTS
    global INSERT_PRESSURE_LAST_FAILED_VALUE
    global FINAL_TEST_RESULTS
    LOG_GING = ''
    FINAL_TEST_FAIL_INFOR = []
    PRESSURE_DATA_CACHE = []
    CHANNEL_LEAK_HISTORY = {}
    INSERT_PRESSURE_FAILED_COUNTS = {}
    INSERT_PRESSURE_LAST_FAILED_VALUE = {}
    FINAL_TEST_RESULTS = []
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=cfg.simulate,
        pipette_left=pipette_string,
    )
    if (
        cfg.leak_rate_offsets_1ul
        or cfg.leak_rate_offsets_50ul
        or cfg.leak_rate_offsets_200ul
    ):
        print("leak-rate compensation:")
        if cfg.leak_rate_offsets_1ul:
            print(
                "  1ul:",
                ", ".join(
                    f"CH{channel}={offset:+.3f}"
                    for channel, offset in sorted(cfg.leak_rate_offsets_1ul.items())
                ),
            )
        if cfg.leak_rate_offsets_50ul:
            print(
                "  50ul:",
                ", ".join(
                    f"CH{channel}={offset:+.3f}"
                    for channel, offset in sorted(cfg.leak_rate_offsets_50ul.items())
                ),
            )
        if cfg.leak_rate_offsets_200ul:
            print(
                "  200ul:",
                ", ".join(
                    f"CH{channel}={offset:+.3f}"
                    for channel, offset in sorted(cfg.leak_rate_offsets_200ul.items())
                ),
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
    csv_cb.write(["repeat-count", cfg.repeat_count])
    csv_cb.write(["leak-threshold-1ul", cfg.leak_threshold_1ul])
    csv_cb.write(["leak-threshold-50ul", cfg.leak_threshold_50ul])
    csv_cb.write(["leak-threshold-200ul", cfg.leak_threshold_200ul])
    csv_cb.write(["cv-threshold-1ul", cfg.cv_threshold_1ul])
    csv_cb.write(["cv-threshold-50ul", cfg.cv_threshold_50ul])
    csv_cb.write(["cv-threshold-200ul", cfg.cv_threshold_200ul])
    csv_cb.write(["fail-count-threshold", cfg.fail_count_threshold])
    csv_cb.write(["leak-rate-window-seconds", LEAK_RATE_WINDOW_SECONDS])
    csv_cb.write(["insert-pressure-min", INSERT_PRESSURE_MIN])
    csv_cb.write(["insert-fail-count-threshold", cfg.fail_count_threshold])
    csv_cb.write(["retest-mode", cfg.retest_mode])
    csv_cb.write(
        [
            "leak-rate-offsets-1ul",
            "|".join(
                f"CH{channel}:{offset}"
                for channel, offset in sorted(cfg.leak_rate_offsets_1ul.items())
            )
            or "none",
        ]
    )
    csv_cb.write(
        [
            "leak-rate-offsets-50ul",
            "|".join(
                f"CH{channel}:{offset}"
                for channel, offset in sorted(cfg.leak_rate_offsets_50ul.items())
            )
            or "none",
        ]
    )
    csv_cb.write(
        [
            "leak-rate-offsets-200ul",
            "|".join(
                f"CH{channel}:{offset}"
                for channel, offset in sorted(cfg.leak_rate_offsets_200ul.items())
            )
            or "none",
        ]
    )
    # add test configurations to CSV
    csv_cb.write(["-------------------"])
    
    try:
        csv_cb.pressure(PRESSURE_DATA_HEADER, first_row_value="")
        leak_thresholds = {
            "1ul": cfg.leak_threshold_1ul,
            "50ul": cfg.leak_threshold_50ul,
            "200ul": cfg.leak_threshold_200ul,
            "default": cfg.leak_threshold_50ul,
        }
        cv_thresholds = {
            "1ul": cfg.cv_threshold_1ul,
            "50ul": cfg.cv_threshold_50ul,
            "200ul": cfg.cv_threshold_200ul,
            "default": cfg.cv_threshold_50ul,
        }
        test_passed = True
        fixture_pick_up_point: Optional[Point] = None
        for repeat_index in range(cfg.repeat_count):
            await api.home()
            if fixture_pick_up_point is None:
                await helpers_ot3.move_to_arched_ot3(
                    api, OT3Mount.LEFT, Point(x=342, y=288, z=111.5)
                )
            else:
                await helpers_ot3.move_to_arched_ot3(
                    api, OT3Mount.LEFT, fixture_pick_up_point
                )

            if repeat_index == 0:
                # Nohup mode: skip manual confirmation and jog calibration.
                # ui.get_user_ready("Starting to pick up")
                # await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
                fixture_pick_up_point = await api.gantry_position(OT3Mount.LEFT)

            csv_cb.write(["trial-index", repeat_index + 1, cfg.repeat_count])
            trial_passed = await _fixture_check_pressure(
                api,
                OT3Mount.LEFT,
                cfg,
                fixture,
                write_cb=csv_cb.write,
                accumulate_raw_data_cb=csv_cb.pressure,
                repeat_index=repeat_index + 1,
            )
            test_passed = test_passed and trial_passed
        channel_summary_passed, abnormal_rows = _summarize_channel_leak_history(
            write_cb=csv_cb.write,
            leak_thresholds=leak_thresholds,
            cv_thresholds=cv_thresholds,
            fail_count_threshold=cfg.fail_count_threshold,
            retest_mode=cfg.retest_mode,
        )
        _print_abnormal_channels_terminal_only(abnormal_rows)
        csv_cb.results("pressure-repeatability", channel_summary_passed)
        csv_cb.results("pressure", test_passed and channel_summary_passed)
        csv_cb.write(["-------------"])
        csv_cb.write(["PRESSURE-DATA"])
        for press_data in PRESSURE_DATA_CACHE:
            csv_cb.write(press_data, first_row_value_included=True)
    except StopTestError as err:
        print("run fail:",err)
        LOG_GING.error(f"test stopped: {err}")
        try:
            await _release_gear_then_drop_tip(api)
        except Exception:
            pass
    except Exception as err:
        print("run fail:",err)
        try:
            await _release_gear_then_drop_tip(api)
        except Exception:
            pass
    finally:
        await api.home()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    def _parse_bool_arg(value: str) -> bool:
        lowered = value.lower()
        if lowered in {"true", "1", "yes", "y", "on"}:
            return True
        if lowered in {"false", "0", "no", "n", "off"}:
            return False
        raise argparse.ArgumentTypeError(f"invalid boolean value: {value}")

    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--pipette", type=int, choices=[200, 1000], default=200)
    parser.add_argument("--repeat-count", type=int, default=10)
    parser.add_argument("--leak-threshold-1ul", type=float, default=2.45)
    parser.add_argument("--leak-threshold-50ul", type=float, default=0.88)
    parser.add_argument("--leak-threshold-200ul", type=float, default=3.07)
    parser.add_argument("--cv-threshold-1ul", type=float, default=0.2)
    parser.add_argument("--cv-threshold-50ul", type=float, default=0.2)
    parser.add_argument("--cv-threshold-200ul", type=float, default=0.2)
    parser.add_argument("--fail-count-threshold", type=int, default=3)
    parser.add_argument("--retest-mode", type=_parse_bool_arg, default=False)
    parser.add_argument(
        "--leak-rate-offsets-1ul",
        type=_parse_leak_rate_offsets,
        default=DEFAULT_LEAK_RATE_OFFSETS,
        help="1ul per-channel leak-rate compensation offsets, e.g. 9:-0.73,12:-4.50,86:-0.84",
    )
    parser.add_argument(
        "--leak-rate-offsets-50ul",
        type=_parse_leak_rate_offsets,
        default=DEFAULT_LEAK_RATE_OFFSETS,
        help="50ul per-channel leak-rate compensation offsets, e.g. 9:-0.15,12:-0.30,86:-0.18",
    )
    parser.add_argument(
        "--leak-rate-offsets-200ul",
        type=_parse_leak_rate_offsets,
        default=DEFAULT_LEAK_RATE_OFFSETS,
        help="200ul per-channel leak-rate compensation offsets, e.g. 9:-0.25,12:-0.40,86:-0.22",
    )
    args = parser.parse_args()
    _config = TestConfig_(
        simulate=args.simulate,
        pipette=args.pipette,
        repeat_count=args.repeat_count,
        leak_threshold_1ul=args.leak_threshold_1ul,
        leak_threshold_50ul=args.leak_threshold_50ul,
        leak_threshold_200ul=args.leak_threshold_200ul,
        cv_threshold_1ul=args.cv_threshold_1ul,
        cv_threshold_50ul=args.cv_threshold_50ul,
        cv_threshold_200ul=args.cv_threshold_200ul,
        fail_count_threshold=args.fail_count_threshold,
        retest_mode=args.retest_mode,
        leak_rate_offsets_1ul=dict(args.leak_rate_offsets_1ul),
        leak_rate_offsets_50ul=dict(args.leak_rate_offsets_50ul),
        leak_rate_offsets_200ul=dict(args.leak_rate_offsets_200ul),
    )
    asyncio.run(_main(_config))
    
