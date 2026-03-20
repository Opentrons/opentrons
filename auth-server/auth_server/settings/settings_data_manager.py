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

# camelCase field name → snake_case store column name
_CAMEL_TO_SNAKE = {
    "accessControlEnabled": "access_control_enabled",
    "maxNumberOfLoginAttempts": "max_number_of_login_attempts",
    "passwordResetTimeInDays": "password_reset_time_in_days",
    "idleLockoutInMinutes": "idle_lockout_in_minutes",
    "requireAdminCredsWhenUpdatingRobotSoftware": "require_admin_creds_when_updating_robot_software",
    "requireAdminCredsWhenSendingProtocolToRobot": "require_admin_creds_when_sending_protocol_to_robot",
    "requireAdminCredsForSignoffProtocol": "require_admin_creds_for_signoff_protocol",
    "requireSignoffForProtocolLog": "require_signoff_for_protocol_log",
    "requireReasonForInteraction": "require_reason_for_interaction",
    "minLengthOfReasonForInteraction": "min_length_of_reason_for_interaction",
    "requireLogsToBeSavedInApp": "require_logs_to_be_saved_in_app",
    "deleteOverMaxOnDiskProtocols": "delete_over_max_on_disk_protocols",
}


def _patch_to_store_kwargs(non_null_updates: dict[str, object]) -> dict[str, object]:
    """Convert a partial camelCase DICT intostore kwargs."""
    result: dict[str, object] = {}
    for camel, snake in _CAMEL_TO_SNAKE.items():
        if camel in non_null_updates:
            result[snake] = non_null_updates[camel]

    complexity = non_null_updates.get("passwordComplexity")
    if complexity is not None and isinstance(complexity, dict):
        result["password_complexity_minimum_length"] = complexity["minimumLength"]
        result["password_complexity_special_characters"] = complexity[
            "specialCharacters"
        ]
    return result


class SettingsDataManager:
    """Manages the current authorization and authentication settings."""

    def __init__(self, settings_store: SettingsStore) -> None:
        self._settings_store = settings_store
        self._settings = _DEFAULT_SETTINGS

    def get(self) -> SettingsResponseData:
        """Get the current settings."""
        settings = self._settings_store.get()
        return (
            SettingsResponseData.from_orm_settings(settings)
            if settings is not None
            else _DEFAULT_SETTINGS
        )

    def patch(self, patch: PatchSettingsRequestData) -> SettingsResponseData:
        """Patch the current settings."""
        existing = self._settings_store.get()
        if existing is None:
            defaults = SettingsResponseData()
            self._settings_store.insert(
                access_control_enabled=defaults.accessControlEnabled,
                max_number_of_login_attempts=defaults.maxNumberOfLoginAttempts,
                password_reset_time_in_days=defaults.passwordResetTimeInDays,
                password_complexity_minimum_length=None,
                password_complexity_special_characters=None,
                idle_lockout_in_minutes=defaults.idleLockoutInMinutes,
                require_admin_creds_when_updating_robot_software=defaults.requireAdminCredsWhenUpdatingRobotSoftware,
                require_admin_creds_when_sending_protocol_to_robot=defaults.requireAdminCredsWhenSendingProtocolToRobot,
                require_admin_creds_for_signoff_protocol=defaults.requireAdminCredsForSignoffProtocol,
                require_signoff_for_protocol_log=defaults.requireSignoffForProtocolLog,
                require_reason_for_interaction=defaults.requireReasonForInteraction,
                min_length_of_reason_for_interaction=defaults.minLengthOfReasonForInteraction,
                require_logs_to_be_saved_in_app=defaults.requireLogsToBeSavedInApp,
                delete_over_max_on_disk_protocols=defaults.deleteOverMaxOnDiskProtocols,
            )

        # Step 2: Update only the fields the user sent
        non_null_updates = patch.model_dump(exclude_none=True)
        store_kwargs = _patch_to_store_kwargs(
            non_null_updates
        )  # partial dict → partial kwargs
        if store_kwargs:
            self._settings_store.update(**store_kwargs)

        return self.get()

    def reset(self) -> SettingsResponseData:
        """Reset all settings to their defaults."""
        self._settings_store.reset()
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
