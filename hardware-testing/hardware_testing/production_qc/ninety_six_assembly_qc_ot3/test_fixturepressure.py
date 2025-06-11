"""Test Droplets."""
from asyncio import sleep
import asyncio
from time import time
from typing import List, Union, Tuple, Optional, Dict, Literal

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.motion_utilities import target_position_from_relative

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
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

from hardware_testing.drivers.pressure_fixture import (
    PressureFixtureBase,
    connect_to_fixture,
    connect_to_fixture96
)
from typing import Optional, Callable, List, Any, Tuple, Dict, cast
def _bool_to_pass_fail(result: bool) -> str:
    return "PASS" if result else "FAIL"

NUM_SECONDS_TO_WAIT = 30
HOVER_HEIGHT_MM = 50
DEPTH_INTO_RESERVOIR_FOR_ASPIRATE = -24
DEPTH_INTO_RESERVOIR_FOR_DISPENSE = DEPTH_INTO_RESERVOIR_FOR_ASPIRATE

RESERVOIR_LABWARE = "nest_1_reservoir_195ml"
PRESSURE_DATA_HEADER = ["PHASE", "CH1", "CH2", "CH3", "CH4", "CH5", "CH6", "CH7", "CH8"]

TIP_RACK_96_SLOT = 6
TIP_RACK_PARTIAL_SLOT = 5
RESERVOIR_SLOT = 2
TRASH_SLOT = 12

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
    fixture: PressureFixtureBase,
    write_cb: CSVReport,
    accumulate_raw_data_cb: Callable,
) -> bool:
    results = []
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip
    pip_vol = int(pip.working_volume)
    print("pip_vol",pip_vol)
    pip_channels = int(pip.channels)
    print("pip_channels",pip_channels)
    # above the fixture
    r, _ = await _read_pressure_and_check_results(
        api,
        pip_channels,
        pip_vol,
        fixture,
        PressureEvent.PRE,
        write_cb,
        accumulate_raw_data_cb,
        pip_channels,
    )
    results.append(r)
 
    
    # insert into the fixture
    # NOTE: unknown amount of pressure here (depends on where Z was calibrated)
    # fixture_depth = PRESSURE_FIXTURE_INSERT_DEPTH[pip_vol]
    # await api.move_rel(mount, Point(z=-fixture_depth))
    print("picking up tips")
    await api.pick_up_tip(
        OT3Mount.LEFT, helpers_ot3.get_default_tip_length(1000)
    )
    await api.move_rel(OT3Mount.LEFT,Point(z=24))
    await asyncio.sleep(10)
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
    await api.drop_tip(OT3Mount.LEFT)
    await asyncio.sleep(10)
    r, _ = await _read_pressure_and_check_results(
        api,
        pip_channels,
        pip_vol,
        fixture,
        PressureEvent.POST,
        write_cb,
        accumulate_raw_data_cb,
        pip_channels,
    )
    results.append(r)
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
    
    def format_pressure_datas(data_list):
        number_to_row = ["A", "B", "C", "D", "E", "F", "G", "H"]
        # 将列表重新组织为12列，每列8行
        columns = []
        for col in range(12):
            column_start = col * 8
            column_end = column_start + 8
            column = data_list[column_start:column_end]
            columns.append(column)
            
        # 按行输出（每行包含12列的数据）
        print( f'   {" ".join([str(i+1)+ " "*(8 - len(str(i+1))) for i in range(12)])}')
        row_number = 0
        for row in range(8):
            row_data = []
            for col in range(12):
                row_data.append(columns[col][row]+ " "* (8- len(columns[col][row])))
            print(f'{number_to_row[row_number]}: {" ".join(row_data)}')
            row_number += 1
    
    pressure_event_config: PressureEventConfig = PRESSURE_CFG[tag]
    if not api.is_simulator:
        await asyncio.sleep(pressure_event_config.stability_delay)
    _samples = []
    for i in range(pressure_event_config.sample_count):
        _samples.append(fixture.read_all_pressure_channel_96())
        next_sample_time = time() + pressure_event_config.sample_delay
        _sample_as_strings = [str(round(p, 2)) for p in _samples[-1]]
        
        ui.print_header(f"{i + 1}/{pressure_event_config.sample_count}: {tag.value}")
        format_pressure_datas(_sample_as_strings)
        csv_data_sample = [tag.value] + _sample_as_strings
        # print(f"{i + 1}/{pressure_event_config.sample_count}: {csv_data_sample}")
        #accumulate_raw_data_cb(csv_data_sample)
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
        ##write_cb(csv_data_min)
        csv_data_max = [f"pressure-{tag.value}-channel-{c + 1}", "max", _c_max]
        print(csv_data_max)
        ##write_cb(csv_data_max)
        csv_data_avg = [
            f"pressure-{tag.value}-channel-{c + 1}",
            "average",
            _average_per_channel[c],
        ]
        print(csv_data_avg)
        ##write_cb(csv_data_avg)
        if _c_max - _c_min > pressure_event_config.stability_threshold:
            print(
                f"ERROR: channel {c + 1} samples are too far apart, "
                f"max={round(_c_max, 2)} and min={round(_c_min, 2)}"
            )
            test_pass_stability = False
    csv_data_stability = [
        f"pressure-{tag.value}",
        "stability",
        _bool_to_pass_fail(test_pass_stability),
    ]
    print(csv_data_stability)
    ##write_cb(csv_data_stability)
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
        test_pass_accuracy = False
    else:
        test_pass_accuracy = True
    csv_data_accuracy = [
        f"pressure-{tag.value}",
        "accuracy",
        _bool_to_pass_fail(test_pass_accuracy),
    ]
    print(csv_data_accuracy)
    ##write_cb(csv_data_accuracy)
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
                test_pass_delta = False
        csv_data_delta = [
            f"pressure-{tag.value}",
            "delta",
            _bool_to_pass_fail(test_pass_delta),
        ]
        print(csv_data_delta)
        ##write_cb(csv_data_delta)
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

async def run(
    api: OT3API, report: CSVReport, section: str, pipette: Literal[200, 1000]
) -> None:
    """Run."""
    # GATHER NOMINAL POSITIONS
    #trash_nominal = get_trash_nominal()
    fixture = _connect_to_fixture()
    tip_rack_96_a1_nominal = get_tiprack_96_nominal(pipette)
    # tip_rack_partial_a1_nominal = get_tiprack_partial_nominal()
    #reservoir_a1_nominal = get_reservoir_nominal()
    reservoir_a1_actual: Optional[Point] = None

    await helpers_ot3.move_to_arched_ot3(
            api, OT3Mount.LEFT, tip_rack_96_a1_nominal + Point(z=10)
        )
    await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
    
    ui.get_user_ready("Starting to pick up")
    #await api.move_rel(OT3Mount.LEFT,Point(z=30))
    accumulate_raw_data_cb = cre_class()
    test_passed = await _fixture_check_pressure(
                api, OT3Mount.LEFT, fixture, report, accumulate_raw_data_cb
            )

    await api.drop_tip(OT3Mount.LEFT)
    input("_drop_tip")
    