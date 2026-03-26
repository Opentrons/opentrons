from datetime import timedelta
from pathlib import Path
from typing import Generator

import pytest

from auth_server.persistence.database import create_schema, sql_engine_ctx
from auth_server.settings.models import (
    PatchAccessControlRequestData,
    PatchSettingsRequestData,
    SettingsResponseData,
)
from auth_server.settings.store import SettingsStore

_DEFAULTS: dict[str, object] = SettingsResponseData().model_dump(
    mode="json", exclude_none=True
)


def _upsert_defaults(store: SettingsStore) -> None:
    store.upsert_many(_DEFAULTS)


@pytest.fixture()
def settings_store(tmp_path: Path) -> Generator[SettingsStore, None, None]:
    """Provide a UserStore backed by a fresh SQLite DB with seed users."""
    db_path = tmp_path / "test_auth.db"
    with sql_engine_ctx(db_path) as engine:
        create_schema(engine)
        store = SettingsStore(sql_engine=engine)
        yield store


def test_upsert_and_get_settings(settings_store: SettingsStore) -> None:
    """insert should persist the settings so get can find it."""
    _upsert_defaults(settings_store)
    fetched = settings_store.get_settings()
    assert fetched is not None
    assert fetched == SettingsResponseData.model_construct()
    settings_store.upsert("maxNumberOfLoginAttempts", "10")
    fetched = settings_store.get_settings()
    assert fetched is not None
    assert fetched == SettingsResponseData.model_construct(maxNumberOfLoginAttempts=10)


def test_reset_settings(settings_store: SettingsStore) -> None:
    """reset should delete the settings record and force settings to defaults."""
    _upsert_defaults(settings_store)
    settings_store.delete_all()
    fetched = settings_store.get_settings()
    assert fetched == SettingsResponseData()


@pytest.mark.parametrize(
    "updates, expected_changes",
    [
        pytest.param(
            {"maxNumberOfLoginAttempts": 10},
            {"maxNumberOfLoginAttempts": 10},
            id="single-field",
        ),
        pytest.param(
            {
                "idleLogout": "PT30M",
                "passwordResetTime": "P90D",
            },
            {
                "idleLogout": timedelta(minutes=30),
                "passwordResetTime": timedelta(days=90),
            },
            id="multiple-fields",
        ),
    ],
)
def test_update_changes_only_specified_fields(
    settings_store: SettingsStore,
    updates: dict[str, object],
    expected_changes: dict[str, object],
) -> None:
    """update should change only the specified fields and leave the rest unchanged."""
    _upsert_defaults(settings_store)
    settings_store.upsert_many(updates)

    fetched = settings_store.get_settings()
    for key, value in expected_changes.items():
        assert getattr(fetched, key) == value


def test_upsert_without_row_raises(settings_store: SettingsStore) -> None:
    """upsert should create a new row if no settings row exists."""
    settings_store.upsert("maxNumberOfLoginAttempts", "10")
    fetched = settings_store.get_settings()
    assert fetched is not None
    assert fetched == SettingsResponseData(maxNumberOfLoginAttempts=10)


def test_patch_settings_transfers_data(settings_store: SettingsStore) -> None:
    """patch should transfer data to the settings store."""
    _upsert_defaults(settings_store)
    settings_store.patch_settings(
        PatchSettingsRequestData(
            idleLogout=timedelta(minutes=30),
            passwordResetTime=timedelta(days=90),
        )
    )
    fetched = settings_store.get_settings()
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
    assert fetched.idleLogout == timedelta(minutes=30)
    assert fetched.passwordResetTime is None


def test_get_access_control_settings(settings_store: SettingsStore) -> None:
    """get_access_control_settings should return the current access control settings."""
    fetched = settings_store.get_access_control_settings()
    assert fetched.accessControlEnabled is False
    settings_store.patch_access_control(
        PatchAccessControlRequestData(accessControlEnabled=True)
    )
    fetched = settings_store.get_access_control_settings()
    assert fetched.accessControlEnabled is True
