"""Support utilities for accessing the RobotServerPyroResource."""

import time
from typing import cast

import Pyro5.api as pyro
import Pyro5.errors as pyro_errors

from opentrons.protocol_engine.resources.camera_provider import (
    CameraProvider,
)
from opentrons.protocol_engine.resources.file_provider import FileProvider
from opentrons.util.pyro.pyro_client_async_adapter import AsyncClientPyroObject
from server_utils.fastapi_utils.app_state import (
    AppState,
)

from robot_server.maintenance_runs.maintenance_run_orchestrator_store import (
    MaintenanceRunOrchestratorStore,
)
from robot_server.runs.run_orchestrator_store import RunOrchestratorStore
from robot_server.service.pyro_utils.pyro_resource import (
    RS_PYRONAME,
    RobotServerPyroResource,
    robot_server_pyro_resource_accessor,
)


# Pyro Resource Retreival for local processes (recieve proxies, etc)
# todo(chb, 04-09-2026): for now this is using the same methodology as the DirectedRunProcess work, consolidate
def get_pyro_resource() -> RobotServerPyroResource:
    """Get a Proxy of the hosted Robot Server Pyro Resource."""

    robot_server_proxy = None
    start_time = time.monotonic()
    with pyro.locate_ns() as ns:
        while time.monotonic() - start_time < 60:
            if RS_PYRONAME in ns.list():
                robot_server_proxy = pyro.Proxy(ns.list()[RS_PYRONAME])  # type: ignore[no-untyped-call]
                break

    if robot_server_proxy is None:
        raise pyro_errors.CommunicationError(
            "Opentrons-robot-server could not find robot-server-resource URI on Pyro5 Nameserver."
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
    robot_server_pyro_resource = robot_server_pyro_resource_accessor.get_from(app_state)
    if robot_server_pyro_resource is not None:
        robot_server_pyro_resource._set_run_orchestorator_store(run_orchestrator_store)
    else:
        raise RuntimeError(
            "Cannot set RunOrchestratorStore, RobotServerPyroResource is not initialized."
        )


def register_maintenance_run_orchestrator_store_to_pyro_resource(
    app_state: AppState,
    maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
) -> None:
    """Set a provided MaintenanceRunOrchestratorStore as the active store to be used by the Robot Server's Pyro Resource."""
    robot_server_pyro_resource = robot_server_pyro_resource_accessor.get_from(app_state)
    if robot_server_pyro_resource is not None:
        robot_server_pyro_resource._set_maintenance_run_orchestorator_store(
            maintenance_run_orchestrator_store
        )
    else:
        raise RuntimeError(
            "Cannot set MaintenanceRunOrchestratorStore, RobotServerPyroResource is not initialized."
        )


def register_camera_provider_to_pyro_resource(
    app_state: AppState,
    camera_provider: CameraProvider,
) -> None:
    """Set a provided CameraProvider as the active instance to be used by the Robot Server's Pyro Resource."""
    robot_server_pyro_resource = robot_server_pyro_resource_accessor.get_from(app_state)
    if robot_server_pyro_resource is not None:
        if robot_server_pyro_resource._camera_provider is None:
            robot_server_pyro_resource._set_camera_provider(camera_provider)
    else:
        raise RuntimeError(
            "Cannot set CameraProvider, RobotServerPyroResource is not initialized."
        )


def register_file_provider_to_pyro_resource(
    app_state: AppState,
    file_provider: FileProvider,
) -> None:
    """Set a provided FileProvider as the active instance to be used by the Robot Server's Pyro Resource."""
    robot_server_pyro_resource = robot_server_pyro_resource_accessor.get_from(app_state)
    if robot_server_pyro_resource is not None:
        if robot_server_pyro_resource._file_provider is None:
            robot_server_pyro_resource._set_file_provider(file_provider)
    else:
        raise RuntimeError(
            "Cannot set FileProvider, RobotServerPyroResource is not initialized."
        )
