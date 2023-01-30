"""Test Gantry."""
from typing import List

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data.csv_report import CSVReport, CSVResult, CSVLine


def build_csv_lines() -> List[CSVLine]:
    """Build CSV Lines."""
    return [
        CSVLine("axis-currents", [float, float, float, float]),
        CSVLine("home-mot", [float, float, float, float]),
        CSVLine("home-enc", [float, float, float, float, CSVResult]),
        CSVLine("x-min-mot", [float, float, float, float]),
        CSVLine("x-min-enc", [float, float, float, float, CSVResult]),
        CSVLine("x-max-mot", [float, float, float, float]),
        CSVLine("x-max-enc", [float, float, float, float, CSVResult]),
        CSVLine("y-min-mot", [float, float, float, float]),
        CSVLine("y-min-enc", [float, float, float, float, CSVResult]),
        CSVLine("y-max-mot", [float, float, float, float]),
        CSVLine("y-max-enc", [float, float, float, float, CSVResult]),
        CSVLine("zl-min-mot", [float, float, float, float]),
        CSVLine("zl-min-enc", [float, float, float, float, CSVResult]),
        CSVLine("zl-max-mot", [float, float, float, float]),
        CSVLine("zl-max-enc", [float, float, float, float, CSVResult]),
        CSVLine("zr-min-mot", [float, float, float, float]),
        CSVLine("zr-min-enc", [float, float, float, float, CSVResult]),
        CSVLine("zr-max-mot", [float, float, float, float]),
        CSVLine("zr-max-enc", [float, float, float, float, CSVResult]),
    ]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    return
