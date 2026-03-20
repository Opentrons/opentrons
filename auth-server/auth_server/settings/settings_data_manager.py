from typing import Annotated, Any

import fastapi
from sqlalchemy.engine import Engine as SQLEngine

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .models import PasswordComplexity, PatchSettingsRequestData, SettingsResponseData
from .store import SettingsStore
from auth_server.persistence.fastapi_dependencies import get_sql_engine

_DEFAULT_SETTINGS = SettingsResponseData.model_construct(accessControlEnabled=False)

# ── Serialization helpers ────────────────────────────────────────────


def _serialize(value: object) -> str | None:
    """Convert a Python value to a string for DB storage."""
    if value is None:
        return None
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def _to_bool(value: str | None, default: bool) -> bool:
    """Convert a stored string back to bool."""
    if value is None:
        return default
    return value == "true"


def _to_int(value: str | None, default: int) -> int:
    """Convert a stored string back to int."""
    if value is None:
        return default
    return int(value)


def _to_optional_int(value: str | None) -> int | None:
    """Convert a stored string back to optional int."""
    if value is None:
        return None
    return int(value)


# ── DB key constants ─────────────────────────────────────────────────
# These are the keys stored in the setting table.
# Using constants avoids typos and makes renaming easy.

_KEY_ACCESS_CONTROL_ENABLED = "access_control_enabled"
_KEY_MAX_LOGIN_ATTEMPTS = "max_number_of_login_attempts"
_KEY_PASSWORD_RESET_TIME_IN_DAYS = "password_reset_time_in_days"
_KEY_PASSWORD_COMPLEXITY_MIN_LENGTH = "password_complexity_minimum_length"
_KEY_PASSWORD_COMPLEXITY_SPECIAL_CHARS = "password_complexity_special_characters"
_KEY_IDLE_LOCKOUT_IN_MINUTES = "idle_lockout_in_minutes"
_KEY_REQUIRE_ADMIN_UPDATE_SOFTWARE = "require_admin_creds_when_updating_robot_software"
_KEY_REQUIRE_ADMIN_SEND_PROTOCOL = "require_admin_creds_when_sending_protocol_to_robot"
_KEY_REQUIRE_ADMIN_SIGNOFF_PROTOCOL = "require_admin_creds_for_signoff_protocol"
_KEY_REQUIRE_SIGNOFF_PROTOCOL_LOG = "require_signoff_for_protocol_log"
_KEY_REQUIRE_REASON_FOR_INTERACTION = "require_reason_for_interaction"
_KEY_MIN_LENGTH_REASON = "min_length_of_reason_for_interaction"
_KEY_REQUIRE_LOGS_SAVED_IN_APP = "require_logs_to_be_saved_in_app"
_KEY_DELETE_OVER_MAX_PROTOCOLS = "delete_over_max_on_disk_protocols"

# camelCase API field name → DB key
_CAMEL_TO_DB_KEY: dict[str, str] = {
    "accessControlEnabled": _KEY_ACCESS_CONTROL_ENABLED,
    "maxNumberOfLoginAttempts": _KEY_MAX_LOGIN_ATTEMPTS,
    "passwordResetTimeInDays": _KEY_PASSWORD_RESET_TIME_IN_DAYS,
    "idleLockoutInMinutes": _KEY_IDLE_LOCKOUT_IN_MINUTES,
    "requireAdminCredsWhenUpdatingRobotSoftware": _KEY_REQUIRE_ADMIN_UPDATE_SOFTWARE,
    "requireAdminCredsWhenSendingProtocolToRobot": _KEY_REQUIRE_ADMIN_SEND_PROTOCOL,
    "requireAdminCredsForSignoffProtocol": _KEY_REQUIRE_ADMIN_SIGNOFF_PROTOCOL,
    "requireSignoffForProtocolLog": _KEY_REQUIRE_SIGNOFF_PROTOCOL_LOG,
    "requireReasonForInteraction": _KEY_REQUIRE_REASON_FOR_INTERACTION,
    "minLengthOfReasonForInteraction": _KEY_MIN_LENGTH_REASON,
    "requireLogsToBeSavedInApp": _KEY_REQUIRE_LOGS_SAVED_IN_APP,
    "deleteOverMaxOnDiskProtocols": _KEY_DELETE_OVER_MAX_PROTOCOLS,
}


# ── Conversion: SettingsResponseData → DB dict ───────────────────────


def _response_to_db(settings: SettingsResponseData) -> dict[str, str | None]:
    """Convert a full SettingsResponseData to a DB key-value dict."""
    result: dict[str, str | None] = {
        _KEY_ACCESS_CONTROL_ENABLED: _serialize(settings.accessControlEnabled),
        _KEY_MAX_LOGIN_ATTEMPTS: _serialize(settings.maxNumberOfLoginAttempts),
        _KEY_PASSWORD_RESET_TIME_IN_DAYS: _serialize(settings.passwordResetTimeInDays),
        _KEY_IDLE_LOCKOUT_IN_MINUTES: _serialize(settings.idleLockoutInMinutes),
        _KEY_REQUIRE_ADMIN_UPDATE_SOFTWARE: _serialize(
            settings.requireAdminCredsWhenUpdatingRobotSoftware
        ),
        _KEY_REQUIRE_ADMIN_SEND_PROTOCOL: _serialize(
            settings.requireAdminCredsWhenSendingProtocolToRobot
        ),
        _KEY_REQUIRE_ADMIN_SIGNOFF_PROTOCOL: _serialize(
            settings.requireAdminCredsForSignoffProtocol
        ),
        _KEY_REQUIRE_SIGNOFF_PROTOCOL_LOG: _serialize(
            settings.requireSignoffForProtocolLog
        ),
        _KEY_REQUIRE_REASON_FOR_INTERACTION: _serialize(
            settings.requireReasonForInteraction
        ),
        _KEY_MIN_LENGTH_REASON: _serialize(settings.minLengthOfReasonForInteraction),
        _KEY_REQUIRE_LOGS_SAVED_IN_APP: _serialize(settings.requireLogsToBeSavedInApp),
        _KEY_DELETE_OVER_MAX_PROTOCOLS: _serialize(
            settings.deleteOverMaxOnDiskProtocols
        ),
        _KEY_PASSWORD_COMPLEXITY_MIN_LENGTH: _serialize(
            settings.passwordComplexity.minimumLength
            if settings.passwordComplexity
            else None
        ),
        _KEY_PASSWORD_COMPLEXITY_SPECIAL_CHARS: _serialize(
            settings.passwordComplexity.specialCharacters
            if settings.passwordComplexity
            else None
        ),
    }
    return result


# ── Conversion: DB dict → SettingsResponseData ───────────────────────


def _db_to_response(db: dict[str, str | None]) -> SettingsResponseData:
    """Convert a DB key-value dict to a SettingsResponseData."""
    complexity_min = _to_optional_int(db.get(_KEY_PASSWORD_COMPLEXITY_MIN_LENGTH))
    complexity_special = db.get(_KEY_PASSWORD_COMPLEXITY_SPECIAL_CHARS)

    return SettingsResponseData(
        accessControlEnabled=_to_bool(
            db.get(_KEY_ACCESS_CONTROL_ENABLED), _DEFAULT_SETTINGS.accessControlEnabled
        ),
        maxNumberOfLoginAttempts=_to_int(
            db.get(_KEY_MAX_LOGIN_ATTEMPTS), _DEFAULT_SETTINGS.maxNumberOfLoginAttempts
        ),
        passwordResetTimeInDays=_to_optional_int(
            db.get(_KEY_PASSWORD_RESET_TIME_IN_DAYS)
        ),
        idleLockoutInMinutes=_to_int(
            db.get(_KEY_IDLE_LOCKOUT_IN_MINUTES), _DEFAULT_SETTINGS.idleLockoutInMinutes
        ),
        requireAdminCredsWhenUpdatingRobotSoftware=_to_bool(
            db.get(_KEY_REQUIRE_ADMIN_UPDATE_SOFTWARE),
            _DEFAULT_SETTINGS.requireAdminCredsWhenUpdatingRobotSoftware,
        ),
        requireAdminCredsWhenSendingProtocolToRobot=_to_bool(
            db.get(_KEY_REQUIRE_ADMIN_SEND_PROTOCOL),
            _DEFAULT_SETTINGS.requireAdminCredsWhenSendingProtocolToRobot,
        ),
        requireAdminCredsForSignoffProtocol=_to_bool(
            db.get(_KEY_REQUIRE_ADMIN_SIGNOFF_PROTOCOL),
            _DEFAULT_SETTINGS.requireAdminCredsForSignoffProtocol,
        ),
        requireSignoffForProtocolLog=_to_bool(
            db.get(_KEY_REQUIRE_SIGNOFF_PROTOCOL_LOG),
            _DEFAULT_SETTINGS.requireSignoffForProtocolLog,
        ),
        requireReasonForInteraction=_to_bool(
            db.get(_KEY_REQUIRE_REASON_FOR_INTERACTION),
            _DEFAULT_SETTINGS.requireReasonForInteraction,
        ),
        minLengthOfReasonForInteraction=_to_optional_int(
            db.get(_KEY_MIN_LENGTH_REASON)
        ),
        requireLogsToBeSavedInApp=_to_bool(
            db.get(_KEY_REQUIRE_LOGS_SAVED_IN_APP),
            _DEFAULT_SETTINGS.requireLogsToBeSavedInApp,
        ),
        deleteOverMaxOnDiskProtocols=_to_bool(
            db.get(_KEY_DELETE_OVER_MAX_PROTOCOLS),
            _DEFAULT_SETTINGS.deleteOverMaxOnDiskProtocols,
        ),
        passwordComplexity=PasswordComplexity(
            minimumLength=complexity_min,
            specialCharacters=complexity_special == "true",
        )
        if complexity_min is not None
        else None,
    )


# ── Conversion: patch dict → DB dict ────────────────────────────────


def _patch_to_db(non_null_updates: dict[str, Any]) -> dict[str, str | None]:
    """Convert a partial camelCase patch dict to a DB key-value dict (for update)."""
    result: dict[str, str | None] = {}
    for camel, db_key in _CAMEL_TO_DB_KEY.items():
        if camel in non_null_updates:
            result[db_key] = _serialize(non_null_updates[camel])

    complexity = non_null_updates.get("passwordComplexity")
    if complexity is not None and isinstance(complexity, dict):
        result[_KEY_PASSWORD_COMPLEXITY_MIN_LENGTH] = _serialize(
            complexity["minimumLength"]
        )
        result[_KEY_PASSWORD_COMPLEXITY_SPECIAL_CHARS] = _serialize(
            complexity["specialCharacters"]
        )

    return result


class SettingsDataManager:
    """Manages the current authorization and authentication settings."""

    def __init__(self, settings_store: SettingsStore) -> None:
        self._settings_store = settings_store
        self.default_settings = _DEFAULT_SETTINGS

    def get(self) -> SettingsResponseData:
        """Get the current settings, falling back to defaults for missing keys."""
        settings = self._settings_store.get_all()
        if not settings:
            return self.default_settings
        return _db_to_response(settings)

    def patch(self, patch: PatchSettingsRequestData) -> SettingsResponseData:
        """Patch the current settings."""
        non_null_updates = patch.model_dump(exclude_none=True)
        db_updates = _patch_to_db(non_null_updates)
        if db_updates:
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
