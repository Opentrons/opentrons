"""Production QC protocol for 96channel pipettes."""
import asyncio
from dataclasses import dataclass
import enum
from time import sleep, monotonic
from typing import Dict, Callable, cast, List, Union, Tuple, Literal
from opentrons.protocol_api import ParameterContext, ProtocolContext, OFF_DECK
from opentrons.types import Point

from opentrons.hardware_control.peripherals import BarcodeScannerModel
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3simulator import (
    _sanitize_attached_instrument,
)
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
from hardware_testing.drivers.sealed_pressure_fixture import (
    SerialDriver as SealedPressureDriver,
)
from hardware_testing.opentrons_api import helpers_ot3


# ----------- Monkey patches -----------


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


metadata = {"protocolName": "96 channel production qc"}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


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


# ----------- TestSection.PLUNGER -----------

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


def _is_plunger_still_aligned_with_encoder(
    api: SyncHardwareAPI,
) -> Tuple[float, float, bool]:
    enc_pos = api.encoder_current_position_ot3(OT3Mount.LEFT)
    motor_pos = api.current_position_ot3(OT3Mount.LEFT)
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
    ctx.comment("Test Plunger.")
    ax = Axis.P_L
    mount = OT3Mount.LEFT
    settings = helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(api, ax)
    default_current = settings.run_current
    default_speed = settings.max_speed
    _, _, blow_out, _ = helpers_ot3.get_plunger_positions_ot3(api, mount)

    def _save_result(tag: str) -> bool:
        est, enc, aligned = _is_plunger_still_aligned_with_encoder(api)
        result = CSVResult.from_bool(aligned)
        report(section, tag, [est, enc, result])
        return aligned

    api.home_z(OT3Mount.LEFT)
    slot_5 = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    home_pos = api.gantry_position(OT3Mount.LEFT)
    api.move_to(OT3Mount.LEFT, slot_5._replace(z=home_pos.z))

    # LOOP THROUGH CURRENTS + SPEEDS
    currents = list(CURRENTS_SPEEDS_PLUNGER.keys())
    for current in sorted(currents, reverse=True):
        speeds = CURRENTS_SPEEDS_PLUNGER[current]
        for speed in sorted(speeds, reverse=False):
            # HOME
            api.home([ax])
            helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
                api,
                ax,
                run_current=current,
            )
            helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
                api, ax, default_max_speed=speed
            )
            # MOVE DOWN
            _save_result(_get_plunger_test_tag(current, speed, "down", "start"))
            helpers_ot3.move_plunger_absolute_ot3_sync(
                api, mount, blow_out, speed=speed, motor_current=current
            )
            down_passed = _save_result(
                _get_plunger_test_tag(current, speed, "down", "end")
            )
            # MOVE UP
            _save_result(_get_plunger_test_tag(current, speed, "up", "start"))
            helpers_ot3.move_plunger_absolute_ot3_sync(
                api, mount, 0, speed=speed, motor_current=current
            )
            up_passed = _save_result(_get_plunger_test_tag(current, speed, "up", "end"))
            # RESET CURRENTS AND HOME
            helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
                api, ax, run_current=default_current
            )
            helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
                api, ax, default_max_speed=default_speed
            )
            api._backend.set_active_current({Axis.P_L: default_current})
            api.home([ax])
            if not down_passed or not up_passed and not api.is_simulator:
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
        pass_no_hit = helpers_ot3.get_user_answer(
            ctx, api, "are both endstop Lights OFF?"
        )
    else:
        pass_no_hit = True

    return pass_no_hit


def jaw_precheck(
    ctx: ProtocolContext, api: SyncHardwareAPI, ax: Axis, speed: float
) -> Tuple[bool, bool]:
    """Check the LEDs work and jaws are aligned."""
    # HOME
    helpers_ot3.home_tip_motors_sync(api, False)  # Home with no backoff
    # Check LEDs can turn on when homed
    if not api.is_simulator:
        led_check = helpers_ot3.get_user_answer(ctx, api, "are both endstop Lights ON?")
    else:
        led_check = True
    if not led_check:
        return (led_check, False)

    helpers_ot3.move_tip_motor_relative_ot3_sync(api, RETRACT_MM, speed=speed)
    # Check Jaws are aligned
    if not api.is_simulator:
        jaws_aligned = helpers_ot3.get_user_answer(
            ctx, api, "are both endstop Lights OFF?"
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
    ctx.comment("Test Jaws.")
    ax = Axis.Q
    settings = helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(api, ax)
    default_current = settings.run_current
    default_speed = settings.max_speed

    async def _save_result(tag: str, led_check: bool, jaws_aligned: bool) -> bool:
        if led_check and jaws_aligned:
            no_hit = _check_if_jaw_is_aligned_with_endstop(ctx, api)
        else:
            no_hit = False
        result = CSVResult.from_bool(led_check and jaws_aligned and no_hit)
        report(section, tag, [led_check, jaws_aligned, no_hit, result])
        return led_check and jaws_aligned and no_hit

    api.home_z(OT3Mount.LEFT)
    slot_5 = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    home_pos = api.gantry_position(OT3Mount.LEFT)
    api.move_to(OT3Mount.LEFT, slot_5._replace(z=home_pos.z))

    # LOOP THROUGH CURRENTS + SPEEDS
    currents = list(CURRENTS_SPEEDS_JAWS.keys())
    for current in sorted(currents, reverse=True):
        speeds = CURRENTS_SPEEDS_JAWS[current]
        for speed in sorted(speeds, reverse=False):

            led_check, jaws_aligned = jaw_precheck(ctx, api, ax, speed)

            if led_check and jaws_aligned:
                helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
                    api, ax, default_max_speed=speed
                )
                helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
                    api, ax, run_current=current
                )
                # MOVE DOWN then UP
                helpers_ot3.move_tip_motor_relative_ot3_sync(
                    api, MAX_TRAVEL, speed=speed, motor_current=current
                )
                helpers_ot3.move_tip_motor_relative_ot3_sync(
                    api, -MAX_TRAVEL, speed=speed, motor_current=current
                )
                # RESET CURRENTS, CHECK
                helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
                    api, ax, default_max_speed=default_speed
                )
                helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
                    api, ax, run_current=default_current
                )
            passed = _save_result(
                _get_jaws_test_tag(current, speed), led_check, jaws_aligned
            )

            if not passed and not api.is_simulator:
                ctx.pause(
                    f"current {current} failed, skipping any remaining speeds at this current"
                )
                break

    api.home([ax])


# ----------- END TestSection.JAWS -----------

# ----------- TestSection.CAPACITANCE -----------
TEST_SLOT = 8
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
            r = api.read_instrument_capacitance(OT3Mount.LEFT, sensor_id == SensorId.S0)
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
    probe_pos = helpers_ot3.get_slot_calibration_square_position_ot3(TEST_SLOT)
    probe_pos += PROBE_POS_OFFSET
    hover_pos = probe_pos._replace(z=api.get_instrument_max_height(OT3Mount.LEFT))
    if probe == InstrumentProbeType.SECONDARY:
        probe_offset = Point(x=9 * -11, y=9 * 7)
    else:
        probe_offset = Point()
    return hover_pos + probe_offset, probe_pos + probe_offset


def test_capacitance(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Test capacitance sensor."""
    ctx.comment("Test capacitance sensor")
    z_ax = Axis.Z_L
    p_ax = Axis.P_L
    t_ax = Axis.Q

    default_probe_cfg = api.config.calibration.z_offset.pass_settings
    api.reset_instrument_offset(OT3Mount.LEFT)

    ctx.pause("REMOVE everything from the deck")

    for probe in PROBE_POSITIONS:
        # store the thresolds (for reference)
        for k in THRESHOLDS.keys():
            report(
                section, _get_capacitive_test_tag(probe, f"{k}-min"), [THRESHOLDS[k][0]]
            )
            report(
                section, _get_capacitive_test_tag(probe, f"{k}-max"), [THRESHOLDS[k][1]]
            )

        hover_pos, probe_pos = _get_hover_and_probe_pos(api, probe)
        sensor_id = sensor_id_for_instrument(probe)
        api.home([z_ax, p_ax, t_ax])
        helpers_ot3.move_to_arched_ot3_sync(api, OT3Mount.LEFT, hover_pos)

        # AIR-pF
        air_pf = _read_from_cap_sensor(api, sensor_id, 10)
        if not air_pf:
            # ui.print_error(f"{probe} cap sensor not working, skipping")
            continue
        air_passed = THRESHOLDS["air-pf"][0] <= air_pf <= THRESHOLDS["air-pf"][1]
        report(
            section,
            _get_capacitive_test_tag(probe, "air-pf"),
            [air_pf, CSVResult.from_bool(air_passed)],
        )

        # ATTACHED-pF
        ctx.pause(f"ATTACH probe to {probe.name} channel")
        api.add_tip(OT3Mount.LEFT, api.config.calibration.probe_length)
        attached_pf = _read_from_cap_sensor(api, sensor_id, 10)
        if not attached_pf:
            # ui.print_error(f"{probe} cap sensor not working, skipping")
            continue
        attached_passed = (
            THRESHOLDS["attached-pf"][0] <= attached_pf <= THRESHOLDS["attached-pf"][1]
        )
        attached_passed = attached_passed if attached_pf > air_pf else False
        report(
            section,
            _get_capacitive_test_tag(probe, "attached-pf"),
            [attached_pf, CSVResult.from_bool(attached_passed)],
        )

        if not air_passed or not attached_passed:
            continue

        # DECK-mm
        def _probe(distance: float, speed: float) -> float:
            if api.is_simulator:
                return 0.0
            return api._capacitive_probe(
                distance=distance,
                mount_speed=speed,
                sensor_id=sensor_id,
                relative_threshold_pf=default_probe_cfg.sensor_threshold_pf,
            )

        ctx.pause("about to probe the DECK")
        # move to 5 mm above the deck
        api.home_z(OT3Mount.LEFT)
        current_pos = api.gantry_position(OT3Mount.LEFT)
        api.move_to(OT3Mount.LEFT, probe_pos._replace(z=current_pos.z))
        api.move_to(OT3Mount.LEFT, probe_pos._replace(z=PROBE_PREP_HEIGHT_MM))
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
        api.refresh_positions()
        found_pos = api.gantry_position(OT3Mount.LEFT)
        deck_mm_relative = found_pos.z - (PROBE_MAX_OVERRUN * -1.0)
        deck_mm_is_valid = deck_mm_relative >= 0.001
        report(
            section,
            _get_capacitive_test_tag(probe, "deck-mm"),
            [deck_mm_relative, CSVResult.from_bool(deck_mm_is_valid)],
        )

        # DECK-pF
        if deck_mm_is_valid:
            api.move_to(OT3Mount.LEFT, probe_pos._replace(z=found_pos.z))
            deck_pf = _read_from_cap_sensor(api, sensor_id, 10)
            if not deck_pf:
                # ui.print_error(f"{probe} cap sensor not working, skipping")
                continue
            passed = THRESHOLDS["deck-pf"][0] <= deck_pf <= THRESHOLDS["deck-pf"][1]
            passed = passed if deck_pf > attached_pf else False
            report(
                section,
                _get_capacitive_test_tag(probe, "deck-pf"),
                [deck_pf, CSVResult.from_bool(passed)],
            )

        api.home_z(OT3Mount.LEFT)
        ctx.pause("REMOVE probe")
        api.remove_tip(OT3Mount.LEFT)


# ----------- END TestSection.CAPACITANCE -----------

# ----------- TestSection.PRESSURE -----------
USE_SEALED_FIXTURE = False
USE_SEALED_BLOCK = True
PRIMARY_SEALED_PRESSURE_FIXTURE_POS = (
    Point(362.68, 148.83, 49.4) if USE_SEALED_BLOCK else Point(362.68, 148.83, 44.4)
)  # attached tip
SECOND_SEALED_PRESSURE_FIXTURE_POS = (
    Point(264.71, 212.81, 49.4) if USE_SEALED_BLOCK else Point(264.71, 212.81, 44.4)
)  # attached tip
SET_PRESSURE_TARGET = 100  # read air pressure when the force pressure value is over 100
REACHED_PRESSURE = 0.0

SECONDS_BETWEEN_READINGS = 0.25
NUM_PRESSURE_READINGS = 10
TIP_VOLUME = 50
ASPIRATE_VOLUME = 2
PRESSURE_READINGS = ["open-pa", "sealed-pa", "aspirate-pa", "dispense-pa"]

SLOT_FOR_PICK_UP_TIP = 5
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
            r = api.read_stem_pressure(OT3Mount.LEFT, sensor_id == SensorId.S0)
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
    api.move_to(OT3Mount.LEFT, fixture_pos)

    if api.is_simulator:
        debug_target = f"{SET_PRESSURE_TARGET}"
    else:
        target_input = helpers_ot3.get_input_number(
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
            api.move_rel(OT3Mount.LEFT, Point(x=0, y=0, z=step))
            sleep(3)
        else:
            break


def _partial_pick_up_z_motion(
    api: SyncHardwareAPI, current: float, distance: float, speed: float
) -> None:
    api._partial_pick_up_z_motion(current, distance, speed)


def _partial_pick_up(api: SyncHardwareAPI, position: Point, current: float) -> None:
    helpers_ot3.move_to_arched_ot3_sync(
        api,
        OT3Mount.LEFT,
        position,
        safe_height=position.z + 10,
    )
    _partial_pick_up_z_motion(
        api, current=current, distance=12, speed=3
    )  # change distance and speed, in case collision detected error
    api.add_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(TIP_VOLUME))
    api.prepare_for_aspirate(OT3Mount.LEFT)
    api.home_z(OT3Mount.LEFT)


def test_pressure(  # noqa: C901
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Test pressure sensor."""
    ctx.comment("Test Pressure")
    api.home_z(OT3Mount.LEFT)
    slot_5 = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    home_pos = api.gantry_position(OT3Mount.LEFT)
    api.move_to(OT3Mount.LEFT, slot_5._replace(z=home_pos.z))
    if USE_SEALED_FIXTURE:
        # init driver
        pressure_sensor = SealedPressureDriver()
        pressure_sensor.init(9600)

    # move to slot
    ctx.pause(f"Place tip tack 50ul at slot - {SLOT_FOR_PICK_UP_TIP}")
    tiprack = ctx.load_labware("opentrons_flex_96_tiprack_50uL", SLOT_FOR_PICK_UP_TIP)
    tip_rack_actual_pos = tiprack["A1"].top().point

    for probe in PROBE_POSITIONS:
        helpers_ot3.move_to_arched_ot3_sync(
            api, OT3Mount.LEFT, tip_rack_actual_pos + Point(z=50)
        )
        sensor_id = sensor_id_for_instrument(probe)

        # OPEN-Pa
        open_pa = 0.0
        if not api.is_simulator:
            try:
                open_pa = _read_from_pressure_sensor(
                    api, sensor_id, NUM_PRESSURE_READINGS
                )
            except Exception:
                ctx.delay(3, msg=f"{probe} pressure sensor not working, skipping")
                continue
        open_result = check_value(open_pa, "open-pa", pipette)
        report(
            section, _get_pressure_test_tag(probe, "open-pa"), [open_pa, open_result]
        )

        # SEALED-Pa
        sealed_pa = 0.0
        if probe == InstrumentProbeType.PRIMARY:
            offset_pos = A1_OFFSET
            fixture_pos = PRIMARY_SEALED_PRESSURE_FIXTURE_POS
        elif probe == InstrumentProbeType.SECONDARY:
            offset_pos = H12_OFFSET
            fixture_pos = SECOND_SEALED_PRESSURE_FIXTURE_POS
        else:
            raise NameError("offset position miss")

        if not api.is_simulator:

            # ui.get_user_ready(f"attach {TIP_VOLUME} uL TIP to {probe.name} sensor")

            tip_pos = tip_rack_actual_pos + offset_pos
            ctx.pause("Pick up tip")
            _partial_pick_up(api, tip_pos, current=0.1)
            api.prepare_for_aspirate(OT3Mount.LEFT)
            if not (USE_SEALED_FIXTURE or USE_SEALED_BLOCK):
                ctx.pause("SEAL tip using your FINGER")
            else:
                helpers_ot3.move_to_arched_ot3_sync(
                    api, OT3Mount.LEFT, fixture_pos._replace(z=fixture_pos.z + 50)
                )
                ctx.pause("Ready for moving to sealed fixture")
                if USE_SEALED_FIXTURE:
                    calibrate_to_pressue_fixture(api, pressure_sensor, fixture_pos, ctx)
                else:
                    helpers_ot3.move_to_arched_ot3_sync(api, OT3Mount.LEFT, fixture_pos)

            try:
                sealed_pa = _read_from_pressure_sensor(
                    api, sensor_id, NUM_PRESSURE_READINGS
                )
            except Exception:
                ctx.delay(3, msg=f"{probe} pressure sensor not working, skipping")
                break
        sealed_result = check_value(sealed_pa, "sealed-pa", pipette)
        report(
            section,
            _get_pressure_test_tag(probe, "sealed-pa"),
            [sealed_pa, sealed_result, REACHED_PRESSURE],
        )

        # ASPIRATE-Pa
        aspirate_pa = 0.0
        if not api.is_simulator:
            api.aspirate(OT3Mount.LEFT, ASPIRATE_VOLUME)
            try:
                aspirate_pa = _read_from_pressure_sensor(
                    api, sensor_id, NUM_PRESSURE_READINGS
                )
            except Exception:
                ctx.delay(3, msg=f"{probe} pressure sensor not working, skipping")
                break
        aspirate_result = check_value(aspirate_pa, "aspirate-pa", pipette)
        report(
            section,
            _get_pressure_test_tag(probe, "aspirate-pa"),
            [aspirate_pa, aspirate_result],
        )

        # DISPENSE-Pa
        dispense_pa = 0.0
        if not api.is_simulator:
            api.dispense(OT3Mount.LEFT, ASPIRATE_VOLUME, is_full_dispense=True)
            try:
                dispense_pa = _read_from_pressure_sensor(
                    api, sensor_id, NUM_PRESSURE_READINGS
                )
            except Exception:
                ctx.delay(3, msg=f"{probe} pressure sensor not working, skipping")
                break
        dispense_result = check_value(dispense_pa, "dispense-pa", pipette)
        report(
            section,
            _get_pressure_test_tag(probe, "dispense-pa"),
            [dispense_pa, dispense_result],
        )
        if USE_SEALED_FIXTURE or USE_SEALED_BLOCK:
            helpers_ot3.move_to_arched_ot3_sync(
                api, OT3Mount.LEFT, fixture_pos._replace(z=fixture_pos.z + 50)
            )
        ctx.pause("REMOVE tip")

        trash_nominal = helpers_ot3.get_slot_calibration_square_position_ot3(
            12
        ) + Point(z=40)
        # center the 96ch of the 1-well labware
        trash_nominal += OFFSET_FOR_1_WELL_LABWARE
        helpers_ot3.move_to_arched_ot3_sync(
            api, OT3Mount.LEFT, trash_nominal + Point(z=20)
        )
        api.move_to(OT3Mount.LEFT, trash_nominal)
        api.drop_tip(OT3Mount.LEFT)
        api.remove_tip(OT3Mount.LEFT)
        api.home()


# ----------- END TestSection.PRESSURE -----------

# ----------- TestSection.ENVIRONMENT_SENSOR -----------

NUM_SAMPLES = 10
INTER_SAMPLE_DELAY_SECONDS = 0.25


def build_env_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine(f"environment-{sensor_id.name}-celsius-humidity", [float, float])
        for sensor_id in [SensorId.S0, SensorId.S1]
    ]


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
    ctx.comment("Test Environmental Sensor")
    api.home_z(OT3Mount.LEFT)
    slot_5 = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    home_pos = api.gantry_position(OT3Mount.LEFT)
    api.move_to(OT3Mount.LEFT, slot_5._replace(z=home_pos.z))
    for sensor_id in [SensorId.S0, SensorId.S1]:
        celsius_samples = []
        humidity_samples = []
        for _ in range(NUM_SAMPLES):
            c = api.read_stem_temperature(OT3Mount.LEFT, sensor_id == SensorId.S0)
            h = api.read_stem_humidity(OT3Mount.LEFT, sensor_id == SensorId.S0)
            c = round(c, 2)
            h = round(h, 2)
            celsius_samples.append(c)
            humidity_samples.append(h)
            sleep(INTER_SAMPLE_DELAY_SECONDS)
        celsius = _remove_outliers_and_average(celsius_samples)
        humidity = _remove_outliers_and_average(humidity_samples)
        report(
            section,
            f"environment-{sensor_id.name}-celsius-humidity",
            [celsius, humidity],
        )


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
    return api._get_tip_status()


def test_tip_sensor(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Test tip sensor."""
    ctx.comment("Test Tip Sensor")
    ax = Axis.Q
    api.home_z(OT3Mount.LEFT)
    slot_5 = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    home_pos = api.gantry_position(OT3Mount.LEFT)
    api.move_to(OT3Mount.LEFT, slot_5._replace(z=home_pos.z))
    for expected_state in [True, False]:
        api.home([ax])
        if not api.is_simulator:
            if expected_state:
                ctx.pause("press on tips to channels A1 + H12")
            else:
                ctx.pause("remove all tips from the pipette")
        if not api.is_simulator:
            init_state = get_tip_status(api)
            if init_state != EXPECTED_STATE_AT_HOME_POSITION:
                ctx.pause("tip sensor is not in expected state at home position")
        helpers_ot3.move_tip_motor_relative_ot3_sync(api, TIP_PRESENCE_POSITION)
        state = expected_state if api.is_simulator else get_tip_status(api)
        tag = _get_tip_test_tag(expected_state)
        result = state == expected_state
        report(section, tag, [CSVResult.from_bool(result)])
        api.home([ax])


# ----------- END TestSection.TIP_SENSOR -----------

# ----------- TestSection.DROPLETS -----------

NUM_SECONDS_TO_WAIT = 30
HOVER_HEIGHT_MM = 50
DEPTH_INTO_RESERVOIR_FOR_ASPIRATE = -24
DEPTH_INTO_RESERVOIR_FOR_DISPENSE = DEPTH_INTO_RESERVOIR_FOR_ASPIRATE

RESERVOIR_LABWARE = "nest_1_reservoir_195ml"

TIP_RACK_96_SLOT = 4
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
    trash_nominal = helpers_ot3.get_slot_calibration_square_position_ot3(
        TRASH_SLOT
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
    helpers_ot3.move_to_arched_ot3_sync(api, OT3Mount.LEFT, reservoir)
    api.move_to(OT3Mount.LEFT, reservoir + Point(z=DEPTH_INTO_RESERVOIR_FOR_ASPIRATE))
    api.aspirate(OT3Mount.LEFT, volume)
    api.move_to(OT3Mount.LEFT, reservoir + Point(z=HOVER_HEIGHT_MM))

    start_time = monotonic()
    for i in range(seconds):
        if i == 0 or i == seconds - 1:
            api.set_lights(False, False)
        if not api.is_simulator:
            sleep(1)
    api.set_lights(True, True)

    if not api.is_simulator:
        result = helpers_ot3.get_user_answer(ctx, api, "look good")
    else:
        result = True
    duration_seconds = monotonic() - start_time

    api.move_to(OT3Mount.LEFT, reservoir + Point(z=DEPTH_INTO_RESERVOIR_FOR_DISPENSE))
    api.dispense(OT3Mount.LEFT, is_full_dispense=True)
    return result, duration_seconds


def _drop_tip(api: SyncHardwareAPI, trash: Point, pipette: Literal[200, 1000]) -> None:
    helpers_ot3.move_to_arched_ot3_sync(api, OT3Mount.LEFT, trash + Point(z=20))
    api.move_to(OT3Mount.LEFT, trash)
    api.drop_tip(OT3Mount.LEFT)
    api.home_z(OT3Mount.LEFT)


def test_droplets(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Test Droplets."""
    ctx.comment("Test Droplets")
    # GATHER NOMINAL POSITIONS
    reservoir = ctx.load_labware("nest_1_reservoir_195ml", RESERVOIR_SLOT)
    adapter = ctx.load_adapter("opentrons_flex_96_tiprack_adapter", TIP_RACK_96_SLOT)
    trash_nominal = get_trash_nominal()

    # PICK-UP 96 TIPS
    droplets_result = True
    for trial in range(2):
        if trial == 0:
            tip_rack: int = pipette
            test_volume: int = pipette
        else:
            tip_rack = 50
            test_volume = 1 if pipette == 200 else 5
        ctx.pause(f"ADD 96 tip-rack-{tip_rack}ul to slot #{TIP_RACK_96_SLOT}")
        if adapter.child:
            ctx.move_labware(adapter.child, OFF_DECK, use_gripper=False)
        tiprack = adapter.load_labware(f"opentrons_flex_96_tiprack_{tip_rack}uL")
        helpers_ot3.move_to_arched_ot3_sync(
            api, OT3Mount.LEFT, tiprack["A1"].top().point
        )
        api.pick_up_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(tip_rack))
        api.home_z(OT3Mount.LEFT)

        result, duration = aspirate_and_wait(
            ctx,
            api,
            reservoir["A1"].top().move(OFFSET_FOR_1_WELL_LABWARE).point,
            test_volume,
            seconds=NUM_SECONDS_TO_WAIT,
        )
        droplets_result = droplets_result & result
        _drop_tip(api, trash_nominal, pipette)
        api.home_z(OT3Mount.LEFT)
    report(
        section, "droplets-96-tips", [duration, CSVResult.from_bool(droplets_result)]
    )


# ----------- END TestSection.DROPLETS -----------

# ----------- TestSection.ENCODER -----------

STALL_THRESHOLD = 0.25


def build_encoder_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    pass_fail = [CSVLine("encoder-96-stall", [bool, CSVResult])]
    cycles = [CSVLine("encoder-96-cycles", [int, CSVResult])]
    cumulative_error = [CSVLine("encoder-96-cumulative-error", [float, CSVResult])]
    abs_avg_error = [CSVLine("encoder-96-abs-avg-error", [float, CSVResult])]

    return pass_fail + cycles + cumulative_error + abs_avg_error  # type: ignore [return-value]


def _plunger_alignment(
    api: SyncHardwareAPI, mount: OT3Mount
) -> Tuple[float, float, float]:
    pipette_ax = Axis.of_main_tool_actuator(mount)
    current_pos = api.current_position_ot3(mount, refresh=True)
    est = current_pos[pipette_ax]
    encoder_pos = api.encoder_current_position_ot3(mount, refresh=True)
    enc = encoder_pos[pipette_ax]
    stalled_mm = est - enc
    return est, enc, stalled_mm


def test_encoder(
    api: SyncHardwareAPI,
    report: CSVReport,
    section: str,
    ctx: ProtocolContext,
    pipette: Literal[200, 1000],
) -> None:
    """Test Encoder."""
    ctx.comment("Test Encoder")
    cycles = 100
    mount = OT3Mount.LEFT
    api.cache_instruments()
    api.home()
    api.home_plunger(mount)

    top_pos, bottom_pos, _, _ = helpers_ot3.get_plunger_positions_ot3(api, mount)
    helpers_ot3.move_plunger_absolute_ot3_sync(api, mount, bottom_pos)

    cumulative_error = 0.0
    abs_error = 0.0
    completed_moves = 0
    cycle_count = 0
    stall = False

    for cycle in range(cycles):

        try:
            helpers_ot3.move_plunger_absolute_ot3_sync(api, mount, top_pos)
            top_est, top_enc, top_diff = _plunger_alignment(api, mount)
            cumulative_error += top_diff
            abs_error += abs(top_diff)
            completed_moves += 1
        except StallOrCollisionDetectedError:
            stall = True
            break

        try:
            helpers_ot3.move_plunger_absolute_ot3_sync(api, mount, bottom_pos)
            bot_est, bot_enc, bot_diff = _plunger_alignment(api, mount)
            cumulative_error += bot_diff
            abs_error += abs(bot_diff)
            completed_moves += 1
        except StallOrCollisionDetectedError:
            stall = True
            break
        cycle_count += 1

    report(section, "encoder-96-stall", [stall, CSVResult.from_bool(not stall)])
    report(
        section,
        "encoder-96-cycles",
        [cycle_count, CSVResult.from_bool(cycle_count == cycles)],
    )
    report(
        section,
        "encoder-96-cumulative-error",
        [cumulative_error, CSVResult.from_bool(cumulative_error < STALL_THRESHOLD)],
    )
    report(
        section,
        "encoder-96-abs-avg-error",
        [
            abs_error / completed_moves,
            CSVResult.from_bool((abs_error / completed_moves) < STALL_THRESHOLD),
        ],
    )


# ----------- END TestSection.ENCODER -----------


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


TESTS = [
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
        display_name="Pipette Size",
        variable_name="pip_size",
        default="1000",
        choices=[
            {"display_name": "1000", "value": "1000"},
            {"display_name": "200", "value": "200"},
        ],
        description="Which pipette size this is.",
    )


def run(ctx: ProtocolContext) -> None:
    """Entry point into testing protocol."""
    # apply monkey patch
    OT3API._partial_pick_up_z_motion = _partial_pick_up_z_motion_patch  # type: ignore[attr-defined]
    OT3API._get_tip_status = _get_tip_status_patch  # type: ignore[attr-defined]
    OT3API._capactive_probe = _cap_probe_patch  # type: ignore[attr-defined]
    api = ctx._core.get_hardware()

    if ctx.is_simulating():
        sim_backend = api._backend
        if ctx.params.pip_size == "1000":  # type: ignore[attr-defined]
            model = "p1000_96_v3.5"
        else:
            model = "p200_96_v3.0"
        sim_backend._attached_instruments = {
            m: _sanitize_attached_instrument(
                m,
                helpers_ot3._create_attached_instruments_dict(pipette_left=model).get(
                    m
                ),
            )
            for m in OT3Mount
        }
        api.create_simulating_peripheral(BarcodeScannerModel.BARCODE_SCANNER_V1)
        api.reset()

    test_name = "ninety-six-assembly-qc-ot3"
    report = build_report(test_name)
    dut = helpers_ot3.DeviceUnderTest.PIPETTE_LEFT
    helpers_ot3.set_csv_report_meta_data_ot3(api, report, operator=ctx.params.operator, dut=dut, ctx=ctx)  # type: ignore[attr-defined]
    args = ctx.params.get_all()
    t_sections = {
        s: f for s, f in TESTS if not args[f"skip_{s.value.lower().replace('-', '_')}"]
    }
    config = TestConfig(
        simulate=ctx.is_simulating(), tests=t_sections, pipette=int(ctx.params.pip_size)  # type: ignore[arg-type, attr-defined]
    )
    for section, test_run in config.tests.items():
        test_run(api, report, section.value, ctx, pipette=int(ctx.params.pip_size))  # type: ignore[arg-type, attr-defined]

    # SAVE REPORT
    report.save_to_disk()
