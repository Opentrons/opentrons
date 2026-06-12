"""Protocol for performing deck calibration in the factory."""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from opentrons.calibration_storage.types import AttitudeMatrix
from opentrons.config.defaults_ot3 import DEFAULT_MACHINE_TRANSFORM
from opentrons.hardware_control.ot3_calibration import (
    calibrate_belts,
    calibrate_pipette,
    find_pipette_offset,
    AlignmentShift,
    SLOT_FRONT_LEFT,
    SLOT_FRONT_RIGHT,
    BeltCalibrationData,
    CalibrationSlot,
    SLOT_REAR_LEFT,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount
from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.types import Point
from opentrons_shared_data.errors.exceptions import (
    CalibrationStructureNotFoundError,
    EarlyCapacitiveSenseTrigger,
    EdgeNotFoundError,
    MisalignedGantryError,
)
from opentrons.hardware_control.peripherals import BarcodeScannerModel


from hardware_testing.data.csv_report import (
    CSVReport,
    CSVSection,
    CSVResult,
    CSVLine,
)
from hardware_testing.opentrons_api import helpers_ot3

metadata = {"protocolName": "Production qc Belt calibration"}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


MAX_ERROR_DISTANCE_MM = 0.5

TEST_SLOTS = [1, 3, 9, 10]

LOCALIZE = helpers_ot3.get_system_langauge() == "zh-CN"


@dataclass
class _TestBeltCalibrationData:
    pipette_offset: Point
    deck_offsets: Dict[int, Point]


def _create_csv_report() -> CSVReport:
    return CSVReport(
        test_name="belt-calibration-ot3",
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


def _generate_report(
    before: Optional[_TestBeltCalibrationData],
    details: Optional[Dict[str, Any]],
    attitude: Optional[AttitudeMatrix],
    after: Optional[_TestBeltCalibrationData],
    ctx: ProtocolContext,
) -> None:
    report = _create_csv_report()
    helpers_ot3.set_csv_report_meta_data_ot3(
        ctx._core.get_hardware(), report, operator=ctx.params.operator, ctx=ctx  # type: ignore[attr-defined]
    )  # STORE ATTITUDE
    if attitude:
        report("ATTITUDE", "attitude-x", attitude[0])
        report("ATTITUDE", "attitude-y", attitude[1])
        report("ATTITUDE", "attitude-z", attitude[2])

    # STORE DETAILS
    if details:
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
        zero = Point(x=0, y=0, z=0)
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

    # SAVE REPORT
    report.save_to_disk()
    report.print_results()


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    parameters.add_bool(
        display_name="跳过校准" if LOCALIZE else "Skip calibration",
        variable_name="skip_calibration",
        default=False,
        description="When this is true the robot will not calibrate",
    )
    parameters.add_bool(
        display_name="跳过测试" if LOCALIZE else "Skip test",
        variable_name="skip_test",
        default=False,
        description="When this is true the robot will not test calibration",
    )
    parameters.add_str(
        display_name="操作员" if LOCALIZE else "Operator",
        variable_name="operator",
        default="Unused",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "Unused",
                "Haiyan",
                "Jiqing",
                "Yanglin",
                "Yangyin",
                "Hejie",
                "Zhihua",
                "Huanjun",
                "Chengkun",
                "Xiongjian",
                "Zhougui",
                "Zhiwei",
                "TE",
            ]
        ],
        description="Operator for this QC run",
    )


async def _calibrate_pipette(self, mount: OT3Mount) -> Point:  # noqa: ANN001
    await self.home()
    try:
        offset = await calibrate_pipette(self, mount)  # type: ignore[arg-type]
    except CalibrationStructureNotFoundError as e:
        if not self.is_simulator:
            raise e
        offset = Point(x=0, y=0, z=0)
    finally:
        await self.retract(mount)
    return offset


async def _check_belt_accuracy(
    self, mount: OT3Mount  # noqa: ANN001
) -> Dict[int, Point]:
    ret = {}
    for slot in TEST_SLOTS:
        await self.home()
        try:
            slot_offset = await find_pipette_offset(
                self,
                mount,  # type: ignore[arg-type]
                slot=slot,
                reset_instrument_offset=False,  # type: ignore[arg-type]
            )
            ret[slot] = slot_offset
        except CalibrationStructureNotFoundError as e:
            if self.is_simulator:
                ret[slot] = Point(x=0, y=0, z=0)
            else:
                raise e
        await self.home_z(mount)
    return ret


async def _calibrate_belts(
    self, mount: OT3Mount  # noqa: ANN001
) -> Tuple[AttitudeMatrix, Dict[str, Any]]:
    pip = self.hardware_pipettes[mount.to_mount()]
    assert pip, "no pipette found"
    await self.home()
    try:
        pip_id = pip.pipette_id if pip and pip.pipette_id else "unknown"
        attitude, details = await calibrate_belts(self, mount, pip_id)
    except CalibrationStructureNotFoundError as e:
        if not self.is_simulator:
            raise e
        attitude = DEFAULT_MACHINE_TRANSFORM
        details = {}
    return attitude, details


def run_belt_calibration(
    ctx: ProtocolContext,
) -> Tuple[
    Optional[_TestBeltCalibrationData],
    Optional[AttitudeMatrix],
    Optional[Dict[str, Any]],
    Optional[_TestBeltCalibrationData],
]:
    """Perform a belt calibration and/or test."""
    OT3API._calibrate_pipette = _calibrate_pipette  # type: ignore[attr-defined]
    OT3API._check_belt_accuracy = _check_belt_accuracy  # type: ignore[attr-defined]
    OT3API._calibrate_belts = _calibrate_belts  # type: ignore[attr-defined]
    api = ctx._core.get_hardware()
    api.home()
    mount = OT3Mount.LEFT
    attach_pos = helpers_ot3.get_slot_calibration_square_position_ot3(4)
    current_pos = api.gantry_position(mount)
    api.move_to(mount, attach_pos._replace(z=current_pos.z))
    api.move_rel(mount, Point(x=0, y=0, z=-20))
    found = api.hardware_pipettes[mount.to_mount()] is not None
    while not found:
        ctx.pause(
            "连接移液器，准备好后按“继续”。"
            if LOCALIZE
            else "Attach pipette and press resume when ready"
        )
        found = api.hardware_pipettes[mount.to_mount()] is not None
        if not found:
            ctx.delay(seconds=5, msg="No pipette found try again or quit the protocol.")

    ctx.pause("将探针连接到移液器上" if LOCALIZE else "Attach probe to pipette")

    without_data: Optional[_TestBeltCalibrationData] = None
    with_data: Optional[_TestBeltCalibrationData] = None
    attitude: Optional[AttitudeMatrix] = None
    details: Optional[Dict[str, Any]] = None
    try:
        # calibrate belts
        if not ctx.params.skip_calibration:  # type: ignore[attr-defined]
            ctx.comment("校准皮带" if LOCALIZE else "CALIBRATE BELTS")
            api.reset_instrument_offset(mount)
            attitude, details = api._calibrate_belts(mount)

        # test after
        if not ctx.params.skip_test:  # type: ignore[attr-defined]
            ctx.comment("带校准的测试" if LOCALIZE else "TEST WITH CALIBRATION")
            with_data = _TestBeltCalibrationData(
                pipette_offset=api._calibrate_pipette(mount),
                deck_offsets=api._check_belt_accuracy(mount),
            )
            ctx.comment("无需校准的测试" if LOCALIZE else "TEST WITHOUT CALIBRATION")
            api.reset_robot_calibration()  # set NOMINAL belt calibration
            without_data = _TestBeltCalibrationData(
                pipette_offset=api._calibrate_pipette(mount),
                deck_offsets=api._check_belt_accuracy(mount),
            )
    finally:
        api.retract(mount)

    current_pos = api.gantry_position(mount)
    api.move_to(mount, attach_pos._replace(z=current_pos.z))
    api.move_rel(mount, Point(x=0, y=0, z=-20))
    ctx.pause("从移液器上取下探头" if LOCALIZE else "Remove probe from pipette")
    return without_data, attitude, details, with_data


def run(ctx: ProtocolContext) -> None:
    """Entry point into testing protocol."""
    ctx.comment("启动传送带校准" if LOCALIZE else "starting belt calibration.")
    before: Optional[_TestBeltCalibrationData] = None
    after: Optional[_TestBeltCalibrationData] = None
    attitude: Optional[AttitudeMatrix] = None
    details: Optional[Dict[str, Any]] = None
    if not ctx.is_simulating():
        try:
            before, attitude, details, after = run_belt_calibration(ctx)
        except (
            EarlyCapacitiveSenseTrigger,
            EdgeNotFoundError,
            CalibrationStructureNotFoundError,
            MisalignedGantryError,
        ) as e:
            ctx.pause(f"{str(e)}")
            raise e
        if before and after:
            results: List[float] = []
            zero = Point(x=0, y=0, z=0)
            for slot in TEST_SLOTS:
                dist_after = after.deck_offsets[slot].magnitude_to(zero)
                results.append(dist_after)
            passing = max(results) <= MAX_ERROR_DISTANCE_MM
    else:
        ctx._core.get_hardware().create_simulating_peripheral(
            BarcodeScannerModel.BARCODE_SCANNER_V1
        )
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
        passing = True
    _generate_report(before, details, attitude, after, ctx)
    if not passing:
        raise RuntimeError("Belt calibration did not pass.")
