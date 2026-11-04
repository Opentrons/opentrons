"""Verify independent impact controllers without protocol downloads or hardware."""

import ast
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict
from unittest.mock import Mock

import pytest


@pytest.fixture
def protocol() -> Dict[str, Any]:
    """Execute real parameter, device-setup, and motion-hook code in isolation."""
    source = (
        Path(__file__).parents[3]
        / "hardware_testing/gravimetric/protocol_replacement/gravimetric_speed.py"
    )
    tree = ast.parse(source.read_text())
    names = {
        "add_parameters",
        "_cleanup_partial_fixture_build",
        "maybe_close_all_gratings",
        "maybe_switch_mode",
        "_configure_impact_protection_96ch",
        "_impact_96ch_response_needs_motion_wait",
        "maybe_home_impact_protection_96ch",
        "_switch_impact_protection_v2",
        "_close_impact_protection_v2",
        "maybe_home_impact_for_stacker_move",
        "_should_home_96ch_impact_for_stacker_slot",
    }
    nodes = [
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name in names
    ]
    assert len(nodes) == len(names)
    fixture_class = next(
        node
        for node in tree.body
        if isinstance(node, ast.ClassDef) and node.name == "FixtureSettings"
    )
    build = next(
        node
        for node in fixture_class.body
        if isinstance(node, ast.FunctionDef) and node.name == "build"
    )
    # Retain the actual initialization and exception handler, without executing
    # unrelated report creation, external downloads, or instrument setup.
    start = next(
        index
        for index, node in enumerate(build.body)
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id == "env_sensor"
            for target in node.targets
        )
    )
    end = next(
        index
        for index in range(start, len(build.body))
        if isinstance(build.body[index], ast.Try)
    )
    device_setup = ast.parse(
        "def initialize(ctx, csv_settings, simulating, recorder):\n"
        "    return locals()\n"
    ).body[0]
    assert isinstance(device_setup, ast.FunctionDef)
    device_setup.body = build.body[start : end + 1] + device_setup.body
    nodes.append(device_setup)
    constants = {
        "IMPACT_96CH_STACKER_HOME_SLOTS",
        "IMPACT_96CH_PIPETTE_MOVE_WAIT_SECONDS",
    }
    nodes.extend(
        node
        for node in tree.body
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id in constants
            for target in node.targets
        )
    )
    state = SimpleNamespace(raw_response="OK", command="Home", command_sent=True)
    environment = Mock()
    impact_v2 = Mock()
    impact_96 = Mock()
    for driver in (impact_v2, impact_96):
        for command in (
            "switch_mode",
            "close_all_gratings",
            "set_left_p200",
            "set_left_p1000",
            "set_left_p20",
            "home",
        ):
            getattr(driver, command).return_value = state
    namespace: Dict[str, Any] = {
        "AsairDriver": SimpleNamespace(
            BuildAsairSensorWithPort=Mock(return_value=(environment, "/dev/env"))
        ),
        "_build_impact_protection_v2_with_port": Mock(
            return_value=(impact_v2, "/dev/v2")
        ),
        "_build_impact_protection_96ch_with_port": Mock(
            return_value=(impact_96, "/dev/96")
        ),
        "_deck_slot_key": lambda slot: slot.upper(),
        "ImpactProtection96chDriver": None,
        "print_info": Mock(),
        "print_warning": Mock(),
        "set_output_file": Mock(),
        "environment": environment,
        "impact_v2": impact_v2,
        "impact_96": impact_96,
    }
    future = ast.parse("from __future__ import annotations").body
    module = ast.fix_missing_locations(ast.Module(body=future + nodes, type_ignores=[]))
    exec(compile(module, str(source), "exec"), namespace)
    return namespace


def _fixture(
    protocol: Dict[str, Any], channels: int, enabled_96: bool, enabled_v2: bool
) -> SimpleNamespace:
    return SimpleNamespace(
        ctx=SimpleNamespace(is_simulating=Mock(return_value=False), delay=Mock()),
        pipette_channels=channels,
        mount="left",
        use_impact_protection=enabled_96,
        use_impact_protection_v2=enabled_v2,
        # Deliberately retain objects even when disabled to verify every hook
        # observes its switch, not just the absence of a connected controller.
        ImpactSerial_U=protocol["impact_v2"],
        ImpactSerial_96=protocol["impact_96"],
    )


def test_runtime_parameter_defaults(protocol: Dict[str, Any]) -> None:
    """New runs use stackers and the 96ch fixture without requiring V2."""
    parameters = Mock()
    protocol["add_parameters"](parameters)
    options = {
        call.kwargs["variable_name"]: call.kwargs
        for call in parameters.add_bool.call_args_list
    }
    assert options["use_impact_protection"]["default"] is True
    assert (
        options["use_impact_protection"]["display_name"] == "Use 96CH Impact Protection"
    )
    assert options["use_impact_protection_v2"]["default"] is False
    assert options["use_96ch_stackers"]["default"] is True


@pytest.mark.parametrize("channels", [1, 8, 96])
@pytest.mark.parametrize("enabled_96", [False, True])
@pytest.mark.parametrize("enabled_v2", [False, True])
def test_controller_connections_are_independent(
    protocol: Dict[str, Any], channels: int, enabled_96: bool, enabled_v2: bool
) -> None:
    """Each switch controls only its controller for every pipette channel count."""
    ctx = SimpleNamespace(
        params=SimpleNamespace(
            use_impact_protection=enabled_96,
            use_impact_protection_v2=enabled_v2,
            use_96ch_stackers=False,
        )
    )
    result = protocol["initialize"](
        ctx, SimpleNamespace(pipette_channels=channels), False, Mock()
    )
    v2_builder = protocol["_build_impact_protection_v2_with_port"]
    fixture_builder = protocol["_build_impact_protection_96ch_with_port"]
    if enabled_v2:
        v2_builder.assert_called_once_with(
            simulate=False, ctx=ctx, skip_port="/dev/env"
        )
        assert result["ImpactSerial"] is protocol["impact_v2"]
    else:
        v2_builder.assert_not_called()
        assert result["ImpactSerial"] is None
    if enabled_96 and channels == 96:
        fixture_builder.assert_called_once_with(
            simulate=False,
            ctx=ctx,
            skip_ports=["/dev/env", "/dev/v2"] if enabled_v2 else ["/dev/env"],
        )
        assert result["ImpactSerial96"] is protocol["impact_96"]
    else:
        fixture_builder.assert_not_called()
        assert result["ImpactSerial96"] is None
    assert result["use_96ch_stackers"] is False


def test_missing_new_parameters_do_not_require_v2(protocol: Dict[str, Any]) -> None:
    """Older parameter objects inherit V2-off/stackers-on without probing V2."""
    protocol["_build_impact_protection_v2_with_port"].side_effect = RuntimeError(
        "Target ImpactProtection device not found"
    )
    result = protocol["initialize"](
        SimpleNamespace(params=SimpleNamespace(use_impact_protection=True)),
        SimpleNamespace(pipette_channels=96),
        False,
        Mock(),
    )
    assert result["use_impact_protection_v2"] is False
    assert result["use_96ch_stackers"] is True
    assert result["ImpactSerial96"] is protocol["impact_96"]
    protocol["_build_impact_protection_v2_with_port"].assert_not_called()


@pytest.mark.parametrize("failed_controller", ["v2", "96"])
def test_requested_controller_failure_propagates_and_cleans_up(
    protocol: Dict[str, Any], failed_controller: str
) -> None:
    """Explicitly requested hardware failures remain visible and close resources."""
    name = (
        "_build_impact_protection_v2_with_port"
        if failed_controller == "v2"
        else "_build_impact_protection_96ch_with_port"
    )
    failure = RuntimeError("Target ImpactProtection device not found")
    protocol[name].side_effect = failure
    recorder = Mock()
    ctx = SimpleNamespace(
        params=SimpleNamespace(
            use_impact_protection=True, use_impact_protection_v2=True
        )
    )
    with pytest.raises(RuntimeError) as error:
        protocol["initialize"](
            ctx, SimpleNamespace(pipette_channels=96), False, recorder
        )
    assert error.value is failure
    recorder.stop.assert_called_once_with()
    recorder.deactivate.assert_called_once_with()
    protocol["environment"].close.assert_called_once_with()
    protocol["set_output_file"].assert_called_once_with(None)
    if failed_controller == "96":
        protocol["impact_v2"].close.assert_called_once_with()
    else:
        protocol["_build_impact_protection_96ch_with_port"].assert_not_called()
        protocol["impact_v2"].close.assert_not_called()


@pytest.mark.parametrize("channels", [1, 8, 96])
@pytest.mark.parametrize("enabled_96", [False, True])
@pytest.mark.parametrize("enabled_v2", [False, True])
def test_measurement_hooks_observe_independent_switches(
    protocol: Dict[str, Any], channels: int, enabled_96: bool, enabled_v2: bool
) -> None:
    """V2-only and 96ch-only operation both keep their required commands."""
    fixture = _fixture(protocol, channels, enabled_96, enabled_v2)
    protocol["maybe_switch_mode"](fixture, 200)
    protocol["maybe_close_all_gratings"](fixture)
    if enabled_v2:
        protocol["impact_v2"].switch_mode.assert_called_once_with("SET_LEFT_T50")
        protocol["impact_v2"].close_all_gratings.assert_called_once_with()
    else:
        protocol["impact_v2"].switch_mode.assert_not_called()
        protocol["impact_v2"].close_all_gratings.assert_not_called()
    if enabled_96 and channels == 96:
        protocol["impact_96"].set_left_p200.assert_called_once_with()
    else:
        protocol["impact_96"].set_left_p200.assert_not_called()


@pytest.mark.parametrize("enabled_96", [False, True])
@pytest.mark.parametrize("enabled_v2", [False, True])
@pytest.mark.parametrize("slot", ["A1", "B1", "C2", None])
def test_stacker_clearance_keeps_96ch_home_when_v2_disabled(
    protocol: Dict[str, Any], enabled_96: bool, enabled_v2: bool, slot: Any
) -> None:
    """Independent controllers retain the existing A1/B1 gripper clearance rule."""
    fixture = _fixture(protocol, 96, enabled_96, enabled_v2)
    protocol["maybe_home_impact_for_stacker_move"](fixture, slot)
    needs_clearance = slot in {"A1", "B1"}
    assert protocol["impact_96"].home.call_count == int(enabled_96 and needs_clearance)
    assert protocol["impact_v2"].close_all_gratings.call_count == int(
        enabled_v2 and needs_clearance
    )


def test_analysis_does_not_issue_impact_motion(protocol: Dict[str, Any]) -> None:
    """Protocol analysis cannot invoke grating, fixture-mode, or Home movement."""
    fixture = _fixture(protocol, 96, True, True)
    fixture.ctx.is_simulating.return_value = True
    protocol["maybe_switch_mode"](fixture, 200)
    protocol["maybe_close_all_gratings"](fixture)
    protocol["maybe_home_impact_protection_96ch"](fixture)
    protocol["maybe_home_impact_for_stacker_move"](fixture, "A1")
    assert protocol["impact_v2"].mock_calls == []
    assert protocol["impact_96"].mock_calls == []
