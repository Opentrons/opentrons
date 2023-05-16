"""Test Pressure."""
from asyncio import sleep
from typing import List, Union

from opentrons_hardware.firmware_bindings.constants import SensorId

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3utils import sensor_id_for_instrument
from opentrons.hardware_control.types import InstrumentProbeType

from hardware_testing.data import ui
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

SECONDS_BETWEEN_READINGS = 0.25
NUM_PRESSURE_READINGS = 10
TIP_VOLUME = 50
ASPIRATE_VOLUME = 300
PRESSURE_READINGS = ["open-pa", "sealed-pa", "aspirate-pa", "dispense-pa"]


def _get_test_tag(probe: InstrumentProbeType, reading: str) -> str:
    assert reading in PRESSURE_READINGS, f"{reading} not in PRESSURE_READINGS"
    return f"{probe.name.lower()}-{reading}"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for p in InstrumentProbeType:
        for r in PRESSURE_READINGS:
            tag = _get_test_tag(p, r)
            lines.append(CSVLine(tag, [float, CSVResult]))
    return lines


async def _read_from_sensor(
    api: OT3API,
    sensor_id: SensorId,
    num_readings: int,
) -> float:
    readings: List[float] = []
    sequential_failures = 0
    while len(readings) != num_readings:
        try:
            r = await helpers_ot3.get_pressure_ot3(api, OT3Mount.LEFT, sensor_id)
            sequential_failures = 0
            readings.append(r)
            print(f"\t{r}")
            if not api.is_simulator:
                await sleep(SECONDS_BETWEEN_READINGS)
        except helpers_ot3.SensorResponseBad as e:
            sequential_failures += 1
            if sequential_failures == 3:
                raise e
            else:
                continue
    return sum(readings) / num_readings


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    for probe in InstrumentProbeType:
        sensor_id = sensor_id_for_instrument(probe)
        # TODO remove this temporary check once we are comfortable
        # with the motors not moving.
        include_motor_movement = False
        ui.print_header(f"Sensor: {probe}")

        # We want to specifically disengage all the pipette axes on
        # the 96 channel
        if not include_motor_movement:
            await api.disengage_axes([OT3Axis.P_L, OT3Axis.Q])

        # OPEN-Pa
        open_pa = 0.0
        if not api.is_simulator:
            try:
                open_pa = await _read_from_sensor(api, sensor_id, NUM_PRESSURE_READINGS)
            except helpers_ot3.SensorResponseBad:
                ui.print_error(f"{probe} pressure sensor not working, skipping")
                continue
        print(f"open-pa: {open_pa}")
        # FIXME: create stricter pass/fail criteria
        report(section, _get_test_tag(probe, "open-pa"), [open_pa, CSVResult.PASS])

        # SEALED-Pa
        sealed_pa = 0.0
        await api.add_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(TIP_VOLUME))
        if include_motor_movement:
            await api.prepare_for_aspirate(OT3Mount.LEFT)
        if not api.is_simulator:
            ui.get_user_ready(f"attach {TIP_VOLUME} uL TIP to {probe.name} sensor")
            ui.get_user_ready("SEAL tip using your FINGER")
            try:
                sealed_pa = await _read_from_sensor(
                    api, sensor_id, NUM_PRESSURE_READINGS
                )
            except helpers_ot3.SensorResponseBad:
                ui.print_error(f"{probe} pressure sensor not working, skipping")
                break
        print(f"sealed-pa: {sealed_pa}")
        # FIXME: create stricter pass/fail criteria
        report(section, _get_test_tag(probe, "open-pa"), [sealed_pa, CSVResult.PASS])

        # ASPIRATE-Pa
        aspirate_pa = 0.0
        if include_motor_movement:
            await api.aspirate(OT3Mount.LEFT, ASPIRATE_VOLUME)
        if not api.is_simulator:
            try:
                aspirate_pa = await _read_from_sensor(
                    api, sensor_id, NUM_PRESSURE_READINGS
                )
            except helpers_ot3.SensorResponseBad:
                ui.print_error(f"{probe} pressure sensor not working, skipping")
                break
        print(f"aspirate-pa: {aspirate_pa}")
        # FIXME: create stricter pass/fail criteria
        report(
            section, _get_test_tag(probe, "aspirate-pa"), [aspirate_pa, CSVResult.PASS]
        )

        # DISPENSE-Pa
        dispense_pa = 0.0
        if include_motor_movement:
            await api.dispense(OT3Mount.LEFT, ASPIRATE_VOLUME)
        if not api.is_simulator:
            try:
                dispense_pa = await _read_from_sensor(
                    api, sensor_id, NUM_PRESSURE_READINGS
                )
            except helpers_ot3.SensorResponseBad:
                ui.print_error(f"{probe} pressure sensor not working, skipping")
                break
        print(f"dispense-pa: {dispense_pa}")
        # FIXME: create stricter pass/fail criteria
        report(
            section, _get_test_tag(probe, "dispense-pa"), [dispense_pa, CSVResult.PASS]
        )

        if not api.is_simulator:
            ui.get_user_ready("REMOVE tip")
        await api.remove_tip(OT3Mount.LEFT)
