"""Session router dependency wire-up."""
from fastapi import Depends, Request

from .engine_store import EngineStore
from .session_store import SessionStore

ENGINE_STORE_STATE_KEY = "sessions.engine_store"
SESSION_STORE_STATE_KEY = "sessions.session_store"


def get_engine_store(request: Request) -> EngineStore:
    """Get the EngineStore dependency."""
    app_state = request.app.state
    engine_store = getattr(app_state, ENGINE_STORE_STATE_KEY, None)

    if engine_store is None:
        engine_store = EngineStore()
        setattr(app_state, ENGINE_STORE_STATE_KEY, engine_store)

    return engine_store


def get_session_store(
    request: Request,
    engine_store: EngineStore = Depends(get_engine_store),
) -> SessionStore:
    """Get a SessionStore interface."""
    app_state = request.app.state
    session_store = getattr(app_state, SESSION_STORE_STATE_KEY, None)

    if session_store is None:
        session_store = SessionStore(engine_store=engine_store)
        setattr(app_state, SESSION_STORE_STATE_KEY, session_store)

    return session_store


def get_unique_id() -> str:
    """Generate a unique identifier string."""
    raise NotImplementedError()
