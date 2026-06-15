"""Settings store – pure data access layer for settings persistence."""

from typing import Annotated

import fastapi
from sqlalchemy import delete, select
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session, sessionmaker

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
from server_utils.sql_utils import JsonPythonValue

from audit_server.persistence.fastapi_dependencies import get_sql_engine
from audit_server.persistence.orm_models import LoggingEnabled, Setting
from audit_server.settings.models import (
    LoggingEnabledResponseData,
    PatchLoggingEnabledRequestData,
    PatchSettingsRequestData,
    SettingsResponseData,
)


class SettingsStore:
    """Manages settings CRUD operations against the database."""

    def __init__(self, sql_engine: SQLEngine) -> None:
        """Initialize with a SQLAlchemy engine."""
        self._sql_engine = sql_engine
        self._session_factory = sessionmaker(
            bind=sql_engine,
            expire_on_commit=False,
        )

    def _session(self) -> Session:
        return self._session_factory()

    def get_settings(self) -> SettingsResponseData:
        """Get the current generic settings."""
        with self._session() as session:
            rows = session.scalars(select(Setting)).all()
            if not rows:
                return SettingsResponseData()
            parsed = {row.key: row.value for row in rows}
            return SettingsResponseData.model_validate(parsed, strict=False)

    def patch_settings(self, patch: PatchSettingsRequestData) -> SettingsResponseData:
        """Patch the generic settings, updating only the provided fields."""
        updates: dict[str, JsonPythonValue] = patch.model_dump(
            mode="json", exclude_unset=True
        )
        self._upsert_many(updates)
        return self.get_settings()

    def reset_settings(self) -> SettingsResponseData:
        """Reset all generic settings to their defaults."""
        self._delete_all()
        return self.get_settings()

    def _upsert_many(self, settings: dict[str, JsonPythonValue]) -> None:
        """Insert or update multiple generic settings at once."""
        with self._session() as session:
            for key, value in settings.items():
                row = session.scalars(select(Setting).where(Setting.key == key)).first()
                if row is None:
                    session.add(Setting(key=key, value=value))
                else:
                    row.value = value
            session.commit()

    def _delete_all(self) -> None:
        """Delete all generic settings (for reset)."""
        with self._session() as session:
            session.execute(delete(Setting))
            session.commit()

    def _get_logging_enabled(self) -> bool | None:
        """Return the raw logging-enabled value, or None if it has never been set."""
        with self._session() as session:
            row = session.execute(
                select(LoggingEnabled).filter(LoggingEnabled.id == 1)
            ).scalar_one_or_none()
            if row is None:
                return None
            return bool(row.enabled)

    def get_logging_enabled_settings(self) -> LoggingEnabledResponseData:
        """Get the current logging-enabled setting (defaults to False)."""
        enabled = self._get_logging_enabled()
        return LoggingEnabledResponseData(loggingEnabled=enabled or False)

    def update_logging_enabled_table(self, loggingEnabled: bool) -> None:
        """Set the logging-enabled setting."""
        with self._session() as session:
            row = session.execute(
                select(LoggingEnabled).filter(LoggingEnabled.id == 1)
            ).scalar_one_or_none()
            if row is None:
                session.add(LoggingEnabled(id=1, enabled=loggingEnabled))
            else:
                row.enabled = loggingEnabled
            session.commit()

    def patch_logging_enabled(
        self, patch: PatchLoggingEnabledRequestData
    ) -> LoggingEnabledResponseData:
        """Patch the logging-enabled setting.

        Unlike auth-server's access-control flag, this is freely toggleable in
        both directions. An omitted ``loggingEnabled`` leaves the setting as-is.
        """
        self.update_logging_enabled_table(patch.loggingEnabled)
        return self.get_logging_enabled_settings()


_accessor = AppStateAccessor[SettingsStore]("settings_store")


def install_settings_store(app_state: AppState, settings_store: SettingsStore) -> None:
    """Place the server's singleton SettingsStore in server state.

    This should be called once at server startup. Retrieve it later with
    ``get_settings_store()``.
    """
    _accessor.set_on(app_state, settings_store)


def get_settings_store(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, fastapi.Depends(get_sql_engine)],
) -> SettingsStore:
    """Return the server's singleton SettingsStore."""
    settings_store = _accessor.get_from(app_state)
    assert settings_store is not None, (
        "Forgot to initialize settings store as part of server startup?"
    )
    return settings_store
