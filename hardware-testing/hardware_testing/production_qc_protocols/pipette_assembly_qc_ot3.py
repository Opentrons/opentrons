"""Flex QC with one right P1000S A12 liquid reference per tested tip volume."""
import asyncio
from contextlib import ExitStack, contextmanager
from dataclasses import dataclass, field, fields, replace
from datetime import datetime, timezone
import enum
import hashlib
from functools import partial, wraps
from importlib import metadata as package_metadata
import inspect
import json
from math import isfinite, floor
from pathlib import Path
import re
from time import monotonic
import traceback
from uuid import uuid4
from typing import (
    Dict,
    Callable,
    cast,
    List,
    Union,
    Tuple,
    Literal,
    Final,
    Any,
    Optional,
    Iterator,
)
from opentrons.protocol_api import ParameterContext, ProtocolContext, Labware
from opentrons.protocol_api.core.engine.labware import LabwareCore
from opentrons.types import Point
from opentrons.calibration_storage.types import SourceType
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    PipetteOffsetSummary,
)


from opentrons.config.defaults_ot3 import (
    DEFAULT_ACCELERATIONS,
    DEFAULT_MAX_SPEEDS,
    DEFAULT_RUN_CURRENT,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.ot3_calibration import (
    calibrate_pipette,
    EdgeNotFoundError,
    CalibrationStructureNotFoundError,
)
from opentrons.hardware_control.types import (
    TipStateType,
    FailedTipStateCheck,
    InstrumentProbeType,
    SubSystem,
)
from opentrons_hardware.firmware_bindings import ArbitrationId, NodeId, MessageId
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    PushTipPresenceNotification,
    TipStatusQueryRequest,
)
from opentrons_hardware.firmware_bindings.constants import SensorType, SensorId

from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.types import (
    Axis,
    CriticalPoint,
    OT3Mount,
)

from opentrons_shared_data.errors.exceptions import (
    PipetteLiquidNotFoundError,
    StallOrCollisionDetectedError,
)
from opentrons_shared_data.pipette.types import PIPETTE_API_NAMES_MAP


from hardware_testing.data.csv_report import (
    CSVReport,
    CSVSection,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.data.pipette_assembly_report import ProductionAssemblyReport
from hardware_testing import data as data_io
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.liquid_calibration_input import (
    LiquidCalibrationInput,
    log_input_versions,
)

from hardware_testing.drivers import asair_sensor
from hardware_testing.drivers import data_center_client

from hardware_testing.drivers.pressure_fixture import (
    PressureFixtureBase,
    connect_to_fixture,
)

from hardware_testing.drivers.data_center_client import (
    upload_data_to_google_drive,
    upload_failure_log,
)


LOCALIZE = helpers_ot3.get_system_langauge() == "zh-CN"

# ----------- Monkey patches -----------


async def _get_tip_status_patch(self) -> bool:  # noqa: ANN001
    """Get the tip status for the 96 channel."""
    can_messenger = cast(OT3Controller, self._backend)._messenger
    node: NodeId = NodeId.pipette_left
    event = asyncio.Event()
    value = 0

    def _listener(message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
        nonlocal value
        try:
            originator = NodeId(arbitration_id.parts.originating_node_id)
            if message.message_id == MessageId.error_message:
                raise RuntimeError(str(message))
            assert originator == node
            assert message.message_id == MessageId.tip_presence_notification
        except (RuntimeError, AssertionError, ValueError):
            pass
        else:
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
    finally:
        can_messenger.remove_listener(_listener)
    result = bool(value)
    return result


async def _calibrate_pipette_patch(
    self, mount: OT3Mount, probe: InstrumentProbeType  # noqa: ANN001
) -> Point:
    try:
        with _qc_step("calibration.probe", mount=mount, probe=probe, slot=5):
            offset = await calibrate_pipette(self, mount, slot=5, probe=probe)  # type: ignore[arg-type]
    except CalibrationStructureNotFoundError as e:
        if not self.is_simulator:
            raise e
        offset = Point(x=0, y=0, z=0)
    except EdgeNotFoundError:
        if not self.is_simulator:
            raise
        offset = Point(x=0, y=0, z=0)
    except StallOrCollisionDetectedError:
        # calibrate_pipette() restores the saved offset for its expected
        # calibration errors, but not for a firmware collision response. Keep
        # the probe attached and let the final retract move it clear; homing
        # the plunger here would re-enter the pressure-protected path.
        await self.reset_instrument_offset(mount, to_default=False)
        raise
    finally:
        await self.retract(mount)
    return offset


# ----------- END Monkey patches -----------


metadata = {"protocolName": "pipette assembly production qc"}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


DEFAULT_SLOT_TIP_RACK_1000 = 7
DEFAULT_SLOT_TIP_RACK_200 = 4
DEFAULT_SLOT_TIP_RACK_50 = 1

DEFAULT_SLOT_FIXTURE = 3
DEFAULT_SLOT_RESERVOIR = 8
DEFAULT_SLOT_LIQUID_PROBE = 2
DEFAULT_SLOT_TRASH = 12
# OT-3 helper slot numbering maps slot 2 to deck address D2.  The barcode
# scanner position is the top-left (leftmost) edge of that slot.
BARCODE_SCAN_SLOT_D2 = 2

PIPETTE_TYPES = {
    "flex_1channel_50": (1, 50),
    "flex_8channel_50": (8, 50),
    "flex_1channel_1000": (1, 1000),
    "flex_8channel_1000": (8, 1000),
}

# Fallback Labware Offsets in mm, used only when this run has no selected offset.
# Labware Position Check replaces these values; positive Z is up.
DEFAULT_TIP_RACK_OFFSET = Point(z=2.0)
DEFAULT_RESERVOIR_OFFSET = Point(z=2.0)
DEFAULT_LIQUID_PROBE_OFFSET = Point(z=3.0)
DEFAULT_FIXTURE_OFFSET = Point()
# The production fixture's calibrated A1 target is 92 mm above the slot. The
# loaded 1000 uL tip-rack definition has its well top at 99 mm, so retain the
# labware's LPC transform and move 7 mm below that top.
PRESSURE_FIXTURE_PICKUP_BELOW_LABWARE_TOP_MM: Final = 7.0

PROBING_DECK_PRECISION_MM = 1.0

TRASH_HEIGHT_MM: Final = 45
LEAK_HOVER_ABOVE_LIQUID_MM: Final = 50
TRAILING_AIR_GAP_DROPLETS_UL: Final = 0.5

# FIXME: reduce this spec after dial indicator is implemented
LIQUID_PROBE_ERROR_THRESHOLD_PRECISION_MM = 0.4
LIQUID_PROBE_ERROR_THRESHOLD_ACCURACY_MM = 1.5
# The pressure sensor reports pressure relative to its zero point.  Use the
# same threshold as the firmware liquid-sense defaults, but compare every
# sample with the local open-air baseline so this protocol is self-contained.
LIQUID_PROBE_PRESSURE_THRESHOLD_PA = 15.0
LIQUID_PROBE_Z_STEP_MM = 0.1
# Allow motor readback quantization at the upper start, not at the cup bottom.
LIQUID_PROBE_START_HEIGHT_TOLERANCE_MM = 0.01
LIQUID_PROBE_PRESSURE_SAMPLES_PER_STEP = 3
LIQUID_PROBE_BASELINE_SETTLE_SECONDS = 0.5
LIQUID_PROBE_BASELINE_MAX_ATTEMPTS = 10
LIQUID_PROBE_BASELINE_STABILITY_PA = 3.0
LIQUID_PROBE_CONFIRM_DELAY_SECONDS = 0.05
# Match the default continuous liquid-probe ratio: 15 mm/s plunger motion for
# 5 mm/s Z motion, i.e. 0.3 mm of plunger travel per 0.1 mm Z step.
LIQUID_PROBE_PLUNGER_STEP_MM = 0.3
LIQUID_PROBE_PLUNGER_SPEED_MM_PER_S = 15.0
REFERENCE_MOUNT = OT3Mount.RIGHT
REFERENCE_PIPETTE_TYPE = "flex_1channel_1000"
LIQUID_SEARCH_ABOVE_TOP_MM = 5.0
LIQUID_SEARCH_BELOW_TOP_MM = 10.0
LIQUID_BOTTOM_CLEARANCE_MM = 2.0


class _ReferenceProbeError(RuntimeError):
    """The right pipette could not establish a usable liquid surface."""


SAFE_HEIGHT_TRAVEL = 10
SAFE_HEIGHT_CALIBRATE = 0

ENCODER_ALIGNMENT_THRESHOLD_HOME_MM = 0.005
ENCODER_ALIGNMENT_THRESHOLD_MM = 0.1
COLUMNS = "ABCDEFGH"
PRESSURE_DATA_HEADER = ["PHASE", "CH1", "CH2", "CH3", "CH4", "CH5", "CH6", "CH7", "CH8"]

MULTI_CHANNEL_1_OFFSET = Point(y=9 * 7 * 0.5)

# NOTE: there is a ton of pressure data, so we want it on the bottom of the CSV
#       so here we cache these readings, and append them to the CSV in the end
PRESSURE_DATA_CACHE: List[Any] = []
FINAL_TEST_FAIL_INFOR: List[str] = []

STALL_THRESHOLD = 0.25
MOTOR_MM_PER_REV = 3
ENCODER_TICKS_PER_REV = 1000
# there is 4 pulses per tick
PULSE_PER_MM = (4 * ENCODER_TICKS_PER_REV) / MOTOR_MM_PER_REV


class PressureEvent(enum.Enum):
    """Pressure Event."""

    PRE = "pre"
    INSERT = "insert"
    ASPIRATE_P50 = "holding"
    ASPIRATE_P1000 = "holding"
    DISPENSE = "dispensed"
    POST = "post"


@dataclass
class PressureEventConfig:
    """PressureEventConfig."""

    min: float
    max: float
    stability_delay: float
    stability_threshold: float
    sample_count: int
    sample_delay: float


class QCErrorCode(enum.Enum):
    """Stable machine-readable codes for QC failure explanations."""

    TEST_FAILED = "QC_TEST_FAILED"
    PRESSURE_STABILITY_OUT_OF_RANGE = "PRESSURE_STABILITY_OUT_OF_RANGE"
    PRESSURE_VALUE_OUT_OF_RANGE = "PRESSURE_VALUE_OUT_OF_RANGE"
    PRESSURE_DELTA_OUT_OF_RANGE = "PRESSURE_DELTA_OUT_OF_RANGE"
    ENVIRONMENT_TEMPERATURE_OUT_OF_RANGE = "ENVIRONMENT_TEMPERATURE_OUT_OF_RANGE"
    ENVIRONMENT_HUMIDITY_OUT_OF_RANGE = "ENVIRONMENT_HUMIDITY_OUT_OF_RANGE"
    CAPACITIVE_VALUE_OUT_OF_RANGE = "CAPACITIVE_VALUE_OUT_OF_RANGE"
    CAPACITIVE_CALIBRATION_FAILED = "CAPACITIVE_CALIBRATION_FAILED"
    CAPACITIVE_REPEATABILITY_FAILED = "CAPACITIVE_REPEATABILITY_FAILED"
    TIP_PICKUP_OUT_OF_RANGE = "TIP_PICKUP_OUT_OF_RANGE"
    TIP_DROP_OUT_OF_RANGE = "TIP_DROP_OUT_OF_RANGE"
    ENCODER_ALIGNMENT_FAILED = "ENCODER_ALIGNMENT_FAILED"
    ENCODER_STALL = "ENCODER_STALL"
    LIQUID_SURFACE_NOT_FOUND = "LIQUID_SURFACE_NOT_FOUND"
    LIQUID_SURFACE_INVALID_READING = "LIQUID_SURFACE_INVALID_READING"
    LIQUID_PROBE_FAILURE = "LIQUID_PROBE_FAILURE"
    LIQUID_PROBE_PRECISION_OUT_OF_RANGE = "LIQUID_PROBE_PRECISION_OUT_OF_RANGE"
    LIQUID_PROBE_ACCURACY_OUT_OF_RANGE = "LIQUID_PROBE_ACCURACY_OUT_OF_RANGE"
    CURRENT_SPEED_ALIGNMENT_FAILED = "CURRENT_SPEED_ALIGNMENT_FAILED"
    CURRENT_SPEED_STALL = "CURRENT_SPEED_STALL"
    LIQUID_LEAK_DETECTED = "LIQUID_LEAK_DETECTED"
    PLUNGER_POSITION_INCORRECT = "PLUNGER_POSITION_INCORRECT"


PRESSURE_FIXTURE_ASPIRATE_VOLUME = {50: 11.0, 1000: 12.0}
PRESSURE_FIXTURE_INSERT_DEPTH = {50: 30.0, 1000: 30.0}

PRESSURE_ASPIRATE_DELTA_SPEC = {
    1: {
        50: {"delta": 1350.0, "margin": 0.96},  # absolute value  # percent of delta
        1000: {"delta": 1000.0, "margin": 0.95},  # absolute value  # percent of delta
    },
    8: {
        50: {"delta": 4000.0, "margin": 0.99},  # absolute value  # percent of delta
        1000: {"delta": 4000.0, "margin": 0.99},  # absolute value  # percent of delta
    },
}

DEFAULT_PRESSURE_SAMPLE_DELAY = 0.25
DEFAULT_PRESSURE_SAMPLE_COUNT = 10
PRESSURE_REPORT_BATCH_SIZE = 20
# FIXME: reduce once firmware latency is reduced
DEFAULT_STABILIZE_SECONDS = 1
# NOTE: retain at least one minute of data during the aspirated pressure hold.
# but we want to keep the number of samples constant between test runs,
# so that is why we don't specify a sample duration (b/c frequency is unpredictable)
DEFAULT_PRESSURE_SAMPLE_COUNT_DURING_ASPIRATE = int(
    (1 * 60) / DEFAULT_PRESSURE_SAMPLE_DELAY
)
PRESSURE_NONE = PressureEventConfig(
    min=-8000.0,
    max=8000.0,
    stability_delay=DEFAULT_STABILIZE_SECONDS,
    stability_threshold=2.0,
    sample_count=DEFAULT_PRESSURE_SAMPLE_COUNT,
    sample_delay=DEFAULT_PRESSURE_SAMPLE_DELAY,
)
PRESSURE_INSERTED = PressureEventConfig(
    min=-8000.0,
    max=8000.0,
    stability_delay=DEFAULT_STABILIZE_SECONDS,
    stability_threshold=50.0,
    sample_count=DEFAULT_PRESSURE_SAMPLE_COUNT,
    sample_delay=DEFAULT_PRESSURE_SAMPLE_DELAY,
)
PRESSURE_ASPIRATED_P50 = PressureEventConfig(
    min=-8000.0,
    max=8000.0,
    stability_delay=DEFAULT_STABILIZE_SECONDS,
    stability_threshold=600.0,
    sample_count=DEFAULT_PRESSURE_SAMPLE_COUNT_DURING_ASPIRATE,
    sample_delay=DEFAULT_PRESSURE_SAMPLE_DELAY,
)
PRESSURE_ASPIRATED_P1000 = PressureEventConfig(
    min=-8000.0,
    max=8000.0,
    stability_delay=DEFAULT_STABILIZE_SECONDS,
    stability_threshold=600.0,
    sample_count=DEFAULT_PRESSURE_SAMPLE_COUNT_DURING_ASPIRATE,
    sample_delay=DEFAULT_PRESSURE_SAMPLE_DELAY,
)
PRESSURE_FIXTURE_EVENT_CONFIGS: Dict[PressureEvent, PressureEventConfig] = {
    PressureEvent.PRE: PRESSURE_NONE,
    PressureEvent.INSERT: PRESSURE_INSERTED,
    PressureEvent.ASPIRATE_P50: PRESSURE_ASPIRATED_P50,
    PressureEvent.ASPIRATE_P1000: PRESSURE_ASPIRATED_P1000,
    PressureEvent.DISPENSE: PRESSURE_INSERTED,
    PressureEvent.POST: PRESSURE_NONE,
}

# THRESHOLDS: environment sensor
TEMP_THRESH = [10, 40]
HUMIDITY_THRESH = [10, 90]

# THRESHOLDS: capacitive sensor
CAP_THRESH_OPEN_AIR = {
    1: [4.0, 8.0],
    8: [10.0, 18.0],
}
CAP_THRESH_PROBE = {
    1: [4.0, 8.0],
    8: [10.0, 18.0],
}
CAP_THRESH_SQUARE = {
    1: [8.0, 15.0],
    8: [18.0, 26.0],
}

# THRESHOLDS: air-pressure sensor
PRESSURE_ASPIRATE_VOL = {1: {50: 10.0, 1000: 20.0}, 8: {50: 10.0, 1000: 20.0}}
PRESSURE_THRESH_OPEN_AIR = {
    1: {50: [-25, 25], 1000: [-25, 25]},
    8: {50: [-25, 25], 1000: [-25, 25]},
}
PRESSURE_THRESH_SEALED = {
    1: {50: [-100, 100], 1000: [-100, 100]},
    8: {50: [-100, 100], 1000: [-100, 100]},
}
PRESSURE_THRESH_COMPRESS = {
    1: {50: [-3250, -1050], 1000: [-1550, -450]},
    8: {50: [-4300, -2100], 1000: [-1900, -500]},
}
PRESSURE_THRESH_current = {
    1: {50: {1: 0.2}, 1000: {1: 0.2}},
    8: {50: {1: 0.2, 8: 0.55}, 1000: {1: 0.2, 8: 0.55}},
}

PRESSURE_FIXTURE_TIP_VOLUME = 50  # always 50ul

TRASH_OFFSETS = [
    Point(x=(64 * -0.75)),
    Point(x=(64 * -0.5)),
    Point(x=(64 * -0.25)),
    Point(x=(64 * 0)),
    Point(x=(64 * 0.25)),
    Point(x=(64 * 0.5)),
    Point(x=(64 * 0.75)),
]

LOCATION_A1_LEFT = Point(x=14.4, y=74.5, z=100)
LOCATION_A1_RIGHT = LOCATION_A1_LEFT._replace(x=128 - LOCATION_A1_LEFT.x)

_available_tips: Dict[int, List[str]] = {}
_available_reference_tips: Dict[int, List[str]] = {}
_available_tips_fixture: Dict[int, List[str]] = {}


class TestSection(enum.Enum):
    """Test Section."""

    LIQUID = "LIQUID"
    FIXTURE = "FIXTURE"
    DIAGNOSTICS = "DIAGNOSTICS"
    PLUNGER = "PLUNGER"
    TIP_SENSOR = "TIP-SENSOR"
    LIQUID_PROBE = "LIQUID-PROBE"
    ENCODER_CLEAN = "ENCODER-CLEAN"


@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]
    fixture_side: Literal["left", "right"]
    aspirate_sample_count: int
    slot_tip_rack_1000: int
    slot_tip_rack_200: int
    slot_tip_rack_50: int
    slot_reservoir: int
    slot_plate: int
    slot_fixture: int
    slot_trash: int
    num_trials: int
    droplet_wait_seconds: int
    pipette_channels: int
    pipette_volume: int
    mount: OT3Mount
    trash_loc_counter: int
    pressure_fixture: Optional[PressureFixtureBase] = None
    env_sensor: Optional[asair_sensor.AsairSensorBase] = None


@dataclass
class _QCFailureContext:
    """Track the live run even before a CSV report or device ID is available."""

    parameters: Dict[str, Any] = field(default_factory=dict)
    report_mode: str = "initialization"
    stage: str = "initialization"
    report: Optional[CSVReport] = None
    config: Optional[TestConfig] = None
    completed_modes: List[str] = field(default_factory=list)
    cleanup_traceback: Optional[str] = None


@dataclass
class LabwareLocations:
    """Test Labware Locations."""

    trash: Optional[Point]
    tip_rack_1000: Optional[Point]
    tip_rack_200: Optional[Point]
    tip_rack_50: Optional[Point]
    reservoir: Optional[Point]
    plate_primary: Optional[Point]
    plate_secondary: Optional[Point]
    fixture: Optional[Point]


LABWARE: Dict[str, Optional[Labware]] = {
    "tip_rack_1000": None,
    "tip_rack_200": None,
    "tip_rack_50": None,
    "reservoir": None,
    "plate": None,
    "plate_secondary": None,
    "fixture": None,
}

IDEAL_LABWARE_LOCATIONS: LabwareLocations = LabwareLocations(
    trash=None,
    tip_rack_1000=None,
    tip_rack_200=None,
    tip_rack_50=None,
    reservoir=None,
    plate_primary=None,
    plate_secondary=None,
    fixture=None,
)
CALIBRATED_LABWARE_LOCATIONS: LabwareLocations = LabwareLocations(
    trash=None,
    tip_rack_1000=None,
    tip_rack_200=None,
    tip_rack_50=None,
    reservoir=None,
    plate_primary=None,
    plate_secondary=None,
    fixture=None,
)


# --------------- Helpers -------------


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
        return result


def _qc_traced(function: Callable) -> Callable:
    """Add nested test context without changing the function's arguments or result."""
    signature = inspect.signature(function)

    @wraps(function)
    def traced(*args: Any, **kwargs: Any) -> Any:
        if _ACTIVE_QC_TRACE is None:
            return function(*args, **kwargs)
        arguments = signature.bind(*args, **kwargs).arguments
        details = {
            key: value
            for key, value in arguments.items()
            if key not in ("api", "ctx", "report", "cfg", "fixture", "on_failure")
        }
        cfg = arguments.get("cfg")
        if cfg is not None:
            details["mount"] = cfg.mount
        with _qc_step(function.__name__, **details):
            return function(*args, **kwargs)

    return traced


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
        if not trace.identity:
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
            trace.identity = {
                "protocol": _qc_protocol_identity(),
                "helpers": _qc_file_identity(helpers_ot3.__file__),
                "upload_client": _qc_file_identity(data_center_client.__file__),
                "versions": versions,
            }
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


def _qc_capture_labware() -> None:
    """Capture the selected offsets and already-computed movement targets."""
    trace = _ACTIVE_QC_TRACE
    if trace is None:
        return
    trace.labware["targets_mm"] = {
        item.name: _qc_json(getattr(CALIBRATED_LABWARE_LOCATIONS, item.name))
        for item in fields(CALIBRATED_LABWARE_LOCATIONS)
    }
    for name, labware in LABWARE.items():
        if labware is None:
            continue
        try:
            core = cast(LabwareCore, labware._core)
            view = core._engine_client.state.labware
            offset = view.get_labware_offset_vector(core.labware_id)
            trace.labware[name] = {
                "uri": labware.uri,
                "slot": str(labware.parent),
                "offset_id": view.get(core.labware_id).offsetId,
                "offset_mm": {axis: getattr(offset, axis) for axis in "xyz"},
            }
        except Exception as error:
            trace.labware[name] = {"unavailable_reason": str(error)}


def _qc_execute_test(
    name: str, function: Callable, report: CSVReport, *args: Any
) -> None:
    """Distinguish a completed judgment from a skipped or interrupted test."""
    trace = _ACTIVE_QC_TRACE
    if trace is None:
        function(*args)
        return
    status = trace.tests.setdefault(name, {})
    status.update(status="running", started_at=datetime.now(timezone.utc).isoformat())
    trace.last_failure = None
    trace.failure_exception = None
    try:
        with _qc_step(name):
            function(*args)
    except BaseException as error:
        status.update(
            status="execution_error", error=f"{type(error).__name__}: {error}"
        )
        raise
    else:
        result = report[name].result_passed if name != "current_speed" else None
        if name == "current_speed":
            result = not bool(report.get_failed_results())
        status["status"] = (
            "passed" if result is True else "failed" if result is False else "unknown"
        )
        if trace.last_failure is not None:
            # Tests may intentionally catch failed tip-state checks or stalls.
            # An exception that was handled is not an uncaught runtime failure.
            status["last_handled_exception"] = trace.last_failure
            trace.last_failure = None
            trace.failure_exception = None
    finally:
        status["finished_at"] = datetime.now(timezone.utc).isoformat()


def _qc_initialize_tests(
    args: Dict[str, Any], tests: Dict[TestSection, Callable], run_current_speed: bool
) -> None:
    """Initialize explicit states before preflight or metadata can fail."""
    trace = _ACTIVE_QC_TRACE
    if trace is not None:
        trace.identity["selected_pipette_type"] = args.get("pipette_type")
        trace.tests = {
            section.value: {
                "status": "not_started"
                if section in tests
                else "skipped_by_configuration"
            }
            for section, _ in TESTS
        }
        trace.tests["current_speed"] = {
            "status": "not_started" if run_current_speed else "skipped_by_configuration"
        }


def _qc_mark_blocked_tests(report_mode: str) -> None:
    """Mark tests blocked by the current/speed gate before writing its log."""
    if report_mode == "current_speed" and _ACTIVE_QC_TRACE is not None:
        for test_state in _ACTIVE_QC_TRACE.tests.values():
            if test_state["status"] == "not_started":
                test_state["status"] = "not_run_due_to_previous_failure"


def _bool_to_pass_fail(result: bool) -> str:
    return "PASS" if result else "FAIL"


def _with_error_code(code: QCErrorCode, reason: str) -> str:
    """Localize the displayed category while preserving internal error codes."""
    chinese_labels = {
        QCErrorCode.TEST_FAILED: "测试不通过",
        QCErrorCode.PRESSURE_STABILITY_OUT_OF_RANGE: "气压稳定性超出范围",
        QCErrorCode.PRESSURE_VALUE_OUT_OF_RANGE: "气压值超出范围",
        QCErrorCode.PRESSURE_DELTA_OUT_OF_RANGE: "气压变化量超出范围",
        QCErrorCode.ENVIRONMENT_TEMPERATURE_OUT_OF_RANGE: "温度超出范围",
        QCErrorCode.ENVIRONMENT_HUMIDITY_OUT_OF_RANGE: "湿度超出范围",
        QCErrorCode.CAPACITIVE_VALUE_OUT_OF_RANGE: "电容值超出范围",
        QCErrorCode.CAPACITIVE_CALIBRATION_FAILED: "电容探针校准失败",
        QCErrorCode.CAPACITIVE_REPEATABILITY_FAILED: "电容探针校准重复性不通过",
        QCErrorCode.TIP_PICKUP_OUT_OF_RANGE: "取头检测不通过",
        QCErrorCode.TIP_DROP_OUT_OF_RANGE: "退头检测不通过",
        QCErrorCode.ENCODER_ALIGNMENT_FAILED: "电机与编码器位置偏差超限",
        QCErrorCode.ENCODER_STALL: "编码器测试检测到堵转或碰撞",
        QCErrorCode.LIQUID_SURFACE_NOT_FOUND: "未找到液面",
        QCErrorCode.LIQUID_SURFACE_INVALID_READING: "液面高度读数无效",
        QCErrorCode.LIQUID_PROBE_FAILURE: "液面探测失败",
        QCErrorCode.LIQUID_PROBE_PRECISION_OUT_OF_RANGE: "液面探测精度超限",
        QCErrorCode.LIQUID_PROBE_ACCURACY_OUT_OF_RANGE: "液面探测准确度偏差超限",
        QCErrorCode.CURRENT_SPEED_ALIGNMENT_FAILED: "电流速度测试位置偏差超限",
        QCErrorCode.CURRENT_SPEED_STALL: "电流速度测试检测到堵转或碰撞",
        QCErrorCode.LIQUID_LEAK_DETECTED: "检测到漏液",
        QCErrorCode.PLUNGER_POSITION_INCORRECT: "柱塞位置不正确",
    }
    label = chinese_labels[code] if LOCALIZE else code.value
    return f"[{label}] {reason}"


def _remember_failure(
    report: CSVReport,
    section: str,
    tag: str,
    reason: str,
    ind: int = -1,
    error_code: Optional[QCErrorCode] = None,
) -> None:
    line = report[section][tag]
    if isinstance(line, CSVLineRepeating):
        assert ind >= 0
        line = line[ind]
    line.add_failure_reason(
        _with_error_code(error_code, reason) if error_code is not None else reason
    )


def _measurement_range_failure(
    name: str, value: float, lower: float, upper: float, unit: str = ""
) -> str:
    return (
        f"{name}：实测 {value:.6g} {unit}；要求 {lower:g} <= 数值 <= {upper:g} {unit}"
        if LOCALIZE
        else f"{name}: measured {value:.6g} {unit}; "
        f"required {lower:g} <= value <= {upper:g} {unit}"
    ).strip()


def _alignment_failure(
    name: str,
    motor: Optional[float],
    encoder: Optional[float],
    threshold: float,
    inclusive: bool = False,
) -> str:
    if motor is None or encoder is None:
        return name + (
            "：无法取得完整的位置读数" if LOCALIZE else ": position readings unavailable"
        )
    operator = "<=" if inclusive else "<"
    return (
        f"{name}：电机 {motor:.6g} mm，编码器 {encoder:.6g} mm，"
        f"绝对偏差 {abs(motor - encoder):.6g} mm；要求 {operator} {threshold:g} mm"
        if LOCALIZE
        else f"{name}: motor {motor:.6g} mm, encoder {encoder:.6g} mm, "
        f"absolute error {abs(motor - encoder):.6g} mm; required {operator} {threshold:g} mm"
    )


def _describe_failed_line(line: CSVLine, cfg: TestConfig) -> str:
    """Explain graded values using the same limits as the test, not a diagnosis."""
    tag, data = line.tag, line.data
    channel = "1" if tag.endswith("S0") else "8"
    channel_label = f"通道 {channel}" if LOCALIZE else f"channel {channel}"
    for prefix, zh, en, limits, unit in (
        ("celsius-", "温度", "Temperature", TEMP_THRESH, "°C"),
        ("humidity-", "湿度", "Humidity", HUMIDITY_THRESH, "%RH"),
    ):
        if tag.startswith(prefix):
            return _with_error_code(
                (
                    QCErrorCode.ENVIRONMENT_TEMPERATURE_OUT_OF_RANGE
                    if prefix == "celsius-"
                    else QCErrorCode.ENVIRONMENT_HUMIDITY_OUT_OF_RANGE
                ),
                _measurement_range_failure(
                    f"{zh if LOCALIZE else en} / {channel_label}",
                    data[1],
                    limits[0],
                    limits[1],
                    unit,
                ),
            )
    for prefix, zh, en, cap_limits in (
        ("capacitive-open-air-", "空气中电容", "Open-air capacitance", CAP_THRESH_OPEN_AIR),
        ("capacitive-probe-", "安装探针后的电容", "Probe capacitance", CAP_THRESH_PROBE),
        (
            "capacitive-square-",
            "校准方块处电容",
            "Calibration-square capacitance",
            CAP_THRESH_SQUARE,
        ),
    ):
        if tag.startswith(prefix) and not tag.startswith("capacitive-probe-slot-"):
            return _with_error_code(
                QCErrorCode.CAPACITIVE_VALUE_OUT_OF_RANGE,
                _measurement_range_failure(
                    f"{zh if LOCALIZE else en} / {channel_label}",
                    data[0],
                    cap_limits[cfg.pipette_channels][0],
                    cap_limits[cfg.pipette_channels][1],
                    "pF",
                ),
            )
    for prefix, zh, en, pressure_limits in (
        ("pressure-open-air-", "空气中气压", "Open-air pressure", PRESSURE_THRESH_OPEN_AIR),
        ("pressure-sealed-", "封堵吸头气压", "Sealed-tip pressure", PRESSURE_THRESH_SEALED),
        (
            "pressure-compressed-",
            "吸液后气压",
            "Aspirated pressure",
            PRESSURE_THRESH_COMPRESS,
        ),
    ):
        if tag.startswith(prefix):
            return _with_error_code(
                QCErrorCode.PRESSURE_VALUE_OUT_OF_RANGE,
                _measurement_range_failure(
                    f"{zh if LOCALIZE else en} / {channel_label}",
                    data[0],
                    pressure_limits[cfg.pipette_channels][cfg.pipette_volume][0],
                    pressure_limits[cfg.pipette_channels][cfg.pipette_volume][1],
                    "Pa",
                ),
            )
    if tag in ("encoder-home", "encoder-move"):
        homing = tag == "encoder-home"
        name = ("编码器归零" if homing else "编码器移动") if LOCALIZE else tag
        return _with_error_code(
            QCErrorCode.ENCODER_ALIGNMENT_FAILED,
            _alignment_failure(
                name,
                data[0],
                data[1],
                ENCODER_ALIGNMENT_THRESHOLD_HOME_MM
                if homing
                else ENCODER_ALIGNMENT_THRESHOLD_MM,
                inclusive=True,
            ),
        )
    if tag.startswith("liquid-probe-") and tag.endswith(("-precision", "-accuracy")):
        parts = tag.split("-")
        channel = "1" if parts[4] == "primary" else "8"
        precision = tag.endswith("-precision")
        metric = (
            ("精度" if precision else "准确度绝对偏差")
            if LOCALIZE
            else ("precision" if precision else "absolute accuracy error")
        )
        label = (
            f"液面探测 / {parts[2]} uL / 通道 {channel} / {metric}"
            if LOCALIZE
            else f"Liquid probe / {parts[2]} uL / channel {channel} / {metric}"
        )
        if data[0] is None:
            return _with_error_code(
                (
                    QCErrorCode.LIQUID_PROBE_PRECISION_OUT_OF_RANGE
                    if precision
                    else QCErrorCode.LIQUID_PROBE_ACCURACY_OUT_OF_RANGE
                ),
                label + ("：探测未完成，无法计算" if LOCALIZE else ": incomplete measurements"),
            )
        threshold = (
            LIQUID_PROBE_ERROR_THRESHOLD_PRECISION_MM
            if precision
            else LIQUID_PROBE_ERROR_THRESHOLD_ACCURACY_MM
        )
        return _with_error_code(
            (
                QCErrorCode.LIQUID_PROBE_PRECISION_OUT_OF_RANGE
                if precision
                else QCErrorCode.LIQUID_PROBE_ACCURACY_OUT_OF_RANGE
            ),
            (
                f"{label}：实测 {abs(data[0]):.6g} mm；要求 < {threshold:g} mm"
                if LOCALIZE
                else f"{label}: measured {abs(data[0]):.6g} mm; required < {threshold:g} mm"
            ),
        )
    if tag.startswith("droplets-"):
        seconds = tag.split("-")[1]
        return _with_error_code(
            QCErrorCode.LIQUID_LEAK_DETECTED,
            (
                f"漏液检查：吸液保持 {seconds} 秒后，操作员判定漏液"
                if LOCALIZE
                else f"Leak check: operator reported droplets after holding for {seconds} s"
            ),
        )
    if tag in ("plunger-blow-out", "plunger-drop-tip"):
        name = "吹出位置" if tag.endswith("blow-out") else "退吸头位置"
        return _with_error_code(
            QCErrorCode.PLUNGER_POSITION_INCORRECT,
            (
                f"柱塞{name}：操作员判定位置不正确"
                if LOCALIZE
                else f"{tag}: operator reported an incorrect position"
            ),
        )
    return _with_error_code(
        QCErrorCode.TEST_FAILED,
        "测试判定不通过，未提供详细原因" if LOCALIZE else "test failed; no detailed reason available",
    )


def _failed_qc_items(report: CSVReport) -> List[str]:
    """Include barcode/metadata failures alongside graded test failures."""
    metadata_failures = [
        f"META_DATA/{line.tag}"
        for line in report["META_DATA"].lines
        if line.result_passed is False
    ]
    return list(dict.fromkeys(metadata_failures + report.get_failed_results()))


def _qc_failure_details(report: CSVReport, cfg: TestConfig) -> List[str]:
    """Summarize existing test and metadata failures without changing the CSV."""
    failed = _failed_qc_items(report)
    summaries = {
        "diagnostic-environment": ("celsius-", "humidity-"),
        "diagnostic-encoder": ("encoder-",),
        "diagnostic-capacitance": ("capacitive-",),
        "diagnostic-pressure": ("pressure-",),
    }
    details: List[str] = []
    for item in failed:
        section, tag = item.split("/", 1)
        if section == "META_DATA":
            data = cast(CSVLine, report[section][tag]).data
            if tag == "test_device_id":
                details.append(
                    f"[QC_BARCODE_MISMATCH] {item}: device ID={data[0]!r}; "
                    f"scanned barcode={data[1]!r}"
                )
            else:
                details.append(f"[QC_METADATA_FAILED] {item}: {data!r}")
            continue
        prefixes = summaries.get(tag, ())
        if any(
            other.startswith(f"{section}/{prefix}")
            for prefix in prefixes
            for other in failed
        ):
            continue
        if tag.startswith("liquid-probe-"):
            if tag.endswith(("-precision", "-accuracy")):
                parent = cast(CSVLine, report[section][tag.rsplit("-", 1)[0]])
                if parent.failure_reasons:
                    continue
            elif tag.endswith("-probe"):
                parent = cast(CSVLine, report[section][tag])
                if not parent.failure_reasons and any(
                    f"{item}-{metric}" in failed for metric in ("precision", "accuracy")
                ):
                    continue
        entry = report[section][tag]
        lines = (
            [entry[i] for i in range(len(entry))]
            if isinstance(entry, CSVLineRepeating)
            else [entry]
        )
        for line in lines:
            if line.result_passed is not False:
                continue
            reasons = line.failure_reasons or [_describe_failed_line(line, cfg)]
            for reason in reasons:
                if not reason:
                    reason = item + (
                        "：测试判定不通过，未提供详细原因"
                        if LOCALIZE
                        else ": failed; no detailed reason available"
                    )
                if reason not in details:
                    details.append(reason)
    return details


def _qc_failure_message(details: List[str], assembly_skipped: bool) -> str:
    """Keep the final error readable; full explanations remain in run comments."""
    title = (
        f"QC 不通过：共 {len(details)} 项失败。"
        if LOCALIZE
        else f"QC failed: {len(details)} failed items."
    )
    if assembly_skipped:
        title += (
            " 电流/速度测试不通过，装配诊断未执行。"
            if LOCALIZE
            else " Current/speed QC failed; assembly diagnostics skipped."
        )
    # Avoid a huge error dialog when many current/speed combinations fail.
    shown = details[:8]
    lines = [title] + [
        f"{i}. {detail[:400]}{'…' if len(detail) > 400 else ''}"
        for i, detail in enumerate(shown, 1)
    ]
    if len(details) > len(shown) or any(len(detail) > 400 for detail in shown):
        lines.append(
            "完整失败原因请查看运行日志。" if LOCALIZE else "See the run log for all failure details."
        )
    return "\n".join(lines)


def get_trash_nominal(cfg: TestConfig) -> Point:
    """Get nominal trash position."""
    trash_nominal = helpers_ot3.get_slot_calibration_square_position_ot3(
        cfg.slot_trash
    ) + Point(z=TRASH_HEIGHT_MM)
    return trash_nominal


def _tip_name_to_xy_offset(tip: str) -> Point:
    tip_rack_rows = ["A", "B", "C", "D", "E", "F", "G", "H"]
    tip_row = tip_rack_rows.index(tip[0])
    tip_column = int(tip[1:]) - 1
    return Point(x=tip_column * 9, y=tip_row * -9)


@_qc_traced
def _pick_up_tip(
    api: SyncHardwareAPI,
    mount: OT3Mount,
    tip: str,
    actual: Point,
    tip_volume: Optional[float] = None,
    movez: bool = False,
) -> None:
    tip_offset = _tip_name_to_xy_offset(tip)
    tip_pos = actual + tip_offset
    _qc_observe(
        f"tip_target:{mount.name}",
        mount=mount,
        well=tip,
        tip_volume_ul=tip_volume,
        target_mm=tip_pos,
    )
    _move_safe(api, mount, tip_pos)
    if not tip_volume:
        pip = api.hardware_pipettes[mount.to_mount()]
        assert pip
        tip_volume = pip.working_volume
    assert tip_volume
    tip_length = helpers_ot3.get_default_tip_length(int(tip_volume))
    try:
        _qc_call(api.pick_up_tip, mount, tip_length=tip_length)
    except Exception:
        # Do not continue with motion or liquid handling when the tip was not
        # confirmed as attached.  Continuing here can move an unprotected
        # nozzle and produce a false-positive QC report.
        prinval = "07-02光电传感器故障: 取针管状态不正确"
        FINAL_TEST_FAIL_INFOR.append(prinval)
        raise
    if movez:
        _qc_call(api.move_rel, mount, Point(z=int(tip_length * 0.2)))


def _pick_up_tip_for_fixture(
    api: SyncHardwareAPI,
    cfg: TestConfig,
    tip_volume: int,
    movez: bool = False,
) -> None:
    assert CALIBRATED_LABWARE_LOCATIONS.fixture
    tip = _available_tips_fixture[tip_volume][0]
    _available_tips_fixture[tip_volume] = _available_tips_fixture[tip_volume][
        cfg.pipette_channels :
    ]
    _pick_up_tip(
        api,
        cfg.mount,
        tip,
        CALIBRATED_LABWARE_LOCATIONS.fixture,
        tip_volume=tip_volume,
        movez=movez,
    )


def _pick_up_tip_for_tip_volume(
    api: SyncHardwareAPI, cfg: TestConfig, tip_volume: int
) -> None:
    tip = _available_tips[tip_volume][0]
    _available_tips[tip_volume] = _available_tips[tip_volume][cfg.pipette_channels :]
    if tip_volume == 1000:
        tip_location = CALIBRATED_LABWARE_LOCATIONS.tip_rack_1000
    elif tip_volume == 200:
        tip_location = CALIBRATED_LABWARE_LOCATIONS.tip_rack_200
    elif tip_volume == 50:
        tip_location = CALIBRATED_LABWARE_LOCATIONS.tip_rack_50
    else:
        raise ValueError(f"unexpected tip volume: {tip_volume}")
    assert tip_location
    _pick_up_tip(
        api,
        cfg.mount,
        tip,
        tip_location,
        tip_volume=tip_volume,
    )


def _apply_default_labware_offset(labware: Labware, default: Point) -> None:
    """Keep the run's selected LPC offset, including an explicit zero offset."""
    core = cast(LabwareCore, labware._core)
    if core._engine_client.state.labware.get(core.labware_id).offsetId is None:
        labware.set_offset(default.x, default.y, default.z)


def _load_labware_locations(cfg: TestConfig, ctx: ProtocolContext) -> None:
    CALIBRATED_LABWARE_LOCATIONS.trash = get_trash_nominal(cfg)
    # Diagnostics pressure checks also require a loaded tip rack.
    if not (
        ctx.params.skip_fixture  # type: ignore[attr-defined]
        and ctx.params.skip_liquid  # type: ignore[attr-defined]
        and ctx.params.skip_liquid_probe  # type: ignore[attr-defined]
        and ctx.params.skip_tip_sensor  # type: ignore[attr-defined]
        and ctx.params.skip_diagnostics  # type: ignore[attr-defined]
    ):
        tiprack_50 = ctx.load_labware(
            "opentrons_flex_96_tiprack_50uL", cfg.slot_tip_rack_50
        )
        tiprack_200 = ctx.load_labware(
            "opentrons_flex_96_tiprack_200uL", cfg.slot_tip_rack_200
        )
        tiprack_1000 = ctx.load_labware(
            "opentrons_flex_96_tiprack_1000uL", cfg.slot_tip_rack_1000
        )
        if not cfg.simulate:
            for tiprack in (tiprack_50, tiprack_200, tiprack_1000):
                _apply_default_labware_offset(tiprack, DEFAULT_TIP_RACK_OFFSET)
        LABWARE["tip_rack_50"] = tiprack_50
        LABWARE["tip_rack_200"] = tiprack_200
        LABWARE["tip_rack_1000"] = tiprack_1000
        CALIBRATED_LABWARE_LOCATIONS.tip_rack_50 = tiprack_50["A1"].top().point
        CALIBRATED_LABWARE_LOCATIONS.tip_rack_200 = tiprack_200["A1"].top().point
        CALIBRATED_LABWARE_LOCATIONS.tip_rack_1000 = tiprack_1000["A1"].top().point
    if not (ctx.params.skip_fixture and ctx.params.skip_liquid):  # type: ignore[attr-defined]
        reservoir = ctx.load_labware("nest_1_reservoir_195ml", cfg.slot_reservoir)
        if not cfg.simulate:
            _apply_default_labware_offset(reservoir, DEFAULT_RESERVOIR_OFFSET)
        LABWARE["reservoir"] = reservoir
        # 2 mm above the bottom but shift over so that we're not directly on the center ridge
        CALIBRATED_LABWARE_LOCATIONS.reservoir = reservoir["A1"].bottom().point + Point(
            x=4.5, z=2
        )
        if cfg.pipette_channels == 8:
            CALIBRATED_LABWARE_LOCATIONS.reservoir = (
                CALIBRATED_LABWARE_LOCATIONS.reservoir + Point(y=9 * 3.5)
            )
    if not ctx.params.skip_liquid_probe:  # type: ignore[attr-defined]
        # Liquid probe fixture is a vial with an led at the bottom to help the user see the liquid better
        plate = ctx.load_labware(
            "liquid_probe_fixture", cfg.slot_plate, namespace="custom_beta", version=1
        )
        if not cfg.simulate:
            _apply_default_labware_offset(plate, DEFAULT_LIQUID_PROBE_OFFSET)
        LABWARE["plate"] = plate
        plate_loc = plate["A1"].top().point
        CALIBRATED_LABWARE_LOCATIONS.plate_primary = plate_loc
        # plate_secondary is for the front probe so offset the pipette
        CALIBRATED_LABWARE_LOCATIONS.plate_secondary = plate_loc + Point(y=9 * 7)
    if not ctx.params.skip_fixture:  # type: ignore[attr-defined]
        # Fixture is an aluminum tip rack glued trash slot frame so tubes can go out the bottom
        # to an external pressure sensor. it's ends up a little shorter than the tip rack but good enough
        # for LPC
        fixture_lw = ctx.load_labware(
            "opentrons_flex_96_tiprack_1000uL", cfg.slot_fixture
        )
        if not cfg.simulate:
            _apply_default_labware_offset(fixture_lw, DEFAULT_FIXTURE_OFFSET)
        LABWARE["fixture"] = fixture_lw

        fixture_loc = fixture_lw["A1"].top().point
        CALIBRATED_LABWARE_LOCATIONS.fixture = fixture_loc


def _drop_tip_in_trash(api: SyncHardwareAPI, cfg: TestConfig) -> None:
    ideal = CALIBRATED_LABWARE_LOCATIONS.trash
    assert ideal
    random_trash_pos = ideal + TRASH_OFFSETS[cfg.trash_loc_counter]
    if cfg.pipette_channels == 8:
        random_trash_pos = random_trash_pos + Point(y=9 * 3.5)
    cfg.trash_loc_counter = (cfg.trash_loc_counter + 1) % len(TRASH_OFFSETS)
    current_pos = _qc_call(api.gantry_position, cfg.mount)
    safe_height = max(random_trash_pos.z, current_pos.z) + SAFE_HEIGHT_TRAVEL
    _qc_call(
        helpers_ot3.move_to_arched_ot3_sync,
        api,
        cfg.mount,
        random_trash_pos,
        safe_height=safe_height,
    )
    _qc_call(api.drop_tip, cfg.mount, home_after=False)


def _move_safe(api: SyncHardwareAPI, mount: OT3Mount, dest: Point) -> None:
    current_pos = _qc_call(api.gantry_position, mount)
    safe_height = max(dest.z, current_pos.z) + SAFE_HEIGHT_TRAVEL
    _qc_call(
        helpers_ot3.move_to_arched_ot3_sync, api, mount, dest, safe_height=safe_height
    )


# --------------- END Helpers -------------

# ----------- TEST FIXTURE -----------
def build_fixture_csv_lines(
    pipette_channels: int,
) -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for event in PressureEvent:
        # stability, accuracy, [maybe delta]
        num_lines = 3 if event.value == "holding" else 2
        lines.append(
            CSVLineRepeating(num_lines, f"pressure-{event.value}", [str, CSVResult])
        )
        for channel in range(pipette_channels):
            # Min max, average
            lines.append(
                CSVLineRepeating(
                    3, f"pressure-{event.value}-channel-{channel+1}", [str, float]
                )
            )
    return lines


@_qc_traced
def _read_pressure_and_check_results(
    ctx: ProtocolContext,
    api: SyncHardwareAPI,
    cfg: TestConfig,
    fixture: PressureFixtureBase,
    tag: PressureEvent,
    section: str,
    report: CSVReport,
    previous: Optional[List[List[float]]] = None,
) -> Tuple[bool, List[List[float]]]:
    pressure_event_config = _pressure_configs(
        getattr(cfg, "aspirate_sample_count", None)
    )[tag]
    ctx.delay(pressure_event_config.stability_delay)
    _samples = []
    first_sample_at = 0.0
    for start in range(
        0, pressure_event_config.sample_count, PRESSURE_REPORT_BATCH_SIZE
    ):
        # Each batch checkpoints the raw readings, including on an exception.
        # CSVLine still timestamps each sample when it is acquired.
        with report.batch_update():
            stop = min(
                start + PRESSURE_REPORT_BATCH_SIZE, pressure_event_config.sample_count
            )
            for i in range(start, stop):
                if i > 0:
                    ctx.delay(pressure_event_config.sample_delay)
                if (
                    tag in (PressureEvent.ASPIRATE_P50, PressureEvent.ASPIRATE_P1000)
                    and i == pressure_event_config.sample_count - 1
                ):
                    # Faster reporting must not shorten the configured hold window.
                    hold_seconds = (
                        pressure_event_config.sample_count
                        * pressure_event_config.sample_delay
                    )
                    remaining = first_sample_at + hold_seconds - monotonic()
                    if remaining > 0:
                        ctx.delay(remaining)
                sample = fixture.read_all_pressure_channel()
                _qc_observe(
                    "fixture_pressure",
                    phase=tag.value,
                    sample_index=i,
                    pressures_pa=sample,
                )
                if len(sample) != 8 or not all(isfinite(p) for p in sample):
                    raise RuntimeError(
                        "Pressure fixture returned invalid channel data."
                    )
                _samples.append(sample)
                if i == 0:
                    first_sample_at = monotonic()
                _sample_rounded = [round(p, 2) for p in sample]
                report("PRESSURE-DATA", f"{tag.value}", _sample_rounded, i)
    with report.batch_update():
        _samples_per_channel = [
            [s[c] for s in _samples] for c in range(cfg.pipette_channels)
        ]
        _average_per_channel = [sum(s) / len(s) for s in _samples_per_channel]
        test_pass_stability = True
        for c in range(cfg.pipette_channels):
            _samples_per_channel[c].sort()
            _c_min = min(_samples_per_channel[c][1:])
            _c_max = max(_samples_per_channel[c][1:])
            report(section, f"pressure-{tag.value}-channel-{c + 1}", ["min", _c_min], 0)
            report(section, f"pressure-{tag.value}-channel-{c + 1}", ["max", _c_max], 1)
            report(
                section,
                f"pressure-{tag.value}-channel-{c + 1}",
                ["average", _average_per_channel[c]],
                2,
            )
            if _c_max - _c_min > pressure_event_config.stability_threshold:
                _remember_failure(
                    report,
                    section,
                    f"pressure-{tag.value}",
                    (
                        f"夹具气压稳定性 / {tag.value} / 通道 {c + 1}："
                        f"最大值与最小值之差 {_c_max - _c_min:.6g} Pa；"
                        f"要求 <= {pressure_event_config.stability_threshold:g} Pa"
                        if LOCALIZE
                        else f"Fixture pressure stability / {tag.value} / channel {c + 1}: "
                        f"max-min {_c_max - _c_min:.6g} Pa; "
                        f"required <= {pressure_event_config.stability_threshold:g} Pa"
                    ),
                    ind=0,
                    error_code=QCErrorCode.PRESSURE_STABILITY_OUT_OF_RANGE,
                )
                printsig = f"05-01-fixture-pressure:测试工装气压,状态{tag.value},ch{c + 1}气压差变动最大值{round(_c_max, 2)}与最小值 {round(_c_min, 2)}差值 {abs(round(_c_max, 2)-round(_c_min, 2))} 超过阈值{pressure_event_config.stability_threshold}"
                FINAL_TEST_FAIL_INFOR.append(printsig)
                test_pass_stability = False
        report(
            section,
            f"pressure-{tag.value}",
            ["stability", CSVResult.from_bool(test_pass_stability)],
            0,
        )
        _all_samples = [s[c] for s in _samples for c in range(cfg.pipette_channels)]
        _all_samples.sort()
        _samples_min = min(_all_samples[1:-1])
        _samples_max = max(_all_samples[1:-1])
        if (
            _samples_min < pressure_event_config.min
            or _samples_max > pressure_event_config.max
        ):
            _remember_failure(
                report,
                section,
                f"pressure-{tag.value}",
                (
                    f"夹具气压范围 / {tag.value}：实测 {_samples_min:.6g} 至 {_samples_max:.6g} Pa；"
                    f"要求 {pressure_event_config.min:g} 至 {pressure_event_config.max:g} Pa（含边界）"
                    if LOCALIZE
                    else f"Fixture pressure range / {tag.value}: measured {_samples_min:.6g} to {_samples_max:.6g} Pa; "
                    f"required [{pressure_event_config.min:g}, {pressure_event_config.max:g}] Pa"
                ),
                ind=1,
                error_code=QCErrorCode.PRESSURE_VALUE_OUT_OF_RANGE,
            )
            printsig = f"05-02-fixture-pressure:测试工装气压,状态{tag.value},读取fixture的所有气压最大值{round(_samples_max, 2)}~最小值{round(_samples_min, 2)}超出阈值范围{pressure_event_config.min}~{pressure_event_config.max}"
            FINAL_TEST_FAIL_INFOR.append(printsig)
            test_pass_accuracy = False
        else:
            test_pass_accuracy = True
        report(
            section,
            f"pressure-{tag.value}",
            ["accuracy", CSVResult.from_bool(test_pass_accuracy)],
            1,
        )
        test_pass_delta = True
        if previous:
            assert len(previous[-1]) >= len(_average_per_channel)
            for c in range(cfg.pipette_channels):
                _delta_target = PRESSURE_ASPIRATE_DELTA_SPEC[cfg.pipette_channels][
                    cfg.pipette_volume
                ]["delta"]
                _delta_margin = PRESSURE_ASPIRATE_DELTA_SPEC[cfg.pipette_channels][
                    cfg.pipette_volume
                ]["margin"]
                _delta_min = _delta_target - (_delta_target * _delta_margin)
                _delta_max = _delta_target + (_delta_target * _delta_margin)
                _delta = abs(
                    _average_per_channel[c] - previous[-1][c]
                )  # absolute value
                if _delta < _delta_min or _delta > _delta_max:
                    _remember_failure(
                        report,
                        section,
                        f"pressure-{tag.value}",
                        _measurement_range_failure(
                            (
                                f"夹具吸液气压变化 / {tag.value} / 通道 {c + 1}"
                                if LOCALIZE
                                else f"Fixture aspiration pressure change / {tag.value} / channel {c + 1}"
                            ),
                            _delta,
                            _delta_min,
                            _delta_max,
                            "Pa",
                        ),
                        ind=2,
                        error_code=QCErrorCode.PRESSURE_DELTA_OUT_OF_RANGE,
                    )
                    printsig = f"05-03-fixture-pressure:测试工装气压,状态{tag.value},ch{c + 1}吸液50ul气压平均值{_average_per_channel[c]}与插入工装时的气压{previous[-1][c]}差值{_delta}不在阈值范围{_delta_max}~{_delta_min}"
                    FINAL_TEST_FAIL_INFOR.append(printsig)
                    test_pass_delta = False
            report(
                section,
                f"pressure-{tag.value}",
                ["delta", CSVResult.from_bool(test_pass_delta)],
                2,
            )
        _passed = test_pass_stability and test_pass_accuracy and test_pass_delta
        return _passed, _samples


@_qc_traced
def _aspirate_and_look_for_droplets(
    ctx: ProtocolContext,
    api: SyncHardwareAPI,
    mount: OT3Mount,
    wait_time: int,
    *,
    on_leak: Optional[Callable[[], None]] = None,
) -> bool:
    ctx.comment("Aspirating.")
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip
    pipette_volume = pip.working_volume
    _qc_call(api.aspirate, mount, pipette_volume - TRAILING_AIR_GAP_DROPLETS_UL)
    _qc_call(api.move_rel, mount, Point(z=LEAK_HOVER_ABOVE_LIQUID_MM))
    _qc_call(api.aspirate, mount, TRAILING_AIR_GAP_DROPLETS_UL)
    for t in range(wait_time):
        ctx.delay(1)
    if api.is_simulator:
        leak_test_passed = True
    else:
        leak_test_passed = _qc_call(
            helpers_ot3.get_user_answer,
            ctx,
            api,
            "did it pass? no leaking?",
            timeout_seconds=None,
        )
    if not leak_test_passed and on_leak is not None:
        # Keep the tips at the observation position until channels are recorded.
        on_leak()
    ctx.comment("dispensing")
    _qc_call(api.move_rel, mount, Point(z=-LEAK_HOVER_ABOVE_LIQUID_MM))
    _qc_call(api.dispense, mount, pipette_volume, is_full_dispense=True)
    _qc_call(api.blow_out, mount)
    return leak_test_passed


@_qc_traced
def _pick_up_tip_for_fixture_new(
    api: SyncHardwareAPI, cfg: TestConfig, well: str, tip_volume: int
) -> None:
    assert LABWARE["fixture"]
    tip_pos = LABWARE["fixture"][well].top().point + Point(
        z=-PRESSURE_FIXTURE_PICKUP_BELOW_LABWARE_TOP_MM
    )
    _move_safe(api, cfg.mount, tip_pos)
    tip_length = helpers_ot3.get_default_tip_length(tip_volume)
    _qc_call(api.pick_up_tip, cfg.mount, tip_length=tip_length)


@_qc_traced
def _fixture_check_pressure(
    ctx: ProtocolContext,
    api: SyncHardwareAPI,
    cfg: TestConfig,
    fixture: PressureFixtureBase,
    report: CSVReport,
    section: str,
    tip_volume: int,
) -> bool:
    results = []

    if cfg.pipette_channels == 8:
        current_val = PRESSURE_THRESH_current[cfg.pipette_channels][cfg.pipette_volume][
            1
        ]
        helpers_ot3.update_pick_up_current(api, cfg.mount, current_val)
    _pick_up_tip_for_fixture_new(api, cfg, "A1", tip_volume)
    # above the fixture
    r, _ = _read_pressure_and_check_results(
        ctx,
        api,
        cfg,
        fixture,
        PressureEvent.PRE,
        section,
        report,
    )
    results.append(r)
    # insert into the fixture
    # : unknown amount of pressure here (depends on where Z was calibrated)
    _qc_call(api.retract, cfg.mount)
    _drop_tip_in_trash(api, cfg)
    _qc_call(api.retract, cfg.mount)
    if cfg.pipette_channels == 8:
        current_val = PRESSURE_THRESH_current[cfg.pipette_channels][cfg.pipette_volume][
            8
        ]
        helpers_ot3.update_pick_up_current(api, cfg.mount, current_val)
    try:
        _pick_up_tip_for_fixture_new(api, cfg, "A2", tip_volume)
        ctx.delay(10)
        r, inserted_pressure_data = _read_pressure_and_check_results(
            ctx,
            api,
            cfg,
            fixture,
            PressureEvent.INSERT,
            section,
            report,
        )
        results.append(r)
        # aspirate 50uL
        _qc_call(
            api.aspirate,
            cfg.mount,
            PRESSURE_FIXTURE_ASPIRATE_VOLUME[cfg.pipette_volume],
        )
        ctx.delay(2)
        if cfg.pipette_volume == 50:
            asp_evt = PressureEvent.ASPIRATE_P50
        else:
            asp_evt = PressureEvent.ASPIRATE_P1000
        r, _ = _read_pressure_and_check_results(
            ctx,
            api,
            cfg,
            fixture,
            asp_evt,
            section,
            report,
            previous=inserted_pressure_data,
        )
        results.append(r)
        # dispense
        _qc_call(
            api.dispense,
            cfg.mount,
            PRESSURE_FIXTURE_ASPIRATE_VOLUME[cfg.pipette_volume],
            0.5,
            is_full_dispense=True,
        )
        ctx.delay(2)
        r, _ = _read_pressure_and_check_results(
            ctx,
            api,
            cfg,
            fixture,
            PressureEvent.DISPENSE,
            section,
            report,
        )
        results.append(r)
        _qc_call(api.drop_tip, cfg.mount, home_after=False)
        _qc_call(api.retract, cfg.mount)
        ctx.delay(2)
        r, _ = _read_pressure_and_check_results(
            ctx,
            api,
            cfg,
            fixture,
            PressureEvent.POST,
            section,
            report,
        )
        results.append(r)
    except Exception:
        _qc_call(api.drop_tip, cfg.mount)
        raise
    return False not in results


@_qc_traced
def _test_for_leak(
    ctx: ProtocolContext,
    api: SyncHardwareAPI,
    cfg: TestConfig,
    tip_volume: int,
    fixture: Optional[PressureFixtureBase],
    report: Optional[CSVReport],
    section: Optional[str],
    droplet_wait_seconds: int = 30,
    *,
    on_leak: Optional[Callable[[], None]] = None,
) -> bool:

    if cfg.pipette_channels == 8:
        current_val = PRESSURE_THRESH_current[cfg.pipette_channels][cfg.pipette_volume][
            8
        ]
        helpers_ot3.update_pick_up_current(api, cfg.mount, current_val)
    if fixture:
        assert report
        assert section
        test_passed = _fixture_check_pressure(
            ctx,
            api,
            cfg,
            fixture,
            report,
            section,
            tip_volume,
        )
    else:
        _pick_up_tip_for_tip_volume(api, cfg, tip_volume=tip_volume)
        _qc_call(api.retract, cfg.mount)
        assert CALIBRATED_LABWARE_LOCATIONS.reservoir
        _move_safe(api, cfg.mount, CALIBRATED_LABWARE_LOCATIONS.reservoir)
        test_passed = _aspirate_and_look_for_droplets(
            ctx, api, cfg.mount, droplet_wait_seconds, on_leak=on_leak
        )
        _drop_tip_in_trash(api, cfg)
    return test_passed


def test_fixture(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    """Test Liquid."""
    ctx.comment("测试夹具。" if LOCALIZE else "Test Fixture.")
    fixture = cfg.pressure_fixture
    if fixture is None:
        raise RuntimeError("Pressure fixture preflight was not completed.")
    _test_for_leak(
        ctx,
        api,
        cfg,
        PRESSURE_FIXTURE_TIP_VOLUME,
        fixture,
        report,
        section,
    )


# ----------- END TEST FIXTURE -----------

# ----------- TEST LIQUID -----------
def _parse_leaking_channels(raw: str) -> List[int]:
    """Interpret each ASCII digit as one channel, retaining no duplicate channels."""
    if re.fullmatch(r"[1-8]+", raw) is None:
        raise ValueError("Enter one or more channel digits from 1 to 8.")
    return sorted({int(digit) for digit in raw})


async def _read_leak_channel_input(
    self: OT3API, inputs: LiquidCalibrationInput, *, close: bool = False
) -> Tuple[Optional[str], float]:
    """Run the keyboard receiver on the hardware loop without starting a scan."""
    if close:
        await inputs.close()
        return None, monotonic()
    return await inputs.read(None)


def _get_leaking_channels(
    ctx: ProtocolContext, api: SyncHardwareAPI
) -> Tuple[str, List[int]]:
    """Wait for an explicit valid keypad submission, retaining pause/cancel checks."""
    from hardware_testing.drivers.liquid_calibration_keyboard import (
        ChannelSelectionKeyboard,
    )

    OT3API._qc_leak_channel_input = _read_leak_channel_input  # type: ignore[attr-defined]
    with ExitStack() as cleanup:
        keyboard = ChannelSelectionKeyboard.open(ctx.comment)
        inputs = LiquidCalibrationInput(keyboard, ctx.comment, ChannelSelectionKeyboard)
        cleanup.callback(inputs.close_keyboard)
        cleanup.callback(api._qc_leak_channel_input, inputs, close=True)
        inputs.discard_pending()
        ctx.comment(
            "请用小键盘输入本轮漏液的通道号（1～8），每位数字代表一个通道；"
            "例如 138 表示通道 1、3、8，12345678 表示全部通道。"
            "Enter 提交，Backspace 删除，Esc 清空。"
            if LOCALIZE
            else "Enter leaking channels on the keypad (1-8), one digit per channel: "
            "138 means channels 1, 3, 8; 12345678 means all channels. "
            "Enter submits, Backspace deletes, Esc clears."
        )
        if keyboard is None:
            ctx.comment(
                "未连接可用小键盘，正在等待并自动重连。"
                if LOCALIZE
                else "No keypad connected; waiting and retrying the connection."
            )
        while True:
            api.delay(0.1)
            result, received_at = api._qc_leak_channel_input(inputs)
            inputs.report_disconnect()
            api.delay(0.1)
            if result is None:
                continue
            if monotonic() - received_at > 3:
                ctx.comment(
                    "通道输入已过期，请重新输入并按 Enter。"
                    if LOCALIZE
                    else "Channel submission expired. Re-enter channels and press Enter."
                )
                continue
            raw = result[len("CHANNELS:") :] if result.startswith("CHANNELS:") else ""
            try:
                channels = _parse_leaking_channels(raw)
            except ValueError:
                ctx.comment(
                    "输入无效：只能连续输入 1～8，至少一个通道，不使用分隔符。请重新输入并按 Enter。"
                    if LOCALIZE
                    else "Invalid input: enter at least one digit from 1 to 8, "
                    "without separators. Re-enter channels and press Enter."
                )
                continue
            channel_text = ", ".join(str(channel) for channel in channels)
            ctx.comment(
                f"本轮漏液通道已记录：{channel_text}。"
                if LOCALIZE
                else f"Leaking channels recorded for this trial: {channel_text}."
            )
            return raw, channels


def _record_leaking_channels(
    ctx: ProtocolContext,
    api: SyncHardwareAPI,
    cfg: TestConfig,
    report: CSVReport,
    section: str,
    trial: int,
    droplet_wait_seconds: int,
) -> None:
    """Record a failed observation and its channels before any dispensing motion."""
    tag = f"droplets-{droplet_wait_seconds}"
    # Preserve the observed failure even if channel entry is cancelled.
    report(section, tag, [CSVResult.FAIL])
    FINAL_TEST_FAIL_INFOR.append(
        f"04-01-liquid:测试吸液保持,吸水后等待 {droplet_wait_seconds} 秒针管漏液"
    )
    evidence = {
        "trial": trial,
        "wait_seconds": droplet_wait_seconds,
        "mount": cfg.mount,
        "tip_volume": cfg.pipette_volume,
        "section": section,
        "tag": tag,
        "source": "operator",
    }
    _qc_observe("liquid_leak_channel_input_required", **evidence)
    try:
        raw, channels = _qc_call(_get_leaking_channels, ctx, api)
    except Exception:
        _remember_failure(
            report,
            section,
            tag,
            (
                f"漏液检查：吸液保持 {droplet_wait_seconds} 秒后，操作员判定漏液；通道未完成录入"
                if LOCALIZE
                else f"Leak check: operator reported leaking after holding "
                f"for {droplet_wait_seconds} s; channel entry was not completed"
            ),
            error_code=QCErrorCode.LIQUID_LEAK_DETECTED,
        )
        raise
    _qc_observe(
        "liquid_leak_channels",
        raw_input=raw,
        channels=channels,
        **evidence,
    )
    channel_text = ", ".join(str(channel) for channel in channels)
    _remember_failure(
        report,
        section,
        tag,
        (
            f"漏液检查：吸液保持 {droplet_wait_seconds} 秒后，操作员报告漏液通道：{channel_text}"
            if LOCALIZE
            else f"Leak check: after holding for {droplet_wait_seconds} s, "
            f"operator reported leaking channels: {channel_text}"
        ),
        error_code=QCErrorCode.LIQUID_LEAK_DETECTED,
    )


def build_liquid_csv_lines(cfg: TestConfig) -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for i in range(cfg.num_trials):
        lines.append(CSVLine(f"droplets-{(i+1)*cfg.droplet_wait_seconds}", [CSVResult]))
    return lines


def test_liquid(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    """Test Liquid."""
    ctx.comment("测试液体。" if LOCALIZE else "Test Liquid.")
    if cfg.pipette_channels == 8:
        # Reserve production liquid-probe positions despite running leaks first:
        # P50M column 1 is diagnostics, 2-4 are probing; P1000M uses 1-4.
        first_leak_column = 5
        leak_tips = [
            f"{row}{column}"
            for column in range(first_leak_column, first_leak_column + cfg.num_trials)
            for row in "ABCDEFGH"
        ]
        available = _available_tips[cfg.pipette_volume]
        if any(tip not in available for tip in leak_tips):
            raise RuntimeError(
                f"P{cfg.pipette_volume}M leak test requires available columns "
                f"starting at {first_leak_column}."
            )
        reserved = set(leak_tips)
        _available_tips[cfg.pipette_volume] = leak_tips + [
            tip for tip in available if tip not in reserved
        ]
    for i in range(cfg.num_trials):
        droplet_wait_seconds = cfg.droplet_wait_seconds * (i + 1)
        on_leak = (
            partial(
                _record_leaking_channels,
                ctx,
                api,
                cfg,
                report,
                section,
                i + 1,
                droplet_wait_seconds,
            )
            if cfg.pipette_channels == 8 and not api.is_simulator
            else None
        )
        test_passed = _test_for_leak(
            ctx,
            api,
            cfg,
            cfg.pipette_volume,
            None,
            None,
            None,
            droplet_wait_seconds,
            on_leak=on_leak,
        )
        if test_passed or on_leak is None:
            report(
                section,
                f"droplets-{droplet_wait_seconds}",
                [CSVResult.from_bool(test_passed)],
            )
            if not test_passed:
                printsig = f"04-01-liquid:测试吸液保持,吸水后等待 {droplet_wait_seconds} 秒针管漏液"
                FINAL_TEST_FAIL_INFOR.append(printsig)
        # Live 8-channel failures were already saved by on_leak, before
        # dispensing. Do not record the same result twice.


# ----------- END TEST LIQUID -----------

# ----------- TEST DIAGNOSTICS -----------
def build_diagnostics_csv_lines(
    pipette_channels: int,
) -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    lines.append(CSVLine("diagnostic-environment", [CSVResult]))
    lines.append(CSVLine("diagnostic-encoder", [CSVResult]))
    lines.append(CSVLine("diagnostic-capacitance", [CSVResult]))
    lines.append(CSVLine("diagnostic-pressure", [CSVResult]))
    sensors = [SensorId.S0]
    if pipette_channels == 8:
        sensors.append(SensorId.S1)
    for sensor_id in sensors:
        lines.append(CSVLine(f"humidity-{sensor_id.name}", [float, float, CSVResult]))
        lines.append(CSVLine(f"celsius-{sensor_id.name}", [float, float, CSVResult]))
        lines.append(
            CSVLine(f"capacitive-open-air-{sensor_id.name}", [float, CSVResult])
        )
        lines.append(CSVLine(f"capacitive-probe-{sensor_id.name}", [float, CSVResult]))
        lines.append(CSVLine(f"capacitive-square-{sensor_id.name}", [float, CSVResult]))
        for trial in range(2):
            lines.append(
                CSVLine(f"probe-slot-{sensor_id.name}-{trial}", [float, float, float])
            )
        lines.append(
            CSVLine(f"capacitive-probe-slot-{sensor_id.name}-result", [CSVResult])
        )
        lines.append(CSVLine(f"pressure-open-air-{sensor_id.name}", [float, CSVResult]))
        lines.append(CSVLine(f"pressure-sealed-{sensor_id.name}", [float, CSVResult]))
        lines.append(
            CSVLine(f"pressure-compressed-{sensor_id.name}", [float, CSVResult])
        )
    lines.append(CSVLine("encoder-home", [float, float, CSVResult]))
    lines.append(CSVLine("encoder-move", [float, float, CSVResult]))
    return lines


def _remove_outliers_and_average(values: List[float]) -> float:
    no_outliers = sorted(values)[1:-1]
    return sum(no_outliers) / len(no_outliers)


@_qc_traced
def _read_and_average(
    api: SyncHardwareAPI,
    mount: OT3Mount,
    s_type: SensorType,
    sensor_id: SensorId,
    num_readings: int = 10,
) -> float:
    readings = []
    for _ in range(num_readings):
        match s_type:
            case SensorType.capacitive:
                next_read = _qc_call(
                    api.read_instrument_capacitance, mount, sensor_id == SensorId.S0
                )
            case SensorType.temperature:
                next_read = _qc_call(
                    api.read_stem_temperature, mount, sensor_id == SensorId.S0
                )
            case SensorType.humidity:
                next_read = _qc_call(
                    api.read_stem_humidity, mount, sensor_id == SensorId.S0
                )
            case SensorType.pressure:
                next_read = _qc_call(
                    api.read_stem_pressure, mount, sensor_id == SensorId.S0
                )
        readings.append(round(next_read, 2))
        _qc_observe(
            f"sensor:{mount.name}:{sensor_id.name}:{s_type.name}",
            mount=mount,
            sensor=sensor_id,
            sensor_type=s_type,
            raw_value=next_read,
        )
    return _remove_outliers_and_average(readings)


@_qc_traced
def _test_env_sensors(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    ctx.comment("测试诊断环境。" if LOCALIZE else "Test diagnostics environment.")
    env_sensor = cfg.env_sensor
    if env_sensor is None:
        raise RuntimeError("Environmental sensor preflight was not completed.")
    reading = env_sensor.get_reading()
    room_c = reading.temperature
    room_h = reading.relative_humidity
    sensors = [SensorId.S0]
    env_pass = True
    if cfg.pipette_channels == 8:
        sensors.append(SensorId.S1)
    for sensor_id in sensors:
        celsius = _read_and_average(api, cfg.mount, SensorType.temperature, sensor_id)
        humidity = _read_and_average(api, cfg.mount, SensorType.humidity, sensor_id)
        c_pass = TEMP_THRESH[0] <= celsius <= TEMP_THRESH[1]
        h_pass = HUMIDITY_THRESH[0] <= humidity <= HUMIDITY_THRESH[1]
        report(
            section,
            f"celsius-{sensor_id.name}",
            [room_c, celsius, CSVResult.from_bool(c_pass)],
        )
        report(
            section,
            f"humidity-{sensor_id.name}",
            [room_h, humidity, CSVResult.from_bool(h_pass)],
        )
        env_pass = env_pass and c_pass and h_pass
    report(
        section,
        "diagnostic-environment",
        [CSVResult.from_bool(env_pass)],
    )


@_qc_traced
def _test_encoder(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    ctx.comment("测试诊断编码器。" if LOCALIZE else "Test diagnostics encoder.")
    pip_axis = Axis.of_main_tool_actuator(cfg.mount)
    _, bottom, _, drop_tip = helpers_ot3.get_plunger_positions_ot3(api, cfg.mount)

    def _get_plunger_pos_and_encoder() -> Tuple[float, float]:
        _pos = _qc_call(api.current_position_ot3, cfg.mount)
        _enc = _qc_call(api.encoder_current_position_ot3, cfg.mount)
        return _pos[pip_axis], _enc[pip_axis]

    # print("homing plunger")
    _qc_call(api.home, [pip_axis])
    pip_pos, pip_enc = _get_plunger_pos_and_encoder()
    encoder_home_pass = abs(pip_pos - pip_enc) <= ENCODER_ALIGNMENT_THRESHOLD_HOME_MM
    report(
        section,
        "encoder-home",
        [pip_pos, pip_enc, CSVResult.from_bool(encoder_home_pass)],
    )
    _qc_call(helpers_ot3.move_plunger_absolute_ot3_sync, api, cfg.mount, drop_tip)
    pip_pos, pip_enc = _get_plunger_pos_and_encoder()
    encoder_move_pass = abs(pip_pos - pip_enc) <= ENCODER_ALIGNMENT_THRESHOLD_MM
    report(
        section,
        "encoder-move",
        [pip_pos, pip_enc, CSVResult.from_bool(encoder_move_pass)],
    )
    report(
        section,
        "diagnostic-encoder",
        [CSVResult.from_bool(encoder_move_pass and encoder_home_pass)],
    )
    _qc_call(helpers_ot3.move_plunger_absolute_ot3_sync, api, cfg.mount, bottom)


@_qc_traced
def _test_cap_sensors(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    ctx.comment("测试电容诊断。" if LOCALIZE else "Test diagnostics capacitance.")
    sensor_to_probe = {
        SensorId.S0: InstrumentProbeType.PRIMARY,
        SensorId.S1: InstrumentProbeType.SECONDARY,
    }
    cap_pass = True
    sensors = [SensorId.S0]
    if cfg.pipette_channels == 8:
        sensors.append(SensorId.S1)
    for sensor_id in sensors:
        # OPEN AIR
        open_air = _read_and_average(api, cfg.mount, SensorType.capacitive, sensor_id)
        open_air_pass = (
            CAP_THRESH_OPEN_AIR[cfg.pipette_channels][0]
            <= open_air
            <= CAP_THRESH_OPEN_AIR[cfg.pipette_channels][1]
        )
        cap_pass = cap_pass and open_air_pass
        report(
            section,
            f"capacitive-open-air-{sensor_id.name}",
            [open_air, CSVResult.from_bool(open_air_pass)],
        )

        # WITH PROBE ON
        nozzle_str = ""
        if cfg.pipette_channels == 8:
            nozzle_str = (
                ("后侧" if sensor_id == SensorId.S0 else "前侧")
                if LOCALIZE
                else ("REAR " if sensor_id == SensorId.S0 else "FRONT ")
            )
        ctx.pause(f"安装{nozzle_str}探头" if LOCALIZE else f"ATTACH the {nozzle_str}probe")
        _qc_observe(
            f"calibration_probe:{cfg.mount.name}",
            mount=cfg.mount,
            sensor=sensor_id,
            state="operator_confirmed_attached",
        )
        ctx.comment(f"正在校准 {nozzle_str}" if LOCALIZE else f"Calibrating {nozzle_str}")
        probe_cap = _read_and_average(api, cfg.mount, SensorType.capacitive, sensor_id)
        probe_pass = (
            CAP_THRESH_PROBE[cfg.pipette_channels][0]
            <= probe_cap
            <= CAP_THRESH_PROBE[cfg.pipette_channels][1]
        )
        cap_pass = cap_pass and probe_pass
        report(
            section,
            f"capacitive-probe-{sensor_id.name}",
            [probe_cap, CSVResult.from_bool(probe_pass)],
        )

        # Test calibrate reliability
        offsets: List[Point] = []
        calibrate_pass = False
        for trial in range(2):
            if trial > 0:
                ctx.pause(
                    "将探头旋转180°后重新安装"
                    if LOCALIZE
                    else "Rotate the probe 180 degrees and reinstall it"
                )
                ctx.comment(
                    f"正在校准 {nozzle_str}" if LOCALIZE else f"Calibrating {nozzle_str}"
                )
            if api.is_simulator:
                offset = Point(0, 0, 0)
            else:
                try:
                    with _qc_step(
                        "capacitive_calibration_trial",
                        mount=cfg.mount,
                        sensor=sensor_id,
                        trial=trial + 1,
                    ):
                        _qc_call(
                            api._calibrate_pipette,
                            cfg.mount,
                            sensor_to_probe[sensor_id],
                        )
                except (
                    CalibrationStructureNotFoundError,
                    EdgeNotFoundError,
                    StallOrCollisionDetectedError,
                ) as error:
                    # Calibration restores the saved offset and retracts before
                    # propagating these errors. Do not attempt the square move
                    # without two successful calibration measurements.
                    failure = f"capacitive-probe-slot-{sensor_id.name}-result: {error}"
                    if isinstance(error, CalibrationStructureNotFoundError):
                        localized_error = "未找到校准结构"
                    elif isinstance(error, EdgeNotFoundError):
                        localized_error = "未找到校准边缘"
                    else:
                        localized_error = "检测到堵转或碰撞"
                    reason = (
                        f"探针校准 / 通道 {1 if sensor_id == SensorId.S0 else 8} / 第 {trial + 1}/2 次："
                        f"{localized_error}；"
                        f"{error}；校准方块电容检查未执行"
                        if LOCALIZE
                        else f"Probe calibration / channel {1 if sensor_id == SensorId.S0 else 8} / trial {trial + 1}/2: "
                        f"{type(error).__name__}: {error}; calibration-square check not run"
                    )
                    for failed_tag in (
                        f"capacitive-probe-slot-{sensor_id.name}-result",
                        f"capacitive-square-{sensor_id.name}",
                    ):
                        _remember_failure(
                            report,
                            section,
                            failed_tag,
                            reason,
                            error_code=QCErrorCode.CAPACITIVE_CALIBRATION_FAILED,
                        )
                    FINAL_TEST_FAIL_INFOR.append(failure)
                    ctx.comment(f"Calibration failed; recording FAIL: {failure}")
                    break
                pip = api.hardware_pipettes[cfg.mount.to_mount()]
                assert pip
                offset = pip.pipette_offset.offset
            report_offset = [round(offset.x, 2), round(offset.y, 2), round(offset.z, 2)]
            report(section, f"probe-slot-{sensor_id.name}-{trial}", report_offset)
            offsets.append(offset)
            _qc_call(api.retract, cfg.mount)
        if len(offsets) > 1:
            calibrate_pass = offsets[0].elementwise_isclose(
                offsets[1], abs_tol=PROBING_DECK_PRECISION_MM
            )
            if not calibrate_pass:
                differences = ", ".join(
                    f"{axis.upper()}={abs(getattr(offsets[0], axis) - getattr(offsets[1], axis)):.6g}"
                    for axis in "xyz"
                )
                _remember_failure(
                    report,
                    section,
                    f"capacitive-probe-slot-{sensor_id.name}-result",
                    (
                        f"探针校准重复性 / 通道 {1 if sensor_id == SensorId.S0 else 8}："
                        f"两次坐标差 {differences} mm；每轴要求 <= {PROBING_DECK_PRECISION_MM:g} mm"
                        if LOCALIZE
                        else f"Probe calibration repeatability / channel {1 if sensor_id == SensorId.S0 else 8}: "
                        f"coordinate differences {differences} mm; each axis must be <= {PROBING_DECK_PRECISION_MM:g} mm"
                    ),
                    error_code=QCErrorCode.CAPACITIVE_REPEATABILITY_FAILED,
                )
            cap_pass = cap_pass and calibrate_pass

            # Test calibration square
            probe_pos = helpers_ot3.get_slot_calibration_square_position_ot3(5)
            probe_pos += Point(13, 13, 0)
            if sensor_id == SensorId.S1:
                probe_pos += Point(x=0, y=9 * 7, z=0)
            _qc_call(api.add_tip, cfg.mount, api.config.calibration.probe_length)
            _probe_start_mm = probe_pos.z + 5
            current_pos = _qc_call(api.gantry_position, cfg.mount)
            if current_pos.z < _probe_start_mm:
                _qc_call(
                    api.move_to, cfg.mount, current_pos._replace(z=_probe_start_mm)
                )
                current_pos = _qc_call(api.gantry_position, cfg.mount)
            _qc_call(api.move_to, cfg.mount, probe_pos._replace(z=current_pos.z))
            _qc_call(api.move_to, cfg.mount, probe_pos)
            near_square = _read_and_average(
                api, cfg.mount, SensorType.capacitive, sensor_id
            )
            near_square_pass = (
                CAP_THRESH_SQUARE[cfg.pipette_channels][0]
                <= near_square
                <= CAP_THRESH_SQUARE[cfg.pipette_channels][1]
            )
            cap_pass = cap_pass and near_square_pass
        else:
            near_square = 0
            cap_pass = False
            near_square_pass = False
            cap_pass = False

        report(
            section,
            f"capacitive-square-{sensor_id.name}",
            [near_square, CSVResult.from_bool(near_square_pass)],
        )
        report(
            section,
            f"capacitive-probe-slot-{sensor_id.name}-result",
            [CSVResult.from_bool(calibrate_pass)],
        )

        _qc_call(api.retract, cfg.mount)
        ctx.pause("移除探针" if LOCALIZE else "REMOVE the probe")
        _qc_observe(
            f"calibration_probe:{cfg.mount.name}",
            mount=cfg.mount,
            sensor=sensor_id,
            state="operator_confirmed_removed",
        )
        ctx.comment(
            f"已完成 {nozzle_str} 的校准" if LOCALIZE else f"Done calibrating {nozzle_str}"
        )
        _qc_call(api.remove_tip, cfg.mount)
    report(
        section,
        "diagnostic-capacitance",
        [CSVResult.from_bool(cap_pass)],
    )


@_qc_traced
def _test_diagnostics_pressure(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    ctx.comment("测试诊断压力。" if LOCALIZE else "Test diagnostics pressure.")
    results: List[bool] = []
    sensor_ids = [SensorId.S0]
    if cfg.pipette_channels == 8:
        sensor_ids.append(SensorId.S1)
    _qc_call(api.add_tip, cfg.mount, 0.1)
    _qc_call(api.prepare_for_aspirate, cfg.mount)
    _qc_call(api.remove_tip, cfg.mount)

    def _read_pressure(_sensor_id: SensorId) -> float:
        return _read_and_average(api, cfg.mount, SensorType.pressure, _sensor_id)

    current_val = PRESSURE_THRESH_current[cfg.pipette_channels][cfg.pipette_volume][1]
    helpers_ot3.update_pick_up_current(api, cfg.mount, current_val)
    diagnostic_tip_volume = 1000 if cfg.pipette_volume == 1000 else 50
    if cfg.pipette_volume == 50:
        if cfg.pipette_channels == 1:
            movez = -155.5
        else:
            movez = -154.8
    else:
        movez = -117

    open_thresholds = PRESSURE_THRESH_OPEN_AIR[cfg.pipette_channels][cfg.pipette_volume]
    sealed_thresholds = PRESSURE_THRESH_SEALED[cfg.pipette_channels][cfg.pipette_volume]
    compressed_thresholds = PRESSURE_THRESH_COMPRESS[cfg.pipette_channels][
        cfg.pipette_volume
    ]

    for sensor_id in sensor_ids:
        pressure = _read_pressure(sensor_id)
        if not (open_thresholds[0] <= pressure <= open_thresholds[1]):
            results.append(False)
            printtxt = f"01-08-open-air-pressure:气压传感器,通道{sensor_id.name}在空气中的气压差值{pressure}超出范围值{PRESSURE_THRESH_OPEN_AIR[cfg.pipette_channels][cfg.pipette_volume]}"
            FINAL_TEST_FAIL_INFOR.append(printtxt)
        else:
            results.append(True)
        report(
            section,
            f"pressure-open-air-{sensor_id.name}",
            [
                pressure,
                _bool_to_pass_fail(results[-1]),
            ],
        )

    # PICK-UP TIP(S)
    _, bottom, _, _ = helpers_ot3.get_plunger_positions_ot3(api, cfg.mount)
    _qc_call(helpers_ot3.move_plunger_absolute_ot3_sync, api, cfg.mount, bottom)
    ctx.comment(
        f"Diagnostic pressure: {diagnostic_tip_volume} uL tips; "
        f"seal approach from retracted tip Z={movez:.3f} mm"
    )
    _pick_up_tip_for_tip_volume(api, cfg, tip_volume=diagnostic_tip_volume)
    _qc_call(api.retract, cfg.mount)

    # SEALED PRESSURE
    current_pos = _qc_call(api.gantry_position, cfg.mount)
    slot_11_pos = helpers_ot3.get_slot_calibration_square_position_ot3(11)
    if cfg.pipette_channels == 1:
        slot_11_pos = slot_11_pos._replace(z=current_pos.z)
    else:
        slot_11_pos = slot_11_pos._replace(y=slot_11_pos.y + 29, z=current_pos.z)
    _move_safe(api, cfg.mount, slot_11_pos)
    _qc_call(api.move_rel, cfg.mount, Point(z=movez + 10))
    _qc_call(api.move_rel, cfg.mount, Point(z=-10), speed=5)
    ctx.delay(2)
    for sensor_id in sensor_ids:
        pressure = _read_pressure(sensor_id)
        if not (sealed_thresholds[0] <= pressure <= sealed_thresholds[1]):
            results.append(False)
            printtxt = f"01-09-sealed-pressure:气压传感器,通道{sensor_id.name}堵住针管时的气压差值{pressure}超出范围值{PRESSURE_THRESH_SEALED[cfg.pipette_channels][cfg.pipette_volume]}"
            FINAL_TEST_FAIL_INFOR.append(printtxt)

        else:
            results.append(True)

        report(
            section,
            f"pressure-sealed-{sensor_id.name}",
            [
                pressure,
                _bool_to_pass_fail(results[-1]),
            ],
        )
    # COMPRESSED
    plunger_aspirate_ul = PRESSURE_ASPIRATE_VOL[cfg.pipette_channels][
        cfg.pipette_volume
    ]
    _qc_call(api.aspirate, cfg.mount, plunger_aspirate_ul)
    ctx.delay(2)
    for sensor_id in sensor_ids:
        pressure = _read_pressure(sensor_id)
        if not (compressed_thresholds[0] <= pressure <= compressed_thresholds[1]):
            results.append(False)
            printtxt = f"01-10-compressed-pressure:气压传感器,通道{sensor_id.name}吸液{plunger_aspirate_ul}ul时的气压差{pressure}超出范围值{PRESSURE_THRESH_COMPRESS[cfg.pipette_channels][cfg.pipette_volume]}"
            FINAL_TEST_FAIL_INFOR.append(printtxt)
        else:
            results.append(True)
        report(
            section,
            f"pressure-compressed-{sensor_id.name}",
            [
                pressure,
                _bool_to_pass_fail(results[-1]),
            ],
        )
    ctx.delay(1)
    _qc_call(api.dispense, cfg.mount, is_full_dispense=True)
    _qc_call(api.prepare_for_aspirate, cfg.mount)
    _drop_tip_in_trash(api, cfg)

    report(
        section,
        "diagnostic-pressure",
        [CSVResult.from_bool(all(results))],
    )


def test_diagnostics(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    """Test Liquid."""
    ctx.comment("测试诊断。" if LOCALIZE else "Test diagnostics.")
    pos_slot_3 = helpers_ot3.get_slot_calibration_square_position_ot3(3)
    current_pos = _qc_call(api.gantry_position, cfg.mount)
    hover_over_slot_3 = pos_slot_3._replace(z=current_pos.z - 20)
    _qc_call(api.move_to, cfg.mount, hover_over_slot_3)
    _test_env_sensors(api, report, section, ctx, cfg)
    _test_encoder(api, report, section, ctx, cfg)
    _test_cap_sensors(api, report, section, ctx, cfg)
    _test_diagnostics_pressure(api, report, section, ctx, cfg)
    _qc_call(api.retract, cfg.mount)


# ----------- END TEST DIAGNOSTICS -----------

# ----------- TEST PLUNGER -----------
def build_plunger_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    lines.append(CSVLine("plunger-blow-out", [CSVResult]))
    lines.append(CSVLine("plunger-drop-tip", [CSVResult]))
    return lines


@_qc_traced
def _test_plunger_positions(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    _qc_call(
        api.home, [Axis.by_mount(cfg.mount), Axis.of_main_tool_actuator(cfg.mount)]
    )
    _, bottom, blow_out, drop_tip = helpers_ot3.get_plunger_positions_ot3(
        api, cfg.mount
    )
    _qc_call(helpers_ot3.move_plunger_absolute_ot3_sync, api, cfg.mount, blow_out)
    if api.is_simulator:
        blow_out_passed = True
    else:
        blow_out_passed = _qc_call(
            helpers_ot3.get_user_answer,
            ctx,
            api,
            "is BLOW-OUT correct?",
            timeout_seconds=None,
        )
        ctx.comment(f"Blowout passed {blow_out_passed}")
        if not blow_out_passed:
            printval = f"02-01-BLOW-OUT:移液器BLOW-OUT {blow_out_passed}"
            FINAL_TEST_FAIL_INFOR.append(printval)
    report(section, "plunger-blow-out", [CSVResult.from_bool(blow_out_passed)])
    _qc_call(helpers_ot3.move_plunger_absolute_ot3_sync, api, cfg.mount, drop_tip)
    if api.is_simulator:
        drop_tip_passed = True
    else:
        drop_tip_passed = _qc_call(
            helpers_ot3.get_user_answer,
            ctx,
            api,
            "is DROP-TIP correct?",
            timeout_seconds=None,
        )
        ctx.comment(f"drop-tip passed {drop_tip_passed}")
        if not drop_tip_passed:
            printval = f"02-02-DROP-TIP:移液器DROP-TIP {drop_tip_passed}"
            FINAL_TEST_FAIL_INFOR.append(printval)
    report(section, "plunger-drop-tip", [CSVResult.from_bool(drop_tip_passed)])
    _qc_call(api.home, [Axis.of_main_tool_actuator(cfg.mount)])
    ctx.comment("已完成柱塞位置的测试。" if LOCALIZE else "finished testing plunger positions.")


def test_plunger(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    """Test Plunger."""
    ctx.comment("测试柱塞。" if LOCALIZE else "Test plunger.")
    pos_slot_3 = helpers_ot3.get_slot_calibration_square_position_ot3(3)
    current_pos = _qc_call(api.gantry_position, cfg.mount)
    hover_over_slot_3 = pos_slot_3._replace(z=current_pos.z - 20)
    _qc_call(api.move_to, cfg.mount, hover_over_slot_3)
    _qc_call(api.move_rel, cfg.mount, Point(z=-20))
    _test_plunger_positions(api, report, section, ctx, cfg)


# ----------- END TEST PLUNGER -----------

# ----------- TEST TIP_SENSOR -----------
def build_tip_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    lines.append(CSVLine("tip-presence-ejector-height-above-nozzle", [float]))
    lines.append(CSVLine("tip-presence-pick-up-displacement", [float, CSVResult]))
    lines.append(CSVLine("tip-presence-pick-up-height-above-nozzle", [float]))
    lines.append(CSVLine("tip-presence-drop-displacement", [float, CSVResult]))
    lines.append(CSVLine("tip-presence-drop-height-above-nozzle", [float]))
    return lines


@_qc_traced
def _jog_for_tip_state(
    ctx: ProtocolContext,
    api: SyncHardwareAPI,
    mount: OT3Mount,
    current_z: float,
    max_z: float,
    step_mm: float,
    criteria: Tuple[float, float],
    tip_state: TipStateType,
    on_failure: Optional[Callable[[str], None]] = None,
) -> bool:
    def _matches_state(_state: TipStateType) -> bool:
        if api.is_simulator:
            return True
        try:
            ctx.delay(0.3)
            _qc_call(api.verify_tip_presence, mount, _state)
            return True
        except FailedTipStateCheck:
            return False

    times = 0
    while (step_mm > 0 and current_z < max_z) or (step_mm < 0 and current_z > max_z):
        _qc_call(api.move_rel, mount, Point(z=step_mm))
        current_z = round(current_z + step_mm, 2)
        times += 1
        if _matches_state(tip_state):
            graval = times * 0.1
            passed = min(criteria) <= current_z <= max(criteria)
            if not passed:
                if on_failure:
                    on_failure(
                        _measurement_range_failure(
                            (
                                f"吸头检测 / {'取头' if tip_state == TipStateType.PRESENT else '退头'} / 触发相对高度"
                                if LOCALIZE
                                else f"Tip detection / {tip_state.name} / trigger relative height"
                            ),
                            current_z,
                            min(criteria),
                            max(criteria),
                            "mm",
                        )
                    )
                printsig = f"06-02-tip-presence:测试光栅距离,针管状态{tip_state.name}移液轴头到触发光栅的距离为{current_z} 结果为{passed} 阈值为{min(criteria)} ~ {max(criteria)}.触发光电开关的走的距离为{graval}"
                FINAL_TEST_FAIL_INFOR.append(printsig)
            return passed
    printsig = (
        f"06-03-tip-presence:光电传感器故障,在状态{tip_state.name} 位移最大值{current_z} 没触发光电开关"
    )
    FINAL_TEST_FAIL_INFOR.append(printsig)
    if on_failure:
        on_failure(
            (
                f"吸头检测：移动到相对高度 {current_z:.6g} mm，仍未检测到"
                f"{'有吸头' if tip_state == TipStateType.PRESENT else '无吸头'}状态"
                if LOCALIZE
                else f"Tip detection: reached relative height {current_z:.6g} mm "
                f"without detecting {tip_state.name}"
            )
        )
    return False


@_qc_traced
def test_tip_sensor_new(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    """Fully automated tip sensor check."""
    ctx.comment("测试探头传感器。" if LOCALIZE else "Test tip sensor.")
    _qc_call(api.retract, cfg.mount)
    if cfg.pipette_channels == 1:
        offset_from_a1 = Point(x=9 * 11, y=9 * -7, z=-6)
    else:
        offset_from_a1 = Point(x=9 * 11, y=0, z=-6)
    test_pos = (
        CALIBRATED_LABWARE_LOCATIONS.tip_rack_50 + offset_from_a1  # type: ignore[operator]
    )
    _qc_call(helpers_ot3.move_to_arched_ot3_sync, api, cfg.mount, test_pos)
    nozzle_pos = _qc_call(api.gantry_position, cfg.mount)
    nominal_single_ejector_relative = -7
    nominal_multi_ejector_relative = -5.1
    ejector_rel_pos = (
        nominal_single_ejector_relative
        if cfg.pipette_channels == 1
        else nominal_multi_ejector_relative
    )
    pick_up_criteria = {
        1: (
            ejector_rel_pos + -1.3,
            ejector_rel_pos + -2.5,
        ),
        8: (
            ejector_rel_pos + -1.9,
            ejector_rel_pos + -4.0,
        ),
    }[cfg.pipette_channels]
    if cfg.pipette_channels == 1:
        _qc_call(api.move_rel, cfg.mount, Point(z=nominal_single_ejector_relative))
    else:
        _qc_call(api.move_rel, cfg.mount, Point(z=nominal_multi_ejector_relative))
    pick_up_result = _jog_for_tip_state(
        ctx,
        api,
        cfg.mount,
        current_z=ejector_rel_pos,
        max_z=-10.5,
        criteria=pick_up_criteria,
        step_mm=-0.1,
        tip_state=TipStateType.PRESENT,
        on_failure=lambda reason: _remember_failure(
            report,
            section,
            "tip-presence-pick-up-displacement",
            reason,
            error_code=QCErrorCode.TIP_PICKUP_OUT_OF_RANGE,
        ),
    )
    pick_up_pos = _qc_call(api.gantry_position, cfg.mount)
    pick_up_pos_rel = round(pick_up_pos.z - nozzle_pos.z, 2)
    _qc_call(api.move_to, cfg.mount, nozzle_pos + Point(z=-10.5))  # nominal tip depth
    drop_criteria = {
        1: (
            -10.5 + 1.2,
            -10.5 + 2.3,
        ),
        8: (
            -10.5 + 1.9,
            -10.5 + 4.0,
        ),
    }[cfg.pipette_channels]
    drop_result = _jog_for_tip_state(
        ctx,
        api,
        cfg.mount,
        current_z=-10.5,
        max_z=0.0,
        criteria=drop_criteria,
        step_mm=0.1,
        tip_state=TipStateType.ABSENT,
        on_failure=lambda reason: _remember_failure(
            report,
            section,
            "tip-presence-drop-displacement",
            reason,
            error_code=QCErrorCode.TIP_DROP_OUT_OF_RANGE,
        ),
    )
    drop_pos = _qc_call(api.gantry_position, cfg.mount)
    drop_pos_rel = round(drop_pos.z - nozzle_pos.z, 2)
    pick_up_disp = round(ejector_rel_pos - pick_up_pos_rel, 2)
    drop_disp = round(10.5 + drop_pos_rel, 2)
    report(section, "tip-presence-ejector-height-above-nozzle", [ejector_rel_pos])
    report(
        section,
        "tip-presence-pick-up-displacement",
        [
            pick_up_disp,
            CSVResult.from_bool(pick_up_result),
        ],
    )
    report(section, "tip-presence-pick-up-height-above-nozzle", [pick_up_pos_rel])
    report(
        section,
        "tip-presence-drop-displacement",
        [drop_disp, CSVResult.from_bool(drop_result)],
    )
    report(section, "tip-presence-drop-height-above-nozzle", [drop_pos_rel])


# ----------- END TEST TIP_SENSOR -----------

# ----------- TEST LIQUID_PROBE -----------
def build_liquid_probe_csv_lines(
    cfg: TestConfig,
) -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine(f"reference-{name}", [str])
        for name in (
            "pipette",
            "serial",
            "method",
            "left-calibration",
            "right-calibration",
        )
    ]
    probes = [InstrumentProbeType.PRIMARY]
    if cfg.pipette_channels > 1:
        probes.append(InstrumentProbeType.SECONDARY)
    tip_vols = [50] if cfg.pipette_volume == 50 else [50, 200, 1000]
    for tip_vol in tip_vols:
        lines.extend(
            [
                CSVLine(f"liquid-probe-{tip_vol}-reference-tip", [str]),
                CSVLine(f"liquid-probe-{tip_vol}-reference-z", [float]),
                CSVLine(f"liquid-probe-{tip_vol}-reference-error", [str]),
            ]
        )
        for probe in probes:
            lines.append(
                CSVLine(
                    f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}-auto-surface-z",
                    [float],
                )
            )
            for trial in range(3):
                prefix = f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}"
                lines.extend(
                    [
                        CSVLine(f"{prefix}-trial-{trial}-absolute-z", [float]),
                        CSVLine(f"{prefix}-trial-{trial}-error", [str]),
                    ]
                )
                lines.append(
                    CSVLine(
                        f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}-probe-trial-{trial}",
                        [float],
                    )
                )
            lines.append(
                CSVLine(
                    f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}-probe-precision",
                    [float, CSVResult],
                )
            )
            lines.append(
                CSVLine(
                    f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}-probe-accuracy",
                    [float, CSVResult],
                )
            )
            lines.append(
                CSVLine(
                    f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}-probe",
                    [CSVResult],
                )
            )

    return lines


def _move_to_above_plate_liquid(
    api: SyncHardwareAPI, mount: OT3Mount, probe: InstrumentProbeType, height_mm: float
) -> None:
    if probe == InstrumentProbeType.PRIMARY:
        assert (
            CALIBRATED_LABWARE_LOCATIONS.plate_primary
        ), "you must calibrate the liquid before hovering"
        point = CALIBRATED_LABWARE_LOCATIONS.plate_primary + Point(z=height_mm)
    else:
        assert (
            CALIBRATED_LABWARE_LOCATIONS.plate_secondary
        ), "you must calibrate the liquid before hovering"
        point = CALIBRATED_LABWARE_LOCATIONS.plate_secondary + Point(z=height_mm)
    _move_safe(
        api,
        mount,
        point,
    )


def _test_liquid_probe(
    api: SyncHardwareAPI,
    cfg: TestConfig,
    tip_volume: int,
    trials: int,
    probes: List[InstrumentProbeType],
) -> Dict[InstrumentProbeType, List[float]]:
    trial_results: Dict[InstrumentProbeType, List[float]] = {
        probe: [] for probe in probes
    }
    hover_mm = 3
    max_submerge_mm = -3
    max_z_distance_machine_coords = hover_mm - max_submerge_mm
    assert CALIBRATED_LABWARE_LOCATIONS.plate_primary is not None
    if InstrumentProbeType.SECONDARY in probes:
        assert CALIBRATED_LABWARE_LOCATIONS.plate_secondary is not None
    for trial in range(trials):
        _qc_call(api.home)
        _pick_up_tip_for_tip_volume(api, cfg, tip_volume)
        for probe in probes:
            _move_to_above_plate_liquid(api, cfg.mount, probe, height_mm=hover_mm)
            _qc_call(api.gantry_position, cfg.mount)
            try:
                end_z = _qc_call(
                    api.liquid_probe,
                    cfg.mount,
                    max_z_distance_machine_coords,
                    probe=probe,
                )
            except Exception:
                probeval = f"07-03{probe}传感器故障: 读取{probe}传感器值失败"
                FINAL_TEST_FAIL_INFOR.append(probeval)
                end_z = 0

            if probe == InstrumentProbeType.PRIMARY:
                pz = CALIBRATED_LABWARE_LOCATIONS.plate_primary.z
            else:
                pz = CALIBRATED_LABWARE_LOCATIONS.plate_secondary.z  # type: ignore[union-attr]
            error_mm = end_z - pz
            trial_results[probe].append(error_mm)  # store the mm error from target
        _drop_tip_in_trash(api, cfg)
    return trial_results


@_qc_traced
def _probe_liquid_surface_by_pressure_steps(
    api: SyncHardwareAPI,
    ctx: ProtocolContext,
    mount: OT3Mount,
    lower_z: float,
    upper_z: float,
    label: str,
    primary: bool,
) -> float:
    """Move down in 0.1 mm steps and stop on a pressure excursion.

    This is intentionally separate from ``api.liquid_probe``.  The latter
    performs a continuous Z/plunger pass in firmware.  This QC variant makes
    each Z step observable and records the first step whose pressure differs
    from the local air baseline by the configured liquid threshold.
    """
    if not all(isfinite(v) for v in (lower_z, upper_z)) or lower_z >= upper_z:
        raise ValueError("Invalid liquid surface calibration limits")

    def read_pressure() -> float:
        readings = []
        for _ in range(LIQUID_PROBE_PRESSURE_SAMPLES_PER_STEP):
            value = _qc_call(api.read_stem_pressure, mount, primary)
            if not isfinite(value):
                raise _ReferenceProbeError(
                    f"{label}: non-finite pressure reading: {value}"
                )
            readings.append(value)
        return sorted(readings)[len(readings) // 2]

    current_z = _qc_call(api.gantry_position, mount, refresh=True).z
    if (
        not isfinite(current_z)
        or not lower_z < current_z <= upper_z + LIQUID_PROBE_START_HEIGHT_TOLERANCE_MM
    ):
        raise ValueError(
            f"{label}: invalid probe start height: {current_z:.6f} mm; "
            f"search limits=({lower_z:.6f}, {upper_z:.6f}] mm; "
            f"upper start tolerance={LIQUID_PROBE_START_HEIGHT_TOLERANCE_MM:.3f} mm"
        )
    ctx.comment(
        f"{label}: probe start Z={current_z:.6f} mm; "
        f"search limits=({lower_z:.6f}, {upper_z:.6f}] mm; "
        f"start minus upper={current_z - upper_z:+.6f} mm"
    )
    plunger_top, plunger_bottom, _, _ = helpers_ot3.get_plunger_positions_ot3(
        api, mount
    )
    steps = floor((current_z - lower_z + 1e-9) / LIQUID_PROBE_Z_STEP_MM)
    required_travel = steps * LIQUID_PROBE_PLUNGER_STEP_MM
    if (
        not all(isfinite(v) for v in (plunger_top, plunger_bottom))
        or steps < 1
        or plunger_bottom - plunger_top < required_travel - 1e-9
    ):
        raise ValueError(
            f"{label}: insufficient plunger travel for search: "
            f"required={required_travel:.3f} mm, "
            f"available={plunger_bottom - plunger_top:.3f} mm"
        )
    # api.liquid_probe() prepares the plunger at its top before a sensing pass
    # and then advances it while Z descends. Reproduce that behavior explicitly
    # so each 0.1 mm Z step has a pressure stimulus.
    _qc_call(
        helpers_ot3.move_plunger_absolute_ot3_sync,
        api,
        mount,
        plunger_top,
        speed=LIQUID_PROBE_PLUNGER_SPEED_MM_PER_S,
    )
    # Establish the baseline only after preparation has stopped disturbing air.
    ctx.delay(LIQUID_PROBE_BASELINE_SETTLE_SECONDS)
    baseline_window: List[float] = []
    for _ in range(LIQUID_PROBE_BASELINE_MAX_ATTEMPTS):
        baseline_window.append(read_pressure())
        baseline_window = baseline_window[-3:]
        if (
            len(baseline_window) == 3
            and max(baseline_window) - min(baseline_window)
            <= LIQUID_PROBE_BASELINE_STABILITY_PA
        ):
            break
        ctx.delay(0.1)
    else:
        raise _ReferenceProbeError(
            f"{label}: open-air pressure baseline did not stabilize"
        )
    baseline = sum(baseline_window) / len(baseline_window)
    _qc_observe(
        "liquid_reference_baseline",
        label=label,
        mount=mount,
        primary=primary,
        baseline_pa=baseline,
        samples_pa=baseline_window,
        threshold_pa=LIQUID_PROBE_PRESSURE_THRESHOLD_PA,
    )
    current_plunger = plunger_top
    ctx.comment(
        f"{label}: automatic pressure liquid probe; baseline={baseline:.2f} Pa, "
        f"threshold={LIQUID_PROBE_PRESSURE_THRESHOLD_PA:.2f} Pa"
    )
    for _ in range(steps):
        if current_z - LIQUID_PROBE_Z_STEP_MM < lower_z - 1e-9:
            break
        _qc_call(api.move_rel, mount, Point(z=-LIQUID_PROBE_Z_STEP_MM), speed=1.0)
        current_z = _qc_call(api.gantry_position, mount, refresh=True).z
        next_plunger = current_plunger + LIQUID_PROBE_PLUNGER_STEP_MM
        if next_plunger > plunger_bottom:
            raise PipetteLiquidNotFoundError(
                "Plunger travel exhausted before pressure liquid surface was found"
            )
        _qc_call(
            helpers_ot3.move_plunger_absolute_ot3_sync,
            api,
            mount,
            next_plunger,
            speed=LIQUID_PROBE_PLUNGER_SPEED_MM_PER_S,
        )
        current_plunger = next_plunger
        pressure = read_pressure()
        delta = abs(pressure - baseline)
        _qc_observe(
            "liquid_reference_step",
            label=label,
            mount=mount,
            primary=primary,
            z_mm=current_z,
            plunger_mm=current_plunger,
            pressure_pa=pressure,
            baseline_pa=baseline,
            signed_delta_pa=pressure - baseline,
        )
        ctx.comment(
            f"{label}: Z={current_z:.3f} mm, pressure={pressure:.2f} Pa, "
            f"delta={delta:.2f} Pa"
        )
        if delta >= LIQUID_PROBE_PRESSURE_THRESHOLD_PA:
            # Confirm at the same Z without another plunger impulse. A decaying
            # air transient must not become the liquid-height reference.
            ctx.delay(LIQUID_PROBE_CONFIRM_DELAY_SECONDS)
            confirmed_pressure = read_pressure()
            confirmed_delta = confirmed_pressure - baseline
            _qc_observe(
                "liquid_reference_confirmation",
                label=label,
                mount=mount,
                z_mm=current_z,
                pressure_pa=confirmed_pressure,
                signed_delta_pa=confirmed_delta,
            )
            if (
                abs(confirmed_delta) >= LIQUID_PROBE_PRESSURE_THRESHOLD_PA
                and confirmed_delta * (pressure - baseline) > 0
            ):
                ctx.comment(
                    f"{label}: liquid surface confirmed at Z={current_z:.3f} mm"
                )
                return current_z
            ctx.comment(f"{label}: transient pressure excursion rejected")
    raise PipetteLiquidNotFoundError(
        f"Pressure liquid surface not found after probing to Z={current_z:.3f} mm"
    )


class _LiquidProbeHeightError(RuntimeError):
    """A completed liquid probe returned a non-finite height."""

    def __init__(self, message: str, error_code: QCErrorCode) -> None:
        super().__init__(message)
        self.error_code = error_code


def _liquid_probe_error_code(error: Exception) -> QCErrorCode:
    if isinstance(error, PipetteLiquidNotFoundError):
        return QCErrorCode.LIQUID_SURFACE_NOT_FOUND
    if isinstance(error, _LiquidProbeHeightError):
        return error.error_code
    return QCErrorCode.LIQUID_PROBE_FAILURE


def _liquid_probe_failure_reason(error: Exception) -> str:
    if isinstance(error, PipetteLiquidNotFoundError):
        reason = "未找到液面" if LOCALIZE else "liquid surface not found"
        return f"{reason}; {error}"
    return str(error)


def _validate_liquid_probe_reading(height: float) -> None:
    """Reject invalid readings without restricting the absolute liquid height."""
    if not isfinite(height):
        raise _LiquidProbeHeightError(
            (
                f"液面高度读数无效: Z={height} mm"
                if LOCALIZE
                else f"invalid liquid surface height: Z={height} mm"
            ),
            QCErrorCode.LIQUID_SURFACE_INVALID_READING,
        )


def _record_liquid_probe_failure(
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    tip_volume: int,
    probe: InstrumentProbeType,
    reason: str,
    error_code: QCErrorCode = QCErrorCode.LIQUID_PROBE_FAILURE,
) -> None:
    """Keep existing CSV rows and mark unavailable measurements as failed."""
    prefix = f"liquid-probe-{tip_volume}-tip-{probe.name.lower()}"
    report(section, f"{prefix}-probe-precision", [None, CSVResult.FAIL])
    report(section, f"{prefix}-probe-accuracy", [None, CSVResult.FAIL])
    report(section, f"{prefix}-probe", [CSVResult.FAIL])
    channel = "1CH" if probe == InstrumentProbeType.PRIMARY else "8CH"
    message = (
        f"液面探测 / {tip_volume} uL / {channel}：{reason}；无法计算精度和准确度"
        if LOCALIZE
        else f"Liquid probe / {tip_volume} uL / {channel}: {reason}; "
        "precision and accuracy unavailable"
    )
    _remember_failure(
        report,
        section,
        f"{prefix}-probe",
        message,
        error_code=error_code,
    )
    FINAL_TEST_FAIL_INFOR.append(message)
    ctx.comment(f"FAIL: {message}")


def _liquid_probe_search_bounds() -> Tuple[float, float]:
    """Use the shared cup Labware Offset for both mounts and protect the bottom."""
    plate = LABWARE["plate"]
    if plate is None:
        raise ValueError("Liquid probe fixture is not loaded")
    top_z = plate["A1"].top().point.z
    bottom_z = plate["A1"].bottom().point.z
    lower = max(
        top_z - LIQUID_SEARCH_BELOW_TOP_MM, bottom_z + LIQUID_BOTTOM_CLEARANCE_MM
    )
    upper = top_z + LIQUID_SEARCH_ABOVE_TOP_MM
    if (
        not all(isfinite(z) for z in (bottom_z, top_z, lower, upper))
        or not bottom_z < lower < top_z < upper
    ):
        raise ValueError("Invalid liquid probe fixture geometry")
    return lower, upper


def _verified_instrument_calibration(
    api: SyncHardwareAPI, mount: OT3Mount
) -> PipetteOffsetSummary:
    """Require usable mount calibration before comparing left and right Z."""
    calibration = _qc_call(api.get_instrument_offset, mount)
    if (
        not isinstance(calibration, PipetteOffsetSummary)
        or calibration.source in (SourceType.default, SourceType.unknown)
        or calibration.last_modified is None
        or calibration.status.markedBad
        or calibration.reasonability_check_failures
        or not all(isfinite(v) for v in calibration.offset)
    ):
        raise RuntimeError(f"{mount.name}: valid pipette calibration is required")
    return calibration


def _verify_reference_instrument(api: SyncHardwareAPI) -> None:
    """Require the calibrated right P1000S only for liquid-probe testing."""
    pipette = api.hardware_pipettes.get(REFERENCE_MOUNT.to_mount())
    if (
        pipette is None
        or pipette.channels != 1
        or pipette.name != PIPETTE_API_NAMES_MAP[REFERENCE_PIPETTE_TYPE].value
    ):
        raise RuntimeError("RIGHT: mount a Flex P1000 single-channel reference pipette")
    if not pipette.pipette_id:
        raise RuntimeError("RIGHT reference pipette has no serial number")
    _verified_instrument_calibration(api, REFERENCE_MOUNT)


def _record_reference_metadata(
    api: SyncHardwareAPI, report: CSVReport, section: str, cfg: TestConfig
) -> None:
    """Record the source of the single surface used by each DUT tip group."""
    pipette = api.hardware_pipettes[REFERENCE_MOUNT.to_mount()]
    assert pipette is not None
    report(section, "reference-pipette", [REFERENCE_PIPETTE_TYPE])
    report(section, "reference-serial", [pipette.pipette_id])
    report(section, "reference-method", ["pressure steps; one A12 tip per volume"])
    for mount in (cfg.mount, REFERENCE_MOUNT):
        calibration = _qc_call(api.get_instrument_offset, mount)
        report(
            section,
            f"reference-{mount.name.lower()}-calibration",
            [json.dumps(list(calibration.offset))],
        )


@_qc_traced
def _measure_reference(
    api: SyncHardwareAPI,
    ctx: ProtocolContext,
    cfg: TestConfig,
    tip_volume: int,
) -> float:
    """Measure once with the right A12 tip, then clear the mount for the DUT."""
    tips = _available_reference_tips[tip_volume]
    if not tips:
        raise _ReferenceProbeError(f"{tip_volume} uL: right reference A12 already used")
    rack = getattr(CALIBRATED_LABWARE_LOCATIONS, f"tip_rack_{tip_volume}")
    point = CALIBRATED_LABWARE_LOCATIONS.plate_primary
    assert rack is not None and point is not None
    lower, upper = _liquid_probe_search_bounds()
    right_cfg = replace(
        cfg, mount=REFERENCE_MOUNT, pipette_channels=1, pipette_volume=1000
    )
    _qc_call(api.verify_tip_presence, REFERENCE_MOUNT, TipStateType.ABSENT)
    _qc_call(api.retract, cfg.mount)
    tip = tips.pop(0)
    label = f"RIGHT P1000S / {tip_volume} uL / {tip}"
    ctx.comment(f"{label}: calibrate liquid surface once")
    # Pickup and unexpected motion errors propagate without recovery moves.
    api.set_working_volume(REFERENCE_MOUNT, tip_volume)
    _pick_up_tip(api, REFERENCE_MOUNT, tip, rack, tip_volume=tip_volume)
    cleanup_ready = False
    try:
        try:
            _qc_call(api.verify_tip_presence, REFERENCE_MOUNT, TipStateType.PRESENT)
            _move_safe(api, REFERENCE_MOUNT, point._replace(z=upper))
            height = _probe_liquid_surface_by_pressure_steps(
                api, ctx, REFERENCE_MOUNT, lower, upper, label, primary=True
            )
            _validate_liquid_probe_reading(height)
            cleanup_ready = True
            return height
        except (
            PipetteLiquidNotFoundError,
            _LiquidProbeHeightError,
            _ReferenceProbeError,
            FailedTipStateCheck,
        ) as error:
            cleanup_ready = True
            raise _ReferenceProbeError(f"{label}: {error}") from error
    finally:
        if cleanup_ready:
            _qc_call(api.retract, REFERENCE_MOUNT)
            _drop_tip_in_trash(api, right_cfg)
            _qc_call(api.retract, REFERENCE_MOUNT)
            _qc_call(api.verify_tip_presence, REFERENCE_MOUNT, TipStateType.ABSENT)
            cfg.trash_loc_counter = right_cfg.trash_loc_counter


@_qc_traced
def _measure_dut_trials(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
    tip_vol: int,
    surface_heights: Dict[InstrumentProbeType, float],
    max_z_distance_machine_coords: float,
) -> Dict[InstrumentProbeType, List[Optional[float]]]:
    """Run three fresh-tip DUT trials against the previously acquired surface."""
    tips_attached = False
    results: Dict[InstrumentProbeType, List[Optional[float]]] = {
        probe: [] for probe in surface_heights
    }
    for trial in range(3):
        for probe in surface_heights:
            if not tips_attached:
                _pick_up_tip_for_tip_volume(api, cfg, tip_vol)
                tips_attached = True
            _move_to_above_plate_liquid(
                api, cfg.mount, probe, height_mm=LIQUID_SEARCH_ABOVE_TOP_MM
            )
            prefix = f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}"
            trial_z: Optional[float] = None
            good_probe = False
            try:
                with _qc_step(
                    "dut_liquid_probe_trial",
                    mount=cfg.mount,
                    probe=probe,
                    tip_volume_ul=tip_vol,
                    trial=trial + 1,
                ):
                    trial_z = cast(
                        float,
                        _qc_call(
                            api.liquid_probe,
                            cfg.mount,
                            max_z_distance_machine_coords,
                            probe=probe,
                        ),
                    )
                _validate_liquid_probe_reading(trial_z)
                good_probe = True
            except (PipetteLiquidNotFoundError, _LiquidProbeHeightError) as error:
                reason = _liquid_probe_failure_reason(error)
                report(section, f"{prefix}-trial-{trial}-error", [str(error)])
                _record_liquid_probe_failure(
                    report,
                    section,
                    ctx,
                    tip_vol,
                    probe,
                    (
                        f"第 {trial + 1}/3 次测量失败：{reason}"
                        if LOCALIZE
                        else f"trial {trial + 1}/3 failed: {reason}"
                    ),
                    error_code=_liquid_probe_error_code(error),
                )
            results[probe].append(trial_z if good_probe else None)
            report(
                section,
                f"{prefix}-trial-{trial}-absolute-z",
                [trial_z if good_probe else None],
            )
            report(
                section,
                f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}-probe-trial-{trial}",
                [
                    round(trial_z - surface_heights[probe], 2)
                    if trial_z is not None and isfinite(trial_z)
                    else None
                ],
            )
            if not good_probe:
                _qc_call(api.retract, cfg.mount)
                _drop_tip_in_trash(api, cfg)
                tips_attached = False
        if tips_attached:
            _drop_tip_in_trash(api, cfg)
            tips_attached = False
    return results


def _record_reference_probe_failure(
    report: CSVReport,
    ctx: ProtocolContext,
    section: str,
    tip_vol: int,
    probes: List[InstrumentProbeType],
    error: Exception,
) -> bool:
    """Keep the original unavailable-DUT grades for handled reference failures."""
    if not isinstance(error, _ReferenceProbeError):
        return False
    reason = (
        f"右侧 A12 液面校准失败：{error}；本规格左侧测量未执行"
        if LOCALIZE
        else f"Right A12 surface calibration failed: {error}; DUT trials not run"
    )
    report(section, f"liquid-probe-{tip_vol}-reference-error", [str(error)])
    for probe in probes:
        _record_liquid_probe_failure(
            report,
            section,
            ctx,
            tip_vol,
            probe,
            reason,
            error_code=_liquid_probe_error_code(error),
        )
    return True


def test_liquid_probe_new(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    """For each tip volume, measure right A12 once then test the left immediately."""
    ctx.comment("液体测试探针。" if LOCALIZE else "Test liquid probe.")
    _verify_reference_instrument(api)
    _record_reference_metadata(api, report, section, cfg)
    tip_vols = [50] if cfg.pipette_volume == 50 else [50, 200, 1000]
    # Match log.py: start 5 mm above the cup and probe down at most 15 mm.
    max_z_distance_machine_coords = (
        LIQUID_SEARCH_ABOVE_TOP_MM + LIQUID_SEARCH_BELOW_TOP_MM
    )
    probes = [InstrumentProbeType.PRIMARY]
    if cfg.pipette_channels > 1:
        probes.append(InstrumentProbeType.SECONDARY)
    if cfg.pipette_channels == 8:
        current_val = PRESSURE_THRESH_current[cfg.pipette_channels][cfg.pipette_volume][
            1
        ]
        helpers_ot3.update_pick_up_current(api, cfg.mount, current_val)
    for tip_vol in tip_vols:
        if cfg.pipette_channels == 8:
            # Calibration uses right A12; the left needs the three trial columns.
            columns = [tip[1:] for tip in _available_tips[tip_vol][:24:8]]
            if len(columns) != 3:
                raise RuntimeError("Liquid probe requires three available tip columns")
        report(section, f"liquid-probe-{tip_vol}-reference-tip", ["A12"])
        try:
            surface_z = _measure_reference(api, ctx, cfg, tip_vol)
        except Exception as error:
            handled = _record_reference_probe_failure(
                report, ctx, section, tip_vol, probes, error
            )
            _archive_reference_failure(ctx, report, cfg, tip_vol, error)
            if not handled:
                raise
            continue
        report(section, f"liquid-probe-{tip_vol}-reference-z", [surface_z])
        surface_heights = {probe: surface_z for probe in probes}
        for probe in probes:
            report(
                section,
                f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}-auto-surface-z",
                [surface_z],
            )
        ctx.comment(
            f"{tip_vol} uL: right reference Z={surface_z:.6f} mm; starting left DUT trials"
        )
        results = _measure_dut_trials(
            api,
            report,
            section,
            ctx,
            cfg,
            tip_vol,
            surface_heights,
            max_z_distance_machine_coords,
        )
        for probe, good_height in surface_heights.items():
            heights = results[probe]
            # Do not calculate a passing result from an incomplete set of trials.
            if any(h is None for h in heights):
                continue
            corrected_results = [h - good_height for h in heights if h is not None]
            precision = abs(max(corrected_results) - min(corrected_results)) * 0.5
            accuracy = sum(corrected_results) / len(corrected_results)
            prec_tag = (
                f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}-probe-precision"
            )
            acc_tag = f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}-probe-accuracy"
            tip_tag = f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}-probe"
            precision_passed = bool(
                precision < LIQUID_PROBE_ERROR_THRESHOLD_PRECISION_MM
            )
            accuracy_passed = bool(
                abs(accuracy) < LIQUID_PROBE_ERROR_THRESHOLD_ACCURACY_MM
            )
            tip_passed = precision_passed and accuracy_passed
            report(
                section, prec_tag, [precision, CSVResult.from_bool(precision_passed)]
            )
            report(section, acc_tag, [accuracy, CSVResult.from_bool(accuracy_passed)])
            report(section, tip_tag, [CSVResult.from_bool(tip_passed)])

            if not precision_passed:
                prec_tag2 = f"03-01-liquid-probe:测试液体探测,{tip_vol}ul针管{probe.name.lower()}自动点水精度{precision}结果{_bool_to_pass_fail(precision_passed)} 阈值为(<{LIQUID_PROBE_ERROR_THRESHOLD_PRECISION_MM} mm)"
                FINAL_TEST_FAIL_INFOR.append(prec_tag2)
            if not accuracy_passed:
                acc_tag2 = f"03-02-liquid-probe:测试液体探测,{tip_vol}ul针管{probe.name.lower()}自动点水准确度{accuracy}结果{_bool_to_pass_fail(accuracy_passed)} 阈值为(<{LIQUID_PROBE_ERROR_THRESHOLD_ACCURACY_MM} mm)"
                FINAL_TEST_FAIL_INFOR.append(acc_tag2)
            if not tip_passed:
                tip_tag2 = f"03-03-liquid-probe:测试液体探测,{tip_vol}ul针管{probe.name.lower()}自动点水测试结果{tip_passed}"
                FINAL_TEST_FAIL_INFOR.append(tip_tag2)


# ----------- END TEST LIQUID_PROBE -----------

# ----------- TEST ENCODER_CLEAN -----------
def build_encoder_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    lines.append(
        CSVLine(
            "diagnostics-encoder-clean",
            [CSVResult, float, float, float, float, float],
        )
    )
    return lines


def _plunger_alignment(
    api: SyncHardwareAPI, mount: OT3Mount
) -> Tuple[float, float, float, float]:
    pipette_ax = Axis.of_main_tool_actuator(mount)
    current_pos = _qc_call(api.current_position_ot3, mount, refresh=True)
    est = current_pos[pipette_ax]
    # The preceding refresh updates both motor and encoder positions.
    encoder_pos = _qc_call(api.encoder_current_position_ot3, mount, refresh=False)
    enc = encoder_pos[pipette_ax]
    stalled_mm = est - enc
    stall_detected = abs(stalled_mm) >= STALL_THRESHOLD
    return est, enc, stalled_mm, stall_detected


def test_encoder(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    """Test Liquid."""
    ctx.comment("测试编码器。" if LOCALIZE else "Test Encoder.")
    cycles = 100
    _qc_call(api.home)
    api.home_plunger(cfg.mount)
    top_pos, bottom_pos, _, _ = helpers_ot3.get_plunger_positions_ot3(api, cfg.mount)
    pipette_ax = Axis.of_main_tool_actuator(cfg.mount)
    cumulative_error = 0.0
    abs_error = 0.0
    completed_moves = 0
    cycle_count = 0
    stall = False
    max_error_mm = 0.0
    max_error_pulses = 0.0
    max_error_ticks = 0.0
    stall_reason = ""
    if isinstance(report, ProductionAssemblyReport):
        report.start_encoder_debug()
    for cycle in range(cycles):
        ctx.comment(
            f"正在运行第 {cycle} 个周期（共 {cycles} 个）"
            if LOCALIZE
            else f"Running {cycle} of {cycles}"
        )
        _qc_call(helpers_ot3.move_plunger_absolute_ot3_sync, api, cfg.mount, 0)
        init_encoder_pos = _qc_call(
            api.encoder_current_position_ot3, cfg.mount, refresh=True
        )
        prev_encoder_tick = (
            init_encoder_pos[pipette_ax] / MOTOR_MM_PER_REV * ENCODER_TICKS_PER_REV
        )
        prev_encoder_pulse = init_encoder_pos[pipette_ax] * PULSE_PER_MM
        for i in range(int((bottom_pos - top_pos) / MOTOR_MM_PER_REV)):
            try:
                _qc_call(
                    helpers_ot3.move_plunger_absolute_ot3_sync,
                    api,
                    cfg.mount,
                    (i + 1) * MOTOR_MM_PER_REV,
                )
                (
                    mot_est,
                    enc_pos,
                    diff,
                    stalled_this_move,
                ) = _plunger_alignment(api, cfg.mount)
                next_enc_tick = enc_pos / MOTOR_MM_PER_REV * ENCODER_TICKS_PER_REV
                next_enc_pulse = enc_pos * PULSE_PER_MM
                pulse_error = int(abs(next_enc_pulse - prev_encoder_pulse)) - (
                    ENCODER_TICKS_PER_REV * 4
                )
                tick_error = (
                    int(abs(next_enc_tick - prev_encoder_tick)) - ENCODER_TICKS_PER_REV
                )
                prev_encoder_pulse = next_enc_pulse
                prev_encoder_tick = next_enc_tick
                cumulative_error += diff
                abs_error += abs(diff)
                max_error_mm = max(abs(diff), max_error_mm)
                max_error_pulses = max(abs(pulse_error), max_error_pulses)
                max_error_ticks = max(abs(tick_error), max_error_ticks)
                completed_moves += 1
                if isinstance(report, ProductionAssemblyReport):
                    report.record_encoder_debug(
                        [
                            cycle,
                            i + 1,
                            "down",
                            enc_pos,
                            mot_est,
                            next_enc_pulse,
                            next_enc_tick,
                            diff,
                            pulse_error,
                            tick_error,
                        ]
                    )
                if stalled_this_move:
                    stall = True
                    stall_reason = _alignment_failure(
                        "编码器循环测试" if LOCALIZE else "Encoder cycle test",
                        mot_est,
                        enc_pos,
                        STALL_THRESHOLD,
                    )
                    break
            except StallOrCollisionDetectedError as error:
                stall = True
                stall_reason = (
                    f"编码器循环测试：固件报告堵转或碰撞；{error}"
                    if LOCALIZE
                    else f"Encoder cycle test: firmware reported a stall or collision; {error}"
                )
                break

        cycle_count += 1
        if stall:
            break
    if stall:
        _remember_failure(
            report,
            section,
            "diagnostics-encoder-clean",
            (
                f"第 {cycle_count}/{cycles} 个周期：{stall_reason}"
                if LOCALIZE
                else f"Cycle {cycle_count}/{cycles}: {stall_reason}"
            ),
            error_code=QCErrorCode.ENCODER_STALL,
        )
    report(
        section,
        "diagnostics-encoder-clean",
        [
            CSVResult.from_bool(not stall),
            cumulative_error,
            (abs_error / completed_moves) if completed_moves else None,
            max_error_mm,
            max_error_pulses,
            max_error_ticks,
        ],
    )


# ----------- END TEST ENCODER_CLEAN -----------


# ----------- TEST CURRENT/SPEED -----------
CURRENT_SPEED_DEFAULT_TRIALS = 5
CURRENT_SPEED_DEFAULT_TEST_TYPE = "standard"
CURRENT_SPEED_STALL_THRESHOLD_MM = 0.1
CURRENT_SPEED_TEST_ACCELERATION = 1500
CURRENT_SPEED_DEFAULT_ACCELERATION = DEFAULT_ACCELERATIONS.low_throughput[
    Axis.to_kind(Axis.P_L)
]
CURRENT_SPEED_DEFAULT_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[
    Axis.to_kind(Axis.P_L)
]
CURRENT_SPEED_DEFAULT_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[Axis.to_kind(Axis.P_L)]


def _current_speed_matrix(test_type: str) -> Dict[float, List[float]]:
    """Return the original current/speed matrix, including its CSV tag precision."""
    if test_type not in ("standard", "peek"):
        raise ValueError(f"Unknown current/speed test type: {test_type}")
    target_current = round(CURRENT_SPEED_DEFAULT_CURRENT * 0.75, 2)
    speeds = [
        CURRENT_SPEED_DEFAULT_SPEED - 20,
        CURRENT_SPEED_DEFAULT_SPEED,
        CURRENT_SPEED_DEFAULT_SPEED + 10,
        CURRENT_SPEED_DEFAULT_SPEED + 20,
    ]
    offsets = (
        [0.45, 0.35, 0.3, 0.25, 0.2] if test_type == "peek" else [0.45, 0.35, 0.25]
    )
    matrix = {target_current - offset: speeds for offset in offsets}
    matrix[target_current] = speeds
    matrix[CURRENT_SPEED_DEFAULT_CURRENT] = speeds
    if not 0 < target_current < CURRENT_SPEED_DEFAULT_CURRENT:
        raise ValueError(
            "Current/speed target current must be below the default current"
        )
    if min(matrix) <= 0 or max(max(matrix), 1.0) != CURRENT_SPEED_DEFAULT_CURRENT:
        raise ValueError("Current/speed test must not exceed the default run current")
    if min(speeds) <= 0:
        raise ValueError("Current/speed test requires positive speeds")
    return matrix


def _current_speed_must_pass_current(
    pipette_channels: int, serial: str, test_type: str
) -> float:
    """Keep the source script's channel-, serial-, and test-dependent limits."""
    if pipette_channels == 1:
        return 0.5
    if pipette_channels != 8:
        raise ValueError(
            "Current/speed QC supports only single- and eight-channel pipettes"
        )
    if test_type == "peek":
        return 0.45
    return 0.5 if serial.count("P") >= 2 else 0.75


def _current_speed_test_tag(
    current: float, speed: float, trial: int, direction: str, position: str
) -> str:
    return f"current-{current}-speed-trial-{trial}-{speed}-{direction}-{position}"


def _current_speed_section_tag(current: float) -> str:
    return f"CURRENT-{current}-AMPS"


def build_current_speed_report(
    trials: int, pipette_channels: int, serial: str, test_type: str
) -> CSVReport:
    """Build a separate report with the standalone current/speed CSV format."""
    if trials < 1:
        raise ValueError("Current/speed QC needs at least one trial")
    matrix = _current_speed_matrix(test_type)
    must_pass_current = _current_speed_must_pass_current(
        pipette_channels, serial, test_type
    )
    return CSVReport(
        test_name="pipette-current-speed-qc-ot3",
        sections=[
            CSVSection(
                title=_current_speed_section_tag(current),
                lines=[
                    CSVLine(
                        _current_speed_test_tag(
                            current, speed, trial, direction, position
                        ),
                        [float, float, float, float, CSVResult]
                        if current >= must_pass_current
                        else [float, float, float, float],
                    )
                    for speed in sorted(matrix[current])
                    for trial in range(trials)
                    for direction in ["down", "up"]
                    for position in ["start", "end"]
                ],
            )
            for current in sorted(matrix)
        ],
    )


@_qc_traced
def _current_speed_home_plunger(api: SyncHardwareAPI, mount: OT3Mount) -> None:
    axis = Axis.of_main_tool_actuator(mount)
    helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
        api, axis, run_current=1.0
    )
    helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
        api,
        axis,
        default_max_speed=CURRENT_SPEED_DEFAULT_SPEED / 2,
        acceleration=CURRENT_SPEED_DEFAULT_ACCELERATION,
    )
    _qc_call(api.home, [axis])


@_qc_traced
def _current_speed_record_alignment(
    api: SyncHardwareAPI,
    report: CSVReport,
    ctx: ProtocolContext,
    mount: OT3Mount,
    trial: int,
    current: float,
    speed: float,
    direction: str,
    position: str,
    force_fail: bool = False,
) -> bool:
    """Record real positions; retain a known stall failure if positions are unavailable."""
    axis = Axis.of_main_tool_actuator(mount)
    estimated: Optional[float] = None
    encoder: Optional[float] = None
    try:
        motor_positions = _qc_call(api.current_position_ot3, mount, refresh=True)
        estimated = motor_positions[axis]
        # One refresh obtains both motor and encoder positions for this observation.
        if api.is_simulator:
            encoder = estimated
        else:
            encoder = _qc_call(api.encoder_current_position_ot3, mount, refresh=False)[
                axis
            ]
    except Exception as error:
        if not force_fail:
            raise
        ctx.comment(f"Current/speed QC: could not read positions after stall: {error}")
    passed = (
        not force_fail
        and estimated is not None
        and encoder is not None
        and abs(estimated - encoder) < CURRENT_SPEED_STALL_THRESHOLD_MM
    )
    section = _current_speed_section_tag(current)
    tag = _current_speed_test_tag(current, speed, trial, direction, position)
    data: List[Any] = [
        round(current, 2),
        round(speed, 2),
        round(estimated, 2) if estimated is not None else None,
        round(encoder, 2) if encoder is not None else None,
    ]
    # Exploratory low currents deliberately have no result column in the legacy CSV.
    graded = cast(CSVLine, report[section][tag]).num_data_points == 5
    if graded:
        data.append(CSVResult.from_bool(passed))
    report(section, tag, data)
    if graded and not passed:
        direction_label = (
            ("下行" if direction == "down" else "上行") if LOCALIZE else direction
        )
        position_label = (
            ("开始" if position == "start" else "结束") if LOCALIZE else position
        )
        name = (
            f"电流/速度 / {current:.2f} A / {speed:g} mm/s / 第 {trial + 1} 次 / {direction_label}{position_label}"
            if LOCALIZE
            else f"Current/speed / {current:.2f} A / {speed:g} mm/s / trial {trial + 1} / {direction_label} {position_label}"
        )
        reason = _alignment_failure(
            name, estimated, encoder, CURRENT_SPEED_STALL_THRESHOLD_MM
        )
        if force_fail:
            reason += (
                "；固件报告堵转或碰撞，本次判定 FAIL"
                if LOCALIZE
                else "; firmware reported a stall or collision, forcing FAIL"
            )
        _remember_failure(
            report,
            section,
            tag,
            reason,
            error_code=(
                QCErrorCode.CURRENT_SPEED_STALL
                if force_fail
                else QCErrorCode.CURRENT_SPEED_ALIGNMENT_FAILED
            ),
        )
    return passed


def test_current_speed(
    api: SyncHardwareAPI,
    report: CSVReport,
    ctx: ProtocolContext,
    cfg: TestConfig,
    trials: int,
    test_type: str,
) -> None:
    """Run dry plunger current/speed QC, recovering between failed trials."""
    matrix = _current_speed_matrix(test_type)
    if trials < 1:
        raise ValueError("Current/speed QC needs at least one trial")
    if cfg.pipette_channels not in (1, 8):
        raise ValueError(
            "Current/speed QC supports only single- and eight-channel pipettes"
        )
    axis = Axis.of_main_tool_actuator(cfg.mount)
    load = api.gantry_load
    initial_settings = helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(
        api, axis, load
    )
    max_speed = max(speed for speeds in matrix.values() for speed in speeds)
    # The source script travels to the third (blow-out) position on its down stroke.
    top, _, down_target, _ = helpers_ot3.get_plunger_positions_ot3(api, cfg.mount)
    try:
        _qc_call(api.home, [Axis.Z_L, Axis.Z_R, Axis.X, Axis.Y])
        # Match the standalone script's mount reference and homed Z height.
        home_pos = _qc_call(api.gantry_position, OT3Mount.RIGHT, CriticalPoint.MOUNT)
        test_pos = helpers_ot3.get_slot_calibration_square_position_ot3(5)
        _qc_call(
            api.move_to,
            OT3Mount.RIGHT,
            test_pos._replace(z=home_pos.z),
            critical_point=CriticalPoint.MOUNT,
        )
        for current in sorted(matrix):
            for speed in sorted(matrix[current]):
                for trial in range(trials):
                    ctx.comment(
                        f"Current/speed QC: {current:.2f} A, {speed} mm/s, "
                        f"trial {trial + 1}/{trials}"
                    )
                    _current_speed_home_plunger(api, cfg.mount)
                    for direction in ["down", "up"]:
                        aligned = _current_speed_record_alignment(
                            api,
                            report,
                            ctx,
                            cfg.mount,
                            trial,
                            current,
                            speed,
                            direction,
                            "start",
                        )
                        if not aligned:
                            # The next trial homes at the normal current before moving.
                            break
                        helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
                            api, axis, run_current=current
                        )
                        helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
                            api,
                            axis,
                            default_max_speed=max_speed,
                            acceleration=CURRENT_SPEED_TEST_ACCELERATION,
                        )
                        target = down_target if direction == "down" else top + 1.0
                        try:
                            _qc_call(
                                helpers_ot3.move_plunger_absolute_ot3_sync,
                                api,
                                cfg.mount,
                                target,
                                speed=speed,
                                motor_current=current,
                                expect_stalls=True,
                            )
                        except StallOrCollisionDetectedError as error:
                            # Save the failure BEFORE homing changes the measured positions.
                            _current_speed_record_alignment(
                                api,
                                report,
                                ctx,
                                cfg.mount,
                                trial,
                                current,
                                speed,
                                direction,
                                "end",
                                force_fail=True,
                            )
                            ctx.comment(f"Current/speed QC stall: {error}")
                            _current_speed_home_plunger(api, cfg.mount)
                            break
                        aligned = _current_speed_record_alignment(
                            api,
                            report,
                            ctx,
                            cfg.mount,
                            trial,
                            current,
                            speed,
                            direction,
                            "end",
                        )
                        if not aligned:
                            break
    finally:
        # Restore both groups even if restoring the first one raises.
        try:
            helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
                api, axis, load=load, run_current=initial_settings.run_current
            )
        finally:
            helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
                api,
                axis,
                load=load,
                default_max_speed=initial_settings.max_speed,
                acceleration=initial_settings.acceleration,
            )


# ----------- END TEST CURRENT/SPEED -----------


def build_config_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    lines.append(CSVLine("operator_name", [str]))
    for s in TestSection:
        lines.append(CSVLine(f"skip_{s.value.lower().replace('-', '_')}", [bool]))
    lines.append(CSVLine("fixture_side", [str]))
    lines.append(CSVLine("fixture_aspirate_sample_count", [int]))
    lines.append(CSVLine("slot_tip_rack_1000", [int]))
    lines.append(CSVLine("slot_tip_rack_200", [int]))
    lines.append(CSVLine("slot_tip_rack_50", [int]))
    lines.append(CSVLine("slot_reservoir", [int]))
    lines.append(CSVLine("slot_plate", [int]))
    lines.append(CSVLine("slot_fixture", [int]))
    lines.append(CSVLine("slot_trash", [int]))
    for target in ("liquid_probe", "fixture"):
        for axis in "xyz":
            lines.append(CSVLine(f"{target}_offset_{axis}", [float]))
    lines.append(CSVLine("num_trials", [int]))
    lines.append(CSVLine("droplet_wait_seconds", [int]))
    lines.append(CSVLine("simulate", [bool]))
    return lines


def build_threshold_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    lines.append(CSVLine("temperature", [int, int]))
    lines.append(CSVLine("humidity", [int, int]))
    lines.append(CSVLine("capacitive-open-air", [float, float]))
    lines.append(CSVLine("capacitive-probe", [float, float]))
    lines.append(CSVLine("capacitive-square", [float, float]))
    lines.append(CSVLine("pressure-microliters-aspirated", [float]))
    lines.append(CSVLine("pressure-open-air", [float, float]))
    lines.append(CSVLine("pressure-sealed", [float, float]))
    lines.append(CSVLine("pressure-compressed", [float, float]))
    lines.append(CSVLine("probe-deck", [float]))
    lines.append(CSVLine("liquid-probe-precision", [float]))
    lines.append(CSVLine("liquid-probe-accuracy", [float]))

    return lines


def _pressure_configs(
    aspirate_sample_count: Optional[int] = None,
) -> Dict[PressureEvent, PressureEventConfig]:
    """Apply the run's holding sample count without changing shared defaults."""
    configs = {
        event: replace(config)
        for event, config in PRESSURE_FIXTURE_EVENT_CONFIGS.items()
    }
    if aspirate_sample_count is not None:
        if aspirate_sample_count < 3:
            raise ValueError("Aspirate Sample Count must be at least 3.")
        # P50 and P1000 use the same user-facing aspirate sample-count
        # parameter.  Keep both event configs in sync so the selected pipette
        # volume does not silently fall back to the default count.
        for event in (PressureEvent.ASPIRATE_P50, PressureEvent.ASPIRATE_P1000):
            configs[event].sample_count = aspirate_sample_count
    return configs


def build_pressure_cfg_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for event, config in PRESSURE_FIXTURE_EVENT_CONFIGS.items():
        lines.append(
            CSVLineRepeating(len(fields(config)), f"{event.value}", [str, float])
        )
    return lines


def build_pressure_data_csv_lines(
    pipette_channels: int,
    aspirate_sample_count: Optional[int] = None,
) -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    # The pressure fixture always returns eight channels, including for 1CH QC.
    lines.append(CSVLine("PHASE", [str for _ in range(8)]))
    for event, config in _pressure_configs(aspirate_sample_count).items():
        lines.append(
            CSVLineRepeating(
                config.sample_count,
                event.value,
                [float for _ in range(8)],
            )
        )
    return lines


def store_config(
    report: CSVReport, ctx: ProtocolContext, pipette_channels: int, pipette_volume: int
) -> None:
    """Store the config."""
    args = ctx.params.get_all()
    report("TEST-CONFIGURATIONS", "operator_name", [args["operator"]])
    for s in TestSection:
        report(
            "TEST-CONFIGURATIONS",
            f"skip_{s.value.lower().replace('-', '_')}",
            [args[f"skip_{s.value.lower().replace('-', '_')}"]],
        )
    report("TEST-CONFIGURATIONS", "fixture_side", [args["fixture_side"]])
    report(
        "TEST-CONFIGURATIONS",
        "fixture_aspirate_sample_count",
        [args["aspirate_sample_count"]],
    )
    report("TEST-CONFIGURATIONS", "slot_tip_rack_1000", [args["slot_tip_rack_1000"]])
    report("TEST-CONFIGURATIONS", "slot_tip_rack_200", [args["slot_tip_rack_200"]])
    report("TEST-CONFIGURATIONS", "slot_tip_rack_50", [args["slot_tip_rack_50"]])
    report("TEST-CONFIGURATIONS", "slot_reservoir", [args["slot_reservoir"]])
    report("TEST-CONFIGURATIONS", "slot_plate", [args["slot_plate"]])
    report("TEST-CONFIGURATIONS", "slot_fixture", [args["slot_fixture"]])
    report("TEST-CONFIGURATIONS", "slot_trash", [args["slot_trash"]])
    for target, labware_key in (("liquid_probe", "plate"), ("fixture", "fixture")):
        labware = LABWARE[labware_key]
        offset = Point()
        if labware is not None:
            core = cast(LabwareCore, labware._core)
            vector = core._engine_client.state.labware.get_labware_offset_vector(
                core.labware_id
            )
            offset = Point(vector.x, vector.y, vector.z)
        for axis in "xyz":
            name = f"{target}_offset_{axis}"
            report("TEST-CONFIGURATIONS", name, [getattr(offset, axis)])
    report("TEST-CONFIGURATIONS", "num_trials", [args["num_trials"]])
    report(
        "TEST-CONFIGURATIONS", "droplet_wait_seconds", [args["droplet_wait_seconds"]]
    )
    report("TEST-CONFIGURATIONS", "simulate", [ctx.is_simulating()])

    report("TEST-THRESHOLDS", "temperature", TEMP_THRESH)
    report("TEST-THRESHOLDS", "humidity", HUMIDITY_THRESH)
    report(
        "TEST-THRESHOLDS", "capacitive-open-air", CAP_THRESH_OPEN_AIR[pipette_channels]
    )
    report("TEST-THRESHOLDS", "capacitive-probe", CAP_THRESH_PROBE[pipette_channels])
    report("TEST-THRESHOLDS", "capacitive-square", CAP_THRESH_SQUARE[pipette_channels])
    report(
        "TEST-THRESHOLDS",
        "pressure-microliters-aspirated",
        [PRESSURE_ASPIRATE_VOL[pipette_channels][pipette_volume]],
    )
    report(
        "TEST-THRESHOLDS",
        "pressure-open-air",
        PRESSURE_THRESH_OPEN_AIR[pipette_channels][pipette_volume],
    )
    report(
        "TEST-THRESHOLDS",
        "pressure-sealed",
        PRESSURE_THRESH_SEALED[pipette_channels][pipette_volume],
    )
    report(
        "TEST-THRESHOLDS",
        "pressure-compressed",
        PRESSURE_THRESH_COMPRESS[pipette_channels][pipette_volume],
    )
    report("TEST-THRESHOLDS", "probe-deck", [PROBING_DECK_PRECISION_MM])
    report(
        "TEST-THRESHOLDS",
        "liquid-probe-precision",
        [LIQUID_PROBE_ERROR_THRESHOLD_PRECISION_MM],
    )
    report(
        "TEST-THRESHOLDS",
        "liquid-probe-accuracy",
        [
            LIQUID_PROBE_ERROR_THRESHOLD_ACCURACY_MM,
        ],
    )

    for event, config in _pressure_configs(
        cast(int, args["aspirate_sample_count"])
    ).items():
        line_ind = 0
        for f in fields(config):
            report(
                "PRESSURE-CONFIGURATIONS",
                f"{event.value}",
                [f.name, getattr(config, f.name)],
                line_ind,
            )
            line_ind += 1
    report("PRESSURE-DATA", "PHASE", [f"CH{c+1}" for c in range(8)])


class LabAssemblyReport(ProductionAssemblyReport):
    """Include the single right reference and raw left measurements in CSV."""

    def _liquid_probe_rows(self) -> Iterator[List[Any]]:
        section = TestSection.LIQUID_PROBE.value
        for line in self[section].lines:
            if (
                line.tag.startswith("reference-")
                or "-reference-" in line.tag
                or line.tag.endswith(("-auto-surface-z", "-absolute-z", "-error"))
            ):
                yield self._line_row(section, line.tag)
            for index, reason in enumerate(line.failure_reasons):
                yield self._row(
                    [f"{line.tag}-failure-reason-{index}", reason], line.timestamp
                )
        yield from super()._liquid_probe_rows()


def build_report(test_name: str, cfg: TestConfig) -> ProductionAssemblyReport:
    """Build report."""
    production_config = {
        f"skip_{s.value.lower().replace('-', '_')}": s not in cfg.tests
        for s in TestSection
    }
    production_config["skip_tip_presence"] = production_config.pop("skip_tip_sensor")
    config_values: Dict[str, Any] = {
        **production_config,
        "fixture_port": "",
        "fixture_side": cfg.fixture_side,
        "fixture_aspirate_sample_count": cfg.aspirate_sample_count,
        "slot_tip_rack_1000": cfg.slot_tip_rack_1000,
        "slot_tip_rack_200": cfg.slot_tip_rack_200,
        "slot_tip_rack_50": cfg.slot_tip_rack_50,
        "slot_reservoir": cfg.slot_reservoir,
        "slot_plate": cfg.slot_plate,
        "slot_fixture": cfg.slot_fixture,
        "slot_trash": cfg.slot_trash,
        "num_trials": cfg.num_trials,
        "droplet_wait_seconds": cfg.droplet_wait_seconds,
        "simulate": cfg.simulate,
    }
    return LabAssemblyReport(
        test_name=test_name,
        config=config_values,
        enabled_sections={s.value for s in cfg.tests},
        pipette_channels=cfg.pipette_channels,
        pipette_volume=cfg.pipette_volume,
        sections=[
            CSVSection(title="TEST-CONFIGURATIONS", lines=build_config_csv_lines()),
            CSVSection(title="TEST-THRESHOLDS", lines=build_threshold_csv_lines()),
            CSVSection(
                title="PRESSURE-CONFIGURATIONS", lines=build_pressure_cfg_csv_lines()
            ),
            CSVSection(
                title=TestSection.LIQUID.value, lines=build_liquid_csv_lines(cfg)
            ),
            CSVSection(
                title=TestSection.FIXTURE.value,
                lines=build_fixture_csv_lines(cfg.pipette_channels),
            ),
            CSVSection(
                title=TestSection.DIAGNOSTICS.value,
                lines=build_diagnostics_csv_lines(cfg.pipette_channels),
            ),
            CSVSection(
                title=TestSection.PLUNGER.value, lines=build_plunger_csv_lines()
            ),
            CSVSection(
                title=TestSection.TIP_SENSOR.value,
                lines=build_tip_csv_lines(),
            ),
            CSVSection(
                title=TestSection.LIQUID_PROBE.value,
                lines=build_liquid_probe_csv_lines(cfg),
            ),
            CSVSection(
                title=TestSection.ENCODER_CLEAN.value, lines=build_encoder_csv_lines()
            ),
            CSVSection(
                title="PRESSURE-DATA",
                lines=build_pressure_data_csv_lines(
                    cfg.pipette_channels, cfg.aspirate_sample_count
                ),
            ),
        ],
    )


TESTS = [
    # Keep manual checks together; tip allocation is independent of test order.
    (
        TestSection.DIAGNOSTICS,
        test_diagnostics,
    ),
    (
        TestSection.PLUNGER,
        test_plunger,
    ),
    (
        TestSection.LIQUID,
        test_liquid,
    ),
    (
        TestSection.ENCODER_CLEAN,
        test_encoder,
    ),
    (
        TestSection.LIQUID_PROBE,
        test_liquid_probe_new,
    ),
    (
        TestSection.FIXTURE,
        test_fixture,
    ),
    (
        TestSection.TIP_SENSOR,
        test_tip_sensor_new,
    ),
]


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    parameters.add_str(
        display_name="Pipette type",
        variable_name="pipette_type",
        default="flex_8channel_1000",
        choices=[
            {"display_name": "1-channel P50", "value": "flex_1channel_50"},
            {"display_name": "8-channel P50", "value": "flex_8channel_50"},
            {"display_name": "1-channel P1000", "value": "flex_1channel_1000"},
            {"display_name": "8-channel P1000", "value": "flex_8channel_1000"},
        ],
        description="Pipette mounted on the left mount; used during protocol analysis.",
    )
    parameters.add_str(
        display_name="QC test mode",
        variable_name="qc_mode",
        default="both",
        choices=[
            {"display_name": "Assembly QC", "value": "assembly_qc"},
            {"display_name": "Current / speed", "value": "current_speed"},
            {"display_name": "Current / speed + assembly", "value": "both"},
        ],
        description="Select QC tests; both requires current/speed to pass before assembly.",
    )
    parameters.add_str(
        display_name="Current / speed test type",
        variable_name="current_speed_test_type",
        default=CURRENT_SPEED_DEFAULT_TEST_TYPE,
        choices=[
            {"display_name": "Standard", "value": "standard"},
            {"display_name": "PEEK", "value": "peek"},
        ],
        description="Current/speed tests only: Standard or PEEK current ranges and pass criteria.",
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
        description="Unused keeps CSV local; failure logs still upload to the production server.",
    )
    for s in TestSection:
        parameters.add_bool(
            display_name=f"Skip {s.value.lower()}",
            variable_name=f"skip_{s.value.lower().replace('-', '_')}",
            default=False,
            description=f"When this is true the robot will not test {s.value.lower()}",
        )
    parameters.add_str(
        display_name="fixture side",
        variable_name="fixture_side",
        default="left",
        choices=[
            {"display_name": "left", "value": "left"},
            {"display_name": "right", "value": "right"},
        ],
        description="Which side the pressure fixture is on.",
    )
    parameters.add_int(
        display_name="Number of trials",
        variable_name="num_trials",
        minimum=1,
        maximum=7,
        default=2,
        description="Number of trials to run.",
    )
    parameters.add_int(
        display_name="Aspirate Sample Count",
        variable_name="aspirate_sample_count",
        minimum=3,
        maximum=1200,
        default=DEFAULT_PRESSURE_SAMPLE_COUNT_DURING_ASPIRATE,
        description="Aspirate Sample Count.",
    )
    parameters.add_int(
        display_name="Droplet Wait seconds",
        variable_name="droplet_wait_seconds",
        minimum=1,
        maximum=100,
        default=30,
        description="Droplet Wait seconds.",
    )
    parameters.add_int(
        display_name="1000ul tiprack slot",
        variable_name="slot_tip_rack_1000",
        minimum=1,
        maximum=12,
        default=DEFAULT_SLOT_TIP_RACK_1000,
        description="The deck slot the 1000ul tips are in",
    )
    parameters.add_int(
        display_name="200ul tiprack slot",
        variable_name="slot_tip_rack_200",
        minimum=1,
        maximum=12,
        default=DEFAULT_SLOT_TIP_RACK_200,
        description="The deck slot the 200ul tips are in",
    )
    parameters.add_int(
        display_name="50ul tiprack slot",
        variable_name="slot_tip_rack_50",
        minimum=1,
        maximum=12,
        default=DEFAULT_SLOT_TIP_RACK_50,
        description="The deck slot the 50ul tips are in",
    )
    parameters.add_int(
        display_name="Reservoir slot",
        variable_name="slot_reservoir",
        minimum=1,
        maximum=12,
        default=DEFAULT_SLOT_RESERVOIR,
        description="The deck slot the reservoir is in",
    )
    parameters.add_int(
        display_name="Liquid Probe slot",
        variable_name="slot_plate",
        minimum=1,
        maximum=12,
        default=DEFAULT_SLOT_LIQUID_PROBE,
        description="The deck slot liquid probe fixture is in",
    )
    parameters.add_int(
        display_name="Pressure Fixture slot",
        variable_name="slot_fixture",
        minimum=1,
        maximum=12,
        default=DEFAULT_SLOT_FIXTURE,
        description="The deck slot the pressure fixture is in",
    )
    parameters.add_int(
        display_name="Trash slot",
        variable_name="slot_trash",
        minimum=1,
        maximum=12,
        default=DEFAULT_SLOT_TRASH,
        description="The deck slot the trash is in",
    )


def _fixture_tips_for_channels(pipette_channels: int) -> List[str]:
    """Build fixture tip order.

    Single-channel fixture testing uses A1 for the open-air pressure check,
    then A2 for the fixture pressure check, followed by the rest of row A.
    """
    if pipette_channels == 1:
        a_row = [f"A{col}" for col in range(1, 13)]
        remaining_rows = [f"{row}{col}" for col in range(1, 13) for row in "BCDEFGH"]
        return a_row + remaining_rows
    return [f"{row}{col + 1}" for col in range(12) for row in "ABCDEFGH"]


def _reference_tip_volumes(cfg: TestConfig) -> Tuple[int, ...]:
    """Reserve right A12 only for tip sizes whose liquid probes will be tested."""
    if TestSection.LIQUID_PROBE not in cfg.tests:
        return ()
    return (50,) if cfg.pipette_volume == 50 else (50, 200, 1000)


def _reset_available_tip(
    pipette_channels: int, reference_tip_volumes: Tuple[int, ...] = ()
) -> None:
    for tip_size in [50, 200, 1000]:
        _available_tips[tip_size] = [
            f"{row}{col + 1}" for col in range(12) for row in "ABCDEFGH"
        ]
        _available_reference_tips[tip_size] = []
        if tip_size in reference_tip_volumes:
            # Only reserve the reference tip (or its whole 8-channel pickup group).
            _available_tips[tip_size] = [
                tip
                for tip in _available_tips[tip_size]
                if (tip != "A12" if pipette_channels == 1 else tip[1:] != "12")
            ]
            _available_reference_tips[tip_size] = ["A12"]
        _available_tips_fixture[tip_size] = _fixture_tips_for_channels(pipette_channels)


def _preflight_devices(
    api: SyncHardwareAPI, ctx: ProtocolContext, cfg: TestConfig, devices: ExitStack
) -> None:
    """Check external devices before any QC motion and retain their connections."""
    ctx.comment("正在检查测试设备。" if LOCALIZE else "Checking QC devices.")
    if TestSection.LIQUID_PROBE in cfg.tests:
        _verify_reference_instrument(api)
        _qc_call(api.verify_tip_presence, REFERENCE_MOUNT, TipStateType.ABSENT)
    if not api.attached_peripherals:
        raise RuntimeError(
            "未识别到扫码枪，请检查 USB 连接后重试。"
            if LOCALIZE
            else "No barcode scanner detected. Check its USB connection before QC."
        )
    # Reserve the actual ports, including aliases, so discovery cannot reopen
    # a connected device even when it shares a USB adapter model with a fixture.
    excluded_ports = [device.port for device in api.attached_peripherals]
    excluded_ports.extend(module.port for module in api.attached_modules)
    if TestSection.DIAGNOSTICS in cfg.tests:
        cfg.env_sensor, env_port = asair_sensor.BuildAsairSensorWithPort(
            cfg.simulate, strict=True
        )
        if isinstance(cfg.env_sensor, asair_sensor.AsairSensor):
            devices.callback(cfg.env_sensor.close)
        if env_port is not None:
            excluded_ports.append(env_port)
    if TestSection.FIXTURE in cfg.tests:
        cfg.pressure_fixture = connect_to_fixture(
            cfg.simulate,
            side=cfg.fixture_side,
            strict=True,
            excluded_ports=excluded_ports,
        )
        devices.callback(cfg.pressure_fixture.disconnect)
        sample = cfg.pressure_fixture.read_all_pressure_channel()
        if len(sample) != 8 or not all(isfinite(p) for p in sample):
            raise RuntimeError(
                "Pressure fixture preflight: expected eight finite readings."
            )
    ctx.comment("设备检查通过。" if LOCALIZE else "QC device checks passed.")


def _load_analysis_pipette(ctx: ProtocolContext) -> None:
    """Declare the selected pipette during protocol analysis."""
    pipette_type = ctx.params.pipette_type  # type: ignore[attr-defined]
    if pipette_type not in PIPETTE_TYPES:
        raise ValueError(f"Unsupported pipette type: {pipette_type}")
    ctx.load_instrument(pipette_type, "left")
    if ctx.params.qc_mode in ("assembly_qc", "both") and not ctx.params.skip_liquid_probe:  # type: ignore[attr-defined]
        ctx.load_instrument(REFERENCE_PIPETTE_TYPE, "right")


def _copy_qc_report_metadata(source: CSVReport, target: CSVReport) -> None:
    """Reuse DUT verification without changing either report's name or run ID."""
    for line in source["META_DATA"].lines:
        if line.tag not in ("test_name", "test_run_id", "test_time_utc", "test_tag"):
            target("META_DATA", line.tag, list(line.data))
    target.set_tag(cast(CSVLine, source["META_DATA"]["test_tag"]).data[0])


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


def _failure_error_codes(reasons: List[str]) -> List[str]:
    """Normalize the current localized labels to stable enum values."""
    labels = {code.value: code.value for code in QCErrorCode}
    labels.update(
        {
            _with_error_code(code, "").split("]", 1)[0][1:]: code.value
            for code in QCErrorCode
        }
    )
    return list(
        dict.fromkeys(
            labels.get(reason.split("]", 1)[0][1:], "QC_TEST_FAILED")
            for reason in reasons
            if reason.startswith("[") and "]" in reason
        )
    )


def _failure_code_from_tag(tag: str) -> str:
    """Classify an explicitly failed row by its test, without inferring a cause."""
    if tag.startswith("liquid-probe-"):
        if tag.endswith("-precision"):
            return QCErrorCode.LIQUID_PROBE_PRECISION_OUT_OF_RANGE.value
        if tag.endswith("-accuracy"):
            return QCErrorCode.LIQUID_PROBE_ACCURACY_OUT_OF_RANGE.value
        return QCErrorCode.LIQUID_PROBE_FAILURE.value
    prefixes = {
        "celsius-": QCErrorCode.ENVIRONMENT_TEMPERATURE_OUT_OF_RANGE,
        "humidity-": QCErrorCode.ENVIRONMENT_HUMIDITY_OUT_OF_RANGE,
        "pressure-open-air-": QCErrorCode.PRESSURE_VALUE_OUT_OF_RANGE,
        "pressure-sealed-": QCErrorCode.PRESSURE_VALUE_OUT_OF_RANGE,
        "pressure-compressed-": QCErrorCode.PRESSURE_VALUE_OUT_OF_RANGE,
        "capacitive-open-air-": QCErrorCode.CAPACITIVE_VALUE_OUT_OF_RANGE,
        "capacitive-probe-S": QCErrorCode.CAPACITIVE_VALUE_OUT_OF_RANGE,
        "capacitive-square-": QCErrorCode.CAPACITIVE_VALUE_OUT_OF_RANGE,
        "encoder-home": QCErrorCode.ENCODER_ALIGNMENT_FAILED,
        "encoder-move": QCErrorCode.ENCODER_ALIGNMENT_FAILED,
        "droplets-": QCErrorCode.LIQUID_LEAK_DETECTED,
        "plunger-": QCErrorCode.PLUNGER_POSITION_INCORRECT,
    }
    return next(
        (code.value for prefix, code in prefixes.items() if tag.startswith(prefix)),
        QCErrorCode.TEST_FAILED.value,
    )


def _failure_report_rows(report: Optional[CSVReport]) -> List[Dict[str, Any]]:
    """Export measurements, including ungraded samples and unwritten rows."""
    rows: List[Dict[str, Any]] = []
    if report is None:
        return rows
    # CSVReport exposes lookup by section title, but no public section iterator.
    for section in report._sections:
        indices: Dict[str, int] = {}
        for line in section.lines:
            index = indices.get(line.tag, 0)
            indices[line.tag] = index + 1
            recorded = any(value is not None for value in line.data)
            reasons = list(line.failure_reasons)
            codes = _failure_error_codes(reasons)
            if line.result_passed is False and not codes:
                codes = [
                    "QC_BARCODE_MISMATCH"
                    if line.tag == "test_device_id"
                    else _failure_code_from_tag(line.tag)
                ]
            rows.append(
                {
                    "section": section.title,
                    "tag": line.tag,
                    "index": index,
                    "evidence_id": f"{section.title}/{line.tag}[{index}]",
                    "record_status": "recorded" if recorded else "not_recorded",
                    "result": (
                        "FAIL"
                        if line.result_passed is False
                        else "PASS"
                        if line.result_passed is True
                        else "unknown"
                    ),
                    "data": _failure_json_value(line.data),
                    "elapsed_seconds": line.timestamp,
                    "failure_reasons": reasons,
                    "error_codes": codes,
                }
            )
    return rows


def _failure_recommendations(
    rows: List[Dict[str, Any]],
    failure_details: List[str],
    exception_traceback: Optional[str],
) -> List[Dict[str, Any]]:
    """Suggest evidence-based checks; a failed test does not identify a bad part."""
    candidates = [
        (
            row["evidence_id"],
            row["section"] + "/" + row["tag"] + " " + " ".join(row["failure_reasons"]),
        )
        for row in rows
        if row["result"] == "FAIL" and row["section"] != "RESULTS_OVERVIEW"
    ]
    candidates.extend(("failure_details", detail) for detail in failure_details)
    if exception_traceback:
        candidates.append(("exception_traceback", exception_traceback))
    rules = [
        (
            "software_configuration",
            ("unexpected keyword argument", "requested status for sensor"),
            "核对协议、公共函数和机器人软件版本，以及实际型号支持的传感器调用。",
            "版本或调用修正后，重新运行原失败步骤及完整 QC。",
        ),
        (
            "overpressure",
            ("pipetteoverpressure", "exceeded operational limits", "压力超限"),
            "结合失败前动作检查探针安装、吸头和气路状态；核对回零及柱塞运动。未知触发压力不能用最近读数代替。",
            "确认原因并处理后，复测原失败阶段及压力相关项目；保留压力保护。",
        ),
        (
            "barcode",
            ("test_device_id", "barcode_mismatch"),
            "核对设备读取编号、扫码内容和装配记录。",
            "编号一致后重新验证元数据及完整 QC。",
        ),
        (
            "plunger_travel_setup",
            ("insufficient plunger travel", "insufficient remaining plunger", "柱塞行程不足"),
            "核对点水前柱塞位置、可用行程和预充气参数，并结合实际动作记录检查是否存在运动异常；当前证据不足以判定零件故障。",
            "确认行程条件后复测原失败动作和对应液面探测项目。",
        ),
        (
            "environment",
            (
                "celsius-",
                "humidity-",
                "environment_temperature",
                "environment_humidity",
                "温度超出范围",
                "湿度超出范围",
            ),
            "先确认环境温湿度稳定、传感器已充分适应现场，再与外部已确认正常的温湿度读数对比。",
            "环境稳定后按原温湿度范围复测，并复测受环境影响的项目。",
        ),
        (
            "liquid_probe",
            (
                "liquid-probe",
                "liquid_probe",
                "liquid_surface",
                "liquidnotfound",
                "液面",
            ),
            "检查右侧参考液面、校准偏移、吸头安装及逐次探测值；用已确认正常的吸头复测。",
            "复测相同吸头规格的参考点水和左侧全部试验，按原准确度及重复性标准判定。",
        ),
        (
            "diagnostic_pressure",
            (
                "pressure-open-air",
                "pressure-sealed",
                "pressure-compressed",
                "diagnostic-pressure",
                "空气中气压",
                "封堵吸头气压",
                "吸液后气压",
            ),
            "对照空气、封堵和吸液阶段的压力及通道读数，检查诊断吸头安装、堵孔状态和气路；保留现有压力保护。",
            "按原诊断压力范围复测空气、封堵及吸液阶段，不将此结果等同于夹具泄漏判定。",
        ),
        (
            "pressure_fixture",
            (
                "fixture",
                "pressure-pre",
                "pressure-insert",
                "pressure-holding",
                "pressure-dispensed",
                "pressure-post",
                "夹具",
            ),
            "先检查吸头、夹具和连接密封，再按异常通道及完整压力变化检查气路。",
            "复测对应压力事件及整组夹具测试，按原范围、稳定性和压差标准判定。",
        ),
        (
            "encoder_motion",
            ("encoder", "current_speed", "current-speed", "stall", "编码器"),
            "核对运动前后电机与编码器位置、方向及阻力，结合 encoder CSV 检查偏差。",
            "处理确认的问题后，按原阈值复测编码器及相关电流速度项目。",
        ),
        (
            "capacitance",
            ("capacitive", "capacitance", "calibrationstructurenotfound", "电容"),
            "核对探针型号、安装确认、校准结构及校准前后读数。",
            "复测空气、探针、方块处电容及校准重复性，按原阈值判定。",
        ),
        (
            "tip_sensor",
            ("tip-sensor", "tip_pickup", "tip_drop", "tip-presence", "吸头传感器"),
            "检查取退头动作、安装一致性和触发位置。",
            "复测原取头和退头传感器项目，按原位置标准判定。",
        ),
        (
            "liquid_leak",
            ("droplets", "liquid_leak", "漏液"),
            "核对操作员判定和等待时长，先检查吸头密封，再检查对应通道气路。",
            "按原体积及等待时间复测漏液，并复测相关压力项目。",
        ),
        (
            "plunger_position",
            ("plunger", "柱塞"),
            "核对 BLOW-OUT 或 DROP-TIP 实际位置及装配状态。",
            "复测原柱塞位置确认项目及相关取退头动作。",
        ),
    ]
    recommendations: Dict[str, Dict[str, Any]] = {}
    for source, text in candidates:
        normalized = text.lower()
        matched = next(
            (rule for rule in rules if any(token in normalized for token in rule[1])),
            ("unclassified", (), "结合原始异常和最后动作复核运行配置及现场。", "原因确认后复测原失败步骤及完整 QC。"),
        )
        category, _, checks, retest = matched
        item = recommendations.setdefault(
            category,
            {
                "category": category,
                "status": (
                    "confirmed_configuration_issue"
                    if category == "software_configuration"
                    and "unexpected keyword argument" in normalized
                    else "needs_confirmation"
                ),
                "evidence": [],
                "next_checks": [checks],
                "retest": retest,
            },
        )
        item["evidence"].append({"source": source, "detail": text})
    return list(recommendations.values())


def _failure_bundle(
    report: Optional[CSVReport],
    report_mode: str,
    failure_details: List[str],
    exception_traceback: Optional[str],
    stage: str,
    parameters: Dict[str, Any],
    completed_modes: List[str],
) -> Dict[str, Any]:
    """Collect a failure record without querying or moving any hardware."""
    trace: Dict[str, Any] = {}
    trace_error: Optional[str] = None
    try:
        if _ACTIVE_QC_TRACE is not None:
            trace = _ACTIVE_QC_TRACE.snapshot()
    except Exception as error:
        trace_error = f"{type(error).__name__}: {error}"
    report_run_id = None
    report_error: Optional[str] = None
    rows: List[Dict[str, Any]] = []
    try:
        if report is not None:
            report_run_id = cast(CSVLine, report["META_DATA"]["test_run_id"]).data[0]
        rows = _failure_report_rows(report)
    except Exception as error:
        report_error = f"{type(error).__name__}: {error}"
    runtime_detail = next(
        (
            detail[len("[QC_RUNTIME_ERROR] ") :]
            for detail in failure_details
            if detail.startswith("[QC_RUNTIME_ERROR] ")
        ),
        None,
    )
    return {
        "schema_version": 1,
        "runtime_error": {
            "type": runtime_detail.split(":", 1)[0],
            "message": runtime_detail.split(":", 1)[1].strip()
            if ":" in runtime_detail
            else runtime_detail,
        }
        if runtime_detail
        else None,
        "run_id": trace.get("run_id") or report_run_id or data_io.create_run_id(),
        "report_run_id": report_run_id,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "mode": report_mode,
        "stage": stage,
        "completed_modes": list(completed_modes),
        "parameters": _failure_json_value(parameters),
        "failure_details": list(failure_details),
        "exception_traceback": exception_traceback,
        "trace": trace,
        "trace_error": trace_error,
        "report_rows": rows,
        "report_extraction_error": report_error,
        "interpretation": {
            "unknown": "No explicit PASS/FAIL assessment was recorded.",
            "not_recorded": "No row values were recorded; this does not mean PASS.",
            "test_execution_status": "Use trace.tests for skipped/not-started/exception states; row absence alone cannot distinguish them.",
            "thresholds": "See TEST-THRESHOLDS rows and the original failure reasons; raw samples are not independently graded.",
            "pressure": "Latest sampled readings are not necessarily the trigger-time pressure; unavailable trigger values remain unknown.",
        },
        "recommendations": _failure_recommendations(
            rows, failure_details, exception_traceback
        ),
        "artifacts": [],
    }


def _failure_log_contents(
    report: Optional[CSVReport],
    report_mode: str,
    failure_details: List[str],
    exception_traceback: Optional[str],
    stage: str,
    parameters: Dict[str, Any],
    completed_modes: List[str],
) -> str:
    """Render the same complete evidence as the structured failure record."""
    bundle = _failure_bundle(
        report,
        report_mode,
        failure_details,
        exception_traceback,
        stage,
        parameters,
        completed_modes,
    )
    return _render_failure_log(bundle)


def _render_failure_log(bundle: Dict[str, Any]) -> str:
    """Use one snapshot for the readable and structured evidence files."""
    trace = bundle["trace"]
    report_mode = bundle["mode"]
    stage = bundle["stage"]
    completed_modes = bundle["completed_modes"]
    parameters = bundle["parameters"]
    failure_details = bundle["failure_details"]
    exception_traceback = bundle["exception_traceback"]
    lines = [
        f"Time UTC: {bundle['created_at_utc']}",
        f"Run ID: {bundle['run_id']}",
        f"QC mode: {report_mode}",
        f"Stage: {stage}",
        f"Completed modes: {', '.join(completed_modes) or 'none'}",
        "Failure archive directory: "
        + json.dumps(bundle.get("archive_directory", {}), ensure_ascii=False),
        "Run parameters: " + json.dumps(parameters, ensure_ascii=False, default=str),
        "",
        "Failure details:",
        *(f"- {detail}" for detail in failure_details),
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
        "Checks and retest recommendations (unconfirmed causes are not part diagnoses):",
        json.dumps(bundle["recommendations"], ensure_ascii=False, indent=2),
        "",
        "All report rows (unknown or not_recorded does not mean PASS):",
    ]
    for row in bundle["report_rows"]:
        lines.append(json.dumps(row, ensure_ascii=False))
    if bundle["report_run_id"] is None:
        lines.append("CSV report: not created; failure occurred before testing")
    if bundle["report_extraction_error"]:
        lines.append("Report extraction error: " + bundle["report_extraction_error"])
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
    if exception_traceback:
        lines.extend(["", "Exception traceback:", exception_traceback.rstrip()])
    return "\n".join(lines) + "\n"


def _failure_log_comment(ctx: ProtocolContext, message: str) -> None:
    """Keep logging usable if the protocol engine can no longer accept comments."""
    try:
        ctx.comment(message)
    except Exception:
        print(message)


def _failure_log_path(report: Optional[CSVReport], report_mode: str) -> Path:
    """Use the report filename when available, otherwise create a startup log."""
    if report is not None:
        try:
            return report.file_path.with_suffix(".log")
        except RuntimeError:
            parent = report.parent
    else:
        test_parent = data_io.create_folder_for_test_data("pipette-assembly-qc-ot3")
        parent = data_io.create_folder_for_test_data(
            test_parent / data_io.create_run_id()
        )
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    return parent / f"qc-{report_mode}-{stamp}.log"


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


def _upload_saved_failure_bundle(ctx: ProtocolContext, bundle: Dict[str, Any]) -> None:
    """Upload a local snapshot and checkpoint each attachment's transfer status."""
    attachments = bundle["artifacts"]
    manifest = next(item for item in attachments if item["role"] == "manifest")
    for artifact in attachments:
        if artifact["role"] != "manifest" and artifact["upload_status"] == "pending":
            _upload_failure_bundle_artifact(ctx, artifact)
    manifest["upload_status"] = "pending_self_upload"
    if _write_failure_manifest(ctx, bundle, manifest):
        _upload_failure_bundle_artifact(ctx, manifest)
    # Retry the local checkpoint even when the pre-upload JSON write failed.
    # Never turn an actual completed upload into a claimed transport failure.
    _write_failure_manifest(ctx, bundle, manifest)


def _upload_pending_reference_failures(
    ctx: ProtocolContext, report: Optional[CSVReport]
) -> None:
    """Drain this report's reference snapshots at the unified archive stage."""
    if report is None:
        return
    pending = getattr(report, "_qc_pending_reference_failures", [])
    setattr(report, "_qc_pending_reference_failures", [])
    for bundle in pending:
        try:
            _upload_saved_failure_bundle(ctx, bundle)
        except Exception as error:
            _failure_log_comment(ctx, f"Deferred reference upload failed: {error}")


def _archive_failed_report(
    ctx: ProtocolContext,
    report: Optional[CSVReport],
    report_mode: str,
    failure_details: List[str],
    exception_traceback: Optional[str] = None,
    *,
    stage: str = "result-summary",
    parameters: Optional[Dict[str, Any]] = None,
    completed_modes: Optional[List[str]] = None,
    artifact_suffix: str = "",
    defer_upload: bool = False,
) -> Optional[Path]:
    """Save evidence; optionally defer reference transfers to the unified archive."""
    if not defer_upload:
        _upload_pending_reference_failures(ctx, report)
    try:
        log_path = _failure_log_path(report, report_mode)
        if artifact_suffix:
            log_path = log_path.with_name(f"{log_path.stem}{artifact_suffix}.log")
        bundle = _failure_bundle(
            report,
            report_mode,
            failure_details,
            exception_traceback,
            stage,
            parameters or {},
            completed_modes or [],
        )
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
        if report is not None:
            _copy_failure_encoder_csv(report, log_path, bundle)
        for artifact in attachments:
            artifact["remote_subdir"] = bundle["archive_directory"]["remote_subdir"]
        manifest = next(item for item in attachments if item["role"] == "manifest")
        bundle["manifest_upload_note"] = (
            "The server copy records pending_self_upload for this manifest; it cannot attest to its own completed transfer. "
            "The local manifest and run comments record the actual final upload result."
        )
        _write_failure_manifest(ctx, bundle, manifest)
    except Exception as error:
        _failure_log_comment(
            ctx, f"{report_mode} failure bundle could not be written: {error}"
        )
        return None
    _failure_log_comment(ctx, f"{report_mode} failure log saved locally: {log_path}")
    if defer_upload and report is not None:
        pending = getattr(report, "_qc_pending_reference_failures", [])
        pending.append(bundle)
        setattr(report, "_qc_pending_reference_failures", pending)
    else:
        _upload_saved_failure_bundle(ctx, bundle)
    return log_path


def _archive_reference_failure(
    ctx: ProtocolContext,
    report: CSVReport,
    cfg: TestConfig,
    tip_volume: int,
    error: Exception,
) -> None:
    """Save right-reference evidence locally for the DUT's unified upload."""
    if cfg.simulate:
        return
    try:
        detail = "".join(
            traceback.format_exception(type(error), error, error.__traceback__)
        )
        handled = isinstance(error, _ReferenceProbeError)
        _qc_event(
            "right_reference_failure",
            mount=REFERENCE_MOUNT,
            tip_volume_ul=tip_volume,
            handled=handled,
            error=f"{type(error).__name__}: {error}",
            exception_traceback=detail,
        )
        _archive_failed_report(
            ctx,
            report,
            "assembly_qc",
            [
                f"[{'QC_REFERENCE_ERROR' if handled else 'QC_RUNTIME_ERROR'}] "
                f"{type(error).__name__}: {error}",
                f"RIGHT P1000S / {tip_volume} uL / A12: "
                f"{type(error).__name__}: {error}; DUT trials for this tip volume not run",
            ],
            detail,
            stage=f"right-reference-{tip_volume}ul",
            parameters=ctx.params.get_all(),
            artifact_suffix=f".right-reference-{tip_volume}ul",
            defer_upload=True,
        )
    except Exception as archive_error:
        _failure_log_comment(
            ctx,
            f"Right reference failure snapshot could not be archived: {archive_error}; "
            f"original error: {error}",
        )


def _archive_runtime_failure(
    ctx: ProtocolContext, state: _QCFailureContext, error: Exception
) -> None:
    """Checkpoint partial results while preserving the original exception traceback."""
    try:
        if _ACTIVE_QC_TRACE is not None:
            for test in getattr(_ACTIVE_QC_TRACE, "tests", {}).values():
                if test.get("status") == "not_started":
                    test["status"] = "not_run_due_to_previous_failure"
                    test["blocking_stage"] = state.stage
    except Exception as logging_error:
        _failure_log_comment(
            ctx, f"Could not update unexecuted test states: {logging_error}"
        )
    exception_traceback = "".join(
        traceback.format_exception(type(error), error, error.__traceback__)
    )
    if state.cleanup_traceback:
        exception_traceback += (
            "\nAdditional device-cleanup failure (original QC exception preserved):\n"
            + state.cleanup_traceback
        )
    details = [f"[QC_RUNTIME_ERROR] {type(error).__name__}: {error}"]
    if state.report is not None:
        try:
            state.report.save_to_disk()
        except Exception as save_error:
            details.append(f"CSV checkpoint failed: {save_error}")
        if state.config is not None:
            try:
                details.extend(_qc_failure_details(state.report, state.config))
            except Exception as detail_error:
                details.append(f"Failure summary unavailable: {detail_error}")
    _archive_failed_report(
        ctx,
        state.report,
        state.report_mode,
        details,
        exception_traceback,
        stage=state.stage,
        parameters=state.parameters,
        completed_modes=state.completed_modes,
    )


@contextmanager
def _qc_devices(state: _QCFailureContext) -> Iterator[ExitStack]:
    """Close every device without replacing an exception from the active QC stage."""
    with ExitStack() as devices:
        try:
            yield devices
        except Exception:
            try:
                devices.close()
            except Exception:
                state.cleanup_traceback = traceback.format_exc()
            raise


def _run_qc(ctx: ProtocolContext, state: _QCFailureContext) -> Tuple[List[str], bool]:
    """Execute selected modes; the entry point owns runtime failure logging."""
    log_input_versions()
    args = ctx.params.get_all()
    state.parameters = dict(args)
    mode = args.get("qc_mode", "both")
    if not isinstance(mode, str) or mode not in (
        "assembly_qc",
        "current_speed",
        "both",
    ):
        raise ValueError(f"Unknown QC test mode: {mode}")
    run_assembly = mode in ("assembly_qc", "both")
    run_current_speed = mode in ("current_speed", "both")
    state.report_mode = mode
    state.stage = "configuration"
    _qc_event("stage", name=state.stage)
    current_speed_test_type = cast(
        str, args.get("current_speed_test_type", CURRENT_SPEED_DEFAULT_TEST_TYPE)
    )
    if run_current_speed:
        # Validate the selected current profile before any hardware access.
        _current_speed_matrix(current_speed_test_type)
    t_sections = {
        s: f
        for s, f in TESTS
        if run_assembly and not args[f"skip_{s.value.lower().replace('-', '_')}"]
    }
    config = TestConfig(
        simulate=ctx.is_simulating(),
        tests=t_sections,
        fixture_side=ctx.params.fixture_side,  # type: ignore[attr-defined]
        aspirate_sample_count=ctx.params.aspirate_sample_count,  # type: ignore[attr-defined]
        slot_tip_rack_1000=ctx.params.slot_tip_rack_1000,  # type: ignore[attr-defined]
        slot_tip_rack_200=ctx.params.slot_tip_rack_200,  # type: ignore[attr-defined]
        slot_tip_rack_50=ctx.params.slot_tip_rack_50,  # type: ignore[attr-defined]
        slot_reservoir=ctx.params.slot_reservoir,  # type: ignore[attr-defined]
        slot_plate=ctx.params.slot_plate,  # type: ignore[attr-defined]
        slot_fixture=ctx.params.slot_fixture,  # type: ignore[attr-defined]
        slot_trash=ctx.params.slot_trash,  # type: ignore[attr-defined]
        num_trials=ctx.params.num_trials,  # type: ignore[attr-defined]
        droplet_wait_seconds=ctx.params.droplet_wait_seconds,  # type: ignore[attr-defined]
        pipette_channels=PIPETTE_TYPES[
            cast(str, args.get("pipette_type", "flex_8channel_1000"))
        ][0],
        pipette_volume=PIPETTE_TYPES[
            cast(str, args.get("pipette_type", "flex_8channel_1000"))
        ][1],
        mount=OT3Mount.LEFT,
        trash_loc_counter=0,
    )
    state.config = config

    _qc_initialize_tests(args, t_sections, run_current_speed)

    if config.simulate:
        # Declare the selected pipette during protocol analysis.
        _load_analysis_pipette(ctx)
        if run_assembly:
            _load_labware_locations(config, ctx)
        ctx.comment("QC setup analyzed; hardware tests run only on the robot.")
        return [], False

    state.stage = "hardware-initialization"
    _qc_event("stage", name=state.stage)
    OT3API._get_tip_status = _get_tip_status_patch  # type: ignore[attr-defined]
    OT3API._calibrate_pipette = _calibrate_pipette_patch  # type: ignore[attr-defined]
    api = ctx._core.get_hardware()
    _qc_capture_identity(api)
    _qc_call(api.reset)

    test_name = "pipette-assembly-qc-ot3"

    # The selected protocol parameter is the single source of pipette shape.
    # ``ctx.load_instrument()`` in the analysis branch creates the instrument
    # requirement; the engine checks the attached instrument before execution.
    if run_assembly:
        state.stage = "labware-setup"
        _qc_event("stage", name=state.stage)
        _load_labware_locations(config, ctx)
        _qc_capture_labware()
    all_failed_items: List[str] = []
    assembly_skipped = False
    with _qc_devices(state) as devices:
        state.stage = "device-preflight"
        _qc_event("stage", name=state.stage)
        _preflight_devices(api, ctx, config, devices)
        # Move the right mount to the left edge of deck slot D2 before scanning.
        # The scanner is fixed relative to this deck location.
        state.stage = "barcode-positioning"
        _qc_event("stage", name=state.stage)
        attach_pos = helpers_ot3.get_slot_top_left_position_ot3(BARCODE_SCAN_SLOT_D2)
        current_pos = _qc_call(api.gantry_position, OT3Mount.RIGHT)
        _qc_call(api.move_to, OT3Mount.RIGHT, attach_pos._replace(z=current_pos.z))

        # Only the left DUT is graded; the right P1000S establishes liquid references.
        dut = helpers_ot3.DeviceUnderTest.PIPETTE_LEFT
        report_modes: List[str] = []
        if run_current_speed:
            report_modes.append("current_speed")
        if run_assembly:
            report_modes.append("assembly_qc")

        reports: List[CSVReport] = []
        for report_mode in report_modes:
            state.report_mode = report_mode
            state.stage = "report-creation"
            _qc_event("stage", name=state.stage)
            state.report = None
            # Only create a report when its tests will actually run.
            if report_mode == "assembly_qc":
                report: CSVReport = build_report(test_name, config)
                if isinstance(report, ProductionAssemblyReport):
                    subsystem = api.attached_subsystems.get(
                        SubSystem.of_mount(config.mount)
                    )
                    report.pcba_revision = (
                        subsystem.pcba_revision if subsystem is not None else None
                    )
            else:
                serial = helpers_ot3._get_serial_for_dut(api, dut)
                report = build_current_speed_report(
                    CURRENT_SPEED_DEFAULT_TRIALS,
                    config.pipette_channels,
                    serial,
                    current_speed_test_type,
                )
            state.report = report

            # Scan the DUT once and reuse its metadata in the separate reports.
            state.stage = "metadata-verification"
            _qc_event("stage", name=state.stage)
            if reports:
                _copy_qc_report_metadata(reports[0], report)
            else:
                _qc_call(
                    helpers_ot3.set_csv_report_meta_data_ot3,
                    api,
                    report,
                    operator=cast(str, args["operator"]),
                    dut=dut,
                    ctx=ctx,
                    barcode_timeout_seconds=None,
                )
            ctx.comment(f"Starting {report_mode}")
            if report_mode == "assembly_qc":
                state.stage = "assembly-configuration"
                _qc_event("stage", name=state.stage)
                _reset_available_tip(
                    config.pipette_channels, _reference_tip_volumes(config)
                )
                store_config(
                    report, ctx, config.pipette_channels, config.pipette_volume
                )
                for section, test_run in config.tests.items():
                    state.stage = section.value
                    _qc_event("stage", name=state.stage)
                    _qc_execute_test(
                        section.value,
                        test_run,
                        report,
                        api,
                        report,
                        section.value,
                        ctx,
                        config,
                    )
            else:
                state.stage = "current-speed-tests"
                _qc_event("stage", name=state.stage)
                _qc_execute_test(
                    "current_speed",
                    test_current_speed,
                    report,
                    api,
                    report,
                    ctx,
                    config,
                    CURRENT_SPEED_DEFAULT_TRIALS,
                    current_speed_test_type,
                )

            # Save each report before moving to the next selected test mode.
            state.stage = "report-save"
            _qc_event("stage", name=state.stage)
            report.save_to_disk()
            reports.append(report)
            state.completed_modes.append(report_mode)
            state.stage = "result-summary"
            _qc_event("stage", name=state.stage)
            failed_items = _failed_qc_items(report)
            failure_details = _qc_failure_details(report, config)
            all_failed_items.extend(f"{report_mode}/{item}" for item in failure_details)
            if failed_items:
                _qc_mark_blocked_tests(report_mode)
                ctx.comment(f"{report_mode} failed items: {len(failure_details)}")
                for detail in failure_details:
                    ctx.comment(f"FAIL / {report_mode}: {detail}")
                _archive_failed_report(
                    ctx,
                    report,
                    report_mode,
                    failure_details,
                    stage=state.stage,
                    parameters=state.parameters,
                    completed_modes=state.completed_modes,
                )
            else:
                ctx.comment(f"{report_mode} failed items: none")

            # All modes honor the operator setting. Upload enabled current results
            # before diagnostics can start or be skipped.
            state.stage = "csv-upload"
            _qc_event("stage", name=state.stage)
            if args["operator"] != "Unused":
                try:
                    uploaded = upload_data_to_google_drive(report.file_path)
                except Exception as error:
                    ctx.comment(
                        f"{report_mode} CSV upload failed; saved locally at "
                        f"{report.file_path}: {error}"
                    )
                else:
                    ctx.comment(
                        f"{report_mode} CSV uploaded successfully."
                        if uploaded
                        else f"{report_mode} CSV upload failed; saved locally at "
                        f"{report.file_path}"
                    )
            else:
                ctx.comment(
                    f"{report_mode} CSV auto-upload skipped (Operator=Unused); "
                    f"saved locally at {report.file_path}"
                )
            if report_mode == "current_speed" and failed_items:
                if run_assembly:
                    assembly_skipped = True
                    ctx.comment(
                        "电流/速度测试不通过，跳过装配诊断测试。"
                        if LOCALIZE
                        else "Current/speed QC failed; assembly diagnostics skipped."
                    )
                break
        state.stage = "device-cleanup"
        _qc_event("stage", name=state.stage)

    return all_failed_items, assembly_skipped


def run(ctx: ProtocolContext) -> None:
    """Log live QC failures, including startup, without logging analysis as a run."""
    global _ACTIVE_QC_TRACE
    state = _QCFailureContext()
    if ctx.is_simulating():
        previous_trace = _ACTIVE_QC_TRACE
        _ACTIVE_QC_TRACE = None
        try:
            _run_qc(ctx, state)
        finally:
            _ACTIVE_QC_TRACE = previous_trace
        return
    previous_trace = _ACTIVE_QC_TRACE
    _ACTIVE_QC_TRACE = _QCTrace()
    try:
        _qc_capture_identity()
        try:
            with _qc_step("qc_run"):
                all_failed_items, assembly_skipped = _run_qc(ctx, state)
        except Exception as error:
            _archive_runtime_failure(ctx, state, error)
            raise
    finally:
        _ACTIVE_QC_TRACE = previous_trace

    # Expected QC failures have already been saved/uploaded once per report.
    if all_failed_items:
        raise RuntimeError(_qc_failure_message(all_failed_items, assembly_skipped))
