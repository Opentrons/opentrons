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
        current = self.get()  # SettingsResponseData with all fields populated
        non_null_updates = patch.model_dump(exclude_none=True)
        merged = current.model_copy(update=non_null_updates)

        # add logic for password complexity
        new_settings = self._settings_store.add(
            access_control_enabled=merged.accessControlEnabled,
            max_number_of_login_attempts=merged.max_number_of_login_attempts,
            password_reset_time_in_days=merged.password_reset_time_in_days,
            idle_lockout_in_minutes=merged.idle_lockout_in_minutes,
            require_admin_creds_when_updating_robot_software=merged.require_admin_creds_when_updating_robot_software,
            require_admin_creds_when_sending_protocol_to_robot=merged.require_admin_creds_when_sending_protocol_to_robot,
            require_admin_creds_for_signoff_protocol=merged.require_admin_creds_for_signoff_protocol,
            require_signoff_for_protocol_log=merged.require_signoff_for_protocol_log,
            require_reason_for_interaction=merged.require_reason_for_interaction,
            min_length_of_reason_for_interaction=merged.min_length_of_reason_for_interaction,
            require_logs_to_be_saved_in_app=merged.require_logs_to_be_saved_in_app,
            delete_over_max_on_disk_protocols=merged.delete_over_max_on_disk_protocols,
        )
        return new_settings

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
