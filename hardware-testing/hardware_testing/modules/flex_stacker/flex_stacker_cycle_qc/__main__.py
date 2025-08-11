"""FLEX Stacker Cycle QC Test."""
from os import environ
from serial.tools.list_ports import comports  # type: ignore[import]

import argparse
import asyncio
import subprocess
from pathlib import Path
from typing import Tuple

from hardware_testing.data import ui
from hardware_testing.data.csv_report import CSVReport

from .config import TestSection, TestConfig, build_report, TESTS
from opentrons.hardware_control.modules import FlexStacker
from opentrons.drivers.rpi_drivers.types import USBPort

STACKER_VID = 0x483
STACKER_PID = 0xEF24

DEFAULT_NUM_CYCLES = 500
DEFAULT_LABWARE_HEIGHT = 102.0  # mm, tiprack

# NOTE: this is required to get WIFI test to work
if "OT_SYSTEM_VERSION" not in environ:
    environ["OT_SYSTEM_VERSION"] = "0.0.0"


async def build_stacker_report(
    is_simulating: bool,
    operator: str,
    port: str = "",
) -> Tuple[CSVReport, FlexStacker]:
    """Report setup for FLEX Stacker Cycle QC Test."""
    test_name = Path(__file__).parent.name.replace("_", "-")
    stacker = await FlexStacker.build(
        port=port,
        usb_port=USBPort(port, 0),
        hw_control_loop=asyncio.get_running_loop(),
        simulating=is_simulating,
    )

    report = build_report(test_name)
    report.set_operator("simulating" if is_simulating else operator)
    return report, stacker


async def _main(
    cfg: TestConfig, cycles: int, labware_height: int, labware_sense: bool
) -> None:
    # BUILD REPORT
    ports = []
    for i in comports():
        print(i)
        if i.vid == STACKER_VID and i.pid == STACKER_PID:
            ports.append(i.device)
            print(f"Found FLEX Stacker on {i.device}")
    assert ports, "could not find connected FLEX Stacker"

    if not cfg.simulate:
        print("Stopping the robot server")
        subprocess.run(["systemctl stop opentrons-robot-server"], shell=True)

    test_name = Path(__file__).parent.name.replace("_", "-")
    ui.print_title(test_name.upper())
    operator = "simulating" if cfg.simulate else input("enter OPERATOR name: ")

    stackers = {}
    for p in ports:
        report, stacker = await build_stacker_report(
            cfg.simulate, operator=operator, port=p
        )
        device_sn = stacker.device_info["serial"]
        report.set_tag(device_sn if device_sn else "UNKNOWN")
        stackers[device_sn] = (report, stacker)

    # RUN TESTS
    try:
        for section, test_run in cfg.tests.items():
            ui.print_title(section.value)
            tasks = []
            for sn, (report, stacker) in stackers.items():
                tasks.append(
                    test_run(
                        stacker,
                        report,
                        section.value,
                        cycles,
                        labware_height,
                        labware_sense,
                    )
                )
            await asyncio.gather(*tasks)  # Run all tasks concurrently
    except Exception as e:
        ui.print_error(f"An error occurred: {e}")

    # SAVE REPORT
    ui.print_title("DONE")
    for sn, (report, stacker) in stackers.items():
        report.save_to_disk()
        report.print_results()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument(
        "--cycles",
        type=int,
        default=DEFAULT_NUM_CYCLES,
        help="number of load/store cycles to run",
    )
    parser.add_argument(
        "--labware-height",
        type=int,
        default=DEFAULT_LABWARE_HEIGHT,
        help="LabwareHeight - stackingOffsetWithLabware, in mm",
    )
    parser.add_argument(
        "--labware-sense",
        action="store_true",
        help="Enable labware sensing",
    )
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
    asyncio.run(_main(_config, args.cycles, args.labware_height, args.labware_sense))
