"""Support utilities for accessing the RobotServerPyroResource."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING, Callable, cast

from opentrons.protocol_engine.resources.camera_provider import (
    CameraProvider,
)
from opentrons.protocol_engine.resources.file_provider import FileProvider
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
)

if TYPE_CHECKING:
    from robot_server.deck_configuration.store import DeckConfigurationStore
    from robot_server.maintenance_runs.maintenance_run_orchestrator_store import (
        MaintenanceRunOrchestratorStore,
    )
    from robot_server.runs.run_orchestrator_store import RunOrchestratorStore
    from robot_server.service.pyro_utils.pyro_resource import RobotServerPyroResource


def _get_accessor() -> AppStateAccessor[RobotServerPyroResource]:
    """Lazy import of pyro_resource accessor to avoid Pyro5 import chain."""
    from robot_server.service.pyro_utils.pyro_resource import (
        robot_server_pyro_resource_accessor,
    )

    return robot_server_pyro_resource_accessor


def _get_resource_if_available(
    app_state: AppState,
) -> RobotServerPyroResource | None:
    """Get the pyro resource from app state, or None if not initialized."""
    accessor = _get_accessor()
    return accessor.get_from(app_state)


# Pyro Resource Retreival for local processes (recieve proxies, etc)
# todo(chb, 04-09-2026): for now this is using the same methodology as the DirectedRunProcess work, consolidate
def get_pyro_resource() -> RobotServerPyroResource:
    """Get a Proxy of the hosted Robot Server Pyro Resource."""
    import Pyro5.api as pyro
    import Pyro5.errors as pyro_errors

    from opentrons.util.pyro.pyro_client_async_adapter import AsyncClientPyroObject

    from robot_server.service.pyro_utils.pyro_resource import (
        RS_PYRONAME,
        RobotServerPyroResource,
    )

    robot_server_proxy = None
    start_time = time.monotonic()
    with pyro.locate_ns() as ns:
        while time.monotonic() - start_time < 60:
            if RS_PYRONAME in ns.list():
                robot_server_proxy = pyro.Proxy(ns.list()[RS_PYRONAME])  # type: ignore[no-untyped-call]
                break
            time.sleep(0.01)

    if robot_server_proxy is None:
        raise pyro_errors.CommunicationError(
            "Could not find robot-server-resource URI on Pyro5 Nameserver."
        )
    else:
        robot_server_resource = cast(
            RobotServerPyroResource, AsyncClientPyroObject(robot_server_proxy)
        )
        return robot_server_resource


# Setters for the state stored Robot Server resource


def register_run_orchestrator_store_to_pyro_resource(
    app_state: AppState,
    run_orchestrator_store: RunOrchestratorStore,
) -> None:
    """Set a provided RunOrchestratorStore as the active store to be used by the Robot Server's Pyro Resource."""
    robot_server_pyro_resource = _get_resource_if_available(app_state)
    if robot_server_pyro_resource is not None:
        robot_server_pyro_resource.set_run_orchestrator_store(run_orchestrator_store)


def register_maintenance_run_orchestrator_store_to_pyro_resource(
    app_state: AppState,
    maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
) -> None:
    """Set a provided MaintenanceRunOrchestratorStore as the active store to be used by the Robot Server's Pyro Resource."""
    robot_server_pyro_resource = _get_resource_if_available(app_state)
    if robot_server_pyro_resource is not None:
        robot_server_pyro_resource.set_maintenance_run_orchestorator_store(
            maintenance_run_orchestrator_store
        )


def register_deck_configuration_store_to_pyro_resource(
    app_state: AppState,
    deck_configuration_store: DeckConfigurationStore,
) -> None:
    """Set a provided DeckConfigurationStore as the active store to be used by the Robot Server's Pyro Resource."""
    robot_server_pyro_resource = _get_resource_if_available(app_state)
    if robot_server_pyro_resource is not None:
        robot_server_pyro_resource.set_deck_configuration_store(
            deck_configuration_store
        )


def register_camera_provider_to_pyro_resource(
    app_state: AppState,
    camera_provider: CameraProvider,
) -> None:
    """Set a provided CameraProvider as the active instance to be used by the Robot Server's Pyro Resource."""
    robot_server_pyro_resource = _get_resource_if_available(app_state)
    if robot_server_pyro_resource is not None:
        robot_server_pyro_resource.set_camera_provider(camera_provider)


def register_file_provider_to_pyro_resource(
    app_state: AppState,
    file_provider: FileProvider,
) -> None:
    """Set a provided FileProvider as the active instance to be used by the Robot Server's Pyro Resource."""
    robot_server_pyro_resource = _get_resource_if_available(app_state)
    if robot_server_pyro_resource is not None:
        robot_server_pyro_resource.set_file_provider(file_provider)


def register_notify_publishers_to_pyro_resource(
    app_state: AppState,
    notify_publishers: Callable[[], None],
) -> None:
    """Set the provided Notification Publishers as the callback to be used by the Robot Server's Pyro Resource."""
    robot_server_pyro_resource = _get_resource_if_available(app_state)
    if robot_server_pyro_resource is not None:
        robot_server_pyro_resource.set_notify_publishers(notify_publishers)
