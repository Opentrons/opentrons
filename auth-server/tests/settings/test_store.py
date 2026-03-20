from pathlib import Path
from typing import Generator

import pytest

from auth_server.persistence.database import create_schema, sql_engine_ctx
from auth_server.settings.store import SettingsStore

_DEFAULTS = {
    "accessControlEnabled": "False",
    "max_number_of_login_attempts": "5",
    "passwordResetTimeInDays": "None",
    "passwordComplexityMinimumLength": "0",
    "passwordComplexitySpecialCharacters": "False",
    "idleLockoutInMinutes": "3",
    "requireAdminCredsWhenUpdatingRobotSoftware": "True",
    "requireAdminCredsWhenSendingProtocolToRobot": "True",
    "requireAdminCredsForSignoffProtocol": "False",
    "requireSignoffForProtocolLog": "True",
    "requireReasonForInteraction": "True",
    "minLengthOfReasonForInteraction": "None",
    "requireLogsToBeSavedInApp": "True",
    "deleteOverMaxOnDiskProtocols": "True",
}


def _upsert_defaults(store: SettingsStore) -> None:
    store.upsert_many({key: str(value) for key, value in _DEFAULTS.items()})


@pytest.fixture()
def settings_store(tmp_path: Path) -> Generator[SettingsStore, None, None]:
    """Provide a UserStore backed by a fresh SQLite DB with seed users."""
    db_path = tmp_path / "test_auth.db"
    with sql_engine_ctx(db_path) as engine:
        create_schema(engine)
        store = SettingsStore(sql_engine=engine)
        yield store


# test password complexity with none values
def test_upsert_and_get_settings(settings_store: SettingsStore) -> None:
    """insert should persist the settings so get can find it."""
    _upsert_defaults(settings_store)
    fetched = settings_store.get_all()
    assert fetched is not None
    assert fetched == {key: str(value) for key, value in _DEFAULTS.items()}
    settings_store.upsert("maxNumberOfLoginAttempts", "10")
    fetched = settings_store.get_all()
    assert fetched is not None
    assert fetched == {**_DEFAULTS, "maxNumberOfLoginAttempts": "10"}


def test_reset_settings(settings_store: SettingsStore) -> None:
    """reset should delete the settings record and force settings to defaults."""
    _upsert_defaults(settings_store)
    settings_store.delete_all()
    fetched = settings_store.get_all()
    assert fetched == {}


@pytest.mark.parametrize(
    "updates, expected_changes",
    [
        pytest.param(
            {"maxNumberOfLoginAttempts": "10"},
            {"maxNumberOfLoginAttempts": "10"},
            id="single-field",
        ),
        pytest.param(
            {
                "accessControlEnabled": "True",
                "idleLockoutInMinutes": "30",
                "passwordResetTimeInDays": "90",
            },
            {
                "accessControlEnabled": "True",
                "idleLockoutInMinutes": "30",
                "passwordResetTimeInDays": "90",
            },
            id="multiple-fields",
        ),
    ],
)
def test_update_changes_only_specified_fields(
    settings_store: SettingsStore,
    updates: dict[str, str],
    expected_changes: dict[str, str],
) -> None:
    """update should change only the specified fields and leave the rest unchanged."""
    _upsert_defaults(settings_store)
    settings_store.upsert_many({key: str(value) for key, value in updates.items()})

    fetched = settings_store.get_all()
    expected = {**_DEFAULTS, **expected_changes}
    assert fetched == expected


def test_upsert_without_row_raises(settings_store: SettingsStore) -> None:
    """upsert should create a new row if no settings row exists."""
    settings_store.upsert("maxNumberOfLoginAttempts", "10")
    fetched = settings_store.get_all()
    assert fetched is not None
    assert fetched == {"maxNumberOfLoginAttempts": "10"}
