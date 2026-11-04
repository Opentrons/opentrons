"""Test the pressure regulation."""

import math
import asyncio
import time
from typing import List, NamedTuple, Optional, Union
from statistics import mean

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules.vacuum_module import VacuumModule
from opentrons.drivers.vacuum_module.types import VentState


# 200 samples at 0.45 s = 90 s hold; last 50 samples = 30 s steady window.
PRESSURE_SAMPLES = 200
HOLD_DURATION_S = 90
SAMPLE_PERIOD_S = HOLD_DURATION_S / PRESSURE_SAMPLES
TARGET_PRESSURES = [0, -100, -200, -300, -400, -500, -600, -700, -800, -900]
STABILIZE_SAMPLES = 50
SETTLE_WINDOW_S = 10
SETTLE_WINDOW_SAMPLES = max(2, round(SETTLE_WINDOW_S / SAMPLE_PERIOD_S))
TIMEOUT_S = HOLD_DURATION_S + 60
# First sample inside this band of the command counts as reached.
PRESSURE_TOLERANCE = 8  # mbar

# Gates: Determines if a run passes or a fails
# The MEAN_ABS_ERR_LIMIT and P95_ABS_ERR_LIMIT determine if a hold is on target AND
# a hold is NOT oscillating, both are required to pass a run.
#
# Both numbers describe the last 50 samples of a hold, about the final 22 seconds.
# The error on each sample is the gauge reading minus the target, with the sign
# removed, so 1 mbar high and 1 mbar low count the same.
#
# Mean absolute error (MEAN_ABS_ERR_LIMIT) is the average of those 50 errors.
# The limit is 2 mbar from −200 through −800, and 3 mbar at −100. This is the
# regulation result: the chamber is sitting on the target. A hold that stays
# 1.5 mbar off passes. A hold that stays 3 mbar off fails. A few bad samples
# barely move the average, so this gate can pass a trace that mostly holds and
# occasionally jumps.
#
# p95 absolute error (P95_ABS_ERR_LIMIT) is the 95th percentile of those same
# 50 errors. Sorted from smallest to largest, it is the sample at about position
# 47, so three samples are allowed to be worse. The limit is 4 mbar from −200
# through −800, and 6 mbar at −100. This catches the jumps the average hides.
# A hold whose typical error is 1 mbar still fails if the noisy tail is beyond
# 4 mbar.
MEAN_ABS_ERR_LIMIT = 2.0
P95_ABS_ERR_LIMIT = 4.0

# -100 only. Shallow holds are noisier than -200 and below.
SHALLOW_TARGET = -100
SHALLOW_MEAN_ABS_ERR_LIMIT = 3.0
SHALLOW_P95_ABS_ERR_LIMIT = 6.0
# Time to first enter the reach band. A slow unit that then holds still fails.
REACH_TIME_LIMIT_S = 45.0
# Time until a 10 s window meets that target's error gates.
SETTLE_TIME_LIMIT_S = 60.0
# Target 0. Sensor offset, not regulation. Units sit 2.5 to 5.4 mbar low and flat.
# Must be inside the offset band quickly. A real pull does not settle here.
# Floor for the whole 0 mbar trace. Below this, the pump pulled vacuum.
ZERO_MEAN_ABS_ERR_LIMIT = 8.0
ZERO_P95_ABS_ERR_LIMIT = 8.0
ZERO_SETTLE_TIME_LIMIT_S = 20.0
ZERO_DEEPEST_LIMIT_MBAR = -50.0
# -900 is past the pump ceiling. It must not reach or settle.
# Steady mean must sit on the ceiling, not at atmosphere and not past -850.
UNREACHABLE_TARGETS = [-900]
UNREACHABLE_MIN_MEAN_MBAR = -850.0
UNREACHABLE_MAX_MEAN_MBAR = -700.0
# Ceiling hold must stay steady.
UNREACHABLE_P2P_LIMIT = 8.0


class HoldStats(NamedTuple):
    """Window hold statistics in mbar."""

    mean_p: float
    mean_abs_err: float
    p2p: float
    p95_abs_err: float


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV lines with enhanced metrics."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine(
            "vacuum-functional-hold",
            [
                float,  # duration_s
                float,  # sample_period_s
                int,  # n samples per target
            ],
        )
    ]
    for p in TARGET_PRESSURES:
        lines.append(
            CSVLine(
                f"vacuum-target-pressure-{p}",
                [
                    CSVResult,  # Pass/Fail
                    float,  # time_to_reach: seconds until first in ±8 mbar
                    float,  # settling_time: seconds from 0 until stably on target
                    float,  # mean_pressure: last 30s
                    float,  # mean_abs_err: last 30s mean |error|
                    float,  # p2p: last 30s peak-to-peak
                    float,  # p95_abs_err: last 30s 95th percentile |error|
                    *([float] * PRESSURE_SAMPLES),  # raw pressure samples
                ],
            )
        )
    return lines


def _window_stats(window: List[float], target_pressure: float) -> HoldStats:
    """Compute hold stats for a pressure window."""
    abs_errs = [abs(p - target_pressure) for p in window]
    return HoldStats(
        mean_p=mean(window),
        mean_abs_err=mean(abs_errs),
        p2p=max(window) - min(window),
        p95_abs_err=sorted(abs_errs)[int(0.95 * (len(abs_errs) - 1))],
    )


def _regulation_limits(target_pressure: int) -> tuple[float, float]:
    """Return the mean |error| and p95 limits for a regulation target."""
    if target_pressure == SHALLOW_TARGET:
        return SHALLOW_MEAN_ABS_ERR_LIMIT, SHALLOW_P95_ABS_ERR_LIMIT
    return MEAN_ABS_ERR_LIMIT, P95_ABS_ERR_LIMIT


def _is_settled(window: List[float], target_pressure: int) -> bool:
    """Return True when the trailing settle window is holding the target.

    -900 never settles. Other targets use their own mean|err| / p95 limits.
    """
    if target_pressure in UNREACHABLE_TARGETS:
        return False
    if len(window) < SETTLE_WINDOW_SAMPLES:
        return False
    stats = _window_stats(window, float(target_pressure))
    if target_pressure == 0:
        return (
            stats.mean_abs_err <= ZERO_MEAN_ABS_ERR_LIMIT
            and stats.p95_abs_err <= ZERO_P95_ABS_ERR_LIMIT
        )
    mean_limit, p95_limit = _regulation_limits(target_pressure)
    return stats.mean_abs_err <= mean_limit and stats.p95_abs_err <= p95_limit


def _target_passed(
    target_pressure: int,
    reached_time: Optional[float],
    settling_time: Optional[float],
    stats: HoldStats,
    pressures: List[float],
) -> bool:
    """Return whether one functional target met its pass/fail signature.

    0 must stay near atmosphere and never pull vacuum. -900 must not reach and
    must sit at pump max. Remaining targets must reach, lock, and hold.
    """
    if target_pressure in UNREACHABLE_TARGETS:
        return (
            reached_time is None
            and settling_time is None
            and UNREACHABLE_MIN_MEAN_MBAR <= stats.mean_p <= UNREACHABLE_MAX_MEAN_MBAR
            and stats.p2p <= UNREACHABLE_P2P_LIMIT
        )
    if target_pressure == 0:
        return (
            settling_time is not None
            and settling_time <= ZERO_SETTLE_TIME_LIMIT_S
            and stats.mean_abs_err <= ZERO_MEAN_ABS_ERR_LIMIT
            and stats.p95_abs_err <= ZERO_P95_ABS_ERR_LIMIT
            and bool(pressures)
            and min(pressures) > ZERO_DEEPEST_LIMIT_MBAR
        )
    mean_limit, p95_limit = _regulation_limits(target_pressure)
    return (
        reached_time is not None
        and reached_time <= REACH_TIME_LIMIT_S
        and settling_time is not None
        and settling_time <= SETTLE_TIME_LIMIT_S
        and stats.mean_abs_err <= mean_limit
        and stats.p95_abs_err <= p95_limit
    )


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
    await vacuum.set_vacuum_state(
        True,
        target_pressure,
        duration_s=HOLD_DURATION_S,
        timeout_s=TIMEOUT_S,
    )

    pressures: List[float] = []
    reached_time: Optional[float] = None
    settling_time: Optional[float] = None
    sample_period = 0.0 if vacuum.is_simulated else SAMPLE_PERIOD_S

    for i in range(PRESSURE_SAMPLES):
        await vacuum._reader.update_vacuum_state()
        current = vacuum.vacuum_state.current_gauge_pressure
        pressures.append(current)
        print(f"Sample {i:3d}: {current:6.1f} mbar")

        if (
            reached_time is None
            and abs(current - target_pressure) <= PRESSURE_TOLERANCE
        ):
            reached_time = time.monotonic() - test_start_time
            print(f"Reached target in {reached_time:.2f} seconds")

        if settling_time is None and _is_settled(
            pressures[-SETTLE_WINDOW_SAMPLES:], target_pressure
        ):
            settling_time = time.monotonic() - test_start_time
            print(f"Settled on target in {settling_time:.2f} seconds")
        if sample_period > 0:
            remaining = test_start_time + (i + 1) * sample_period - time.monotonic()
            if remaining > 0:
                await asyncio.sleep(remaining)

    stats = _window_stats(pressures[-STABILIZE_SAMPLES:], float(target_pressure))
    passed = _target_passed(
        target_pressure, reached_time, settling_time, stats, pressures
    )

    reached_out = reached_time if reached_time is not None else -1.0
    settling_out = settling_time if settling_time is not None else -1.0

    print(
        f"Reached Target: {reached_out:6.2f}s | "
        f"Settled from 0: {settling_out:5.2f}s | "
        f"mean|err|={stats.mean_abs_err:5.2f} | "
        f"p95={stats.p95_abs_err:5.2f} | "
        f"p2p={stats.p2p:5.2f} | "
        f"PASS={passed}"
    )

    report(
        section,
        f"vacuum-target-pressure-{target_pressure}",
        [
            CSVResult.from_bool(passed),
            reached_out,
            settling_out,
            round(stats.mean_p, 2),
            round(stats.mean_abs_err, 2),
            round(stats.p2p, 2),
            round(stats.p95_abs_err, 2),
            *pressures,
        ],
    )


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    ui.get_user_ready(
        "Make sure the hose is connected to the module and there is a filter\n"
        "plate with liquid on the manifold"
    )

    print("Set Vacuum State")
    # Disable waste detection for now
    await vacuum._driver.set_waste_configs(enable_waste_full_detection=False)
    report(
        section,
        "vacuum-functional-hold",
        [float(HOLD_DURATION_S), float(SAMPLE_PERIOD_S), PRESSURE_SAMPLES],
    )

    try:
        for pressure in TARGET_PRESSURES:
            await test_vacuum_regulation(vacuum, pressure, report, section)
    finally:
        # Clean shutdown
        await vacuum.set_vacuum_state(False)
        await vacuum.set_vent_state(VentState.OPENED)
