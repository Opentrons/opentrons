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

NUM_CYCLES = 10

def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("cycle", [int, CSVResult]),
    ]

def print_cycle(stacker: FlexStacker, cycle: int, total_cycles: int) -> None:
    """Print formater for cycle progress"""
    out_str = f"{stacker.device_info['serial']}: Cycle {cycle}/{total_cycles} Completed"
    ui.print_info(out_str)

async def test_cycles(stacker: FlexStacker) -> Tuple[bool, int]:
    """Test Cycling Labware on Stacker"""
    cycles_completed = 0

    for cycle in range(NUM_CYCLES):
        try:
            await stacker.dispense_labware(15)
            await stacker.store_labware(15)
        except Exception as e:
            ui.print_error(f"{stacker.device_info['serial']}: An error occurred: {e}")

        cycles_completed += 1
        if (cycles_completed % 5 == 0) and (not cycles_completed==NUM_CYCLES):
            print_cycle(stacker, cycles_completed, NUM_CYCLES)
    
    print_cycle(stacker, NUM_CYCLES, NUM_CYCLES)   
    return (cycles_completed==NUM_CYCLES, cycles_completed)



async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    ui.print_header(f"Cycle Test - {stacker.device_info['serial']}")

    await stacker.home_all()
    cycle_result, cycles_completed = await test_cycles(stacker)     
    
    report(section, "cycle", [cycles_completed, CSVResult.from_bool(cycle_result)])