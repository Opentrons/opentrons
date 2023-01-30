"""Test Signals."""
from typing import List

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data.csv_report import CSVReport, CSVResult, CSVLine


def build_csv_lines() -> List[CSVLine]:
    """Build CSV Lines."""
    return [
        CSVLine("nsync-target-pos", [float, float, float]),
        CSVLine("nsync-stop-pos", [float, float, float, CSVResult]),
        CSVLine("estop-target-pos", [float, float, float]),
        CSVLine("estop-stop-pos", [float, float, float, CSVResult]),
    ]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    return
