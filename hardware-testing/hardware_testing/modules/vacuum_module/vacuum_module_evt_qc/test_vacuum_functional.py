"""Test the pressure regulation."""

import math
import asyncio
import time
from typing import List, Union
from statistics import mean, stdev

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules.vacuum_module import VacuumModule
from opentrons.drivers.vacuum_module.types import VentState


# Test parameters
TARGET_PRESSURES = [0, -100, -200, -300, -400, -500, -600, -700, -800, -900]
PRESSURE_SAMPLES = 200
STABILIZE_SAMPLES = 50  # samples used for std dev and settling analysis
PRESSURE_TOLERANCE = 8  # mbar to consider "reached" and "settled"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV lines with enhanced metrics."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = []
    for p in TARGET_PRESSURES:
        lines.append(
            CSVLine(
                f"vacuum-target-pressure-{p}",
                [
                    CSVResult,  # Pass/Fail
                    float,  # time_to_reach: seconds to first enter tolerance
                    float,  # settling_time: seconds from reach to stable
                    float,  # total_time:  total test duration
                    float,  # mean_pressure: during stable phase
                    float,  # std_dev: stability metric
                    float,  # max_deviation: worst deviation from target
                    float,  # min_pressure: during stable phase
                    float,  # max_pressure: during stable phase
                    *([float] * PRESSURE_SAMPLES),  # raw pressure samples
                ],
            )
        )
    return lines


async def test_vacuum_regulation(
    vacuum: VacuumModule,
    target_pressure: int,
    report: CSVReport,
    section: str,
) -> None:
    """Test setting target vacuum."""
    ui.print_header(f"Target Gauge Pressure = {target_pressure}")

    # Reset system
    await vacuum.set_vacuum_state(False)
    await vacuum.set_vent_state(VentState.OPENED)

    # Wait for the Pressure to equalize
    for i in range(10):
        await vacuum._reader.update_vacuum_state()
        state = vacuum.vacuum_state
        equalized = math.isclose(
            state.pressure_abs_b, state.pressure_atm, abs_tol=PRESSURE_TOLERANCE
        )
        if equalized:
            break
        await asyncio.sleep(1)

    # Make sure the motor is not moving
    await vacuum._reader.update_pump_state()
    pump_running = vacuum.pump_state.pump_running
    assert not pump_running, "Pump is running"

    # Close the vent
    await vacuum.set_vent_state(VentState.CLOSED)

    # Set the target pressure
    print(f"Set Target Pressure: {target_pressure} mbar")
    test_start_time = time.monotonic()
    await vacuum.set_vacuum_state(True, target_pressure)

    pressures: List[float] = []
    stable_window: List[float] = []
    reached_time = None
    settling_time = None
    max_deviation = 0.0

    for i in range(PRESSURE_SAMPLES):
        await vacuum._reader.update_vacuum_state()
        current = vacuum.vacuum_state.current_gauge_pressure
        pressures.append(current)
        print(f"Sample {i:3d}: {current:6.1f} mbar")

        # Track max deviation
        deviation = abs(current - target_pressure)
        if deviation > max_deviation:
            max_deviation = deviation

        # Check if we reached target tolerance
        if (
            reached_time is None
            and abs(current - target_pressure) <= PRESSURE_TOLERANCE
        ):
            reached_time = time.monotonic() - test_start_time
            print(f"Reached target in {reached_time:.2f} seconds")

        # Settling time calculation (live rolling window)
        stable_window.append(current)
        if len(stable_window) > STABILIZE_SAMPLES:
            stable_window.pop(0)

        if reached_time is not None and len(stable_window) == STABILIZE_SAMPLES:
            current_std = stdev(stable_window) if len(stable_window) > 1 else 0.0
            if current_std <= PRESSURE_TOLERANCE and settling_time is None:
                settling_time = (time.monotonic() - test_start_time) - reached_time
                print(
                    f"Settled in {settling_time:.2f} seconds (stddev = {current_std:.3f} mbar)"
                )
        await asyncio.sleep(0.2)

    # Final reading
    await vacuum._reader.update_vacuum_state()
    final_pressure = vacuum.vacuum_state.current_gauge_pressure

    # Use last stable window for metrics
    reached_time = reached_time or -1.0
    settling_time = settling_time or -1.0
    total_time = time.monotonic() - test_start_time
    stable_pressures = pressures[-STABILIZE_SAMPLES:]
    mean_p = mean(stable_pressures)
    std_dev = stdev(stable_pressures) if len(stable_pressures) > 1 else 0.0
    min_p = min(stable_pressures)
    max_p = max(stable_pressures)

    # Determine pass/fail
    expected = target_pressure > -50 or target_pressure < -800
    passed = (
        expected
        or (reached_time is not None)
        and (abs(final_pressure - target_pressure) <= PRESSURE_TOLERANCE * 1.5)
    )

    # Print summary
    print(
        f"Reached Target: {reached_time:6.2f}s | "
        f"Settling: {settling_time:5.2f}s | StdDev: {std_dev:5.3f} | "
        f"MaxDev: {max_deviation:5.2f}"
    )

    # Log to CSV
    report(
        section,
        f"vacuum-target-pressure-{target_pressure}",
        [
            CSVResult.from_bool(passed),
            reached_time,
            settling_time,
            round(total_time, 2),
            round(mean_p, 2),
            round(std_dev, 3),
            round(max_deviation, 2),
            round(min_p, 2),
            round(max_p, 2),
            *pressures,
        ],
    )


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    print("Set Vacuum State")
    # Disable waste detection for now
    await vacuum._driver.set_waste_configs(enable_waste_full_detection=False)

    try:
        for pressure in TARGET_PRESSURES:
            await test_vacuum_regulation(vacuum, pressure, report, section)
    finally:
        # Clean shutdown
        await vacuum.set_vacuum_state(False)
        await vacuum.set_vent_state(VentState.CLOSED)
