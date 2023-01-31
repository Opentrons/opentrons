"""Test Peripherals."""
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
        CSVLine("screen-on", [CSVResult]),
        CSVLine("screen-touch", [CSVResult]),
        CSVLine("deck-lights-on", [CSVResult]),
        CSVLine("deck-lights-off", [CSVResult]),
        CSVLine("status-lights-on", [CSVResult]),
        CSVLine("door-switch", [CSVResult]),
        CSVLine("camera-active", [CSVResult]),
        CSVLine("camera-image", [CSVResult]),
    ]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    return
