"""Test Cycling."""
from typing import List, Union

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.drivers.flex_stacker.types import HardwareRevision
from opentrons.hardware_control.modules import FlexStacker


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("cycle", [CSVResult]),
    ]


# async def test_gcode(stacker: FlexStacker, report: CSVReport) -> None:
#     """Send and receive response for GCODE M115."""
#     success = True
#     info = await stacker._driver.get_device_info()
#     # TODO: update this with PVT/MP revisions
#     if info.hw != HardwareRevision.DVT:
#         ui.print_warning(f"Hardware Revision is {info.hw}, expected DVT")
#     report(
#         "CONNECTIVITY",
#         "usb-get-device-info",
#         [info.fw, info.hw, info.sn, CSVResult.from_bool(success)],
#     )



async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    ui.print_header("Cycle Test")
    model = await stacker.get_model()
    ui.print_info(f"Model: {model}")
