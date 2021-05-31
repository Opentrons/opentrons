"""Session router dependency-injection wire-up."""
from fastapi import Depends, Request
from typing import cast

from opentrons.hardware_control import ThreadManager, API as HardwareAPI

from robot_server.service.dependencies import get_hardware

from .engine_store import EngineStore
from .session_store import SessionStore


SESSION_STORE_KEY = "session_store"
ENGINE_STORE_KEY = "engine_store"


def get_session_store(request: Request) -> SessionStore:
    """Get a singleton SessionStore to keep track of created sessions."""
    session_store = getattr(request.app.state, SESSION_STORE_KEY, None)

    if session_store is None:
        session_store = SessionStore()
        setattr(request.app.state, SESSION_STORE_KEY, session_store)

    return session_store


def get_engine_store(
    request: Request,
    hardware: ThreadManager = Depends(get_hardware),
) -> EngineStore:
    """Get a singleton EngineStore to keep track of created engines / runners."""
    engine_store = getattr(request.app.state, ENGINE_STORE_KEY, None)

    if engine_store is None:
        engine_store = EngineStore(hardware_api=cast(HardwareAPI, hardware))
        setattr(request.app.state, ENGINE_STORE_KEY, engine_store)

    return engine_store
