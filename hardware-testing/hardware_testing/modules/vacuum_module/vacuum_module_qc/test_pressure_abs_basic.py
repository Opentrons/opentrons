"""Test Pressure Sensor Basic."""

from typing import List, Tuple, Union
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
        CSVLine("pressure-abs-a-basic", [CSVResult, *readings]),
        CSVLine("pressure-abs-b-basic", [CSVResult, *readings]),
    ]
    return lines


async def _sample_rest(
    vacuum: VacuumModule,
) -> Tuple[List[float], List[float], List[float]]:
    """Read absolute A, absolute B, and atmosphere together at rest."""
    abs_a: List[float] = []
    abs_b: List[float] = []
    atm: List[float] = []
    for i in range(PRESSURE_SAMPLES):
        await vacuum._reader.update_vacuum_state()
        state = vacuum.vacuum_state
        abs_a.append(state.pressure_abs_a)
        abs_b.append(state.pressure_abs_b)
        atm.append(state.pressure_atm)
        print(
            f"Pressure rest #{i}: "
            f"A={state.pressure_abs_a:.1f} "
            f"B={state.pressure_abs_b:.1f} "
            f"atm={state.pressure_atm:.1f}"
        )
    return abs_a, abs_b, atm


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    print("Pressure sensor I2C communication")
    ui.print_header("Pressure Sensor - absolute A and B")
    abs_a, abs_b, atm = await _sample_rest(vacuum)
    faults = resting_sensor_faults(abs_a, abs_b, atm)
    chamber_faults = [fault for fault in faults if fault in ("a", "b")]
    if chamber_faults:
        ui.print_error(sensor_replace_message(chamber_faults, abs_a, abs_b, atm))
    for sensor, data in (("a", abs_a), ("b", abs_b)):
        comms_ok = all(data)
        offset_ok = sensor not in faults
        report(
            section,
            f"pressure-abs-{sensor}-basic",
            [CSVResult.from_bool(comms_ok and offset_ok), *data],
        )
