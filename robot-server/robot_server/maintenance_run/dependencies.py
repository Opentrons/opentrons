"""Run router dependency-injection wire-up."""
from fastapi import Depends
from sqlalchemy.engine import Engine as SQLEngine

from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.hardware_control import HardwareControlAPI

from robot_server.app_state import AppState, AppStateAccessor, get_app_state
from robot_server.hardware import get_hardware, get_robot_type

from .engine_store import EngineStore
from .maintenance_run_data_manager import MaintenanceRunDataManager

_engine_store_accessor = AppStateAccessor[EngineStore]("engine_store")


async def get_engine_store(
    app_state: AppState = Depends(get_app_state),
    hardware_api: HardwareControlAPI = Depends(get_hardware),
    robot_type: RobotType = Depends(get_robot_type),
) -> EngineStore:
    """Get a singleton EngineStore to keep track of created engines / runners."""
    engine_store = _engine_store_accessor.get_from(app_state)

    if engine_store is None:
        engine_store = EngineStore(hardware_api=hardware_api, robot_type=robot_type)
        _engine_store_accessor.set_on(app_state, engine_store)

    return engine_store


async def get_maintenance_run_data_manager(
    engine_store: EngineStore = Depends(get_engine_store),
) -> MaintenanceRunDataManager:
    """Get a maintenance run data manager to keep track of current run data."""
    return MaintenanceRunDataManager(
        engine_store=engine_store,
    )
