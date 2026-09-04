"""Vacuum Module QC."""

from os import environ

# NOTE: this is required to get WIFI test to work
if "OT_SYSTEM_VERSION" not in environ:
    environ["OT_SYSTEM_VERSION"] = "0.0.0"

import argparse
import asyncio
import subprocess
from pathlib import Path
from typing import Tuple

from hardware_testing.data import ui, get_git_description
from hardware_testing.data.csv_report import CSVReport

from .config import TestSection, TestConfig, build_report, TESTS
from ...common.utils import find_module_port
from opentrons.hardware_control.execution_manager import ExecutionManager
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.vacuum_module.types import VentState
from opentrons.hardware_control.modules.vacuum_module import VacuumModule


VACUUM_VID = 0x0483
VACUUM_PID = 0xEF40


async def build_vacuum_module_report(
    is_simulating: bool,
) -> Tuple[CSVReport, VacuumModule]:
    """Report setup for Vacuum Module QC script."""
    test_name = Path(__file__).parent.name.replace("_", "-")
    ui.print_title(test_name.upper())

    port = "" if is_simulating else find_module_port(VACUUM_VID, VACUUM_PID)
    vacuum_module = await VacuumModule.build(
        port=port,
        usb_port=USBPort(port, 0),
        hw_control_loop=asyncio.get_running_loop(),
        simulating=is_simulating,
        sim_serial_number="VACUUM1234" if is_simulating else None,
        execution_manager=ExecutionManager(),
        disconnected_callback=lambda *args: None,
        error_callback=lambda *args: None,
    )
    report = build_report(test_name)
    report.set_operator(
        "simulating" if is_simulating else input("enter OPERATOR name: ")
    )
    git_description = get_git_description()
    report.set_version(git_description)
    return report, vacuum_module


async def _main(cfg: TestConfig) -> None:
    # BUILD REPORT
    report, vacuum_module = await build_vacuum_module_report(cfg.simulate)

    if not cfg.simulate:
        print("Stopping the robot server")
        subprocess.run(["systemctl stop opentrons-robot-server"], shell=True)
        await vacuum_module._reader.read()

    device_info = await vacuum_module._driver.get_device_info()
    report.set_tag(device_info.get("serial", "UNKNOWN"))
    report.set_firmware(device_info.get("version", "UNKNOWN"))

    # RUN TESTS
    try:
        for section, test_run in cfg.tests.items():
            ui.print_title(section.value)
            await test_run(vacuum_module, report, section.value)
    except Exception as e:
        ui.print_error(f"An error occurred: {e}")

    # Always turn off the pump and close the vent
    await vacuum_module.set_vacuum_state(False)
    await vacuum_module.set_vent_state(VentState.CLOSED)

    # SAVE REPORT
    ui.print_title("DONE")
    report.save_to_disk()
    report.print_results()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    # add each test-section as a skippable argument (eg: --skip-connectivity)
    for s in TestSection:
        parser.add_argument(f"--skip-{s.value.lower()}", action="store_true")
        parser.add_argument(f"--only-{s.value.lower()}", action="store_true")
    args = parser.parse_args()
    _t_sections = {s: f for s, f in TESTS if getattr(args, f"only_{s.value.lower()}")}
    if _t_sections:
        assert (
            len(list(_t_sections.keys())) < 2
        ), 'use "--only" for just one test, not multiple tests'
    else:
        _t_sections = {
            s: f for s, f in TESTS if not getattr(args, f"skip_{s.value.lower()}")
        }
    _config = TestConfig(simulate=args.simulate, tests=_t_sections)
    asyncio.run(_main(_config))
