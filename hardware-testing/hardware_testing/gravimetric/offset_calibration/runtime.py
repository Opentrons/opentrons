"""Exclusive, version-checked robot access for interactive offset calibration.

Importing this module never connects to hardware. Opentrons imports are delayed
until the robot-server environment has been inherited and preflight has passed.
"""

from __future__ import annotations

import asyncio
import contextlib
import fcntl
import hashlib
from importlib.machinery import PathFinder
import json
import os
from pathlib import Path
import subprocess
import sys
from types import TracebackType
from typing import Any, Iterator
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

from .operator import OperatorAbort


DIRECTORY = Path("/data/gravimetric")
SERVICE = "opentrons-robot-server"
RECOVERY_CONFIRMATION = (
    "I have safely supported or removed the labware and the gripper is empty"
)
ENVIRONMENT_KEYS = (
    "PYTHONPATH",
    "RUNNING_ON_PI",
    "RUNNING_ON_VERDIN",
    "OT_SYSTEM_VERSION",
    "OT_API_CONFIG_DIR",
    "GRAVIMETRIC_STACKER_DROP_OFFSETS_CONFIG",
)


class PreflightError(RuntimeError):
    """The robot is not ready for an exclusive calibration session."""


def _get(path: str, *, missing_ok: bool = False) -> Any:
    request = Request(
        f"http://127.0.0.1:31950{path}", headers={"Opentrons-Version": "*"}
    )
    try:
        with urlopen(request, timeout=10) as response:
            return json.load(response)
    except HTTPError as error:
        if missing_ok and error.code == 404:
            return None
        raise


def collect_snapshot() -> dict[str, Any]:
    """Read server state without making commands or maintenance runs."""
    return {
        "health": _get("/health"),
        # On 9.1.2, omitting pageLength returns ALL runs; there is no cursor.
        "runs": _get("/runs"),
        "maintenance": _get("/maintenance_runs/current_run", missing_ok=True),
        "instruments": _get("/instruments"),
        "modules": _get("/modules"),
        "deck": _get("/deck_configuration"),
        "estop": _get("/robot/control/estopStatus"),
        "door": _get("/robot/door/status"),
    }


def _gripper(snapshot: dict[str, Any]) -> dict[str, Any]:
    grippers = [
        item
        for item in snapshot["instruments"]["data"]
        if item.get("instrumentType") == "gripper"
    ]
    if len(grippers) != 1 or grippers[0].get("ok") is not True:
        raise PreflightError("Exactly one healthy gripper is required.")
    return grippers[0]


def validate_preflight(snapshot: dict[str, Any], stackers: set[str]) -> dict[str, str]:
    """Validate a captured response set, returning selected slot-to-serial mapping."""
    health = snapshot["health"]
    if health.get("robot_model") != "OT-3 Standard":
        raise PreflightError("This tool requires a Flex (OT-3 Standard).")
    if health.get("api_version", "").split("+")[0] != "9.1.2":
        raise PreflightError(
            "This tool's internal motion APIs require robot software 9.1.2."
        )
    if tuple(health.get("maximum_protocol_api_version", [])) < (2, 29):
        raise PreflightError("Protocol API 2.29 is required.")
    if not health.get("robot_serial"):
        raise PreflightError("The robot must report its serial number.")
    runs = snapshot["runs"]
    if runs.get("links", {}).get("current") or any(
        run.get("current")
        or run.get("status") not in {"succeeded", "failed", "stopped"}
        for run in runs["data"]
    ):
        raise PreflightError("Close all current or unfinished protocol runs first.")
    if snapshot["maintenance"] is not None:
        raise PreflightError("Close the current maintenance/calibration run first.")
    if snapshot["estop"]["data"].get("status") != "disengaged":
        raise PreflightError("The emergency stop must be released and acknowledged.")
    if snapshot["door"]["data"].get("status") != "closed":
        raise PreflightError("Close the robot door before calibration.")
    gripper = _gripper(snapshot)
    calibration = gripper["data"].get("calibratedOffset")
    if (
        not calibration
        or calibration.get("source") in (None, "default")
        or not calibration.get("last_modified")
        or calibration.get("reasonability_check_failures")
    ):
        raise PreflightError(
            "Complete a valid gripper calibration before route calibration."
        )
    if gripper["data"].get("jawState") not in {"homed_ready", "unhomed"}:
        raise PreflightError(
            "The gripper is holding labware or its jaw state is unknown."
        )
    return _validate_stackers(snapshot, stackers)


def _validate_stackers(snapshot: dict[str, Any], stackers: set[str]) -> dict[str, str]:
    if not stackers or not stackers.issubset({"A4", "B4", "C4", "D4"}):
        raise PreflightError("Select one or more stackers from A4, B4, C4, D4.")
    modules = {module["serialNumber"]: module for module in snapshot["modules"]["data"]}
    fixtures = snapshot["deck"]["data"]["cutoutFixtures"]
    selected: dict[str, str] = {}
    for slot in sorted(stackers):
        matches = [
            fixture
            for fixture in fixtures
            if fixture["cutoutId"] == f"cutout{slot[0]}3"
            and fixture["cutoutFixtureId"].startswith("flexStackerModuleV1")
        ]
        if len(matches) != 1:
            raise PreflightError(
                f"{slot}: configure exactly one stacker in the deck layout."
            )
        serial = matches[0].get("opentronsModuleSerialNumber")
        module = modules.get(serial, {})
        data = module.get("data", {})
        if (
            module.get("moduleModel") != "flexStackerModuleV1"
            or module.get("compatibleWithRobot") is not True
            or data.get("installDetected") is not True
            or data.get("status") != "idle"
            or data.get("errorDetails")
        ):
            raise PreflightError(
                f"{slot}: mapped stacker {serial!r} is absent, uninstalled, or not idle."
            )
        if serial in selected.values():
            raise PreflightError(
                "A stacker serial number is assigned to multiple slots."
            )
        selected[slot] = serial
    return selected


def _service(action: str) -> None:
    subprocess.run(["systemctl", action, SERVICE], check=True, timeout=45)


def _inherit_server_environment() -> None:
    pid = subprocess.check_output(
        ["systemctl", "show", "--property=MainPID", "--value", SERVICE],
        text=True,
        timeout=10,
    ).strip()
    if not pid.isdecimal() or int(pid) <= 0:
        raise PreflightError("robot-server must be running before preflight.")
    raw_environment = Path(f"/proc/{pid}/environ").read_bytes().split(b"\0")
    environment = {}
    for item in raw_environment:
        raw_key, separator, value = item.partition(b"=")
        if separator and raw_key.decode() in ENVIRONMENT_KEYS:
            environment[raw_key.decode()] = value.decode()
    if not (environment.get("RUNNING_ON_PI") or environment.get("RUNNING_ON_VERDIN")):
        raise PreflightError(
            "The server environment does not identify a physical robot."
        )
    if "opentrons.config" in sys.modules:
        raise PreflightError(
            "Launch in a fresh Python process before importing opentrons."
        )
    for key in ENVIRONMENT_KEYS:
        if key in environment:
            os.environ[key] = environment[key]
        else:
            os.environ.pop(key, None)
    python_paths = [
        entry for entry in environment.get("PYTHONPATH", "").split(os.pathsep) if entry
    ]
    sys.path[:] = python_paths + [
        entry for entry in sys.path if entry not in python_paths
    ]
    _verify_package_origin()


def _verify_package_origin() -> None:
    import hardware_testing

    # sys.path changes do not update an already imported package's __path__.
    # Do not calibrate against the launcher's /opt baseline if production would
    # import a different package (for example a /data override).
    current_origin = hardware_testing.__file__
    selected_spec = PathFinder.find_spec("hardware_testing", sys.path)
    selected_origin = selected_spec.origin if selected_spec is not None else None
    if not current_origin or not selected_origin:
        raise PreflightError(
            "Cannot resolve the production hardware_testing package location."
        )
    current_path = Path(current_origin).resolve()
    selected_path = Path(selected_origin).resolve()
    if current_path != selected_path:
        raise PreflightError(
            "The calibration tool and production resolve different hardware_testing packages: "
            f"tool={current_path}; production={selected_path}. "
            "Install and launch the calibration tool from the production package before continuing."
        )


@contextlib.contextmanager
def _exclusive_lock(directory: Path) -> Iterator[None]:
    directory.mkdir(parents=True, exist_ok=True)
    with (directory / "offset-calibration.lock").open("a+") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise PreflightError(
                "Another calibration or recovery session is active."
            ) from error
        try:
            yield
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


def _write_marker(path: Path, payload: dict[str, Any]) -> None:
    temporary = path.with_name(f".{path.name}.{uuid4().hex}.tmp")
    try:
        with temporary.open("x") as output:
            json.dump(payload, output, indent=2, sort_keys=True)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
        directory_fd = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        temporary.unlink(missing_ok=True)


def acknowledge_recovery(confirmation: str, directory: Path = DIRECTORY) -> Path:
    """Restore the server only after an operator explicitly confirms an empty gripper."""
    if confirmation != RECOVERY_CONFIRMATION:
        raise PreflightError(
            "Explicit confirmation of manual labware recovery is required."
        )
    with _exclusive_lock(directory):
        marker = directory / "offset-calibration.interrupted.json"
        if not marker.is_file():
            raise PreflightError("No interrupted calibration requires acknowledgement.")
        # Preserve the recovery requirement if starting the service fails.
        _service("start")
        archived = marker.with_name(f"offset-calibration.recovered.{uuid4().hex}.json")
        marker.rename(archived)
        return archived


class RobotSession:
    """Own the robot while the regular server is stopped; never home on entry/exit."""

    def __init__(self, stackers: set[str], directory: Path = DIRECTORY) -> None:
        """Configure a session without connecting to the robot."""
        self.stackers = stackers
        self.directory = directory
        self.snapshot: dict[str, Any] = {}
        self.stacker_serials: dict[str, str] = {}
        self.robot_serial = ""
        self.calibration_fingerprint = ""
        self.offset_override: Path | None = None
        self._unsafe_to_restart = False
        self.safety_fault: str | None = None
        self._interruption_future: Any = None
        self._unsubscribe: Any = None
        self._hardware: Any = None
        self._lock: Any = None
        self._server_stopped = False
        self._marker = directory / "offset-calibration.interrupted.json"

    def __enter__(self) -> RobotSession:
        """Validate the live server, preserve its environment, and take hardware ownership."""
        self._lock = _exclusive_lock(self.directory)
        self._lock.__enter__()
        try:
            if self._marker.exists():
                raise PreflightError(
                    f"Manual recovery is required; see {self._marker}."
                )
            self.snapshot = collect_snapshot()
            self.stacker_serials = validate_preflight(self.snapshot, self.stackers)
            self.snapshot["stacker_serials"] = self.stacker_serials
            _inherit_server_environment()
            self.robot_serial = self.snapshot["health"]["robot_serial"]
            override = os.environ.get("GRAVIMETRIC_STACKER_DROP_OFFSETS_CONFIG")
            self.offset_override = Path(override) if override else None
            if (
                self.offset_override is not None
                and not self.offset_override.is_absolute()
            ):
                raise PreflightError(
                    "GRAVIMETRIC_STACKER_DROP_OFFSETS_CONFIG must be an absolute path; "
                    "the server and calibration tool may have different working directories."
                )
            self._load_calibration_fingerprint()
            # Durable marker exists before taking the server down, including SIGKILL/power loss.
            _write_marker(
                self._marker,
                {
                    "robot_serial": self.robot_serial,
                    "pid": os.getpid(),
                    "state": "session-active",
                },
            )
            self._server_stopped = True
            _service("stop")
            self._hardware = self._build_hardware()
            self._unsubscribe = self._hardware.register_callback(
                self._on_hardware_event
            )
            return self
        except BaseException:
            self.__exit__(*sys.exc_info())
            raise

    @property
    def unsafe_to_restart(self) -> bool:
        """Whether grip, motion, or interlock state requires manual recovery."""
        return self._unsafe_to_restart or self.safety_fault is not None

    @unsafe_to_restart.setter
    def unsafe_to_restart(self, value: bool) -> None:
        self._unsafe_to_restart = value

    def raise_if_interrupted(self) -> None:
        """Stop the workflow permanently after an interlock opens during motion/holding."""
        if self.safety_fault is not None:
            raise RuntimeError(self.safety_fault)

    def _on_hardware_event(self, event: Any) -> None:
        from opentrons.hardware_control.types import (
            DoorState,
            DoorStateNotification,
            EstopState,
            EstopStateNotification,
        )

        door_opened = (
            isinstance(event, DoorStateNotification)
            and event.new_state is DoorState.OPEN
        )
        estop_engaged = (
            isinstance(event, EstopStateNotification)
            and event.new_state is not EstopState.DISENGAGED
        )
        if (
            self.unsafe_to_restart
            and self.safety_fault is None
            and (door_opened or estop_engaged)
        ):
            self.safety_fault = (
                "Door or emergency-stop interlock changed during calibration motion/holding; "
                "manual recovery is required before any further movement."
            )
            self._interruption_future = asyncio.run_coroutine_threadsafe(
                self._halt_interrupted(), self._hardware.loop
            )

    async def _halt_interrupted(self) -> None:
        try:
            await self._hardware.halt(disengage_before_stopping=False)
        finally:
            await self._hardware.cancel_execution_and_running_tasks()

    def _interrupt_from_terminal(self) -> None:
        self._unsafe_to_restart = True
        if self.safety_fault is None:
            self.safety_fault = (
                "Terminal disconnected or interrupted; manual recovery is required."
            )
        if self._interruption_future is None:
            self._interruption_future = asyncio.run_coroutine_threadsafe(
                self._halt_interrupted(), self._hardware.loop
            )
        self._interruption_future.result(timeout=10)

    def _load_calibration_fingerprint(self) -> None:
        from opentrons.protocol_engine.resources import ModuleDataProvider

        module_offsets = {
            serial: {
                "moduleOffsetVector": offset.moduleOffsetVector.model_dump(mode="json"),
                "location": offset.location.model_dump(mode="json"),
            }
            for serial, offset in ModuleDataProvider.load_module_calibrations().items()
        }
        gripper = _gripper(self.snapshot)
        basis = {
            "gripper_serial": gripper["serialNumber"],
            "gripper_offset": gripper["data"]["calibratedOffset"],
            "deck": sorted(
                self.snapshot["deck"]["data"]["cutoutFixtures"],
                key=lambda item: item["cutoutId"],
            ),
            "module_offsets": module_offsets,
        }
        self.calibration_fingerprint = hashlib.sha256(
            json.dumps(basis, sort_keys=True).encode()
        ).hexdigest()

    @staticmethod
    def _build_hardware() -> Any:
        from opentrons.config.robot_configs import load_ot3
        from opentrons.hardware_control import ThreadManager
        from opentrons.hardware_control.ot3api import OT3API
        from opentrons.hardware_control.types import HardwareFeatureFlags

        hardware = ThreadManager(
            ThreadManager.nonblocking_builder(OT3API.build_hardware_controller),
            config=load_ot3(),
            feature_flags=HardwareFeatureFlags.build_from_ff(),
            use_usb_bus=True,
            update_firmware=False,
        )
        try:
            hardware.managed_thread_ready_blocking()
            hardware.sync.cache_instruments()
        except BaseException:
            hardware.clean_up_tm()
            raise
        return hardware

    @contextlib.contextmanager
    def protocol_context(self) -> Iterator[Any]:
        """Create a fresh engine for a route, retaining the physical deck and calibration."""
        from opentrons.protocol_api import create_protocol_context
        from opentrons.protocols.api_support.types import APIVersion
        from opentrons.util.async_helpers import async_context_manager_in_thread

        if self._hardware is None:
            raise RuntimeError("Enter RobotSession before creating a protocol context.")
        with async_context_manager_in_thread(self._engine()) as (engine, loop):
            try:
                yield create_protocol_context(
                    api_version=APIVersion(2, 29),
                    hardware_api=self._hardware,
                    deck_type="ot3_standard",
                    protocol_engine=engine,
                    protocol_engine_loop=loop,
                )
            except OperatorAbort:
                # An explicit quit after release is safe; a quit while holding
                # keeps the flag set by the operator workflow.
                raise
            except KeyboardInterrupt:
                # Interrupting future.result() does not cancel its hardware motion.
                # Explicitly halt it before Engine cleanup and before closing CAN.
                self._interrupt_from_terminal()
                raise
            except BaseException:
                self.unsafe_to_restart = True
                raise

    @contextlib.asynccontextmanager
    async def _engine(self) -> Any:
        from opentrons.protocol_engine import Config, error_recovery_policy
        from opentrons.protocol_engine.create_protocol_engine import (
            create_protocol_engine,
        )
        from opentrons.protocol_engine.engine_support import create_run_orchestrator
        from opentrons.protocol_engine.resources.camera_provider import CameraProvider
        from opentrons.protocol_engine.types import DeckType

        deck = [
            (
                item["cutoutId"],
                item["cutoutFixtureId"],
                item.get("opentronsModuleSerialNumber"),
            )
            for item in self.snapshot["deck"]["data"]["cutoutFixtures"]
        ]
        hardware = self._hardware.wrapped()
        engine = await create_protocol_engine(
            hardware_api=hardware,
            config=Config(robot_type="OT-3 Standard", deck_type=DeckType.OT3_STANDARD),
            deck_configuration=deck,
            error_recovery_policy=error_recovery_policy.never_recover,
            load_fixed_trash=False,
        )
        orchestrator = create_run_orchestrator(
            hardware_api=hardware,
            protocol_engine=engine,
            camera_provider=CameraProvider(),
        )
        try:
            orchestrator.play(deck)
            yield engine
        finally:
            await self._finish_engine(engine)

    async def _finish_engine(self, engine: Any) -> None:
        from opentrons.protocol_engine.actions import FinishAction
        from opentrons.protocol_engine.types import PostRunHardwareState

        if self.unsafe_to_restart:
            # 9.1.2 finish() broadcasts Stop and resets hardware, even with STAY_ENGAGED.
            # Tear down engine-only resources so an uncertain held rack is not disturbed.
            engine._action_dispatcher.dispatch(FinishAction(set_run_status=False))
            await engine._get_queue_worker.join()
            engine._door_watcher.stop()
            await engine._plugin_starter.stop()
        else:
            await engine.finish(
                drop_tips_after_run=False,
                post_run_hardware_state=PostRunHardwareState.STAY_ENGAGED_IN_PLACE,
            )

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        """Release communication and restore the server only after a clean empty-gripper exit."""
        clean = (
            exc_type is None or isinstance(exc, OperatorAbort)
        ) and not self.unsafe_to_restart
        try:
            if self._hardware is not None:
                try:
                    if isinstance(exc, KeyboardInterrupt):
                        self._interrupt_from_terminal()
                    if self._interruption_future is not None:
                        self._interruption_future.result(timeout=10)
                    if self._unsubscribe is not None:
                        self._unsubscribe()
                    self._hardware.sync.clean_up()
                except BaseException:
                    clean = False
                    raise
                finally:
                    self._hardware.clean_up_tm()
            if self._server_stopped and clean:
                _service("start")
                self._marker.unlink()
            elif self._server_stopped:
                _write_marker(
                    self._marker,
                    {
                        "robot_serial": self.robot_serial,
                        "pid": os.getpid(),
                        "state": "manual-recovery-required",
                        "unsafe_to_restart": self.unsafe_to_restart,
                        "exception_type": exc_type.__name__ if exc_type else None,
                    },
                )
        finally:
            if self._lock is not None:
                self._lock.__exit__(exc_type, exc, traceback)
                self._lock = None
