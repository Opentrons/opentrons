"""Test Force."""
from typing import List, Union

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
)


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return []


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    return
