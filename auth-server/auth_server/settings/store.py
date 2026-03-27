"""Settings store – pure data access layer for settings persistence."""

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
from auth_server.persistence.orm_models import AccessControlEnabled, Setting
from auth_server.settings.models import (
    AccessControlResponseData,
    PatchAccessControlRequestData,
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
        """Get the current settings."""
        with self._session() as session:
            rows = session.query(Setting).all()
            if not rows:
                return SettingsResponseData()
            parsed = {row.key: row.value for row in rows}
            return SettingsResponseData.model_validate(parsed, strict=False)

    def get_access_control_settings(self) -> AccessControlResponseData:
        """Get the current access control settings."""
        with self._session() as session:
            row = (
                session.query(AccessControlEnabled)
                .filter(AccessControlEnabled.id == 1)
                .first()
            )
            if row is None:
                return AccessControlResponseData(accessControlEnabled=False)
            return AccessControlResponseData(accessControlEnabled=row.enabled or False)

    def update_access_control_table(self, accessControlEnabled: bool) -> None:
        """Update the access control enabled setting."""
        with self._session() as session:
            row = session.query(AccessControlEnabled).first()
            if row is None:
                session.add(AccessControlEnabled(id=1, enabled=accessControlEnabled))
            else:
                row.enabled = accessControlEnabled
            session.commit()

    def patch_access_control(
        self, patch: PatchAccessControlRequestData
    ) -> AccessControlResponseData:
        """Patch the access control enabled setting."""
        if patch.accessControlEnabled is None:
            return self.get_access_control_settings()
        self.update_access_control_table(patch.accessControlEnabled)
        return self.get_access_control_settings()

    def patch_settings(self, patch: PatchSettingsRequestData) -> SettingsResponseData:
        """Patch the settings."""
        updates = patch.model_dump(mode="json", exclude_unset=True)
        db_updates: dict[str, object] = {k: v for k, v in updates.items()}
        self._upsert_many(db_updates)
        return self.get_settings()

    def reset_settings(self) -> SettingsResponseData:
        """Reset all settings to their defaults."""
        self._delete_all()
        return self.get_settings()

    def _upsert(self, key: str, value: str | None) -> None:
        """Insert or update a single setting."""
        with self._session() as session:
            row = session.query(Setting).filter(Setting.key == key).first()
            if row is None:
                session.add(Setting(key=key, value=value))
            else:
                row.value = value
            session.commit()

    def _upsert_many(self, settings: dict[str, object]) -> None:
        """Insert or update multiple settings at once."""
        with self._session() as session:
            for key, value in settings.items():
                row = session.query(Setting).filter(Setting.key == key).first()
                if row is None:
                    session.add(Setting(key=key, value=value))
                else:
                    row.value = value
            session.commit()

    def _delete_all(self) -> None:
        """Delete all settings (for reset)."""
        with self._session() as session:
            # todo(tz, 2026-03-24): this is a hack to prevent the accessControlEnabled setting from being deleted
            session.query(Setting).filter(
                Setting.key != "accessControlEnabled"
            ).delete()
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
    settings_store = _accessor.get_from(app_state)
    assert settings_store is not None
    return settings_store
