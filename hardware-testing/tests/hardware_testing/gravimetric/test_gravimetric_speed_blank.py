"""Check timed blank correction and preserve the 96-channel workflow."""

import ast
from contextlib import contextmanager, nullcontext
from dataclasses import dataclass
import json
import math
from pathlib import Path
from statistics import median
from types import SimpleNamespace
from typing import Any, Dict, Iterator
from unittest.mock import Mock

import pytest

from opentrons.hardware_control.types import Axis
from opentrons.types import Mount


@pytest.fixture
def protocol() -> Dict[str, Any]:
    """Load the actual calculation/lifecycle code without the download bootstrap."""
    source = (
        Path(__file__).parents[3]
        / "hardware_testing/gravimetric/protocol_replacement/gravimetric_speed.py"
    )
    names = {
        "EvaporationRateObservation",
        "EvaporationPhaseRateEstimate",
        "EvaporationRateEstimate",
        "_measurement_reference_time",
        "_measurement_elapsed_seconds",
        "_get_max_evaporation_compensation",
        "_log_evaporation_diagnostics",
        "_robust_evaporation_rate",
        "_timed_evaporation_compensation",
        "_run_and_store_trial",
        "calculate_evaporation",
        "_prepare_dry_blank_tip",
        "_PipetteMotorState",
        "_present_pipette_axes",
        "_read_pipette_motor_engaged",
        "_capture_pipette_motor_states",
        "_read_pipette_currents",
        "_read_capacity_test_currents",
        "_set_pipette_currents",
        "_set_pipette_engaged",
        "_verify_pipette_engagement",
        "_verify_pipette_currents",
        "_DualPipetteHeatGuard",
        "_dual_pipette_heat_guard",
        "_finalize_fixture_data_before_upload",
        "_run_fixture",
        "run",
    }
    tree = ast.parse(source.read_text())
    nodes = [
        node
        for node in tree.body
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name in names
    ]
    assert {node.name for node in nodes} == names
    constants = {
        "SCALE_SECONDS_TO_TRUE_STABILIZE",
        "PIPETTE_IDLE_CURRENT_AMPS",
        "PIPETTE_CURRENT_TOLERANCE_AMPS",
        "PIPETTE_AXES_BY_MOUNT",
    }
    nodes = [
        node
        for node in tree.body
        if isinstance(node, (ast.Assign, ast.AnnAssign))
        and any(
            isinstance(target, ast.Name)
            and (target.id in constants or target.id.startswith("EVAPORATION_"))
            for target in (
                node.targets if isinstance(node, ast.Assign) else [node.target]
            )
        )
    ] + nodes
    namespace: Dict[str, Any] = {
        "__name__": __name__,
        "dataclass": dataclass,
        "median": median,
        "math": math,
        "json": json,
        "Axis": Axis,
        "Mount": Mount,
        "contextmanager": contextmanager,
        "print_info": Mock(),
        "print_warning": Mock(),
        "print_error": Mock(),
        "_resolve_hardware_result": lambda hw, result: result,
    }
    module = ast.fix_missing_locations(
        ast.Module(
            body=ast.parse("from __future__ import annotations").body + nodes,
            type_ignores=[],
        )
    )
    exec(compile(module, str(source), "exec"), namespace)
    return namespace


def test_phase_filtering_is_independent(protocol: Dict[str, Any]) -> None:
    """Reject a positive mass-gain phase and an isolated high-rate outlier."""
    observation = protocol["EvaporationRateObservation"]
    samples = [observation(i, "aspirate", 10, 0.1, 0.01) for i in range(9)]
    samples.append(observation(9, "aspirate", 10, 20, 2))
    samples += [observation(i, "dispense", 10, -0.1, -0.01) for i in range(10)]
    estimate = protocol["_robust_evaporation_rate"](
        samples, SimpleNamespace(volumes={50: [50]}, extra_volumes={})
    )
    assert estimate.aspirate_evaporation_rate == pytest.approx(0.01)
    assert estimate.legacy_aspirate_compensation_ul == pytest.approx(0.1)
    assert estimate.dispense_evaporation_rate == 0
    assert not estimate.valid
    assert "dispense" in estimate.fallback_reason


@pytest.mark.parametrize("count, rate", [(2, 0.01), (10, 0.2), (10, math.nan)])
def test_unusable_blank_rates_fall_back_to_zero(
    protocol: Dict[str, Any], count: int, rate: float
) -> None:
    """Too few samples, excessive compensation and nonfinite data are rejected."""
    observation = protocol["EvaporationRateObservation"]
    samples = [
        observation(i, phase, 10, rate * 10, rate)
        for i in range(count)
        for phase in ("aspirate", "dispense")
    ]
    estimate = protocol["_robust_evaporation_rate"](
        samples, SimpleNamespace(volumes={50: [1]}, extra_volumes={})
    )
    assert not estimate.valid
    assert estimate.aspirate_evaporation_rate == 0
    assert estimate.dispense_evaporation_rate == 0


@pytest.mark.parametrize("channels", [1, 8, 96])
def test_trial_compensation_preserves_96ch_fixed_correction(
    protocol: Dict[str, Any], channels: int
) -> None:
    """1/8ch scale rates by sample midpoint time; 96ch retains fixed uL values."""
    measurements = [
        SimpleNamespace(samples_start_time=t, samples_duration=2) for t in (0, 10, 30)
    ]
    protocol["run_one_test"] = Mock(return_value=measurements)
    protocol["calculate_change_in_volume"] = Mock(return_value=100)
    protocol["report"] = Mock()
    fixture = SimpleNamespace(
        pipette_channels=channels,
        channels=[0],
        increment=False,
        single_tip_96=False,
        ctx=Mock(is_simulating=Mock(return_value=True)),
        test_report=Mock(),
    )
    _, aspirate, dispense = protocol["_run_and_store_trial"](
        fixture, 50, Mock(), 50, 0, 0, None, Mock(), 0.1, 0.2
    )
    divisor = 96 if channels == 96 else 1
    assert aspirate == pytest.approx((99.9 if channels == 96 else 99) / divisor)
    assert dispense == pytest.approx((100.2 if channels == 96 else 104) / divisor)


def test_96ch_evaporation_keeps_original_probe_and_wait(
    protocol: Dict[str, Any]
) -> None:
    """Do not apply the new dry-tip or timing options to the 96ch calculation."""
    legacy = Mock(return_value=([[]], 0.1, 0.2))
    protocol["_calculate_96ch_evaporation"] = legacy
    ctx, fixture, liquid, tip = (
        Mock(),
        SimpleNamespace(pipette_channels=96),
        Mock(),
        Mock(),
    )
    assert protocol["calculate_evaporation"](
        ctx, fixture, liquid, tip, scale_stabilization_seconds=15
    ) == ([[]], 0.1, 0.2)
    legacy.assert_called_once_with(ctx, fixture, liquid, tip)


def test_dry_blank_uses_a_fresh_tip_after_probing(protocol: Dict[str, Any]) -> None:
    """Probe before discarding the wet tip and selecting the next unused tip."""
    events = Mock()
    protocol["maybe_switch_mode"] = events.switch
    protocol["remove_tip"] = events.remove
    protocol["pick_up_tip_for_channel"] = events.pickup
    fixture = SimpleNamespace(
        pipette=events.pipette, tip_sizes=[50], liquid_source=Mock()
    )
    fresh = Mock()
    available = [fresh]
    assert protocol["_prepare_dry_blank_tip"](fixture, available) is fresh
    assert available == []
    assert [call[0] for call in events.mock_calls] == [
        "pipette._retract",
        "switch",
        "pipette.require_liquid_presence",
        "pipette._retract",
        "remove",
        "pickup",
    ]


@pytest.mark.parametrize("fail", [False, True])
def test_dual_guard_restores_both_motors_on_exit(
    protocol: Dict[str, Any], fail: bool
) -> None:
    """Both entry states survive mount switches, load resets and test exceptions."""
    run = {Axis.P_L: 0.8, Axis.P_R: 0.9}
    hold = {Axis.P_L: 0.3, Axis.P_R: 0.4}
    engaged = {Axis.P_L: True, Axis.P_R: False}
    entry = (dict(run), dict(hold), dict(engaged))
    backend = SimpleNamespace(
        motor_run_currents=run,
        motor_hold_currents=hold,
        is_motor_engaged=lambda axis: engaged[axis],
        set_active_current=run.update,
        set_hold_current=hold.update,
    )
    hw = SimpleNamespace(
        _backend=backend,
        axis_is_present=lambda axis: True,
        engage_axes=lambda axes: engaged.update({axis: True for axis in axes}),
        disengage_axes=lambda axes: engaged.update({axis: False for axis in axes}),
        hardware_pipettes={
            mount: SimpleNamespace(
                plunger_motor_current=SimpleNamespace(run=1.2, idle=0.5)
            )
            for mount in (Mount.LEFT, Mount.RIGHT)
        },
    )
    ctx = SimpleNamespace(
        _core=SimpleNamespace(get_hardware=lambda: hw),
        is_simulating=lambda: False,
    )
    with pytest.raises(RuntimeError, match="test failed") if fail else nullcontext():
        with protocol["_dual_pipette_heat_guard"](
            ctx, ["left", "right"], True
        ) as guard:
            guard.prepare_mount("left")
            assert not any(engaged.values())
            assert list(run.values()) == [0.1, 0.1]
            guard.reapply_after_build("left")
            guard.activate_mount("left")
            assert engaged == {Axis.P_L: True, Axis.P_R: False}
            assert run == {Axis.P_L: 1.2, Axis.P_R: 0.1}
            guard.deactivate_mount("left")
            guard.prepare_mount("right")
            guard.reapply_after_build("right")
            guard.activate_mount("right")
            assert engaged == {Axis.P_L: False, Axis.P_R: True}
            if fail:
                raise RuntimeError("test failed")
    assert (run, hold, engaged) == entry


@pytest.mark.parametrize("finalized", [False, True])
def test_upload_runs_only_after_successful_finalization(
    protocol: Dict[str, Any], finalized: bool
) -> None:
    """A failed recorder/report finalization cannot upload incomplete files."""
    events = Mock()
    fixture = SimpleNamespace(
        ctx=SimpleNamespace(params=SimpleNamespace(upload_csv_automatically=True)),
        fast_simulate=False,
        increment=False,
        mount="left",
        test_report=SimpleNamespace(file_path=Path("report.csv")),
    )
    protocol["_MEASUREMENTS"] = []
    protocol["_store_config_as_old_style"] = events.config
    protocol["_should_alter_discontinuity"] = Mock(return_value=False)
    protocol["_run"] = events.run
    protocol["maybe_home_impact_protection_96ch"] = events.home
    protocol["_finalize_fixture_data_before_upload"] = events.finalize
    events.finalize.return_value = finalized
    protocol["upload_data_to_google_drive"] = events.upload
    with nullcontext() if finalized else pytest.raises(
        RuntimeError, match="finalization failed"
    ):
        protocol["_run_fixture"](fixture.ctx, fixture)
    assert [call[0] for call in events.mock_calls] == (
        ["config", "run", "home", "finalize", "upload"]
        if finalized
        else ["config", "run", "home", "finalize"]
    )


def test_finalization_finishes_writers_even_if_recorder_stop_fails(
    protocol: Dict[str, Any]
) -> None:
    """Always close devices, save the report, and clear the log destination."""
    events = Mock()
    fixture = SimpleNamespace(
        recorder=events.recorder,
        env_sensor=Mock(),
        ImpactSerial_U=Mock(),
        ImpactSerial_96=Mock(),
        fast_simulate=False,
        test_report=events.report,
    )
    events.recorder.stop.side_effect = RuntimeError("stop failed")
    protocol["_close_device"] = events.close
    protocol["set_output_file"] = events.output
    assert protocol["_finalize_fixture_data_before_upload"](fixture) is False
    assert [call[0] for call in events.mock_calls] == [
        "recorder.stop",
        "recorder.deactivate",
        "close",
        "close",
        "close",
        "report.save_to_disk",
        "output",
    ]
    events.output.assert_called_once_with(None)


def test_post_build_heat_guard_failure_cleans_up_fixture(
    protocol: Dict[str, Any]
) -> None:
    """A failure before _run_fixture still closes the already-started recorder."""
    guard = Mock()
    guard.reapply_after_build.side_effect = RuntimeError("current readback failed")

    @contextmanager
    def heat_guard(*args: Any) -> Iterator[Any]:
        try:
            yield guard
        finally:
            guard.restore()

    ctx = Mock(is_simulating=Mock(return_value=False))
    settings = SimpleNamespace(
        pipette_channels=1, pipette_volume=50, mounts_to_test=["left", "right"]
    )
    fixture = Mock()
    protocol.update(
        {
            "_load_stacker_drop_offsets_config_for_run": Mock(),
            "_USED_TIP_LOCATIONS": set(),
            "_DECK_LABWARE_BY_SLOT": {},
            "CSVSettings": Mock(parse_csv=Mock(return_value=settings)),
            "_get_mounts_to_test_from_runtime_param": Mock(
                return_value=["left", "right"]
            ),
            "replace": lambda obj, **kwargs: SimpleNamespace(**(vars(obj) | kwargs)),
            "_uses_dual_multi_extension_deck": Mock(return_value=False),
            "_uses_dual_mount_no_trash": Mock(return_value=False),
            "_uses_dual_single": Mock(return_value=True),
            "_should_manage_dual_pipette_heat": Mock(return_value=True),
            "_dual_pipette_heat_guard": heat_guard,
            "print_title": Mock(),
            "_capture_dual_mount_state": Mock(),
            "FixtureSettings": Mock(build=Mock(return_value=fixture)),
            "_finalize_fixture_data_before_upload": Mock(),
        }
    )
    with pytest.raises(RuntimeError, match="current readback failed"):
        protocol["run"](ctx)
    protocol["_finalize_fixture_data_before_upload"].assert_called_once_with(fixture)
    guard.restore.assert_called_once_with()
