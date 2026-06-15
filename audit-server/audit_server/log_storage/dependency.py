from typing import Annotated

from fastapi import Depends
from sqlalchemy.engine import Engine as SQLEngine

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .store import LogStore
from audit_server.persistence.fastapi_dependencies import get_sql_engine

_log_store_accessor = AppStateAccessor[LogStore]("log_store")


def build_log_store(app_state: AppState, sql_engine: SQLEngine) -> LogStore:
    """Build log store."""
    store = LogStore(sql_engine)
    _log_store_accessor.set_on(app_state, store)
    return store


async def get_log_store(
    app_state: Annotated[AppState, Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, Depends(get_sql_engine)],
) -> LogStore:
    """Get the singleton LogStore. Prefer using log data manager."""
    log_store = _log_store_accessor.get_from(app_state)
    if log_store is None:
        return build_log_store(app_state, sql_engine)
    return log_store
