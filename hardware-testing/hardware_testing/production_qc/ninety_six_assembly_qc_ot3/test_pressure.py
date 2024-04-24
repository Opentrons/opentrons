"""Test Pressure."""
from asyncio import sleep
from typing import List, Union
from hardware_testing.drivers.sealed_pressure_fixture import SerialDriver as SealedPressureDriver
from hardware_testing.opentrons_api import helpers_ot3

from opentrons_hardware.firmware_bindings.constants import SensorId

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3utils import sensor_id_for_instrument
from opentrons.hardware_control.types import InstrumentProbeType

from hardware_testing.data import ui
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Point
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

PRIMARY_SEALED_PRESSURE_FIXTURE_POS = Point(362.68, 148.83, 44.4)  # attached tip
SECOND_SEALED_PRESSURE_FIXTURE_POS = Point(264.71, 212.81, 44.4)   # attached tip
SET_PRESSURE_TARGET = 100 # read air pressure when the force pressure value is over 100
REACHED_PRESSURE = 0
USE_SEALED_FIXTURE = False

SECONDS_BETWEEN_READINGS = 0.25
NUM_PRESSURE_READINGS = 10
TIP_VOLUME = 50
ASPIRATE_VOLUME = 2
PRESSURE_READINGS = ["open-pa", "sealed-pa", "aspirate-pa", "dispense-pa"]

THRESHOLDS = {
    "open-pa": (
        -25,
        25,
    ),
    "sealed-pa": (
        -30,
        30,
    ),
    "aspirate-pa": (
        -600,
        -400,
    ),
    "dispense-pa": (
        2500,
        3500,
    ),
}


def _get_test_tag(probe: InstrumentProbeType, reading: str) -> str:
    assert reading in PRESSURE_READINGS, f"{reading} not in PRESSURE_READINGS"
    return f"{probe.name.lower()}-{reading}"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for p in InstrumentProbeType:
        for r in PRESSURE_READINGS:
            tag = _get_test_tag(p, r)
            if r == "sealed-pa":
                lines.append(CSVLine(tag, [float, CSVResult, float]))
            else:
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


def check_value(test_value: float, test_name: str) -> CSVResult:
    """Determine if value is within pass limits."""
    low_limit = THRESHOLDS[test_name][0]
    high_limit = THRESHOLDS[test_name][1]

    if low_limit < test_value and test_value < high_limit:
        return CSVResult.PASS
    else:
        return CSVResult.FAIL
    
async def calibrate_to_pressue_fixture(api: OT3API, sensor:SealedPressureDriver, fixture_pos:Point):
    """move to suitable height for readding air pressure"""
    global REACHED_PRESSURE
    await api.move_to(OT3Mount.LEFT, fixture_pos)
    debug_target = input(f"Setting target pressure (default: {SET_PRESSURE_TARGET}g): ")
    if debug_target.strip() == "":
        debug_target = f"{SET_PRESSURE_TARGET}"
    while True:
        force_pressure = sensor.get_pressure()
        # step = -0.06 if abs(float(force_pressure)) > 0.1 else -0.1
        step = -0.06
        print("Force pressure is: ", force_pressure)
        if force_pressure < float(debug_target.strip()):
            await api.move_rel(OT3Mount.LEFT, Point(x=0, y=0, z=step))
            await sleep(3)
        else:
            REACHED_PRESSURE = sensor.get_pressure()
            ui.print_info(f"Reaching force is {REACHED_PRESSURE}, exit calibration.")
            break
        


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    await api.home_z(OT3Mount.LEFT)
    slot_5 = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    home_pos = await api.gantry_position(OT3Mount.LEFT)
    await api.move_to(OT3Mount.LEFT, slot_5._replace(z=home_pos.z))

    if USE_SEALED_FIXTURE:
        # init driver
        pressure_sensor = SealedPressureDriver()
        pressure_sensor.init(9600)
    
    for probe in InstrumentProbeType:
        sensor_id = sensor_id_for_instrument(probe)
        ui.print_header(f"Sensor: {probe}")

        # OPEN-Pa
        open_pa = 0.0
        if not api.is_simulator:
            try:
                open_pa = await _read_from_sensor(api, sensor_id, NUM_PRESSURE_READINGS)
            except helpers_ot3.SensorResponseBad:
                ui.print_error(f"{probe} pressure sensor not working, skipping")
                continue
        print(f"open-pa: {open_pa}")
        open_result = check_value(open_pa, "open-pa")
        report(section, _get_test_tag(probe, "open-pa"), [open_pa, open_result])

        # SEALED-Pa
        sealed_pa = 0.0
        await api.add_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(TIP_VOLUME))
        await api.prepare_for_aspirate(OT3Mount.LEFT)
        if not api.is_simulator:
            ui.get_user_ready(f"attach {TIP_VOLUME} uL TIP to {probe.name} sensor")
            if not USE_SEALED_FIXTURE:
                 ui.get_user_ready("SEAL tip using your FINGER")
            else:
                if probe == InstrumentProbeType.PRIMARY:
                    fixture_pos = PRIMARY_SEALED_PRESSURE_FIXTURE_POS
                elif probe == InstrumentProbeType.SECONDARY:
                    fixture_pos = SECOND_SEALED_PRESSURE_FIXTURE_POS
                else:
                    raise KeyError("Couldn't find key for InstrumentProbeTybe")

                await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, fixture_pos._replace(z=fixture_pos.z + 50))
                ui.get_user_ready("Ready for moving to sensor")
                
                await calibrate_to_pressue_fixture(api, pressure_sensor, fixture_pos)

            try:
                sealed_pa = await _read_from_sensor(
                    api, sensor_id, NUM_PRESSURE_READINGS
                )
            except helpers_ot3.SensorResponseBad:
                ui.print_error(f"{probe} pressure sensor not working, skipping")
                break
        print(f"sealed-pa: {sealed_pa}")
        sealed_result = check_value(sealed_pa, "sealed-pa")
        report(section, _get_test_tag(probe, "sealed-pa"), [sealed_pa, sealed_result, REACHED_PRESSURE])

        # ASPIRATE-Pa
        aspirate_pa = 0.0
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
        aspirate_result = check_value(aspirate_pa, "aspirate-pa")
        report(
            section, _get_test_tag(probe, "aspirate-pa"), [aspirate_pa, aspirate_result]
        )

        # DISPENSE-Pa
        dispense_pa = 0.0
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
        dispense_result = check_value(dispense_pa, "dispense-pa")
        report(
            section, _get_test_tag(probe, "dispense-pa"), [dispense_pa, dispense_result]
        )
        if USE_SEALED_FIXTURE:
            await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, fixture_pos._replace(z=fixture_pos.z + 50))
        if not api.is_simulator:
            ui.get_user_ready("REMOVE tip")
        
        await api.remove_tip(OT3Mount.LEFT)
