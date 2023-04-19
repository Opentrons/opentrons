"""Test Partial Pickup."""
from typing import List, Union, Tuple, Dict

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Axis, OT3Mount, Point


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return []


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    return
