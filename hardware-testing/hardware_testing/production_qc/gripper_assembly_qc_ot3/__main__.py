"""Gripper assembly QC OT3."""
import argparse
import asyncio
from pathlib import Path

from hardware_testing.data import ui
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Axis

from .config import TestSection, TestConfig, build_report, TESTS, TESTS_INCREMENT


async def _main(cfg: TestConfig) -> None:
    # BUILD REPORT
    test_name = Path(__file__).parent.name.replace("_", "-")
    ui.print_title(test_name)

    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=cfg.simulate,
        pipette_left="p1000_single_v3.3",
        pipette_right="p1000_single_v3.3",
        gripper="GRPV1120230323A01",
    )

    # CSV REPORT
    report = build_report(test_name)
    dut = helpers_ot3.DeviceUnderTest.GRIPPER
    helpers_ot3.set_csv_report_meta_data_ot3(api, report, dut=dut)

    # HOME and ATTACH
    await api.home_z(OT3Mount.GRIPPER)
    await api.home()
    home_pos = await api.gantry_position(OT3Mount.GRIPPER)
    if not api.has_gripper():
        attach_pos = helpers_ot3.get_slot_calibration_square_position_ot3(1)
        attach_pos = attach_pos._replace(z=home_pos.z)
        await helpers_ot3.move_to_arched_ot3(api, OT3Mount.GRIPPER, attach_pos)
        while not api.has_gripper():
            ui.get_user_ready("attach a gripper")
            await api.reset()

    # RUN TESTS
    for section, test_run in cfg.tests.items():
        ui.print_title(section.value)
        await test_run(api, report, section.value)

    # DISENGAGE XY FOR OPERATOR TO RELOAD GRIPPER
    await api.disengage_axes([Axis.X, Axis.Y])
    ui.print_title("DONE")

    # SAVE REPORT
    report.save_to_disk()
    report.print_results()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--increment", action="store_true")
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
    elif args.increment:
        _t_sections = {
            s: f
            for s, f in TESTS_INCREMENT
            if not getattr(args, f"skip_{s.value.lower()}")
        }
    else:
        _t_sections = {
            s: f for s, f in TESTS if not getattr(args, f"skip_{s.value.lower()}")
        }
    _config = TestConfig(
        simulate=args.simulate, tests=_t_sections, increment=args.increment
    )
    asyncio.run(_main(_config))
