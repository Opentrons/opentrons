"""Test the vent."""

import asyncio
import time
from typing import List, Optional, Tuple, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules.vacuum_module import VacuumModule
from opentrons.drivers.vacuum_module import types

from .common import ATMOSPHERE_WAIT_S, VENT_BLEED_TAG

# One -900 pull. The hose check is the deepest gauge in the first 45 s.
# Pass at -792. A shallower pull means the hose or a vent that did not close.
BLEED_MIN_GAUGE_MBAR = -792.0
BLEED_PULL_TIMEOUT_S = 45.0
# Last 50 samples of that same pull. Reported, not gated.
CEILING_TARGET_MBAR = -900
CEILING_SAMPLES = 200
CEILING_DURATION_S = 90.0
CEILING_STEADY_SAMPLES = 50


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine("vent-closed", [CSVResult]),
        CSVLine("vent-opened", [CSVResult]),
        CSVLine("vent-closed", [CSVResult]),
        # result, deepest gauge in the first 45 s, gauge after the atmosphere wait
        CSVLine(VENT_BLEED_TAG, [CSVResult, float, float]),
        # steady mean and peak-to-peak on the solid plate, commanded to -900
        CSVLine("vent-ceiling", [float, float]),
    ]
    return lines


async def test_vent_set_state(
    vacuum: VacuumModule,
    expected_state: types.VentState,
    report: CSVReport,
    section: str,
) -> None:
    """Test setting the state of the vent."""
    ui.print_header("Vent Valve")

    await vacuum.set_vent_state(expected_state)
    await vacuum._reader.update_vacuum_state()
    state = vacuum.vacuum_state.vent_state
    closed = "closed" if expected_state == types.VentState.CLOSED else "opened"

    report(
        section,
        f"vent-{closed}",
        [CSVResult.from_bool(state == expected_state)],
    )


async def _pull_for_bleed(vacuum: VacuumModule) -> Tuple[float, float, float]:
    """Command -900 on the solid plate.

    One pull. The gauge reached by 45 s is the hose check. The last 50 samples
    are the ceiling. Returns that gauge, the steady mean, and the peak-to-peak.
    """
    print(f"Setting Pressure Target: {CEILING_TARGET_MBAR}")
    await vacuum.set_vacuum_state(False)
    await vacuum.set_vent_state(types.VentState.CLOSED)
    started = time.monotonic()
    await vacuum.set_vacuum_state(
        True,
        CEILING_TARGET_MBAR,
        duration_s=int(CEILING_DURATION_S),
        timeout_s=int(CEILING_DURATION_S),
        vent_after=False,
    )
    period = CEILING_DURATION_S / CEILING_SAMPLES
    pressures: List[float] = []
    deepest_in_time: Optional[float] = None
    for i in range(CEILING_SAMPLES):
        await vacuum._reader.update_vacuum_state()
        gauge = vacuum.vacuum_state.current_gauge_pressure
        pressures.append(gauge)
        print(f"Sample {i:3d}: {gauge:6.1f}")
        elapsed = time.monotonic() - started
        if elapsed <= BLEED_PULL_TIMEOUT_S:
            if deepest_in_time is None or gauge < deepest_in_time:
                deepest_in_time = gauge
        remaining = started + (i + 1) * period - time.monotonic()
        if remaining > 0:
            await asyncio.sleep(remaining)
    await vacuum.set_vacuum_state(False)
    pulled = deepest_in_time if deepest_in_time is not None else min(pressures)
    window = pressures[-CEILING_STEADY_SAMPLES:]
    mean_p = sum(window) / len(window)
    p2p = max(window) - min(window)
    print(f"Bleed gauge={pulled:.1f} ceiling mean={mean_p:.1f} p2p={p2p:.1f}")
    return pulled, mean_p, p2p


async def test_vent_bleed(
    vacuum: VacuumModule, report: CSVReport, section: str
) -> None:
    """Pull a deep vacuum, open the vent, and require atmosphere in time."""
    ui.print_header("Vent bleed")
    ui.get_user_ready("Connect the hose and fit a NON-filter plate on the manifold.")
    if vacuum.is_simulated:
        report(section, VENT_BLEED_TAG, [CSVResult.PASS, 0.0, 0.0])
        report(section, "vent-ceiling", [float(CEILING_TARGET_MBAR), 0.0])
        return

    await vacuum._driver.set_waste_configs(enable_waste_full_detection=False)
    try:
        pulled, mean_p, p2p = await _pull_for_bleed(vacuum)
        report(section, "vent-ceiling", [round(mean_p, 2), round(p2p, 2)])
        if pulled > BLEED_MIN_GAUGE_MBAR:
            ui.print_error(f"vent bleed did not pull vacuum: gauge={pulled:.1f}")
            report(
                section,
                VENT_BLEED_TAG,
                [CSVResult.FAIL, round(pulled, 2), round(pulled, 2)],
            )
            return

        print("Opening Vent and waiting to pressurize")
        await vacuum.set_vent_state(types.VentState.OPENED)
        await vacuum.wait_for_pressure_equalization(ATMOSPHERE_WAIT_S)
        after = vacuum.current_gauge_pressure_mbar
        passed = vacuum.pressure_equalized
        print(
            f"vent bleed: pulled={pulled:.1f} after={after:.1f} "
            f"wait={ATMOSPHERE_WAIT_S:.0f}s PASS={passed}"
        )
        if not passed:
            ui.print_error(
                "vent did not return to atmosphere after "
                f"{ATMOSPHERE_WAIT_S:.0f}s: gauge={after:.1f}"
            )
        report(
            section,
            VENT_BLEED_TAG,
            [CSVResult.from_bool(passed), round(pulled, 2), round(after, 2)],
        )
    finally:
        await vacuum.set_vacuum_state(False)
        await vacuum.set_vent_state(types.VentState.OPENED)


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    print("Vent state")
    await test_vent_set_state(vacuum, types.VentState.CLOSED, report, section)
    await test_vent_set_state(vacuum, types.VentState.OPENED, report, section)
    # Reset
    await test_vent_set_state(vacuum, types.VentState.CLOSED, report, section)
    await test_vent_bleed(vacuum, report, section)
