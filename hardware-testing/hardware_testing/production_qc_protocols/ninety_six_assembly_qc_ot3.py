"""Production QC protocol for 96channel pipettes."""
import asyncio
import csv
from contextlib import contextmanager, nullcontext
from dataclasses import dataclass, field
from datetime import datetime, timezone
import enum
import json
import hashlib
import inspect
import re
import sys
from functools import partial
from importlib import metadata as package_metadata
from uuid import uuid4
from math import isfinite
from pathlib import Path
from time import sleep, monotonic
import traceback
from typing import (
    Dict,
    Callable,
    cast,
    List,
    Union,
    Tuple,
    Literal,
    Iterator,
    ContextManager,
    Any,
    Optional,
)
from opentrons.config.types import GantryLoad, PerPipetteAxisSettings
from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api.core.engine import LabwareCore
from opentrons.types import Point

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3utils import sensor_id_for_instrument
from opentrons.hardware_control.types import (
    InstrumentProbeType,
)
from opentrons_hardware.firmware_bindings import ArbitrationId, NodeId, MessageId
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    PushTipPresenceNotification,
    TipStatusQueryRequest,
)
from opentrons_hardware.firmware_bindings.constants import SensorId

from opentrons_hardware.hardware_control.tool_sensors import capacitive_probe

from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.types import (
    Axis,
    OT3Mount,
)
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError
from opentrons.hardware_control.motion_utilities import target_position_from_relative


from hardware_testing.data.csv_report import (
    CSVReport,
    CSVSection,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing import data as data_io
from hardware_testing.drivers import data_center_client
from hardware_testing.drivers.data_center_client import upload_failure_log
from hardware_testing.drivers.sealed_pressure_fixture import (
    SerialDriver as SealedPressureDriver,
)
from hardware_testing.opentrons_api import helpers_ot3


# ----------- Monkey patches -----------


async def _read_qc_sensor_patch(
    self,  # noqa: ANN001
    sensor: Literal["pressure", "capacitance", "temperature", "humidity"],
    primary: bool,
) -> float:
    """Read without the public API's None-to-zero conversion; preserve real zero."""
    reader_name = {
        "pressure": "read_pressure_sensor",
        "capacitance": "read_capacitive_sensor",
        "temperature": "read_env_temp_sensor",
        "humidity": "read_env_hum_sensor",
    }[sensor]
    value = await getattr(self._backend, reader_name)(OT3Mount.LEFT, primary)
    channel = "A1" if primary else "H12"
    if value is None:
        raise RuntimeError(f"{channel} {sensor}: no sensor data (None)")
    if not isfinite(value):
        raise RuntimeError(f"{channel} {sensor}: non-finite sensor value ({value})")
    return value


def _set_gantry_per_axis_setting_patch(
    settings: PerPipetteAxisSettings, axis: Axis, load: GantryLoad, value: float
) -> None:
    """Support P200 when installed helpers still contain the duplicated P1000 case."""
    axis_kind = Axis.to_kind(axis)
    match load:
        case GantryLoad.HIGH_THROUGHPUT_1000:
            settings.high_throughput_1000[axis_kind] = value
        case GantryLoad.HIGH_THROUGHPUT_200:
            settings.high_throughput_200[axis_kind] = value
        case GantryLoad.LOW_THROUGHPUT:
            settings.low_throughput[axis_kind] = value


async def _home_tip_motors_patch(self, back_off: bool = True) -> None:  # noqa: ANN001
    """Home the tip motors through the hardware API's synchronous adapter."""
    await self._backend.home_tip_motors(distance=50, velocity=5, back_off=back_off)


async def _partial_pick_up_z_motion_patch(
    self, current: float, distance: float, speed: float  # noqa: ANN001
) -> None:
    async with self._backend.motor_current(run_currents={Axis.Z_L: current}):
        target_down = target_position_from_relative(
            OT3Mount.LEFT, Point(z=-distance), self._current_position
        )
        await self._move(target_down, speed=speed)
    target_up = target_position_from_relative(
        OT3Mount.LEFT, Point(z=distance), self._current_position
    )
    await self._move(target_up)
    await self._update_position_estimation([Axis.Z_L])


async def _get_tip_status_patch(self) -> bool:  # noqa: ANN001
    """Get the tip status for the 96 channel."""
    can_messenger = cast(OT3Controller, self._backend)._messenger
    node: NodeId = NodeId.pipette_left
    event = asyncio.Event()
    value = 0
    error: Union[RuntimeError, None] = None

    def _listener(message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
        nonlocal value, error
        try:
            originator = NodeId(arbitration_id.parts.originating_node_id)
        except ValueError:
            return
        if originator != node or event.is_set():
            return
        if message.message_id == MessageId.error_message:
            error = RuntimeError(
                f"Tip status query hardware error from {node.name}: {message}"
            )
            event.set()
        elif message.message_id == MessageId.tip_presence_notification:
            value = cast(
                PushTipPresenceNotification, message
            ).payload.ejector_flag_status.value
            event.set()

    can_messenger.add_listener(_listener)
    try:
        await can_messenger.send(
            node_id=node,
            message=TipStatusQueryRequest(),
        )
        await asyncio.wait_for(event.wait(), 1.0)
        if error is not None:
            raise error
    except asyncio.TimeoutError as exc:
        raise TimeoutError(
            "Tip status query timed out after 1 second (pipette_left)."
        ) from exc
    finally:
        _qc_cleanup(can_messenger.remove_listener, _listener)
    result = bool(value)
    return result


async def _cap_probe_patch(
    self,  # noqa: ANN001
    distance: float,
    speed: float,
    sensor_id: SensorId,
    relative_threshold_pf: float,
) -> float:
    pos = await capacitive_probe(
        self._backend._messenger,
        NodeId.pipette_left,
        NodeId.head_l,
        distance=distance,
        mount_speed=speed,
        sensor_id=sensor_id,
        relative_threshold_pf=relative_threshold_pf,
    )
    return pos.motor_position


# ----------- END Monkey patches -----------


LOCALIZE = helpers_ot3.get_system_langauge() == "zh-CN"

metadata = {"protocolName": "96 channel production qc"}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}
TEST_NAME = "ninety-six-assembly-qc-ot3"


class TestSection(enum.Enum):
    """Test Section."""

    PLUNGER = "PLUNGER"
    JAWS = "JAWS"
    CAPACITANCE = "CAPACITANCE"
    PRESSURE = "PRESSURE"
    ENVIRONMENT_SENSOR = "ENVIRONMENT-SENSOR"
    TIP_SENSOR = "TIP-SENSOR"
    DROPLETS = "DROPLETS"
    ENCODER = "ENCODER"


@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]
    pipette: Literal[200, 1000]


@dataclass
class _QCFailureContext:
    """Track startup and actual section order for failure reporting."""

    parameters: Dict[str, Any] = field(default_factory=dict)
    stage: str = "initialization"
    report: Optional[CSVReport] = None
    completed_sections: List[str] = field(default_factory=list)


class _QCOperatorStopped(RuntimeError):
    """The operator stopped after reviewing an already recorded QC failure."""


def _qc_json(value: Any) -> Any:
    """Convert observations without querying hardware or rendering report objects."""
    if isinstance(value, enum.Enum):
        return value.name
    if value is None or isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        return value if isfinite(value) else str(value)
    if isinstance(value, Point):
        return {axis: getattr(value, axis) for axis in "xyz"}
    if isinstance(value, dict):
        return {str(_qc_json(k)): _qc_json(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_qc_json(v) for v in value]
    return f"<{type(value).__name__}>"


@dataclass
class _QCTrace:
    """Evidence from existing operations only; never poll hardware for logging."""

    run_id: str = field(default_factory=lambda: str(uuid4()))
    identity: Dict[str, Any] = field(default_factory=dict)
    labware: Dict[str, Any] = field(default_factory=dict)
    events: List[Dict[str, Any]] = field(default_factory=list)
    tests: Dict[str, Any] = field(default_factory=dict)
    latest_readings: Dict[str, Any] = field(default_factory=dict)
    context: List[Dict[str, Any]] = field(default_factory=list)
    last_failure: Optional[Dict[str, Any]] = None
    failure_exception: Optional[BaseException] = None
    logging_errors: List[str] = field(default_factory=list)
    cleanup_errors: List[Dict[str, Any]] = field(default_factory=list)

    def snapshot(self) -> Dict[str, Any]:
        """Copy serializable evidence, explicitly separating recent from trigger data."""
        return _qc_json(
            {
                "run_id": self.run_id,
                "identity": self.identity,
                "labware": self.labware,
                "events": self.events,
                "tests": self.tests,
                "last_failure": self.last_failure,
                "latest_readings": self.latest_readings,
                "logging_errors": self.logging_errors,
                "cleanup_errors": self.cleanup_errors,
                "trigger_pressure": {
                    "status": "unknown",
                    "reason": "No trigger-time pressure supplied by the hardware exception; recent readings are not trigger measurements.",
                },
            }
        )


_ACTIVE_QC_TRACE: Optional[_QCTrace] = None


def _qc_event(action: str, **details: Any) -> Optional[Dict[str, Any]]:
    """Keep telemetry failures from changing QC execution or its exception."""
    trace = _ACTIVE_QC_TRACE
    if trace is None:
        return None
    try:
        event = {
            "id": len(trace.events),
            "action": action,
            "observed_at": datetime.now(timezone.utc).isoformat(),
            "context": _qc_json(trace.context),
            **_qc_json(details),
        }
        trace.events.append(event)
        return event
    except Exception as error:
        trace.logging_errors.append(f"{action}: {type(error).__name__}: {error}")
        return None


def _qc_observe(name: str, **details: Any) -> None:
    """Persist a measured value or operator confirmation at its original time."""
    event = _qc_event(name, values=details)
    if event is not None and _ACTIVE_QC_TRACE is not None:
        _ACTIVE_QC_TRACE.latest_readings[name] = {
            "value": _qc_json(details),
            "observed_at": event["observed_at"],
            "source_event_id": event["id"],
            "kind": "last_observed_not_trigger_value",
        }


@contextmanager
def _qc_step(action: str, **arguments: Any) -> Iterator[Optional[Dict[str, Any]]]:
    """Record an action before it runs and retain the innermost failing action."""
    trace = _ACTIVE_QC_TRACE
    event = _qc_event(action, status="running", arguments=arguments)
    started = monotonic()
    if trace is not None:
        trace.context.append({"action": action, "arguments": _qc_json(arguments)})
    try:
        yield event
    except BaseException as error:
        if event is not None and trace is not None:
            event.update(
                status="execution_error", error=f"{type(error).__name__}: {error}"
            )
            event["finished_at"] = datetime.now(timezone.utc).isoformat()
            event["duration_seconds"] = monotonic() - started
            # Parent scopes and cleanup must not replace the failing leaf action.
            cause = error.__context__
            follows_original = False
            seen = set()
            while cause is not None and id(cause) not in seen:
                seen.add(id(cause))
                if cause is trace.failure_exception:
                    follows_original = True
                    break
                cause = cause.__context__
            if trace.failure_exception is not error and not follows_original:
                trace.failure_exception = error
                trace.last_failure = {
                    **event,
                    "latest_readings": _qc_json(trace.latest_readings),
                }
        raise
    else:
        if event is not None:
            event["status"] = "completed"
    finally:
        if event is not None:
            event["finished_at"] = datetime.now(timezone.utc).isoformat()
            event["duration_seconds"] = monotonic() - started
        if trace is not None:
            trace.context.pop()


def _qc_call(function: Callable, *args: Any, **kwargs: Any) -> Any:
    """Invoke the exact original operation once, recording its existing result."""
    if _ACTIVE_QC_TRACE is None:
        return function(*args, **kwargs)
    operation = function
    # SynchronousAdapter exposes async hardware methods as partials of
    # call_coroutine_sync(loop, original_method); name the original operation.
    while isinstance(operation, partial):
        if (
            getattr(operation.func, "__name__", "") == "call_coroutine_sync"
            and len(operation.args) >= 2
        ):
            operation = operation.args[1]
        else:
            operation = operation.func
    name = getattr(operation, "__name__", type(operation).__name__)
    with _qc_step(name, args=args, kwargs=kwargs) as event:
        result = function(*args, **kwargs)
        if event is not None:
            event["result"] = _qc_json(result)
            if name.startswith(
                (
                    "read_",
                    "_read_",
                    "_get_tip_status",
                    "get_user_answer",
                    "get_input_number",
                    "gantry_position",
                    "current_position",
                    "encoder_current",
                    "get_instrument",
                )
            ):
                key = f"{name}:{_qc_json(args)}:{_qc_json(kwargs)}"
                _ACTIVE_QC_TRACE.latest_readings[key] = {
                    "value": _qc_json(result),
                    "observed_at": datetime.now(timezone.utc).isoformat(),
                    "source_event_id": event["id"],
                    "kind": "last_observed_not_trigger_value",
                }
        if name == "load_labware":
            _qc_record_labware(result)
        return result


def _qc_cleanup(function: Callable, *args: Any, **kwargs: Any) -> Any:
    """Run the existing cleanup once, preserving an in-flight test exception."""
    original = sys.exc_info()[1]
    try:
        return _qc_call(function, *args, **kwargs)
    except Exception as error:
        if original is None:
            raise
        trace = _ACTIVE_QC_TRACE
        if trace is not None:
            trace.cleanup_errors.append(
                {
                    "action": getattr(function, "__name__", type(function).__name__),
                    "error": f"{type(error).__name__}: {error}",
                    "traceback": traceback.format_exc(),
                }
            )
        return None


def _qc_file_identity(filename: Optional[str]) -> Dict[str, Any]:
    """Hash only a known source file; unavailable sources remain explicit."""
    try:
        if not filename:
            raise ValueError("Source filename unavailable")
        return {
            "path": filename,
            "sha256": hashlib.sha256(Path(filename).read_bytes()).hexdigest(),
        }
    except Exception as error:
        return {"path": filename, "sha256": None, "unavailable_reason": str(error)}


def _qc_protocol_identity() -> Dict[str, Any]:
    """Hash the text actually executed by the protocol engine, even without __file__."""
    frame = inspect.currentframe()
    try:
        while frame is not None:
            if (
                frame.f_code.co_name == "exec_run"
                and frame.f_globals.get("__name__")
                == "opentrons.protocols.execution.execute_python"
            ):
                protocol = frame.f_locals.get("proto")
                source = getattr(protocol, "text", None)
                if isinstance(source, (str, bytes)):
                    data = source.encode("utf-8") if isinstance(source, str) else source
                    return {
                        "path": protocol.filename,
                        "sha256": hashlib.sha256(data).hexdigest(),
                        "source": "executed_protocol.text",
                    }
            frame = frame.f_back
    finally:
        del frame
    return _qc_file_identity(globals().get("__file__"))


def _qc_capture_identity(api: Optional[SyncHardwareAPI] = None) -> None:
    """Collect source and cached instrument identity, without any sensor reads."""
    trace = _ACTIVE_QC_TRACE
    if trace is None:
        return
    try:
        if "protocol" not in trace.identity:
            versions = {}
            for package in (
                "opentrons",
                "opentrons-robot-server",
                "opentrons-hardware",
                "hardware-testing",
            ):
                try:
                    versions[package] = package_metadata.version(package)
                except package_metadata.PackageNotFoundError:
                    versions[package] = "unknown"
            trace.identity.update(
                {
                    "protocol": _qc_protocol_identity(),
                    "helpers": _qc_file_identity(helpers_ot3.__file__),
                    "upload_client": _qc_file_identity(data_center_client.__file__),
                    "versions": versions,
                }
            )
        if api is not None:
            trace.identity["firmware"] = _qc_json(api.fw_version)
            trace.identity["actual_pipettes"] = {
                mount.name: {
                    "serial": pipette.pipette_id,
                    "model": pipette.model,
                    "name": pipette.name,
                    "channels": pipette.channels,
                }
                for mount, pipette in api.hardware_pipettes.items()
                if pipette is not None
            }
    except Exception as error:
        trace.logging_errors.append(f"identity: {type(error).__name__}: {error}")


def _qc_record_labware(labware: Labware) -> None:
    """Capture cached loaded geometry/offsets without issuing hardware requests."""
    trace = _ACTIVE_QC_TRACE
    if trace is None:
        return
    try:
        key = f"{labware.parent}/{labware.load_name}"
        entry = trace.labware.setdefault(key, {})
        entry.update(
            {
                "load_name": labware.load_name,
                "parent": str(labware.parent),
                "a1_top_mm": _qc_json(labware["A1"].top().point),
                "a1_bottom_mm": _qc_json(labware["A1"].bottom().point),
            }
        )
        core = cast(LabwareCore, labware._core)
        view = core._engine_client.state.labware
        offset = view.get_labware_offset_vector(core.labware_id)
        entry.update(
            offset_id=view.get(core.labware_id).offsetId,
            offset_mm={axis: getattr(offset, axis) for axis in "xyz"},
        )
    except Exception as error:
        trace.logging_errors.append(f"labware: {type(error).__name__}: {error}")


def _qc_initialize_tests(args: Dict[str, Any]) -> None:
    """Record selected/skipped sections before instrument setup can fail."""
    trace = _ACTIVE_QC_TRACE
    if trace is not None:
        trace.identity["selected_pipette_size_ul"] = args.get("pip_size")
        trace.tests = {
            section.value: {
                "status": "skipped_by_configuration"
                if args.get(f"skip_{section.value.lower().replace('-', '_')}", False)
                else "not_started"
            }
            for section in TestSection
        }


def _qc_block_remaining_tests(stage: str) -> None:
    """Distinguish configured skips from sections blocked by a runtime failure."""
    trace = _ACTIVE_QC_TRACE
    if trace is not None:
        for state in trace.tests.values():
            if state.get("status") == "not_started":
                state.update(
                    status="not_run_due_to_previous_failure", blocking_stage=stage
                )


def _failure_log_comment(ctx: ProtocolContext, message: str) -> None:
    """Keep error reporting usable after the protocol engine stops accepting comments."""
    try:
        ctx.comment(message)
    except Exception:
        print(message)


def _log_qc_exception(
    report: CSVReport,
    ctx: ProtocolContext,
    section: str,
    stage: str,
    error: Exception,
) -> None:
    """Cache every caught traceback for upload and retain the existing TXT output."""
    trace = _ACTIVE_QC_TRACE
    if trace is not None:
        _qc_event(
            "caught_exception",
            section=section,
            stage=stage,
            error=f"{type(error).__name__}: {error}",
        )
    if getattr(error, "_qc_logged_report", None) is report:
        return
    try:
        detail = "".join(
            traceback.format_exception(type(error), error, error.__traceback__)
        )
        entry = (
            f"[{datetime.now(timezone.utc).isoformat()}] {section}/{stage}\n"
            f"{detail}\n"
        )
        # Caught sensor/stall errors may not propagate to run(). Keep their
        # tracebacks even when the legacy TXT file cannot be written.
        entries = getattr(report, "_qc_exception_details", None)
        if entries is None:
            entries = []
            setattr(report, "_qc_exception_details", entries)
        entries.append(entry)
        setattr(error, "_qc_logged_report", report)
        path = report.file_path.with_suffix(".txt")
        with path.open("a", encoding="utf-8") as stream:
            stream.write(entry)
    except Exception as log_error:
        _failure_log_comment(
            ctx,
            f"异常详情 TXT 写入失败：{log_error}；原始异常：{error}"
            if LOCALIZE
            else f"Could not write exception TXT: {log_error}; original error: {error}",
        )


def _failure_review_summary(section: str, rows: List[Dict[str, Any]]) -> str:
    """Explain the failure and the keyboard decision without an App resume step."""
    heading = (
        f"{section}：{len(rows)} 项测试不通过。"
        if LOCALIZE
        else f"{section}: {len(rows)} failed check(s)."
    )
    first = rows[0]
    detail = f"{first['evidence_id']}: {json.dumps(first['data'], ensure_ascii=False)}"
    instruction = (
        "请按机器人 USB 键盘 Enter/Y 继续或 Esc/N 停止。原 FAIL 保留。"
        if LOCALIZE
        else "Use the robot USB keyboard: Enter/Y to continue or Esc/N to stop. FAIL is retained."
    )
    return "\n".join((heading, detail, instruction))


def _confirm_failed_section(
    ctx: ProtocolContext,
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    pipette: Literal[200, 1000],
) -> None:
    """Review automatic FAILs after section cleanup, without changing the grade."""
    automatic_sections = {
        "META_DATA",
        TestSection.PLUNGER.value,
        TestSection.CAPACITANCE.value,
        TestSection.PRESSURE.value,
        TestSection.ENVIRONMENT_SENSOR.value,
        TestSection.TIP_SENSOR.value,
        TestSection.ENCODER.value,
    }
    if section not in automatic_sections or ctx.is_simulating():
        return
    failed_rows, details = _section_failure_details(report, section, pipette)
    if not failed_rows:
        return

    # Preserve partial measurements before waiting for the keyboard decision.
    report.save_to_disk()
    _qc_observe(
        "qc_failure_review",
        section=section,
        decision="pending",
        failed_rows=failed_rows,
        details=details,
    )
    try:
        ctx.comment(details)
        summary = _failure_review_summary(section, failed_rows)
        # Use the same Yes/No interaction as the existing jaw and droplet checks.
        proceed = _qc_call(
            helpers_ot3.get_user_answer,
            ctx,
            api,
            summary,
            timeout_seconds=None,
        )
    except BaseException:
        _qc_observe("qc_failure_review", section=section, decision="interrupted")
        _failure_log_comment(
            ctx,
            f"{section} 失败确认已中断，后续测试不执行。"
            if LOCALIZE
            else f"{section} failure review interrupted; remaining tests will not run.",
        )
        raise

    decision = "continue" if proceed else "stop"
    _qc_observe("qc_failure_review", section=section, decision=decision)
    if not proceed:
        message = (
            f"操作员在 {section} 测试失败后选择停止；已保存部分报告，后续测试不执行。"
            if LOCALIZE
            else f"Operator stopped after {section} failed; partial report saved, remaining tests will not run."
        )
        ctx.comment(message)
        raise _QCOperatorStopped(message)
    ctx.comment(
        f"操作员选择继续；{section} 的 FAIL 记录保持不变。"
        if LOCALIZE
        else f"Operator chose to continue; {section} FAIL results are unchanged."
    )


def _run_qc_test(
    test_run: Callable,
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
    state: Optional[_QCFailureContext] = None,
    **options: bool,
) -> Union[bool, None]:
    """Run and clean up a section, then review its automatic failed checks."""
    if state is not None:
        state.stage = section
    trace = _ACTIVE_QC_TRACE
    if trace is not None:
        trace.tests.setdefault(section, {}).update(
            status="running", started_at=datetime.now(timezone.utc).isoformat()
        )
        trace.last_failure = None
        trace.failure_exception = None
    try:
        with _qc_step(section, pipette=pipette, mount=OT3Mount.LEFT, **options):
            result = test_run(api, report, section, ctx, pipette=pipette, **options)
    except Exception as error:
        _log_qc_exception(report, ctx, section, "run", error)
        if trace is not None:
            trace.tests[section].update(
                status="exception",
                error=f"{type(error).__name__}: {error}",
                finished_at=datetime.now(timezone.utc).isoformat(),
            )
        raise
    if state is not None:
        state.completed_sections.append(section)
    if trace is not None:
        try:
            graded = [
                line for line in report[section].lines if CSVResult in line._data_types
            ]
            failed = any(line.result_passed is False for line in graded)
            status = (
                "failed"
                if failed
                else "passed"
                if graded and all(line.result_passed is True for line in graded)
                else "completed"
            )
            trace.tests[section].update(
                status=status, finished_at=datetime.now(timezone.utc).isoformat()
            )
            if trace.last_failure is not None:
                trace.tests[section]["last_handled_exception"] = _qc_json(
                    trace.last_failure
                )
        except Exception as log_error:
            trace.logging_errors.append(f"test status {section}: {log_error}")
        trace.last_failure = None
        trace.failure_exception = None
    _confirm_failed_section(ctx, api, report, section, pipette)
    return result


# ----------- TestSection.PLUNGER -----------


@contextmanager
def _temporary_axis_settings(
    api: SyncHardwareAPI, axis: Axis, current: float, speed: float
) -> Iterator[None]:
    """Restore current and speed even on failure, without initiating recovery motion."""
    settings = _qc_call(
        helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3, api, axis
    )
    original_current, original_speed = settings.run_current, settings.max_speed
    try:
        _qc_call(
            helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync,
            api,
            axis,
            run_current=current,
        )
        _qc_call(
            helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync,
            api,
            axis,
            default_max_speed=speed,
        )
        yield
    finally:
        try:
            _qc_cleanup(
                helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync,
                api,
                axis,
                default_max_speed=original_speed,
            )
        finally:
            _qc_cleanup(
                helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync,
                api,
                axis,
                run_current=original_current,
            )


PLUNGER_MAX_SKIP_MM = 0.1
SPEEDS_TO_TEST_PLUNGER: List[float] = [5, 15, 22]
CURRENTS_SPEEDS_PLUNGER: Dict[float, List[float]] = {
    0.6: SPEEDS_TO_TEST_PLUNGER,
    0.7: SPEEDS_TO_TEST_PLUNGER,
    0.8: SPEEDS_TO_TEST_PLUNGER,
}


def _get_plunger_test_tag(
    current: float, speed: float, direction: str, start_or_end: str
) -> str:
    return f"current-{current}-speed-{speed}-{direction}-{start_or_end}"


def build_plunger_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    currents = list(CURRENTS_SPEEDS_PLUNGER.keys())
    for current in sorted(currents):
        speeds = CURRENTS_SPEEDS_PLUNGER[current]
        for speed in sorted(speeds):
            for dir in ["down", "up"]:
                for step in ["start", "end"]:
                    tag = _get_plunger_test_tag(current, speed, dir, step)
                    lines.append(CSVLine(tag, [float, float, CSVResult]))
    return lines


def _move_to_test_plunger_position(api: SyncHardwareAPI) -> None:
    """Move the left pipette to the shared Test Plunger/scanner position."""
    _qc_call(api.home_z, OT3Mount.LEFT)
    slot_5 = _qc_call(helpers_ot3.get_slot_calibration_square_position_ot3, 5)
    home_pos = _qc_call(api.gantry_position, OT3Mount.LEFT)
    _qc_call(api.move_to, OT3Mount.LEFT, slot_5._replace(z=home_pos.z))


def _is_plunger_still_aligned_with_encoder(
    api: SyncHardwareAPI,
) -> Tuple[float, float, bool]:
    enc_pos = _qc_call(api.encoder_current_position_ot3, OT3Mount.LEFT)
    motor_pos = _qc_call(api.current_position_ot3, OT3Mount.LEFT)
    p_enc = enc_pos[Axis.P_L]
    p_est = motor_pos[Axis.P_L]
    is_aligned = abs(p_est - p_enc) < PLUNGER_MAX_SKIP_MM
    return p_enc, p_est, is_aligned


def test_plunger(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Test plunger."""
    ctx.comment("测试柱塞" if LOCALIZE else "Test Plunger.")
    ax = Axis.P_L
    mount = OT3Mount.LEFT
    _, _, blow_out, _ = _qc_call(helpers_ot3.get_plunger_positions_ot3, api, mount)

    def _save_result(tag: str) -> bool:
        est, enc, aligned = _is_plunger_still_aligned_with_encoder(api)
        result = CSVResult.from_bool(aligned)
        report(section, tag, [est, enc, result])
        return aligned

    _move_to_test_plunger_position(api)

    # LOOP THROUGH CURRENTS + SPEEDS
    currents = list(CURRENTS_SPEEDS_PLUNGER.keys())
    for current in sorted(currents, reverse=True):
        speeds = CURRENTS_SPEEDS_PLUNGER[current]
        for speed in sorted(speeds, reverse=False):
            # HOME
            _qc_call(api.home, [ax])
            with _temporary_axis_settings(api, ax, current, speed):
                # MOVE DOWN
                _save_result(_get_plunger_test_tag(current, speed, "down", "start"))
                _qc_call(
                    helpers_ot3.move_plunger_absolute_ot3_sync,
                    api,
                    mount,
                    blow_out,
                    speed=speed,
                    motor_current=current,
                )
                down_passed = _save_result(
                    _get_plunger_test_tag(current, speed, "down", "end")
                )
                # MOVE UP
                _save_result(_get_plunger_test_tag(current, speed, "up", "start"))
                _qc_call(
                    helpers_ot3.move_plunger_absolute_ot3_sync,
                    api,
                    mount,
                    0,
                    speed=speed,
                    motor_current=current,
                )
                up_passed = _save_result(
                    _get_plunger_test_tag(current, speed, "up", "end")
                )
            _qc_call(api.home, [ax])
            if (not down_passed or not up_passed) and not api.is_simulator:
                break


# ----------- END TestSection.PLUNGER -----------

# ----------- TestSection.JAWS -----------
RETRACT_MM = 0.25  # 0.25
MAX_TRAVEL = 29.8 - RETRACT_MM  # FIXME: what is the max travel?
ENDSTOP_OVERRUN_MM = (
    0.25  # FIXME: position cannot go negative, can't go past limit switch
)
ENDSTOP_OVERRUN_SPEED = 5
SPEEDS_TO_TEST_JAWS: List[float] = [8, 12]
CURRENTS_SPEEDS_JAWS: Dict[float, List[float]] = {
    0.7: SPEEDS_TO_TEST_JAWS,
    1.5: SPEEDS_TO_TEST_JAWS,
}


def _get_jaws_test_tag(current: float, speed: float) -> str:
    return f"current-{current}-speed-{speed}"


def build_jaws_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    currents = list(CURRENTS_SPEEDS_JAWS.keys())
    for current in sorted(currents):
        speeds = CURRENTS_SPEEDS_JAWS[current]
        for speed in sorted(speeds):
            tag = _get_jaws_test_tag(current, speed)
            lines.append(CSVLine(tag, [bool, bool, bool, CSVResult]))
    return lines


def _check_if_jaw_is_aligned_with_endstop(
    ctx: ProtocolContext, api: SyncHardwareAPI
) -> bool:
    if not api.is_simulator:
        pass_no_hit = _qc_call(
            helpers_ot3.get_user_answer,
            ctx,
            api,
            "are both endstop Lights OFF?",
            timeout_seconds=None,
        )
    else:
        pass_no_hit = True

    return pass_no_hit


def jaw_precheck(
    ctx: ProtocolContext, api: SyncHardwareAPI, ax: Axis, speed: float
) -> Tuple[bool, bool]:
    """Check the LEDs work and jaws are aligned."""
    # HOME
    if not api.is_simulator:
        # Call the API patch through its synchronous adapter, not the backend.
        _qc_call(api._home_tip_motors, back_off=False)
    # Check LEDs can turn on when homed
    if not api.is_simulator:
        led_check = _qc_call(
            helpers_ot3.get_user_answer,
            ctx,
            api,
            "are both endstop Lights ON?",
            timeout_seconds=None,
        )
    else:
        led_check = True
    if not led_check:
        return (led_check, False)

    _qc_call(helpers_ot3.move_tip_motor_relative_ot3_sync, api, RETRACT_MM, speed=speed)
    # Check Jaws are aligned
    if not api.is_simulator:
        jaws_aligned = _qc_call(
            helpers_ot3.get_user_answer,
            ctx,
            api,
            "are both endstop Lights OFF?",
            timeout_seconds=None,
        )
    else:
        jaws_aligned = True

    return led_check, jaws_aligned


def test_jaws(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Test jaws."""
    ctx.comment("测试钳口" if LOCALIZE else "Test Jaws.")
    ax = Axis.Q

    def _save_result(tag: str, led_check: bool, jaws_aligned: bool) -> bool:
        if led_check and jaws_aligned:
            no_hit = _check_if_jaw_is_aligned_with_endstop(ctx, api)
        else:
            no_hit = False
        result = CSVResult.from_bool(led_check and jaws_aligned and no_hit)
        report(section, tag, [led_check, jaws_aligned, no_hit, result])
        return led_check and jaws_aligned and no_hit

    _qc_call(api.home_z, OT3Mount.LEFT)
    slot_5 = _qc_call(helpers_ot3.get_slot_calibration_square_position_ot3, 5)
    home_pos = _qc_call(api.gantry_position, OT3Mount.LEFT)
    _qc_call(api.move_to, OT3Mount.LEFT, slot_5._replace(z=home_pos.z))

    # LOOP THROUGH CURRENTS + SPEEDS
    currents = list(CURRENTS_SPEEDS_JAWS.keys())
    for current in sorted(currents, reverse=True):
        speeds = CURRENTS_SPEEDS_JAWS[current]
        for speed in sorted(speeds, reverse=False):

            led_check, jaws_aligned = jaw_precheck(ctx, api, ax, speed)

            if led_check and jaws_aligned:
                with _temporary_axis_settings(api, ax, current, speed):
                    # MOVE DOWN then UP
                    _qc_call(
                        helpers_ot3.move_tip_motor_relative_ot3_sync,
                        api,
                        MAX_TRAVEL,
                        speed=speed,
                        motor_current=current,
                    )
                    _qc_call(
                        helpers_ot3.move_tip_motor_relative_ot3_sync,
                        api,
                        -MAX_TRAVEL,
                        speed=speed,
                        motor_current=current,
                    )
            passed = _save_result(
                _get_jaws_test_tag(current, speed), led_check, jaws_aligned
            )

            if not passed and not api.is_simulator:
                _qc_call(
                    ctx.pause,
                    f"当前电流 {current} 失败，跳过该电流下的剩余速度"
                    if LOCALIZE
                    else f"current {current} failed, skipping any remaining speeds at this current",
                )
                break

    _qc_call(api.home, [ax])


# ----------- END TestSection.JAWS -----------

# ----------- TestSection.CAPACITANCE -----------
TEST_SLOT = 9  # B3
PROBE_PREP_HEIGHT_MM = 5
PROBE_MAX_OVERRUN = 5
PROBE_POS_OFFSET = Point(13, 13, 0)

PROBE_READINGS = ["air-pf", "attached-pf", "deck-pf", "deck-mm"]

THRESHOLDS = {
    "air-pf": (
        4.0,
        10.0,
    ),
    "attached-pf": (
        5.0,
        12.0,
    ),
    "deck-pf": (
        10.0,
        25.0,
    ),
}


def _get_capacitive_test_tag(probe: InstrumentProbeType, reading: str) -> str:
    return f"{probe.name.lower()}-{reading}"


def build_capacitance_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for p in PROBE_POSITIONS:
        for r in PROBE_READINGS:
            lines.append(CSVLine(_get_capacitive_test_tag(p, r), [float, CSVResult]))
            if "mm" in r:
                continue
            lines.append(CSVLine(_get_capacitive_test_tag(p, r + "-min"), [float]))
            lines.append(CSVLine(_get_capacitive_test_tag(p, r + "-max"), [float]))
    return lines


def _read_from_cap_sensor(
    api: SyncHardwareAPI,
    sensor_id: SensorId,
    num_readings: int,
) -> float:
    readings: List[float] = []
    sequential_failures = 0
    while len(readings) != num_readings:
        try:
            r = _qc_call(api._read_qc_sensor, "capacitance", sensor_id == SensorId.S0)
            sequential_failures = 0
            readings.append(r)
            if not api.is_simulator:
                sleep(SECONDS_BETWEEN_READINGS)
        except Exception:
            sequential_failures += 1
            if sequential_failures == 3:
                raise
            else:
                continue
    return sum(readings) / num_readings


def _get_hover_and_probe_pos(
    api: SyncHardwareAPI, probe: InstrumentProbeType
) -> Tuple[Point, Point]:
    # FIXME: remove this once OT3API supports probing with secondary/front channels
    probe_pos = _qc_call(
        helpers_ot3.get_slot_calibration_square_position_ot3, TEST_SLOT
    )
    probe_pos += PROBE_POS_OFFSET
    hover_pos = probe_pos._replace(
        z=_qc_call(api.get_instrument_max_height, OT3Mount.LEFT)
    )
    if probe == InstrumentProbeType.SECONDARY:
        probe_offset = Point(x=9 * -11, y=9 * 7)
    else:
        probe_offset = Point()
    return hover_pos + probe_offset, probe_pos + probe_offset


def _read_and_report_capacitance(
    api: SyncHardwareAPI,
    report: CSVReport,
    ctx: ProtocolContext,
    section: str,
    probe: InstrumentProbeType,
    channel: str,
    reading: str,
    previous_pf: Union[float, None] = None,
) -> Tuple[Union[float, None], bool]:
    """Report each measurement, including zero values and sensor read errors."""
    labels = {
        "air-pf": ("空气电容（未安装探针）", "air capacitance (no probe)"),
        "attached-pf": ("安装探针后的电容", "capacitance with probe attached"),
        "deck-pf": ("接触甲板后的电容", "capacitance at the deck"),
    }
    label = labels[reading][0 if LOCALIZE else 1]
    ctx.comment(
        f"{channel}：正在测量{label}，请勿触碰移液器或探针。"
        if LOCALIZE
        else f"{channel}: measuring {label}. Do not touch the pipette or probe."
    )
    tag = _get_capacitive_test_tag(probe, reading)
    try:
        value = _read_from_cap_sensor(api, sensor_id_for_instrument(probe), 10)
    except Exception as error:
        report(section, tag, [None, CSVResult.FAIL])
        _log_qc_exception(report, ctx, section, tag, error)
        ctx.comment(
            f"{channel}：{label}读取异常，记为失败：{error}"
            if LOCALIZE
            else f"{channel}: {label} read error; recorded FAIL: {error}"
        )
        return None, False
    minimum, maximum = THRESHOLDS[reading]
    passed = minimum <= value <= maximum
    if previous_pf is not None:
        passed = passed and value > previous_pf
    report(section, tag, [value, CSVResult.from_bool(passed)])
    comparison = ""
    if previous_pf is not None:
        comparison = (
            f"，且须大于上一阶段的 {previous_pf:.3f} pF"
            if LOCALIZE
            else f" and must exceed the previous reading of {previous_pf:.3f} pF"
        )
    ctx.comment(
        f"{channel}：{label} = {value:.3f} pF；"
        f"{'通过' if passed else '失败'}（范围 {minimum}–{maximum} pF{comparison}）。"
        if LOCALIZE
        else f"{channel}: {label} = {value:.3f} pF; "
        f"{'PASS' if passed else 'FAIL'} (range {minimum}–{maximum} pF{comparison})."
    )
    return value, passed


def _remove_capacitance_probe(
    api: SyncHardwareAPI, ctx: ProtocolContext, channel: str
) -> None:
    """Retract after a completed motion, then require manual probe removal."""
    _qc_call(api.home_z, OT3Mount.LEFT)
    _qc_call(
        ctx.pause,
        f"头部已抬起，请取下 {channel} 的电容测试探针。" "确认移液器上没有吸头或探针，移开双手后点击继续。"
        if LOCALIZE
        else f"The head is raised. Remove the capacitance test probe from {channel}. "
        "Confirm no tips or probes remain on the pipette. Clear your hands, then resume.",
    )
    _qc_call(api.remove_tip, OT3Mount.LEFT)


def test_capacitance(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Test with default offsets, then restore the stored pipette calibration."""
    try:
        _qc_call(api.reset_instrument_offset, OT3Mount.LEFT)
        _test_capacitance_with_default_offset(api, report, section, ctx, pipette)
    finally:
        # Reload calibration without writing calibration files or moving axes.
        _qc_cleanup(api.reset_instrument_offset, OT3Mount.LEFT, to_default=False)


def _test_capacitance_with_default_offset(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Run capacitance measurements while the wrapper owns offset restoration."""
    ctx.comment(
        "电容传感器测试：依次测试 A1（PRIMARY）、H12（SECONDARY），每次只安装一个测试探针。"
        if LOCALIZE
        else "Capacitance test: A1 (PRIMARY), then H12 (SECONDARY). Attach only one test probe at a time."
    )
    z_ax = Axis.Z_L
    p_ax = Axis.P_L
    t_ax = Axis.Q

    default_probe_cfg = api.config.calibration.z_offset.pass_settings

    slot_name = f"{'DCBA'[(TEST_SLOT - 1) // 3]}{(TEST_SLOT - 1) % 3 + 1}"
    _qc_call(api.remove_tip, OT3Mount.LEFT)

    # Establish both air baselines before either probe is installed.
    ctx.comment(
        "开始空气电容基线测试：先测试 A1 和 H12，完成后再安装测试探针。"
        if LOCALIZE
        else "Starting air capacitance baseline: test A1 and H12 before installing either probe."
    )
    air_results: Dict[InstrumentProbeType, Tuple[Optional[float], bool]] = {}
    for probe in PROBE_POSITIONS:
        channel = (
            "A1 (PRIMARY)"
            if probe == InstrumentProbeType.PRIMARY
            else "H12 (SECONDARY)"
        )
        _record_capacitance_thresholds(report, section, probe)
        hover_pos, _ = _get_hover_and_probe_pos(api, probe)
        _qc_call(api.home, [z_ax, p_ax, t_ax])
        _qc_call(helpers_ot3.move_to_arched_ot3_sync, api, OT3Mount.LEFT, hover_pos)
        air_results[probe] = _read_and_report_capacitance(
            api, report, ctx, section, probe, channel, "air-pf"
        )

    ctx.comment(
        "A1、H12 空气电容基线测试完成，开始安装测试探针。"
        if LOCALIZE
        else "A1 and H12 air capacitance baselines complete; starting probe installation tests."
    )

    for probe in PROBE_POSITIONS:
        channel = (
            "A1 (PRIMARY)"
            if probe == InstrumentProbeType.PRIMARY
            else "H12 (SECONDARY)"
        )
        hover_pos, probe_pos = _get_hover_and_probe_pos(api, probe)
        sensor_id = sensor_id_for_instrument(probe)
        air_pf, air_passed = air_results[probe]
        if not air_passed:
            ctx.comment(
                f"{channel} 空气电容测量失败，跳过本通道后续测试；请勿安装探针。"
                if LOCALIZE
                else f"{channel} air measurement failed. Skipping remaining tests for this channel; do not attach a probe."
            )
            continue

        # ATTACHED-pF
        _qc_call(
            ctx.pause,
            f"请仅在 {channel} 喷嘴安装一个电容测试探针（不是普通移液吸头）。"
            "确认其他喷嘴无吸头或探针，安装完成并移开双手后点击继续。"
            f"安装后电容测量通过后，头部将自动下降至 {slot_name}（槽位 #{TEST_SLOT}）指定位置探测甲板，不再二次确认。"
            if LOCALIZE
            else f"Attach one capacitance test probe (not a pipette tip) to {channel} only. "
            "All other nozzles must be empty. Clear your hands, then resume. "
            f"If the attached-probe capacitance check passes, the head will automatically descend to probe "
            f"the deck at the designated position in {slot_name} (slot #{TEST_SLOT}), without another confirmation.",
        )
        _qc_call(api.add_tip, OT3Mount.LEFT, api.config.calibration.probe_length)
        attached_pf, attached_passed = _read_and_report_capacitance(
            api, report, ctx, section, probe, channel, "attached-pf", air_pf
        )
        if not attached_passed:
            ctx.comment(
                f"{channel} 安装探针后的电容测量失败，跳过甲板探测；接下来抬升头部并提示移除探针。"
                if LOCALIZE
                else f"{channel} attached-probe measurement failed. Skipping deck probing; the head will rise for probe removal."
            )
            _remove_capacitance_probe(api, ctx, channel)
            continue

        # DECK-mm
        def _probe(distance: float, speed: float) -> float:
            if api.is_simulator:
                return 0.0
            return _qc_call(
                api._capacitive_probe,
                distance=distance,
                speed=speed,
                sensor_id=sensor_id,
                relative_threshold_pf=default_probe_cfg.sensor_threshold_pf,
            )

        ctx.comment(
            f"{channel} 安装后电容测量通过，自动下降至 {slot_name}（槽位 #{TEST_SLOT}）指定位置探测甲板。"
            if LOCALIZE
            else f"{channel} attached-probe capacitance check passed. Automatically descending to probe "
            f"the deck at the designated position in {slot_name} (slot #{TEST_SLOT})."
        )
        # move to 5 mm above the deck
        _qc_call(api.home_z, OT3Mount.LEFT)
        current_pos = _qc_call(api.gantry_position, OT3Mount.LEFT)
        _qc_call(api.move_to, OT3Mount.LEFT, probe_pos._replace(z=current_pos.z))
        _qc_call(api.move_to, OT3Mount.LEFT, probe_pos._replace(z=PROBE_PREP_HEIGHT_MM))
        z_ax = Axis.by_mount(OT3Mount.LEFT)
        # NOTE: currently there's an issue where the 1st time an instrument
        #       probes, it won't trigger when contacting the deck. However all
        #       following probes work fine. So, here we do a "fake" probe
        #       in case this instrument was just turned on
        _probe(distance=0.5, speed=5)
        _probe(distance=-0.5, speed=5)
        _probe(
            distance=PROBE_MAX_OVERRUN + PROBE_PREP_HEIGHT_MM,
            speed=default_probe_cfg.speed_mm_per_s,
        )
        _qc_call(api.refresh_positions)
        found_pos = _qc_call(api.gantry_position, OT3Mount.LEFT)
        deck_mm_relative = found_pos.z - (PROBE_MAX_OVERRUN * -1.0)
        deck_mm_is_valid = deck_mm_relative >= 0.001
        report(
            section,
            _get_capacitive_test_tag(probe, "deck-mm"),
            [deck_mm_relative, CSVResult.from_bool(deck_mm_is_valid)],
        )
        ctx.comment(
            f"{channel}：甲板探测{'通过' if deck_mm_is_valid else '失败'}，停止位置 Z = {found_pos.z:.3f} mm。"
            if LOCALIZE
            else f"{channel}: deck probing {'PASS' if deck_mm_is_valid else 'FAIL'}; stopped at Z = {found_pos.z:.3f} mm."
        )

        # DECK-pF
        if deck_mm_is_valid:
            _qc_call(api.move_to, OT3Mount.LEFT, probe_pos._replace(z=found_pos.z))
            _read_and_report_capacitance(
                api, report, ctx, section, probe, channel, "deck-pf", attached_pf
            )
        else:
            ctx.comment(
                f"{channel} 未通过甲板位置判定，跳过接触甲板后的电容测量。"
                if LOCALIZE
                else f"{channel} failed the deck position check; skipping deck capacitance measurement."
            )

        # Do not put motion recovery in a finally block: a failed move leaves
        # position uncertain and must propagate without automatic cleanup moves.
        _remove_capacitance_probe(api, ctx, channel)

    ctx.comment(
        "电容传感器测试已结束，请按后续提示摆放耗材。"
        if LOCALIZE
        else "Capacitance testing finished. Follow subsequent prompts to place labware."
    )


# ----------- END TestSection.CAPACITANCE -----------

# ----------- TestSection.PRESSURE -----------
USE_SEALED_FIXTURE = False
USE_SEALED_BLOCK = True
# Translate the original C3 fixture positions to D3 (Y -107 mm).
# This assumes the same fixture orientation and placement within the slot.
PRIMARY_SEALED_PRESSURE_FIXTURE_POS = (
    Point(362.68, 41.83, 49.4) if USE_SEALED_BLOCK else Point(362.68, 41.83, 44.4)
)  # attached tip
SECOND_SEALED_PRESSURE_FIXTURE_POS = (
    Point(264.71, 105.81, 49.4) if USE_SEALED_BLOCK else Point(264.71, 105.81, 44.4)
)  # attached tip
SET_PRESSURE_TARGET = 100  # read air pressure when the force pressure value is over 100
REACHED_PRESSURE = 0.0

SECONDS_BETWEEN_READINGS = 0.25
NUM_PRESSURE_READINGS = 10
TIP_VOLUME = 50
ASPIRATE_VOLUME = 2
PRESSURE_READINGS = ["open-pa", "sealed-pa", "aspirate-pa", "dispense-pa"]

SLOT_FOR_PICK_UP_TIP = 1  # D1
TIP_RACK_FOR_PICK_UP_TIP = f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul"
A1_OFFSET = Point(x=9 * 11, y=-9 * 7)
H12_OFFSET = Point(x=-9 * 11, y=9 * 7)
OFFSET_FOR_1_WELL_LABWARE = Point(x=9 * -11 * 0.5, y=9 * 7 * 0.5)

THRESHOLDS_1000 = {
    "open-pa": (
        -25,
        25,
    ),
    "sealed-pa": (
        -30,
        30,
    ),
    "aspirate-pa": (
        -750,
        -400,
    ),
    "dispense-pa": (
        2500,
        3500,
    ),
}

THRESHOLDS_200 = {
    "open-pa": (
        -50,
        50,
    ),
    "sealed-pa": (
        -100,
        100,
    ),
    "aspirate-pa": (
        -2000,
        -500,
    ),
    "dispense-pa": (
        1000,
        2500,
    ),
}


PROBE_POSITIONS = [InstrumentProbeType.PRIMARY, InstrumentProbeType.SECONDARY]


def _get_pressure_test_tag(probe: InstrumentProbeType, reading: str) -> str:
    assert reading in PRESSURE_READINGS, f"{reading} not in PRESSURE_READINGS"
    return f"{probe.name.lower()}-{reading}"


def build_pressure_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for p in PROBE_POSITIONS:
        for r in PRESSURE_READINGS:
            tag = _get_pressure_test_tag(p, r)
            if r == "sealed-pa":
                lines.append(CSVLine(tag, [float, CSVResult, float]))
            else:
                lines.append(CSVLine(tag, [float, CSVResult]))
    return lines


def _read_from_pressure_sensor(
    api: SyncHardwareAPI,
    sensor_id: SensorId,
    num_readings: int,
) -> float:
    readings: List[float] = []
    sequential_failures = 0
    while len(readings) != num_readings:
        try:
            r = _qc_call(api._read_qc_sensor, "pressure", sensor_id == SensorId.S0)
            sequential_failures = 0
            readings.append(r)
            if not api.is_simulator:
                sleep(SECONDS_BETWEEN_READINGS)
        except Exception:
            sequential_failures += 1
            if sequential_failures == 3:
                raise
            else:
                continue
    return sum(readings) / num_readings


def check_value(
    test_value: float, test_name: str, pipette: Literal[1000, 200]
) -> CSVResult:
    """Determine if value is within pass limits."""
    if pipette == 1000:
        THRESHOLDS = THRESHOLDS_1000
    if pipette == 200:
        THRESHOLDS = THRESHOLDS_200
    low_limit = THRESHOLDS[test_name][0]
    high_limit = THRESHOLDS[test_name][1]

    if low_limit < test_value and test_value < high_limit:
        return CSVResult.PASS
    else:
        return CSVResult.FAIL


def calibrate_to_pressue_fixture(
    api: SyncHardwareAPI,
    sensor: SealedPressureDriver,
    fixture_pos: Point,
    ctx: ProtocolContext,
) -> None:
    """Move to suitable height for reading air pressure."""
    _qc_call(api.move_to, OT3Mount.LEFT, fixture_pos)

    if api.is_simulator:
        debug_target = f"{SET_PRESSURE_TARGET}"
    else:
        target_input = _qc_call(
            helpers_ot3.get_input_number,
            ctx,
            api,
            f"Setting target pressure (default: {SET_PRESSURE_TARGET}g): ",
            SET_PRESSURE_TARGET,
        )
        debug_target = f"{target_input}"

    while True:
        force_pressure = sensor.get_pressure()
        # step = -0.06 if abs(float(force_pressure)) > 0.1 else -0.1
        step = -0.06
        assert force_pressure is not None
        if force_pressure < float(debug_target.strip()):
            _qc_call(api.move_rel, OT3Mount.LEFT, Point(x=0, y=0, z=step))
            sleep(3)
        else:
            break


def _partial_pick_up_z_motion(
    api: SyncHardwareAPI, current: float, distance: float, speed: float
) -> None:
    _qc_call(api._partial_pick_up_z_motion, current, distance, speed)


def _partial_pick_up(api: SyncHardwareAPI, position: Point, current: float) -> None:
    _qc_call(
        helpers_ot3.move_to_arched_ot3_sync,
        api,
        OT3Mount.LEFT,
        position,
        safe_height=position.z + 10,
    )
    _partial_pick_up_z_motion(
        api, current=current, distance=12, speed=3
    )  # change distance and speed, in case collision detected error
    _qc_call(
        api.add_tip,
        OT3Mount.LEFT,
        _qc_call(helpers_ot3.get_default_tip_length, TIP_VOLUME),
    )
    _qc_call(api.prepare_for_aspirate, OT3Mount.LEFT)
    _qc_call(api.home_z, OT3Mount.LEFT)


def _drop_pressure_tips(api: SyncHardwareAPI, ctx: ProtocolContext) -> None:
    """Discard the pressure-test pair at the configured QC waste position."""
    _qc_call(api.home_z, OT3Mount.LEFT)
    ctx.comment(
        "自动移动到 A3（12 号槽）的预设 QC 废弃收集位置，统一退下 A1、H12 两个吸头。"
        if LOCALIZE
        else "Automatically moving to the preset QC waste location in A3 (slot 12) to drop both A1/H12 tips."
    )
    trash_nominal = _qc_call(
        helpers_ot3.get_slot_calibration_square_position_ot3, 12
    ) + Point(z=40)
    trash_nominal += OFFSET_FOR_1_WELL_LABWARE
    _qc_call(
        helpers_ot3.move_to_arched_ot3_sync,
        api,
        OT3Mount.LEFT,
        trash_nominal + Point(z=20),
    )
    _qc_call(api.move_to, OT3Mount.LEFT, trash_nominal)
    _qc_call(api.drop_tip, OT3Mount.LEFT)
    _qc_call(api.remove_tip, OT3Mount.LEFT)
    _qc_call(api.home_z, OT3Mount.LEFT)


def test_pressure(  # noqa: C901
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
    retain_tips: bool = False,
) -> bool:
    """Test both channels and return whether tips are retained for tip detection."""
    ctx.comment(
        "测试压力传感器：一次取 A1、H12 两个吸头，分别测试"
        if LOCALIZE
        else "Test Pressure: pick up A1/H12 tips together and test each channel."
    )
    _qc_call(api.home_z, OT3Mount.LEFT)
    slot_5 = _qc_call(helpers_ot3.get_slot_calibration_square_position_ot3, 5)
    home_pos = _qc_call(api.gantry_position, OT3Mount.LEFT)
    _qc_call(api.move_to, OT3Mount.LEFT, slot_5._replace(z=home_pos.z))
    if USE_SEALED_FIXTURE:
        pressure_sensor = SealedPressureDriver()
        _qc_call(pressure_sensor.init, 9600)

    slot_name = (
        f"{'DCBA'[(SLOT_FOR_PICK_UP_TIP - 1) // 3]}{(SLOT_FOR_PICK_UP_TIP - 1) % 3 + 1}"
    )
    ctx.comment(
        f"使用预放置于 {slot_name}（槽位 #{SLOT_FOR_PICK_UP_TIP}）的 96 通道吸头盒适配器和 50 µL 吸头盒；"
        "盒内仅 A1、H12 两孔有吸头。移液器须无残留吸头或探针，D3 密封治具和 A3 废弃收集位置须已就绪。"
        "先自动测量两路未取头压力，再一次取两个吸头。"
        if LOCALIZE
        else f"Using the preloaded 96-channel tiprack adapter and 50 uL tiprack in "
        f"{slot_name} (slot #{SLOT_FOR_PICK_UP_TIP}), with tips ONLY in wells A1 and H12. "
        "The pipette must have no tips or probes; the D3 sealing fixture and A3 waste location must be ready. "
        "Measuring both open-pressure baselines before automatically picking up both tips."
    )
    adapter = _qc_call(
        ctx.load_adapter, "opentrons_flex_96_tiprack_adapter", SLOT_FOR_PICK_UP_TIP
    )
    tiprack = _qc_call(adapter.load_labware, "opentrons_flex_96_tiprack_50uL")
    tip_rack_actual_pos = tiprack["A1"].top().point
    channels = [
        (InstrumentProbeType.PRIMARY, "A1", PRIMARY_SEALED_PRESSURE_FIXTURE_POS),
        (InstrumentProbeType.SECONDARY, "H12", SECOND_SEALED_PRESSURE_FIXTURE_POS),
    ]
    failed_items: List[str] = []

    def _record_reading(probe: InstrumentProbeType, reading: str) -> bool:
        """Return whether acquisition succeeded; out-of-range values are recorded."""
        tag = _get_pressure_test_tag(probe, reading)
        channel = "A1" if probe == InstrumentProbeType.PRIMARY else "H12"
        labels = {
            "open-pa": ("未取头开放压力", "open pressure before pickup"),
            "sealed-pa": ("密封静态压力", "sealed static pressure"),
            "aspirate-pa": ("吸气后压力", "pressure after aspiration"),
            "dispense-pa": ("排气后压力", "pressure after dispense"),
        }
        label = labels[reading][0 if LOCALIZE else 1]
        ctx.comment(
            f"{channel}：正在测量{label}。" if LOCALIZE else f"{channel}: measuring {label}."
        )
        try:
            value = (
                0.0
                if api.is_simulator
                else _read_from_pressure_sensor(
                    api, sensor_id_for_instrument(probe), NUM_PRESSURE_READINGS
                )
            )
        except Exception as error:
            failed_data: List[Union[float, CSVResult, None]] = [None, CSVResult.FAIL]
            if reading == "sealed-pa":
                failed_data.append(REACHED_PRESSURE)
            report(section, tag, failed_data)
            _log_qc_exception(report, ctx, section, tag, error)
            failed_items.append(tag)
            ctx.comment(
                f"{channel} {label}读取异常，记为失败并中断剩余压力测量：{error}"
                if LOCALIZE
                else f"{channel} {label} read error; recorded FAIL and stopping remaining pressure measurements: {error}"
            )
            return False
        result = check_value(value, reading, pipette)
        data: List[Union[float, CSVResult]] = [value, result]
        if reading == "sealed-pa":
            data.append(REACHED_PRESSURE)
        report(section, tag, data)
        low, high = (THRESHOLDS_1000 if pipette == 1000 else THRESHOLDS_200)[reading]
        ctx.comment(
            f"{channel}：{label} = {value:.3f} Pa；{'通过' if result == CSVResult.PASS else '失败'}"
            f"（要求 {low} < 压力 < {high} Pa）。"
            if LOCALIZE
            else f"{channel}: {label} = {value:.3f} Pa; {result.value} "
            f"(required: {low} < pressure < {high} Pa)."
        )
        if result == CSVResult.FAIL:
            failed_items.append(tag)
            ctx.comment(
                "读数不符合标准，已记录失败，继续后续测量。"
                if LOCALIZE
                else "Reading outside acceptance criteria; FAIL recorded. Continuing measurements."
            )
        return True

    # Keep the original open-pressure baseline: read both sensors BEFORE pickup.
    _qc_call(
        helpers_ot3.move_to_arched_ot3_sync,
        api,
        OT3Mount.LEFT,
        tip_rack_actual_pos + Point(z=50),
    )
    for probe, _, _ in channels:
        if not _record_reading(probe, "open-pa"):
            ctx.comment(
                "压力测试提前终止，未执行取头。"
                if LOCALIZE
                else "Pressure testing ended early; tip pickup was not performed."
            )
            return False

    # Use the standard cam pickup on the adapter. The operator supplies only
    # the two corner tips; do not use the old single-tip press-fit offsets.
    _qc_call(
        helpers_ot3.move_to_arched_ot3_sync, api, OT3Mount.LEFT, tip_rack_actual_pos
    )
    _qc_call(
        api.pick_up_tip,
        OT3Mount.LEFT,
        _qc_call(helpers_ot3.get_default_tip_length, TIP_VOLUME),
    )
    _qc_call(api.home_z, OT3Mount.LEFT)
    ctx.comment(
        "双吸头取头动作已完成，自动依次测试 A1、H12；两支吸头将保持安装直到统一退头。"
        if LOCALIZE
        else "Pair pickup motion completed. Testing A1, then H12 automatically; retaining both tips until final disposal."
    )

    measurements_complete = False
    for probe, channel, fixture_pos in channels:
        ctx.comment(f"测试 {channel} 压力" if LOCALIZE else f"Test {channel} pressure")
        # Re-prime the shared plunger while BOTH tips are clear of the fixture.
        # The previous channel's full dispense finishes at the blow-out position.
        _qc_call(api.prepare_for_aspirate, OT3Mount.LEFT)
        if not api.is_simulator:
            if not (USE_SEALED_FIXTURE or USE_SEALED_BLOCK):
                _qc_call(
                    ctx.pause,
                    f"仅用手指密封 {channel} 吸头，另一支保持开放；确认后点击继续。"
                    if LOCALIZE
                    else f"Seal ONLY the {channel} tip with your finger. Leave the other tip open, then resume.",
                )
            else:
                _qc_call(
                    helpers_ot3.move_to_arched_ot3_sync,
                    api,
                    OT3Mount.LEFT,
                    fixture_pos._replace(z=fixture_pos.z + 50),
                )
                ctx.comment(
                    f"自动将 {channel} 吸头下降至预设密封位置；另一支吸头须保持开放，且不接触治具或甲板物品。"
                    if LOCALIZE
                    else f"Automatically lowering {channel} to the preset seal position. "
                    "The other tip must remain open and clear of the fixture and deck items."
                )
                if USE_SEALED_FIXTURE:
                    calibrate_to_pressue_fixture(api, pressure_sensor, fixture_pos, ctx)
                else:
                    _qc_call(
                        helpers_ot3.move_to_arched_ot3_sync,
                        api,
                        OT3Mount.LEFT,
                        fixture_pos,
                    )

        if not _record_reading(probe, "sealed-pa"):
            break
        if not api.is_simulator:
            _qc_call(api.aspirate, OT3Mount.LEFT, ASPIRATE_VOLUME)
        if not _record_reading(probe, "aspirate-pa"):
            break
        if not api.is_simulator:
            _qc_call(
                api.dispense, OT3Mount.LEFT, ASPIRATE_VOLUME, is_full_dispense=True
            )
        if not _record_reading(probe, "dispense-pa"):
            break
        if not (USE_SEALED_FIXTURE or USE_SEALED_BLOCK):
            _qc_call(
                ctx.pause,
                f"松开 {channel} 吸头的手指密封，双手离开运动区域后点击继续。"
                if LOCALIZE
                else f"Release the finger seal on {channel} and clear your hands, then resume.",
            )
        # Release the seal vertically before changing channels; retain BOTH tips.
        ctx.comment(
            f"{channel} 测量完成，抬升解除密封，保留两支吸头。"
            if LOCALIZE
            else f"{channel} measurements completed. Raising to release the seal while retaining both tips."
        )
        _qc_call(api.home_z, OT3Mount.LEFT)
    else:
        measurements_complete = True
        ctx.comment(
            "A1、H12 的全部压力测量已完成。"
            if LOCALIZE
            else "All A1 and H12 pressure measurements completed."
        )

    if (
        retain_tips
        and measurements_complete
        and USE_SEALED_BLOCK
        and not USE_SEALED_FIXTURE
    ):
        ctx.comment(
            f"压力测量结束；失败项：{', '.join(failed_items) if failed_items else '无'}。"
            "保留 A1、H12 两个吸头，立即进入吸头检测，无需重新取头。"
            if LOCALIZE
            else f"Pressure measurements finished; failed items: {', '.join(failed_items) if failed_items else 'none'}. "
            "Retaining both A1/H12 tips for immediate tip detection; no new pickup is needed."
        )
        return True

    # Shared cleanup also runs after a sensor-read failure. Motion failures still
    # propagate immediately instead of attempting recovery with unknown position.
    if not (USE_SEALED_FIXTURE or USE_SEALED_BLOCK):
        _qc_call(
            ctx.pause,
            "移开双手，准备统一退下 A1、H12 两个吸头；点击继续。"
            if LOCALIZE
            else "Clear your hands before dropping both A1/H12 tips, then resume.",
        )
    _drop_pressure_tips(api, ctx)
    _qc_call(api.home)
    ctx.comment(
        f"压力测试流程结束；失败项：{', '.join(failed_items) if failed_items else '无'}。"
        if LOCALIZE
        else f"Pressure workflow finished; failed items: {', '.join(failed_items) if failed_items else 'none'}."
    )
    return False


# ----------- END TestSection.PRESSURE -----------

# ----------- TestSection.ENVIRONMENT_SENSOR -----------

NUM_SAMPLES = 10
INTER_SAMPLE_DELAY_SECONDS = 0.25


def build_env_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine(f"environment-{sensor_id.name}-celsius-humidity", [float, float])
        for sensor_id in [SensorId.S0, SensorId.S1]
    ]
    lines.extend(
        CSVLine(f"environment-{sensor_id.name}-read-valid", [CSVResult])
        for sensor_id in [SensorId.S0, SensorId.S1]
    )
    return lines


def _remove_outliers_and_average(values: List[float]) -> float:
    no_outliers = sorted(values)[1:-1]
    return sum(no_outliers) / len(no_outliers)


def test_environmental_sensor(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Test environmental sensor."""
    ctx.comment("测试环境传感器" if LOCALIZE else "Test Environmental Sensor")
    _qc_call(api.home_z, OT3Mount.LEFT)
    slot_5 = _qc_call(helpers_ot3.get_slot_calibration_square_position_ot3, 5)
    home_pos = _qc_call(api.gantry_position, OT3Mount.LEFT)
    _qc_call(api.move_to, OT3Mount.LEFT, slot_5._replace(z=home_pos.z))
    for sensor_id in [SensorId.S0, SensorId.S1]:
        tag = f"environment-{sensor_id.name}-celsius-humidity"
        validity_tag = f"environment-{sensor_id.name}-read-valid"
        celsius_samples = []
        humidity_samples = []
        try:
            for _ in range(NUM_SAMPLES):
                c = _qc_call(
                    api._read_qc_sensor, "temperature", sensor_id == SensorId.S0
                )
                h = _qc_call(api._read_qc_sensor, "humidity", sensor_id == SensorId.S0)
                celsius_samples.append(round(c, 2))
                humidity_samples.append(round(h, 2))
                if not api.is_simulator:
                    sleep(INTER_SAMPLE_DELAY_SECONDS)
        except Exception as error:
            # An incomplete sample group has no valid averages. Keep the original
            # two measurement columns and store acquisition validity separately.
            report(section, validity_tag, [CSVResult.FAIL])
            report(section, tag, [None, None])
            _log_qc_exception(report, ctx, section, tag, error)
            ctx.comment(
                f"{sensor_id.name} 温湿度读取异常，已记录失败并停止：{error}"
                if LOCALIZE
                else f"{sensor_id.name} environment read error; recorded FAIL and stopping: {error}"
            )
            raise
        celsius = _remove_outliers_and_average(celsius_samples)
        humidity = _remove_outliers_and_average(humidity_samples)
        report(section, tag, [celsius, humidity])
        # This is acquisition validity, not a temperature/humidity acceptance test.
        report(section, validity_tag, [CSVResult.PASS])


# ----------- END TestSection.ENVIRONMENT_SENSOR -----------

# ----------- TestSection.TIP_SENSOR -----------
TIP_PRESENCE_POSITION = 6
EXPECTED_STATE_AT_HOME_POSITION = False


def _get_tip_test_tag(tips_dropped: bool) -> str:
    t = "empty" if tips_dropped else "with-tips"
    return f"tip-sensor-{t}"


def build_tip_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [CSVLine(_get_tip_test_tag(state), [CSVResult]) for state in [True, False]]


def get_tip_status(api: SyncHardwareAPI) -> bool:
    """Get the tip status for the 96 channel."""
    return _qc_call(api._get_tip_status)


def _read_tip_status_for_qc(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    tag: str,
    stage: str,
) -> bool:
    """Record sensor errors before stopping; do not recover motion automatically."""
    try:
        return get_tip_status(api)
    except Exception as error:
        detail = f"{tag}/{stage}: {type(error).__name__}: {error}"
        report(section, tag, [CSVResult.FAIL])
        _log_qc_exception(report, ctx, section, f"{tag}/{stage}", error)
        ctx.comment(
            f"吸头检测读取异常，已记录失败并停止：{detail}"
            if LOCALIZE
            else f"Tip detection read error; recorded FAIL and stopping: {detail}"
        )
        raise


def _pick_up_tip_sensor_tips(api: SyncHardwareAPI, ctx: ProtocolContext) -> None:
    """Pick up the preloaded A1/H12 pair for standalone tip detection."""
    slot_name = (
        f"{'DCBA'[(SLOT_FOR_PICK_UP_TIP - 1) // 3]}{(SLOT_FOR_PICK_UP_TIP - 1) % 3 + 1}"
    )
    ctx.comment(
        f"独立吸头检测：自动从 {slot_name}（槽位 #{SLOT_FOR_PICK_UP_TIP}）取头。"
        "须预放 96 通道吸头盒适配器及 50 µL 吸头盒，盒内仅 A1、H12 两孔有吸头；"
        "移液器须无残留吸头或探针，A3 废弃收集位置须已就绪。"
        if LOCALIZE
        else f"Standalone tip detection: automatically picking up tips from {slot_name} "
        f"(slot #{SLOT_FOR_PICK_UP_TIP}). A 96-channel tiprack adapter and 50 uL tiprack "
        "must be preloaded, with tips ONLY in A1 and H12. The pipette must have no "
        "tips or probes, and the A3 waste location must be ready."
    )
    _qc_call(api.home_z, OT3Mount.LEFT)
    adapter = _qc_call(
        ctx.load_adapter, "opentrons_flex_96_tiprack_adapter", SLOT_FOR_PICK_UP_TIP
    )
    tiprack = _qc_call(adapter.load_labware, "opentrons_flex_96_tiprack_50uL")
    _qc_call(
        helpers_ot3.move_to_arched_ot3_sync,
        api,
        OT3Mount.LEFT,
        tiprack["A1"].top().point,
    )
    _qc_call(
        api.pick_up_tip,
        OT3Mount.LEFT,
        _qc_call(helpers_ot3.get_default_tip_length, TIP_VOLUME),
    )
    _qc_call(api.home_z, OT3Mount.LEFT)


def test_tip_sensor(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
    use_pressure_tips: bool = False,
    automatic_pickup: bool = True,
) -> None:
    """Test tip sensor."""
    ctx.comment(
        "吸头检测传感器测试：先测试有吸头状态，再测试无吸头状态。"
        if LOCALIZE
        else "Tip detection sensor test: test with tips first, then without tips."
    )
    ax = Axis.Q
    if automatic_pickup and not use_pressure_tips:
        _pick_up_tip_sensor_tips(api, ctx)
    automated_tips = use_pressure_tips or automatic_pickup
    _qc_call(api.home_z, OT3Mount.LEFT)
    slot_5 = _qc_call(helpers_ot3.get_slot_calibration_square_position_ot3, 5)
    home_pos = _qc_call(api.gantry_position, OT3Mount.LEFT)
    _qc_call(api.move_to, OT3Mount.LEFT, slot_5._replace(z=home_pos.z))
    for expected_state in [True, False]:
        tag = _get_tip_test_tag(tips_dropped=not expected_state)
        if automated_tips:
            if expected_state:
                ctx.comment(
                    "使用已取好的 A1、H12 两个吸头，自动执行有吸头检测。"
                    if LOCALIZE
                    else "Automatically testing with the attached A1/H12 tips."
                )
            else:
                _drop_pressure_tips(api, ctx)
                home_pos = _qc_call(api.gantry_position, OT3Mount.LEFT)
                _qc_call(api.move_to, OT3Mount.LEFT, slot_5._replace(z=home_pos.z))
                ctx.comment(
                    "退头动作已完成，自动执行无吸头检测。"
                    if LOCALIZE
                    else "Tip disposal motion completed; automatically testing without tips."
                )
        _qc_call(api.home, [ax])
        if not api.is_simulator and not automated_tips:
            if expected_state:
                _qc_call(
                    ctx.pause,
                    "准备有吸头检测：请在移液器 A1、H12 两个喷嘴上各安装一个吸头。"
                    "A1、H12 指喷嘴位置，不是甲板槽位。安装完成并移开双手后点击继续；吸头检测机构将自动运动。"
                    if LOCALIZE
                    else "Prepare for detection with tips: manually attach one tip to each of the pipette's A1 and H12 nozzles. "
                    "A1 and H12 refer to nozzle positions, not deck slots. "
                    "Clear your hands, then resume; the tip detection mechanism will move automatically.",
                )
            else:
                _qc_call(
                    ctx.pause,
                    "准备无吸头检测：请从移液器上取下所有吸头。" "确认所有喷嘴均无吸头，移开双手后点击继续；吸头检测机构将自动运动。"
                    if LOCALIZE
                    else "Prepare for detection without tips: remove all tips from the pipette. "
                    "Confirm all nozzles are empty. Clear your hands, then resume; "
                    "the tip detection mechanism will move automatically.",
                )
        home_valid = True
        if not api.is_simulator:
            init_state = _read_tip_status_for_qc(api, report, section, ctx, tag, "home")
            home_valid = init_state == EXPECTED_STATE_AT_HOME_POSITION
            if not home_valid:
                ctx.comment(
                    f"吸头检测传感器在机构归位时的信号异常：预期 {EXPECTED_STATE_AT_HOME_POSITION}，实际 {init_state}。"
                    "此项仅作提示；按生产版逻辑，以检测位置的信号判定本轮结果。"
                    if LOCALIZE
                    else f"Unexpected tip detection signal with the mechanism homed: "
                    f"expected {EXPECTED_STATE_AT_HOME_POSITION}, received {init_state}. "
                    "Warning only; matching production QC, this trial is judged by the signal at the detection position."
                )
        _qc_call(
            helpers_ot3.move_tip_motor_relative_ot3_sync, api, TIP_PRESENCE_POSITION
        )
        state = (
            expected_state
            if api.is_simulator
            else _read_tip_status_for_qc(
                api, report, section, ctx, tag, "detection-position"
            )
        )
        # Match production QC: the home-state check is advisory only.
        result = state == expected_state
        report(section, tag, [CSVResult.from_bool(result)])
        ctx.comment(
            f"{'有吸头' if expected_state else '无吸头'}检测：归位信号{'符合预期' if home_valid else '不符合预期（仅提示）'}；"
            f"检测位置预期 {expected_state}，实际 {state}；{'通过' if result else '失败'}。"
            if LOCALIZE
            else f"{'With-tips' if expected_state else 'Empty'} detection: home signal {'as expected' if home_valid else 'unexpected (warning only)'}; "
            f"expected {expected_state}, received {state} at the detection position; {'PASS' if result else 'FAIL'}."
        )
        _qc_call(api.home, [ax])


# ----------- END TestSection.TIP_SENSOR -----------

# ----------- TestSection.DROPLETS -----------

NUM_SECONDS_TO_WAIT = 30
HOVER_HEIGHT_MM = 50
DEPTH_INTO_RESERVOIR_FOR_ASPIRATE = -24
DEPTH_INTO_RESERVOIR_FOR_DISPENSE = DEPTH_INTO_RESERVOIR_FOR_ASPIRATE

RESERVOIR_LABWARE = "nest_1_reservoir_195ml"

TIP_RACK_96_SLOT = 4  # C1: full rack of 200/1000 uL tips
TIP_RACK_50_SLOT = 7  # B1: full rack of 50 uL tips
RESERVOIR_SLOT = 2
TRASH_SLOT = 12

TRASH_HEIGHT = 40  # DVT trash

# X moves negative (to left), Y moves positive (to rear)
# move to same spot over labware, regardless of number of tips attached
OFFSET_FOR_1_WELL_LABWARE = Point(x=9 * -11 * 0.5, y=9 * 7 * 0.5)

PARTIAL_CURRENTS: Dict[int, float] = {1: 0.1, 8: 0.55, 12: 0.8, 16: 1.1, 24: 1.5}

PARTIAL_TESTS: Dict[str, Tuple[Point, float]] = {
    # test-name: [offset-from-A1, z-current]
    "1-tip-back-left": (
        Point(x=9 * 11, y=9 * 7),  # A12 Tip
        PARTIAL_CURRENTS[1],
    ),
    "8-tips-left": (
        Point(x=9 * 10),  # A11-H11 Tips
        PARTIAL_CURRENTS[8],
    ),
    "24-tips-left": (
        Point(x=9 * 7),  # A8-H10 Tips
        PARTIAL_CURRENTS[24],
    ),
}


def build_droplets_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    all_tips_test = [CSVLine("droplets-96-tips", [float, CSVResult])]
    partial_tests = [
        CSVLine(f"droplets-{name}", [float, CSVResult]) for name in PARTIAL_TESTS.keys()
    ]
    return all_tips_test + partial_tests  # type: ignore[return-value]


def get_trash_nominal() -> Point:
    """Get nominal trash position."""
    trash_nominal = _qc_call(
        helpers_ot3.get_slot_calibration_square_position_ot3, TRASH_SLOT
    ) + Point(z=TRASH_HEIGHT)
    # center the 96ch of the 1-well labware
    trash_nominal += OFFSET_FOR_1_WELL_LABWARE
    return trash_nominal


def aspirate_and_wait(
    ctx: ProtocolContext,
    api: SyncHardwareAPI,
    reservoir: Point,
    volume: int,
    seconds: int = 30,
) -> Tuple[bool, float]:
    """Aspirate and wait."""
    _qc_call(helpers_ot3.move_to_arched_ot3_sync, api, OT3Mount.LEFT, reservoir)
    _qc_call(
        api.move_to,
        OT3Mount.LEFT,
        reservoir + Point(z=DEPTH_INTO_RESERVOIR_FOR_ASPIRATE),
    )
    _qc_call(api.aspirate, OT3Mount.LEFT, volume)
    _qc_call(api.move_to, OT3Mount.LEFT, reservoir + Point(z=HOVER_HEIGHT_MM))

    start_time = monotonic()
    for i in range(seconds):
        if i == 0 or i == seconds - 1:
            _qc_call(api.set_lights, False, False)
        if not api.is_simulator:
            sleep(1)
    _qc_call(api.set_lights, True, True)

    if not api.is_simulator:
        result = _qc_call(
            helpers_ot3.get_user_answer, ctx, api, "look good", timeout_seconds=None
        )
    else:
        result = True
    duration_seconds = monotonic() - start_time

    _qc_call(
        api.move_to,
        OT3Mount.LEFT,
        reservoir + Point(z=DEPTH_INTO_RESERVOIR_FOR_DISPENSE),
    )
    _qc_call(api.dispense, OT3Mount.LEFT, is_full_dispense=True)
    return result, duration_seconds


def _drop_tip(api: SyncHardwareAPI, trash: Point, pipette: Literal[200, 1000]) -> None:
    _qc_call(
        helpers_ot3.move_to_arched_ot3_sync, api, OT3Mount.LEFT, trash + Point(z=20)
    )
    _qc_call(api.move_to, OT3Mount.LEFT, trash)
    _qc_call(api.drop_tip, OT3Mount.LEFT)
    _qc_call(api.home_z, OT3Mount.LEFT)


def _load_droplet_labware(
    ctx: ProtocolContext, pipette: Literal[200, 1000]
) -> Tuple[Labware, Dict[int, Labware]]:
    """Declare both racks for position checking and use the same layout at runtime."""
    reservoir = _qc_call(ctx.load_labware, RESERVOIR_LABWARE, RESERVOIR_SLOT)
    tipracks = {}
    for slot, volume in ((TIP_RACK_96_SLOT, pipette), (TIP_RACK_50_SLOT, 50)):
        adapter = _qc_call(ctx.load_adapter, "opentrons_flex_96_tiprack_adapter", slot)
        tipracks[slot] = _qc_call(
            adapter.load_labware, f"opentrons_flex_96_tiprack_{volume}uL"
        )
    return reservoir, tipracks


def test_droplets(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Test Droplets."""
    ctx.comment(
        f"液滴保持测试：使用 C1 的整盒 {pipette} µL 吸头，再使用 B1 的整盒 50 µL 吸头。"
        "两盒均须装满 96 个吸头，并分别预放在 96 通道吸头盒适配器上；"
        "D2 储液槽和 A3 废弃收集位置须已就绪。测试期间无需换盒。"
        if LOCALIZE
        else f"Droplet retention test: use the full {pipette} uL tiprack in C1, then the full 50 uL tiprack in B1. "
        "Preload both racks, each with 96 tips and its own 96-channel tiprack adapter. "
        "The D2 reservoir and A3 waste location must be ready. No rack exchange is required."
    )
    # GATHER NOMINAL POSITIONS
    reservoir, tipracks = _load_droplet_labware(ctx, pipette)
    trash_nominal = get_trash_nominal()

    # PICK-UP 96 TIPS
    droplets_result = True
    trials = (
        (TIP_RACK_96_SLOT, pipette, pipette),
        (TIP_RACK_50_SLOT, 50, 1 if pipette == 200 else 5),
    )
    for trial, (slot, tip_rack, test_volume) in enumerate(trials, start=1):
        slot_name = f"{'DCBA'[(slot - 1) // 3]}{(slot - 1) % 3 + 1}"
        ctx.comment(
            f"液滴保持测试第 {trial}/2 轮：自动从 {slot_name}（槽位 #{slot}）取 96 个 {tip_rack} µL 吸头，"
            f"每通道吸液 {test_volume} µL。"
            if LOCALIZE
            else f"Droplet retention trial {trial}/2: automatically pick up 96 {tip_rack} uL tips "
            f"from {slot_name} (slot #{slot}); aspirate {test_volume} uL per channel."
        )
        tiprack = tipracks[slot]
        _qc_call(
            helpers_ot3.move_to_arched_ot3_sync,
            api,
            OT3Mount.LEFT,
            tiprack["A1"].top().point,
        )
        _qc_call(
            api.pick_up_tip,
            OT3Mount.LEFT,
            _qc_call(helpers_ot3.get_default_tip_length, tip_rack),
        )
        _qc_call(api.home_z, OT3Mount.LEFT)

        result, duration = aspirate_and_wait(
            ctx,
            api,
            reservoir["A1"].top().move(OFFSET_FOR_1_WELL_LABWARE).point,
            test_volume,
            seconds=NUM_SECONDS_TO_WAIT,
        )
        droplets_result = droplets_result & result
        _drop_tip(api, trash_nominal, pipette)
        _qc_call(api.home_z, OT3Mount.LEFT)
    report(
        section, "droplets-96-tips", [duration, CSVResult.from_bool(droplets_result)]
    )


# ----------- END TestSection.DROPLETS -----------

# ----------- TestSection.ENCODER -----------

STALL_THRESHOLD = 0.25
MOTOR_MM_PER_REV = 2
ENCODER_TICKS_PER_REV = 1000
# The encoder reports four pulses per tick.
PULSE_PER_MM = (4 * ENCODER_TICKS_PER_REV) / MOTOR_MM_PER_REV


def build_encoder_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("encoder-96-stall", [bool, CSVResult]),
        CSVLine("encoder-96-cycles", [int, CSVResult]),
        CSVLine("encoder-96-cumulative-error", [float, CSVResult]),
        CSVLine("encoder-96-abs-avg-error", [float, CSVResult]),
        CSVLine("encoder-96-max-error-mm-error", [float]),
        CSVLine("encoder-96-max-error-pulses-error", [float]),
        CSVLine("encoder-96-max-error-ticks-error", [float]),
    ]


def _plunger_alignment(
    api: SyncHardwareAPI, mount: OT3Mount
) -> Tuple[float, float, float, bool]:
    pipette_ax = Axis.of_main_tool_actuator(mount)
    current_pos = _qc_call(api.current_position_ot3, mount, refresh=True)
    est = current_pos[pipette_ax]
    encoder_pos = _qc_call(api.encoder_current_position_ot3, mount, refresh=True)
    enc = encoder_pos[pipette_ax]
    stalled_mm = est - enc
    stall_detected = abs(stalled_mm) >= STALL_THRESHOLD
    return est, enc, stalled_mm, stall_detected


def test_encoder(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Test Encoder."""
    ctx.comment("测试编码器" if LOCALIZE else "Test Encoder")
    cycles = 5
    mount = OT3Mount.LEFT
    _qc_call(api.home)
    _qc_call(api.home_plunger, mount)

    top_pos, bottom_pos, _, _ = _qc_call(
        helpers_ot3.get_plunger_positions_ot3, api, mount
    )
    pipette_ax = Axis.of_main_tool_actuator(mount)

    cumulative_error = 0.0
    abs_error = 0.0
    completed_moves = 0
    cycle_count = 0
    stall = False
    max_error_mm = 0.0
    max_error_pulses = 0.0
    max_error_ticks = 0.0
    with open(report.parent / "encoder_debug.csv", "w") as csvfile:
        csv_writer = csv.writer(csvfile)
        csv_writer.writerow(
            [
                "cycle",
                "revolution",
                "direction",
                "encoder position",
                "motor position",
                "encoder_pulses",
                "encoder ticks",
                "diff mm",
                "diff pulses",
                "diff ticks",
            ]
        )
        for cycle in range(cycles):
            _qc_call(helpers_ot3.move_plunger_absolute_ot3_sync, api, mount, 0)
            _qc_call(api.current_position_ot3, mount, refresh=True)
            initial_encoder_pos = _qc_call(
                api.encoder_current_position_ot3, mount, refresh=True
            )
            previous_encoder_tick = (
                initial_encoder_pos[pipette_ax]
                / MOTOR_MM_PER_REV
                * ENCODER_TICKS_PER_REV
            )
            previous_encoder_pulse = initial_encoder_pos[pipette_ax] * PULSE_PER_MM
            for revolution in range(int((bottom_pos - top_pos) / MOTOR_MM_PER_REV)):
                try:
                    target = (revolution + 1) * MOTOR_MM_PER_REV
                    _qc_call(
                        helpers_ot3.move_plunger_absolute_ot3_sync, api, mount, target
                    )
                    (
                        motor_pos,
                        encoder_pos,
                        diff,
                        stalled_this_move,
                    ) = _plunger_alignment(api, mount)
                    next_encoder_tick = (
                        encoder_pos / MOTOR_MM_PER_REV * ENCODER_TICKS_PER_REV
                    )
                    next_encoder_pulse = encoder_pos * PULSE_PER_MM
                    pulse_error = int(
                        abs(next_encoder_pulse - previous_encoder_pulse)
                    ) - (ENCODER_TICKS_PER_REV * 4)
                    tick_error = (
                        int(abs(next_encoder_tick - previous_encoder_tick))
                        - ENCODER_TICKS_PER_REV
                    )
                    previous_encoder_pulse = next_encoder_pulse
                    previous_encoder_tick = next_encoder_tick
                    cumulative_error += diff
                    abs_error += abs(diff)
                    max_error_mm = max(abs(diff), max_error_mm)
                    max_error_pulses = max(abs(pulse_error), max_error_pulses)
                    max_error_ticks = max(abs(tick_error), max_error_ticks)
                    completed_moves += 1
                    csv_writer.writerow(
                        [
                            cycle,
                            revolution + 1,
                            "down",
                            encoder_pos,
                            motor_pos,
                            next_encoder_pulse,
                            next_encoder_tick,
                            diff,
                            pulse_error,
                            tick_error,
                        ]
                    )
                    if stalled_this_move:
                        stall = True
                        break
                except StallOrCollisionDetectedError as error:
                    _log_qc_exception(
                        report,
                        ctx,
                        section,
                        f"cycle-{cycle + 1}/revolution-{revolution + 1}",
                        error,
                    )
                    stall = True
                    break
            cycle_count += 1
            if stall:
                break

    average_error = abs_error / completed_moves if completed_moves else float("inf")

    report(section, "encoder-96-stall", [stall, CSVResult.from_bool(not stall)])
    report(
        section,
        "encoder-96-cycles",
        [cycle_count, CSVResult.from_bool(cycle_count == cycles)],
    )
    report(
        section,
        "encoder-96-cumulative-error",
        [
            cumulative_error,
            CSVResult.from_bool(abs(cumulative_error) < STALL_THRESHOLD),
        ],
    )
    report(
        section,
        "encoder-96-abs-avg-error",
        [
            average_error,
            CSVResult.from_bool(average_error < STALL_THRESHOLD),
        ],
    )
    report(section, "encoder-96-max-error-mm-error", [max_error_mm])
    report(
        section,
        "encoder-96-max-error-pulses-error",
        [max_error_pulses],
    )
    report(
        section,
        "encoder-96-max-error-ticks-error",
        [max_error_ticks],
    )


# ----------- END TestSection.ENCODER -----------


def _failed_qc_items(report: CSVReport) -> List[str]:
    """Include barcode and other explicit metadata failures in the QC result."""
    metadata_failures = [
        f"META_DATA/{line.tag}"
        for line in report["META_DATA"].lines
        if line.result_passed is False
    ]
    return list(dict.fromkeys(metadata_failures + report.get_failed_results()))


def _failure_log_path(report: Optional[CSVReport]) -> Path:
    """Use the CSV filename, with a separate fallback before metadata is complete."""
    if report is not None:
        try:
            return report.file_path.with_suffix(".log")
        except RuntimeError:
            parent = report.parent
    else:
        test_parent = data_io.create_folder_for_test_data(TEST_NAME)
        parent = data_io.create_folder_for_test_data(
            test_parent / data_io.create_run_id()
        )
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    return parent / f"{TEST_NAME}-startup-{stamp}.log"


def _failure_log_criteria() -> List[str]:
    """Describe the existing limits so failed values can be interpreted offline."""
    return [
        "",
        "Acceptance criteria:",
        f"PLUNGER: abs(motor - encoder) < {PLUNGER_MAX_SKIP_MM} mm; "
        "measurement columns are encoder, motor, result.",
        "JAWS: homed LEDs ON, retracted LEDs OFF, return LEDs OFF (operator checks).",
        f"CAPACITANCE: inclusive pF limits {THRESHOLDS!r}; "
        "attached > air, deck > attached; deck-mm is stopped Z + 5 mm, must be >= 0.001.",
        f"PRESSURE P1000: strict Pa limits {THRESHOLDS_1000!r}.",
        f"PRESSURE P200: strict Pa limits {THRESHOLDS_200!r}.",
        "ENVIRONMENT-SENSOR: complete finite temperature/humidity readings; "
        "no temperature/humidity acceptance range.",
        "TIP-SENSOR: detection position is True with tips and False without tips; "
        "home-state warning does not change the grade.",
        "DROPLETS: both 96-tip trials must pass the operator's leak check.",
        f"ENCODER: no stall, 5 cycles, abs(cumulative error) < {STALL_THRESHOLD} mm, "
        f"mean absolute error < {STALL_THRESHOLD} mm.",
    ]


def _failure_json_value(value: Any) -> Any:
    """Keep missing values explicit and produce standards-compliant JSON."""
    if isinstance(value, enum.Enum):
        return value.value
    if value is None or isinstance(value, (str, int, bool)):
        return value
    if isinstance(value, float):
        return value if isfinite(value) else None
    if isinstance(value, dict):
        return {str(key): _failure_json_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_failure_json_value(item) for item in value]
    return str(value)


def _failure_code_from_section(section: str, tag: str) -> str:
    """Classify an explicit failed check without diagnosing a faulty part."""
    if section == "META_DATA" and tag == "test_device_id":
        return "QC_BARCODE_MISMATCH"
    return {
        "PLUNGER": "QC_PLUNGER_MOTION_FAILED",
        "JAWS": "QC_JAWS_CHECK_FAILED",
        "CAPACITANCE": "QC_CAPACITANCE_CHECK_FAILED",
        "PRESSURE": "QC_PRESSURE_CHECK_FAILED",
        "ENVIRONMENT-SENSOR": "QC_ENVIRONMENT_SENSOR_READ_FAILED",
        "TIP-SENSOR": "QC_TIP_SENSOR_CHECK_FAILED",
        "DROPLETS": "QC_LIQUID_LEAK_DETECTED",
        "ENCODER": "QC_ENCODER_CHECK_FAILED",
    }.get(section, "QC_TEST_FAILED")


def _failure_report_rows(report: Optional[CSVReport]) -> List[Dict[str, Any]]:
    """Export every row, including raw values and rows never measured."""
    rows: List[Dict[str, Any]] = []
    if report is None:
        return rows
    for section in report._sections:
        indices: Dict[str, int] = {}
        for line in section.lines:
            index = indices.get(line.tag, 0)
            indices[line.tag] = index + 1
            result = line.result_passed
            rows.append(
                {
                    "section": section.title,
                    "tag": line.tag,
                    "index": index,
                    "evidence_id": f"{section.title}/{line.tag}[{index}]",
                    "record_status": (
                        "recorded"
                        if any(value is not None for value in line.data)
                        else "not_recorded"
                    ),
                    "result": "FAIL"
                    if result is False
                    else "PASS"
                    if result is True
                    else "unknown",
                    "data": _failure_json_value(line.data),
                    "elapsed_seconds": line.timestamp,
                    "failure_reasons": list(getattr(line, "failure_reasons", [])),
                    "error_codes": [_failure_code_from_section(section.title, line.tag)]
                    if result is False
                    else [],
                }
            )
    return rows


def _section_failure_details(
    report: CSVReport, section: str, pipette: Literal[200, 1000]
) -> Tuple[List[Dict[str, Any]], str]:
    """Describe recorded failures without regrading data or reading hardware."""
    failed_rows = [
        row
        for row in _failure_report_rows(report)
        if row["section"] == section and row["result"] == "FAIL"
    ]
    if not failed_rows:
        return [], ""

    criteria_prefix = (
        f"PRESSURE P{pipette}:" if section == "PRESSURE" else f"{section}:"
    )
    criteria = [
        line for line in _failure_log_criteria() if line.startswith(criteria_prefix)
    ]
    if section == "META_DATA":
        criteria = [
            "META_DATA: 扫码编号须与实机编号一致；操作员不能为空。"
            if LOCALIZE
            else "META_DATA: the scanned serial number must match the instrument serial number; the operator must be nonempty."
        ]
    lines = [
        f"{section} 测试不通过，以下为已记录的失败项："
        if LOCALIZE
        else f"{section} failed. Recorded failure details:",
        "原始记录中的 null 表示缺失或非有限数值，不代表 0。"
        if LOCALIZE
        else "null in recorded data means missing or non-finite, not zero.",
    ]
    for row in failed_rows:
        data = json.dumps(row["data"], ensure_ascii=False, allow_nan=False)
        lines.append(
            f"- {row['evidence_id']}: 原始记录={data}"
            if LOCALIZE
            else f"- {row['evidence_id']}: recorded data={data}"
        )
        lines.extend(f"  {reason}" for reason in row["failure_reasons"])
    if criteria:
        lines.append("原判定要求：" if LOCALIZE else "Original acceptance criteria:")
        lines.extend(criteria)
    caught = [
        detail
        for detail in getattr(report, "_qc_exception_details", [])
        if f"] {section}/" in detail.split("\n", 1)[0]
    ]
    if caught:
        lines.append("本项已捕获异常：" if LOCALIZE else "Caught errors in this section:")
        lines.extend(caught)
    return failed_rows, "\n".join(lines)


def _failure_recommendations(
    rows: List[Dict[str, Any]],
    failure_details: List[str],
    exception_traceback: Optional[str],
    caught_exceptions: List[str],
) -> List[Dict[str, Any]]:
    """Suggest checks from evidence, without declaring an internal part defective."""
    candidates = [
        (
            row["evidence_id"],
            row["section"] + "/" + row["tag"] + " " + " ".join(row["failure_reasons"]),
        )
        for row in rows
        if row["result"] == "FAIL"
    ]
    candidates.extend(("failure_details", detail) for detail in failure_details)
    candidates.extend(
        (f"caught_exceptions[{index}]", detail)
        for index, detail in enumerate(caught_exceptions)
    )
    if exception_traceback:
        candidates.append(("exception_traceback", exception_traceback))
    rules = [
        (
            "software_configuration",
            ("unexpected keyword argument", "requested status for sensor"),
            "核对协议、公共函数和机器人软件版本，以及实际 96 通道型号支持的传感器调用。",
            "版本或调用修正后，重新运行原失败步骤及完整 QC。",
        ),
        (
            "overpressure",
            ("pipetteoverpressure", "exceeded operational limits", "压力超限"),
            "结合失败前动作检查吸头、夹具密封、气路和柱塞位置；最近采样值不能代替未知的触发压力。",
            "确认原因并处理后，按原条件复测失败阶段及压力项目；保留压力保护。",
        ),
        (
            "barcode",
            ("test_device_id", "barcode_mismatch"),
            "核对设备读取编号、扫码内容和装配记录。",
            "编号一致后重新验证元数据及完整 QC。",
        ),
        (
            "environment_sensor",
            ("environment-", "environment_sensor"),
            "核对 A1、H12 的温湿度数据是否完整且有限，结合异常检查传感器读取和通信。零值本身不能据此判为故障。",
            "复测两组温湿度读取有效性；本协议未设温湿度数值合格范围。",
        ),
        (
            "tip_sensor",
            ("tip-sensor", "tip_sensor", "tip-status", "tip status"),
            "核对有头和无头检测位置的状态及取退头动作；结合原始异常检查读取和通信。",
            "复测原有头及无头检测；回零位置提示不作为新增不合格条件。",
        ),
        (
            "capacitance",
            ("capacitance", "capacitive", "calibrationstructurenotfound"),
            "核对 A1、H12 探针的安装、校准结构、空气及探针和甲板处读数；先区分读取异常与实测超限。",
            "按报告记录的原电容范围、相对变化和甲板停止位置要求复测。",
        ),
        (
            "pressure",
            ("pressure",),
            "核对实际 P200 或 P1000 型号、对应压力标准及 A1/H12 读数；检查吸头、夹具和气路密封。",
            "按原型号的压力范围和原动作顺序复测，不调整阈值或关闭压力保护。",
        ),
        (
            "encoder_motion",
            ("encoder", "stall"),
            "核对编码器与电机位置、方向和运动阻力，结合 encoder CSV 与异常动作检查偏差。",
            "按原循环次数、累计误差、平均绝对误差及无失步要求复测。",
        ),
        (
            "plunger_motion",
            ("plunger",),
            "核对异常对应的电流、速度、运动方向和步次，并检查电机与编码器位置差及运动阻力。",
            "按原电流速度组合和位置误差限复测柱塞项目。",
        ),
        (
            "jaws",
            ("jaws",),
            "核对操作员记录的 LED、夹爪对齐和无碰撞检查项，以及对应电流和速度条件。",
            "按原夹爪动作和操作员确认要求复测。",
        ),
        (
            "liquid_leak",
            ("droplets",),
            "核对两种整盒吸头的安装密封、吸液体积、实际等待时间及操作员漏液判定。",
            "按原两轮 96 吸头测试条件和等待时间复测漏液。",
        ),
    ]
    recommendations: Dict[str, Dict[str, Any]] = {}
    for source, detail in candidates:
        normalized = detail.lower()
        rule = next(
            (rule for rule in rules if any(token in normalized for token in rule[1])),
            ("unclassified", (), "结合原始异常和最后动作复核运行配置及现场。", "原因确认后复测原失败步骤及完整 QC。"),
        )
        category, _, checks, retest = rule
        item = recommendations.setdefault(
            category,
            {
                "category": category,
                "status": "needs_confirmation",
                "evidence": [],
                "next_checks": [checks],
                "retest": retest,
            },
        )
        item["evidence"].append({"source": source, "detail": detail})
    return list(recommendations.values())


def _failure_bundle(
    state: _QCFailureContext,
    error: Optional[Exception] = None,
    checkpoint_error: Optional[str] = None,
) -> Dict[str, Any]:
    """Snapshot evidence only; never query or move hardware while archiving."""
    trace: Dict[str, Any] = {}
    trace_error: Optional[str] = None
    try:
        if _ACTIVE_QC_TRACE is not None:
            trace = _ACTIVE_QC_TRACE.snapshot()
    except Exception as logging_error:
        trace_error = f"{type(logging_error).__name__}: {logging_error}"
    report = state.report
    rows: List[Dict[str, Any]] = []
    report_run_id = None
    report_error: Optional[str] = None
    failure_details: List[str] = []
    if error is not None:
        failure_details.append(f"[QC_RUNTIME_ERROR] {type(error).__name__}: {error}")
    if checkpoint_error:
        failure_details.append("CSV checkpoint failed: " + checkpoint_error)
    try:
        if report is not None:
            report_run_id = cast(CSVLine, report["META_DATA"]["test_run_id"]).data[0]
            rows = _failure_report_rows(report)
            failure_details.extend(_failed_qc_items(report))
    except Exception as extraction_error:
        report_error = f"{type(extraction_error).__name__}: {extraction_error}"
    caught_exceptions = list(getattr(report, "_qc_exception_details", []))
    exception_traceback = (
        "".join(traceback.format_exception(type(error), error, error.__traceback__))
        if error is not None
        else None
    )
    return {
        "schema_version": 1,
        "protocol": TEST_NAME,
        "mode": "assembly_qc",
        "run_id": trace.get("run_id") or report_run_id or data_io.create_run_id(),
        "report_run_id": report_run_id,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "stage": state.stage,
        "completed_sections": list(state.completed_sections),
        "completed_modes": [],
        "parameters": _failure_json_value(state.parameters),
        "failure_details": failure_details,
        "runtime_error": {"type": type(error).__name__, "message": str(error)}
        if error is not None
        else None,
        "exception_traceback": exception_traceback,
        "caught_exceptions": caught_exceptions,
        "trace": trace,
        "trace_error": trace_error,
        "cleanup_error": trace.get("cleanup_errors") or None,
        "report_rows": rows,
        "report_extraction_error": report_error,
        "acceptance_criteria": _failure_log_criteria()[2:],
        "acceptance_limits": {
            "plunger_position_error_mm": {"maximum_exclusive": PLUNGER_MAX_SKIP_MM},
            "capacitance_pf": {
                "ranges": THRESHOLDS,
                "bounds": "inclusive",
                "relative_checks": ["attached > air", "deck > attached"],
            },
            "pressure_pa": {
                "P1000": THRESHOLDS_1000,
                "P200": THRESHOLDS_200,
                "bounds": "exclusive",
                "selected_size_ul": state.parameters.get("pip_size"),
            },
            "environment": {
                "finite_readings_required": True,
                "numeric_acceptance_range": None,
            },
            "encoder_error_mm": {"maximum_exclusive": STALL_THRESHOLD},
        },
        "interpretation": {
            "unknown": "No explicit PASS/FAIL assessment was recorded.",
            "not_recorded": "No row values were recorded; this does not mean PASS.",
            "completed_sections": "Sections returned normally, not necessarily PASS.",
            "test_execution_status": "Use trace.tests for skipped/not-started/exception states; row absence alone cannot distinguish them.",
            "thresholds": "Use original acceptance_criteria and recorded threshold rows; raw samples are not independently graded.",
            "environment": "Temperature/humidity checks require complete finite readings; no numeric acceptance range is defined.",
            "pressure": "Latest sampled readings are not necessarily the trigger-time pressure; unavailable trigger values remain unknown.",
        },
        "recommendations": _failure_recommendations(
            rows, failure_details, exception_traceback, caught_exceptions
        ),
        "artifacts": [],
    }


def _render_failure_log(bundle: Dict[str, Any]) -> str:
    """Render one shared snapshot into human-readable failure evidence."""
    trace = bundle["trace"]
    lines = [
        f"Time UTC: {bundle['created_at_utc']}",
        f"QC protocol: {bundle['protocol']}",
        f"Run ID: {bundle['run_id']}",
        f"QC mode: {bundle['mode']}",
        f"Stage: {bundle['stage']}",
        "Completed sections (returned normally, not necessarily PASS): "
        + (", ".join(bundle["completed_sections"]) or "none"),
        "Failure archive directory: "
        + json.dumps(bundle.get("archive_directory", {}), ensure_ascii=False),
        "Run parameters: " + json.dumps(bundle["parameters"], ensure_ascii=False),
        "",
        "Failure details:",
        *(f"- {detail}" for detail in bundle["failure_details"]),
        "",
        "Failure action and latest observed readings (not trigger-time values):",
        json.dumps(
            {key: trace.get(key) for key in ("last_failure", "latest_readings")},
            ensure_ascii=False,
            indent=2,
        ),
        "",
        "Run identity / versions:",
        json.dumps(trace.get("identity", {}), ensure_ascii=False, indent=2),
        "",
        "Labware locations and offsets:",
        json.dumps(trace.get("labware", {}), ensure_ascii=False, indent=2),
        "",
        "Test execution states:",
        json.dumps(trace.get("tests", {}), ensure_ascii=False, indent=2),
        "",
        "Acceptance criteria:",
        *bundle["acceptance_criteria"],
        "",
        "Checks and retest recommendations (unconfirmed causes are not part diagnoses):",
        json.dumps(bundle["recommendations"], ensure_ascii=False, indent=2),
        "",
        "All report rows (unknown or not_recorded does not mean PASS):",
        *(json.dumps(row, ensure_ascii=False) for row in bundle["report_rows"]),
    ]
    if bundle["report_run_id"] is None:
        lines.append("CSV report: not created; failure occurred before testing")
    if bundle["report_extraction_error"]:
        lines.append("Report extraction error: " + bundle["report_extraction_error"])
    if bundle["caught_exceptions"]:
        lines.extend(
            ["", "Caught QC exception tracebacks:", *bundle["caught_exceptions"]]
        )
    if trace.get("events"):
        lines.extend(
            [
                "",
                "Action history:",
                json.dumps(trace["events"], ensure_ascii=False, indent=2),
            ]
        )
    if bundle["trace_error"]:
        lines.append("Trace extraction error: " + bundle["trace_error"])
    if bundle.get("cleanup_error"):
        lines.extend(
            [
                "",
                "Additional cleanup errors (original failure preserved):",
                json.dumps(bundle["cleanup_error"], ensure_ascii=False, indent=2),
            ]
        )
    if bundle["exception_traceback"]:
        lines.extend(
            ["", "Exception traceback:", bundle["exception_traceback"].rstrip()]
        )
    return "\n".join(lines) + "\n"


def _failure_archive_directory(bundle: Dict[str, Any]) -> Dict[str, str]:
    """Group one report's evidence by DUT serial and its original UTC creation time."""
    metadata = {
        row["tag"]: row["data"][0]
        for row in bundle["report_rows"]
        if row["section"] == "META_DATA" and row["data"]
    }
    serial = metadata.get("test_device_id")
    serial_source = "report.test_device_id"
    if not isinstance(serial, str) or not serial.strip():
        serial = (
            bundle["trace"]
            .get("identity", {})
            .get("actual_pipettes", {})
            .get("LEFT", {})
            .get("serial")
        )
        serial_source = "trace.identity.actual_pipettes.LEFT.serial"
    if not isinstance(serial, str) or not serial.strip():
        serial = "unknown-SN"
        serial_source = "unavailable"
    # Keep the serial recognizable while ensuring a single safe path component.
    safe_serial = re.sub(r"[^A-Za-z0-9_.-]", "_", serial).strip(".") or "unknown-SN"
    if safe_serial != serial or len(safe_serial) > 120:
        digest = hashlib.sha256(serial.encode("utf-8")).hexdigest()[:10]
        safe_serial = f"{safe_serial[:120]}-{digest}"

    created = None
    timestamp_source = ""
    for value, time_format, source in (
        (metadata.get("test_time_utc"), "%Y/%m/%d-%H:%M:%S", "report.test_time_utc"),
        (bundle.get("report_run_id"), "run-%y-%m-%d-%H-%M-%S", "report.test_run_id"),
    ):
        if isinstance(value, str):
            try:
                created = datetime.strptime(value, time_format).replace(
                    tzinfo=timezone.utc
                )
                timestamp_source = source
                break
            except ValueError:
                pass
    if created is None:
        # Startup failures may precede report creation; label the fallback honestly.
        created = datetime.fromisoformat(
            bundle["created_at_utc"].replace("Z", "+00:00")
        )
        timestamp_source = "failure_bundle.created_at_utc"
    stamp = created.astimezone(timezone.utc).strftime(
        "%Y%m%dT%H%M%S.%fZ" if created.microsecond else "%Y%m%dT%H%M%SZ"
    )
    return {
        "remote_subdir": f"{safe_serial}_{stamp}",
        "serial_number": serial,
        "serial_source": serial_source,
        "timestamp_utc": created.astimezone(timezone.utc).isoformat(),
        "timestamp_source": timestamp_source,
    }


def _upload_failure_bundle_artifact(
    ctx: ProtocolContext, artifact: Dict[str, Any]
) -> None:
    """Attempt each attachment independently and tolerate older robot helpers."""
    path = Path(artifact["path"])
    uploader = getattr(data_center_client, "upload_failure_artifact", None)
    supports_subdirectory = uploader is not None and getattr(
        data_center_client, "FAILURE_ARTIFACT_SUBDIRECTORY_SUPPORTED", False
    )
    if uploader is None:
        if path.suffix != ".log":
            artifact["upload_status"] = "skipped_unsupported"
            artifact["upload_error"] = "Robot upload helper supports .log only."
            _failure_log_comment(
                ctx, f"Failure attachment kept locally (old upload helper): {path}"
            )
            return
        uploader = upload_failure_log
    remote_subdir = artifact["remote_subdir"]
    remote_base = data_center_client.FAILURE_LOG_REMOTE_DIR.rstrip("/")
    artifact["remote_subdir_applied"] = bool(supports_subdirectory)
    artifact["remote_directory"] = (
        f"{remote_base}/{remote_subdir}" if supports_subdirectory else remote_base
    )
    if not supports_subdirectory:
        artifact[
            "upload_note"
        ] = "Old upload helper does not support report subdirectories; using the archive root."
        _failure_log_comment(ctx, artifact["upload_note"])
    try:
        if supports_subdirectory:
            uploaded = uploader(path, remote_subdir=remote_subdir, raise_on_error=True)
        else:
            uploaded = uploader(path, raise_on_error=True)
        artifact["upload_status"] = "uploaded" if uploaded else "failed"
        if not uploaded:
            artifact["upload_error"] = "Uploader returned False."
    except Exception as error:
        artifact["upload_status"] = "failed"
        artifact["upload_error"] = f"{type(error).__name__}: {error}"
    artifact["upload_attempt_finished_at_utc"] = datetime.now(timezone.utc).isoformat()
    _failure_log_comment(
        ctx,
        f"Failure attachment {artifact['upload_status']}: {path}"
        + f"; server directory: {artifact['remote_directory']}"
        + (f"; {artifact['upload_error']}" if artifact.get("upload_error") else ""),
    )


def _copy_failure_encoder_csv(
    report: CSVReport, log_path: Path, bundle: Dict[str, Any]
) -> None:
    """Copy existing encoder evidence without saving or uploading the QC report."""
    attachments = bundle["artifacts"]
    try:
        encoder_path = report.parent / "encoder_debug.csv"
        if encoder_path.is_file():
            encoder_copy = log_path.with_suffix(".encoder.csv")
            encoder_copy.write_bytes(encoder_path.read_bytes())
            attachments.append(
                {
                    "run_id": bundle["run_id"],
                    "role": "encoder_csv",
                    "path": str(encoder_copy),
                    "upload_status": "pending",
                }
            )
    except Exception as error:
        bundle["encoder_checkpoint_error"] = f"{type(error).__name__}: {error}"


def _write_failure_manifest(
    ctx: ProtocolContext, bundle: Dict[str, Any], manifest: Dict[str, Any]
) -> bool:
    """A JSON write error must not prevent independently saved evidence upload."""
    try:
        manifest["save_status"] = "saved"
        Path(manifest["path"]).write_text(
            json.dumps(
                _failure_json_value(bundle),
                ensure_ascii=False,
                indent=2,
                allow_nan=False,
            )
            + "\n",
            encoding="utf-8",
        )
        return True
    except Exception as error:
        manifest["save_status"] = "not_saved"
        manifest.setdefault("save_errors", []).append(
            f"{type(error).__name__}: {error}"
        )
        if manifest["upload_status"] in ("pending", "pending_self_upload"):
            manifest["upload_status"] = "not_saved"
        _failure_log_comment(
            ctx,
            f"Failure manifest not_saved: {manifest['path']}; {type(error).__name__}: {error}; other saved evidence is retained.",
        )
        return False


def _archive_failure_log(
    ctx: ProtocolContext,
    state: _QCFailureContext,
    error: Optional[Exception] = None,
) -> Optional[Path]:
    """Save and upload independent evidence without replacing the original QC error."""
    checkpoint_error = None
    if error is not None and state.report is not None:
        try:
            state.report.save_to_disk()
        except Exception as save_error:
            checkpoint_error = f"{type(save_error).__name__}: {save_error}"
    try:
        log_path = _failure_log_path(state.report)
        bundle = _failure_bundle(state, error, checkpoint_error)
        bundle["archive_directory"] = _failure_archive_directory(bundle)
        attachments: List[Dict[str, Any]] = bundle["artifacts"]
        for role, path in (
            ("readable_log", log_path),
            ("manifest", log_path.with_suffix(".json")),
        ):
            attachments.append(
                {
                    "run_id": bundle["run_id"],
                    "role": role,
                    "path": str(path),
                    "upload_status": "pending",
                }
            )
        log_path.write_text(
            _render_failure_log(bundle)
            + "\nAttachment manifest: "
            + str(log_path.with_suffix(".json"))
            + "\n",
            encoding="utf-8",
        )
        if state.report is not None:
            _copy_failure_encoder_csv(state.report, log_path, bundle)
        for artifact in attachments:
            artifact["remote_subdir"] = bundle["archive_directory"]["remote_subdir"]
        manifest = next(item for item in attachments if item["role"] == "manifest")
        bundle["manifest_upload_note"] = (
            "The server copy records pending_self_upload for this manifest; it cannot attest to its own completed transfer. "
            "The local manifest and run comments record the actual final upload result."
        )
        _write_failure_manifest(ctx, bundle, manifest)
    except Exception as log_error:
        _failure_log_comment(
            ctx, f"QC failure bundle could not be written: {log_error}"
        )
        return None
    _failure_log_comment(ctx, f"QC failure log saved locally: {log_path}")
    for artifact in attachments:
        if artifact["role"] != "manifest" and artifact["upload_status"] == "pending":
            _upload_failure_bundle_artifact(ctx, artifact)
    manifest["upload_status"] = "pending_self_upload"
    if _write_failure_manifest(ctx, bundle, manifest):
        _upload_failure_bundle_artifact(ctx, manifest)
    _write_failure_manifest(ctx, bundle, manifest)
    return log_path


def _report_batch(report: CSVReport) -> ContextManager[None]:
    """Use batching when installed, retaining immediate saves on older robots."""
    return getattr(report, "batch_update", nullcontext)()


def _record_capacitance_thresholds(
    report: CSVReport, section: str, probe: InstrumentProbeType
) -> None:
    """Save one probe's reference thresholds before starting its measurements."""
    with _report_batch(report):
        for name, (minimum, maximum) in THRESHOLDS.items():
            report(section, _get_capacitive_test_tag(probe, f"{name}-min"), [minimum])
            report(section, _get_capacitive_test_tag(probe, f"{name}-max"), [maximum])


def build_report(test_name: str) -> CSVReport:
    """Build report."""
    return CSVReport(
        test_name=test_name,
        sections=[
            CSVSection(
                title=TestSection.PLUNGER.value, lines=build_plunger_csv_lines()
            ),
            CSVSection(title=TestSection.JAWS.value, lines=build_jaws_csv_lines()),
            CSVSection(
                title=TestSection.CAPACITANCE.value,
                lines=build_capacitance_csv_lines(),
            ),
            CSVSection(
                title=TestSection.PRESSURE.value, lines=build_pressure_csv_lines()
            ),
            CSVSection(
                title=TestSection.ENVIRONMENT_SENSOR.value,
                lines=build_env_csv_lines(),
            ),
            CSVSection(
                title=TestSection.TIP_SENSOR.value,
                lines=build_tip_csv_lines(),
            ),
            CSVSection(
                title=TestSection.DROPLETS.value, lines=build_droplets_csv_lines()
            ),
            CSVSection(
                title=TestSection.ENCODER.value, lines=build_encoder_csv_lines()
            ),
        ],
    )


TESTS: List[Tuple[TestSection, Callable[..., Any]]] = [
    (
        TestSection.PLUNGER,
        test_plunger,
    ),
    (
        TestSection.JAWS,
        test_jaws,
    ),
    (
        TestSection.CAPACITANCE,
        test_capacitance,
    ),
    (
        TestSection.PRESSURE,
        test_pressure,
    ),
    (
        TestSection.ENVIRONMENT_SENSOR,
        test_environmental_sensor,
    ),
    (
        TestSection.TIP_SENSOR,
        test_tip_sensor,
    ),
    (
        TestSection.DROPLETS,
        test_droplets,
    ),
    (
        TestSection.ENCODER,
        test_encoder,
    ),
]


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    parameters.add_str(
        display_name="Pipette Size",
        variable_name="pip_size",
        default="1000",
        choices=[
            {"display_name": "1000", "value": "1000"},
            {"display_name": "200", "value": "200"},
        ],
        description=(
            "Size of the P200 or P1000 96-channel pipette installed on the left mount."
        ),
    )
    parameters.add_str(
        display_name="Operator",
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
        description=(
            "Select operator to upload CSV. "
            "Unused skips CSV upload; failure logs still upload."
        ),
    )
    for s in TestSection:
        parameters.add_bool(
            display_name=f"Skip {s.value.lower()}",
            variable_name=f"skip_{s.value.lower().replace('-', '_')}",
            default=False,
            description=f"When this is true the robot will not test {s.value.lower()}",
        )


def _load_analysis_pipette(ctx: ProtocolContext, pipette_size: int) -> None:
    """Declare the selected 96-channel pipette during protocol analysis."""
    pipette_name = (
        "flex_96channel_1000" if pipette_size == 1000 else "flex_96channel_200"
    )
    _qc_call(ctx.load_instrument, pipette_name, "left")


def _load_analysis_labware(
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
    tests: Dict[TestSection, Callable],
) -> None:
    """Expose selected QC labware to analysis and Labware Position Check."""
    if TestSection.PRESSURE in tests or TestSection.TIP_SENSOR in tests:
        adapter = _qc_call(
            ctx.load_adapter, "opentrons_flex_96_tiprack_adapter", SLOT_FOR_PICK_UP_TIP
        )
        _qc_call(adapter.load_labware, "opentrons_flex_96_tiprack_50uL")
    if TestSection.DROPLETS in tests:
        _load_droplet_labware(ctx, pipette)


def _run_test_sections(
    api: SyncHardwareAPI,
    report: CSVReport,
    ctx: ProtocolContext,
    config: TestConfig,
    state: Optional[_QCFailureContext] = None,
) -> None:
    """Run selected sections, consuming retained pressure tips immediately."""
    tip_sensor_completed = False
    pressure_without_retained_tips = False
    for section, test_run in config.tests.items():
        if section == TestSection.TIP_SENSOR and tip_sensor_completed:
            continue
        if section == TestSection.PRESSURE:
            reuse_tips = TestSection.TIP_SENSOR in config.tests
            retained = _run_qc_test(
                test_run,
                api,
                report,
                section.value,
                ctx,
                pipette=config.pipette,
                state=state,
                retain_tips=reuse_tips,
            )
            if retained:
                _run_qc_test(
                    config.tests[TestSection.TIP_SENSOR],
                    api,
                    report,
                    TestSection.TIP_SENSOR.value,
                    ctx,
                    pipette=config.pipette,
                    state=state,
                    use_pressure_tips=True,
                )
                tip_sensor_completed = True
            elif reuse_tips:
                # Pressure testing may already have consumed the only two tips
                # and loaded the D1 labware. Do not attempt a second pickup.
                pressure_without_retained_tips = True
                ctx.comment(
                    "压力测试未保留吸头，后续吸头检测将按独立测试流程提示人工装卸吸头。"
                    if LOCALIZE
                    else "No tips retained from pressure testing. Tip detection will use standalone manual attachment/removal prompts."
                )
        elif section == TestSection.TIP_SENSOR:
            _run_qc_test(
                test_run,
                api,
                report,
                section.value,
                ctx,
                pipette=config.pipette,
                state=state,
                automatic_pickup=not pressure_without_retained_tips,
            )
        else:
            _run_qc_test(
                test_run,
                api,
                report,
                section.value,
                ctx,
                pipette=config.pipette,
                state=state,
            )


def _run_qc(ctx: ProtocolContext, state: _QCFailureContext) -> List[str]:
    """Execute QC while the entry point handles startup and runtime failures."""
    state.stage = "configuration"
    args = ctx.params.get_all()
    state.parameters = dict(args)
    _qc_initialize_tests(args)
    selected_size = int(ctx.params.pip_size)  # type: ignore[attr-defined]
    if selected_size not in (200, 1000):
        raise ValueError("Pipette Size must be 200 or 1000 uL.")
    pipette_size = cast(Literal[200, 1000], selected_size)
    state.stage = "instrument-setup"
    _load_analysis_pipette(ctx, selected_size)
    t_sections = {
        s: f for s, f in TESTS if not args[f"skip_{s.value.lower().replace('-', '_')}"]
    }
    if ctx.is_simulating():
        # Declare the whole selected layout without executing hardware QC. Both
        # droplet racks must be available for LPC before either trial runs.
        _load_analysis_labware(ctx, pipette_size, t_sections)
        ctx.comment(
            "QC 耗材布局分析完成；请在运行前进行耗材位置校准，硬件测试将在机器人上执行。"
            if LOCALIZE
            else "QC labware layout analyzed. Perform Labware Position Check before running; hardware tests run on the robot."
        )
        return []

    state.stage = "hardware-initialization"
    # apply monkey patch
    OT3API._read_qc_sensor = _read_qc_sensor_patch  # type: ignore[attr-defined]
    helpers_ot3.set_gantry_per_axis_setting_ot3 = _set_gantry_per_axis_setting_patch
    OT3API._home_tip_motors = _home_tip_motors_patch  # type: ignore[attr-defined]
    OT3API._partial_pick_up_z_motion = _partial_pick_up_z_motion_patch  # type: ignore[attr-defined]
    OT3API._get_tip_status = _get_tip_status_patch  # type: ignore[attr-defined]
    OT3API._capacitive_probe = _cap_probe_patch  # type: ignore[attr-defined]
    api = ctx._core.get_hardware()
    _qc_capture_identity(api)

    state.stage = "report-creation"
    report = build_report(TEST_NAME)
    state.report = report
    dut = helpers_ot3.DeviceUnderTest.PIPETTE_LEFT
    # The fixed scanner is aligned with the same deck position used by Test
    # Plunger. Move there before asking the operator to scan the pipette.
    state.stage = "barcode-positioning"
    with _qc_step("barcode-positioning"):
        _move_to_test_plunger_position(api)
    state.stage = "metadata-verification"
    _qc_call(helpers_ot3.set_csv_report_meta_data_ot3, api, report, operator=ctx.params.operator, dut=dut, ctx=ctx)  # type: ignore[attr-defined]
    _confirm_failed_section(ctx, api, report, "META_DATA", pipette_size)
    config = TestConfig(
        simulate=ctx.is_simulating(), tests=t_sections, pipette=pipette_size
    )
    _run_test_sections(api, report, ctx, config, state=state)

    # SAVE REPORT
    state.stage = "report-save"
    report.save_to_disk()
    state.stage = "result-summary"
    failed_items = _failed_qc_items(report)
    if failed_items:
        ctx.comment(
            "QC failed items:\n" + "\n".join(f"- {item}" for item in failed_items)
        )
    else:
        ctx.comment("QC failed items: none")
    return failed_items


def _upload_formal_report(ctx: ProtocolContext, state: _QCFailureContext) -> None:
    """Upload a saved, completed run without changing its QC result or local files."""
    if state.report is None or ctx.is_simulating():
        return
    report_path = state.report.file_path
    if state.parameters.get("operator", "Unused") == "Unused":
        ctx.comment(
            "QC CSV auto-upload skipped (Operator=Unused); "
            f"saved locally at {report_path}"
        )
        return
    previous_stage = state.stage
    state.stage = "csv-upload"
    ctx.comment(f"Uploading QC CSV report: {report_path}")

    def report_upload_progress(message: str) -> None:
        _qc_observe("csv_upload", message=message)
        ctx.comment(f"QC CSV upload: {message}")

    try:
        uploaded = data_center_client.upload_data_to_google_drive(
            report_path, direct_upload=True, progress_callback=report_upload_progress
        )
    except Exception as error:
        ctx.comment(f"QC CSV upload failed; saved locally at {report_path}: {error}")
    else:
        ctx.comment(
            "QC CSV uploaded successfully."
            if uploaded
            else f"QC CSV upload not confirmed; saved locally at {report_path}"
        )
    finally:
        state.stage = previous_stage


def run(ctx: ProtocolContext) -> None:
    """Upload completed live reports and archive QC failures; never upload analysis."""
    global _ACTIVE_QC_TRACE
    state = _QCFailureContext()
    previous_trace = _ACTIVE_QC_TRACE
    if ctx.is_simulating():
        _ACTIVE_QC_TRACE = None
        try:
            _run_qc(ctx, state)
        finally:
            _ACTIVE_QC_TRACE = previous_trace
        return
    _ACTIVE_QC_TRACE = _QCTrace()
    try:
        _qc_capture_identity()
        try:
            failed_items = _run_qc(ctx, state)
        except Exception as error:
            _qc_block_remaining_tests(state.stage)
            _archive_failure_log(ctx, state, error)
            raise
        _upload_formal_report(ctx, state)
        if failed_items:
            _archive_failure_log(ctx, state)
            # Expected QC failure is outside the runtime catch: archive only once.
            raise RuntimeError("QC failed items: " + ", ".join(failed_items))
    finally:
        _ACTIVE_QC_TRACE = previous_trace
