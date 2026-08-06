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

    data = []
    for i in range(PRESSURE_SAMPLES):
        await vacuum._reader.update_vacuum_state()
        state = vacuum.vacuum_state
        pressure = state.pressure_atm
        data.append(pressure)
        print(f"Pressure Sensor ABS {sensor} #{i}: {pressure}")

    report(
        section,
        f"pressure-{sensor}-basic",
        [
            CSVResult.from_bool(all(data) or not expect_pass),
            *data,
        ],
    )


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    print("Pressure sensor ATM I2C communication")
    await test_abs_sensors_for_comms(vacuum, "atm", True, report, section)
