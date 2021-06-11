"""Session router dependency-injection wire-up."""
from fastapi import Depends
from starlette.datastructures import State
from typing import cast

from opentrons.hardware_control import ThreadManager, API as HardwareAPI

from robot_server.service.dependencies import get_app_state, get_hardware

from .engine_store import EngineStore
from .session_store import SessionStore


_SESSION_STORE_KEY = "session_store"
_ENGINE_STORE_KEY = "engine_store"


def get_session_store(state: State = Depends(get_app_state)) -> SessionStore:
    """Get a singleton SessionStore to keep track of created sessions."""
    session_store = getattr(state, _SESSION_STORE_KEY, None)

    if session_store is None:
        session_store = SessionStore()
        setattr(state, _SESSION_STORE_KEY, session_store)

    return session_store


def get_engine_store(
    state: State = Depends(get_app_state),
    hardware: ThreadManager = Depends(get_hardware),
) -> EngineStore:
    """Get a singleton EngineStore to keep track of created engines / runners."""
    engine_store = getattr(state, _ENGINE_STORE_KEY, None)

    if engine_store is None:
        engine_store = EngineStore(hardware_api=cast(HardwareAPI, hardware))
        setattr(state, _ENGINE_STORE_KEY, engine_store)

    return engine_store
