"""Pipette Assembly QC Test."""
import argparse
import asyncio
from dataclasses import dataclass, fields
import os
from time import time
from typing import Optional, Callable, List, Any, Tuple
from typing_extensions import Final

from opentrons_hardware.firmware_bindings.constants import SensorType

from opentrons.config.types import CapacitivePassSettings
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing import data
from hardware_testing.drivers import list_ports_and_select
from hardware_testing.drivers.pressure_fixture import (
    PressureFixture,
    SimPressureFixture,
)
from hardware_testing.measure.pressure.config import (  # type: ignore[import]
    PRESSURE_FIXTURE_TIP_VOLUME,
    PRESSURE_FIXTURE_ASPIRATE_VOLUME,
    PRESSURE_FIXTURE_EVENT_CONFIGS as PRESSURE_CFG,
    pressure_fixture_a1_location,
    PressureEvent,
    PressureEventConfig,
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import (
    OT3Mount,
    Point,
    OT3Axis,
)

TRASH_HEIGHT_MM: Final = 45
LEAK_HOVER_ABOVE_LIQUID_MM: Final = 50

SAFE_HEIGHT_TRAVEL = 10
SAFE_HEIGHT_CALIBRATE = 10

COLUMNS = "ABCDEFGH"
PRESSURE_DATA_HEADER = ["PHASE", "CH1", "CH2", "CH3", "CH4", "CH5", "CH6", "CH7", "CH8"]

SPEED_REDUCTION_PERCENTAGE = 0.3

MULTI_CHANNEL_1_OFFSET = Point(y=9 * 7 * 0.5)

# NOTE: there is a ton of pressure data, so we want it on the bottom of the CSV
#       so here we cache these readings, and append them to the CSV in the end
PRESSURE_DATA_CACHE = []
# save final test results, to be saved and displayed at the end
FINAL_TEST_RESULTS = []


@dataclass
class TestConfig:
    """Test Configurations."""

    operator_name: str
    skip_liquid: bool
    skip_fixture: bool
    skip_diagnostics: bool
    skip_plunger: bool
    fixture_port: str
    fixture_depth: int
    fixture_side: str
    fixture_aspirate_sample_count: int
    slot_tip_rack_liquid: int
    slot_tip_rack_fixture: int
    slot_reservoir: int
    slot_fixture: int
    slot_trash: int
    num_trials: int
    droplet_wait_seconds: int
    simulate: bool


@dataclass
class LabwareLocations:
    """Test Labware Locations."""

    trash: Optional[Point]
    tip_rack_liquid: Optional[Point]
    tip_rack_fixture: Optional[Point]
    reservoir: Optional[Point]
    fixture: Optional[Point]


# start with dummy values, these will be immediately overwritten
# we start with actual values here to pass linting
IDEAL_LABWARE_LOCATIONS: LabwareLocations = LabwareLocations(
    trash=None,
    tip_rack_liquid=None,
    tip_rack_fixture=None,
    reservoir=None,
    fixture=None,
)
CALIBRATED_LABWARE_LOCATIONS: LabwareLocations = LabwareLocations(
    trash=None,
    tip_rack_liquid=None,
    tip_rack_fixture=None,
    reservoir=None,
    fixture=None,
)

# THRESHOLDS: environment sensor
TEMP_THRESH = [20, 40]
HUMIDITY_THRESH = [10, 90]

# THRESHOLDS: capacitive sensor
CAP_THRESH_OPEN_AIR = {
    1: [1.0, 8.0],
    8: [5.0, 20.0],
    96: [0.0, 10.0],
}
CAP_THRESH_PROBE = {
    1: [1.0, 10.0],
    8: [5.0, 20.0],
    96: [0.0, 20.0],
}
CAP_THRESH_SQUARE = {
    1: [0.0, 1000.0],
    8: [0.0, 1000.0],
    96: [0.0, 1000.0],
}
CAP_PROBE_DISTANCE = 50.0
CAP_PROBE_SECONDS = 5.0
CAP_PROBE_SETTINGS = CapacitivePassSettings(
    prep_distance_mm=CAP_PROBE_DISTANCE,
    max_overrun_distance_mm=0.0,
    speed_mm_per_s=CAP_PROBE_DISTANCE / CAP_PROBE_SECONDS,
    sensor_threshold_pf=1.0,
)

# THRESHOLDS: air-pressure sensor
PRESSURE_ASPIRATE_VOL = {50: 10.0, 1000: 100.0}
PRESSURE_MAX_VALUE_ABS = 7500
PRESSURE_THRESH_OPEN_AIR = [-300, 300]
PRESSURE_THRESH_SEALED = [-1000, 1000]
PRESSURE_THRESH_COMPRESS = [-PRESSURE_MAX_VALUE_ABS, PRESSURE_MAX_VALUE_ABS]


def _bool_to_pass_fail(result: bool) -> str:
    return "PASS" if result else "FAIL"


def _get_operator_answer_to_question(question: str) -> bool:
    user_inp = ""
    print("\n------------------------------------------------")
    while not user_inp or user_inp not in ["y", "n"]:
        user_inp = input(f"QUESTION: {question} (y/n): ").strip()
    print(f"ANSWER: {user_inp}")
    print("------------------------------------------------\n")
    return "y" in user_inp


def _get_tips_used_for_droplet_test(
    pipette_channels: int, num_trials: int
) -> List[str]:
    if pipette_channels == 1:
        tip_columns = COLUMNS[:num_trials]
        return [f"{c}1" for c in tip_columns]
    elif pipette_channels == 8:
        return [f"A{r + 1}" for r in range(num_trials)]
    raise RuntimeError(f"unexpected number of channels: {pipette_channels}")


def _get_ideal_labware_locations(
    test_config: TestConfig, pipette_volume: int, pipette_channels: int
) -> LabwareLocations:
    tip_rack_liquid_loc_ideal = helpers_ot3.get_theoretical_a1_position(
        test_config.slot_tip_rack_liquid,
        f"opentrons_flex_96_tiprack_{pipette_volume}ul",
    )
    tip_rack_fixture_loc_ideal = helpers_ot3.get_theoretical_a1_position(
        test_config.slot_tip_rack_fixture,
        f"opentrons_flex_96_tiprack_{PRESSURE_FIXTURE_TIP_VOLUME}ul",
    )
    reservoir_loc_ideal = helpers_ot3.get_theoretical_a1_position(
        test_config.slot_reservoir, "nest_1_reservoir_195ml"
    )
    # trash
    trash_loc_ideal = helpers_ot3.get_slot_calibration_square_position_ot3(
        test_config.slot_trash
    )
    trash_loc_ideal += Point(z=TRASH_HEIGHT_MM)
    # pressure fixture
    fixture_slot_pos = helpers_ot3.get_slot_bottom_left_position_ot3(
        test_config.slot_fixture
    )
    fixture_loc_ideal = fixture_slot_pos + pressure_fixture_a1_location(
        test_config.fixture_side
    )
    if pipette_channels == 8:
        reservoir_loc_ideal += MULTI_CHANNEL_1_OFFSET
        trash_loc_ideal += MULTI_CHANNEL_1_OFFSET
    return LabwareLocations(
        tip_rack_liquid=tip_rack_liquid_loc_ideal,
        tip_rack_fixture=tip_rack_fixture_loc_ideal,
        reservoir=reservoir_loc_ideal,
        trash=trash_loc_ideal,
        fixture=fixture_loc_ideal,
    )


def _tip_name_to_xy_offset(tip: str) -> Point:
    tip_rack_rows = ["A", "B", "C", "D", "E", "F", "G", "H"]
    tip_row = tip_rack_rows.index(tip[0])
    tip_column = int(tip[1]) - 1
    return Point(x=tip_column * 9, y=tip_row * -9)


async def _move_to_or_calibrate(
    api: OT3API, mount: OT3Mount, expected: Optional[Point], actual: Optional[Point]
) -> Point:
    current_pos = await api.gantry_position(mount)
    if not actual:
        assert expected
        safe_expected = expected + Point(z=SAFE_HEIGHT_CALIBRATE)
        safe_height = max(safe_expected.z, current_pos.z) + SAFE_HEIGHT_TRAVEL
        await helpers_ot3.move_to_arched_ot3(
            api, mount, safe_expected, safe_height=safe_height
        )
        await helpers_ot3.jog_mount_ot3(api, mount, display=False)
        actual = await api.gantry_position(mount)
    else:
        safe_height = max(actual.z, current_pos.z) + SAFE_HEIGHT_TRAVEL
        await helpers_ot3.move_to_arched_ot3(
            api, mount, actual, safe_height=safe_height
        )
    return actual


async def _pick_up_tip(
    api: OT3API,
    mount: OT3Mount,
    tip: str,
    expected: Optional[Point],
    actual: Optional[Point],
    tip_volume: Optional[float] = None,
) -> Point:
    actual = await _move_to_or_calibrate(api, mount, expected, actual)
    tip_offset = _tip_name_to_xy_offset(tip)
    tip_pos = actual + tip_offset
    await helpers_ot3.move_to_arched_ot3(
        api, mount, tip_pos, safe_height=tip_pos.z + SAFE_HEIGHT_TRAVEL
    )
    if not tip_volume:
        pip = api.hardware_pipettes[mount.to_mount()]
        assert pip
        tip_volume = pip.working_volume
    tip_length = helpers_ot3.get_default_tip_length(int(tip_volume))
    await api.pick_up_tip(mount, tip_length=tip_length)
    await api.move_rel(mount, Point(z=tip_length))
    return actual


async def _pick_up_tip_for_liquid(api: OT3API, mount: OT3Mount, tip: str) -> None:
    CALIBRATED_LABWARE_LOCATIONS.tip_rack_liquid = await _pick_up_tip(
        api,
        mount,
        tip,
        IDEAL_LABWARE_LOCATIONS.tip_rack_liquid,
        CALIBRATED_LABWARE_LOCATIONS.tip_rack_liquid,
    )


async def _pick_up_tip_for_fixture(api: OT3API, mount: OT3Mount, tip: str) -> None:
    CALIBRATED_LABWARE_LOCATIONS.tip_rack_fixture = await _pick_up_tip(
        api,
        mount,
        tip,
        IDEAL_LABWARE_LOCATIONS.tip_rack_fixture,
        CALIBRATED_LABWARE_LOCATIONS.tip_rack_fixture,
        tip_volume=PRESSURE_FIXTURE_TIP_VOLUME,
    )


async def _move_to_liquid(api: OT3API, mount: OT3Mount) -> None:
    CALIBRATED_LABWARE_LOCATIONS.reservoir = await _move_to_or_calibrate(
        api,
        mount,
        IDEAL_LABWARE_LOCATIONS.reservoir,
        CALIBRATED_LABWARE_LOCATIONS.reservoir,
    )


async def _move_to_fixture(api: OT3API, mount: OT3Mount) -> None:
    CALIBRATED_LABWARE_LOCATIONS.fixture = await _move_to_or_calibrate(
        api,
        mount,
        IDEAL_LABWARE_LOCATIONS.fixture,
        CALIBRATED_LABWARE_LOCATIONS.fixture,
    )


async def _drop_tip_in_trash(api: OT3API, mount: OT3Mount) -> None:
    # assume the ideal is accurate enough
    ideal = IDEAL_LABWARE_LOCATIONS.trash
    assert ideal
    current_pos = await api.gantry_position(mount)
    safe_height = max(ideal.z, current_pos.z) + SAFE_HEIGHT_TRAVEL
    await helpers_ot3.move_to_arched_ot3(api, mount, ideal, safe_height=safe_height)
    await api.drop_tip(mount, home_after=False)


async def _aspirate_and_look_for_droplets(
    api: OT3API, mount: OT3Mount, wait_time: int
) -> bool:
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip
    pipette_volume = pip.working_volume
    print(f"aspirating {pipette_volume} microliters")
    await api.aspirate(mount, pipette_volume)
    await api.move_rel(mount, Point(z=LEAK_HOVER_ABOVE_LIQUID_MM))
    for t in range(wait_time):
        print(f"waiting for leaking tips ({t + 1}/{wait_time})")
        if not api.is_simulator:
            await asyncio.sleep(1)
    if api.is_simulator:
        leak_test_passed = True
    else:
        leak_test_passed = _get_operator_answer_to_question("did it pass? no leaking?")
    print("dispensing back into reservoir")
    await api.move_rel(mount, Point(z=-LEAK_HOVER_ABOVE_LIQUID_MM))
    await api.dispense(mount, pipette_volume)
    await api.blow_out(mount)
    return leak_test_passed


def _connect_to_fixture(test_config: TestConfig) -> PressureFixture:
    if not test_config.simulate and not test_config.skip_fixture:
        if not test_config.fixture_port:
            _port = list_ports_and_select("pressure-fixture")
        else:
            _port = ""
        fixture = PressureFixture.create(port=_port, slot_side=test_config.fixture_side)
    else:
        fixture = SimPressureFixture()  # type: ignore[assignment]
    fixture.connect()
    return fixture


async def _read_pressure_and_check_results(
    api: OT3API,
    fixture: PressureFixture,
    tag: PressureEvent,
    write_cb: Callable,
    accumulate_raw_data_cb: Callable,
    channels: int = 1,
) -> bool:
    pressure_event_config: PressureEventConfig = PRESSURE_CFG[tag]
    if not api.is_simulator:
        await asyncio.sleep(pressure_event_config.stability_delay)
    _samples = []
    for i in range(pressure_event_config.sample_count):
        _samples.append(fixture.read_all_pressure_channel())
        next_sample_time = time() + pressure_event_config.sample_delay
        _sample_as_strings = [str(round(p, 2)) for p in _samples[-1]]
        csv_data_sample = [tag.value] + _sample_as_strings
        print(f"{i + 1}/{pressure_event_config.sample_count}: {csv_data_sample}")
        accumulate_raw_data_cb(csv_data_sample)
        delay_time = next_sample_time - time()
        if (
            not api.is_simulator
            and i < pressure_event_config.sample_count - 1
            and delay_time > 0
        ):
            await asyncio.sleep(pressure_event_config.sample_delay)
    _samples_channel_1 = [s[c] for s in _samples for c in range(channels)]
    _samples_channel_1.sort()
    _samples_clipped = _samples_channel_1[1:-1]
    _samples_min = min(_samples_clipped)
    _samples_max = max(_samples_clipped)
    if _samples_max - _samples_min > pressure_event_config.stability_threshold:
        test_pass_stability = False
    else:
        test_pass_stability = True
    csv_data_stability = [
        tag.value,
        "stability",
        _bool_to_pass_fail(test_pass_stability),
    ]
    print(csv_data_stability)
    write_cb(csv_data_stability)
    if (
        _samples_min < pressure_event_config.min
        or _samples_max > pressure_event_config.max
    ):
        test_pass_accuracy = False
    else:
        test_pass_accuracy = True
    csv_data_accuracy = [
        tag.value,
        "accuracy",
        _bool_to_pass_fail(test_pass_accuracy),
    ]
    print(csv_data_accuracy)
    write_cb(csv_data_accuracy)
    return test_pass_stability and test_pass_accuracy


async def _fixture_check_pressure(
    api: OT3API,
    mount: OT3Mount,
    test_config: TestConfig,
    fixture: PressureFixture,
    write_cb: Callable,
    accumulate_raw_data_cb: Callable,
) -> bool:
    results = []
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip
    pip_vol = int(pip.working_volume)
    pip_channels = int(pip.channels.value)
    # above the fixture
    r = await _read_pressure_and_check_results(
        api, fixture, PressureEvent.PRE, write_cb, accumulate_raw_data_cb, pip_channels
    )
    results.append(r)
    # insert into the fixture
    await api.move_rel(mount, Point(z=-test_config.fixture_depth))
    r = await _read_pressure_and_check_results(
        api,
        fixture,
        PressureEvent.INSERT,
        write_cb,
        accumulate_raw_data_cb,
        pip_channels,
    )
    results.append(r)
    # aspirate 50uL
    await api.aspirate(mount, PRESSURE_FIXTURE_ASPIRATE_VOLUME[pip_vol])
    if pip_vol == 50:
        asp_evt = PressureEvent.ASPIRATE_P50
    else:
        asp_evt = PressureEvent.ASPIRATE_P1000
    r = await _read_pressure_and_check_results(
        api, fixture, asp_evt, write_cb, accumulate_raw_data_cb, pip_channels
    )
    results.append(r)
    # dispense
    await api.dispense(mount, PRESSURE_FIXTURE_ASPIRATE_VOLUME[pip_vol])
    r = await _read_pressure_and_check_results(
        api,
        fixture,
        PressureEvent.DISPENSE,
        write_cb,
        accumulate_raw_data_cb,
        pip_channels,
    )
    results.append(r)
    # retract out of fixture
    await api.move_rel(mount, Point(z=test_config.fixture_depth))
    r = await _read_pressure_and_check_results(
        api, fixture, PressureEvent.POST, write_cb, accumulate_raw_data_cb, pip_channels
    )
    results.append(r)
    return False not in results


async def _test_for_leak(
    api: OT3API,
    mount: OT3Mount,
    test_config: TestConfig,
    tip: str,
    fixture: Optional[PressureFixture],
    write_cb: Optional[Callable],
    accumulate_raw_data_cb: Optional[Callable],
    droplet_wait_seconds: Optional[int] = None,
) -> bool:
    if fixture:
        await _pick_up_tip_for_fixture(api, mount, tip)
        assert write_cb, "pressure fixture requires recording data to disk"
        assert (
            accumulate_raw_data_cb
        ), "pressure fixture requires recording data to disk"
        await _move_to_fixture(api, mount)
        test_passed = await _fixture_check_pressure(
            api, mount, test_config, fixture, write_cb, accumulate_raw_data_cb
        )
    else:
        assert droplet_wait_seconds is not None
        await _pick_up_tip_for_liquid(api, mount, tip)
        await _move_to_liquid(api, mount)
        test_passed = await _aspirate_and_look_for_droplets(
            api, mount, droplet_wait_seconds
        )
    await _drop_tip_in_trash(api, mount)
    pass_msg = _bool_to_pass_fail(test_passed)
    print(f"tip {tip}: {pass_msg}")
    return test_passed


async def _test_for_leak_by_eye(
    api: OT3API,
    mount: OT3Mount,
    test_config: TestConfig,
    tip: str,
    droplet_wait_time: int,
) -> bool:
    return await _test_for_leak(
        api, mount, test_config, tip, None, None, None, droplet_wait_time
    )


async def _read_pipette_sensor_repeatedly_and_average(
    api: OT3API, mount: OT3Mount, sensor_type: SensorType, num_readings: int
) -> float:
    # FIXME: this while loop is required b/c the command does not always
    #        return a value, not sure what's the source of this issue
    readings: List[float] = []
    while len(readings) < num_readings:
        try:
            if sensor_type == SensorType.capacitive:
                r = await helpers_ot3.get_capacitance_ot3(api, mount)
            elif sensor_type == SensorType.pressure:
                r = await helpers_ot3.get_pressure_ot3(api, mount)
            elif sensor_type == SensorType.temperature:
                res = await helpers_ot3.get_temperature_humidity_ot3(api, mount)
                r = res[0]
            elif sensor_type == SensorType.humidity:
                res = await helpers_ot3.get_temperature_humidity_ot3(api, mount)
                r = res[1]
            else:
                raise ValueError(f"unexpected sensor type: {sensor_type}")
        except helpers_ot3.SensorResponseBad:
            return -999999999999.0
        readings.append(r)
    readings.sort()
    readings = readings[1:-1]
    return sum(readings) / len(readings)


async def _test_diagnostics_environment(
    api: OT3API, mount: OT3Mount, write_cb: Callable
) -> bool:
    print("testing environmental sensor")
    celsius_pass = True
    humidity_pass = True

    # ROOM
    if not api.is_simulator:

        def _get_float_from_user(msg: str) -> float:
            try:
                return float(input(msg))
            except ValueError:
                return _get_room_celsius()

        def _get_room_celsius() -> float:
            return _get_float_from_user(
                'Enter the ROOM temperature (Celsius) (example: "23.2"): '
            )

        def _get_room_humidity() -> float:
            return _get_float_from_user(
                'Enter the ROOM humidity (%) (example: "54.0"): '
            )

        room_celsius = _get_room_celsius()
        room_humidity = _get_room_humidity()
    else:
        room_celsius = 25.0
        room_humidity = 50.0

    # CELSIUS
    celsius = await _read_pipette_sensor_repeatedly_and_average(
        api, mount, SensorType.temperature, 10
    )
    print(f"celsius: {celsius} C")
    if celsius < TEMP_THRESH[0] or celsius > TEMP_THRESH[1]:
        print(f"FAIL: celsius {celsius} is out of range")
        celsius_pass = False
    write_cb(["celsius", room_celsius, celsius, _bool_to_pass_fail(celsius_pass)])

    # HUMIDITY
    humidity = await _read_pipette_sensor_repeatedly_and_average(
        api, mount, SensorType.humidity, 10
    )
    print(f"humidity: {humidity} C")
    if humidity < HUMIDITY_THRESH[0] or humidity > HUMIDITY_THRESH[1]:
        print(f"FAIL: humidity {humidity} is out of range")
        humidity_pass = False
    write_cb(["humidity", room_humidity, humidity, _bool_to_pass_fail(humidity_pass)])

    return celsius_pass and humidity_pass


async def _test_diagnostics_encoder(
    api: OT3API, mount: OT3Mount, write_cb: Callable
) -> bool:
    print("testing encoder")
    pip_axis = OT3Axis.of_main_tool_actuator(mount)
    encoder_home_pass = True
    encoder_move_pass = True
    encoder_stall_pass = True
    _, _, _, drop_tip = helpers_ot3.get_plunger_positions_ot3(api, mount)

    async def _get_plunger_pos_and_encoder() -> Tuple[float, float]:
        _pos = await api.current_position_ot3(mount)
        _enc = await api.encoder_current_position_ot3(mount)
        return _pos[pip_axis], _enc[pip_axis]

    print("homing plunger")
    await api.home([pip_axis])
    pip_pos, pip_enc = await _get_plunger_pos_and_encoder()
    if pip_pos != 0.0 or abs(pip_enc) > 0.01:
        print(
            f"FAIL: plunger ({pip_pos}) or encoder ({pip_enc}) is not 0.0 after homing"
        )
        encoder_home_pass = False
    write_cb(["encoder-home", pip_pos, pip_enc, _bool_to_pass_fail(encoder_home_pass)])

    print("moving plunger")
    await helpers_ot3.move_plunger_absolute_ot3(api, mount, drop_tip)
    pip_pos, pip_enc = await _get_plunger_pos_and_encoder()
    if abs(pip_pos - pip_enc) > 0.1:
        print(f"FAIL: plunger ({pip_pos}) and encoder ({pip_enc}) are too different")
        encoder_move_pass = False
    write_cb(["encoder-move", pip_pos, pip_enc, _bool_to_pass_fail(encoder_move_pass)])

    print("homing plunger")
    await api.home([pip_axis])
    return encoder_home_pass and encoder_move_pass and encoder_stall_pass


async def _test_diagnostics_capacitive(
    api: OT3API, mount: OT3Mount, write_cb: Callable
) -> bool:
    print("testing capacitance")
    capacitive_open_air_pass = True
    capacitive_probe_attached_pass = True
    capacitive_square_pass = True
    capacitive_probing_pass = True
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip

    async def _read_cap() -> float:
        return await _read_pipette_sensor_repeatedly_and_average(
            api, mount, SensorType.capacitive, 10
        )

    capacitance_open_air = await _read_cap()
    print(f"open-air capacitance: {capacitance_open_air}")
    if (
        capacitance_open_air < CAP_THRESH_OPEN_AIR[pip.channels.value][0]
        or capacitance_open_air > CAP_THRESH_OPEN_AIR[pip.channels.value][1]
    ):
        capacitive_open_air_pass = False
        print(f"FAIL: open-air capacitance ({capacitance_open_air}) is not correct")
    write_cb(
        [
            "capacitive-open-air",
            capacitance_open_air,
            _bool_to_pass_fail(capacitive_open_air_pass),
        ]
    )

    if not api.is_simulator:
        _get_operator_answer_to_question('ATTACH the probe, enter "y" when attached')
    capacitance_with_probe = await _read_cap()
    print(f"probe capacitance: {capacitance_with_probe}")
    if (
        capacitance_with_probe < CAP_THRESH_PROBE[pip.channels.value][0]
        or capacitance_with_probe > CAP_THRESH_PROBE[pip.channels.value][1]
    ):
        capacitive_probe_attached_pass = False
        print(f"FAIL: probe capacitance ({capacitance_with_probe}) is not correct")
    write_cb(
        [
            "capacitive-probe",
            capacitance_with_probe,
            _bool_to_pass_fail(capacitive_probe_attached_pass),
        ]
    )

    if not api.is_simulator:
        _get_operator_answer_to_question(
            'touch a SQUARE to the probe, enter "y" when touching'
        )
    capacitance_with_square = await _read_cap()
    print(f"square capacitance: {capacitance_with_square}")
    if (
        capacitance_with_square < CAP_THRESH_SQUARE[pip.channels.value][0]
        or capacitance_with_square > CAP_THRESH_SQUARE[pip.channels.value][1]
    ):
        capacitive_square_pass = False
        print(f"FAIL: square capacitance ({capacitance_with_square}) is not correct")
    write_cb(
        [
            "capacitive-square",
            capacitance_with_square,
            _bool_to_pass_fail(capacitive_square_pass),
        ]
    )

    print("probing downwards by 50 mm")
    if not api.is_simulator:
        _get_operator_answer_to_question("ready to touch the probe when it moves down?")
    current_pos = await api.gantry_position(mount)
    probe_target = current_pos.z - CAP_PROBE_SETTINGS.prep_distance_mm
    probe_axis = OT3Axis.by_mount(mount)
    trigger_pos = await api.capacitive_probe(
        mount, probe_axis, probe_target, CAP_PROBE_SETTINGS
    )
    if trigger_pos <= probe_target + 1:
        capacitive_probing_pass = False
        print("FAIL: probe was not triggered while moving downwards")
    write_cb(
        ["capacitive-probing", trigger_pos, _bool_to_pass_fail(capacitive_probing_pass)]
    )

    if not api.is_simulator:
        _get_operator_answer_to_question('REMOVE the probe, enter "y" when removed')
    return (
        capacitive_open_air_pass
        and capacitive_probe_attached_pass
        and capacitive_probing_pass
    )


async def _test_diagnostics_pressure(
    api: OT3API, mount: OT3Mount, write_cb: Callable
) -> bool:
    await api.add_tip(mount, 0.1)
    await api.prepare_for_aspirate(mount)

    async def _read_pressure() -> float:
        return await _read_pipette_sensor_repeatedly_and_average(
            api, mount, SensorType.pressure, 10
        )

    print("testing pressure")
    pressure_open_air_pass = True
    pressure_open_air = await _read_pressure()
    print(f"pressure-open-air: {pressure_open_air}")
    if (
        pressure_open_air < PRESSURE_THRESH_OPEN_AIR[0]
        or pressure_open_air > PRESSURE_THRESH_OPEN_AIR[1]
    ):
        pressure_open_air_pass = False
        print(f"FAIL: open-air pressure ({pressure_open_air}) is not correct")
    write_cb(
        [
            "pressure-open-air",
            pressure_open_air,
            _bool_to_pass_fail(pressure_open_air_pass),
        ]
    )

    _, bottom, _, _ = helpers_ot3.get_plunger_positions_ot3(api, mount)
    print("moving plunger to bottom")
    await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom)
    if not api.is_simulator:
        _get_operator_answer_to_question('ATTACH tip to nozzle, enter "y" when ready')
    if not api.is_simulator:
        _get_operator_answer_to_question('COVER tip with finger, enter "y" when ready')
    pressure_sealed = await _read_pressure()
    pressure_sealed_pass = True
    print(f"pressure-sealed: {pressure_sealed}")
    if (
        pressure_sealed < PRESSURE_THRESH_SEALED[0]
        or pressure_sealed > PRESSURE_THRESH_SEALED[1]
    ):
        pressure_sealed_pass = False
        print(f"FAIL: sealed pressure ({pressure_sealed}) is not correct")
    write_cb(
        ["pressure-sealed", pressure_sealed, _bool_to_pass_fail(pressure_sealed_pass)]
    )
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip
    pip_vol = int(pip.working_volume)
    plunger_aspirate_ul = PRESSURE_ASPIRATE_VOL[pip_vol]
    print(f"aspirate {plunger_aspirate_ul} ul")
    await api.aspirate(mount, plunger_aspirate_ul)
    pressure_compress = await _read_pressure()
    print(f"pressure-compressed: {pressure_compress}")
    pressure_compress_pass = True
    if (
        pressure_compress < PRESSURE_THRESH_COMPRESS[0]
        or pressure_compress > PRESSURE_THRESH_COMPRESS[1]
    ):
        pressure_compress_pass = False
        print(f"FAIL: sealed pressure ({pressure_compress}) is not correct")
    write_cb(
        [
            "pressure-compressed",
            pressure_compress,
            _bool_to_pass_fail(pressure_compress_pass),
        ]
    )

    if not api.is_simulator:
        _get_operator_answer_to_question('REMOVE tip to nozzle, enter "y" when ready')
    print("moving plunger back down to BOTTOM position")
    await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom)
    await api.remove_tip(mount)
    return pressure_open_air_pass and pressure_sealed_pass and pressure_compress_pass


async def _test_diagnostics(api: OT3API, mount: OT3Mount, write_cb: Callable) -> bool:
    # ENVIRONMENT SENSOR
    environment_pass = await _test_diagnostics_environment(api, mount, write_cb)
    print(f"environment: {_bool_to_pass_fail(environment_pass)}")
    write_cb(["diagnostics-environment", _bool_to_pass_fail(environment_pass)])
    # PRESSURE
    pressure_pass = await _test_diagnostics_pressure(api, mount, write_cb)
    print(f"pressure: {_bool_to_pass_fail(pressure_pass)}")
    write_cb(["diagnostics-pressure", _bool_to_pass_fail(pressure_pass)])
    # ENCODER
    encoder_pass = await _test_diagnostics_encoder(api, mount, write_cb)
    print(f"encoder: {_bool_to_pass_fail(encoder_pass)}")
    write_cb(["diagnostics-encoder", _bool_to_pass_fail(encoder_pass)])
    # CAPACITIVE SENSOR
    capacitance_pass = await _test_diagnostics_capacitive(api, mount, write_cb)
    print(f"capacitance: {_bool_to_pass_fail(capacitance_pass)}")
    write_cb(["diagnostics-capacitance", _bool_to_pass_fail(capacitance_pass)])
    return environment_pass and pressure_pass and encoder_pass and capacitance_pass


async def _test_plunger_positions(
    api: OT3API, mount: OT3Mount, write_cb: Callable
) -> bool:
    print("homing Z axis")
    await api.home([OT3Axis.by_mount(mount)])
    print("homing the plunger")
    await api.home([OT3Axis.of_main_tool_actuator(mount)])
    _, bottom, blow_out, drop_tip = helpers_ot3.get_plunger_positions_ot3(api, mount)
    print("moving plunger to BLOW-OUT")
    await helpers_ot3.move_plunger_absolute_ot3(api, mount, blow_out)
    if api.is_simulator:
        blow_out_passed = True
    else:
        blow_out_passed = _get_operator_answer_to_question("is BLOW-OUT correct?")
    write_cb(["plunger-blow-out", _bool_to_pass_fail(blow_out_passed)])
    print("moving plunger to DROP-TIP")
    await helpers_ot3.move_plunger_absolute_ot3(api, mount, drop_tip)
    if api.is_simulator:
        drop_tip_passed = True
    else:
        drop_tip_passed = _get_operator_answer_to_question("is DROP-TIP correct?")
    write_cb(["plunger-blow-out", _bool_to_pass_fail(blow_out_passed)])
    print("homing the plunger")
    await api.home([OT3Axis.of_main_tool_actuator(mount)])
    return blow_out_passed and drop_tip_passed


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


def _create_csv_and_get_callbacks(
    pipette_sn: str,
) -> Tuple[CSVProperties, CSVCallbacks]:
    run_id = data.create_run_id()
    test_name = data.create_test_name_from_file(__file__)
    folder_path = data.create_folder_for_test_data(test_name)
    file_name = data.create_file_name(test_name, run_id, pipette_sn)
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


async def _main(test_config: TestConfig) -> None:
    global IDEAL_LABWARE_LOCATIONS
    global CALIBRATED_LABWARE_LOCATIONS
    global FINAL_TEST_RESULTS
    global PRESSURE_DATA_CACHE

    # connect to the pressure fixture (or simulate one)
    fixture = _connect_to_fixture(test_config)

    # create API instance, and get Pipette serial number
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=test_config.simulate,
        pipette_left="p1000_single_v3.4",
        pipette_right="p1000_multi_v3.4",
    )
    pips = {OT3Mount.from_mount(m): p for m, p in api.hardware_pipettes.items() if p}
    assert pips, "no pipettes attached"
    for mount, pipette in pips.items():
        pipette_sn = helpers_ot3.get_pipette_serial_ot3(pipette)
        print(f"Pipette: {pipette_sn} on the {mount.name} mount")
        if not api.is_simulator and not _get_operator_answer_to_question(
            "qc this pipette?"
        ):
            continue

        # setup our labware locations
        pipette_volume = int(pipette.working_volume)
        pipette_channels = int(pipette.channels.as_int)
        IDEAL_LABWARE_LOCATIONS = _get_ideal_labware_locations(
            test_config, pipette_volume, pipette_channels
        )
        CALIBRATED_LABWARE_LOCATIONS = LabwareLocations(
            trash=None,
            tip_rack_liquid=None,
            tip_rack_fixture=None,
            reservoir=None,
            fixture=None,
        )

        # callback function for writing new data to CSV file
        FINAL_TEST_RESULTS = []
        PRESSURE_DATA_CACHE = []
        csv_props, csv_cb = _create_csv_and_get_callbacks(pipette_sn)
        # cache the pressure-data header
        csv_cb.pressure(PRESSURE_DATA_HEADER, first_row_value="")

        # add metadata to CSV
        # FIXME: create a set of CSV helpers, such that you can define a test-report
        #        schema/format/line-length/etc., before having to fill its contents.
        #        This would be very helpful, because changes to CVS length/contents
        #        will break the analysis done in our Sheets
        csv_cb.write(["--------"])
        csv_cb.write(["METADATA"])
        csv_cb.write(["test-name", csv_props.name])
        csv_cb.write(["operator-name", test_config.operator_name])
        csv_cb.write(["date", csv_props.id])  # run-id includes a date/time string
        csv_cb.write(["pipette", pipette_sn])
        csv_cb.write(["simulating" if test_config.simulate else "live"])
        # add test configurations to CSV
        csv_cb.write(["-------------------"])
        csv_cb.write(["TEST-CONFIGURATIONS"])
        for f in fields(test_config):
            csv_cb.write([f.name, getattr(test_config, f.name)])
        csv_cb.write(["-------------------"])
        csv_cb.write(["TEST-THRESHOLDS"])
        csv_cb.write(["temperature"] + [str(t) for t in TEMP_THRESH])
        csv_cb.write(["humidity"] + [str(t) for t in HUMIDITY_THRESH])
        csv_cb.write(
            ["capacitive-open-air"]
            + [str(t) for t in CAP_THRESH_OPEN_AIR[pipette_channels]]
        )
        csv_cb.write(
            ["capacitive-probe"] + [str(t) for t in CAP_THRESH_PROBE[pipette_channels]]
        )
        csv_cb.write(
            ["capacitive-square"]
            + [str(t) for t in CAP_THRESH_SQUARE[pipette_channels]]
        )
        csv_cb.write(
            ["pressure-microliters-aspirated", PRESSURE_ASPIRATE_VOL[pipette_volume]]
        )
        csv_cb.write(["pressure-open-air"] + [str(t) for t in PRESSURE_THRESH_OPEN_AIR])
        csv_cb.write(["pressure-sealed"] + [str(t) for t in PRESSURE_THRESH_SEALED])
        csv_cb.write(
            ["pressure-compressed"] + [str(t) for t in PRESSURE_THRESH_COMPRESS]
        )
        # add pressure thresholds to CSV
        csv_cb.write(["-----------------------"])
        csv_cb.write(["PRESSURE-CONFIGURATIONS"])
        for t, config in PRESSURE_CFG.items():
            for f in fields(config):
                csv_cb.write([t.value, f.name, getattr(config, f.name)])

        tips_used = _get_tips_used_for_droplet_test(
            pipette_channels, test_config.num_trials
        )

        # run the test
        csv_cb.write(["----"])
        csv_cb.write(["TEST"])
        print("homing")
        await api.home()

        if not test_config.skip_plunger or not test_config.skip_diagnostics:
            print("moving over slot 3")
            pos_slot_2 = helpers_ot3.get_slot_calibration_square_position_ot3(3)
            current_pos = await api.gantry_position(mount)
            hover_over_slot_2 = pos_slot_2._replace(z=current_pos.z)
            await api.move_to(mount, hover_over_slot_2)
            if not test_config.skip_diagnostics:
                test_passed = await _test_diagnostics(api, mount, csv_cb.write)
                csv_cb.results("diagnostics", test_passed)
            if not test_config.skip_plunger:
                test_passed = await _test_plunger_positions(api, mount, csv_cb.write)
                csv_cb.results("plunger", test_passed)

        if not test_config.skip_liquid:
            for i, tip in enumerate(tips_used):
                droplet_wait_seconds = test_config.droplet_wait_seconds * (i + 1)
                test_passed = await _test_for_leak_by_eye(
                    api, mount, test_config, tip, droplet_wait_seconds
                )
                csv_cb.results("droplets", test_passed)

        if not test_config.skip_fixture:
            test_passed = await _test_for_leak(
                api,
                mount,
                test_config,
                "A1",
                fixture=fixture,
                write_cb=csv_cb.write,
                accumulate_raw_data_cb=csv_cb.pressure,
            )
            csv_cb.results("pressure", test_passed)

        print("test complete")
        csv_cb.write(["-------------"])
        csv_cb.write(["PRESSURE-DATA"])
        for press_data in PRESSURE_DATA_CACHE:
            csv_cb.write(press_data, first_row_value_included=True)

        # put the top-line results at the top of the CSV file
        # so here we cache each data line, then add them to the top
        # of the file in reverse order
        _results_csv_lines = list()
        # add extra entries of black cells to the top of the CSV
        # to help operators when the copy/paste
        _results_csv_lines.append(
            ["-------"] + ["---" for _ in range(len(PRESSURE_DATA_HEADER) - 1)]
        )
        _results_csv_lines.append(["RESULTS"])
        print("final test results:")
        for result in FINAL_TEST_RESULTS:
            _results_csv_lines.append(result)
            print(" - " + "\t".join(result))
        _results_csv_lines.reverse()
        for r in _results_csv_lines:
            csv_cb.write(r, line_number=0, first_row_value="0.0")

        # print the filepath again, to help debugging
        print(f"CSV: {csv_props.name}")
        print("homing")
        await api.home()
        # disengage x,y for replace the new pipette
        await api.disengage_axes([OT3Axis.X, OT3Axis.Y])
    print("done")


if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser(description="OT-3 Pipette Assembly QC Test")
    arg_parser.add_argument("--operator", type=str, required=True)
    arg_parser.add_argument("--skip-liquid", action="store_true")
    arg_parser.add_argument("--skip-fixture", action="store_true")
    arg_parser.add_argument("--skip-diagnostics", action="store_true")
    arg_parser.add_argument("--skip-plunger", action="store_true")
    arg_parser.add_argument("--fixture-side", choices=["left", "right"], default="left")
    arg_parser.add_argument("--port", type=str, default="")
    arg_parser.add_argument("--num-trials", type=int, default=2)
    arg_parser.add_argument(
        "--aspirate-sample-count",
        type=int,
        default=PRESSURE_CFG[PressureEvent.ASPIRATE_P50].sample_count,
    )
    arg_parser.add_argument("--wait", type=int, default=30)
    arg_parser.add_argument("--slot-tip-rack-liquid", type=int, default=7)
    arg_parser.add_argument("--slot-tip-rack-fixture", type=int, default=1)
    arg_parser.add_argument("--slot-reservoir", type=int, default=8)
    arg_parser.add_argument("--slot-fixture", type=int, default=2)
    arg_parser.add_argument("--slot-trash", type=int, default=12)
    arg_parser.add_argument("--insert-depth", type=int, default=14)
    arg_parser.add_argument("--simulate", action="store_true")
    args = arg_parser.parse_args()
    _cfg = TestConfig(
        operator_name=args.operator,
        skip_liquid=args.skip_liquid,
        skip_fixture=args.skip_fixture,
        skip_diagnostics=args.skip_diagnostics,
        skip_plunger=args.skip_plunger,
        fixture_port=args.port,
        fixture_depth=args.insert_depth,
        fixture_side=args.fixture_side,
        fixture_aspirate_sample_count=args.aspirate_sample_count,
        slot_tip_rack_liquid=args.slot_tip_rack_liquid,
        slot_tip_rack_fixture=args.slot_tip_rack_fixture,
        slot_reservoir=args.slot_reservoir,
        slot_fixture=args.slot_fixture,
        slot_trash=args.slot_trash,
        num_trials=args.num_trials,
        droplet_wait_seconds=args.wait,
        simulate=args.simulate,
    )
    # NOTE: overwrite default aspirate sample-count from user's input
    # FIXME: this value is being set in a few places, maybe there's a way to clean this up
    for tag in [PressureEvent.ASPIRATE_P50, PressureEvent.ASPIRATE_P1000]:
        PRESSURE_CFG[tag].sample_count = _cfg.fixture_aspirate_sample_count
    asyncio.run(_main(_cfg))
