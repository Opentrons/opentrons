"""Test Instruments."""
from typing import List, Tuple, Optional, Union

from opentrons.config.types import CapacitivePassSettings
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Axis, OT3Mount, Point, GripperProbe
from hardware_testing.data import ui

PLUNGER_TOLERANCE_MM = 0.2

GRIPPER_Z_ENDSTOP_RETRACT_MM = 0.5
GRIPPER_GRIP_FORCE = 20
GRIPPER_JAW_WIDTH_TOLERANCE_MM = 3.0  # FIXME: this is way too big

GRIPPER_MAX_Z_TRAVEL_MM = 170.025
GRIPPER_Z_NO_SKIP_TRAVEL_MM = GRIPPER_MAX_Z_TRAVEL_MM - 30  # avoid hitting clips

Z_PROBE_DISTANCE_MM = 100
Z_PROBE_TIME_SECONDS = 5
PROBE_SETTINGS = CapacitivePassSettings(
    prep_distance_mm=Z_PROBE_DISTANCE_MM,
    max_overrun_distance_mm=0,
    speed_mm_per_s=Z_PROBE_DISTANCE_MM / Z_PROBE_TIME_SECONDS,
    sensor_threshold_pf=1.0,
)

RELATIVE_MOVE_FROM_HOME_DELTA = Point(x=-500, y=-300)
RELATIVE_MOVE_FROM_HOME_SPEED = 200


PIPETTE_TESTS = {
    "id": [str, str, CSVResult],
    "plunger-home": [float, float, CSVResult],
    "plunger-max": [float, float, CSVResult],
    "plunger-min": [float, float, CSVResult],
    "probe-distance": [float, float, CSVResult],
}
GRIPPER_TESTS = {
    "id": [str, str, CSVResult],
    "no-skip": [CSVResult],
    "jaw-min": [float, float, CSVResult],
    "jaw-max": [float, float, CSVResult],
    "probe-distance-front": [float, float, CSVResult],
    "probe-distance-rear": [float, float, CSVResult],
}


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    tests: List[Union[CSVLine, CSVLineRepeating]] = list()
    for t, d in PIPETTE_TESTS.items():
        for m in ["left", "right"]:
            tests.append(CSVLine(f"{m}-{t}", d))  # type: ignore[arg-type]
    for t, d in GRIPPER_TESTS.items():
        tests.append(CSVLine(f"gripper-{t}", d))  # type: ignore[arg-type]
    return tests


async def _get_pip_mounts(api: OT3API) -> List[OT3Mount]:
    await api.reset()
    pip_mounts = [
        OT3Mount.from_mount(_m) for _m, _p in api.hardware_pipettes.items() if _p
    ]
    print(f"found pipettes: {pip_mounts}")
    return pip_mounts


async def _has_gripper(api: OT3API) -> bool:
    await api.reset()
    return api.has_gripper()


async def _get_plunger_positions(api: OT3API, mount: OT3Mount) -> Tuple[float, float]:
    axis = OT3Axis.of_main_tool_actuator(mount)
    estimates = await api.current_position_ot3(mount)
    encoders = await api.encoder_current_position_ot3(mount)
    return estimates[axis], encoders[axis]


async def _test_current_position_and_record_result(
    api: OT3API, mount: OT3Mount, report: CSVReport, section: str, tag: str
) -> None:
    estimate, encoder = await _get_plunger_positions(api, mount)
    result = CSVResult.from_bool(abs(estimate - encoder) < PLUNGER_TOLERANCE_MM)
    report(section, tag, [estimate, encoder, result])


async def _probe_mount_and_record_result(
    api: OT3API,
    mount: OT3Mount,
    report: CSVReport,
    section: str,
    tag: str,
    probe: Optional[GripperProbe] = None,
) -> None:
    # home
    z_ax = OT3Axis.by_mount(mount)
    await api.home([z_ax])

    # attach probe
    if mount == OT3Mount.GRIPPER:
        # NOTE: only the gripper physically requires a probe to be attached
        #       because you cannot touch the sensor otherwise
        assert probe, "you must specify which gripper probe (front/rear) you are using"
        await api.grip(GRIPPER_GRIP_FORCE)
        if not api.is_simulator:
            ui.get_user_ready(f"attach {probe.name} calibration probe")
        api.add_gripper_probe(probe)
    else:
        await api.add_tip(mount, 0.1)

    # probe downwards
    pos = await api.gantry_position(mount)
    height_of_probe_full_travel = pos.z - Z_PROBE_DISTANCE_MM
    if not api.is_simulator:
        ui.get_user_ready("about to probe DOWN")
    print("touch with your finger to stop the probing motion")
    height_of_probe_stopped = await api.capacitive_probe(
        mount, z_ax, height_of_probe_full_travel, PROBE_SETTINGS
    )

    # calculate distance between stopped position,
    # and position if we did a full travel
    height_diff = height_of_probe_stopped - height_of_probe_full_travel
    result = CSVResult.from_bool(Z_PROBE_DISTANCE_MM - 1 > abs(height_diff) > 1)
    results = [
        float(height_of_probe_full_travel),
        float(height_of_probe_stopped),
        result,
    ]
    report(section, tag, results)

    # remove probe
    if mount == OT3Mount.GRIPPER:
        if not api.is_simulator:
            ui.get_user_ready("remove calibration probe")
        api.remove_gripper_probe()
        await api.ungrip()
    else:
        await api.remove_tip(mount)


async def _test_pipette(
    api: OT3API, mount: OT3Mount, report: CSVReport, section: str
) -> None:
    await api.cache_instruments()
    mnt_tag = mount.name.lower()
    pip = api.hardware_pipettes[mount.to_mount()]
    if not pip:
        ui.print_error(f"no pipette found on {mount.value} mount")
        return
    pip_id = helpers_ot3.get_pipette_serial_ot3(pip)
    pip_ax = OT3Axis.of_main_tool_actuator(mount)
    top, _, _, drop_tip = helpers_ot3.get_plunger_positions_ot3(api, mount)

    # PIPETTE-ID
    if not api.is_simulator:
        user_id = input("scan pipette serial number: ").strip()
    else:
        user_id = str(pip_id)
    result = CSVResult.from_bool(pip_id == user_id.strip())
    print(f"pipette: {pip_id}, barcode={user_id.strip()}")
    report(section, f"{mnt_tag}-id", [pip_id, user_id, result])

    # PLUNGER-HOME
    print("homing plunger...")
    await api.home([pip_ax])
    await _test_current_position_and_record_result(
        api, mount, report, section, f"{mnt_tag}-plunger-home"
    )
    # PLUNGER-MAX
    print(f"moving to drop_tip ({drop_tip}mm)")
    await helpers_ot3.move_plunger_absolute_ot3(api, mount, drop_tip - 1)
    await _test_current_position_and_record_result(
        api, mount, report, section, f"{mnt_tag}-plunger-max"
    )
    # PLUNGER-MIN
    print(f"moving to top ({top}mm)")
    await helpers_ot3.move_plunger_absolute_ot3(api, mount, top + 1)
    await _test_current_position_and_record_result(
        api, mount, report, section, f"{mnt_tag}-plunger-min"
    )

    # PROBE-DISTANCE
    await _probe_mount_and_record_result(
        api, mount, report, section, f"{mnt_tag}-probe-distance"
    )


async def _test_gripper(api: OT3API, report: CSVReport, section: str) -> None:
    await api.cache_instruments()
    mount = OT3Mount.GRIPPER
    z_ax = OT3Axis.by_mount(mount)
    jaw_ax = OT3Axis.of_main_tool_actuator(mount)
    gripper = api._gripper_handler.gripper
    if not gripper:
        ui.print_error("no gripper found")
        return
    gripper_id = gripper.gripper_id
    jaw_widths = gripper.config.geometry.jaw_width

    # GRIPPER-ID
    if not api.is_simulator:
        user_id = input("scan gripper serial number: ").strip()
    else:
        user_id = str(gripper_id)
    result = CSVResult.from_bool(gripper_id == user_id.strip())
    print(f"gripper: {gripper_id}, barcode: {user_id}")
    report(section, "gripper-id", [gripper_id, user_id, result])

    # NO-SKIP
    # FIXME: DVT units had encoders added, so change this test to use them
    async def _z_is_hitting_endstop() -> bool:
        if api.is_simulator:
            return True
        _switches = await api.get_limit_switches()
        return _switches[z_ax]

    async def _z_is_not_hitting_endstop() -> bool:
        if api.is_simulator:
            return True
        return not await _z_is_hitting_endstop()

    await api.home([z_ax])
    await api.move_rel(mount, Point(z=-5))
    await api.home([z_ax])
    try:
        assert (
            await _z_is_hitting_endstop()
        ), "error: not hitting gripper Z endstop after homing"
        await api.move_rel(mount, Point(z=-GRIPPER_Z_ENDSTOP_RETRACT_MM))
        assert (
            await _z_is_not_hitting_endstop()
        ), "error: hitting gripper Z endstop after retracting"
        await api.move_rel(mount, Point(z=-GRIPPER_Z_NO_SKIP_TRAVEL_MM))
        await api.move_rel(mount, Point(z=GRIPPER_Z_NO_SKIP_TRAVEL_MM))
        assert (
            await _z_is_not_hitting_endstop()
        ), "error: hitting gripper Z endstop after moving"
        await api.move_rel(mount, Point(z=GRIPPER_Z_ENDSTOP_RETRACT_MM))
        assert (
            await _z_is_hitting_endstop()
        ), "error: not hitting gripper Z endstop after moving"
        result = CSVResult.PASS
    except AssertionError as e:
        print(str(e))
        result = CSVResult.FAIL
    report(section, "gripper-no-skip", [result])
    await api.home([z_ax])

    # JAW GRIP/UNGRIP
    async def _get_jaw_width_and_record_result(min_max: str) -> None:
        _encoders = await api.encoder_current_position_ot3(mount)
        _width = jaw_widths["max"] - (_encoders[jaw_ax] * 2)
        _diff = abs(_width - jaw_widths[min_max])
        print(f"jaw: encoder={_encoders[jaw_ax]}, width={_width}")
        _result = CSVResult.from_bool(_diff < GRIPPER_JAW_WIDTH_TOLERANCE_MM)
        report(
            section, f"gripper-jaw-{min_max}", [_width, jaw_widths[min_max], _result]
        )

    await api.home([jaw_ax])
    await api.grip(GRIPPER_GRIP_FORCE)
    await _get_jaw_width_and_record_result("min")
    await api.ungrip()
    await _get_jaw_width_and_record_result("max")

    # PROBE-DISTANCE
    await _probe_mount_and_record_result(
        api, mount, report, section, "gripper-probe-distance-front", GripperProbe.FRONT
    )
    await _probe_mount_and_record_result(
        api, mount, report, section, "gripper-probe-distance-rear", GripperProbe.REAR
    )


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    print("homing")
    await api.home()
    print("moving to front of machine")
    await api.move_rel(
        OT3Mount.LEFT,
        RELATIVE_MOVE_FROM_HOME_DELTA,
        speed=RELATIVE_MOVE_FROM_HOME_SPEED,
    )

    # PIPETTES
    for mount in [OT3Mount.LEFT, OT3Mount.RIGHT]:
        ui.print_header(f"PIPETTE - {mount.name}")
        if not api.is_simulator:
            ui.get_user_ready(f"attached a pipette to the {mount.name} mount")
        await _test_pipette(api, mount, report, section)
    while not api.is_simulator and await _get_pip_mounts(api):
        ui.get_user_ready("remove all pipettes")

    # GRIPPER
    ui.print_header("GRIPPER")
    if not api.is_simulator:
        ui.get_user_ready("attach a gripper")
    await _test_gripper(api, report, section)
    # while not api.is_simulator and await _has_gripper(api):
    #     ui.get_user_ready("remove the gripper")

    print("moving back near home position")
    await api.home([OT3Axis.Z_L, OT3Axis.Z_R])
    await api.move_rel(
        OT3Mount.LEFT,
        RELATIVE_MOVE_FROM_HOME_DELTA * -0.9,
        speed=RELATIVE_MOVE_FROM_HOME_SPEED,
    )
