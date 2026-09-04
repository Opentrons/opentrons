from pathlib import Path
from typing import Any, Generator

import pytest

from auth_server.persistence.database import create_schema, sql_engine_ctx
from auth_server.settings.models import (
    PatchAccessControlRequestData,
    PatchSettingsRequestData,
    SettingsResponseData,
)
from auth_server.settings.store import SettingsStore

_DEFAULTS: dict[str, Any] = SettingsResponseData().model_dump(
    mode="json", exclude_none=True
)


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
    settings_store.patch_settings(PatchSettingsRequestData(**_DEFAULTS))
    settings_store.reset_settings()
    fetched = settings_store.get_settings()
    assert fetched == SettingsResponseData()


@pytest.mark.parametrize(
    "updates, expected_changes",
    [
        pytest.param(
            PatchSettingsRequestData(maxNumberOfLoginAttempts=3),
            SettingsResponseData(maxNumberOfLoginAttempts=3),
            id="single-field",
        ),
        pytest.param(
            PatchSettingsRequestData(
                idleLogout=1800.0,
                passwordResetTime=7776000.0,
            ),
            SettingsResponseData(
                idleLogout=1800.0,
                passwordResetTime=7776000.0,
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
    settings_store.patch_settings(PatchSettingsRequestData(**_DEFAULTS))
    settings_store.patch_settings(updates)
    fetched = settings_store.get_settings()
    assert fetched == expected_changes


def test_patch_settings_transfers_data(settings_store: SettingsStore) -> None:
    """patch should transfer data to the settings store."""
    settings_store.patch_settings(PatchSettingsRequestData(**_DEFAULTS))
    settings_store.patch_settings(
        PatchSettingsRequestData(
            idleLogout=1800.0,
            passwordResetTime=7776000.0,
        )
    )
    fetched = settings_store.get_settings()
    assert fetched.idleLogout == 1800.0
    assert fetched.passwordResetTime == 7776000.0


def test_patch_settings_ignores_none_values(settings_store: SettingsStore) -> None:
    """patch should ignore unset fields."""
    settings_store.patch_settings(PatchSettingsRequestData(**_DEFAULTS))
    settings_store.patch_settings(
        PatchSettingsRequestData(
            idleLogout=1800.0,
        )
    )
    fetched = settings_store.get_settings()
    assert fetched == SettingsResponseData(idleLogout=1800.0)


def test_get_access_control_settings(settings_store: SettingsStore) -> None:
    """get_access_control_settings should return the current access control settings."""
    fetched = settings_store.get_access_control_settings()
    assert fetched.accessControlEnabled is False
    settings_store.patch_access_control(
        PatchAccessControlRequestData(accessControlEnabled=True)
    )
    fetched = settings_store.get_access_control_settings()
    assert fetched.accessControlEnabled is True
