"""Robot assembly QC OT3."""
from os import environ

# NOTE: this is required to get WIFI test to work
if "OT_SYSTEM_VERSION" not in environ:
    environ["OT_SYSTEM_VERSION"] = "0.0.0"

import argparse
import asyncio
from pathlib import Path

from hardware_testing.data import ui
from hardware_testing.opentrons_api import helpers_ot3

from .config import TestSection, TestConfig, build_report, TESTS


async def _main(cfg: TestConfig) -> None:
    test_name = Path(__file__).parent.name.replace("_", "-")
    ui.print_title(test_name.upper())

    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        use_defaults=True,  # use default belt calibration
        is_simulating=cfg.simulate,
        pipette_left="p1000_single_v3.5",
        pipette_right="p1000_single_v3.5",
        gripper="GRPV122",
    )

    # CSV REPORT
    report = build_report(test_name)
    helpers_ot3.set_csv_report_meta_data_ot3(api, report)

    # RUN TESTS
    for section, test_run in cfg.tests.items():
        ui.print_title(section.value)
        await test_run(api, report, section.value)

    # SAVE REPORT
    ui.print_title("DONE")
    report.save_to_disk()
    report.print_results()


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
