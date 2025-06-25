"""Test Cycling."""
from typing import List, Union, Tuple

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules import FlexStacker


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("cycle", [int, CSVResult]),
    ]


def print_cycle(stacker: FlexStacker, cycle: int, total_cycles: int) -> None:
    """Print formater for cycle progress."""
    out_str = f"{stacker.device_info['serial']}: Cycle {cycle}/{total_cycles} Completed"
    ui.print_info(out_str)


async def test_cycles(
    stacker: FlexStacker, cycles: int, labware_height: int
) -> Tuple[bool, int]:
    """Test Cycling Labware on Stacker."""
    cycles_completed = 0

    for cycle in range(cycles):
        try:
            await stacker.dispense_labware(
                labware_height,
                enforce_hopper_lw_sensing=False,
                enforce_shuttle_lw_sensing=False,
            )
            await stacker.store_labware(
                labware_height, enforce_shuttle_lw_sensing=False
            )
        except Exception as e:
            ui.print_error(f"{stacker.device_info['serial']}: An error occurred: {e}")
            break

        cycles_completed += 1
        if (cycles_completed % 5 == 0) and (not cycles_completed == cycles):
            print_cycle(stacker, cycles_completed, cycles)

    print_cycle(stacker, cycles, cycles)
    return (cycles_completed == cycles, cycles_completed)


async def run(
    stacker: FlexStacker,
    report: CSVReport,
    section: str,
    cycles: int,
    labware_height: int,
) -> None:
    """Run."""
    ui.print_header(f"Cycle Test - {stacker.device_info['serial']}")

    await stacker.home_all()
    cycle_result, cycles_completed = await test_cycles(stacker, cycles, labware_height)

    report(section, "cycle", [cycles_completed, CSVResult.from_bool(cycle_result)])
