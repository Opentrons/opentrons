"""Maintenance Run router dependency-injection wire-up."""
from typing import Annotated

from fastapi import Depends

from opentrons_shared_data.robot.types import RobotType

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine import DeckType

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from robot_server.hardware import get_hardware, get_deck_type, get_robot_type

from .maintenance_run_orchestrator_store import MaintenanceRunOrchestratorStore
from .maintenance_run_data_manager import MaintenanceRunDataManager
from robot_server.service.notifications import (
    MaintenanceRunsPublisher,
    get_maintenance_runs_publisher,
)

_run_orchestrator_store_accessor = AppStateAccessor[MaintenanceRunOrchestratorStore](
    "maintenance_run_orchestrator_store"
)


async def get_maintenance_run_orchestrator_store(
    app_state: Annotated[AppState, Depends(get_app_state)],
    hardware_api: Annotated[HardwareControlAPI, Depends(get_hardware)],
    deck_type: Annotated[DeckType, Depends(get_deck_type)],
    robot_type: Annotated[RobotType, Depends(get_robot_type)],
) -> MaintenanceRunOrchestratorStore:
    """Get a singleton MaintenanceRunOrchestratorStore to keep track of created engines / runners."""
    run_orchestrator_store = _run_orchestrator_store_accessor.get_from(app_state)

    if run_orchestrator_store is None:
        run_orchestrator_store = MaintenanceRunOrchestratorStore(
            hardware_api=hardware_api, robot_type=robot_type, deck_type=deck_type
        )
        _run_orchestrator_store_accessor.set_on(app_state, run_orchestrator_store)

    return run_orchestrator_store


async def get_maintenance_run_data_manager(
    run_orchestrator_store: Annotated[
        MaintenanceRunOrchestratorStore, Depends(get_maintenance_run_orchestrator_store)
    ],
    maintenance_runs_publisher: Annotated[
        MaintenanceRunsPublisher, Depends(get_maintenance_runs_publisher)
    ],
) -> MaintenanceRunDataManager:
    """Get a maintenance run data manager to keep track of current run data."""
    return MaintenanceRunDataManager(
        run_orchestrator_store=run_orchestrator_store,
        maintenance_runs_publisher=maintenance_runs_publisher,
    )
