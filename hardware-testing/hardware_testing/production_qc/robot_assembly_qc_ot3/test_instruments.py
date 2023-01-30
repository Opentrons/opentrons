"""Test Instruments."""
from typing import List

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data.csv_report import CSVReport, CSVResult, CSVLine


def build_csv_lines() -> List[CSVLine]:
    """Build CSV Lines."""
    return [
        CSVLine("left-id", [str, str, CSVResult]),
        CSVLine("left-enc-max", [float, CSVResult]),
        CSVLine("left-enc-home", [float, CSVResult]),
        CSVLine("left-probe-distance", [float, CSVResult]),
        CSVLine("right-id", [str, str, CSVResult]),
        CSVLine("right-enc-max", [float, CSVResult]),
        CSVLine("right-enc-home", [float, CSVResult]),
        CSVLine("right-probe-distance", [float, CSVResult]),
        CSVLine("gripper-id", [str, str, CSVResult]),
        CSVLine("gripper-z-max-travel", [float, CSVResult]),
        CSVLine("gripper-jaw-enc-grip", [float, CSVResult]),
        CSVLine("gripper-jaw-enc-ungrip", [float, CSVResult]),
        CSVLine("gripper-probe-distance-front", [float, CSVResult]),
        CSVLine("gripper-probe-distance-rear", [float, CSVResult]),
    ]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    return
