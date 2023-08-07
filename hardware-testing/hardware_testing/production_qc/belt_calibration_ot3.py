"""QC Belt Calibration."""
import argparse
import asyncio
from dataclasses import dataclass
from pathlib import Path
from pprint import pprint
from typing import Optional, Dict, Tuple, Any

from opentrons.config.defaults_ot3 import DEFAULT_MACHINE_TRANSFORM
from opentrons.calibration_storage.types import AttitudeMatrix
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_belts,
    calibrate_pipette,
    find_pipette_offset,
    SLOT_FRONT_LEFT,
    SLOT_FRONT_RIGHT,
    SLOT_REAR_LEFT,
    BeltCalibrationData,
    CalibrationSlot,
    AlignmentShift,
)
from opentrons_shared_data.errors.exceptions import (
    EarlyCapacitiveSenseTrigger,
    EdgeNotFoundError,
    CalibrationStructureNotFoundError,
    MisalignedGantryError,
)

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVSection,
    CSVResult,
    CSVLine,
)
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

MAX_ERROR_DISTANCE_MM = 0.5

TEST_SLOTS = [1, 3, 9, 10]


@dataclass
class _TestBeltCalibrationData:
    pipette_offset: types.Point
    deck_offsets: Dict[int, types.Point]


async def _calibrate_pipette(api: OT3API, mount: types.OT3Mount) -> types.Point:
    ui.print_header("CALIBRATE PIPETTE")
    await api.home()
    try:
        offset = await calibrate_pipette(api, mount)  # type: ignore[arg-type]
    except CalibrationStructureNotFoundError as e:
        if not api.is_simulator:
            raise e
        offset = types.Point(x=0, y=0, z=0)
    finally:
        await api.retract(mount)
    print(f"pipette offset: {offset}")
    return offset


async def _check_belt_accuracy(
    api: OT3API, mount: types.OT3Mount
) -> Dict[int, types.Point]:
    ui.print_header("CHECK BELT ACCURACY")
    ret = {}
    for slot in TEST_SLOTS:
        await api.home()
        try:
            slot_offset = await find_pipette_offset(
                api, mount, slot=slot, reset_instrument_offset=False  # type: ignore[arg-type]
            )
            ret[slot] = slot_offset
            print(f"Slot #{slot}: {slot_offset}")
        except CalibrationStructureNotFoundError as e:
            if api.is_simulator:
                ret[slot] = types.Point(x=0, y=0, z=0)
            else:
                raise e
        await api.home_z(mount)

    def _short(num: float, decimals: int = 2) -> str:
        _short_num = str(round(num, decimals))
        _append = {1: ".00", 2: "00", 3: "0"}.get(len(_short_num), "")
        return _short_num + _append

    def _p_str(_s: int) -> str:
        _p = ret.get(_s)
        if not _p:
            return "(                )"
        return f"({_short(_p.x)}, {_short(_p.y)}, {_short(_p.z)})"

    print(f"Deck Row A: {_p_str(10)} | {_p_str(11)} | trash")
    print(f"Deck Row B: {_p_str(7)} | {_p_str(8)} | {_p_str(9)}")
    print(f"Deck Row C: {_p_str(4)} | {_p_str(5)} | {_p_str(6)}")
    print(f"Deck Row D: {_p_str(1)} | {_p_str(2)} | {_p_str(3)}")
    return ret


async def _calibrate_belts(
    api: OT3API, mount: types.OT3Mount
) -> Tuple[AttitudeMatrix, Dict[str, Any]]:
    ui.print_header("PROBE the DECK")
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip, "no pipette found"
    await api.home()
    try:
        pip_id = pip.pipette_id if pip and pip.pipette_id else "unknown"
        attitude, details = await calibrate_belts(api, mount, pip_id)
    except CalibrationStructureNotFoundError as e:
        if not api.is_simulator:
            raise e
        attitude = DEFAULT_MACHINE_TRANSFORM
        details = {}
    print("new attitude:")
    pprint(attitude)
    print("details")
    pprint(details)
    return attitude, details


async def run_belt_calibration(
    api: OT3API, mount: types.OT3Mount, test: bool
) -> Tuple[
    Optional[_TestBeltCalibrationData],
    AttitudeMatrix,
    Dict[str, Any],
    Optional[_TestBeltCalibrationData],
]:
    """Run belt calibration."""
    # setup
    print("homing")
    await api.home()

    ui.print_header("ATTACH PIPETTE + PROBE")
    attach_pos = helpers_ot3.get_slot_calibration_square_position_ot3(4)
    current_pos = await api.gantry_position(mount)
    await api.move_to(mount, attach_pos._replace(z=current_pos.z))
    await api.move_rel(mount, types.Point(x=0, y=0, z=-20))
    has_pipette = await helpers_ot3.wait_for_instrument_presence(
        api, mount, presence=True
    )
    if not has_pipette:
        raise RuntimeError("no pipette")
    if not api.is_simulator:
        ui.get_user_ready("ATTACH a probe to pipette")

    without_data = None
    with_data = None

    try:
        # calibrate belts
        ui.print_header("CALIBRATE BELTS")
        await api.reset_instrument_offset(mount)
        attitude, details = await _calibrate_belts(api, mount)

        # test after
        if test:
            ui.print_header("TEST WITH CALIBRATION")
            with_data = _TestBeltCalibrationData(
                pipette_offset=await _calibrate_pipette(api, mount),
                deck_offsets=await _check_belt_accuracy(api, mount),
            )
            ui.print_header("TEST WITHOUT CALIBRATION")
            print("resetting robot calibration")
            api.reset_robot_calibration()  # set NOMINAL belt calibration
            without_data = _TestBeltCalibrationData(
                pipette_offset=await _calibrate_pipette(api, mount),
                deck_offsets=await _check_belt_accuracy(api, mount),
            )
    finally:
        await api.retract(mount)
    # remove probe
    current_pos = await api.gantry_position(mount)
    await api.move_to(mount, attach_pos._replace(z=current_pos.z))
    if not api.is_simulator:
        ui.get_user_ready("REMOVE probe from pipette")
    return without_data, attitude, details, with_data


def _create_csv_report() -> CSVReport:
    return CSVReport(
        test_name=Path(__file__).name.replace("_", "-").replace(".py", ""),
        sections=[
            CSVSection(
                title="ATTITUDE",
                lines=[
                    CSVLine("attitude-x", [float, float, float]),
                    CSVLine("attitude-y", [float, float, float]),
                    CSVLine("attitude-z", [float, float, float]),
                ],
            ),
            CSVSection(
                title="BELT-CALIBRATION-POSITIONS",
                lines=[
                    CSVLine("slot-front-left", [float, float, float]),
                    CSVLine("slot-front-right", [float, float, float]),
                    CSVLine("slot-rear-left", [float, float, float]),
                ],
            ),
            CSVSection(
                title="BELT-CALIBRATION-SHIFTS",
                lines=[
                    CSVLine(align_shift.value, [float])
                    for align_shift in AlignmentShift
                ],
            ),
            CSVSection(
                title="PIPETTE-OFFSETS",
                lines=[
                    CSVLine("before", [float, float, float]),
                    CSVLine("after", [float, float, float]),
                ],
            ),
            CSVSection(
                title="SLOT-OFFSETS",
                lines=[
                    CSVLine(f"offset-{when}-{slot}", [float, float, float])
                    for slot in TEST_SLOTS
                    for when in ["before", "after"]
                ],
            ),
            CSVSection(
                title="SLOT-DISTANCES",
                lines=[CSVLine("distance-after-max-spec-mm", [float])]  # type: ignore[arg-type]
                + [
                    CSVLine(f"distance-before-after-{slot}", [float, float, CSVResult])
                    for slot in TEST_SLOTS
                ],
            ),
        ],
    )


async def run(is_simulating: bool, skip_test: bool) -> None:
    """Run."""
    ui.print_header("BELT CALIBRATION")

    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        use_defaults=True,  # includes default XY calibration matrix
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.5",
    )

    # CREATE REPORT
    report = _create_csv_report()
    helpers_ot3.set_csv_report_meta_data_ot3(api, report)

    # RUN TEST
    try:
        before, attitude, details, after = await run_belt_calibration(
            api, types.OT3Mount.LEFT, test=not skip_test
        )
    except (
        EarlyCapacitiveSenseTrigger,
        EdgeNotFoundError,
        CalibrationStructureNotFoundError,
        MisalignedGantryError,
    ) as e:
        ui.print_error(str(e))
        return

    if api.is_simulator:
        nom_front_left = helpers_ot3.get_slot_calibration_square_position_ot3(
            SLOT_FRONT_LEFT
        )
        nom_front_right = helpers_ot3.get_slot_calibration_square_position_ot3(
            SLOT_FRONT_RIGHT
        )
        nom_rear_left = helpers_ot3.get_slot_calibration_square_position_ot3(
            SLOT_REAR_LEFT
        )
        sim_cal_data = BeltCalibrationData(
            CalibrationSlot(SLOT_FRONT_LEFT, nom_front_left, nom_front_left),
            CalibrationSlot(SLOT_FRONT_RIGHT, nom_front_right, nom_front_right),
            CalibrationSlot(SLOT_REAR_LEFT, nom_rear_left, nom_rear_left),
        )
        details = sim_cal_data.build_details()

    # STORE ATTITUDE
    report("ATTITUDE", "attitude-x", attitude[0])
    report("ATTITUDE", "attitude-y", attitude[1])
    report("ATTITUDE", "attitude-z", attitude[2])

    # STORE DETAILS
    report(
        "BELT-CALIBRATION-POSITIONS",
        "slot-front-left",
        list(details["slots"]["front_left"]),
    )
    report(
        "BELT-CALIBRATION-POSITIONS",
        "slot-front-right",
        list(details["slots"]["front_right"]),
    )
    report(
        "BELT-CALIBRATION-POSITIONS",
        "slot-rear-left",
        list(details["slots"]["rear_left"]),
    )
    for align_shift in AlignmentShift:
        report(
            "BELT-CALIBRATION-SHIFTS",
            align_shift.value,
            [details[align_shift.value]["shift"]],
        )

    if before and after:
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
            dist_after_result = CSVResult.from_bool(dist_after <= MAX_ERROR_DISTANCE_MM)
            report("SLOT-OFFSETS", f"offset-before-{slot}", [ob.x, ob.y, ob.z])
            report("SLOT-OFFSETS", f"offset-after-{slot}", [oa.x, oa.y, oa.z])
            report(
                "SLOT-DISTANCES",
                f"distance-before-after-{slot}",
                [dist_before, dist_after, dist_after_result],
            )

    ui.print_title("DONE")

    # SAVE REPORT
    report.save_to_disk()
    report.print_results()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--skip-test", action="store_true")
    args = parser.parse_args()
    asyncio.run(run(args.simulate, args.skip_test))
