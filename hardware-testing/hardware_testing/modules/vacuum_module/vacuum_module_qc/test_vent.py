"""Test the vent."""

import asyncio
import time
from typing import List, Union
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

# Command -800. Pass at -792, the same ±8 mbar reach as the functional holds.
# A shallower pull means the hose or a vent that did not close.
BLEED_TARGET_MBAR = -800
BLEED_MIN_GAUGE_MBAR = -792.0
BLEED_PULL_TIMEOUT_S = 45.0


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine("vent-closed", [CSVResult]),
        CSVLine("vent-opened", [CSVResult]),
        CSVLine("vent-closed", [CSVResult]),
        # result, gauge before the vent opens, gauge after the wait
        CSVLine(VENT_BLEED_TAG, [CSVResult, float, float]),
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


async def _pull_for_bleed(vacuum: VacuumModule) -> float:
    """Close the vent, pull toward -800, and return the gauge reached."""
    print(f"Setting Pressure Target: {BLEED_TARGET_MBAR}")
    await vacuum.set_vacuum_state(False)
    await vacuum.set_vent_state(types.VentState.CLOSED)
    await vacuum.set_vacuum_state(
        True,
        BLEED_TARGET_MBAR,
        duration_s=int(BLEED_PULL_TIMEOUT_S),
        timeout_s=int(BLEED_PULL_TIMEOUT_S),
        vent_after=False,
    )
    started = time.monotonic()
    gauge = vacuum.current_gauge_pressure_mbar
    while time.monotonic() - started < BLEED_PULL_TIMEOUT_S:
        if gauge <= BLEED_TARGET_MBAR:
            break
        await asyncio.sleep(1.0)
        gauge = vacuum.current_gauge_pressure_mbar
        print(f"Gauge: {gauge}")
    await vacuum.set_vacuum_state(False)
    return gauge


async def test_vent_bleed(
    vacuum: VacuumModule, report: CSVReport, section: str
) -> None:
    """Pull a deep vacuum, open the vent, and require atmosphere in time."""
    ui.print_header("Vent bleed")
    ui.get_user_ready("Connect the hose and fit a NON-filter plate on the manifold")
    if vacuum.is_simulated:
        report(section, VENT_BLEED_TAG, [CSVResult.PASS, 0.0, 0.0])
        return

    await vacuum._driver.set_waste_configs(enable_waste_full_detection=False)
    try:
        pulled = await _pull_for_bleed(vacuum)
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
