"""Test the vent."""

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


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine("vent-closed", [CSVResult]),
        CSVLine("vent-opened", [CSVResult]),
        CSVLine("vent-closed", [CSVResult]),
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


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    print("Vent state")
    await test_vent_set_state(vacuum, types.VentState.CLOSED, report, section)
    await test_vent_set_state(vacuum, types.VentState.OPENED, report, section)
    # Reset
    await test_vent_set_state(vacuum, types.VentState.CLOSED, report, section)
