"""Run router dependency-injection wire-up."""
from fastapi import Depends
from sqlalchemy.engine import Engine as SQLEngine

from opentrons.hardware_control import HardwareControlAPI

from robot_server.app_state import AppState, AppStateValue, get_app_state
from robot_server.hardware import get_hardware
from robot_server.persistence import get_sql_engine

from .engine_store import EngineStore
from .run_store import RunStore
from .run_state_store import RunStateStore


_run_store = AppStateValue[RunStore]("run_store")
_engine_store = AppStateValue[EngineStore]("engine_store")
_run_state_store = AppStateValue[RunStateStore]("engine_state_store")


def get_run_store(
    app_state: AppState = Depends(get_app_state),
    sql_engine: SQLEngine = Depends(get_sql_engine),
) -> RunStore:
    """Get a singleton RunStore to keep track of created runs."""
    run_store = _run_store.get_from(app_state)

    if run_store is None:
        run_store = RunStore(sql_engine=sql_engine)
        _run_store.set_on(app_state, run_store)

    return run_store


def get_engine_store(
    app_state: AppState = Depends(get_app_state),
    hardware_api: HardwareControlAPI = Depends(get_hardware),
) -> EngineStore:
    """Get a singleton EngineStore to keep track of created engines / runners."""
    engine_store = _engine_store.get_from(app_state)

    if engine_store is None:
        engine_store = EngineStore(hardware_api=hardware_api)
        _engine_store.set_on(app_state, engine_store)

    return engine_store


def get_run_state_store(
    app_state: AppState = Depends(get_app_state),
    sql_engine: SQLEngine = Depends(get_sql_engine),
) -> RunStateStore:
    """Get a singleton RunStateStore to keep track of run states."""
    run_state_store = _run_state_store.get_from(app_state)

    if run_state_store is None:
        run_state_store = RunStateStore(sql_engine=sql_engine)
        _run_state_store.set_on(app_state, run_state_store)

    return run_state_store
