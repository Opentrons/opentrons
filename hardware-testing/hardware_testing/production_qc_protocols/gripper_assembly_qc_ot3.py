"""Perform the robot assembly diagnostics."""

from dataclasses import dataclass
import enum
from time import sleep
from typing import Dict, Callable, List, Optional, Union, Tuple
from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.types import Point

from opentrons.config.defaults_ot3 import (
    DEFAULT_MAX_SPEEDS,
    DEFAULT_RUN_CURRENT,
)
from opentrons.hardware_control.peripherals import BarcodeScannerModel
from opentrons.hardware_control.ot3_calibration import (
    calibrate_gripper,
    calibrate_gripper_jaw,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3simulator import (
    _sanitize_attached_instrument,
)
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.types import (
    GripperProbe,
    OT3AxisKind,
    OT3AxisMap,
    OT3Mount,
    Axis,
    GripperJawState,
    InstrumentProbeType,
)
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_shared_data.errors.exceptions import (
    CommandTimedOutError,
    CalibrationStructureNotFoundError,
    EdgeNotFoundError,
)

from hardware_testing.data.csv_report import (
    CSVLineRepeating,
    CSVReport,
    CSVSection,
    CSVResult,
    CSVLine,
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.drivers import find_port
from hardware_testing.drivers.mark10 import Mark10, SimMark10

metadata = {"protocolName": "Production qc Gripper assembly qc"}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

# TEST FORCE CONSTANTS
SLOT_FORCE_GAUGE = 4
GRIP_DUTY_CYCLES: List[int] = [40, 30, 25, 20, 15, 10, 6]
NUM_DUTY_CYCLE_TRIALS = 20
GRIP_FORCES_NEWTON_FORCE: List[int] = [20, 15, 10, 5]
NUM_NEWTONS_TRIALS = 1
FAILURE_THRESHOLD_PERCENTAGES = [20, 20, 20, 40]
WARMUP_SECONDS = 10
FORCE_GAUGE_TRIAL_SAMPLE_INTERVAL = 0.25  # seconds
FORCE_GAUGE_TRIAL_SAMPLE_COUNT = 20  # 20 samples = 5 seconds @ 4Hz
GAUGE_OFFSET = Point(x=2, y=-42, z=75)

# TEST WIDTH CONSTANTS
FAILURE_THRESHOLD_MM = -3
GAUGE_HEIGHT_MM = 75
GRIP_HEIGHT_MM = 48
TEST_WIDTHS_MM: List[float] = [60, 85.75, 62]
SLOT_WIDTH_GAUGE: List[Optional[int]] = [None, 3, 9]
GRIP_FORCES_NEWTON_WIDTH: List[float] = [10, 15, 20]

# TEST MOUNT CONSTANTS
SLOT_MOUNT_TEST = 5
Z_AXIS_TRAVEL_DISTANCE = 150.0
Z_MAX_SKIP_MM = 0.1
DEFAULT_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[OT3AxisKind.Z_G]
DEFAULT_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[OT3AxisKind.Z_G]
SPEEDS_TO_TEST = [DEFAULT_SPEED]
MIN_PASS_CURRENT = round(DEFAULT_CURRENT * 0.6, 1)  # 0.67 * 0.6 = ~0.4
CURRENTS_SPEEDS: Dict[float, List[float]] = {
    round(MIN_PASS_CURRENT - 0.2, 1): SPEEDS_TO_TEST,
    round(MIN_PASS_CURRENT - 0.1, 1): SPEEDS_TO_TEST,
    MIN_PASS_CURRENT: SPEEDS_TO_TEST,
    DEFAULT_CURRENT: SPEEDS_TO_TEST,
}

# TEST PROBE CONSTANTS
SLOT_PROBE_TEST = 5
PROBE_PREP_HEIGHT_MM = 5
PROBE_POS_OFFSET = Point(13, 13, 0)
JAW_ALIGNMENT_MM_X = 2.0
JAW_ALIGNMENT_MM_Z = 2.0
PROBE_PF_MAX = 6.0
DECK_PF_MIN = 9.0
DECK_PF_MAX = 15.0

# END CONSTANTS


class TestSection(enum.Enum):
    """Test Section."""

    MOUNT = "MOUNT"
    FORCE = "FORCE"
    WIDTH = "WIDTH"
    PROBE = "PROBE"


@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]
    increment: bool


# -------- Async monkey patches ------


async def _calibrate_gripper(
    self, offset_front: Point, offset_rear: Point  # noqa: ANN001
) -> Point:
    try:
        offset = await calibrate_gripper(self, offset_front, offset_rear)  # type: ignore[arg-type]
    except CalibrationStructureNotFoundError as e:
        if not self.is_simulator:
            raise e
        offset = Point(x=0, y=0, z=0)
    except EdgeNotFoundError:
        if not self.is_simulator:
            raise
        offset = Point(x=0, y=0, z=0)
    finally:
        await self.retract(OT3Mount.GRIPPER)
    return offset


async def _calibrate_gripper_jaw(self, probe: GripperProbe) -> Point:  # noqa: ANN001
    try:
        offset = await calibrate_gripper_jaw(self, probe)  # type: ignore[arg-type]
    except CalibrationStructureNotFoundError:
        if not self.is_simulator:
            raise
        offset = Point(x=0, y=0, z=0)
    except EdgeNotFoundError:
        if not self.is_simulator:
            raise
        offset = Point(x=0, y=0, z=0)
    finally:
        await self.retract(OT3Mount.GRIPPER)
    return offset


async def _set_active_current(
    self, axis_currents: OT3AxisMap[float]  # noqa: ANN001
) -> None:
    await self._backend.set_active_current(axis_currents)


# -------- END Async monkey patches ------


# -----------------   TEST Mount   ----------------

LOCALIZE = helpers_ot3.get_system_langauge() == "zh-CN"


def _get_mount_test_tag(
    current: float, speed: float, direction: str, start_or_end: str
) -> str:
    return f"current-{current}-speed-{speed}-{direction}-{start_or_end}"


def _is_z_axis_still_aligned_with_encoder(
    api: SyncHardwareAPI, target_z: float
) -> Tuple[float, bool]:
    enc_pos = api.encoder_current_position_ot3(OT3Mount.GRIPPER)
    z_enc = enc_pos[Axis.Z_G]
    is_aligned = abs(target_z - z_enc) < Z_MAX_SKIP_MM
    return z_enc, is_aligned


def test_mount(
    api: SyncHardwareAPI, report: CSVReport, section: str, ctx: ProtocolContext
) -> None:
    """Test the gripper mount."""
    ctx.comment("测试挂载" if LOCALIZE else "Test Mount")
    z_ax = Axis.Z_G
    g_ax = Axis.G
    mount = OT3Mount.GRIPPER
    settings = helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(api, z_ax)
    default_z_current = settings.run_current
    default_z_speed = settings.max_speed

    api.home([z_ax, g_ax])
    home_pos = api.gantry_position(OT3Mount.GRIPPER)
    target_pos = helpers_ot3.get_slot_calibration_square_position_ot3(SLOT_MOUNT_TEST)
    target_pos = target_pos._replace(z=home_pos.z)
    helpers_ot3.move_to_arched_ot3_sync(api, OT3Mount.GRIPPER, target_pos)

    def _save_result(tag: str, target_z: float, include_pass_fail: bool) -> bool:
        z_enc, z_aligned = _is_z_axis_still_aligned_with_encoder(api, target_z)
        result = CSVResult.from_bool(z_aligned)
        if include_pass_fail:
            report(section, tag, [target_z, z_enc, result])
        else:
            report(section, tag, [target_z, z_enc])
        return z_aligned

    try:
        helpers_ot3.enable_stall_detection(api, False)
        # LOOP THROUGH CURRENTS + SPEEDS
        currents = list(CURRENTS_SPEEDS.keys())
        for current in sorted(currents, reverse=True):
            speeds = CURRENTS_SPEEDS[current]
            for speed in sorted(speeds, reverse=False):
                include_pass_fail = current >= MIN_PASS_CURRENT
                # HOME
                api.home([z_ax])
                home_pos = api.gantry_position(OT3Mount.GRIPPER)
                # LOWER CURRENT
                helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
                    api, z_ax, run_current=current
                )
                helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
                    api, z_ax, default_max_speed=speed
                )
                api._set_active_current({z_ax: current})
                # MOVE DOWN
                _save_result(
                    _get_mount_test_tag(current, speed, "down", "start"),
                    target_z=home_pos.z,
                    include_pass_fail=include_pass_fail,
                )
                api.move_rel(
                    mount,
                    Point(z=-Z_AXIS_TRAVEL_DISTANCE),
                    speed=speed,
                    expect_stalls=True,
                )
                down_end_passed = _save_result(
                    _get_mount_test_tag(current, speed, "down", "end"),
                    target_z=home_pos.z - Z_AXIS_TRAVEL_DISTANCE,
                    include_pass_fail=include_pass_fail,
                )
                if down_end_passed:
                    # MOVE UP
                    _save_result(
                        _get_mount_test_tag(current, speed, "up", "start"),
                        target_z=home_pos.z - Z_AXIS_TRAVEL_DISTANCE,
                        include_pass_fail=include_pass_fail,
                    )
                    api.move_rel(
                        mount,
                        Point(z=Z_AXIS_TRAVEL_DISTANCE),
                        speed=speed,
                        expect_stalls=True,
                    )
                    up_end_passed = _save_result(
                        _get_mount_test_tag(current, speed, "up", "end"),
                        target_z=home_pos.z,
                        include_pass_fail=include_pass_fail,
                    )
                else:
                    up_end_passed = False
                # RESET CURRENTS AND HOME
                helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
                    api, z_ax, run_current=default_z_current
                )
                helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
                    api, z_ax, default_max_speed=default_z_speed
                )
                api.home([z_ax])
                if not down_end_passed or not up_end_passed and not api.is_simulator:
                    break
    finally:
        helpers_ot3.enable_stall_detection(api, False)


# -----------------   TEST Probe   ----------------


def _get_probe_test_tag(probe: GripperProbe) -> str:
    return f"{probe.name}-probe"


def read_once(api: SyncHardwareAPI, probe: GripperProbe, timeout: int) -> float:
    """Get the capacitance reading from a gripper."""
    data = api.read_instrument_capacitance(
        OT3Mount.GRIPPER, probe.to_type == InstrumentProbeType.PRIMARY, timeout
    )
    return data


def _read_from_sensor(
    api: SyncHardwareAPI,
    probe: GripperProbe,
    timeout: int,
    num_readings: int = 10,
) -> float:
    readings: List[float] = []
    while len(readings) != num_readings:
        try:
            r = read_once(api, probe, timeout)
            readings.append(r)
        except CommandTimedOutError:
            continue
    return sum(readings) / num_readings


def _get_hover_and_probe_pos(api: SyncHardwareAPI) -> Tuple[Point, Point]:
    probe_pos = helpers_ot3.get_slot_calibration_square_position_ot3(SLOT_PROBE_TEST)
    probe_pos += PROBE_POS_OFFSET
    hover_pos = probe_pos._replace(z=api.get_instrument_max_height(OT3Mount.GRIPPER))
    return hover_pos, probe_pos


def test_probe(
    api: SyncHardwareAPI, report: CSVReport, section: str, ctx: ProtocolContext
) -> None:
    """Test the grippers probes."""
    ctx.comment("测试探针" if LOCALIZE else "Test Probe")
    z_ax = Axis.Z_G
    g_ax = Axis.G
    mount = OT3Mount.GRIPPER

    pass_settings = api.config.calibration.z_offset.pass_settings
    hover_pos, probe_pos = _get_hover_and_probe_pos(api)
    z_limit = probe_pos.z - pass_settings.max_overrun_distance_mm

    for probe in GripperProbe:
        api.home([z_ax, g_ax])

        # move to position and grip
        helpers_ot3.move_to_arched_ot3_sync(api, mount, hover_pos)
        if not api._gripper_handler.get_gripper().attached_probe:
            api.add_gripper_probe(probe)
        api.grip(15)

        # take reading for baseline (1)
        open_air_pf = _read_from_sensor(api, probe, 10)

        # take reading for baseline with pin attached (2)
        ctx.pause(
            f"将校准销放置在{probe.name}"
            if LOCALIZE
            else f"place calibration pin in the {probe.name}"
        )
        # add pin to update critical point
        probe_pf = _read_from_sensor(api, probe, 10)

        # begins probing
        ctx.pause("即将探查甲板" if LOCALIZE else "about to probe the deck")
        helpers_ot3.move_to_arched_ot3_sync(api, mount, hover_pos)
        # move to 5 mm above the deck
        api.move_to(mount, probe_pos._replace(z=PROBE_PREP_HEIGHT_MM))
        z_ax = Axis.by_mount(mount)
        found_pos, _ = api.capacitive_probe(mount, z_ax, probe_pos.z, pass_settings)

        # check against max overrun
        valid_height = found_pos >= z_limit
        deck_pf = 0.0
        if valid_height:
            ctx.pause("即将压向甲板" if LOCALIZE else "about to press into the deck")
            api.move_to(mount, probe_pos._replace(z=found_pos))
            deck_pf = _read_from_sensor(api, probe, 10)

        result = (
            open_air_pf < probe_pf < PROBE_PF_MAX < DECK_PF_MIN < deck_pf < DECK_PF_MAX
        )
        _tag = _get_probe_test_tag(probe)
        report(section, f"{_tag}-open-air-pf", [open_air_pf])
        report(section, f"{_tag}-probe-pf", [probe_pf])
        report(section, f"{_tag}-probe-pf-max-allowed", [PROBE_PF_MAX])
        report(section, f"{_tag}-deck-pf", [deck_pf])
        report(section, f"{_tag}-deck-pf-min-max-allowed", [DECK_PF_MIN, DECK_PF_MAX])
        report(section, f"{_tag}-result", [CSVResult.from_bool(result)])
        api.home_z()
        api.ungrip()

        ctx.pause(
            f"拆除 {probe.name} 中的校准销"
            if LOCALIZE
            else f"remove calibration pin in the {probe.name}"
        )
        api.remove_gripper_probe()

    def _calibrate_jaw(_p: GripperProbe) -> Point:
        api.retract(OT3Mount.GRIPPER)
        ctx.pause(f"将探头连接到 {_p.name}" if LOCALIZE else f"attach probe to {_p.name}")
        ret = api._calibrate_gripper_jaw(_p)
        api.retract(OT3Mount.GRIPPER)
        ctx.pause(f"从{_p.name}中取出探针" if LOCALIZE else f"remove probe from {_p.name}")
        report(section, f"jaw-probe-{_p.name.lower()}-xyz", [ret.x, ret.y, ret.z])
        return ret

    _offsets = {probe: _calibrate_jaw(probe) for probe in GripperProbe}
    _diff_x = abs(_offsets[GripperProbe.FRONT].x - _offsets[GripperProbe.REAR].x)
    _diff_z = abs(_offsets[GripperProbe.FRONT].z - _offsets[GripperProbe.REAR].z)
    # We don't use this so why are we doing it? before we were just printing it out
    api._calibrate_gripper(
        offset_front=_offsets[GripperProbe.FRONT],
        offset_rear=_offsets[GripperProbe.REAR],
    )
    report(section, "jaw-alignment-x-spec", [JAW_ALIGNMENT_MM_X])
    report(section, "jaw-alignment-x-actual", [_diff_x])
    report(
        section,
        "jaw-alignment-x-result",
        [CSVResult.from_bool(_diff_x <= JAW_ALIGNMENT_MM_X)],
    )
    report(section, "jaw-alignment-z-spec", [JAW_ALIGNMENT_MM_Z])
    report(section, "jaw-alignment-z-actual", [_diff_z])
    report(
        section,
        "jaw-alignment-z-result",
        [CSVResult.from_bool(_diff_z <= JAW_ALIGNMENT_MM_Z)],
    )
    api.retract(OT3Mount.GRIPPER)


# -----------------   TEST Width   ----------------


def _get_width_test_tag(width: float, force: float) -> str:
    return f"{width}mm-{force}N"


def _get_width_hover_and_grip_positions(
    api: SyncHardwareAPI, slot: int
) -> Tuple[Point, Point]:
    grip_pos = helpers_ot3.get_slot_calibration_square_position_ot3(slot)
    grip_pos += Point(z=GRIP_HEIGHT_MM)
    hover_pos = grip_pos._replace(z=GAUGE_HEIGHT_MM + 15)
    return hover_pos, grip_pos


def test_width(
    api: SyncHardwareAPI, report: CSVReport, section: str, ctx: ProtocolContext
) -> None:
    """Test the gripper width."""
    ctx.comment("测试宽度" if LOCALIZE else "Test Width")
    z_ax = Axis.Z_G
    g_ax = Axis.G
    mount = OT3Mount.GRIPPER
    gripper = api._gripper_handler.get_gripper()
    max_width = gripper.config.geometry.jaw_width["max"]

    _error_when_gripping_itself = 0.0

    def _save_result(_width: float, _force: float, _cache_error: bool) -> float:
        nonlocal _error_when_gripping_itself
        # fake the encoder to be in the right place, during simulation
        if api.is_simulator:
            sim_enc_pox = (max_width - width) / 2.0
            api._backend._encoder_position[NodeId.gripper_g] = sim_enc_pox
            api.refresh_positions()
        _width_actual = api._gripper_handler.get_gripper().jaw_width
        assert _width_actual is not None
        _width_error = _width_actual - _width
        if _cache_error and not _error_when_gripping_itself:
            _error_when_gripping_itself = _width_error
        _width_error_adjusted = _width_error - _error_when_gripping_itself
        # should always fail in the negative direction
        result = CSVResult.from_bool(0 >= _width_error_adjusted >= FAILURE_THRESHOLD_MM)
        tag = _get_width_test_tag(_width, _force)
        report(section, f"{tag}-force", [_force])
        report(section, f"{tag}-width", [_width])
        report(section, f"{tag}-width-actual", [_width_actual])
        report(section, f"{tag}-width-error", [_width_error])
        report(section, f"{tag}-width-error-adjusted", [_width_error_adjusted])
        report(section, f"{tag}-result", [result])
        return _width_error

    # HOME
    api.home([z_ax, g_ax])

    # LOOP THROUGH WIDTHS
    for width, slot in zip(TEST_WIDTHS_MM, SLOT_WIDTH_GAUGE):
        api.ungrip()
        if slot is not None:
            hover_pos, target_pos = _get_width_hover_and_grip_positions(api, slot)
            # MOVE TO SLOT
            helpers_ot3.move_to_arched_ot3_sync(api, mount, hover_pos)
            # OPERATOR SETS UP GAUGE
            ctx.pause(
                f"在插槽 {slot} 处增加 {width} 毫米宽的量规"
                if LOCALIZE
                else f"add {width} mm wide gauge to slot {slot}"
            )
            # GRIPPER MOVES TO GAUGE
            api.move_to(mount, target_pos)
            ctx.pause(f"准备夹持 {width} 毫米" if LOCALIZE else f"prepare to grip {width} mm")
            # grip once to center the thing
            api.grip(20)
            api.ungrip()
        # LOOP THROUGH FORCES

        for force in GRIP_FORCES_NEWTON_WIDTH:
            # GRIP AND MEASURE WIDTH
            api.grip(force)
            _save_result(width, force, _cache_error=(slot is None))
            api.ungrip()
        # RETRACT
        api.retract(OT3Mount.GRIPPER)


# -----------------   TEST Force   ----------------


def _get_gauge(is_simulating: bool) -> Union[Mark10, SimMark10]:
    if is_simulating:
        return SimMark10()
    else:
        try:
            port = find_port(*Mark10.vid_pid())
        except RuntimeError:
            raise RuntimeError("Unable to find Mark10 guage.")
        return Mark10.create(port=port)


def _read_forces(gauge: Union[Mark10, SimMark10]) -> List[float]:
    n = list()
    for _ in range(FORCE_GAUGE_TRIAL_SAMPLE_COUNT):
        force = gauge.read_force()
        n.append(force)
        if not gauge.is_simulator():
            sleep(FORCE_GAUGE_TRIAL_SAMPLE_INTERVAL)
    return n


def _get_force_gauge_hover_and_grip_positions(
    api: SyncHardwareAPI,
) -> Tuple[Point, Point]:
    grip_pos = helpers_ot3.get_slot_calibration_square_position_ot3(SLOT_FORCE_GAUGE)
    grip_pos += GAUGE_OFFSET
    hover_pos = grip_pos._replace(z=api.get_instrument_max_height(OT3Mount.GRIPPER))
    return hover_pos, grip_pos


def _grip_and_read_forces(
    api: SyncHardwareAPI,
    gauge: Union[Mark10, SimMark10],
    force: Optional[int] = None,
    duty: Optional[int] = None,
) -> List[float]:
    if not api.is_simulator:
        sleep(2)  # let sensor settle
    if duty is not None:
        displacement = api._gripper_handler.get_gripper().max_jaw_displacement()
        api._grip(duty_cycle=float(duty), expected_displacement=displacement)
        api._gripper_handler.set_jaw_state(GripperJawState.GRIPPING)
    else:
        assert force is not None
        api.grip(float(force))
    if gauge.is_simulator():
        if duty is not None:
            gauge.set_simulation_force(float(duty) * 0.5)  # type: ignore[union-attr]
        elif force is not None:
            gauge.set_simulation_force(float(force))  # type: ignore[union-attr]
    ret_list = _read_forces(gauge)
    api.ungrip()
    return ret_list


def _setup(api: SyncHardwareAPI, ctx: ProtocolContext) -> Union[Mark10, SimMark10]:
    z_ax = Axis.Z_G
    g_ax = Axis.G
    mount = OT3Mount.GRIPPER

    # OPERATOR SETS UP GAUGE
    ctx.pause(
        f"将量规添加到槽位 {SLOT_FORCE_GAUGE} 并恢复"
        if LOCALIZE
        else f"add gauge to slot {SLOT_FORCE_GAUGE} and resume"
    )
    ctx.pause(
        "将量规插入 OT3 的 USB 端口并恢复操作。"
        if LOCALIZE
        else "plug gauge into USB port on OT3 and resume"
    )
    gauge = _get_gauge(api.is_simulator)
    gauge.connect()
    ret_list = _read_forces(gauge)
    assert ret_list

    # HOME
    api.home([z_ax, g_ax])
    # MOVE TO GAUGE
    api.ungrip()
    _, target_pos = _get_force_gauge_hover_and_grip_positions(api)
    if not api.is_simulator:
        helpers_ot3.move_to_arched_ot3_sync(api, mount, target_pos + Point(z=15))
    ctx.pause(
        "请确保量规位于夹持器中央。"
        if LOCALIZE
        else "please make sure the gauge in the middle of the gripper"
    )
    ctx.pause("即将抓住" if LOCALIZE else "about to grip")
    api.grip(20)
    for sec in range(WARMUP_SECONDS):
        if not api.is_simulator:
            sleep(1)
    api.ungrip()
    return gauge


def _get_force_test_tag(
    trial: int,
    newtons: Optional[int] = None,
    duty_cycle: Optional[int] = None,
) -> str:
    if newtons and duty_cycle:
        raise ValueError("must measure either force or duty-cycle, not both")
    if newtons is None and duty_cycle is None:
        raise ValueError("both newtons and duty-cycle are None")
    if newtons is not None:
        return f"newtons-{newtons}-trial-{trial + 1}"
    else:
        return f"duty-cycle-{duty_cycle}-trial-{trial + 1}"


def test_force(
    api: SyncHardwareAPI, report: CSVReport, section: str, ctx: ProtocolContext
) -> None:
    """Test the gripper force."""
    ctx.comment("测试力" if LOCALIZE else "Test Force")

    gauge = _setup(api, ctx)
    # LOOP THROUGH FORCES
    for expected_force, allowed_percent_error in zip(
        GRIP_FORCES_NEWTON_FORCE, FAILURE_THRESHOLD_PERCENTAGES
    ):
        for trial in range(NUM_NEWTONS_TRIALS):
            actual_forces = _grip_and_read_forces(api, gauge, force=expected_force)
            # base PASS/FAIL on average
            avg_force = sum(actual_forces) / len(actual_forces)
            error = (avg_force - expected_force) / expected_force
            result = CSVResult.from_bool(abs(error) * 100 < allowed_percent_error)
            # store all data in CSV
            tag = _get_force_test_tag(trial, newtons=expected_force)
            report(section, f"{tag}-data", actual_forces)
            report(section, f"{tag}-average", [avg_force])
            report(section, f"{tag}-target", [expected_force])
            report(section, f"{tag}-pass-%", [allowed_percent_error])
            report(section, f"{tag}-result", [result])

    api.retract(OT3Mount.GRIPPER)


def test_force_increment(
    api: SyncHardwareAPI, report: CSVReport, section: str, ctx: ProtocolContext
) -> None:
    """Test the gripper force increment."""
    ctx.comment("试验力增量" if LOCALIZE else "Test Force Increment")
    gauge = _setup(api, ctx)

    # LOOP THROUGH DUTY-CYCLES
    for duty_cycle in GRIP_DUTY_CYCLES:
        # GRIP AND MEASURE FORCE
        for trial in range(NUM_DUTY_CYCLE_TRIALS):
            actual_forces = _grip_and_read_forces(api, gauge, duty=duty_cycle)
            avg_force = sum(actual_forces) / len(actual_forces)
            tag = _get_force_test_tag(trial, duty_cycle=duty_cycle)
            report(section, f"{tag}-data", actual_forces)
            report(section, f"{tag}-average", [avg_force])
            report(section, f"{tag}-duty-cycle", [duty_cycle])

    api.retract(OT3Mount.GRIPPER)


TESTS = [
    (
        TestSection.MOUNT,
        test_mount,
    ),
    (
        TestSection.PROBE,
        test_probe,
    ),
    (
        TestSection.WIDTH,
        test_width,
    ),
    (
        TestSection.FORCE,
        test_force,
    ),
]

TESTS_INCREMENT = [
    (
        TestSection.FORCE,
        test_force_increment,  # NOTE: different run method
    ),
]


def build_test_force_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for force in GRIP_FORCES_NEWTON_FORCE:
        for trial in range(NUM_NEWTONS_TRIALS):
            tag = _get_force_test_tag(trial, newtons=force)
            force_data_types = [float] * FORCE_GAUGE_TRIAL_SAMPLE_COUNT
            lines.append(CSVLine(f"{tag}-data", force_data_types))
            lines.append(CSVLine(f"{tag}-average", [float]))
            lines.append(CSVLine(f"{tag}-target", [float]))
            lines.append(CSVLine(f"{tag}-pass-%", [float]))
            lines.append(CSVLine(f"{tag}-result", [CSVResult]))
    for duty_cycle in GRIP_DUTY_CYCLES:
        for trial in range(NUM_DUTY_CYCLE_TRIALS):
            tag = _get_force_test_tag(trial, duty_cycle=duty_cycle)
            force_data_types = [float] * FORCE_GAUGE_TRIAL_SAMPLE_COUNT
            lines.append(CSVLine(f"{tag}-data", force_data_types))
            lines.append(CSVLine(f"{tag}-average", [float]))
            lines.append(CSVLine(f"{tag}-duty-cycle", [float]))
    return lines


def build_test_mount_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    currents = list(CURRENTS_SPEEDS.keys())
    for current in sorted(currents):
        speeds = CURRENTS_SPEEDS[current]
        for speed in sorted(speeds):
            for dir in ["down", "up"]:
                for step in ["start", "end"]:
                    tag = _get_mount_test_tag(current, speed, dir, step)
                    if current < MIN_PASS_CURRENT:
                        lines.append(CSVLine(tag, [float, float]))
                    else:
                        lines.append(CSVLine(tag, [float, float, CSVResult]))
    return lines


def build_test_probe_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for p in GripperProbe:
        tag = _get_probe_test_tag(p)
        lines.append(CSVLine(f"{tag}-open-air-pf", [float]))
        lines.append(CSVLine(f"{tag}-probe-pf", [float]))
        lines.append(CSVLine(f"{tag}-probe-pf-max-allowed", [float]))
        lines.append(CSVLine(f"{tag}-deck-pf", [float]))
        lines.append(CSVLine(f"{tag}-deck-pf-min-max-allowed", [float, float]))
        lines.append(CSVLine(f"{tag}-result", [CSVResult]))
    for p in GripperProbe:
        lines.append(CSVLine(f"jaw-probe-{p.name.lower()}-xyz", [float, float, float]))
    for axis in ["x", "z"]:
        lines.append(CSVLine(f"jaw-alignment-{axis}-spec", [float]))
        lines.append(CSVLine(f"jaw-alignment-{axis}-actual", [float]))
        lines.append(CSVLine(f"jaw-alignment-{axis}-result", [CSVResult]))
    return lines


def build_test_width_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for width in TEST_WIDTHS_MM:
        for force in GRIP_FORCES_NEWTON_WIDTH:
            tag = _get_width_test_tag(width, force)
            lines.append(CSVLine(f"{tag}-force", [float]))
            lines.append(CSVLine(f"{tag}-width", [float]))
            lines.append(CSVLine(f"{tag}-width-actual", [float]))
            lines.append(CSVLine(f"{tag}-width-error", [float]))
            lines.append(CSVLine(f"{tag}-width-error-adjusted", [float]))
            lines.append(CSVLine(f"{tag}-result", [CSVResult]))
    return lines


def build_report(test_name: str) -> CSVReport:
    """Build report."""
    return CSVReport(
        test_name=test_name,
        sections=[
            CSVSection(
                title=TestSection.MOUNT.value, lines=build_test_mount_csv_lines()
            ),
            CSVSection(
                title=TestSection.PROBE.value, lines=build_test_probe_csv_lines()
            ),
            CSVSection(
                title=TestSection.WIDTH.value, lines=build_test_width_csv_lines()
            ),
            CSVSection(
                title=TestSection.FORCE.value, lines=build_test_force_csv_lines()
            ),
        ],
    )


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
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
    for s in TestSection:
        parameters.add_bool(
            display_name=f"Skip {s.value.lower()}",
            variable_name=f"skip_{s.value.lower()}",
            default=False,
            description=f"When this is true the robot will not test {s.value.lower()}",
        )

    parameters.add_bool(
        display_name="Increment test",
        variable_name="increment",
        default=False,
        description="When this is true the scanned sku will be inserted into the report.",
    )


def run(ctx: ProtocolContext) -> None:
    """Entry point into testing protocol."""
    ctx.comment("开始机器人测试" if LOCALIZE else "starting robot test.")
    test_name = "gripper-assembly-qc-ot3"
    api = ctx._core.get_hardware()
    if ctx.is_simulating():
        sim_backend = api._backend
        sim_backend._attached_instruments = {
            m: _sanitize_attached_instrument(
                m,
                helpers_ot3._create_attached_instruments_dict(
                    gripper="GRPV1120230323A01"
                ).get(m),
            )
            for m in OT3Mount
        }
        api.create_simulating_peripheral(BarcodeScannerModel.BARCODE_SCANNER_V1)
        api.reset()

    # Apply monkey patches
    OT3API._calibrate_gripper = _calibrate_gripper  # type: ignore[attr-defined]
    OT3API._calibrate_gripper_jaw = _calibrate_gripper_jaw  # type: ignore[attr-defined]
    OT3API._set_active_current = _set_active_current  # type: ignore[attr-defined]

    report = build_report(test_name)
    dut = helpers_ot3.DeviceUnderTest.GRIPPER
    helpers_ot3.set_csv_report_meta_data_ot3(api, report, operator=ctx.params.operator, dut=dut, ctx=ctx)  # type: ignore[attr-defined]
    args = ctx.params.get_all()
    t_sections = {s: f for s, f in TESTS if not args[f"skip_{s.value.lower()}"]}
    if args["increment"]:
        t_sections = {s: f for s, f in TESTS_INCREMENT}

    config = TestConfig(
        simulate=ctx.is_simulating(),
        tests=t_sections,
        increment=bool(args["increment"]),
    )

    for section, test_run in config.tests.items():
        test_run(api, report, section.value, ctx)

    # SAVE REPORT
    report.save_to_disk()
    if not report.all_succeded():
        raise RuntimeError("Error during QC run.")
