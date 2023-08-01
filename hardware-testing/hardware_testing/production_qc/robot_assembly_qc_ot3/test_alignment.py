"""Test Belt Calibration."""
from typing import List, Dict, Union

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    EarlyCapacitiveSenseTrigger,
    EdgeNotFoundError,
    CalibrationStructureNotFoundError,
    AlignmentError,
)

from hardware_testing.data.csv_report import (
    CSVReport,
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
from .utils import wait_for_instrument_presence

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


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    ui.print_header("BELT CALIBRATION")
    report(section, "distance-after-max-spec-mm", [MAX_ERROR_DISTANCE_MM])

    # ATTACH PIPETTE
    mount = types.OT3Mount.LEFT
    await api.retract(mount)
    has_pipette = await wait_for_instrument_presence(api, mount, presence=True)
    if not has_pipette:
        print("no pipette, skipping belt calibration")
        return

    # RUN SEQUENCE
    try:
        before, attitude, after = await run_belt_calibration(api, mount, test=True)
    except (
            EarlyCapacitiveSenseTrigger,
            EdgeNotFoundError,
            CalibrationStructureNotFoundError,
            AlignmentError,
    ) as e:
        ui.print_error(e)
        return

    # STORE ATTITUDE
    report(section, "attitude", attitude[0] + attitude[1] + attitude[2])

    # STORE PIPETTE-OFFSET CALIBRATIONS
    bef_o = before.pipette_offset
    report(
        section,
        "pipette-offset-before",
        [bef_o.x, bef_o.y, bef_o.z],
    )
    after_o = after.pipette_offset
    report(
        section,
        "pipette-offset-after",
        [after_o.x, after_o.y, after_o.z],
    )

    # COMPARE BEFORE/AFTER
    distance_before: Dict[int, float] = {
        slot: o.magnitude_to(types.Point(x=0, y=0, z=0))
        for slot, o in before.deck_offsets.items()
    }
    distance_after: Dict[int, float] = {
        slot: o.magnitude_to(types.Point(x=0, y=0, z=0))
        for slot, o in after.deck_offsets.items()
    }
    distance_improvement: Dict[int, float] = {
        slot: distance_before[slot] - distance_after[slot]
        for slot in TEST_SLOTS
    }
    for slot in TEST_SLOTS:
        o = before.deck_offsets[slot]
        report(
            section,
            f"slot-offset-before-{slot}",
            [o.x, o.y, o.z],
        )
        o = after.deck_offsets[slot]
        report(
            section,
            f"slot-offset-after-{slot}",
            [o.x, o.y, o.z],
        )
        report(section, f"slot-distance-before-{slot}", [distance_before[slot]])
        dist_after_result = CSVResult.from_bool(distance_after[slot] <= MAX_ERROR_DISTANCE_MM)
        report(section, f"slot-distance-after-{slot}", [distance_after[slot], dist_after_result])
        dist_improve_result = CSVResult.from_bool(distance_improvement[slot] >= 0)
        report(section, f"slot-distance-improvement-{slot}", [distance_improvement[slot], dist_improve_result])
