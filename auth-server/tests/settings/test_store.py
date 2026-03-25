from datetime import timedelta
from pathlib import Path
from typing import Generator

import pytest

from auth_server.persistence.database import create_schema, sql_engine_ctx
from auth_server.settings.models import PatchSettingsRequestData, SettingsResponseData
from auth_server.settings.store import SettingsStore

_DEFAULTS: dict[str, object] = SettingsResponseData().model_dump(
    mode="json", exclude_none=True
)


def _upsert_defaults(store: SettingsStore) -> None:
    store._upsert_many(_DEFAULTS)


@pytest.fixture()
def settings_store(tmp_path: Path) -> Generator[SettingsStore, None, None]:
    """Provide a UserStore backed by a fresh SQLite DB with seed users."""
    db_path = tmp_path / "test_auth.db"
    with sql_engine_ctx(db_path) as engine:
        create_schema(engine)
        store = SettingsStore(sql_engine=engine)
        yield store


def test_reset_settings(settings_store: SettingsStore) -> None:
    """reset should delete the settings record and force settings to defaults."""
    _upsert_defaults(settings_store)
    settings_store.reset_settings()
    fetched = settings_store.get_settings()
    assert fetched == SettingsResponseData()


@pytest.mark.parametrize(
    "updates, expected_changes",
    [
        pytest.param(
            PatchSettingsRequestData(maxNumberOfLoginAttempts=10),
            SettingsResponseData(maxNumberOfLoginAttempts=10),
            id="single-field",
        ),
        pytest.param(
            PatchSettingsRequestData(
                accessControlEnabled=True,
                idleLogout=timedelta(minutes=30),
                passwordResetTime=timedelta(days=90),
            ),
            SettingsResponseData(
                accessControlEnabled=True,
                idleLogout=timedelta(minutes=30),
                passwordResetTime=timedelta(days=90),
            ),
            id="multiple-fields",
        ),
    ],
)
def test_update_changes_only_specified_fields(
    settings_store: SettingsStore,
    updates: PatchSettingsRequestData,
    expected_changes: SettingsResponseData,
) -> None:
    """update should change only the specified fields and leave the rest unchanged."""
    _upsert_defaults(settings_store)
    settings_store.patch_settings(updates)
    fetched = settings_store.get_settings()
    assert fetched == expected_changes


def test_patch_settings_transfers_data(settings_store: SettingsStore) -> None:
    """patch should transfer data to the settings store."""
    _upsert_defaults(settings_store)
    settings_store.patch_settings(
        PatchSettingsRequestData(
            accessControlEnabled=True,
            idleLogout=timedelta(minutes=30),
            passwordResetTime=timedelta(days=90),
        )
    )
    fetched = settings_store.get_settings()
    assert fetched.accessControlEnabled is True
    assert fetched.idleLogout == timedelta(minutes=30)
    assert fetched.passwordResetTime == timedelta(days=90)


def test_patch_settings_ignores_none_values(settings_store: SettingsStore) -> None:
    """patch should ignore unset fields."""
    _upsert_defaults(settings_store)
    settings_store.patch_settings(
        PatchSettingsRequestData(
            idleLogout=timedelta(minutes=30),
        )
    )
    fetched = settings_store.get_settings()
    assert fetched.accessControlEnabled is False
    assert fetched.idleLogout == timedelta(minutes=30)
