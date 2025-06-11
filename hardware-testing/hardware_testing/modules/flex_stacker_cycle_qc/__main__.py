"""FLEX Stacker Cycle QC Test."""
from os import environ
from serial.tools.list_ports import comports  # type: ignore[import]
STACKER_VID = 0x483
STACKER_PID = 0xEF24

# NOTE: this is required to get WIFI test to work
if "OT_SYSTEM_VERSION" not in environ:
    environ["OT_SYSTEM_VERSION"] = "0.0.0"

import argparse
import asyncio
import subprocess
from pathlib import Path
from typing import Tuple

from hardware_testing.data import ui
from hardware_testing.data.csv_report import CSVReport

from .config import TestSection, TestConfig, build_report, TESTS
from opentrons.hardware_control.modules import FlexStacker

async def build_stacker_report(
    is_simulating: bool, port: str = ""
) -> Tuple[CSVReport, FlexStacker]:
    """Report setup for FLEX Stacker Cycle QC Test."""
    test_name = Path(__file__).parent.name.replace("_", "-")
    ui.print_title(test_name.upper())

    stacker = await FlexStacker.build(port=port,
                                usb_port=None,
                                execution_manager=None,
                                loop=asyncio.get_running_loop(),
                                simulating=is_simulating)


    report = build_report(test_name)
    report.set_operator(
        "simulating" if is_simulating else input("enter OPERATOR name: ")
    )
    return report, stacker


async def _main(cfg: TestConfig) -> None:
    # BUILD REPORT
    port = []
    for i in comports():
        if i.vid == STACKER_VID and i.pid == STACKER_PID:
            port.append(i.device)
            break
    assert port, "could not find connected FLEX Stacker"
    report, stacker = await build_stacker_report(cfg.simulate, port=port[0])

    if not cfg.simulate:
        print("Stopping the robot server")
        subprocess.run(["systemctl stop opentrons-robot-server"], shell=True)

    device_info = await stacker._driver.get_device_info()
    report.set_tag(device_info.sn if device_info.sn else "UNKNOWN")

    # RUN TESTS
    try:
        for section, test_run in cfg.tests.items():
            ui.print_title(section.value)
            await test_run(stacker, report, section.value)
    except Exception as e:
        ui.print_error(f"An error occurred: {e}")

    # SAVE REPORT
    ui.print_title("DONE")
    report.save_to_disk()
    report.print_results()

    # Restart the robot server
    if not cfg.simulate:
        print("Starting the robot server")
        subprocess.run(["systemctl restart opentrons-robot-server &"], shell=True)


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
