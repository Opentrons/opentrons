from typing import Annotated

from fastapi import Depends
from sqlalchemy.engine import Engine as SQLEngine

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from server_utils.keys.fastapi import get_key_client
from server_utils.keys.key_server import Client as KeyClient

from .log_data_manager import LogDataManager
from .store import LogStore
from audit_server.persistence.fastapi_dependencies import get_sql_engine
from audit_server.settings.store import SettingsStore, get_settings_store

_log_store_accessor = AppStateAccessor[LogStore]("log_store")
_log_data_manager_accessor = AppStateAccessor[LogDataManager]("log_data_manager")


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


def build_log_data_manager(
    app_state: AppState,
    log_store: LogStore,
    settings_store: SettingsStore,
    key_client: KeyClient,
) -> LogDataManager:
    """Build log data manager."""
    data_manager = LogDataManager(key_client, log_store, settings_store)
    _log_data_manager_accessor.set_on(app_state, data_manager)
    return data_manager


async def get_log_data_manager(
    app_state: Annotated[AppState, Depends(get_app_state)],
    log_store: Annotated[LogStore, Depends(get_log_store)],
    settings_store: Annotated[SettingsStore, Depends(get_settings_store)],
    key_client: Annotated[KeyClient, Depends(get_key_client)],
) -> LogDataManager:
    """Get the singleton LogDataManager."""
    log_data_manager = _log_data_manager_accessor.get_from(app_state)
    if log_data_manager is None:
        return build_log_data_manager(app_state, log_store, settings_store, key_client)
    return log_data_manager
