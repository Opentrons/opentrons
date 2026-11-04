"""Exercise calibration motion with real Engine geometry and fake actuators."""

from contextlib import ExitStack, contextmanager
from typing import Any, Iterator
from unittest.mock import Mock, patch

import pytest

from opentrons import simulate
from opentrons.hardware_control.modules.types import FlexStackerStatus, PlatformState
from opentrons.hardware_control.types import Axis, DoorState, EstopState, OT3Mount
from opentrons.protocol_engine.types import GripperMoveType, OFF_DECK_LOCATION
from opentrons.types import Point

from hardware_testing.gravimetric.offset_calibration.motion import CalibrationMotion
from hardware_testing.gravimetric.offset_calibration.storage import (
    DECK_SLOTS,
    STACKER_SLOTS,
    Route,
)


class RecordingHardware:
    """A fake actuator that records order and reports its actual commanded pose."""

    def __init__(self) -> None:
        """Begin at a known pose with closed door and cleared emergency stop."""
        self.position = Point(0, 0, 166.125)
        self.events: list[tuple[str, Any]] = []
        self.fail_next_move = False
        self.fail_pickup = False
        self.door_state = DoorState.CLOSED
        self.get_estop_state = Mock(return_value=EstopState.DISENGAGED)
        self.has_gripper = Mock(return_value=True)
        self.gripper_jaw_can_home = Mock(return_value=True)
        self.raise_error_if_gripper_pickup_failed = Mock(side_effect=self._check_pickup)

    def _check_pickup(self, **kwargs: Any) -> None:
        if self.fail_pickup:
            raise RuntimeError("pickup failed")

    def home(self, axes: list[Axis]) -> None:
        """Record homing and retract the gripper when requested."""
        self.events.append(("home", axes))
        if Axis.Z_G in axes:
            self.position = self.position._replace(z=166.125)

    def gantry_position(self, mount: OT3Mount, refresh: bool) -> Point:
        """Return a fresh gripper pose."""
        assert mount == OT3Mount.GRIPPER
        assert refresh
        return self.position

    def grip(self, force_newtons: float) -> None:
        """Record the requested gripping force."""
        self.events.append(("grip", force_newtons))

    def ungrip(self) -> None:
        """Record jaw opening."""
        self.events.append(("ungrip", None))

    def move_to(self, mount: OT3Mount, abs_position: Point, speed: float) -> None:
        """Move to an absolute pose unless an injected fault occurs."""
        self.events.append(("move_to", abs_position))
        if self.fail_next_move:
            self.fail_next_move = False
            raise RuntimeError("motion failed")
        self.position = abs_position

    def move_rel(self, mount: OT3Mount, delta: Point, speed: float) -> None:
        """Apply a relative delta unless an injected fault occurs."""
        self.events.append(("move_rel", delta))
        if self.fail_next_move:
            self.fail_next_move = False
            raise RuntimeError("motion failed")
        self.position += delta

    def disengage_axes(self, axes: list[Axis]) -> None:
        """Record brake engagement."""
        self.events.append(("disengage_axes", axes))

    def home_z(self, mount: OT3Mount) -> None:
        """Retract the gripper after release."""
        self.events.append(("home_z", mount))
        self.position = self.position._replace(z=166.125)

    def idle_gripper(self) -> None:
        """Record the final idle jaw action."""
        self.events.append(("idle_gripper", None))


@contextmanager
def calibration(
    rack_type: str = "T200",
) -> Iterator[tuple[CalibrationMotion, Any, RecordingHardware]]:
    """Dispose each virtual Engine without touching the user's robot settings."""
    with ExitStack() as contexts:
        with patch.object(simulate, "_LIVE_PROTOCOL_ENGINE_CONTEXTS", contexts):
            context = simulate.get_protocol_api("2.29", robot_type="Flex")
            hardware = RecordingHardware()
            with patch.object(context._core, "get_hardware", return_value=hardware):
                yield CalibrationMotion(context, rack_type), context, hardware


ROUTES = [
    Route("stacker_to_deck", stacker, deck)
    for stacker in STACKER_SLOTS
    for deck in DECK_SLOTS
] + [
    Route("deck_to_stacker", deck, stacker)
    for deck in DECK_SLOTS
    for stacker in STACKER_SLOTS
]


def _prepare(motion: CalibrationMotion, route: Route, offset: dict[str, float]) -> None:
    motion.initialize_route(route)
    motion.prepare_route(route, offset)


@pytest.mark.parametrize("route", ROUTES, ids=lambda route: route.key)
def test_every_route_uses_production_geometry_and_updates_real_engine_state(
    route: Route,
) -> None:
    """All 80 destinations, including A3, resolve adapters/modules correctly."""
    with calibration() as (motion, context, hardware):
        offset = {"x": 1.2, "y": -0.3, "z": 0.4}
        _prepare(motion, route, offset)
        state = context._core._engine_client.state
        rack = state.labware.get(motion._rack_id)
        nominal = state.geometry.get_labware_grip_point(
            labware_definition=state.labware.get_definition(rack.id),
            location=motion._destination,
            move_type=GripperMoveType.DROP_LABWARE,
            user_additional_offset=None,
        )
        assert hardware.position == nominal + Point(**offset) + Point(z=10)
        assert motion.candidate_offset() == pytest.approx(offset)
        assert motion.holding_labware and not motion.at_drop_height
        assert hardware.raise_error_if_gripper_pickup_failed.call_count > 0
        motion.lower_to_drop_height()
        hardware.events.clear()
        assert motion.release() == pytest.approx(offset)
        assert [event[0] for event in hardware.events] == [
            "disengage_axes",
            "ungrip",
            "home_z",
            "idle_gripper",
        ]
        assert state.labware.get(rack.id).location == motion._destination
        assert not motion.holding_labware
        motion.finish_route()
        assert state.labware.get(rack.id).location == OFF_DECK_LOCATION


@pytest.mark.parametrize("rack_type", ["T50", "T200", "T1000"])
def test_jog_and_lower_preserve_absolute_offset_and_exclude_hover(
    rack_type: str,
) -> None:
    """The saved value includes old calibration and all successful jogs."""
    with calibration(rack_type) as (motion, _, hardware):
        _prepare(
            motion, Route("stacker_to_deck", "A4", "A3"), {"x": 2, "y": -1, "z": 0.3}
        )
        motion.jog("x", 0.1)
        motion.jog("y", -0.1)
        position_before_lower = hardware.position
        assert motion.lower_to_drop_height() == pytest.approx(
            {"x": 2.1, "y": -1.1, "z": 0.3}
        )
        assert hardware.position == position_before_lower + Point(z=-10)
        motion.jog("z", -0.1)
        # Use a read-back pose change to prove the value comes from the actuator,
        # not merely from summing keys.
        hardware.position += Point(x=0.02)
        assert motion.release() == pytest.approx({"x": 2.12, "y": -1.1, "z": 0.2})


def test_hover_cannot_release_and_invalid_jogs_do_not_move() -> None:
    """Reject malformed/oversized values before sending any motion command."""
    with calibration() as (motion, _, hardware):
        _prepare(motion, Route("deck_to_stacker", "B1", "C4"), {"x": 0, "y": 0, "z": 0})
        hardware.events.clear()
        with pytest.raises(RuntimeError, match="lower"):
            motion.release()
        for axis, delta in [
            ("x", float("nan")),
            ("y", float("inf")),
            ("x", 2),
            ("q", 0.1),
        ]:
            with pytest.raises(ValueError):
                motion.jog(axis, delta)
        assert not hardware.events
        motion.lower_to_drop_height()
        hardware.events.clear()
        with pytest.raises(ValueError, match="0.1"):
            motion.jog("x", 1)
        with pytest.raises(RuntimeError, match="Already"):
            motion.lower_to_drop_height()
        assert not hardware.events


def test_failed_move_preserves_holding_and_never_cleans_up_with_motion() -> None:
    """On a stall, disconnect or cancellation, leave recovery to the operator."""
    with calibration() as (motion, _, hardware):
        _prepare(motion, Route("stacker_to_deck", "B4", "B1"), {"x": 2, "y": 0, "z": 0})
        hardware.events.clear()
        hardware.fail_next_move = True
        with pytest.raises(RuntimeError, match="motion failed"):
            motion.jog("x", 0.1)
        assert motion.holding_labware and motion.faulted
        assert [event[0] for event in hardware.events] == ["move_rel"]
        with pytest.raises(RuntimeError, match="manual recovery"):
            motion.release()


def test_failed_pickup_is_conservatively_treated_as_holding() -> None:
    """A partially gripped rack must not be opened or homed by cleanup."""
    with calibration() as (motion, _, hardware):
        hardware.fail_pickup = True
        with pytest.raises(RuntimeError, match="pickup failed"):
            _prepare(
                motion, Route("deck_to_stacker", "A3", "D4"), {"x": 0, "y": 0, "z": 0}
            )
        assert motion.holding_labware and motion.faulted
        assert hardware.events[-1][0] == "grip"


def test_invalid_baseline_does_not_pick_up() -> None:
    """Reject unusable configuration before any pickup motion."""
    with calibration() as (motion, _, hardware):
        motion.initialize_route(Route("stacker_to_deck", "A4", "D2"))
        hardware.events.clear()
        with pytest.raises(ValueError):
            motion.prepare_route(
                Route("stacker_to_deck", "A4", "D2"), {"x": 11, "y": 0, "z": 0}
            )
        assert not hardware.events


def test_initialize_only_prepares_empty_shuttle_before_operator_places_rack() -> None:
    """No jaw closes or rack is modeled before the separate pickup step."""
    with calibration() as (motion, context, hardware):
        motion.initialize_route(Route("stacker_to_deck", "A4", "D2"))
        assert [name for name, _ in hardware.events] == ["home", "home"]
        assert motion._rack_id is None
        labwares = context._core._engine_client.state.labware.get_all()
        assert [labware.loadName for labware in labwares] == [
            "opentrons_flex_96_tiprack_adapter"
        ]


@pytest.mark.parametrize("phase", ["initialize", "prepare", "jog", "lower", "release"])
@pytest.mark.parametrize("interlock", ["door", "estop"])
def test_live_interlock_prevents_each_motion_phase(phase: str, interlock: str) -> None:
    """Opening the door or an uncleared estop cannot initiate another action."""
    route = Route("stacker_to_deck", "A4", "D2")
    with calibration() as (motion, _, hardware):
        if phase != "initialize":
            motion.initialize_route(route)
        if phase in ("jog", "lower", "release"):
            motion.prepare_route(route, {"x": 0, "y": 0, "z": 0})
        if phase == "release":
            motion.lower_to_drop_height()
        actions = {
            "initialize": lambda: motion.initialize_route(route),
            "prepare": lambda: motion.prepare_route(route, {"x": 0, "y": 0, "z": 0}),
            "jog": lambda: motion.jog("x", 0.1),
            "lower": motion.lower_to_drop_height,
            "release": motion.release,
        }
        if interlock == "door":
            hardware.door_state = DoorState.OPEN
        else:
            hardware.get_estop_state.return_value = EstopState.LOGICALLY_ENGAGED
        hardware.events.clear()
        with pytest.raises(RuntimeError, match="manual recovery"):
            actions[phase]()
        assert motion.faulted
        assert not hardware.events


def test_latched_session_interruption_is_checked_after_each_actuator_action() -> None:
    """A mid-motion runtime halt cannot silently become an accepted offset."""
    with calibration() as (motion, _, hardware):
        _prepare(motion, Route("stacker_to_deck", "A4", "D2"), {"x": 0, "y": 0, "z": 0})
        hardware.events.clear()

        def check() -> None:
            if hardware.events:
                raise RuntimeError("session interrupted")

        motion._safety_check = check
        with pytest.raises(RuntimeError, match="session interrupted"):
            motion.jog("x", 0.1)
        assert motion.faulted and motion.holding_labware
        assert [name for name, _ in hardware.events] == ["move_rel"]


@pytest.mark.parametrize("sensor_failure", [False, True])
def test_shuttle_position_is_refreshed_before_pickup(sensor_failure: bool) -> None:
    """Trust a fresh sensor verification, and stop on an actual sensor error."""
    route = Route("stacker_to_deck", "A4", "D2")
    with calibration() as (motion, context, hardware):
        motion.initialize_route(route)
        stacker_hardware = Mock(
            install_detected=True,
            status=FlexStackerStatus.IDLE,
            platform_state=PlatformState.RETRACTED,
        )
        if sensor_failure:
            stacker_hardware.verify_shuttle_location.side_effect = RuntimeError(
                "shuttle sensor verification failed"
            )
        hardware.events.clear()
        with patch.object(context, "is_simulating", return_value=False), patch.object(
            motion._stacker._core, "_sync_module_hardware", stacker_hardware
        ):
            if sensor_failure:
                with pytest.raises(RuntimeError, match="sensor verification failed"):
                    motion.prepare_route(route, {"x": 0, "y": 0, "z": 0})
                assert motion.faulted and not hardware.events
            else:
                motion.prepare_route(route, {"x": 0, "y": 0, "z": 0})
                assert motion.holding_labware
        stacker_hardware.verify_shuttle_location.assert_called_once_with(
            PlatformState.EXTENDED
        )
