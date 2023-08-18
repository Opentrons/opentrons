"""Maintenance Run router dependency-injection wire-up."""
from fastapi import Depends

from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine import DeckType

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from robot_server.hardware import get_hardware, get_deck_type, get_robot_type

from .maintenance_engine_store import MaintenanceEngineStore
from .maintenance_run_data_manager import MaintenanceRunDataManager

_engine_store_accessor = AppStateAccessor[MaintenanceEngineStore](
    "maintenance_engine_store"
)


async def get_maintenance_engine_store(
    app_state: AppState = Depends(get_app_state),
    hardware_api: HardwareControlAPI = Depends(get_hardware),
    deck_type: DeckType = Depends(get_deck_type),
    robot_type: RobotType = Depends(get_robot_type),
) -> MaintenanceEngineStore:
    """Get a singleton MaintenanceEngineStore to keep track of created engines / runners."""
    engine_store = _engine_store_accessor.get_from(app_state)

    if engine_store is None:
        engine_store = MaintenanceEngineStore(
            hardware_api=hardware_api, robot_type=robot_type, deck_type=deck_type
        )
        _engine_store_accessor.set_on(app_state, engine_store)

    return engine_store


async def get_maintenance_run_data_manager(
    engine_store: MaintenanceEngineStore = Depends(get_maintenance_engine_store),
) -> MaintenanceRunDataManager:
    """Get a maintenance run data manager to keep track of current run data."""
    return MaintenanceRunDataManager(
        engine_store=engine_store,
    )
