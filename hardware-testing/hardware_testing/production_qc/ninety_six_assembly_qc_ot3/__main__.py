"""96 Channel assembly QC OT3."""
import argparse
import asyncio
from pathlib import Path

from hardware_testing.data import ui, get_git_description
from hardware_testing.data.csv_report import RESULTS_OVERVIEW_TITLE, CSVResult
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Axis

from .config import TestSection, TestConfig, build_report, TESTS


async def _main(cfg: TestConfig) -> None:
    # BUILD REPORT
    test_name = Path(__file__).parent.name
    ui.print_title(test_name.replace("_", " ").upper())
    report = build_report(test_name.replace("_", "-"))
    report.set_version(get_git_description())
    if not cfg.simulate:
        report.set_operator(input("enter operator name: "))
    else:
        report.set_operator("simulation")

    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=cfg.simulate,
        pipette_left="p1000_96_v3.4",
    )
    report.set_robot_id(helpers_ot3.get_robot_serial_ot3(api))

    # PIPETTE SERIAL NUMBER
    mount = OT3Mount.LEFT
    pipette = api.hardware_pipettes[mount.to_mount()]
    assert pipette
    pipette_id = str(pipette.pipette_id)
    report.set_tag(pipette_id)
    if not api.is_simulator:
        barcode = input("scan pipette barcode: ").strip()
        barcode_result = CSVResult(barcode == pipette_id)
        report.set_device_id(pipette_id, barcode_result)
    else:
        report.set_device_id(pipette_id, CSVResult.PASS)

    # HOME and ATTACH
    await api.home()
    home_pos = await api.gantry_position(mount)
    attach_pos = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    attach_pos = attach_pos._replace(z=home_pos.z)
    if not api.hardware_pipettes[mount.to_mount()]:
        # FIXME: Do not home the plunger using the normal home method.
        #        See section below where we use OT3Controller to home it.
        await api.home()
        await helpers_ot3.move_to_arched_ot3(api, mount, attach_pos)
        while not api.hardware_pipettes[mount.to_mount()]:
            ui.get_user_ready("attach a 96ch pipette")
            await api.reset()
        await api.home_z(mount)

    # FIXME: remove this once the "'L' format requires 0 <= number <= 4294967295" bug is gone
    await api._backend.home([Axis.P_L], api.gantry_load)
    await api.refresh_positions()

    # RUN TESTS
    for section, test_run in cfg.tests.items():
        ui.print_title(section.value)
        await test_run(api, report, section.value)

    # RELOAD PIPETTE
    ui.print_title("DONE")
    await helpers_ot3.move_to_arched_ot3(api, mount, attach_pos)

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
        parser.add_argument(
            f"--skip-{s.value.lower()}".replace("_", "-"), action="store_true"
        )
        parser.add_argument(
            f"--only-{s.value.lower()}".replace("_", "-"), action="store_true"
        )
    args = parser.parse_args()
    _t_sections = {
        s: f
        for s, f in TESTS
        if getattr(args, f"only_{s.value.lower().replace('-', '_')}")
    }
    if _t_sections:
        assert (
            len(list(_t_sections.keys())) < 2
        ), 'use "--only" for just one test, not multiple tests'
    else:
        _t_sections = {
            s: f
            for s, f in TESTS
            if not getattr(args, f"skip_{s.value.lower().replace('-', '_')}")
        }
    _config = TestConfig(simulate=args.simulate, tests=_t_sections)
    asyncio.run(_main(_config))
