"""Test the pressure regulation."""

import math
import asyncio
from typing import List, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules.vacuum_module import VacuumModule
from opentrons.drivers.vacuum_module.types import VentState

# Target guage pressure
START = -100
END = -1000
STEP = -200
TARGET_PRESSURE = list(range(START, END, STEP))
PRESSURE_SAMPLES = 100
PRESSURE_TOLERANCE = 5


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    pressures = [int] * PRESSURE_SAMPLES
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine(f"vacuum-target-pressure-{p}", [CSVResult, *pressures])
        for p in TARGET_PRESSURE
    ]
    return lines


async def test_vacuum_regulation(
    vacuum: VacuumModule,
    target_pressure: int,
    report: CSVReport,
    section: str,
) -> None:
    """Test setting the target vacuum state."""
    ui.print_header(f"Target Guage Pressure={target_pressure}")

    # Turn Off Vacuum
    await vacuum.set_vacuum_state(False)
    await vacuum.set_vent_state(VentState.OPENED)
    await asyncio.sleep(5)  # wait n seconds
    # Make sure the motor is not moving
    await vacuum._reader.update_pump_state()
    pump_running = vacuum.pump_state.pump_running
    assert not pump_running, "Pump is running"

    # Close the vent
    await vacuum.set_vent_state(VentState.CLOSED)

    # Set the target pressure
    print(f"Set Target Pressure: {target_pressure}")
    await vacuum.set_vacuum_state(True, target_pressure)

    # verify target pressure
    pressures = []
    for i in range(PRESSURE_SAMPLES):
        await vacuum._reader.update_vacuum_state()
        pressure = vacuum.vacuum_state.current_guage_pressure
        pressures.append(pressure)
        print(f"Current Pressure: {pressure}")
        sleep = 0.1 if pressure == 0 else 0.4
        await asyncio.sleep(sleep)

    # wait until pressire stabilizes
    await asyncio.sleep(5)  # wait n seconds

    # Verify target pressure
    await vacuum._reader.update_vacuum_state()
    pressure = vacuum.vacuum_state.current_guage_pressure
    passed = math.isclose(target_pressure, pressure, abs_tol=PRESSURE_TOLERANCE)
    report(
        section,
        f"vacuum-target-pressure-{target_pressure}",
        [CSVResult.from_bool(passed), *pressures],
    )


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    print("Set Vacuum State")

    # Disable Waste Detection for now
    await vacuum._driver.set_waste_configs(enable_waste_full_detection=False)

    # Turn off vacuum
    try:
        await vacuum.set_vacuum_state(False)
        for pressure in TARGET_PRESSURE:
            await test_vacuum_regulation(vacuum, pressure, report, section)
    finally:
        # Always Turn off vacuum
        await vacuum.set_vacuum_state(False)
        await vacuum.set_vent_state(VentState.CLOSED)
