import json
from typing import Annotated

import fastapi
from sqlalchemy.engine import Engine as SQLEngine

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .models import PatchSettingsRequestData, SettingsResponseData
from .store import SettingsStore
from auth_server.persistence.fastapi_dependencies import get_sql_engine


class SettingsDataManager:
    """Manages the current authorization and authentication settings."""

    def __init__(self, settings_store: SettingsStore) -> None:
        self._settings_store = settings_store

    def get(self) -> SettingsResponseData:
        """Get the current settings."""
        settings = self._settings_store.get_all()
        if not settings:
            return SettingsResponseData()
        parsed = {
            k: json.loads(v) if v is not None else None for k, v in settings.items()
        }
        return SettingsResponseData.model_validate(parsed)

    def patch(self, patch: PatchSettingsRequestData) -> SettingsResponseData:
        """Patch the current settings."""
        non_null_updates = patch.model_dump(exclude_none=True)
        db_updates: dict[str, str | None] = {
            k: json.dumps(v) for k, v in non_null_updates.items()
        }
        self._settings_store.upsert_many(db_updates)
        return self.get()

    def reset(self) -> SettingsResponseData:
        """Reset all settings to their defaults."""
        self._settings_store.delete_all()
        return self.get()


_accessor = AppStateAccessor[SettingsDataManager]("settings_data_manager")


def install_settings_data_manager(
    app_state: AppState, settings_data_manager: SettingsDataManager
) -> None:
    """Place the server's singleton SettingsStore in server state, for later retrieval by get_settings_store()."""
    _accessor.set_on(app_state, settings_data_manager)


def get_settings_data_manager(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, fastapi.Depends(get_sql_engine)],
) -> SettingsDataManager:
    """Return the server's singleton SettingsStore."""
    settings_data_manager = _accessor.get_from(app_state)
    if settings_data_manager is None:
        settings_store = SettingsStore(sql_engine=sql_engine)
        settings_data_manager = SettingsDataManager(settings_store=settings_store)
        _accessor.set_on(app_state, settings_data_manager)
    return settings_data_manager
