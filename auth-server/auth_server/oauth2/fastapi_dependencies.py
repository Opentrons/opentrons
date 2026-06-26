from typing import Annotated

from fastapi import Depends
from sqlalchemy.engine import Engine as SQLEngine

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .backend import Backend
from auth_server.settings.store import SettingsStore
from auth_server.users.store import UserStore

_app_state_accessor = AppStateAccessor[Backend]("oauth2_backend")


def install_oauth2_backend(app_state: AppState, backend: Backend) -> None:
    """Store the server's singleton OAuth 2 backend in server state for later retrieval.

    This should be called once at server startup.
    """
    _app_state_accessor.set_on(app_state, backend)


def install_oath2_sql_engine(app_state: AppState, sql_engine: SQLEngine) -> None:
    """Initialize the server's singleton OAuth 2 backend and store it for later retrieval.

    This should be called once at server startup.
    """
    user_store = UserStore(sql_engine=sql_engine)
    settings_store = SettingsStore(sql_engine=sql_engine)
    backend = Backend(user_store, settings_store)
    _app_state_accessor.set_on(app_state, backend)


def get_oauth2_backend(
    app_state: Annotated[AppState, Depends(get_app_state)],
) -> Backend:
    """Return the server's singleton OAuth 2 backend."""
    backend = _app_state_accessor.get_from(app_state)
    assert backend is not None, (
        "Forgot to initialize OAuth 2 backend at server startup?"
    )
    return backend
