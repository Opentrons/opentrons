"""Production QC protocol for Flex robot assembly testing."""
import asyncio
from dataclasses import dataclass
import enum
import logging
import os
import re
from math import copysign
from pathlib import Path
from subprocess import CalledProcessError, Popen
from subprocess import run as run_subprocess
from time import monotonic, sleep
from typing import Any, Callable, Dict, List, Optional, Tuple, Union, cast
from urllib.request import urlopen

if "OT_SYSTEM_VERSION" not in os.environ:
    os.environ["OT_SYSTEM_VERSION"] = "0.0.0"

from numpy import float64

from opentrons import config
from opentrons.config import IS_ROBOT
from opentrons.config.types import CapacitivePassSettings
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3simulator import (
    _sanitize_attached_instrument,
)
from opentrons.hardware_control.backends.ot3utils import axis_to_node
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.peripherals.types import BarcodeScannerModel
from opentrons.hardware_control.types import (
    Axis,
    DoorState,
    GripperProbe,
    OT3Mount,
    StatusBarState,
)
from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.system import nmcli
from opentrons.types import Point
from opentrons_hardware.hardware_control.motion import (
    MoveGroupStep,
    MoveStopCondition,
    create_step,
)
from opentrons_hardware.hardware_control.move_group_runner import MoveGroupRunner
from opentrons_hardware.hardware_control.rear_panel_settings import (
    RearPinState,
    get_all_pin_state,
    set_sync_pin,
    set_ui_color,
)
from opentrons_shared_data.errors.exceptions import MotionFailedError
from hardware_testing.data import create_datetime_string
from hardware_testing.data.csv_report import (
    CSVLine,
    CSVLineRepeating,
    CSVReport,
    CSVResult,
    CSVSection,
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.helpers_ot3 import (
    DirectPropId,
    direct_eeprom_data,
    direct_property_write,
)

LOCALIZE = helpers_ot3.get_system_langauge() == "zh-CN"

LOG = logging.getLogger(__name__)
LOG.setLevel(logging.CRITICAL)
for logger in [logging.getLogger(name) for name in logging.root.manager.loggerDict]:
    logger.setLevel(logging.CRITICAL)

metadata = {"protocolName": "flex assembly production qc"}
requirements = {"robotType": "Flex", "apiLevel": "2.27"}

TEST_NAME = "robot-assembly-qc-ot3"
ONLY_ALL = "ALL"
UNUSED = "Unused"
OPERATOR_CHOICES = [
    UNUSED,
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


class TestSection(enum.Enum):
    """Test Section."""

    GANTRY = "GANTRY"
    SIGNALS = "SIGNALS"
    INSTRUMENTS = "INSTRUMENTS"
    CONNECTIVITY = "CONNECTIVITY"
    PERIPHERALS = "PERIPHERALS"


@dataclass
class TestConfig:
    """Protocol runtime config."""

    simulate: bool
    operator: str
    only_test: str
    sku_code: str
    wifi_ssid: str
    wifi_password: str


def _parse_yes_no(value: str) -> Optional[bool]:
    """Parse text captured from the scanner into a yes/no answer."""
    normalized = value.strip().lower()
    if normalized == "yes":
        return True
    if normalized == "no":
        return False
    return None


def _scanner_prompt(prompt: str) -> str:
    if LOCALIZE:
        return f"扫描是/否 QR 码：{prompt}"
    return f"Scan the Yes or No QR code: {prompt}"


def _comment_test_result(
    ctx: ProtocolContext, test_name: str, result: CSVResult
) -> None:
    ctx.comment(f"{test_name}: {result}")


def _pause_for_ready(ctx: ProtocolContext, prompt: str) -> None:
    suffix = "完成后按 RESUME 继续。" if LOCALIZE else "Press RESUME when ready."
    ctx.pause(f"{prompt} {suffix}")


def _get_user_answer_sync(
    api: SyncHardwareAPI, ctx: ProtocolContext, prompt: str
) -> bool:
    if api.is_simulator:
        return True
    OT3API._scan_barcode = helpers_ot3._scan_barcode  # type: ignore[attr-defined]
    for _ in range(3):
        ctx.pause(_scanner_prompt(prompt))
        result = api._scan_barcode()
        if result:
            parsed = _parse_yes_no(str(result))
            if parsed is not None:
                return parsed
            if LOCALIZE:
                ctx.pause(f'扫描到 "{result}"。期望 QR 文本为 Yes 或 No。')
            else:
                ctx.pause(f'Scanned "{result}". Expected QR text Yes or No.')
        else:
            ctx.pause("扫描失败，请重试。" if LOCALIZE else "Scan failed. Try again.")
    raise RuntimeError(
        "扫描是/否 QR 码出错。" if LOCALIZE else "Error scanning Yes/No QR code."
    )


def _run_hw_coroutine(
    api: SyncHardwareAPI, to_call: Callable[..., Any], *args: Any, **kwargs: Any
) -> Any:
    return api.call_coroutine_sync(api._loop, to_call, *args, **kwargs)


def _async_api(api: SyncHardwareAPI) -> OT3API:
    return object.__getattribute__(api, "_obj_to_adapt")


# Gantry tests
GANTRY_AXES = [Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R]
MAX_TRAVEL = {Axis.X: 537.49, Axis.Y: 405.815, Axis.Z_L: 215, Axis.Z_R: 215}
COLLISION_AVOID_MARGIN = {Axis.X: 0, Axis.Y: 0, Axis.Z_L: 0, Axis.Z_R: 0}
ALIGNMENT_THRESHOLD_MM = 0.2
CURRENT_PERCENTAGE = 0.66
GANTRY_POS_AS_LIST = [float, float, float, float]
GANTRY_TESTS = [
    "home-start",
    "x-max",
    "x-min",
    "y-max",
    "y-min",
    "zl-max",
    "zl-min",
    "zr-max",
    "zr-min",
    "home-end",
]


@dataclass
class AxisStatus:
    """Gantry axis status."""

    estimate: Dict[Axis, float]
    encoder: Dict[Axis, float]
    aligned: bool

    def as_lists(self) -> Tuple[List[float], List[float]]:
        """Return estimates and encoders in CSV axis order."""
        return (
            [self.estimate[ax] for ax in GANTRY_AXES],
            [self.encoder[ax] for ax in GANTRY_AXES],
        )

    @property
    def result(self) -> CSVResult:
        """CSV result."""
        return CSVResult.PASS if self.aligned else CSVResult.FAIL


def _build_gantry_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine("run-currents", GANTRY_POS_AS_LIST)
    ]
    for test in GANTRY_TESTS:
        lines.append(CSVLine(f"{test}-estimate", GANTRY_POS_AS_LIST))
        lines.append(CSVLine(f"{test}-encoder", GANTRY_POS_AS_LIST))
        lines.append(CSVLine(f"{test}-aligned", [CSVResult]))
    return lines


def _read_gantry_position_and_check_alignment(
    api: SyncHardwareAPI, aligned_axis: Optional[Axis]
) -> AxisStatus:
    api.refresh_positions()
    if not api.is_simulator:
        estimate = {ax: api._current_position[ax] for ax in GANTRY_AXES}
        encoder = {ax: api._encoder_position[ax] for ax in GANTRY_AXES}
    else:
        estimate = {ax: 200.0 for ax in GANTRY_AXES}
        encoder = {ax: 200.0 for ax in GANTRY_AXES}
    all_aligned_axes = [
        ax
        for ax in GANTRY_AXES
        if abs(estimate[ax] - encoder[ax]) <= ALIGNMENT_THRESHOLD_MM
    ]
    if not aligned_axis:
        aligned = len(all_aligned_axes) == len(GANTRY_AXES)
    else:
        aligned = aligned_axis in all_aligned_axes
    return AxisStatus(estimate=estimate, encoder=encoder, aligned=aligned)


def _record_gantry_test_status(
    test: str,
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    axis: Optional[Axis] = None,
) -> None:
    if test not in GANTRY_TESTS:
        raise ValueError(f"unexpected gantry test: {test}")
    status = _read_gantry_position_and_check_alignment(api, axis)
    estimate, encoder = status.as_lists()
    print(f"estimate: {estimate}, encoder: {encoder}")
    report(section, f"{test}-estimate", estimate)
    report(section, f"{test}-encoder", encoder)
    report(section, f"{test}-aligned", [status.result])
    _comment_test_result(ctx, f"GANTRY: {test}-aligned", status.result)


def _move_rel_point_for_axis(axis: Axis, distance: float) -> Point:
    if axis == Axis.X:
        return Point(x=distance)
    if axis == Axis.Y:
        return Point(y=distance)
    if axis in (Axis.Z_L, Axis.Z_R):
        return Point(z=distance)
    raise ValueError(f"unexpected axis: {axis}")


def _move_along_axis_and_record_test_results(
    axis: Axis,
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
) -> None:
    mount = OT3Mount.RIGHT if axis == Axis.Z_R else OT3Mount.LEFT
    ax_str = str(axis.name).lower().replace("_", "")
    safety_mm = COLLISION_AVOID_MARGIN[axis]
    rel_distance = MAX_TRAVEL[axis] - (safety_mm * 2)
    print("retracting from endstop")
    api.move_rel(mount, _move_rel_point_for_axis(axis, -safety_mm), speed=5)
    print("quickly move to axis min")
    api.move_rel(mount, _move_rel_point_for_axis(axis, -rel_distance))
    _record_gantry_test_status(
        f"{ax_str}-min", api, report, section, ctx, axis=axis
    )
    print("quickly move to endstop")
    api.move_rel(mount, _move_rel_point_for_axis(axis, rel_distance))
    _record_gantry_test_status(
        f"{ax_str}-max", api, report, section, ctx, axis=axis
    )
    print("homing")
    api.home([axis])


def _set_gantry_settings(
    api: SyncHardwareAPI, settings: Dict[Axis, helpers_ot3.GantryLoadSettings]
) -> None:
    for ax, stg in settings.items():
        helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
            api,
            ax,
            default_max_speed=stg.max_speed,
            acceleration=stg.acceleration,
            max_speed_discontinuity=stg.max_start_stop_speed,
            direction_change_speed_discontinuity=stg.max_change_dir_speed,
        )
        helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
            api, ax, hold_current=stg.hold_current, run_current=stg.run_current
        )


def _run_gantry(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    print(f"lowering gantry currents to {int(CURRENT_PERCENTAGE * 100)}% of defaults")
    settings: Dict[Axis, helpers_ot3.GantryLoadSettings] = {
        ax: helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(api, ax)
        for ax in GANTRY_AXES
    }
    old_currents = {ax: settings[ax].run_current for ax in GANTRY_AXES}
    try:
        for ax in settings:
            settings[ax].run_current = old_currents[ax] * CURRENT_PERCENTAGE
        _set_gantry_settings(api, settings)
        report(
            section, "run-currents", [settings[ax].run_current for ax in GANTRY_AXES]
        )
        ctx.comment("龙门架：归零" if LOCALIZE else "GANTRY: homing")
        api.home(GANTRY_AXES)
        _record_gantry_test_status("home-start", api, report, section, ctx)
        for ax in GANTRY_AXES:
            ctx.comment(
                f"龙门架：{ax.name} 轴 MIN/MAX"
                if LOCALIZE
                else f"GANTRY: Axis {ax.name} MIN/MAX"
            )
            _move_along_axis_and_record_test_results(ax, api, report, section, ctx)
        ctx.comment("龙门架：归零" if LOCALIZE else "GANTRY: homing")
        api.home(GANTRY_AXES)
        _record_gantry_test_status("home-end", api, report, section, ctx)
    finally:
        print("restoring default currents")
        for ax in settings:
            settings[ax].run_current = old_currents[ax]
        _set_gantry_settings(api, settings)


# Signal tests
MOVING_Z_AXIS = Axis.Z_L
MOVING_DISTANCE = 100
MOVE_SECONDS = 5
ROUND_ERR_MARGIN = 0.05
MOVING_SPEED = MOVING_DISTANCE / MOVE_SECONDS
SIGNAL_TEST_NAMES = ["nsync", "estop", "estop-external-left", "estop-external-right"]


def _build_move_group(
    distance: float, speed: float, stop: MoveStopCondition
) -> MoveGroupStep:
    movers = [axis_to_node(Axis.X), axis_to_node(Axis.Y), axis_to_node(MOVING_Z_AXIS)]
    dist_64 = float64(abs(distance))
    vel_64 = float64(speed * copysign(1.0, distance))
    dur_64 = float64(abs(distance / speed))
    return create_step(
        distance={m: dist_64 for m in movers},
        velocity={m: vel_64 for m in movers},
        acceleration={},
        duration=dur_64,
        present_nodes=movers,
        stop_condition=stop,
    )


def _build_signal_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    lines: List[CSVLine] = []
    for sig_name in SIGNAL_TEST_NAMES:
        lines.append(CSVLine(f"{sig_name}-target-pos", [float, float, float]))
        lines.append(CSVLine(f"{sig_name}-stop-pos", [float, float, float]))
        lines.append(CSVLine(f"{sig_name}-result", [CSVResult]))
    return lines  # type: ignore[return-value]


async def _move_and_interrupt_with_signal(self: OT3API, sig_name: str) -> None:
    assert sig_name in SIGNAL_TEST_NAMES
    stop = (
        MoveStopCondition.sync_line if sig_name == "nsync" else MoveStopCondition.none
    )
    move_group = _build_move_group(MOVING_DISTANCE, MOVING_SPEED, stop)
    runner = MoveGroupRunner(move_groups=[[move_group]])
    if self.is_simulator:
        assert runner.run is not None
        return

    backend: OT3Controller = self._backend  # type: ignore[assignment]
    messenger = backend._messenger
    if sig_name == "nsync":
        engage = backend.release_sync
        release = backend.engage_sync
    elif sig_name == "estop":
        engage = backend.engage_estop
        release = backend.release_estop
    else:
        engage = backend.engage_estop
        release = backend.release_estop

    async def _sleep_then_activate_stop_signal() -> None:
        if "external" in sig_name:
            print("waiting for EXTERNAL E-Stop button")
            return
        pause_seconds = MOVE_SECONDS / 2
        print(f"pausing {round(pause_seconds, 1)} second before activating {sig_name}")
        await asyncio.sleep(pause_seconds)
        try:
            print(f"activating {sig_name}")
            await engage()
            print(f"pausing 1 second before deactivating {sig_name}")
            await asyncio.sleep(1)
        finally:
            print(f"deactivating {sig_name}")
            await release()
            backend.estop_acknowledge_and_clear()
            await asyncio.sleep(0.5)

    async def _do_the_moving() -> None:
        print(f"moving {MOVING_DISTANCE} at speed {MOVING_SPEED}")
        try:
            await runner.run(can_messenger=messenger)
        except MotionFailedError:
            print("caught MotionFailedError from estop")
        except Exception:
            await backend.release_estop()
            backend.estop_acknowledge_and_clear()

    await asyncio.sleep(0.25)
    await asyncio.gather(_sleep_then_activate_stop_signal(), _do_the_moving())


async def _release_estop_for_signal(self: OT3API) -> None:
    if not self.is_simulator:
        backend: OT3Controller = self._backend  # type: ignore[assignment]
        await backend.release_estop()
        backend.estop_acknowledge_and_clear()


def _signal_home(api: SyncHardwareAPI, ctx: ProtocolContext) -> None:
    try:
        print("homing")
        api.home()
    except RuntimeError as e:
        print(e)
        if not api.is_simulator:
            _pause_for_ready(
                ctx, "释放急停按钮。" if LOCALIZE else "Release the E-STOP."
            )
        _signal_home(api, ctx)
    except Exception:
        api._release_estop_for_signal()
        _signal_home(api, ctx)


def _run_signals(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    mount = Axis.to_ot3_mount(MOVING_Z_AXIS)
    for sig_name in SIGNAL_TEST_NAMES:
        ctx.comment(
            f"信号：{sig_name.upper()}" if LOCALIZE else f"SIGNALS: {sig_name.upper()}"
        )
        _signal_home(api, ctx)
        start_pos = api.gantry_position(mount)
        target_pos = start_pos + Point(
            x=-MOVING_DISTANCE, y=-MOVING_DISTANCE, z=-MOVING_DISTANCE
        )
        report(
            section,
            f"{sig_name}-target-pos",
            [float(target_pos.x), float(target_pos.y), float(target_pos.z)],
        )
        if not api.is_simulator and "external" in sig_name:
            _pause_for_ready(
                ctx,
                f"连接 {sig_name.upper()}。"
                if LOCALIZE
                else f"Connect {sig_name.upper()}.",
            )
            _pause_for_ready(
                ctx,
                "准备按下急停按钮。" if LOCALIZE else "Prepare to hit the E-STOP.",
            )
        api._move_and_interrupt_with_signal(sig_name)
        if not api.is_simulator and "external" in sig_name:
            _pause_for_ready(
                ctx, "释放急停按钮。" if LOCALIZE else "Release the E-STOP."
            )
        if "external" in sig_name or "estop" in sig_name:
            api._update_position_estimation([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
        stop_pos = api.gantry_position(mount, refresh=True)
        report(
            section,
            f"{sig_name}-stop-pos",
            [float(stop_pos.x), float(stop_pos.y), float(stop_pos.z)],
        )
        diff = start_pos + (stop_pos * -1)
        print(f"start: {start_pos}, stop: {stop_pos}, diff: {diff}")
        x_passed = ROUND_ERR_MARGIN < diff.x < MOVING_DISTANCE - ROUND_ERR_MARGIN
        y_passed = ROUND_ERR_MARGIN < diff.y < MOVING_DISTANCE - ROUND_ERR_MARGIN
        z_passed = ROUND_ERR_MARGIN < diff.z < MOVING_DISTANCE - ROUND_ERR_MARGIN
        result = CSVResult.from_bool(x_passed and y_passed and z_passed)
        report(section, f"{sig_name}-result", [result])
        _comment_test_result(ctx, f"SIGNALS: {sig_name}-result", result)
    _signal_home(api, ctx)


# Instrument tests
PLUNGER_TOLERANCE_MM = 0.2
GRIPPER_GRIP_FORCE = 20
GRIPPER_JAW_WIDTH_TOLERANCE_MM = 3.0
Z_PROBE_DISTANCE_MM = 100
Z_PROBE_TIME_SECONDS = 5
PROBE_SETTINGS = CapacitivePassSettings(
    prep_distance_mm=Z_PROBE_DISTANCE_MM,
    max_overrun_distance_mm=0,
    speed_mm_per_s=Z_PROBE_DISTANCE_MM / Z_PROBE_TIME_SECONDS,
    sensor_threshold_pf=1.0,
)
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


def _build_instrument_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    tests: List[Union[CSVLine, CSVLineRepeating]] = []
    for test, data in PIPETTE_TESTS.items():
        for mount in ["left", "right"]:
            tests.append(CSVLine(f"{mount}-{test}", data))  # type: ignore[arg-type]
    for test, data in GRIPPER_TESTS.items():
        tests.append(CSVLine(f"gripper-{test}", data))  # type: ignore[arg-type]
    return tests


def _get_plunger_positions(
    api: SyncHardwareAPI, mount: OT3Mount
) -> Tuple[float, float]:
    axis = Axis.of_main_tool_actuator(mount)
    estimates = api.current_position_ot3(mount)
    encoders = api.encoder_current_position_ot3(mount)
    return estimates[axis], encoders[axis]


def _test_current_position_and_record_result(
    api: SyncHardwareAPI,
    mount: OT3Mount,
    report: CSVReport,
    section: str,
    tag: str,
    ctx: ProtocolContext,
) -> None:
    estimate, encoder = _get_plunger_positions(api, mount)
    result = CSVResult.from_bool(abs(estimate - encoder) < PLUNGER_TOLERANCE_MM)
    report(section, tag, [estimate, encoder, result])
    _comment_test_result(ctx, f"INSTRUMENTS: {tag}", result)


def _device_barcode(
    api: SyncHardwareAPI,
    ctx: ProtocolContext,
    dut: helpers_ot3.DeviceUnderTest,
    fallback: str,
) -> str:
    if api.is_simulator:
        return fallback
    return helpers_ot3.get_device_barcode(ctx, api, dut)


def _probe_mount_and_record_result(
    api: SyncHardwareAPI,
    mount: OT3Mount,
    report: CSVReport,
    section: str,
    tag: str,
    ctx: ProtocolContext,
    probe: Optional[GripperProbe] = None,
) -> None:
    z_ax = Axis.by_mount(mount)
    api.home([z_ax])
    if mount == OT3Mount.GRIPPER:
        assert probe, "you must specify which gripper probe (front/rear) you are using"
        api.grip(GRIPPER_GRIP_FORCE)
        if not api.is_simulator:
            _pause_for_ready(
                ctx,
                f"安装 {probe.name} 校准探针。"
                if LOCALIZE
                else f"Attach {probe.name} calibration probe.",
            )
        api.add_gripper_probe(probe)
    else:
        api.add_tip(mount, 0.1)
    pos = api.gantry_position(mount)
    height_of_probe_full_travel = pos.z - Z_PROBE_DISTANCE_MM
    if not api.is_simulator:
        _pause_for_ready(
            ctx,
            "即将向下探测，请触摸传感器以停止探测运动。"
            if LOCALIZE
            else "About to probe down. Touch the sensor to stop probing motion.",
        )
    print("touch with your finger to stop the probing motion")
    height_of_probe_stopped, _ = api.capacitive_probe(
        mount, z_ax, height_of_probe_full_travel, PROBE_SETTINGS
    )
    height_diff = height_of_probe_stopped - height_of_probe_full_travel
    result = CSVResult.from_bool(Z_PROBE_DISTANCE_MM - 1 > abs(height_diff) > 1)
    report(
        section,
        tag,
        [float(height_of_probe_full_travel), float(height_of_probe_stopped), result],
    )
    _comment_test_result(ctx, f"INSTRUMENTS: {tag}", result)
    if mount == OT3Mount.GRIPPER:
        if not api.is_simulator:
            _pause_for_ready(
                ctx, "移除校准探针。" if LOCALIZE else "Remove calibration probe."
            )
        api.remove_gripper_probe()
        api.ungrip()
    else:
        api.remove_tip(mount)


def _test_pipette(
    api: SyncHardwareAPI,
    mount: OT3Mount,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
) -> None:
    mnt_tag = mount.name.lower()
    pipette = api.hardware_pipettes[mount.to_mount()]
    assert pipette
    pip_id = helpers_ot3.get_pipette_serial_ot3(pipette)
    pip_ax = Axis.of_main_tool_actuator(mount)
    top, _, _, drop_tip = helpers_ot3.get_plunger_positions_ot3(api, mount)

    dut = (
        helpers_ot3.DeviceUnderTest.PIPETTE_LEFT
        if mount == OT3Mount.LEFT
        else helpers_ot3.DeviceUnderTest.PIPETTE_RIGHT
    )
    user_id = _device_barcode(api, ctx, dut, str(pip_id)).strip()
    result = CSVResult.from_bool(pip_id == user_id)
    print(f"pipette: {pip_id}, barcode={user_id}")
    report(section, f"{mnt_tag}-id", [pip_id, user_id, result])
    _comment_test_result(ctx, f"INSTRUMENTS: {mnt_tag}-id", result)

    print("homing plunger...")
    api.home([pip_ax])
    _test_current_position_and_record_result(
        api, mount, report, section, f"{mnt_tag}-plunger-home", ctx
    )
    print(f"moving to drop_tip ({drop_tip}mm)")
    helpers_ot3.move_plunger_absolute_ot3_sync(api, mount, drop_tip - 1)
    _test_current_position_and_record_result(
        api, mount, report, section, f"{mnt_tag}-plunger-max", ctx
    )
    print(f"moving to top ({top}mm)")
    helpers_ot3.move_plunger_absolute_ot3_sync(api, mount, top + 1)
    _test_current_position_and_record_result(
        api, mount, report, section, f"{mnt_tag}-plunger-min", ctx
    )
    _probe_mount_and_record_result(
        api, mount, report, section, f"{mnt_tag}-probe-distance", ctx
    )


def _test_gripper(
    api: SyncHardwareAPI, report: CSVReport, section: str, ctx: ProtocolContext
) -> None:
    api.cache_instruments()
    mount = OT3Mount.GRIPPER
    z_ax = Axis.by_mount(mount)
    jaw_ax = Axis.of_main_tool_actuator(mount)
    gripper = api._gripper_handler.gripper
    assert gripper
    gripper_id = gripper.gripper_id
    jaw_widths = gripper.config.geometry.jaw_width

    user_id = _device_barcode(
        api, ctx, helpers_ot3.DeviceUnderTest.GRIPPER, str(gripper_id)
    ).strip()
    result = CSVResult.from_bool(gripper_id == user_id)
    print(f"gripper: {gripper_id}, barcode: {user_id}")
    report(section, "gripper-id", [gripper_id, user_id, result])
    _comment_test_result(ctx, "INSTRUMENTS: gripper-id", result)

    result = CSVResult.FAIL
    target_z = 100
    api.home([z_ax, Axis.G])
    start_pos = api.gantry_position(OT3Mount.GRIPPER)
    api.move_to(mount, start_pos._replace(z=target_z), expect_stalls=True)
    enc_pos = api.encoder_current_position_ot3(OT3Mount.GRIPPER)
    if abs(enc_pos[Axis.Z_G] - target_z) < 0.25:
        api.move_to(mount, start_pos, expect_stalls=True)
        if abs(enc_pos[Axis.Z_G] - target_z) < 0.25:
            result = CSVResult.PASS
    api.home([z_ax])
    report(section, "gripper-no-skip", [result])
    _comment_test_result(ctx, "INSTRUMENTS: gripper-no-skip", result)
    api.home([z_ax])

    def _get_jaw_width_and_record_result(min_max: str) -> None:
        encoders = api.encoder_current_position_ot3(mount)
        width = jaw_widths["max"] - (encoders[jaw_ax] * 2)
        diff = abs(width - jaw_widths[min_max])
        print(f"jaw: encoder={encoders[jaw_ax]}, width={width}")
        result = CSVResult.from_bool(diff < GRIPPER_JAW_WIDTH_TOLERANCE_MM)
        report(
            section,
            f"gripper-jaw-{min_max}",
            [width, jaw_widths[min_max], result],
        )
        _comment_test_result(ctx, f"INSTRUMENTS: gripper-jaw-{min_max}", result)

    api.home([jaw_ax])
    api.grip(GRIPPER_GRIP_FORCE)
    _get_jaw_width_and_record_result("min")
    api.ungrip()
    _get_jaw_width_and_record_result("max")
    _probe_mount_and_record_result(
        api,
        mount,
        report,
        section,
        "gripper-probe-distance-front",
        ctx,
        GripperProbe.FRONT,
    )
    _probe_mount_and_record_result(
        api,
        mount,
        report,
        section,
        "gripper-probe-distance-rear",
        ctx,
        GripperProbe.REAR,
    )


def _wait_for_instrument_presence(
    api: SyncHardwareAPI,
    mount: OT3Mount,
    presence: bool,
    ctx: ProtocolContext,
) -> bool:
    is_gripper = mount == OT3Mount.GRIPPER
    if LOCALIZE:
        instr_str = "夹爪" if is_gripper else "移液器"
        if presence:
            prompt = f"将{instr_str}安装到 {mount.name} 装载位"
        else:
            prompt = f"从 {mount.name} 装载位取下{instr_str}"
    else:
        instr_str = "gripper" if is_gripper else "pipette"
        verb = "attach" if presence else "remove"
        direction = "to" if presence else "from"
        prompt = f"{verb.capitalize()} a {instr_str} {direction} the {mount.name} mount."
    if not api.is_simulator:
        _pause_for_ready(ctx, prompt)
    api.reset()
    api.cache_instruments()
    found = (
        api.has_gripper()
        if is_gripper
        else api.hardware_pipettes[mount.to_mount()] is not None
    )
    if found == presence:
        if LOCALIZE:
            action = "安装" if presence else "取下"
            print(f"{mount.name} 装载位已{action}{instr_str}")
        else:
            print(f"{instr_str} {verb} {direction} {mount.name}")
        return True
    if LOCALIZE:
        action = "安装" if presence else "取下"
        print(f"错误：未检测到已在 {mount.name} 装载位{action}{instr_str}")
    else:
        print(
            f"ERROR: unable to detect {instr_str} was {verb}ed {direction} {mount.name} mount"
        )
    return False


def _run_instruments(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    print("homing...")
    api.home_z()
    print("moving to front of machine")
    slot_pos = helpers_ot3.get_slot_calibration_square_position_ot3(4)
    current_pos = api.gantry_position(OT3Mount.LEFT)
    attach_pos = slot_pos._replace(z=current_pos.z)
    api.move_to(OT3Mount.LEFT, attach_pos)

    for mount in [OT3Mount.LEFT, OT3Mount.RIGHT]:
        ctx.comment(
            f"仪器：{mount.name} 移液器"
            if LOCALIZE
            else f"INSTRUMENTS: PIPETTE {mount.name}"
        )
        if _wait_for_instrument_presence(api, mount, True, ctx):
            _test_pipette(api, mount, report, section, ctx)
            _wait_for_instrument_presence(api, mount, False, ctx)
    ctx.comment("仪器：夹爪" if LOCALIZE else "INSTRUMENTS: GRIPPER")
    if _wait_for_instrument_presence(api, OT3Mount.GRIPPER, True, ctx):
        _test_gripper(api, report, section, ctx)
        _wait_for_instrument_presence(api, OT3Mount.GRIPPER, False, ctx)


# Connectivity tests
PRE_TEST_CONDITIONS = RearPinState()
PRE_TEST_CONDITIONS.aux1_estop_det = False
PRE_TEST_CONDITIONS.aux2_estop_det = False
PRE_TEST_CONDITIONS.aux1_aux_det = False
PRE_TEST_CONDITIONS.aux2_aux_det = False
PRE_TEST_CONDITIONS.aux1_id_active = False
PRE_TEST_CONDITIONS.aux2_id_active = False
PRE_TEST_CONDITIONS.estop_active = False
PRE_TEST_CONDITIONS.door_open = True
PRE_TEST_CONDITIONS.sync_engaged = False

AUX_1_CONDITIONS = RearPinState()
AUX_1_CONDITIONS.aux1_estop_det = True
AUX_1_CONDITIONS.aux2_estop_det = False
AUX_1_CONDITIONS.aux1_aux_det = True
AUX_1_CONDITIONS.aux2_aux_det = False
AUX_1_CONDITIONS.aux1_id_active = True
AUX_1_CONDITIONS.aux2_id_active = False
AUX_1_CONDITIONS.estop_active = False
AUX_1_CONDITIONS.door_open = False
AUX_1_CONDITIONS.sync_engaged = True

AUX_2_CONDITIONS = RearPinState()
AUX_2_CONDITIONS.aux1_estop_det = False
AUX_2_CONDITIONS.aux2_estop_det = True
AUX_2_CONDITIONS.aux1_aux_det = False
AUX_2_CONDITIONS.aux2_aux_det = True
AUX_2_CONDITIONS.aux1_id_active = False
AUX_2_CONDITIONS.aux2_id_active = True
AUX_2_CONDITIONS.estop_active = False
AUX_2_CONDITIONS.door_open = False
AUX_2_CONDITIONS.sync_engaged = True

POST_PLUG_CONDITIONS = RearPinState()
POST_PLUG_CONDITIONS.aux1_estop_det = True
POST_PLUG_CONDITIONS.aux2_estop_det = True
POST_PLUG_CONDITIONS.aux1_aux_det = True
POST_PLUG_CONDITIONS.aux2_aux_det = True
POST_PLUG_CONDITIONS.aux1_id_active = False
POST_PLUG_CONDITIONS.aux2_id_active = False
POST_PLUG_CONDITIONS.estop_active = False
POST_PLUG_CONDITIONS.door_open = True
POST_PLUG_CONDITIONS.sync_engaged = False

ESTOP_CONDITIONS = RearPinState()
ESTOP_CONDITIONS.aux1_estop_det = True
ESTOP_CONDITIONS.aux2_estop_det = True
ESTOP_CONDITIONS.aux1_aux_det = True
ESTOP_CONDITIONS.aux2_aux_det = True
ESTOP_CONDITIONS.aux1_id_active = False
ESTOP_CONDITIONS.aux2_id_active = False
ESTOP_CONDITIONS.estop_active = True
ESTOP_CONDITIONS.door_open = True
ESTOP_CONDITIONS.sync_engaged = False

PROMPT_UNPLUGGED = (
    "确保 AUX 测试器未插入"
    if LOCALIZE
    else "ENSURE AUX TESTER IS NOT PLUGGED IN"
)
PROMPT_AUX_1 = "插入 AUX 端口 1" if LOCALIZE else "PLUG IN AUX PORT 1"
PROMPT_PLUGGED = "插入 AUX 端口 2" if LOCALIZE else "PLUG IN AUX PORT 2"
PROMPT_ESTOP_1 = "按下 ESTOP 1" if LOCALIZE else "PRESS ESTOP 1"
PROMPT_ESTOP_2 = (
    "释放 ESTOP 1，按下 ESTOP 2" if LOCALIZE else "RELEASE ESTOP 1, PRESS ESTOP 2"
)
PROMPT_AUX_2 = "拔掉 AUX 端口 1" if LOCALIZE else "UNPLUG AUX PORT 1"
APT_PROMPT = 0
APT_PASS_STATE = 1
APT_SYNC_STATE = 2
AUX_ESTOP_POLL_INTERVAL_SECONDS = 0.2
AUX_ESTOP_POLL_TIMEOUT_SECONDS = 120
AUX_ESTOP_TEST_NAMES = ["ESTOP_1_TEST", "ESTOP_2_TEST"]
AUX_PORT_TESTS: Dict[str, Any] = {
    "UNPLUGGED_TEST": [PROMPT_UNPLUGGED, PRE_TEST_CONDITIONS, 0],
    "AUX_1_TEST": [PROMPT_AUX_1, AUX_1_CONDITIONS, 1],
    "PLUGGED_TEST": [PROMPT_PLUGGED, POST_PLUG_CONDITIONS, 0],
    "ESTOP_1_TEST": [PROMPT_ESTOP_1, ESTOP_CONDITIONS, 0],
    "ESTOP_2_TEST": [PROMPT_ESTOP_2, ESTOP_CONDITIONS, 0],
    "CAN": 0,
    "AUX_2_TEST": [PROMPT_AUX_2, AUX_2_CONDITIONS, 1],
}
USB_PORTS_TO_TEST = [
    "usb-1",
    "usb-2",
    "usb-3",
    "usb-4",
    "usb-5",
    "usb-6",
    "usb-7",
    "usb-8",
    "usb-9",
]
USB_PORTS_MAPPING = {
    "usb-1": "1-1/1-1.4/1-1.4.4/1-1.4.4",
    "usb-2": "1-1/1-1.4/1-1.4.3/1-1.4.3",
    "usb-3": "1-1/1-1.4/1-1.4.2/1-1.4.2",
    "usb-4": "1-1/1-1.4/1-1.4.1/1-1.4.1",
    "usb-5": "1-1/1-1.3/1-1.3.4/1-1.3.4",
    "usb-6": "1-1/1-1.3/1-1.3.3/1-1.3.3",
    "usb-7": "1-1/1-1.3/1-1.3.2/1-1.3.2",
    "usb-8": "1-1/1-1.3/1-1.3.1/1-1.3.1",
    "usb-9": "1-1/1-1.7/1-1.7",
}
AUX_CAN_TESTS = ["aux-1-pcan", "aux-2-pcan"]
ALLOWED_SECURITY_TYPES = {
    nmcli.SECURITY_TYPES.NONE.value: nmcli.SECURITY_TYPES.NONE,
    nmcli.SECURITY_TYPES.WPA_EAP.value: nmcli.SECURITY_TYPES.WPA_EAP,
    nmcli.SECURITY_TYPES.WPA_PSK.value: nmcli.SECURITY_TYPES.WPA_PSK,
}


def _build_connectivity_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    usb_a_tests = [CSVLine(t, [CSVResult]) for t in USB_PORTS_TO_TEST]
    aux_tests = [
        CSVLine(t, [str, CSVResult]) for t in AUX_PORT_TESTS.keys() if t != "CAN"
    ]
    can_tests = [CSVLine(t, [CSVResult]) for t in AUX_CAN_TESTS]
    other_tests = [
        CSVLine("ethernet", [str, str, CSVResult]),
        CSVLine("wifi", [str, str, str, str, CSVResult]),
        CSVLine("usb-b-rear", [CSVResult]),
    ]
    return other_tests + usb_a_tests + aux_tests + can_tests  # type: ignore[return-value]


async def _get_ethernet_status_async() -> Tuple[str, str]:
    ethernet_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.ETH_LL)
    return ethernet_status["ipAddress"], ethernet_status["macAddress"]


def _test_ethernet(
    api: SyncHardwareAPI, report: CSVReport, section: str, ctx: ProtocolContext
) -> None:
    if not api.is_simulator:
        _pause_for_ready(
            ctx, "连接以太网电缆。" if LOCALIZE else "Connect ethernet cable."
        )
        eth_ip, eth_mac = _run_hw_coroutine(api, _get_ethernet_status_async)
    else:
        eth_ip = "0.0.0.0"
        eth_mac = "AA:AA:AA:AA:AA:AA"
    eth_result = CSVResult.from_bool(bool(eth_ip))
    report(section, "ethernet", [eth_ip, eth_mac, eth_result])
    _comment_test_result(ctx, "CONNECTIVITY: ethernet", eth_result)


async def _test_wifi_async(
    report: CSVReport, section: str, cfg: TestConfig, ctx: ProtocolContext
) -> None:
    ssid = cfg.wifi_ssid.strip()
    password: Optional[str] = cfg.wifi_password if cfg.wifi_password else None
    result: Optional[CSVResult] = CSVResult.FAIL
    wifi_ip: Optional[str] = None
    wifi_mac: Optional[str] = None

    def _finish() -> None:
        report(section, "wifi", [ssid, password or "", wifi_ip, wifi_mac, result])
        if result is not None:
            _comment_test_result(ctx, "CONNECTIVITY: wifi", result)

    LOG.info(f"System Architecture: {config.ARCHITECTURE}")
    try:
        wifi_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.WIFI)
        wifi_ip = wifi_status["ipAddress"]
        wifi_mac = wifi_status["macAddress"]
        if wifi_ip:
            result = CSVResult.PASS
            return _finish()
    except ValueError:
        result = CSVResult.FAIL
        return _finish()

    if not ssid:
        print("No wifi_ssid runtime parameter supplied.")
        return _finish()
    print(f'connecting to "{ssid}"...')
    try:
        ssids = await nmcli.available_ssids()
        found_ssids = [s for s in ssids if ssid == s["ssid"]]
        if not found_ssids:
            print(f'wifi network "{ssid}" not found')
            return _finish()
        sec = ALLOWED_SECURITY_TYPES[found_ssids[0]["securityType"]]
        await nmcli.configure(ssid, sec, psk=password)
    except ValueError as e:
        print(str(e))
        return _finish()
    wifi_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.WIFI)
    wifi_ip = wifi_status["ipAddress"]
    wifi_mac = wifi_status["macAddress"]
    result = CSVResult.from_bool(bool(wifi_ip))
    return _finish()


def _test_wifi(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    cfg: TestConfig,
    ctx: ProtocolContext,
) -> None:
    _run_hw_coroutine(api, _test_wifi_async, report, section, cfg, ctx)


def _test_usb_a_ports(
    api: SyncHardwareAPI, report: CSVReport, section: str, ctx: ProtocolContext
) -> None:
    if not api.is_simulator:
        _pause_for_ready(
            ctx,
            "将全部九个 USB-A 端口插入 USB 驱动器。"
            if LOCALIZE
            else "Insert USB drives into all nine USB-A ports.",
        )
        print("pausing 2 seconds before reading USB data")
        sleep(2)
        for tag in USB_PORTS_TO_TEST:
            res = run_subprocess(
                ["blkid", "--label", f"OT3-{tag.upper()}"],
                capture_output=True,
                text=True,
            )
            blkid_out = res.stdout
            LOG.info(f"OT3-{tag.upper()}: {blkid_out}")
            if len(blkid_out) == 0:
                print(f"OT3-{tag.upper()} NOT FOUND")
                report(section, tag, [CSVResult.FAIL])
                _comment_test_result(ctx, f"CONNECTIVITY: {tag}", CSVResult.FAIL)
                continue
            match = re.search(r"/dev/([a-z]{3}\d)", blkid_out)
            if not match:
                print(f"no match found: {tag}")
                report(section, tag, [CSVResult.FAIL])
                _comment_test_result(ctx, f"CONNECTIVITY: {tag}", CSVResult.FAIL)
                continue
            drive_name = match.group(1)
            res = run_subprocess(
                ["find", "/sys/bus/usb/devices/usb1/", "-name", drive_name],
                capture_output=True,
                text=True,
            )
            usb_port = res.stdout
            port_match = USB_PORTS_MAPPING[tag] in usb_port
            if not port_match:
                print(f"OT3-{tag.upper()} WRONG PORT")
            port_result = CSVResult.from_bool(port_match)
            report(section, tag, [port_result])
            _comment_test_result(ctx, f"CONNECTIVITY: {tag}", port_result)
    else:
        output_names = " ".join([f"OT3-{p.upper()}" for p in USB_PORTS_TO_TEST])
        for tag in USB_PORTS_TO_TEST:
            found = f"OT3-{tag.upper()}" in output_names
            sim_result = CSVResult.from_bool(found)
            report(section, tag, [sim_result])
            _comment_test_result(ctx, f"CONNECTIVITY: {tag}", sim_result)


def _format_aux_pin_comparison(
    result: RearPinState, pass_states: RearPinState
) -> Tuple[bool, str]:
    formatted_result = ""
    result_dict = vars(result)
    pass_dict = vars(pass_states)
    for key in result_dict.keys():
        f = key + ("=PASS" if result_dict[key] == pass_dict[key] else "=FAIL")
        print(f)
        formatted_result += f + "|"
    return result == pass_states, formatted_result


async def _aux_subtest_async(
    api: OT3API,
    ui_prompt: str,
    pass_states: RearPinState,
    sync_state: int,
) -> Tuple[bool, str]:
    del ui_prompt
    backend = cast(OT3Controller, api._backend)
    await set_sync_pin(sync_state, backend._usb_messenger)
    result = await get_all_pin_state(backend._usb_messenger)
    LOG.info(f"Aux Result: {result}")
    await set_sync_pin(0, backend._usb_messenger)
    return _format_aux_pin_comparison(result, pass_states)


async def _poll_aux_pin_state(
    messenger: Any,
    pass_states: RearPinState,
    sync_state: int,
    timeout_seconds: float = AUX_ESTOP_POLL_TIMEOUT_SECONDS,
) -> Tuple[bool, str]:
    deadline = monotonic() + timeout_seconds
    last_formatted = ""
    while monotonic() < deadline:
        await set_sync_pin(sync_state, messenger)
        result = await get_all_pin_state(messenger)
        await set_sync_pin(0, messenger)
        passed, last_formatted = _format_aux_pin_comparison(result, pass_states)
        if passed:
            return True, last_formatted
        await asyncio.sleep(AUX_ESTOP_POLL_INTERVAL_SECONDS)
    return False, last_formatted


async def _poll_aux_until_estop_released(
    messenger: Any,
    timeout_seconds: float = AUX_ESTOP_POLL_TIMEOUT_SECONDS,
) -> bool:
    deadline = monotonic() + timeout_seconds
    while monotonic() < deadline:
        result = await get_all_pin_state(messenger)
        if not result.estop_active:
            return True
        await asyncio.sleep(AUX_ESTOP_POLL_INTERVAL_SECONDS)
    return False


async def _ack_estop_async(api: OT3API) -> None:
    backend = cast(OT3Controller, api._backend)
    backend.estop_acknowledge_and_clear()
    await backend.release_estop()


async def _aux_estop_tests_async(
    api: OT3API,
) -> Tuple[Tuple[bool, str], Tuple[bool, str]]:
    """Run ESTOP 1/2 tests in one hardware session without ctx.pause.

    Protocol runs register an E-stop callback that terminates the run when
    ctx.pause() is active and the operator presses ESTOP. Polling pin state
    directly on hardware keeps the read on the hardware loop so results can be
    recorded before the async engine teardown runs.
    """
    backend = cast(OT3Controller, api._backend)
    messenger = backend._usb_messenger
    sync_state = AUX_PORT_TESTS["ESTOP_1_TEST"][APT_SYNC_STATE]
    pass_states = ESTOP_CONDITIONS

    print("Press ESTOP 1..." if not LOCALIZE else "请按下 ESTOP 1...")
    estop1_pass, estop1_fmt = await _poll_aux_pin_state(
        messenger, pass_states, sync_state
    )

    print(
        "Release ESTOP 1, press ESTOP 2..."
        if not LOCALIZE
        else "请释放 ESTOP 1，按下 ESTOP 2..."
    )
    if estop1_pass:
        if await _poll_aux_until_estop_released(messenger):
            await _ack_estop_async(api)
        else:
            return (estop1_pass, estop1_fmt), (
                False,
                "timeout waiting for estop release|",
            )

    estop2_pass, estop2_fmt = await _poll_aux_pin_state(
        messenger, pass_states, sync_state
    )
    return (estop1_pass, estop1_fmt), (estop2_pass, estop2_fmt)


def _test_aux(
    api: SyncHardwareAPI, report: CSVReport, section: str, ctx: ProtocolContext
) -> None:
    for test_name, test_config in AUX_PORT_TESTS.items():
        if test_name == "CAN":
            if not api.is_simulator:
                _pause_for_ready(
                    ctx, "释放 ESTOP 2。" if LOCALIZE else "Release ESTOP 2."
                )
                _pause_for_ready(
                    ctx,
                    "准备 CAN 分析仪和 PCAN 软件。"
                    if LOCALIZE
                    else "Prepare CAN analyzer and PCAN software.",
                )
            for can_test_name in AUX_CAN_TESTS:
                if api.is_simulator:
                    result = CSVResult.PASS
                else:
                    can_prompt = (
                        f"{can_test_name.upper()} 的 TRANSMIT 计数是否等于 RECEIVE？"
                        if LOCALIZE
                        else f"Does {can_test_name.upper()} count TRANSMIT = RECEIVE?"
                    )
                    inp = _get_user_answer_sync(api, ctx, can_prompt)
                    result = CSVResult.from_bool(inp)
                report(section, can_test_name, [result])
                _comment_test_result(ctx, f"CONNECTIVITY: {can_test_name}", result)
        elif test_name == "ESTOP_2_TEST":
            continue
        elif test_name == "ESTOP_1_TEST":
            if api.is_simulator:
                for estop_name in AUX_ESTOP_TEST_NAMES:
                    sim_result = CSVResult.PASS
                    report(section, estop_name, ["", sim_result])
                    _comment_test_result(ctx, f"CONNECTIVITY: {estop_name}", sim_result)
                continue
            ctx.comment(
                "AUX：请按下 ESTOP 1，协议将自动检测引脚状态。"
                if LOCALIZE
                else "AUX: Press ESTOP 1; the protocol will poll pin state automatically."
            )
            estop_results = _run_hw_coroutine(
                api, _aux_estop_tests_async, _async_api(api)
            )
            for estop_name, (passed, formatted) in zip(
                AUX_ESTOP_TEST_NAMES, estop_results
            ):
                aux_result = CSVResult.from_bool(passed)
                report(section, estop_name, [formatted, aux_result])
                _comment_test_result(ctx, f"CONNECTIVITY: {estop_name}", aux_result)
        else:
            if api.is_simulator:
                sim_result = CSVResult.PASS
                report(section, test_name, ["", sim_result])
                _comment_test_result(ctx, f"CONNECTIVITY: {test_name}", sim_result)
                continue
            _pause_for_ready(ctx, test_config[APT_PROMPT])
            test_result = _run_hw_coroutine(
                api,
                _aux_subtest_async,
                _async_api(api),
                test_config[APT_PROMPT],
                test_config[APT_PASS_STATE],
                test_config[APT_SYNC_STATE],
            )
            aux_result = CSVResult.from_bool(test_result[0])
            report(section, test_name, [test_result[1], aux_result])
            _comment_test_result(ctx, f"CONNECTIVITY: {test_name}", aux_result)
    if not api.is_simulator:
        _pause_for_ready(
            ctx, "拔掉所有 AUX 电缆。" if LOCALIZE else "Unplug all AUX cables."
        )


def _run_connectivity(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    ctx.comment("连接性：以太网" if LOCALIZE else "CONNECTIVITY: ETHERNET")
    _test_ethernet(api, report, section, ctx)
    ctx.comment("连接性：WiFi" if LOCALIZE else "CONNECTIVITY: WIFI")
    if not api.is_simulator:
        _test_wifi(api, report, section, cfg, ctx)
    else:
        wifi_result = CSVResult.PASS
        report(
            section, "wifi", ["", "", "0.0.0.0", "AA:AA:AA:AA:AA:AA", wifi_result]
        )
        _comment_test_result(ctx, "CONNECTIVITY: wifi", wifi_result)
        assert nmcli.iface_info is not None
        assert nmcli.configure is not None
        assert nmcli.wifi_disconnect is not None
    ctx.comment("连接性：USB-B 后部" if LOCALIZE else "CONNECTIVITY: USB-B-REAR")
    if not api.is_simulator:
        _pause_for_ready(
            ctx,
            "将 USB-B 连接到电脑，电脑是否检测到设备？"
            if LOCALIZE
            else "Connect USB-B to computer, does computer detect device?",
        )
        # TODO: add check for device detection (run "ls /dev/tty.*")
        result = CSVResult.from_bool(True)
    else:
        result = CSVResult.PASS
    report(section, "usb-b-rear", [result])
    _comment_test_result(ctx, "CONNECTIVITY: usb-b-rear", result)
    ctx.comment("连接性：USB-A" if LOCALIZE else "CONNECTIVITY: USB-A")
    _test_usb_a_ports(api, report, section, ctx)
    ctx.comment("连接性：AUX" if LOCALIZE else "CONNECTIVITY: AUX")
    _test_aux(api, report, section, ctx)


# Peripheral tests
SERVER_PORT = 8083
SERVER_CMD = "{0} -m http.server {1} --directory {2}"
CAM_PIC_FILE_NAME = "camera_{0}.jpg"
CAM_CMD_OT3 = (
    "v4l2-ctl --device /dev/video2 --set-fmt-video=width=640,height=480,pixelformat=MJPG "
    "--stream-mmap --stream-to={0} --stream-count=1"
)
FLEX_SKUS_NO_CAMERA = ["999-00279"]
COLOR_TO_STATE: Dict[str, Tuple[int, int, int, int]] = {
    "off": (0, 0, 0, 0),
    "white": (0, 0, 0, 255),
    "red": (255, 0, 0, 0),
    "green": (0, 255, 0, 0),
    "blue": (0, 0, 255, 0),
}
STATUS_LIGHT_COLOR_NAMES: Dict[str, str] = {
    "off": "关闭" if LOCALIZE else "off",
    "white": "白色" if LOCALIZE else "white",
    "red": "红色" if LOCALIZE else "red",
    "green": "绿色" if LOCALIZE else "green",
    "blue": "蓝色" if LOCALIZE else "blue",
}


def _build_peripheral_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    return [
        CSVLine("screen-on", [CSVResult]),
        CSVLine("screen-touch", [CSVResult]),
        CSVLine("deck-lights-on", [CSVResult]),
        CSVLine("deck-lights-off", [CSVResult]),
        CSVLine("status-light-off", [CSVResult]),
        CSVLine("status-light-white", [CSVResult]),
        CSVLine("status-light-red", [CSVResult]),
        CSVLine("status-light-green", [CSVResult]),
        CSVLine("status-light-blue", [CSVResult]),
        CSVLine("door-switch", [CSVResult]),
        CSVLine("camera-active", [CSVResult]),
        CSVLine("camera-image", [CSVResult]),
    ]


async def _get_ip(api: OT3API) -> Optional[str]:
    ip_address: Optional[str] = None
    if api.is_simulator:
        assert nmcli.iface_info is not None
        ip_address = "127.0.0.1"
    else:
        ethernet_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.ETH_LL)
        wifi_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.WIFI)
        if ethernet_status["ipAddress"]:
            ip_address = ethernet_status["ipAddress"]
        elif wifi_status["ipAddress"]:
            ip_address = wifi_status["ipAddress"]
        if ip_address:
            ip_address = ip_address.split("/")[0]
    return ip_address


async def _take_picture(
    api: OT3API, report: CSVReport, section: str, ctx: ProtocolContext
) -> Optional[Path]:
    cam_pic_name = CAM_PIC_FILE_NAME.format(create_datetime_string())
    if api.is_simulator:
        cam_pic_name = cam_pic_name.replace(".jpg", ".txt")
    cam_pic_path = report.parent / cam_pic_name
    process_cmd = CAM_CMD_OT3.format(str(cam_pic_path))
    print(f'command to take a picture: "{process_cmd}"')
    try:
        if api.is_simulator:
            with open(cam_pic_path, "w") as f:
                f.write(str(cam_pic_name))
        else:
            run_subprocess(process_cmd.split(" "))
        result = CSVResult.from_bool(cam_pic_path.exists())
    except CalledProcessError as e:
        print(str(e))
        result = CSVResult.FAIL
    report(section, "camera-active", [result])
    _comment_test_result(ctx, "PERIPHERALS: camera-active", result)
    if bool(result):
        return cam_pic_path
    return None


async def _run_image_check_server_async(
    api: OT3API,
    report: CSVReport,
    section: str,
    file_path: Path,
    ctx: ProtocolContext,
) -> Optional[str]:
    result: Optional[CSVResult] = CSVResult.FAIL
    server_process: Optional[Popen] = None
    address: Optional[str] = None

    async def _run_check() -> None:
        nonlocal result
        nonlocal server_process
        nonlocal address
        ip_address = await _get_ip(api)
        if not ip_address:
            print("no IP address")
            return
        server_address = f"{ip_address}:{SERVER_PORT}"
        for py in ["python3", "python"]:
            process_cmd = SERVER_CMD.format(py, SERVER_PORT, str(file_path.parent))
            print(f'command to start http server: "{process_cmd}"')
            try:
                server_process = Popen(process_cmd.split(" "))
                break
            except Exception as e:
                print(str(e))
        if not server_process:
            print("unable to start http server")
            return
        await asyncio.sleep(0.5)
        address = f"http://{server_address}/{file_path.name}"
        print(f"\n\nopen your web browser, and go to:\n\n\t{address}\n\n")
        if api.is_simulator:
            try:
                contents = urlopen(address).read()
            except Exception as e:
                print(str(e))
                return
            result = CSVResult.from_bool(contents.decode("utf-8") == file_path.name)

    await _run_check()
    if api.is_simulator:
        if server_process:
            server_process.kill()
        report(section, "camera-image", [result])
        _comment_test_result(ctx, "PERIPHERALS: camera-image", result)
        return None
    return address


def _run_image_check_server(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    file_path: Path,
    ctx: ProtocolContext,
) -> None:
    async_api = _async_api(api)
    if api.is_simulator:
        _run_hw_coroutine(
            api,
            _run_image_check_server_async,
            async_api,
            report,
            section,
            file_path,
            ctx,
        )
        return
    result: Optional[CSVResult] = CSVResult.FAIL
    server_process: Optional[Popen] = None
    ip_address = _run_hw_coroutine(api, _get_ip, async_api)
    if not ip_address:
        print("no IP address")
        report(section, "camera-image", [result])
        _comment_test_result(ctx, "PERIPHERALS: camera-image", result)
        return
    server_address = f"{ip_address}:{SERVER_PORT}"
    try:
        for py in ["python3", "python"]:
            process_cmd = SERVER_CMD.format(py, SERVER_PORT, str(file_path.parent))
            print(f'command to start http server: "{process_cmd}"')
            try:
                server_process = Popen(process_cmd.split(" "))
                break
            except Exception as e:
                print(str(e))
        if not server_process:
            print("unable to start http server")
            report(section, "camera-image", [result])
            _comment_test_result(ctx, "PERIPHERALS: camera-image", result)
            return
        sleep(0.5)
        address = f"http://{server_address}/{file_path.name}"
        print(f"\n\nopen your web browser, and go to:\n\n\t{address}\n\n")
        inp = _get_user_answer_sync(
            api, ctx, "图像是否正常？" if LOCALIZE else "Is image OK?"
        )
        result = CSVResult.from_bool(inp)
    finally:
        if server_process:
            server_process.kill()
        report(section, "camera-image", [result])
        _comment_test_result(ctx, "PERIPHERALS: camera-image", result)


def _run_peripherals(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    async_api = _async_api(api)
    api.set_lights(rails=True)
    api.set_status_bar_state(StatusBarState.IDLE)

    ctx.comment("外设：显示屏" if LOCALIZE else "PERIPHERALS: DISPLAY")
    odd_on_prompt = "ODD 是否开启？" if LOCALIZE else "Is ODD on?"
    screen_on_result = CSVResult.from_bool(_get_user_answer_sync(api, ctx, odd_on_prompt))
    report(section, "screen-on", [screen_on_result])
    _comment_test_result(ctx, "PERIPHERALS: screen-on", screen_on_result)
    odd_touch_prompt = (
        "ODD 触摸屏是否正常工作？" if LOCALIZE else "Is ODD touchscreen working?"
    )
    screen_touch_result = CSVResult.from_bool(
        _get_user_answer_sync(api, ctx, odd_touch_prompt)
    )
    report(section, "screen-touch", [screen_touch_result])
    _comment_test_result(ctx, "PERIPHERALS: screen-touch", screen_touch_result)

    ctx.comment("外设：甲板灯" if LOCALIZE else "PERIPHERALS: DECK LIGHTS")
    api.set_lights(rails=True)
    deck_on_prompt = (
        "甲板灯是否开启？" if LOCALIZE else "Are the DECK-LIGHTS on?"
    )
    deck_lights_on_result = CSVResult.from_bool(
        _get_user_answer_sync(api, ctx, deck_on_prompt)
    )
    report(section, "deck-lights-on", [deck_lights_on_result])
    _comment_test_result(ctx, "PERIPHERALS: deck-lights-on", deck_lights_on_result)
    api.set_lights(rails=False)
    deck_off_prompt = (
        "甲板灯是否关闭？" if LOCALIZE else "Are the DECK-LIGHTS off?"
    )
    deck_lights_off_result = CSVResult.from_bool(
        _get_user_answer_sync(api, ctx, deck_off_prompt)
    )
    report(section, "deck-lights-off", [deck_lights_off_result])
    _comment_test_result(ctx, "PERIPHERALS: deck-lights-off", deck_lights_off_result)
    api.set_lights(rails=True)

    ctx.comment("外设：状态灯" if LOCALIZE else "PERIPHERALS: STATUS LIGHT")
    try:
        for color, state in COLOR_TO_STATE.items():
            if not api.is_simulator:
                # FIX ME: got to use portocol engine API
                _run_hw_coroutine(
                    api,
                    set_ui_color,
                    state[0],
                    state[2],
                    state[1],
                    state[3],
                    async_api._backend._usb_messenger,  # type: ignore[attr-defined]
                )
            color_name = STATUS_LIGHT_COLOR_NAMES[color]
            status_prompt = (
                f"状态灯是否为{color_name}？"
                if LOCALIZE
                else f"Is the STATUS-LIGHT {color}?"
            )
            result = _get_user_answer_sync(api, ctx, status_prompt)
            status_result = CSVResult.from_bool(result)
            report(section, f"status-light-{color}", [status_result])
            _comment_test_result(ctx, f"PERIPHERALS: status-light-{color}", status_result)
    finally:
        api.set_status_bar_state(StatusBarState.IDLE)

    ctx.comment("外设：门开关" if LOCALIZE else "PERIPHERALS: DOOR SWITCH")
    door_timeout_seconds = 10
    print("CLOSE the front door")
    if not api.is_simulator:
        _pause_for_ready(
            ctx, "关闭前门。" if LOCALIZE else "Close the front door."
        )
    start_time_seconds = monotonic()
    while not api.is_simulator and api.door_state != DoorState.CLOSED:
        sleep(0.1)
        if monotonic() - start_time_seconds > door_timeout_seconds:
            print("timed out waiting for door to close")
            break
    is_closed = api.door_state == DoorState.CLOSED
    print("OPEN the front door")
    if not api.is_simulator:
        _pause_for_ready(ctx, "打开前门。" if LOCALIZE else "Open the front door.")
    start_time_seconds = monotonic()
    while not api.is_simulator and api.door_state != DoorState.OPEN:
        sleep(0.1)
        if monotonic() - start_time_seconds > door_timeout_seconds:
            print("timed out waiting for door to open")
            break
    is_open = api.door_state == DoorState.OPEN
    door_result = CSVResult.from_bool(is_closed and is_open)
    report(section, "door-switch", [door_result])
    _comment_test_result(ctx, "PERIPHERALS: door-switch", door_result)

    ctx.comment("外设：相机" if LOCALIZE else "PERIPHERALS: CAMERA")
    sku = cfg.sku_code.strip() or None
    if sku and sku in FLEX_SKUS_NO_CAMERA:
        try:
            print("Verifying camera not attached.")
            active_result = CSVResult.FAIL
            assert not os.path.exists("/dev/video2")
            active_result = CSVResult.PASS
            print(f"Writing SKU {sku} to EEPROM.")
            eeprom_data = api._backend.eeprom_data  # type: ignore[attr-defined]
            converted_eeprom_data = direct_eeprom_data(eeprom_data)
            converted_eeprom_data.sku = sku
            eeprom_set = converted_eeprom_data.to_set()
            sku_result = direct_property_write(
                api=cast(Any, async_api), properties=eeprom_set
            )
            assert DirectPropId.SKU in sku_result
            removed_result = CSVResult.PASS
        except Exception as e:
            print(
                f"Confirming camera not attached failed with the following error: {e}"
            )
            removed_result = CSVResult.FAIL
        report(section, "camera-active", [active_result])
        report(section, "camera-image", [removed_result])
        _comment_test_result(ctx, "PERIPHERALS: camera-active", active_result)
        _comment_test_result(ctx, "PERIPHERALS: camera-image", removed_result)
    else:
        cam_pic_path: Optional[Path] = None
        try:
            cam_pic_path = _run_hw_coroutine(
                api, _take_picture, async_api, report, section, ctx
            )
        except Exception as e:
            print(f"Take a picture failed with the following error: {e}")
        if cam_pic_path:
            _run_image_check_server(api, report, section, cam_pic_path, ctx)
            cam_pic_path.unlink()
        else:
            print("skipping checking the image, because taking a picture failed")


def _build_report(test_name: str) -> CSVReport:
    return CSVReport(
        test_name=test_name,
        sections=[
            CSVSection(title=TestSection.GANTRY.value, lines=_build_gantry_csv_lines()),
            CSVSection(
                title=TestSection.SIGNALS.value, lines=_build_signal_csv_lines()
            ),
            CSVSection(
                title=TestSection.INSTRUMENTS.value,
                lines=_build_instrument_csv_lines(),
            ),
            CSVSection(
                title=TestSection.CONNECTIVITY.value,
                lines=_build_connectivity_csv_lines(),
            ),
            CSVSection(
                title=TestSection.PERIPHERALS.value,
                lines=_build_peripheral_csv_lines(),
            ),
        ],
    )


TESTS: List[
    Tuple[
        TestSection,
        Callable[[SyncHardwareAPI, CSVReport, str, ProtocolContext, TestConfig], None],
    ]
] = [
    (TestSection.GANTRY, _run_gantry),
    (TestSection.SIGNALS, _run_signals),
    (TestSection.INSTRUMENTS, _run_instruments),
    (TestSection.CONNECTIVITY, _run_connectivity),
    (TestSection.PERIPHERALS, _run_peripherals),
]


def add_parameters(parameters: ParameterContext) -> None:
    """Build runtime parameters."""
    parameters.add_str(
        display_name="操作员" if LOCALIZE else "Operator",
        variable_name="operator",
        default="Unused",
        choices=[{"display_name": name, "value": name} for name in OPERATOR_CHOICES],
        description="本次 QC 运行的操作员。" if LOCALIZE else "Operator for this QC run.",
    )
    parameters.add_str(
        display_name="仅测试" if LOCALIZE else "Only test",
        variable_name="only_test",
        default=ONLY_ALL,
        choices=[
            {"display_name": ONLY_ALL, "value": ONLY_ALL},
            *[
                {"display_name": section.value, "value": section.value}
                for section in TestSection
            ],
        ],
        description=(
            "选择 ALL 或单个装配 QC 测试段。"
            if LOCALIZE
            else "Select ALL or one assembly QC section to run."
        ),
    )
    parameters.add_str(
        display_name="SKU 代码" if LOCALIZE else "SKU code",
        variable_name="sku_code",
        default=UNUSED,
        choices=[
            {"display_name": UNUSED, "value": UNUSED},
            {"display_name": "999-00279", "value": "999-00279"},
        ],
        description=(
            "可选 SKU。使用 999-00279 进行无相机 Flex 外设测试。"
            if LOCALIZE
            else "Optional SKU. Use 999-00279 for no-camera Flex peripherals testing."
        ),
    )
    parameters.add_str(
        display_name="WiFi SSID",
        variable_name="wifi_ssid",
        default=UNUSED,
        choices=[{"display_name": UNUSED, "value": UNUSED}],
        description=(
            "CONNECTIVITY 段使用的可选 SSID（WiFi 未连接时）。"
            if LOCALIZE
            else "Optional SSID used by CONNECTIVITY when WiFi is not already connected."
        ),
    )
    parameters.add_str(
        display_name="WiFi 密码" if LOCALIZE else "WiFi password",
        variable_name="wifi_password",
        default=UNUSED,
        choices=[{"display_name": UNUSED, "value": UNUSED}],
        description=(
            "CONNECTIVITY 段使用的可选 WiFi 密码。"
            if LOCALIZE
            else "Optional WiFi password used by CONNECTIVITY."
        ),
    )


def _build_config(ctx: ProtocolContext) -> TestConfig:
    args = ctx.params.get_all()
    return TestConfig(
        simulate=ctx.is_simulating(),
        operator=str(args["operator"]),
        only_test=str(args["only_test"]),
        sku_code="" if args["sku_code"] == UNUSED else str(args["sku_code"]),
        wifi_ssid="" if args["wifi_ssid"] == UNUSED else str(args["wifi_ssid"]),
        wifi_password=""
        if args["wifi_password"] == UNUSED
        else str(args["wifi_password"]),
    )


def _selected_tests(
    only_test: str,
) -> Dict[
    TestSection,
    Callable[[SyncHardwareAPI, CSVReport, str, ProtocolContext, TestConfig], None],
]:
    if only_test == ONLY_ALL:
        return {section: fn for section, fn in TESTS}
    selected = TestSection(only_test)
    return {section: fn for section, fn in TESTS if section == selected}


def _prepare_simulator(api: SyncHardwareAPI) -> None:
    sim_backend = api._backend
    instruments = helpers_ot3._create_attached_instruments_dict(
        pipette_left="p1000_single_v3.5",
        pipette_right="p1000_single_v3.5",
        gripper="GRPV122",
    )
    sim_backend._attached_instruments = {
        m: _sanitize_attached_instrument(m, instruments.get(m)) for m in OT3Mount
    }
    api.create_simulating_peripheral(BarcodeScannerModel.BARCODE_SCANNER_V1)
    api.reset()


def run(ctx: ProtocolContext) -> None:
    """Entry point into testing protocol."""
    if ctx.is_simulating() and IS_ROBOT:
        ctx.comment("机器人分析中，跳过。" if LOCALIZE else "on robot analysis, skipping.")
        return

    ctx.comment(
        "开始 Flex 装配 QC。" if LOCALIZE else "starting Flex assembly QC."
    )
    OT3API._move_and_interrupt_with_signal = _move_and_interrupt_with_signal
    OT3API._release_estop_for_signal = _release_estop_for_signal  # type: ignore[attr-defined]

    api = ctx._core.get_hardware()
    if ctx.is_simulating():
        _prepare_simulator(api)

    cfg = _build_config(ctx)
    report = _build_report(TEST_NAME)
    helpers_ot3.set_csv_report_meta_data_ot3(
        api,
        report,
        operator=cfg.operator,
        ctx=ctx,
    )
    for section, test_run in _selected_tests(cfg.only_test).items():
        ctx.comment(
            f"正在运行 {section.value}。"
            if LOCALIZE
            else f"running {section.value}."
        )
        test_run(api, report, section.value, ctx, cfg)

    report.save_to_disk()
    if not report.all_succeded():
        raise RuntimeError("Error during QC run.")
