"""Run router dependency-injection wire-up."""
from fastapi import Depends

from opentrons.hardware_control import API as HardwareAPI

from robot_server.app_state import AppState, AppStateValue, get_app_state
from robot_server.hardware import get_hardware

from .engine_store import EngineStore
from .run_store import RunStore


_run_store = AppStateValue[RunStore]("run_store")
_engine_store = AppStateValue[EngineStore]("engine_store")


def get_run_store(app_state: AppState = Depends(get_app_state)) -> RunStore:
    """Get a singleton RunStore to keep track of created runs."""
    run_store = _run_store.get_from(app_state)

    if run_store is None:
        run_store = RunStore()
        _run_store.set_on(app_state, run_store)

    return run_store


def get_engine_store(
    app_state: AppState = Depends(get_app_state),
    hardware_api: HardwareAPI = Depends(get_hardware),
) -> EngineStore:
    """Get a singleton EngineStore to keep track of created engines / runners."""
    engine_store = _engine_store.get_from(app_state)

    if engine_store is None:
        engine_store = EngineStore(hardware_api=hardware_api)
        _engine_store.set_on(app_state, engine_store)

    return engine_store
