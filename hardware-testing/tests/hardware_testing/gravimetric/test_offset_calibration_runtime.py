"""Preflight and exclusive-lifecycle tests with no real robot access."""

import asyncio
from concurrent.futures import Future
from contextlib import contextmanager
from copy import deepcopy
from importlib.machinery import ModuleSpec
from pathlib import Path
import stat
from typing import Any, Iterator
from unittest.mock import AsyncMock, MagicMock

import pytest

from hardware_testing.gravimetric.offset_calibration import runtime


@pytest.fixture
def snapshot() -> dict[str, Any]:
    """Return healthy 9.1.2 responses for all four stackers."""
    return {
        "health": {
            "robot_model": "OT-3 Standard",
            "api_version": "9.1.2",
            "maximum_protocol_api_version": [2, 29],
            "robot_serial": "FLEX-123",
        },
        "runs": {"data": [], "links": {"current": None}},
        "maintenance": None,
        "estop": {"data": {"status": "disengaged"}},
        "door": {"data": {"status": "closed"}},
        "instruments": {
            "data": [
                {
                    "instrumentType": "gripper",
                    "serialNumber": "GRP-123",
                    "ok": True,
                    "data": {
                        "jawState": "homed_ready",
                        "calibratedOffset": {
                            "source": "user",
                            "offset": {"x": 0, "y": 0, "z": 0},
                            "last_modified": "2026-11-04T00:00:00Z",
                            "reasonability_check_failures": [],
                        },
                    },
                }
            ]
        },
        "modules": {
            "data": [
                {
                    "moduleModel": "flexStackerModuleV1",
                    "serialNumber": f"STACKER-{row}",
                    "compatibleWithRobot": True,
                    "data": {
                        "status": "idle",
                        "installDetected": True,
                        "errorDetails": None,
                    },
                }
                for row in "ABCD"
            ]
        },
        "deck": {
            "data": {
                "cutoutFixtures": [
                    {
                        "cutoutId": f"cutout{row}3",
                        "cutoutFixtureId": "flexStackerModuleV1",
                        "opentronsModuleSerialNumber": f"STACKER-{row}",
                    }
                    for row in "ABCD"
                ]
            }
        },
    }


def test_preflight_matches_all_four_stackers(snapshot: dict[str, Any]) -> None:
    """Map serials by physical deck fixture, independently of module discovery order."""
    snapshot["modules"]["data"].reverse()
    assert runtime.validate_preflight(snapshot, {"A4", "B4", "C4", "D4"}) == {
        f"{row}4": f"STACKER-{row}" for row in "ABCD"
    }


@pytest.mark.parametrize(
    "path,value",
    [
        (("health", "robot_model"), "OT-2 Standard"),
        (("health", "api_version"), "9.2.0"),
        (("health", "maximum_protocol_api_version"), [2, 28]),
        (("health", "robot_serial"), None),
        (("runs", "links", "current"), {"href": "/runs/older-run"}),
        (("runs", "data"), [{"current": False, "status": "running"}]),
        (("maintenance",), {"data": {"id": "calibration"}}),
        (("estop", "data", "status"), "physicallyEngaged"),
        (("door", "data", "status"), "open"),
        (("instruments", "data", 0, "data", "jawState"), "holding"),
        (("instruments", "data", 0, "data", "jawState"), "stopped"),
        (("instruments", "data", 0, "data", "calibratedOffset", "source"), "default"),
        (("instruments", "data", 0, "data", "calibratedOffset", "last_modified"), None),
        (("modules", "data", 0, "data", "installDetected"), False),
        (("modules", "data", 0, "data", "status"), "busy"),
        (
            ("deck", "data", "cutoutFixtures", 0, "opentronsModuleSerialNumber"),
            "missing",
        ),
        (
            ("deck", "data", "cutoutFixtures", 0, "cutoutFixtureId"),
            "stagingAreaRightSlot",
        ),
    ],
)
def test_preflight_rejects_unsafe_state(
    snapshot: dict[str, Any], path: tuple[Any, ...], value: Any
) -> None:
    """Any unsafe condition blocks the session before service or motion changes."""
    item = snapshot
    for key in path[:-1]:
        item = item[key]
    item[path[-1]] = value
    with pytest.raises(runtime.PreflightError):
        runtime.validate_preflight(snapshot, {"A4"})


def test_duplicate_stacker_mapping_is_rejected(snapshot: dict[str, Any]) -> None:
    """Two slots cannot silently load the same physical stacker."""
    snapshot["deck"]["data"]["cutoutFixtures"][1][
        "opentronsModuleSerialNumber"
    ] = "STACKER-A"
    with pytest.raises(runtime.PreflightError, match="multiple slots"):
        runtime.validate_preflight(snapshot, {"A4", "B4"})


def test_unselected_stacker_does_not_block_route(snapshot: dict[str, Any]) -> None:
    """A route using A4 can be calibrated while an unrelated stacker is disconnected."""
    snapshot["modules"]["data"][1]["data"]["installDetected"] = False
    runtime.validate_preflight(snapshot, {"A4"})


def _fake_session_dependencies(
    monkeypatch: pytest.MonkeyPatch, snapshot: dict[str, Any]
) -> tuple[list[str], MagicMock]:
    events: list[str] = []
    hardware = MagicMock()
    hardware.sync.clean_up.side_effect = lambda: events.append("hardware-cleanup")
    hardware.clean_up_tm.side_effect = lambda: events.append("thread-cleanup")
    monkeypatch.setattr(runtime, "collect_snapshot", lambda: deepcopy(snapshot))
    monkeypatch.setattr(runtime, "_inherit_server_environment", lambda: None)
    monkeypatch.setattr(runtime, "_service", lambda action: events.append(action))
    monkeypatch.setattr(
        runtime.RobotSession, "_load_calibration_fingerprint", lambda self: None
    )
    monkeypatch.setattr(runtime.RobotSession, "_build_hardware", lambda self: hardware)
    return events, hardware


def test_clean_exit_closes_hardware_before_restarting_server(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, snapshot: dict[str, Any]
) -> None:
    """Only a successful empty-gripper session removes the durable recovery marker."""
    events, hardware = _fake_session_dependencies(monkeypatch, snapshot)
    with runtime.RobotSession({"A4"}, directory=tmp_path) as session:
        assert session.robot_serial == "FLEX-123"
        assert session.stacker_serials == {"A4": "STACKER-A"}
        assert session._marker.is_file()
        assert events == ["stop"]
    assert events == ["stop", "hardware-cleanup", "thread-cleanup", "start"]
    assert not session._marker.exists()
    hardware.sync.home.assert_not_called()
    hardware.sync.ungrip.assert_not_called()


@pytest.mark.parametrize("failure", ["held-rack", "exception", "initialization"])
def test_interruption_keeps_server_stopped_and_persists_marker(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    snapshot: dict[str, Any],
    failure: str,
) -> None:
    """Unknown position or grip state requires manual recovery, including init failures."""
    events, hardware = _fake_session_dependencies(monkeypatch, snapshot)
    if failure == "initialization":

        def fail_build(self: runtime.RobotSession) -> None:
            raise RuntimeError("controller failure")

        monkeypatch.setattr(runtime.RobotSession, "_build_hardware", fail_build)
    try:
        with runtime.RobotSession({"A4"}, directory=tmp_path) as session:
            session.unsafe_to_restart = failure == "held-rack"
            if failure == "exception":
                raise RuntimeError("motion failure")
    except RuntimeError:
        assert failure != "held-rack"
    assert "start" not in events
    assert (tmp_path / "offset-calibration.interrupted.json").is_file()
    hardware.sync.home.assert_not_called()
    hardware.sync.ungrip.assert_not_called()


def test_preflight_failure_leaves_server_and_hardware_untouched(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, snapshot: dict[str, Any]
) -> None:
    """An installation error must not stop the running server."""
    snapshot["modules"]["data"][0]["data"]["installDetected"] = False
    events, hardware = _fake_session_dependencies(monkeypatch, snapshot)
    with pytest.raises(runtime.PreflightError):
        with runtime.RobotSession({"A4"}, directory=tmp_path):
            pytest.fail("preflight should reject entry")
    assert events == []
    hardware.sync.clean_up.assert_not_called()
    assert not (tmp_path / "offset-calibration.interrupted.json").exists()


def test_marker_and_lock_block_new_sessions(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, snapshot: dict[str, Any]
) -> None:
    """Neither stale interruptions nor live sessions may be bypassed."""
    events, _ = _fake_session_dependencies(monkeypatch, snapshot)
    marker = tmp_path / "offset-calibration.interrupted.json"
    marker.write_text("{}")
    with pytest.raises(runtime.PreflightError, match="Manual recovery"):
        with runtime.RobotSession({"A4"}, directory=tmp_path):
            pytest.fail("marker should block entry")
    marker.unlink()
    with runtime._exclusive_lock(tmp_path):
        with pytest.raises(runtime.PreflightError, match="Another calibration"):
            with runtime.RobotSession({"A4"}, directory=tmp_path):
                pytest.fail("live lock should block entry")
    assert events == []


def test_recovery_requires_confirmation_and_preserves_marker_on_failure(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Manual acknowledgement cannot lose the recovery record on a service failure."""
    marker = tmp_path / "offset-calibration.interrupted.json"
    marker.write_text('{"state": "manual-recovery-required"}')
    start = MagicMock(side_effect=RuntimeError("service failure"))
    monkeypatch.setattr(runtime, "_service", start)
    with pytest.raises(runtime.PreflightError):
        runtime.acknowledge_recovery("yes", tmp_path)
    start.assert_not_called()
    with pytest.raises(RuntimeError, match="service failure"):
        runtime.acknowledge_recovery(runtime.RECOVERY_CONFIRMATION, tmp_path)
    assert marker.is_file()
    start.side_effect = None
    archive = runtime.acknowledge_recovery(runtime.RECOVERY_CONFIRMATION, tmp_path)
    assert archive.read_text() == '{"state": "manual-recovery-required"}'
    assert not marker.exists()
    start.assert_called_with("start")


@pytest.mark.parametrize("unsafe", [False, True])
def test_engine_cleanup_never_homes_or_releases_a_rack(unsafe: bool) -> None:
    """Uncertain grip state avoids the normal Engine's implicit hardware Stop/reset."""
    engine = MagicMock()
    engine.finish = AsyncMock()
    engine._get_queue_worker.join = AsyncMock()
    engine._plugin_starter.stop = AsyncMock()
    session = runtime.RobotSession({"A4"})
    session.unsafe_to_restart = unsafe
    asyncio.run(session._finish_engine(engine))
    if unsafe:
        engine.finish.assert_not_called()
        engine._get_queue_worker.join.assert_awaited_once()
        engine._door_watcher.stop.assert_called_once()
        engine._plugin_starter.stop.assert_awaited_once()
    else:
        engine.finish.assert_awaited_once()
        assert engine.finish.call_args.kwargs["drop_tips_after_run"] is False
        assert (
            engine.finish.call_args.kwargs["post_run_hardware_state"].name
            == "STAY_ENGAGED_IN_PLACE"
        )


def test_snapshot_requests_all_runs_and_read_only_endpoints(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """GET /runs must omit pageLength so an older unfinished run cannot be skipped."""
    get = MagicMock(return_value={})
    monkeypatch.setattr(runtime, "_get", get)
    runtime.collect_snapshot()
    paths = [call.args[0] for call in get.call_args_list]
    assert paths == [
        "/health",
        "/runs",
        "/maintenance_runs/current_run",
        "/instruments",
        "/modules",
        "/deck_configuration",
        "/robot/control/estopStatus",
        "/robot/door/status",
    ]
    assert get.call_args_list[2].kwargs == {"missing_ok": True}


def test_relative_environment_override_fails_before_stopping_server(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, snapshot: dict[str, Any]
) -> None:
    """Relative paths cannot mean different files in the service and SSH working directories."""
    events, _ = _fake_session_dependencies(monkeypatch, snapshot)
    monkeypatch.setenv("GRAVIMETRIC_STACKER_DROP_OFFSETS_CONFIG", "relative.json")
    with pytest.raises(runtime.PreflightError, match="absolute path"):
        with runtime.RobotSession({"A4"}, directory=tmp_path):
            pytest.fail("relative path must fail before exclusive control")
    assert events == []


def test_server_environment_preserves_only_explicit_configuration_keys(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Restore robot configuration before importing Opentrons without copying secrets."""
    for key in runtime.ENVIRONMENT_KEYS:
        monkeypatch.setenv(key, "old-value")
    monkeypatch.delenv("TEST_SECRET", raising=False)
    monkeypatch.delitem(runtime.sys.modules, "opentrons.config", raising=False)
    monkeypatch.setattr(runtime.sys, "path", runtime.sys.path.copy())
    verify_origin = MagicMock()
    monkeypatch.setattr(runtime, "_verify_package_origin", verify_origin)
    monkeypatch.setattr(
        runtime.subprocess, "check_output", lambda *args, **kwargs: "123\n"
    )
    monkeypatch.setattr(
        Path,
        "read_bytes",
        lambda path: (
            b"RUNNING_ON_VERDIN=1\0PYTHONPATH=/opt/robot-server:/opt/robot-deps\0"
            b"OT_SYSTEM_VERSION=9.1.2\0OT_API_CONFIG_DIR=/data\0"
            b"GRAVIMETRIC_STACKER_DROP_OFFSETS_CONFIG=/data/custom.json\0"
            b"TEST_SECRET=do-not-copy\0"
        ),
    )
    runtime._inherit_server_environment()
    assert runtime.os.environ["RUNNING_ON_VERDIN"] == "1"
    assert "RUNNING_ON_PI" not in runtime.os.environ
    assert runtime.os.environ["OT_API_CONFIG_DIR"] == "/data"
    assert (
        runtime.os.environ["GRAVIMETRIC_STACKER_DROP_OFFSETS_CONFIG"]
        == "/data/custom.json"
    )
    assert "TEST_SECRET" not in runtime.os.environ
    assert runtime.sys.path[:2] == ["/opt/robot-server", "/opt/robot-deps"]
    verify_origin.assert_called_once()


def test_package_origin_mismatch_blocks_before_service_stop(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, snapshot: dict[str, Any]
) -> None:
    """An already imported /opt tool cannot calibrate for a production /data package."""
    import hardware_testing

    events, hardware = _fake_session_dependencies(monkeypatch, snapshot)
    monkeypatch.setattr(
        hardware_testing, "__file__", "/opt/robot-server/hardware_testing/__init__.py"
    )
    spec = ModuleSpec(
        "hardware_testing", loader=None, origin="/data/hardware_testing/__init__.py"
    )
    monkeypatch.setattr(runtime.PathFinder, "find_spec", lambda name, paths: spec)
    monkeypatch.setattr(
        runtime, "_inherit_server_environment", runtime._verify_package_origin
    )
    with pytest.raises(runtime.PreflightError, match="tool=/opt/.*production=/data/"):
        with runtime.RobotSession({"A4"}, directory=tmp_path):
            pytest.fail(
                "different package origins must not take exclusive hardware ownership"
            )
    assert events == []
    hardware.sync.clean_up.assert_not_called()
    assert not (tmp_path / "offset-calibration.interrupted.json").exists()


def test_package_origin_resolves_symlinks_to_same_package(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Different path spellings of the same installed package are not a mismatch."""
    import hardware_testing

    package = tmp_path / "package.py"
    package.write_text("")
    alias = tmp_path / "alias.py"
    alias.symlink_to(package)
    monkeypatch.setattr(hardware_testing, "__file__", str(package))
    spec = ModuleSpec("hardware_testing", loader=None, origin=str(alias))
    monkeypatch.setattr(runtime.PathFinder, "find_spec", lambda name, paths: spec)
    runtime._verify_package_origin()


def test_recovery_marker_directory_is_synced_before_stopping_server(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, snapshot: dict[str, Any]
) -> None:
    """The marker's directory entry must survive power loss after service shutdown."""
    events, _ = _fake_session_dependencies(monkeypatch, snapshot)
    original_fsync = runtime.os.fsync

    def sync(descriptor: int) -> None:
        events.append(
            "sync-directory"
            if stat.S_ISDIR(runtime.os.fstat(descriptor).st_mode)
            else "sync-file"
        )
        original_fsync(descriptor)

    monkeypatch.setattr(runtime.os, "fsync", sync)
    with runtime.RobotSession({"A4"}, directory=tmp_path):
        assert events == ["sync-file", "sync-directory", "stop"]


def test_hardware_factory_uses_real_configuration_without_firmware_updates(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A calibration controller must not replace tuning or initiate a firmware update."""
    from opentrons import hardware_control
    from opentrons.config import robot_configs

    configuration = object()
    manager = MagicMock()
    manager.nonblocking_builder.side_effect = lambda builder: builder
    monkeypatch.setattr(hardware_control, "ThreadManager", manager)
    monkeypatch.setattr(robot_configs, "load_ot3", lambda: configuration)
    hardware = runtime.RobotSession._build_hardware()
    assert manager.call_args.kwargs["config"] is configuration
    assert manager.call_args.kwargs["update_firmware"] is False
    assert manager.call_args.kwargs["use_usb_bus"] is True
    hardware.managed_thread_ready_blocking.assert_called_once()
    hardware.sync.cache_instruments.assert_called_once()


def test_fresh_protocol_contexts_use_one_simulator_without_state_leaks(
    monkeypatch: pytest.MonkeyPatch, snapshot: dict[str, Any]
) -> None:
    """The actual 9.1.2 Engine factory can load the same adapter in consecutive routes."""
    from opentrons.config.robot_configs import build_config_ot3
    from opentrons.hardware_control import ThreadManager
    from opentrons.hardware_control.ot3api import OT3API
    from opentrons.protocol_engine.resources import ModuleDataProvider

    monkeypatch.setattr(ModuleDataProvider, "load_module_calibrations", lambda: {})
    hardware = ThreadManager(
        OT3API.build_hardware_simulator, config=build_config_ot3({})
    )
    session = runtime.RobotSession({"A4"})
    session._hardware = hardware
    session.snapshot = snapshot
    snapshot["deck"]["data"]["cutoutFixtures"].extend(
        {"cutoutId": f"cutout{row}{col}", "cutoutFixtureId": f"single{name}Slot"}
        for row in "ABCD"
        for col, name in ((1, "Left"), (2, "Center"))
    )
    contexts = []
    try:
        for _ in range(2):
            with session.protocol_context() as context:
                context.load_adapter("opentrons_flex_96_tiprack_adapter", "D2")
                assert str(context.api_version) == "2.29"
                contexts.append(context)
    finally:
        hardware.sync.clean_up()
        hardware.clean_up_tm()
    assert contexts[0] is not contexts[1]


@pytest.mark.parametrize("holding", [False, True])
def test_operator_quit_restores_server_only_when_gripper_is_known_empty(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    snapshot: dict[str, Any],
    holding: bool,
) -> None:
    """Q/ESC preserves the workflow's grip state rather than creating an artificial error."""
    from opentrons import protocol_api
    from opentrons.util import async_helpers

    @contextmanager
    def fake_engine_thread(manager: Any) -> Iterator[tuple[Any, None]]:
        yield MagicMock(), None

    events, _ = _fake_session_dependencies(monkeypatch, snapshot)
    monkeypatch.setattr(
        async_helpers, "async_context_manager_in_thread", fake_engine_thread
    )
    monkeypatch.setattr(
        protocol_api, "create_protocol_context", lambda **kwargs: object()
    )
    with pytest.raises(runtime.OperatorAbort):
        with runtime.RobotSession({"A4"}, directory=tmp_path) as session:
            with session.protocol_context():
                session.unsafe_to_restart = holding
                raise runtime.OperatorAbort("operator quit")
    assert ("start" in events) is not holding
    assert (tmp_path / "offset-calibration.interrupted.json").exists() is holding


def test_module_offsets_are_serializable_and_change_the_calibration_fingerprint(
    monkeypatch: pytest.MonkeyPatch, snapshot: dict[str, Any]
) -> None:
    """Resume must invalidate previous route confirmations after module recalibration."""
    from opentrons.protocol_engine.resources import ModuleDataProvider
    from opentrons.protocol_engine.types import (
        DeckSlotLocation,
        ModuleOffsetData,
        ModuleOffsetVector,
    )
    from opentrons.types import DeckSlotName

    offset = ModuleOffsetData(
        location=DeckSlotLocation(slotName=DeckSlotName.from_primitive("A3")),
        moduleOffsetVector=ModuleOffsetVector(x=1, y=2, z=3),
    )
    monkeypatch.setattr(
        ModuleDataProvider, "load_module_calibrations", lambda: {"STACKER-A": offset}
    )
    session = runtime.RobotSession({"A4"})
    session.snapshot = snapshot
    session._load_calibration_fingerprint()
    before = session.calibration_fingerprint
    offset.moduleOffsetVector.x = 1.5
    session._load_calibration_fingerprint()
    assert len(before) == 64
    assert session.calibration_fingerprint != before


@pytest.mark.parametrize("event_kind", ["door", "estop"])
def test_interlock_change_halts_raw_motion_and_latches_recovery(
    event_kind: str,
) -> None:
    """Events during raw motion must stop it even if the Protocol Engine queue is idle."""
    from opentrons.hardware_control.types import (
        DoorState,
        DoorStateNotification,
        EstopState,
        EstopStateNotification,
    )

    async def check() -> None:
        session = runtime.RobotSession({"A4"})
        hardware = MagicMock()
        hardware.halt = AsyncMock()
        hardware.cancel_execution_and_running_tasks = AsyncMock()
        hardware.loop = asyncio.get_running_loop()
        session._hardware = hardware
        event = (
            DoorStateNotification(new_state=DoorState.OPEN)
            if event_kind == "door"
            else EstopStateNotification(new_state=EstopState.PHYSICALLY_ENGAGED)
        )
        # An empty-gripper preparation phase intentionally permits the door to open.
        session._on_hardware_event(event)
        assert session.safety_fault is None
        hardware.halt.assert_not_called()
        session.unsafe_to_restart = True
        session._on_hardware_event(event)
        await asyncio.wrap_future(session._interruption_future)
        hardware.halt.assert_awaited_once_with(disengage_before_stopping=False)
        hardware.cancel_execution_and_running_tasks.assert_awaited_once()
        session.unsafe_to_restart = False
        session._on_hardware_event(DoorStateNotification(new_state=DoorState.CLOSED))
        session._on_hardware_event(
            EstopStateNotification(new_state=EstopState.DISENGAGED)
        )
        assert session.unsafe_to_restart
        with pytest.raises(RuntimeError, match="manual recovery"):
            session.raise_if_interrupted()

    asyncio.run(check())


@pytest.mark.parametrize("inside_protocol", [False, True])
def test_terminal_interruption_halts_inflight_motion_before_closing_hardware(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    snapshot: dict[str, Any],
    inside_protocol: bool,
) -> None:
    """SIGINT, SIGHUP, and SIGTERM cannot leave a detached movement running on firmware."""
    from opentrons import protocol_api
    from opentrons.util import async_helpers

    @contextmanager
    def fake_engine_thread(manager: Any) -> Iterator[tuple[Any, None]]:
        yield MagicMock(), None

    def schedule(coroutine: Any, loop: Any) -> Future[None]:
        asyncio.run(coroutine)
        result: Future[None] = Future()
        result.set_result(None)
        return result

    events, hardware = _fake_session_dependencies(monkeypatch, snapshot)
    hardware.halt = AsyncMock(side_effect=lambda **kwargs: events.append("halt"))
    hardware.cancel_execution_and_running_tasks = AsyncMock(
        side_effect=lambda: events.append("cancel")
    )
    monkeypatch.setattr(runtime.asyncio, "run_coroutine_threadsafe", schedule)
    monkeypatch.setattr(
        async_helpers, "async_context_manager_in_thread", fake_engine_thread
    )
    monkeypatch.setattr(
        protocol_api, "create_protocol_context", lambda **kwargs: object()
    )
    with pytest.raises(KeyboardInterrupt):
        with runtime.RobotSession({"A4"}, directory=tmp_path) as session:
            if inside_protocol:
                with session.protocol_context():
                    raise KeyboardInterrupt("SSH disconnected")
            else:
                raise KeyboardInterrupt("during preparation")
    assert events == ["stop", "halt", "cancel", "hardware-cleanup", "thread-cleanup"]
    assert (tmp_path / "offset-calibration.interrupted.json").is_file()
    hardware.halt.assert_awaited_once_with(disengage_before_stopping=False)
    hardware.sync.home.assert_not_called()
    hardware.sync.ungrip.assert_not_called()
