from typing import Annotated

import fastapi

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from server_utils.persistence.sql_engine import SQLEngine

from .models import PatchSettingsRequestData, SettingsResponseData
from .store import SettingsStore
from auth_server.persistence.fastapi_dependencies import get_sql_engine

_DEFAULT_SETTINGS = SettingsResponseData.model_construct(accessControlEnabled=False)


class SettingsDataManager:
    """Manages the current authorization and authentication settings."""

    def __init__(self, settings_store: SettingsStore) -> None:
        self._settings_store = settings_store
        self._settings = _DEFAULT_SETTINGS

    def get(self) -> SettingsResponseData:
        """Get the current settings."""
        return self._settings_store.get() or _DEFAULT_SETTINGS

    def patch(self, patch: PatchSettingsRequestData) -> SettingsResponseData:
        """Update the settings."""
        self._settings_store.update(settings=patch)
        return self._settings_store.get()

    def reset(self) -> SettingsResponseData:
        """Reset all settings to their defaults."""
        self._settings_store.reset()
        return self._settings_store.get()


_accessor = AppStateAccessor[SettingsDataManager]("settings_data_manager")


def install_settings_data_manager(
    app_state: AppState, settings_data_manager: SettingsDataManager
) -> None:
    """Place the server's singleton SettingsStore in server state, for later retrieval by get_settings_store()."""
    _accessor.set_on(app_state, settings_data_manager)


async def get_settings_store(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, fastapi.Depends(get_sql_engine)],
) -> SettingsStore:
    """Return the server's singleton SettingsStore."""
    settings_store = _accessor.get_from(app_state)
    if settings_store is None:
        settings_store = SettingsStore(sql_engine=sql_engine)
        _accessor.set_on(app_state, settings_store)
    return settings_store


def get_settings_data_manager(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    settings_store: Annotated[SettingsStore, fastapi.Depends(get_settings_store)],
) -> SettingsDataManager:
    """Return the server's singleton SettingsStore."""
    settings_data_manager = _accessor.get_from(app_state)
    if settings_data_manager is None:
        settings_data_manager = SettingsDataManager(settings_store=settings_store)
        _accessor.set_on(app_state, settings_data_manager)
    return settings_data_manager
