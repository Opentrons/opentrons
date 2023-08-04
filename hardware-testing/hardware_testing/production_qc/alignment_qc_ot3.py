"""QC Belt Calibration."""
import argparse
import asyncio
from typing import List, Dict, Union
from pathlib import Path

from opentrons.hardware_control.ot3api import OT3API
from opentrons_shared_data.errors.exceptions import (
    EarlyCapacitiveSenseTrigger,
    EdgeNotFoundError,
    CalibrationStructureNotFoundError,
    MisalignedGantryError,
)

from hardware_testing.data import get_git_description
from hardware_testing.data.csv_report import (
    RESULTS_OVERVIEW_TITLE,
    CSVReport,
    CSVSection,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api import types
from hardware_testing.data import ui

from hardware_testing.production_qc.belt_calibration_ot3 import (
    run_belt_calibration,
    TEST_SLOTS,
)
from hardware_testing.opentrons_api import helpers_ot3

MAX_ERROR_DISTANCE_MM = 0.5


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    lines.append(CSVLine("distance-after-max-spec-mm", [float]))
    lines.append(CSVLine(f"pipette-offset-before", [float, float, float]))
    lines.append(CSVLine(f"pipette-offset-after", [float, float, float]))
    lines.append(
        CSVLine(
            f"attitude", [float, float, float, float, float, float, float, float, float]
        )
    )
    for slot in TEST_SLOTS:
        lines.append(CSVLine(f"slot-offset-before-{slot}", [float, float, float]))
    for slot in TEST_SLOTS:
        lines.append(CSVLine(f"slot-offset-after-{slot}", [float, float, float]))
    for slot in TEST_SLOTS:
        lines.append(CSVLine(f"slot-distance-before-{slot}", [float]))
    for slot in TEST_SLOTS:
        lines.append(CSVLine(f"slot-distance-after-{slot}", [float, CSVResult]))
    for slot in TEST_SLOTS:
        lines.append(CSVLine(f"slot-distance-improvement-{slot}", [float, CSVResult]))
    return lines


def _create_csv_report() -> CSVReport:
    return CSVReport(
        test_name=Path(__file__).name.replace("_", "-"),
        sections=[
            CSVSection(
                title="ATTITUDE", lines=[
                    CSVLine("attitude-x", [float, float, float]),
                    CSVLine("attitude-y", [float, float, float]),
                    CSVLine("attitude-z", [float, float, float]),
                ]
            ),
            CSVSection(
                title="PIPETTE-OFFSETS", lines=[
                    CSVLine("before", [float, float, float]),
                    CSVLine("after", [float, float, float]),
                ]
            ),
            CSVSection(
                title="SLOT-OFFSETS", lines=[
                    CSVLine(f"offset-{when}-{slot}", [float, float, float])
                    for slot in TEST_SLOTS
                    for when in ["before", "after"]
                ]
            ),
            CSVSection(
                title="SLOT-DISTANCES", lines=[
                    CSVLine("distance-after-max-spec-mm", [float])
                ] + [
                    CSVLine(f"distance-before-after-{slot}", [float, float, CSVResult])
                    for slot in TEST_SLOTS
                ]
            ),
        ],
    )


async def _main(is_simulating: bool) -> None:
    """Run."""
    ui.print_header("BELT CALIBRATION")

    # CREATE REPORT
    report = _create_csv_report()
    report.set_version(get_git_description())

    # GET OPERATOR
    if not is_simulating:
        report.set_operator(input("enter operator name: "))
    else:
        report.set_operator("simulation")

    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        use_defaults=True,  # includes default XY calibration matrix
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.5",
    )

    # GET ROBOT SERIAL NUMBER
    robot_id = helpers_ot3.get_robot_serial_ot3(api)
    print(f"robot SN: {robot_id}")
    if not robot_id:
        ui.print_error("no robot serial number found")
    report.set_tag(robot_id)
    report.set_robot_id(robot_id)
    if not api.is_simulator:
        barcode = input("scan robot barcode: ").strip()
        report.set_device_id(robot_id, CSVResult.from_bool(barcode == robot_id))
    else:
        report.set_device_id(robot_id, CSVResult.PASS)

    # ATTACH PIPETTE
    mount = types.OT3Mount.LEFT
    await api.retract(mount)
    has_pipette = await helpers_ot3.wait_for_instrument_presence(api, mount, presence=True)
    if not has_pipette:
        print("no pipette, skipping belt calibration")
        return

    # RUN TEST
    try:
        before, attitude, after = await run_belt_calibration(api, mount, test=True)
    except (
        EarlyCapacitiveSenseTrigger,
        EdgeNotFoundError,
        CalibrationStructureNotFoundError,
        MisalignedGantryError,
    ) as e:
        ui.print_error(e)
        return

    # STORE ATTITUDE
    report("ATTITUDE", "attitude-x", attitude[0])
    report("ATTITUDE", "attitude-y", attitude[1])
    report("ATTITUDE", "attitude-z", attitude[2])

    # STORE PIPETTE-OFFSET CALIBRATIONS
    bef_o = before.pipette_offset
    after_o = after.pipette_offset
    report("PIPETTE-OFFSETS", "before", [bef_o.x, bef_o.y, bef_o.z])
    report("PIPETTE-OFFSETS", "after", [after_o.x, after_o.y, after_o.z])

    # STORE TEST-SLOT OFFSETS
    report("SLOT-DISTANCES", "distance-after-max-spec-mm", [MAX_ERROR_DISTANCE_MM])
    zero = types.Point(x=0, y=0, z=0)
    for slot in TEST_SLOTS:
        ob = before.deck_offsets[slot]
        oa = after.deck_offsets[slot]
        dist_before = before.deck_offsets[slot].magnitude_to(zero)
        dist_after = after.deck_offsets[slot].magnitude_to(zero)
        dist_after_result = CSVResult.from_bool(
            dist_after <= MAX_ERROR_DISTANCE_MM
        )
        report("SLOT-OFFSETS", f"offset-before-{slot}", [ob.x, ob.y, ob.z])
        report("SLOT-OFFSETS", f"offset-after-{slot}", [oa.x, oa.y, oa.z])
        report(
            "SLOT-DISTANCES",
            f"distance-before-after-{slot}",
            [dist_before, dist_after, dist_after_result])

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
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
