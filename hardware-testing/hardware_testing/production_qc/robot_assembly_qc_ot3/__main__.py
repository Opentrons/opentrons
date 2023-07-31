"""Robot assembly QC OT3."""
import argparse
import asyncio
from pathlib import Path

from hardware_testing.data import ui, get_git_description
from hardware_testing.data.csv_report import RESULTS_OVERVIEW_TITLE, CSVResult
from hardware_testing.opentrons_api import helpers_ot3

from .config import TestSection, TestConfig, build_report, TESTS


async def _main(cfg: TestConfig) -> None:
    # BUILD REPORT
    test_name = Path(__file__).parent.name
    report = build_report(test_name)
    ui.print_title(test_name.replace("_", " ").upper())
    report.set_version(get_git_description())

    # GET OPERATOR
    if not cfg.simulate:
        report.set_operator(input("enter operator name: "))
    else:
        report.set_operator("simulation")

    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        use_defaults=True,  # includes default XY calibration matrix
        is_simulating=cfg.simulate,
        pipette_left="p1000_single_v3.3",
        pipette_right="p1000_single_v3.3",
        gripper="GRPV102",
    )

    # GET ROBOT SERIAL NUMBER
    robot_id = helpers_ot3.get_robot_serial_ot3(api)
    report.set_tag(robot_id)
    report.set_robot_id(robot_id)
    if not api.is_simulator:
        barcode = input("scan robot barcode: ").strip()
        report.set_device_id(robot_id, CSVResult.from_bool(barcode == robot_id))
    else:
        report.set_device_id(robot_id, CSVResult.PASS)

    # RUN TESTS
    for section, test_run in cfg.tests.items():
        ui.print_title(section.value)
        await test_run(api, report, section.value)

    ui.print_title("DONE")

    # SAVE REPORT
    report_path = report.save_to_disk()
    complete_msg = "complete" if report.completed else "incomplete"
    print(f"done, {complete_msg} report -> {report_path}")
    print("Overall Results:")
    for line in report[RESULTS_OVERVIEW_TITLE].lines:
        print(f" - {line.tag}: {line.result}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    # add each test-section as a skippable argument (eg: --skip-gantry)
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
