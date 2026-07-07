"""Robot-server resouce class and functions for Pyro compatibility."""

from __future__ import annotations

import asyncio
import logging
import threading
from typing import TYPE_CHECKING, Any, Callable, Optional

from opentrons.config import (
    feature_flags as ff,
)
from opentrons.hardware_control.types import HardwareEvent, HardwareEventHandler
from opentrons.protocol_engine.resources.camera_provider import (
    CameraProvider,
)
from opentrons.protocol_engine.resources.file_provider import FileProvider
from opentrons.protocol_engine.state.state import EngineEventNotification
from opentrons.protocol_engine.types import DeckConfigurationType
from opentrons.util.pyro.pyro_daemon_utility import create_pyro_daemon
from opentrons.util.pyro.pyro_synchronous_adapter import (
    convert_result_to_proxy,
    pyro_behavior,
)
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
)

from robot_server.hardware import HardwareStateStore
from robot_server.service.pyro_utils.serpent_type_registry import (
    register_robot_server_types,
)

if TYPE_CHECKING:
    from robot_server.deck_configuration.store import DeckConfigurationStore
    from robot_server.maintenance_runs.maintenance_run_orchestrator_store import (
        MaintenanceRunOrchestratorStore,
    )
    from robot_server.runs.run_orchestrator_store import (
        RunOrchestratorStore,
    )

robot_server_pyro_resource_accessor = AppStateAccessor["RobotServerPyroResource"](
    "robot_server_pyro_resource"
)


log = logging.getLogger(__name__)

RS_PYRONAME = "robot-server-resource"


class RobotServerPyroResource:
    """Class to represent the resources the robot-server hosts which can be provided over Pyro5.

    This class manages each of the resources needed by the OT3API and Protocol Execution processes
    for the lifetime of a given resource. A single instance of this class is published on a Pyro
    Daemon and registered with the `opentrons-pyro-nameserver` service for access via remote request.
    """

    def __init__(self, loop: asyncio.AbstractEventLoop) -> None:
        # Specialty private member for daemon execution overloading - Relevant to PyroSynchronousObjects only
        self._execute_on_pyro_daemon_overload = True

        self._loop = loop

        # Default the resource variables to None - these will be set as services spin up
        self._run_orchestrator_store: Optional["RunOrchestratorStore"] = None
        self._maintenance_run_orchestrator_store: Optional[
            "MaintenanceRunOrchestratorStore"
        ] = None
        self._deck_configuration_store: Optional["DeckConfigurationStore"] = None
        self._camera_provider: Optional[CameraProvider] = None
        self._file_provider: Optional[FileProvider] = None
        self._notify_publishers: Optional[Callable[[], None]] = None
        self._hardware_state_store: Optional[HardwareStateStore] = None

    ### Setters for procedural state gathering - Not to be used from remote process ###
    def set_run_orchestrator_store(
        self, run_orchestrator_store: "RunOrchestratorStore"
    ) -> None:
        """Set the RunOrchestratorStore of the RobotServerPyroResource, not serialized for remote processes."""
        if self._run_orchestrator_store is None:
            self._run_orchestrator_store = run_orchestrator_store

    def set_maintenance_run_orchestorator_store(
        self, maintenance_run_orchestrator_store: "MaintenanceRunOrchestratorStore"
    ) -> None:
        """Set the MaintenanceRunOrchestratorStore of the RobotServerPyroResource, not serialized for remote processes."""
        if self._maintenance_run_orchestrator_store is None:
            self._maintenance_run_orchestrator_store = (
                maintenance_run_orchestrator_store
            )

    def set_deck_configuration_store(
        self, deck_configuration_store: "DeckConfigurationStore"
    ) -> None:
        """Set the DeckConfigurationStore of the RobotServerPyroResource, not serialized for remote processes."""
        if self._deck_configuration_store is None:
            self._deck_configuration_store = deck_configuration_store

    def set_camera_provider(self, camera_provider: CameraProvider) -> None:
        """Set the CameraProvider of the RobotServerPyroResource, not serialized for remote processes."""
        if self._camera_provider is None:
            self._camera_provider = camera_provider

    def set_file_provider(self, file_provider: FileProvider) -> None:
        """Set the FileProvider of the RobotServerPyroResource, not serialized for remote processes."""
        if self._file_provider is None:
            self._file_provider = file_provider

    def set_notify_publishers(self, notify_publishers: Callable[[], None]) -> None:
        """Set the Notificaiton Publishers of the RobotServerPyroResource, not serialized for remote processes."""
        # todo(chb, 2026-04-24): This is allowed to be overwritten since it will only be set once per run, it has yet to be determined if
        # they need refreshing. Will this cause problems with multi-run situations, like maintenance runs on top of existing runs?
        # Do we need an entirely seperate notification publisher for maintenance runs?
        self._notify_publishers = notify_publishers

    def set_hardware_state_store(self, hardware_store: HardwareStateStore) -> None:
        """Set the HardwareStateStore of the RobotServerPyroResource, not serialized for remote processes."""
        self._hardware_state_store = hardware_store

    ### Interface methods for remote access ###

    @pyro_behavior(specialty_func=convert_result_to_proxy, apply_local=False)
    def create_run_hardware_event_callback(self) -> HardwareEventHandler:
        """Create a callback for estop and other events during a Run.

        The returned callback is meant to run in the hardware API's thread.
        """
        orchestrator_store = self._run_orchestrator_store
        if orchestrator_store is not None:

            def run_handler_in_engine_thread_from_hardware_thread(
                event: HardwareEvent,
            ) -> None:
                asyncio.run_coroutine_threadsafe(
                    orchestrator_store.handle_proxy_hardware_event(event),
                    self._loop,
                )

            return run_handler_in_engine_thread_from_hardware_thread
        else:
            raise RuntimeError(
                "Cannot provide a hardware listener from the RobotServerPyroResource without a RunOrchestratorStore."
            )

    @pyro_behavior(specialty_func=convert_result_to_proxy, apply_local=False)
    def create_maintenance_run_hardware_event_callback(self) -> HardwareEventHandler:
        """Create a callback for estop and other events during a Maintenance Run.

        The returned callback is meant to run in the hardware API's thread.
        """
        orchestrator_store = self._maintenance_run_orchestrator_store
        if orchestrator_store is not None:

            def run_handler_in_engine_thread_from_hardware_thread(
                event: HardwareEvent,
            ) -> None:
                asyncio.run_coroutine_threadsafe(
                    orchestrator_store.handle_proxy_estop_event(event),
                    self._loop,
                )

            return run_handler_in_engine_thread_from_hardware_thread

        else:
            raise RuntimeError(
                "Cannot provide a estop listener from the RobotServerPyroResource without a MaintenanceRunOrchestratorStore."
            )

    @pyro_behavior(specialty_func=convert_result_to_proxy, apply_local=False)
    def get_maintenance_run_door_watcher_callback(self) -> HardwareEventHandler:
        """Get a door watcher callback from a non-subprocess Maintenance Run."""
        orchestrator_store = self._maintenance_run_orchestrator_store
        if orchestrator_store is not None:
            return (
                orchestrator_store.maintenance_run_door_watcher_callback_route_for_proxy
            )
        else:
            raise RuntimeError(
                "Cannot provide a maintenance run door watcher from the RobotServerPyroResource without a MaintenanceRunOrchestratorStore."
            )

    @pyro_behavior(specialty_func=convert_result_to_proxy, apply_local=False)
    def get_default_run_orchestrator_door_watcher_callback(
        self,
    ) -> HardwareEventHandler:
        """Get a door watcher callback from a non-subprocess Default Run Orchestrator."""
        orchestrator_store = self._run_orchestrator_store
        if orchestrator_store is not None:
            return orchestrator_store.default_run_orchestrator_door_watcher_callback_route_for_proxy
        else:
            raise RuntimeError(
                "Cannot provide a default run orchestrator door watcher from the RobotServerPyroResource without a RunOrchestratorStore."
            )

    async def get_deck_configuration(self) -> DeckConfigurationType:
        """Provide the current recognized DeckConfiguration of the robot server."""

        if self._deck_configuration_store is not None:
            return await self._deck_configuration_store.get_deck_configuration()
        else:
            raise RuntimeError(
                "Cannot return a DeckConfigurationType from the RobotServerPyroResource without initializing."
            )

    @pyro_behavior(specialty_func=convert_result_to_proxy, apply_local=False)
    def get_camera_provider(self) -> CameraProvider:
        """Provide a Pyro Proxy for the CameraProvider.

        The returned instance is meant to execute in the Robot Server's process.
        """

        if self._camera_provider is not None:
            return self._camera_provider
        else:
            raise RuntimeError(
                "Cannot return a CameraProvider from the RobotServerPyroResource without initializing."
            )

    @pyro_behavior(specialty_func=convert_result_to_proxy, apply_local=False)
    def get_file_provider(self) -> FileProvider:
        """Provide a Pyro Proxy for the FileProvider.

        The returned instance is meant to execute in the Robot Server's process.
        """

        if self._file_provider is not None:
            return self._file_provider
        else:
            raise RuntimeError(
                "Cannot return a FileProvider from the RobotServerPyroResource without initializing."
            )

    @pyro_behavior(specialty_func=convert_result_to_proxy, apply_local=False)
    def get_notify_publishers(self) -> Callable[[], None] | None:
        """Provide a Pyro Proxy for the Notification Publishers callback.

        The returned instance is meant to execute in the Robot Server's process. Of note
        Notification publishers are only registered with the Pyro Resource for runs created by
        the Robot Server.
        """

        if self._notify_publishers:

            def call_soon_notify_publishers() -> None:
                # Call soon on the thread notification publisher locally executes
                assert self._notify_publishers is not None
                self._loop.call_soon_threadsafe(self._notify_publishers)

            return call_soon_notify_publishers
        else:
            return None

    @pyro_behavior(specialty_func=convert_result_to_proxy, apply_local=False)
    def create_hardware_state_update_callback(self) -> HardwareEventHandler:
        """Create a callback for hardware events to report to the HardwareStateStore.

        The returned callback is meant to run in the hardware API's thread.
        """
        hardware_store = self._hardware_state_store
        if hardware_store is not None:

            def run_hardware_event_update_from_hardware_thread(
                event: HardwareEvent,
            ) -> None:
                async def _async_call(event: HardwareEvent) -> None:
                    hardware_store.update_hardware_status_callback(event)

                asyncio.run_coroutine_threadsafe(
                    _async_call(event),
                    self._loop,
                )

            return run_hardware_event_update_from_hardware_thread
        else:
            raise RuntimeError(
                "Cannot provide a hardware updates callback from the RobotServerPyroResource without a HardwareStateStore."
            )

    def get_engine_updates_callback(
        self, events: list[EngineEventNotification]
    ) -> None:
        """Update the RunOrchestratorStore local store of Engine state status."""
        orchestrator_store = self._run_orchestrator_store
        if orchestrator_store is not None:
            orchestrator_store.update_engine_status_callback(events)

        else:
            raise RuntimeError(
                "Cannot provide a protocol engine listener from the RobotServerPyroResource without a RunOrchestratorStore."
            )


### Utility methods for initializing and registering state within the RobotServerPyroResource


def start_initializing_pyro_resource(app_state: AppState) -> None:
    """Entry point for creating a hosted Robot Server Pyro Resource and serving requests on it via a Pyro5 Daemon."""

    def _start_and_run_pyro_daemon(pyroname: str, registry: Any) -> None:
        robot_server_pyro_resource = robot_server_pyro_resource_accessor.get_from(
            app_state
        )
        assert robot_server_pyro_resource is not None
        create_pyro_daemon(
            pyroname=pyroname, resource=robot_server_pyro_resource, registry=registry
        )

    # Create the new instance of the Robot server resource manager using the Robot Server's existing event loop
    resource = RobotServerPyroResource(loop=asyncio.get_event_loop())
    robot_server_pyro_resource_accessor.set_on(app_state, resource)

    # Only spin up a request handling daemon if subprocess mode is enabled
    if ff.hardware_subprocess_enabled():
        pyro_daemon_thread = threading.Thread(
            target=_start_and_run_pyro_daemon,
            name="RobotServerResourceThread",
            args=(),
            kwargs={
                "pyroname": RS_PYRONAME,
                "registry": register_robot_server_types,
            },
            daemon=True,
        )
        pyro_daemon_thread.start()
