from pathlib import Path
from typing import Generator

import pytest

from auth_server.persistence.database import create_schema, sql_engine_ctx
from auth_server.settings.store import SettingsStore

_DEFAULTS = {
    "access_control_enabled": False,
    "max_number_of_login_attempts": 5,
    "password_reset_time_in_days": None,
    "password_complexity_minimum_length": None,
    "password_complexity_special_characters": None,
    "idle_lockout_in_minutes": 3,
    "require_admin_creds_when_updating_robot_software": True,
    "require_admin_creds_when_sending_protocol_to_robot": True,
    "require_admin_creds_for_signoff_protocol": False,
    "require_signoff_for_protocol_log": True,
    "require_reason_for_interaction": True,
    "min_length_of_reason_for_interaction": None,
    "require_logs_to_be_saved_in_app": True,
    "delete_over_max_on_disk_protocols": True,
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
    settings_store.upsert("max_number_of_login_attempts", "10")
    fetched = settings_store.get_all()
    assert fetched is not None
    assert fetched == {**_DEFAULTS, "max_number_of_login_attempts": "10"}


def test_reset_settings(settings_store: SettingsStore) -> None:
    """reset should delete the settings record and force settings to defaults."""
    _upsert_defaults(settings_store)
    settings_store.delete_all()
    fetched = settings_store.get_all()
    assert fetched is None


@pytest.mark.parametrize(
    "updates, expected_changes",
    [
        pytest.param(
            {"max_number_of_login_attempts": 10},
            {"max_number_of_login_attempts": 10},
            id="single-field",
        ),
        pytest.param(
            {
                "access_control_enabled": True,
                "idle_lockout_in_minutes": 30,
                "password_reset_time_in_days": 90,
            },
            {
                "access_control_enabled": True,
                "idle_lockout_in_minutes": 30,
                "password_reset_time_in_days": 90,
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
    settings_store.upsert_many({key: str(value) for key, value in updates.items()})

    fetched = settings_store.get_all()
    assert fetched is not None

    expected = {**_DEFAULTS, **expected_changes}
    for attr, value in expected.items():
        assert getattr(fetched, attr) == value, (
            f"{attr}: expected {value}, got {getattr(fetched, attr)}"
        )


def test_upsert_without_row_raises(settings_store: SettingsStore) -> None:
    """upsert should create a new row if no settings row exists."""
    settings_store.upsert("max_number_of_login_attempts", "10")
    fetched = settings_store.get_all()
    assert fetched is not None
    assert fetched == {**_DEFAULTS, "max_number_of_login_attempts": "10"}
