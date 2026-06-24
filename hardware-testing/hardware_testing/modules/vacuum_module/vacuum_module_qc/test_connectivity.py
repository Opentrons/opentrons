"""Test Connectivity."""
from typing import List, Union

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.drivers.vacuum_module.types import HardwareRevision
from opentrons.hardware_control.modules.vacuum_module import VacuumModule


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("usb-get-device-info", [str, str, str, CSVResult]),
        CSVLine("eeprom-set-serial-number", [str, str, CSVResult]),
        CSVLine("led-blinking", [bool, CSVResult]),
    ]


async def test_gcode(vacuum: VacuumModule, report: CSVReport) -> None:
    """Send and receive response for GCODE M115."""
    success = True
    info = await vacuum._driver.get_device_info()
    target_rev = HardwareRevision.DVT
    hw = info["model"]
    fw = info["version"]
    sn = info["serial"]
    if hw != target_rev.value:
        ui.print_warning(f"Hardware Revision is {hw}, expected {target_rev.value}")
    report(
        "CONNECTIVITY",
        "usb-get-device-info",
        [fw, hw, sn, CSVResult.from_bool(success)],
    )


async def test_eeprom(vacuum: VacuumModule, report: CSVReport) -> None:
    """Set serial number and make sure device info is updated accordingly."""
    success = True
    if not vacuum.is_simulated:
        serial = input("SCAN device barcode: ")
    else:
        serial = "VACUUM-SIMULATOR-SN"
    await vacuum._driver.set_serial_number(serial)
    report.set_tag(serial)
    info = await vacuum._driver.get_device_info()
    sn = info["serial"]
    if sn != serial:
        ui.print_error("Serial number is not set properly")
        success = False
    report(
        "CONNECTIVITY",
        "eeprom-set-serial-number",
        [serial, sn, CSVResult.from_bool(success)],
    )


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    ui.print_header("USB Communication")
    await test_gcode(vacuum, report)

    ui.print_header("EEPROM Communication")
    await test_eeprom(vacuum, report)
