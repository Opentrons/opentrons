"""Test Capacitance."""
from asyncio import sleep
from typing import List, Union, Tuple

from opentrons_hardware.hardware_control.tool_sensors import capacitive_probe
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.sensors import sensor_driver, sensor_types

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3utils import sensor_id_for_instrument
from opentrons.hardware_control.types import InstrumentProbeType


from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Axis, OT3Mount, Point


TEST_SLOT = 5
PROBE_PREP_HEIGHT_MM = 5
PROBE_MAX_OVERRUN = 5
PROBE_POS_OFFSET = Point(13, 13, 0)

PROBE_READINGS = ["air-pf", "attached-pf", "deck-pf", "deck-mm"]


def _get_test_tag(probe: InstrumentProbeType, reading: str) -> str:
    assert reading in PROBE_READINGS, f"{reading} not in PROBE_READINGS"
    return f"{probe.name.lower()}-{reading}"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for p in InstrumentProbeType:
        for r in PROBE_READINGS:
            tag = _get_test_tag(p, r)
            lines.append(CSVLine(tag, [float, CSVResult]))
    return lines


async def read_once(
    api: OT3API,
    driver: sensor_driver.SensorDriver,
    sensor: sensor_types.CapacitiveSensor,
    timeout: int = 1,
) -> float:
    if not api.is_simulator and isinstance(api._backend, OT3Controller):
        data = await driver.read(
            api._backend._messenger, sensor, offset=False, timeout=timeout
        )
        if isinstance(data, sensor_types.SensorDataType):
            return data.to_float()
        raise helpers_ot3.SensorResponseBad("no response from sensor")
    return 0.0


async def _read_from_sensor(
    api: OT3API,
    driver: sensor_driver.SensorDriver,
    sensor: sensor_types.CapacitiveSensor,
    num_readings: int = 10,
) -> float:
    readings: List[float] = []
    sequential_failures = 0
    while len(readings) != num_readings:
        try:
            r = await read_once(api, driver, sensor)
            sequential_failures = 0
            readings.append(r)
            print(f"\t{r}")
            if not api.is_simulator:
                await sleep(0.2)
        except helpers_ot3.SensorResponseBad as e:
            sequential_failures += 1
            if sequential_failures == 3:
                raise e
            else:
                continue
    return sum(readings) / num_readings


def _get_hover_and_probe_pos(
    api: OT3API, probe: InstrumentProbeType
) -> Tuple[Point, Point]:
    # FIXME: remove this once OT3API supports probing with secondary/front channels
    probe_pos = helpers_ot3.get_slot_calibration_square_position_ot3(TEST_SLOT)
    probe_pos += PROBE_POS_OFFSET
    hover_pos = probe_pos._replace(z=api.get_instrument_max_height(OT3Mount.LEFT))
    if probe == InstrumentProbeType.SECONDARY:
        probe_offset = Point(x=9 * -11, y=9 * 7)
    else:
        probe_offset = Point()
    return hover_pos + probe_offset, probe_pos + probe_offset


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    z_ax = OT3Axis.Z_L
    p_ax = OT3Axis.P_L
    t_ax = OT3Axis.Q

    s_driver = sensor_driver.SensorDriver()
    default_probe_cfg = api.config.calibration.z_offset.pass_settings
    await api.reset_instrument_offset(OT3Mount.LEFT)

    for probe in InstrumentProbeType:
        hover_pos, probe_pos = _get_hover_and_probe_pos(api, probe)
        sensor_id = sensor_id_for_instrument(probe)
        ui.print_header(f"Probe: {probe}")
        cap_sensor = sensor_types.CapacitiveSensor.build(sensor_id, NodeId.pipette_left)
        print("homing...")
        await api.home([z_ax, p_ax, t_ax])

        # AIR-pF
        air_pf = 0.0
        if not api.is_simulator:
            try:
                air_pf = await _read_from_sensor(api, s_driver, cap_sensor, 10)
            except helpers_ot3.SensorResponseBad:
                ui.print_error(f"{probe} cap sensor not working, skipping")
                continue
        print(f"air-pf: {air_pf}")
        # FIXME: create stricter pass/fail criteria
        report(section, _get_test_tag(probe, "air-pf"), [air_pf, CSVResult.PASS])

        # ATTACHED-pF
        if not api.is_simulator:
            ui.get_user_ready(f"ATTACH probe to {probe.name} channel")
        await api.add_tip(OT3Mount.LEFT, api.config.calibration.probe_length)
        attached_pf = 0.0
        if not api.is_simulator:
            try:
                attached_pf = await _read_from_sensor(api, s_driver, cap_sensor, 10)
            except helpers_ot3.SensorResponseBad:
                ui.print_error(f"{probe} cap sensor not working, skipping")
                continue
        print(f"attached-pf: {attached_pf}")
        # FIXME: create stricter pass/fail criteria
        report(
            section, _get_test_tag(probe, "attached-pf"), [attached_pf, CSVResult.PASS]
        )

        # DECK-mm
        async def _probe(distance: float, speed: float) -> float:
            if api.is_simulator:
                return 0.0
            pos, _ = await capacitive_probe(
                api._backend._messenger,  # type: ignore[union-attr]
                NodeId.pipette_left,
                NodeId.head_l,
                distance=distance,
                speed=speed,
                sensor_id=sensor_id,
                relative_threshold_pf=default_probe_cfg.sensor_threshold_pf,
            )
            return pos

        if not api.is_simulator:
            ui.get_user_ready("about to probe the DECK")
        # move to 5 mm above the deck
        await api.home_z(OT3Mount.LEFT)
        current_pos = await api.gantry_position(OT3Mount.LEFT)
        await api.move_to(OT3Mount.LEFT, probe_pos._replace(z=current_pos.z))
        await api.move_to(OT3Mount.LEFT, probe_pos._replace(z=PROBE_PREP_HEIGHT_MM))
        z_ax = OT3Axis.by_mount(OT3Mount.LEFT)
        # NOTE: currently there's an issue where the 1st time an instrument
        #       probes, it won't trigger when contacting the deck. However all
        #       following probes work fine. So, here we do a "fake" probe
        #       in case this instrument was just turned on
        await _probe(distance=0.5, speed=5)
        await _probe(distance=-0.5, speed=5)
        await _probe(
            distance=PROBE_MAX_OVERRUN + PROBE_PREP_HEIGHT_MM,
            speed=default_probe_cfg.speed_mm_per_s,
        )
        await api.refresh_positions()
        found_pos = await api.gantry_position(OT3Mount.LEFT)
        deck_mm = found_pos.z
        pass_threshold = (PROBE_MAX_OVERRUN - 0.001) * -1.0
        deck_mm_is_valid = deck_mm >= pass_threshold
        print(f"deck-mm: {deck_mm} ({deck_mm_is_valid})")
        report(
            section,
            _get_test_tag(probe, "deck-mm"),
            [deck_mm, CSVResult.from_bool(deck_mm_is_valid)],
        )

        # DECK-pF
        deck_pf = 0.0
        if deck_mm_is_valid:
            if not api.is_simulator:
                ui.get_user_ready("about to PRESS into the DECK")
            await api.move_to(OT3Mount.LEFT, probe_pos._replace(z=deck_mm))
            if not api.is_simulator:
                try:
                    deck_pf = await _read_from_sensor(api, s_driver, cap_sensor, 10)
                except helpers_ot3.SensorResponseBad:
                    ui.print_error(f"{probe} cap sensor not working, skipping")
                    continue
            print(f"deck-pf: {deck_pf}")
        else:
            print("skipping deck-pf")
        # FIXME: create stricter pass/fail criteria
        report(section, _get_test_tag(probe, "deck-pf"), [deck_pf, CSVResult.PASS])

        await api.home_z()
        if not api.is_simulator:
            ui.get_user_ready(f"REMOVE probe")
        await api.remove_tip(OT3Mount.LEFT)
