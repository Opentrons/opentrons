"""Session router dependency-injection wire-up."""
from fastapi import Depends
from starlette.datastructures import State

from opentrons.hardware_control import API as HardwareAPI

from robot_server.app_state import AppState, AppStateValue, get_app_state
from robot_server.hardware import get_hardware

from .engine_store import EngineStore
from .session_store import SessionStore


_session_store = AppStateValue[SessionStore]("session_store")
_engine_store = AppStateValue[EngineStore]("engine_store")


def get_session_store(app_state: AppState = Depends(get_app_state)) -> SessionStore:
    """Get a singleton SessionStore to keep track of created sessions."""
    session_store = _session_store.get_from(app_state)

    if session_store is None:
        session_store = SessionStore()
        _session_store.set_on(app_state, session_store)

    return session_store


def get_engine_store(
    app_state: State = Depends(get_app_state),
    hardware_api: HardwareAPI = Depends(get_hardware),
) -> EngineStore:
    """Get a singleton EngineStore to keep track of created engines / runners."""
    engine_store = _engine_store.get_from(app_state)

    if engine_store is None:
        engine_store = EngineStore(hardware_api=hardware_api)
        _engine_store.set_on(app_state, engine_store)

    return engine_store
