"""Test Connectivity."""
from typing import List, Union

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("ethernet", [str, CSVResult]),
        CSVLine("wifi", [str, str, str, CSVResult]),
        CSVLine("usb-b-rear", [CSVResult]),
        CSVLine("usb-a-front", [CSVResult]),
        CSVLine("usb-a-right-1", [CSVResult]),
        CSVLine("usb-a-right-2", [CSVResult]),
        CSVLine("usb-a-right-3", [CSVResult]),
        CSVLine("usb-a-right-4", [CSVResult]),
        CSVLine("usb-a-left-1", [CSVResult]),
        CSVLine("usb-a-left-2", [CSVResult]),
        CSVLine("usb-a-left-3", [CSVResult]),
        CSVLine("usb-a-left-4", [CSVResult]),
        CSVLine("aus-left-can", [CSVResult]),
        CSVLine("aus-left-estop", [CSVResult]),
        CSVLine("aus-left-door-switch", [CSVResult]),
        CSVLine("aus-right-can", [CSVResult]),
        CSVLine("aus-right-estop", [CSVResult]),
        CSVLine("aus-right-door-switch", [CSVResult]),
    ]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    return
