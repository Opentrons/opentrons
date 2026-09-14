"""Focused tests for the P1000S fan cooling Z-axis guard."""

import importlib
from types import SimpleNamespace
from typing import Any, Dict, List, Tuple

import opentrons.config as opentrons_config
import pytest


_original_is_robot = opentrons_config.IS_ROBOT
opentrons_config.IS_ROBOT = True
try:
    protocol = importlib.import_module(
        "hardware_testing.gravimetric.protocol_replacement."
        "gravimetric_speed_blank_p1000s_fan_temp_gate"
    )
finally:
    opentrons_config.IS_ROBOT = _original_is_robot


Axis = protocol.Axis


class _FakeBackend:
    def __init__(self) -> None:
        self.motor_run_currents = {Axis.Z_L: 0.7, Axis.Z_R: 0.8}
        self.motor_hold_currents = {Axis.Z_L: 0.3, Axis.Z_R: 0.4}
        self.engaged = {Axis.Z_L: True, Axis.Z_R: True}
        self.default_currents = {
            Axis.Z_L: SimpleNamespace(run_current=1.0, hold_current=0.1),
            Axis.Z_R: SimpleNamespace(run_current=1.1, hold_current=0.2),
        }
        self.events: List[Tuple[str, Any]] = []

    def is_motor_engaged(self, axis: Any) -> bool:
        return self.engaged[axis]

    def get_current_settings(self, gantry_load: Any) -> Dict[Any, Any]:
        assert gantry_load == "low-throughput"
        return self.default_currents

    def set_active_current(self, currents: Dict[Any, float]) -> None:
        self.events.append(("set-run", dict(currents)))
        self.motor_run_currents.update(currents)

    def set_hold_current(self, currents: Dict[Any, float]) -> None:
        self.events.append(("set-hold", dict(currents)))
        self.motor_hold_currents.update(currents)


class _FakeHardwareAPI:
    def __init__(self) -> None:
        self._backend = _FakeBackend()
        self.gantry_load = "low-throughput"
        self.fail_next_home = False

    def axis_is_present(self, axis: Any) -> bool:
        return axis in protocol.COOLING_Z_AXES

    def disengage_axes(self, axes: List[Any]) -> None:
        self._backend.events.append(("disengage", tuple(axes)))
        for axis in axes:
            self._backend.engaged[axis] = False

    def home(self, axes: List[Any]) -> None:
        self._backend.events.append(("home", tuple(axes)))
        for axis in axes:
            defaults = self._backend.default_currents[axis]
            assert self._backend.motor_run_currents[axis] == defaults.run_current
            assert self._backend.motor_hold_currents[axis] == defaults.hold_current
        if self.fail_next_home:
            self.fail_next_home = False
            raise RuntimeError("injected home failure")
        for axis in axes:
            self._backend.engaged[axis] = True


class _FakeContext:
    def __init__(self, hardware_api: _FakeHardwareAPI) -> None:
        self._core = SimpleNamespace(get_hardware=lambda: hardware_api)


@pytest.fixture
def heat_guard(monkeypatch: pytest.MonkeyPatch) -> Tuple[Any, _FakeHardwareAPI]:
    """Build a heat guard with a deterministic fake hardware backend."""
    hardware_api = _FakeHardwareAPI()
    monkeypatch.setattr(protocol, "print_info", lambda message: None)
    guard = protocol._DualPipetteHeatGuard(
        ctx=_FakeContext(hardware_api),
        axes_by_mount={},
        entry_states={},
        capacity_test_currents={},
    )
    return guard, hardware_api


def test_disengages_both_z_axes_for_braked_cooling(
    heat_guard: Tuple[Any, _FakeHardwareAPI],
) -> None:
    """Both Z motors are disabled so their brakes hold during cooling."""
    guard, hardware_api = heat_guard

    guard.disengage_z_axes_for_cooling()

    assert guard.cooling_z_axes == (Axis.Z_L, Axis.Z_R)
    assert hardware_api._backend.events == [("disengage", (Axis.Z_L, Axis.Z_R))]
    assert hardware_api._backend.engaged == {Axis.Z_L: False, Axis.Z_R: False}


def test_restores_system_default_z_currents_before_homing(
    heat_guard: Tuple[Any, _FakeHardwareAPI],
) -> None:
    """Configured defaults are restored before either Z axis is homed."""
    guard, hardware_api = heat_guard
    guard.disengage_z_axes_for_cooling()

    guard.restore_z_axes_after_cooling()

    assert hardware_api._backend.events == [
        ("disengage", (Axis.Z_L, Axis.Z_R)),
        ("set-run", {Axis.Z_L: 1.0, Axis.Z_R: 1.1}),
        ("set-hold", {Axis.Z_L: 0.1, Axis.Z_R: 0.2}),
        ("home", (Axis.Z_L, Axis.Z_R)),
    ]
    assert hardware_api._backend.engaged == {Axis.Z_L: True, Axis.Z_R: True}
    assert guard.cooling_z_axes == ()

    guard.restore_z_axes_after_cooling()
    assert len(hardware_api._backend.events) == 4


def test_failed_z_home_remains_pending_for_cleanup_retry(
    heat_guard: Tuple[Any, _FakeHardwareAPI],
) -> None:
    """A failed Z home leaves restoration pending for the cleanup retry."""
    guard, hardware_api = heat_guard
    guard.disengage_z_axes_for_cooling()
    hardware_api.fail_next_home = True

    with pytest.raises(RuntimeError, match="injected home failure"):
        guard.restore_z_axes_after_cooling()

    assert guard.cooling_z_axes == (Axis.Z_L, Axis.Z_R)
    assert hardware_api._backend.engaged == {Axis.Z_L: False, Axis.Z_R: False}

    guard.restore_z_axes_after_cooling()
    assert guard.cooling_z_axes == ()
    assert hardware_api._backend.engaged == {Axis.Z_L: True, Axis.Z_R: True}


class _FakeRelayStatus:
    def __init__(self, relay: "_FakeRelay") -> None:
        self._relay = relay

    def is_on(self, channel: int) -> bool:
        assert channel == protocol.P1000S_COOLING_RELAY_CHANNEL
        return self._relay.on


class _FakeRelay:
    def __init__(self, events: List[str]) -> None:
        self.events = events
        self.on = False

    def get_version(self) -> str:
        return "FAN 1.0.0"

    def get_status(self) -> _FakeRelayStatus:
        return _FakeRelayStatus(self)

    def turn_on(self, channel: int) -> None:
        assert channel == protocol.P1000S_COOLING_RELAY_CHANNEL
        self.on = True
        self.events.append("fan-on")

    def turn_off(self, channel: int) -> None:
        assert channel == protocol.P1000S_COOLING_RELAY_CHANNEL
        self.on = False
        self.events.append("fan-off")

    def close(self) -> None:
        self.events.append("relay-close")


class _FakeCoolingHeatGuard:
    def __init__(self, events: List[str]) -> None:
        self.events = events
        self.z_restore_pending = False

    def home_robot_for_cooling(self, mount: str) -> None:
        assert mount == "left"
        self.events.append("cooling-home")
        self.z_restore_pending = True

    def restore_z_axes_after_cooling(self) -> None:
        if self.z_restore_pending:
            self.events.append("z-restore-and-home")
            self.z_restore_pending = False

    def activate_mount(self, mount: str) -> bool:
        assert mount == "left"
        self.events.append("plunger-activate")
        return False

    def activate_pipette(self, pipette: Any, needs_home: bool) -> None:
        assert not needs_home
        self.events.append("plunger-ready")

    def deactivate_mount(self, mount: str) -> None:
        assert mount == "left"
        self.events.append("plunger-deactivate")


class _FakeProtocolContext:
    def is_simulating(self) -> bool:
        return False


def _build_cooling_fakes(
    monkeypatch: pytest.MonkeyPatch,
) -> Tuple[Any, _FakeCoolingHeatGuard, List[str]]:
    events: List[str] = []
    relay = _FakeRelay(events)
    guard = _FakeCoolingHeatGuard(events)
    fixture = SimpleNamespace(
        ctx=_FakeProtocolContext(), mount="left", pipette=object()
    )
    monkeypatch.setattr(protocol, "print_info", lambda message: None)
    monkeypatch.setattr(protocol, "print_warning", lambda message: None)
    monkeypatch.setattr(protocol.LCUS4Driver, "BuildLCUS4", lambda simulate, ctx: relay)
    monkeypatch.setattr(
        protocol, "_log_p1000s_temperature_gate", lambda *args, **kwargs: None
    )
    monkeypatch.setattr(
        protocol, "_finalize_fixture_data_before_upload", lambda fixture: None
    )
    return fixture, guard, events


def test_normal_gate_restores_z_before_activating_plunger(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The fan is off and Z defaults are restored before plunger activation."""
    fixture, guard, events = _build_cooling_fakes(monkeypatch)
    monkeypatch.setattr(
        protocol, "_read_mount_stem_temperature", lambda ctx, mount: 24.9
    )

    with protocol._cool_p1000s_with_fan_and_activate(fixture, guard):
        events.append("test-body")

    assert events[:7] == [
        "cooling-home",
        "fan-on",
        "fan-off",
        "z-restore-and-home",
        "plunger-activate",
        "plunger-ready",
        "test-body",
    ]


def test_timeout_cleanup_turns_fan_off_before_restoring_z(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A temperature timeout safely turns off the fan and restores both Z axes."""
    fixture, guard, events = _build_cooling_fakes(monkeypatch)
    monkeypatch.setattr(
        protocol, "_read_mount_stem_temperature", lambda ctx, mount: 28.0
    )
    monkeypatch.setattr(protocol, "P1000S_TEST_TEMPERATURE_TIMEOUT_SECONDS", 0.0)

    with pytest.raises(RuntimeError, match="did not cool"):
        with protocol._cool_p1000s_with_fan_and_activate(fixture, guard):
            pass

    assert events[:5] == [
        "cooling-home",
        "fan-on",
        "fan-off",
        "relay-close",
        "z-restore-and-home",
    ]
