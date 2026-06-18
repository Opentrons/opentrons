"""Production QC protocol for 96channel pipettes."""
import asyncio
from dataclasses import dataclass, fields
import enum
from time import time
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
)
from opentrons.protocol_api import ParameterContext, ProtocolContext, Labware
from opentrons.types import Point

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3simulator import (
    _sanitize_attached_instrument,
)
from opentrons.hardware_control.ot3_calibration import (
    calibrate_pipette,
    EdgeNotFoundError,
    CalibrationStructureNotFoundError,
)
from opentrons.hardware_control.peripherals import BarcodeScannerModel
from opentrons.hardware_control.types import (
    TipStateType,
    FailedTipStateCheck,
    InstrumentProbeType,
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
    OT3Mount,
)

from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError


from hardware_testing.data.csv_report import (
    CSVReport,
    CSVSection,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api import helpers_ot3

from hardware_testing.drivers import asair_sensor

from hardware_testing.drivers.pressure_fixture import (
    PressureFixtureBase,
    connect_to_fixture,
)

from hardware_testing.drivers.data_center_client import (
    upload_data_to_google_drive,
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
        offset = await calibrate_pipette(self, mount, slot=5, probe=probe)  # type: ignore[arg-type]
    except CalibrationStructureNotFoundError as e:
        if not self.is_simulator:
            raise e
        offset = Point(x=0, y=0, z=0)
    except EdgeNotFoundError:
        if not self.is_simulator:
            raise
        offset = Point(x=0, y=0, z=0)
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

PROBING_DECK_PRECISION_MM = 1.0

TRASH_HEIGHT_MM: Final = 45
LEAK_HOVER_ABOVE_LIQUID_MM: Final = 50
TRAILING_AIR_GAP_DROPLETS_UL: Final = 0.5

# FIXME: reduce this spec after dial indicator is implemented
LIQUID_PROBE_ERROR_THRESHOLD_PRECISION_MM = 0.4
LIQUID_PROBE_ERROR_THRESHOLD_ACCURACY_MM = 1.5

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
# FIXME: reduce once firmware latency is reduced
DEFAULT_STABILIZE_SECONDS = 1
# NOTE: number of samples during aspirate ideally creates ~2 minutes of data
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


def _bool_to_pass_fail(result: bool) -> str:
    return "PASS" if result else "FAIL"


def get_trash_nominal(cfg: TestConfig) -> Point:
    """Get nominal trash position."""
    trash_nominal = helpers_ot3.get_slot_calibration_square_position_ot3(
        cfg.slot_trash
    ) + Point(z=TRASH_HEIGHT_MM)
    return trash_nominal


def _tip_name_to_xy_offset(tip: str) -> Point:
    tip_rack_rows = ["A", "B", "C", "D", "E", "F", "G", "H"]
    tip_row = tip_rack_rows.index(tip[0])
    tip_column = int(tip[1]) - 1
    return Point(x=tip_column * 9, y=tip_row * -9)


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
    _move_safe(api, mount, tip_pos)
    if not tip_volume:
        pip = api.hardware_pipettes[mount.to_mount()]
        assert pip
        tip_volume = pip.working_volume
    assert tip_volume
    tip_length = helpers_ot3.get_default_tip_length(int(tip_volume))
    try:
        api.pick_up_tip(mount, tip_length=tip_length)
    except Exception:
        prinval = "07-02光电传感器故障: 取针管状态不正确"
        FINAL_TEST_FAIL_INFOR.append(prinval)
    if movez:
        api.move_rel(mount, Point(z=int(tip_length * 0.2)))


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


def _load_labware_locations(cfg: TestConfig, ctx: ProtocolContext) -> None:
    CALIBRATED_LABWARE_LOCATIONS.trash = get_trash_nominal(cfg)
    if not (ctx.params.skip_fixture and ctx.params.skip_liquid and ctx.params.skip_liquid_probe and ctx.params.skip_tip_sensor):  # type: ignore[attr-defined]
        tiprack_50 = ctx.load_labware(
            "opentrons_flex_96_tiprack_50uL", cfg.slot_tip_rack_50
        )
        tiprack_200 = ctx.load_labware(
            "opentrons_flex_96_tiprack_200uL", cfg.slot_tip_rack_200
        )
        tiprack_1000 = ctx.load_labware(
            "opentrons_flex_96_tiprack_1000uL", cfg.slot_tip_rack_1000
        )
        LABWARE["tip_rack_50"] = tiprack_50
        LABWARE["tip_rack_200"] = tiprack_200
        LABWARE["tip_rack_1000"] = tiprack_1000
        CALIBRATED_LABWARE_LOCATIONS.tip_rack_50 = tiprack_50["A1"].top().point
        CALIBRATED_LABWARE_LOCATIONS.tip_rack_200 = tiprack_200["A1"].top().point
        CALIBRATED_LABWARE_LOCATIONS.tip_rack_1000 = tiprack_1000["A1"].top().point
    if not (ctx.params.skip_fixture and ctx.params.skip_liquid):  # type: ignore[attr-defined]
        reservoir = ctx.load_labware("nest_1_reservoir_195ml", cfg.slot_reservoir)
        LABWARE["reservoir"] = reservoir
        # 2 mm above the bottom but shift over so that we're not directly on the center ridge
        CALIBRATED_LABWARE_LOCATIONS.reservoir = reservoir["A1"].bottom(
            2
        ).point + Point(x=4.5, z=2)
        if cfg.pipette_channels == 8:
            # Center 8 channel in reservoir
            CALIBRATED_LABWARE_LOCATIONS.reservoir = (
                CALIBRATED_LABWARE_LOCATIONS.reservoir + Point(y=9 * 3.5)
            )
    if not ctx.params.skip_liquid_probe:  # type: ignore[attr-defined]
        # Liquid probe fixture is a vial with an led at the bottom to help the user see the liquid better
        plate = ctx.load_labware("liquid_probe_fixture", cfg.slot_plate)
        LABWARE["plate"] = plate
        CALIBRATED_LABWARE_LOCATIONS.plate_primary = plate["A1"].top().point
        # plate_secondary is for the front probe so offset the pipette
        CALIBRATED_LABWARE_LOCATIONS.plate_secondary = plate["A1"].top().point + Point(
            y=9 * 7
        )
    if not ctx.params.skip_fixture:  # type: ignore[attr-defined]
        # Fixture is an aluminum tip rack glued trash slot frame so tubes can go out the bottom
        # to an external pressure sensor. it's ends up a little shorter than the tip rack but good enough
        # for LPC
        fixture_lw = ctx.load_labware(
            "opentrons_flex_96_tiprack_1000uL", cfg.slot_fixture
        )
        LABWARE["fixture"] = fixture_lw

        fixture_loc = fixture_lw["A1"].top().point
        CALIBRATED_LABWARE_LOCATIONS.fixture = fixture_loc

    if cfg.simulate:
        pip = ctx.load_instrument("flex_8channel_50", "left")
        if LABWARE["tip_rack_200"]:
            pip.pick_up_tip(LABWARE["tip_rack_200"]["A1"])
            pip.return_tip()
        if LABWARE["tip_rack_1000"]:
            pip.pick_up_tip(LABWARE["tip_rack_1000"]["A1"])
            pip.return_tip()
        if LABWARE["tip_rack_50"]:
            pip.pick_up_tip(LABWARE["tip_rack_50"]["A1"])
            if LABWARE["plate"]:
                pip.aspirate(50, LABWARE["plate"]["A1"])
                pip.dispense(50, LABWARE["plate"]["A1"])
            if LABWARE["reservoir"]:
                pip.aspirate(50, LABWARE["reservoir"]["A1"])
                pip.dispense(50, LABWARE["reservoir"]["A1"])
            pip.return_tip()
        if LABWARE["fixture"]:
            pip.pick_up_tip(LABWARE["fixture"]["A1"])
            pip.return_tip()


def _drop_tip_in_trash(api: SyncHardwareAPI, cfg: TestConfig) -> None:
    ideal = CALIBRATED_LABWARE_LOCATIONS.trash
    assert ideal
    random_trash_pos = ideal + TRASH_OFFSETS[cfg.trash_loc_counter]
    if cfg.pipette_channels == 8:
        random_trash_pos = random_trash_pos + Point(y=9 * 3.5)
    cfg.trash_loc_counter = (cfg.trash_loc_counter + 1) % len(TRASH_OFFSETS)
    current_pos = api.gantry_position(cfg.mount)
    safe_height = max(random_trash_pos.z, current_pos.z) + SAFE_HEIGHT_TRAVEL
    helpers_ot3.move_to_arched_ot3_sync(
        api, cfg.mount, random_trash_pos, safe_height=safe_height
    )
    api.drop_tip(cfg.mount, home_after=False)


def _move_safe(api: SyncHardwareAPI, mount: OT3Mount, dest: Point) -> None:
    current_pos = api.gantry_position(mount)
    safe_height = max(dest.z, current_pos.z) + SAFE_HEIGHT_TRAVEL
    helpers_ot3.move_to_arched_ot3_sync(api, mount, dest, safe_height=safe_height)


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
    pressure_event_config: PressureEventConfig = PRESSURE_FIXTURE_EVENT_CONFIGS[tag]
    ctx.delay(pressure_event_config.stability_delay)
    _samples = []
    for i in range(pressure_event_config.sample_count):
        _samples.append(fixture.read_all_pressure_channel())
        next_sample_time = time() + pressure_event_config.sample_delay
        _sample_rounded = [round(p, 2) for p in _samples[-1]]
        report("PRESSURE-DATA", f"{tag.value}", _sample_rounded, i)
        delay_time = next_sample_time - time()
        if i < pressure_event_config.sample_count - 1 and delay_time > 0:
            ctx.delay(pressure_event_config.sample_delay)
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
            _delta = abs(_average_per_channel[c] - previous[-1][c])  # absolute value
            if _delta < _delta_min or _delta > _delta_max:
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


def _aspirate_and_look_for_droplets(
    ctx: ProtocolContext, api: SyncHardwareAPI, mount: OT3Mount, wait_time: int
) -> bool:
    ctx.comment("Aspirating.")
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip
    pipette_volume = pip.working_volume
    api.aspirate(mount, pipette_volume - TRAILING_AIR_GAP_DROPLETS_UL)
    api.move_rel(mount, Point(z=LEAK_HOVER_ABOVE_LIQUID_MM))
    api.aspirate(mount, TRAILING_AIR_GAP_DROPLETS_UL)
    for t in range(wait_time):
        ctx.delay(1)
    if api.is_simulator:
        leak_test_passed = True
    else:
        leak_test_passed = helpers_ot3.get_user_answer(
            ctx, api, "did it pass? no leaking?"
        )
    ctx.comment("dispensing")
    api.move_rel(mount, Point(z=-LEAK_HOVER_ABOVE_LIQUID_MM))
    api.dispense(mount, pipette_volume, is_full_dispense=True)
    api.blow_out(mount)
    return leak_test_passed


def _pick_up_tip_for_fixture_new(
    api: SyncHardwareAPI, cfg: TestConfig, well: str
) -> None:
    assert LABWARE["fixture"]
    tip_pos = LABWARE["fixture"][well].top().point
    _move_safe(api, cfg.mount, tip_pos)
    # Just always assume a 1000 tip since they're the longest and we don't want to fail to retract
    tip_length = helpers_ot3.get_default_tip_length(1000)
    api.pick_up_tip(cfg.mount, tip_length=tip_length)
    # move up high enough that we can do a drop tip after
    api.move_rel(cfg.mount, Point(z=15))


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
    _pick_up_tip_for_fixture_new(api, cfg, "A1")
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
    api.retract(cfg.mount)
    _drop_tip_in_trash(api, cfg)
    api.retract(cfg.mount)
    if cfg.pipette_channels == 8:
        current_val = PRESSURE_THRESH_current[cfg.pipette_channels][cfg.pipette_volume][
            8
        ]
        helpers_ot3.update_pick_up_current(api, cfg.mount, current_val)
    try:
        _pick_up_tip_for_fixture_new(api, cfg, "A2")
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
        api.aspirate(cfg.mount, PRESSURE_FIXTURE_ASPIRATE_VOLUME[cfg.pipette_volume])
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
        api.dispense(
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
        api.drop_tip(cfg.mount, home_after=False)
        api.retract(cfg.mount)
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
        api.drop_tip(cfg.mount)
    return False not in results


def _test_for_leak(
    ctx: ProtocolContext,
    api: SyncHardwareAPI,
    cfg: TestConfig,
    tip_volume: int,
    fixture: Optional[PressureFixtureBase],
    report: Optional[CSVReport],
    section: Optional[str],
    droplet_wait_seconds: int = 30,
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
        api.retract(cfg.mount)
        assert CALIBRATED_LABWARE_LOCATIONS.reservoir
        _move_safe(api, cfg.mount, CALIBRATED_LABWARE_LOCATIONS.reservoir)
        test_passed = _aspirate_and_look_for_droplets(
            ctx, api, cfg.mount, droplet_wait_seconds
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
    fixture = connect_to_fixture(
        cfg.simulate,
        side=cfg.fixture_side,
    )
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
    for i in range(cfg.num_trials):
        droplet_wait_seconds = cfg.droplet_wait_seconds * (i + 1)
        test_passed = _test_for_leak(
            ctx,
            api,
            cfg,
            cfg.pipette_volume,
            None,
            None,
            None,
            cfg.droplet_wait_seconds,
        )
        if not test_passed:
            printsig = f"04-01-liquid:测试吸液保持,吸水后等待 {droplet_wait_seconds} 秒针管漏液"
            FINAL_TEST_FAIL_INFOR.append(printsig)
        report(
            section,
            f"droplets-{droplet_wait_seconds}",
            [CSVResult.from_bool(test_passed)],
        )


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
                next_read = api.read_instrument_capacitance(
                    mount, sensor_id == SensorId.S0
                )
            case SensorType.temperature:
                next_read = api.read_stem_temperature(mount, sensor_id == SensorId.S0)
            case SensorType.humidity:
                next_read = api.read_stem_humidity(mount, sensor_id == SensorId.S0)
            case SensorType.pressure:
                next_read = api.read_stem_pressure(mount, sensor_id == SensorId.S0)
        readings.append(round(next_read, 2))
    return _remove_outliers_and_average(readings)


def _test_env_sensors(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    ctx.comment("测试诊断环境。" if LOCALIZE else "Test diagnostics environment.")
    env_sensor = asair_sensor.BuildAsairSensor(cfg.simulate)
    reading = env_sensor.get_reading()
    room_c = reading.temperature
    room_h = reading.relative_humidity
    sensors = [SensorId.S0]
    env_pass = True
    if cfg.pipette_channels == 8:
        sensors.append(SensorId.S1)
    for sensor_id in sensors:
        celsius = _read_and_average(api, cfg.mount, SensorType.temperature, sensor_id)
        humidity = _read_and_average(api, cfg.mount, SensorType.temperature, sensor_id)
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
        _pos = api.current_position_ot3(cfg.mount)
        _enc = api.encoder_current_position_ot3(cfg.mount)
        return _pos[pip_axis], _enc[pip_axis]

    # print("homing plunger")
    api.home([pip_axis])
    pip_pos, pip_enc = _get_plunger_pos_and_encoder()
    encoder_home_pass = abs(pip_pos - pip_enc) <= ENCODER_ALIGNMENT_THRESHOLD_HOME_MM
    report(
        section,
        "encoder-home",
        [pip_pos, pip_enc, CSVResult.from_bool(encoder_home_pass)],
    )
    helpers_ot3.move_plunger_absolute_ot3_sync(api, cfg.mount, drop_tip)
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
    helpers_ot3.move_plunger_absolute_ot3_sync(api, cfg.mount, bottom)


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
            <= CAP_THRESH_OPEN_AIR[cfg.pipette_channels][0]
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
            nozzle_str = "REAR " if sensor_id == SensorId.S0 else "FRONT "
        ctx.pause(
            f"安装 {nozzle_str} 探头" if LOCALIZE else f"ATTACH the {nozzle_str}probe"
        )
        ctx.comment(f"正在校准 {nozzle_str}" if LOCALIZE else f"Calibrating {nozzle_str}")
        probe_cap = _read_and_average(api, cfg.mount, SensorType.capacitive, sensor_id)
        probe_pass = (
            CAP_THRESH_PROBE[cfg.pipette_channels][0]
            <= probe_cap
            <= CAP_THRESH_PROBE[cfg.pipette_channels][0]
        )
        cap_pass = cap_pass and probe_pass
        report(
            section,
            f"capacitive-probe-{sensor_id.name}",
            [probe_cap, CSVResult.from_bool(probe_pass)],
        )

        # Test calibrate reliability
        offsets: List[Point] = []
        for trial in range(2):
            if trial > 0:
                ctx.pause("重新安装探头" if LOCALIZE else "`REINSTALL` the probe")
                ctx.comment(
                    f"正在校准 {nozzle_str}" if LOCALIZE else f"Calibrating {nozzle_str}"
                )
            if api.is_simulator:
                offset = Point(0, 0, 0)
            else:
                api._calibrate_pipette(cfg.mount, sensor_to_probe[sensor_id])
                pip = api.hardware_pipettes[cfg.mount.to_mount()]
                assert pip
                offset = pip.pipette_offset.offset
            report_offset = [round(offset.x, 2), round(offset.y, 2), round(offset.z, 2)]
            report(section, f"probe-slot-{sensor_id.name}-{trial}", report_offset)
            offsets.append(offset)
            api.retract(cfg.mount)
        if len(offsets) > 1:
            calibrate_pass = offsets[0].elementwise_isclose(
                offsets[1], abs_tol=PROBING_DECK_PRECISION_MM
            )
            cap_pass = cap_pass and calibrate_pass

            # Test calibration square
            probe_pos = helpers_ot3.get_slot_calibration_square_position_ot3(5)
            probe_pos += Point(13, 13, 0)
            if sensor_id == SensorId.S1:
                probe_pos += Point(x=0, y=9 * 7, z=0)
            api.add_tip(cfg.mount, api.config.calibration.probe_length)
            _probe_start_mm = probe_pos.z + 5
            current_pos = api.gantry_position(cfg.mount)
            if current_pos.z < _probe_start_mm:
                api.move_to(cfg.mount, current_pos._replace(z=_probe_start_mm))
                current_pos = api.gantry_position(cfg.mount)
            api.move_to(cfg.mount, probe_pos._replace(z=current_pos.z))
            api.move_to(cfg.mount, probe_pos)
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

        api.retract(cfg.mount)
        ctx.pause("移除探针" if LOCALIZE else "REMOVE the probe")
        ctx.comment(
            f"已完成 {nozzle_str} 的校准" if LOCALIZE else f"Done calibrating {nozzle_str}"
        )
        api.remove_tip(cfg.mount)
    report(
        section,
        "diagnostic-capacitance",
        [CSVResult.from_bool(cap_pass)],
    )


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
    api.add_tip(cfg.mount, 0.1)
    api.prepare_for_aspirate(cfg.mount)
    api.remove_tip(cfg.mount)

    def _read_pressure(_sensor_id: SensorId) -> float:
        return _read_and_average(api, cfg.mount, SensorType.pressure, _sensor_id)

    current_val = PRESSURE_THRESH_current[cfg.pipette_channels][cfg.pipette_volume][1]
    helpers_ot3.update_pick_up_current(api, cfg.mount, current_val)
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
    helpers_ot3.move_plunger_absolute_ot3_sync(api, cfg.mount, bottom)
    _pick_up_tip_for_tip_volume(api, cfg, tip_volume=50)
    api.retract(cfg.mount)

    # SEALED PRESSURE
    current_pos = api.gantry_position(cfg.mount)
    slot_11_pos = helpers_ot3.get_slot_calibration_square_position_ot3(11)
    if cfg.pipette_channels == 1:
        slot_11_pos = slot_11_pos._replace(z=current_pos.z)
    else:
        slot_11_pos = slot_11_pos._replace(y=slot_11_pos.y + 29, z=current_pos.z)
    _move_safe(api, cfg.mount, slot_11_pos)
    api.move_rel(cfg.mount, Point(z=movez + 10))
    api.move_rel(cfg.mount, Point(z=-10), speed=5)
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
    api.aspirate(cfg.mount, plunger_aspirate_ul)
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
    api.dispense(cfg.mount, is_full_dispense=True)
    api.prepare_for_aspirate(cfg.mount)
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
    current_pos = api.gantry_position(cfg.mount)
    hover_over_slot_3 = pos_slot_3._replace(z=current_pos.z - 20)
    api.move_to(cfg.mount, hover_over_slot_3)
    _test_env_sensors(api, report, section, ctx, cfg)
    _test_encoder(api, report, section, ctx, cfg)
    _test_cap_sensors(api, report, section, ctx, cfg)
    _test_diagnostics_pressure(api, report, section, ctx, cfg)
    api.retract(cfg.mount)


# ----------- END TEST DIAGNOSTICS -----------

# ----------- TEST PLUNGER -----------
def build_plunger_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    lines.append(CSVLine("plunger-blow-out", [CSVResult]))
    lines.append(CSVLine("plunger-drop-tip", [CSVResult]))
    return lines


def _test_plunger_positions(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    api.home([Axis.by_mount(cfg.mount), Axis.of_main_tool_actuator(cfg.mount)])
    _, bottom, blow_out, drop_tip = helpers_ot3.get_plunger_positions_ot3(
        api, cfg.mount
    )
    helpers_ot3.move_plunger_absolute_ot3_sync(api, cfg.mount, blow_out)
    if api.is_simulator:
        blow_out_passed = True
    else:
        blow_out_passed = helpers_ot3.get_user_answer(ctx, api, "is BLOW-OUT correct?")
        ctx.comment(f"Blowout passed {blow_out_passed}")
        if not blow_out_passed:
            printval = f"02-01-BLOW-OUT:移液器BLOW-OUT {blow_out_passed}"
            FINAL_TEST_FAIL_INFOR.append(printval)
    report(section, "plunger-blow-out", [CSVResult.from_bool(blow_out_passed)])
    helpers_ot3.move_plunger_absolute_ot3_sync(api, cfg.mount, drop_tip)
    if api.is_simulator:
        drop_tip_passed = True
    else:
        drop_tip_passed = helpers_ot3.get_user_answer(ctx, api, "is DROP-TIP correct?")
        if not drop_tip_passed:
            printval = f"02-02-DROP-TIP:移液器DROP-TIP {drop_tip_passed}"
            FINAL_TEST_FAIL_INFOR.append(printval)
    report(section, "plunger-drop-tip", [CSVResult.from_bool(drop_tip_passed)])
    api.home([Axis.of_main_tool_actuator(cfg.mount)])
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
    current_pos = api.gantry_position(cfg.mount)
    hover_over_slot_3 = pos_slot_3._replace(z=current_pos.z - 20)
    api.move_to(cfg.mount, hover_over_slot_3)
    api.move_rel(cfg.mount, Point(z=-20))
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


def _jog_for_tip_state(
    ctx: ProtocolContext,
    api: SyncHardwareAPI,
    mount: OT3Mount,
    current_z: float,
    max_z: float,
    step_mm: float,
    criteria: Tuple[float, float],
    tip_state: TipStateType,
) -> bool:
    def _matches_state(_state: TipStateType) -> bool:
        if api.is_simulator:
            return True
        try:
            ctx.delay(0.3)
            api.verify_tip_presence(mount, _state)
            return True
        except FailedTipStateCheck:
            return False

    times = 0
    while (step_mm > 0 and current_z < max_z) or (step_mm < 0 and current_z > max_z):
        api.move_rel(mount, Point(z=step_mm))
        current_z = round(current_z + step_mm, 2)
        times += 1
        if _matches_state(tip_state):
            graval = times * 0.1
            passed = min(criteria) <= current_z <= max(criteria)
            if not passed:
                printsig = f"06-02-tip-presence:测试光栅距离,针管状态{tip_state.name}移液轴头到触发光栅的距离为{current_z} 结果为{passed} 阈值为{min(criteria)} ~ {max(criteria)}.触发光电开关的走的距离为{graval}"
                FINAL_TEST_FAIL_INFOR.append(printsig)
            return passed
    printsig = (
        f"06-03-tip-presence:光电传感器故障,在状态{tip_state.name} 位移最大值{current_z} 没触发光电开关"
    )
    FINAL_TEST_FAIL_INFOR.append(printsig)
    return False


def test_tip_sensor_new(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    """Fully automated tip sensor check."""
    ctx.comment("测试探头传感器。" if LOCALIZE else "Test tip sensor.")
    api.retract(cfg.mount)
    if cfg.pipette_channels == 1:
        offset_from_a1 = Point(x=9 * 11, y=9 * -7, z=-6)
    else:
        offset_from_a1 = Point(x=9 * 11, y=0, z=-6)
    test_pos = (
        CALIBRATED_LABWARE_LOCATIONS.tip_rack_50 + offset_from_a1  # type: ignore[operator]
    )
    helpers_ot3.move_to_arched_ot3_sync(api, cfg.mount, test_pos)
    nozzle_pos = api.gantry_position(cfg.mount)
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
        api.move_rel(cfg.mount, Point(z=nominal_single_ejector_relative))
    else:
        api.move_rel(cfg.mount, Point(z=nominal_multi_ejector_relative))
    pick_up_result = _jog_for_tip_state(
        ctx,
        api,
        cfg.mount,
        current_z=ejector_rel_pos,
        max_z=-10.5,
        criteria=pick_up_criteria,
        step_mm=-0.1,
        tip_state=TipStateType.PRESENT,
    )
    pick_up_pos = api.gantry_position(cfg.mount)
    pick_up_pos_rel = round(pick_up_pos.z - nozzle_pos.z, 2)
    api.move_to(cfg.mount, nozzle_pos + Point(z=-10.5))  # nominal tip depth
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
    )
    drop_pos = api.gantry_position(cfg.mount)
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
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    probes = [InstrumentProbeType.PRIMARY]
    if cfg.pipette_channels > 1:
        probes.append(InstrumentProbeType.SECONDARY)
    tip_vols = [50] if cfg.pipette_volume == 50 else [50, 200, 1000]
    for tip_vol in tip_vols:
        for probe in probes:
            for trial in range(3):
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
        api.home()
        _pick_up_tip_for_tip_volume(api, cfg, tip_volume)
        for probe in probes:
            _move_to_above_plate_liquid(api, cfg.mount, probe, height_mm=hover_mm)
            api.gantry_position(cfg.mount)
            try:
                end_z = api.liquid_probe(
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


def test_liquid_probe_new(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    cfg: TestConfig,
) -> None:
    """No jog required liquid probe."""
    ctx.comment("液体测试探针。" if LOCALIZE else "Test liquid probe.")
    tip_vols = [50] if cfg.pipette_volume == 50 else [50, 200, 1000]
    above_well_height = 2
    max_submerge_mm = 10
    max_z_distance_machine_coords = above_well_height + max_submerge_mm
    probes = [InstrumentProbeType.PRIMARY]
    if cfg.pipette_channels > 1:
        probes.append(InstrumentProbeType.SECONDARY)
    if cfg.pipette_channels == 8:
        current_val = PRESSURE_THRESH_current[cfg.pipette_channels][cfg.pipette_volume][
            1
        ]
        helpers_ot3.update_pick_up_current(api, cfg.mount, current_val)
    for tip_vol in tip_vols:
        results: Dict[InstrumentProbeType, List[Tuple[float, bool]]] = {}
        for probe in probes:
            results[probe] = []
            good_height = 0.0
            for trial in range(3):
                _pick_up_tip_for_tip_volume(api, cfg, tip_vol)
                _move_to_above_plate_liquid(
                    api, cfg.mount, probe, height_mm=above_well_height
                )
                top_z = api.gantry_position(cfg.mount).z - above_well_height
                good_probe = False
                try:
                    end_z = api.liquid_probe(
                        cfg.mount,
                        max_z_distance_machine_coords,
                        probe=probe,
                    )
                    good_probe = True
                except Exception:
                    probeval = f"07-03{probe}传感器故障: 读取{probe}传感器值失败"
                    FINAL_TEST_FAIL_INFOR.append(probeval)
                    end_z = 0
                    raise

                if end_z >= top_z:
                    # failed early
                    good_probe = False
                elif end_z <= top_z - max_submerge_mm:
                    # went too low
                    good_probe = False
                results[probe].append((end_z, good_probe))
                report(
                    section,
                    f"liquid-probe-{tip_vol}-tip-{probe.name.lower()}-probe-trial-{trial}",
                    [round(end_z, 2)],
                )
                if trial == 0:
                    # bad named method here since it's going to the liquid
                    _move_to_above_plate_liquid(api, cfg.mount, probe, end_z - top_z)
                    if helpers_ot3.get_user_answer(
                        ctx, api, "Is the tip just touching the liquid?"
                    ):
                        good_height = end_z
                _drop_tip_in_trash(api, cfg)
            heights = [h for h, _ in results[probe]]
            passing = [p for _, p in results[probe]]
            corrected_results = [h - good_height for h in heights]
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
            tip_passed = precision_passed and accuracy_passed and all(passing)
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
    current_pos = api.current_position_ot3(mount, refresh=True)
    est = current_pos[pipette_ax]
    encoder_pos = api.encoder_current_position_ot3(mount, refresh=True)
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
    api.cache_instruments()
    api.home()
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
    for cycle in range(cycles):
        ctx.comment(
            f"正在运行第 {cycle} 个周期（共 {cycles} 个）"
            if LOCALIZE
            else f"Running {cycle} of {cycles}"
        )
        helpers_ot3.move_plunger_absolute_ot3_sync(api, cfg.mount, 0)
        init_encoder_pos = api.encoder_current_position_ot3(cfg.mount, refresh=True)
        prev_encoder_tick = (
            init_encoder_pos[pipette_ax] / MOTOR_MM_PER_REV * ENCODER_TICKS_PER_REV
        )
        prev_encoder_pulse = init_encoder_pos[pipette_ax] * PULSE_PER_MM
        for i in range(int((bottom_pos - top_pos) / MOTOR_MM_PER_REV)):
            try:
                helpers_ot3.move_plunger_absolute_ot3_sync(
                    api, cfg.mount, (i + 1) * MOTOR_MM_PER_REV
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
                if stalled_this_move:
                    stall = True
                    break
            except StallOrCollisionDetectedError:
                stall = True
                break

        cycle_count += 1
        if stall:
            break
    report(
        section,
        "diagnostics-encoder-clean",
        [
            CSVResult.from_bool(not stall),
            cumulative_error,
            (abs_error / completed_moves),
            max_error_mm,
            max_error_pulses,
            max_error_ticks,
        ],
    )


# ----------- END TEST ENCODER_CLEAN -----------


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
) -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    lines.append(CSVLine("PHASE", [str for _ in range(pipette_channels)]))
    for event, config in PRESSURE_FIXTURE_EVENT_CONFIGS.items():
        # Skip the second aspirate so we don't double up
        lines.append(
            CSVLineRepeating(
                config.sample_count,
                event.value,
                [float for _ in range(pipette_channels)],
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

    for event, config in PRESSURE_FIXTURE_EVENT_CONFIGS.items():
        line_ind = 0
        for f in fields(config):
            report(
                "PRESSURE-CONFIGURATIONS",
                f"{event.value}",
                [f.name, getattr(config, f.name)],
                line_ind,
            )
            line_ind += 1
    report("PRESSURE-DATA", "PHASE", [f"CH{c+1}" for c in range(pipette_channels)])


def build_report(test_name: str, cfg: TestConfig) -> CSVReport:
    """Build report."""
    return CSVReport(
        test_name=test_name,
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
                lines=build_pressure_data_csv_lines(cfg.pipette_channels),
            ),
        ],
    )


TESTS = [
    (
        TestSection.DIAGNOSTICS,
        test_diagnostics,
    ),
    (
        TestSection.PLUNGER,
        test_plunger,
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
        TestSection.LIQUID,
        test_liquid,
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
        description="Operator for this QC run",
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
        maximum=10,
        default=2,
        description="Number of trials to run.",
    )
    parameters.add_int(
        display_name="Aspirate Sample Count",
        variable_name="aspirate_sample_count",
        minimum=1,
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


def _reset_available_tip(pipette_channels: int) -> None:
    for tip_size in [50, 200, 1000]:
        _available_tips[tip_size] = [
            f"{row}{col + 1}" for col in range(12) for row in "ABCDEFGH"
        ]
        _available_tips_fixture[tip_size] = _fixture_tips_for_channels(pipette_channels)


def run(ctx: ProtocolContext) -> None:
    """Entry point into testing protocol."""
    # apply monkey patch
    OT3API._get_tip_status = _get_tip_status_patch  # type: ignore[attr-defined]
    OT3API._calibrate_pipette = _calibrate_pipette_patch  # type: ignore[attr-defined]

    api = ctx._core.get_hardware()

    if ctx.is_simulating():
        api._backend._attached_instruments = {
            m: _sanitize_attached_instrument(
                m,
                helpers_ot3._create_attached_instruments_dict(
                    pipette_left="p1000_multi_v3.5"
                ).get(m),
            )
            for m in OT3Mount
        }
        api.create_simulating_peripheral(BarcodeScannerModel.BARCODE_SCANNER_V1)
    api.reset()

    args = ctx.params.get_all()
    t_sections = {
        s: f for s, f in TESTS if not args[f"skip_{s.value.lower().replace('-', '_')}"]
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
        pipette_channels=8,
        pipette_volume=1000,
        mount=OT3Mount.LEFT,
        trash_loc_counter=0,
    )

    test_name = "pipette-assembly-qc-ot3"

    attach_pos = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    current_pos = api.gantry_position(OT3Mount.RIGHT)
    api.move_to(OT3Mount.RIGHT, attach_pos._replace(z=current_pos.z))
    _load_labware_locations(config, ctx)
    pips = {OT3Mount.from_mount(m): p for m, p in api.hardware_pipettes.items() if p}
    assert pips, "no pipettes attached"
    for mount, pipette in pips.items():
        current_pipette = api.hardware_pipettes[mount.to_mount()]

        config.pipette_channels = current_pipette.channels
        config.pipette_volume = current_pipette.working_volume

        _reset_available_tip(config.pipette_channels)
        report = build_report(test_name, config)
        dut = helpers_ot3.DeviceUnderTest.PIPETTE_LEFT
        helpers_ot3.set_csv_report_meta_data_ot3(api, report, operator=ctx.params.operator, dut=dut, ctx=ctx)  # type: ignore[attr-defined]

        store_config(report, ctx, config.pipette_channels, config.pipette_volume)

        for section, test_run in config.tests.items():
            test_run(api, report, section.value, ctx, config)

        # SAVE REPORT
        report_path = report.save_to_disk()
        if ctx.params.operator != "Unused":  # type: ignore[attr-defined]
            # Don't upload during testing
            upload_data_to_google_drive(report_path)
        if not report.all_succeded():
            raise RuntimeError("Error during QC run.")
