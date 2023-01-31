"""Robot assembly QC OT3."""
import argparse
import asyncio
from pathlib import Path

from hardware_testing.opentrons_api import helpers_ot3, types

from .config import TestSection, TestConfig, build_report, TESTS


async def _main(cfg: TestConfig) -> None:
    # GET INFO
    if not cfg.simulate:
        robot_id = input("enter robot sderial number: ")
        operator = input("enter operator name: ")
    else:
        robot_id = "ot3-simulated-A01"
        operator = "simulation"
    software_version = "unknown"

    # BUILD REPORT
    test_name = Path(__file__).parent.name
    report = build_report(test_name)
    report.set_tag(robot_id)
    report.set_operator(operator)
    report.set_version(software_version)

    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=cfg.simulate,
        pipette_left="p1000_single_v3.3",
        pipette_right="p1000_single_v3.3",
        gripper="GRPV102"
    )

    # RUN TESTS
    for section, test_run in cfg.tests.items():
        await test_run(api, report, section.value)

    # SAVE REPORT
    report_path = report.save_to_disk()
    complete_msg = "complete" if report.completed else "incomplete"
    print(f"done, {complete_msg} report -> {report_path}")
    print(report)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    # add each test-section as a skippable argument (eg: --skip-gantry)
    for s in TestSection:
        parser.add_argument(f"--skip-{s.value.lower()}", action="store_true")
    args = parser.parse_args()
    _t_sections = {
        s: f for s, f in TESTS if not getattr(args, f"skip_{s.value.lower()}")
    }
    _config = TestConfig(simulate=args.simulate, tests=_t_sections)
    asyncio.run(_main(_config))
