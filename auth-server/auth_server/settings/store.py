"""User store – pure data access layer for user persistence."""

import json
from typing import Annotated

import fastapi
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session, sessionmaker

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from auth_server.persistence.fastapi_dependencies import get_sql_engine
from auth_server.persistence.orm_models import Settings
from auth_server.settings.models import PatchSettingsRequestData, SettingsResponseData


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
        """Get the current settings."""
        raw_settings = self.get_all()
        if not raw_settings:
            return SettingsResponseData()
        parsed = {
            k: json.loads(v) if v is not None else None for k, v in raw_settings.items()
        }
        return SettingsResponseData.model_validate(parsed)

    def patch_settings(self, patch: PatchSettingsRequestData) -> SettingsResponseData:
        """Patch the settings."""
        updates = patch.model_dump(exclude_unset=True)
        db_updates: dict[str, str | None] = {
            k: json.dumps(v) for k, v in updates.items()
        }
        self.upsert_many(db_updates)
        return self.get_settings()

    def reset_settings(self) -> SettingsResponseData:
        """Reset all settings to their defaults."""
        self.delete_all()
        return self.get_settings()

    def get_all(self) -> dict[str, str | None]:
        """Return all settings as a dict."""
        with self._session() as session:
            rows = session.query(Settings).all()
            return {row.key: row.value for row in rows}

    def upsert(self, key: str, value: str | None) -> None:
        """Insert or update a single setting."""
        with self._session() as session:
            row = session.query(Settings).filter(Settings.key == key).first()
            if row is None:
                session.add(Settings(key=key, value=value))
            else:
                row.value = value
            session.commit()

    def upsert_many(self, settings: dict[str, str | None]) -> None:
        """Insert or update multiple settings at once."""
        with self._session() as session:
            for key, value in settings.items():
                row = session.query(Settings).filter(Settings.key == key).first()
                if row is None:
                    session.add(Settings(key=key, value=value))
                else:
                    row.value = value
            session.commit()

    def delete_all(self) -> None:
        """Delete all settings (for reset)."""
        with self._session() as session:
            session.query(Settings).delete()
            session.commit()


_accessor = AppStateAccessor[SettingsStore]("settings_store")


def install_settings_store(app_state: AppState, settings_store: SettingsStore) -> None:
    """Place the server's singleton SettingsStore in server state, for later retrieval by get_settings_store()."""
    _accessor.set_on(app_state, settings_store)


def get_settings_store(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, fastapi.Depends(get_sql_engine)],
) -> SettingsStore:
    """Return the server's singleton SettingsStore."""
    settings_data_manager = _accessor.get_from(app_state)
    if settings_data_manager is None:
        settings_store = SettingsStore(sql_engine=sql_engine)
        _accessor.set_on(app_state, settings_store)
    return settings_store
