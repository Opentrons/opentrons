"""Test Pressure Sensor ATM Basic."""

from typing import List, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules.vacuum_module import VacuumModule

from .common import resting_sensor_faults, sensor_replace_message


PRESSURE_SAMPLES = 10


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    readings = [str] * PRESSURE_SAMPLES
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine("pressure-atm-basic", [CSVResult, *readings]),
    ]
    return lines


async def test_abs_sensors_for_comms(
    vacuum: VacuumModule,
    sensor: str,
    expect_pass: bool,
    report: CSVReport,
    section: str,
) -> None:
    """Test the communication of the atm pressure sensor."""
    ui.print_header(f"Pressure Sensor - {sensor} sensor.")

    abs_a: List[float] = []
    abs_b: List[float] = []
    data: List[float] = []
    for i in range(PRESSURE_SAMPLES):
        await vacuum._reader.update_vacuum_state()
        state = vacuum.vacuum_state
        abs_a.append(state.pressure_abs_a)
        abs_b.append(state.pressure_abs_b)
        data.append(state.pressure_atm)
        print(f"Pressure Sensor ATM #{i}: {state.pressure_atm}")

    faults = resting_sensor_faults(abs_a, abs_b, data)
    if "atm" in faults:
        ui.print_error(sensor_replace_message(faults, abs_a, abs_b, data))
    comms_ok = all(data)
    offset_ok = "atm" not in faults
    report(
        section,
        f"pressure-{sensor}-basic",
        [
            CSVResult.from_bool((comms_ok and offset_ok) or not expect_pass),
            *data,
        ],
    )


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    print("Pressure sensor ATM I2C communication")
    await test_abs_sensors_for_comms(vacuum, "atm", True, report, section)
