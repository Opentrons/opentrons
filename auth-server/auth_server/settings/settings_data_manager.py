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


def _response_to_store_kwargs(settings: SettingsResponseData) -> dict:
    """Map a full SettingsResponseData to store kwargs for insert."""
    return {
        "access_control_enabled": settings.accessControlEnabled,
        "max_number_of_login_attempts": settings.maxNumberOfLoginAttempts,
        "password_reset_time_in_days": settings.passwordResetTimeInDays,
        "idle_lockout_in_minutes": settings.idleLockoutInMinutes,
        "require_admin_creds_when_updating_robot_software": settings.requireAdminCredsWhenUpdatingRobotSoftware,
        "require_admin_creds_when_sending_protocol_to_robot": settings.requireAdminCredsWhenSendingProtocolToRobot,
        "require_admin_creds_for_signoff_protocol": settings.requireAdminCredsForSignoffProtocol,
        "require_signoff_for_protocol_log": settings.requireSignoffForProtocolLog,
        "require_reason_for_interaction": settings.requireReasonForInteraction,
        "min_length_of_reason_for_interaction": settings.minLengthOfReasonForInteraction,
        "require_logs_to_be_saved_in_app": settings.requireLogsToBeSavedInApp,
        "delete_over_max_on_disk_protocols": settings.deleteOverMaxOnDiskProtocols,
        "password_complexity_minimum_length": settings.passwordComplexity.minimumLength
        if settings.passwordComplexity is not None
        else None,
        "password_complexity_special_characters": settings.passwordComplexity.specialCharacters
        if settings.passwordComplexity is not None
        else None,
    }


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
        existing = self._settings_store.get()
        print("existing: ", existing)
        if existing is None:
            self._settings_store.insert(
                **_response_to_store_kwargs(
                    SettingsResponseData.model_construct(accessControlEnabled=False)
                )
            )

        non_null_updates = patch.model_dump(exclude_none=True)
        store_kwargs = _response_to_store_kwargs(non_null_updates)
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
