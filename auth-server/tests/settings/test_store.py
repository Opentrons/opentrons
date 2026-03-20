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


def _insert_defaults(store: SettingsStore) -> None:
    store.upsert_many(_DEFAULTS)  # type: ignore[arg-type]


@pytest.fixture()
def settings_store(tmp_path: Path) -> Generator[SettingsStore, None, None]:
    """Provide a UserStore backed by a fresh SQLite DB with seed users."""
    db_path = tmp_path / "test_auth.db"
    with sql_engine_ctx(db_path) as engine:
        create_schema(engine)
        store = SettingsStore(sql_engine=engine)
        # service = SettingsDataManager(settings_store=store)
        yield store


# test password complexity with none values
def test_insert_and_get_settings(settings_store: SettingsStore) -> None:
    """insert should persist the settings so get can find it."""
    _insert_defaults(settings_store)
    fetched = settings_store.get()
    assert fetched is not None
    assert fetched.access_control_enabled is False
    assert fetched.max_number_of_login_attempts == 5
    assert fetched.password_reset_time_in_days is None
    assert fetched.idle_lockout_in_minutes == 3
    assert fetched.require_admin_creds_when_updating_robot_software is True
    assert fetched.require_admin_creds_when_sending_protocol_to_robot is True
    assert fetched.require_admin_creds_for_signoff_protocol is False
    assert fetched.require_signoff_for_protocol_log is True
    assert fetched.require_reason_for_interaction is True
    assert fetched.min_length_of_reason_for_interaction is None
    assert fetched.require_logs_to_be_saved_in_app is True
    assert fetched.delete_over_max_on_disk_protocols is True
    with pytest.raises(ValueError):
        settings_store.insert(
            access_control_enabled=False,
            max_number_of_login_attempts=5,
            password_reset_time_in_days=15,
            idle_lockout_in_minutes=200,
            require_admin_creds_when_updating_robot_software=False,
            require_admin_creds_when_sending_protocol_to_robot=False,
            require_admin_creds_for_signoff_protocol=True,
            require_signoff_for_protocol_log=False,
            require_reason_for_interaction=True,
            min_length_of_reason_for_interaction=10,
            require_logs_to_be_saved_in_app=True,
            delete_over_max_on_disk_protocols=True,
            password_complexity_minimum_length=None,
            password_complexity_special_characters=None,
        )


def test_reset_settings(settings_store: SettingsStore) -> None:
    """reset should delete the settings record and force settings to defaults."""
    _insert_defaults(settings_store)
    settings_store.reset()
    fetched = settings_store.get()
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
    _insert_defaults(settings_store)
    settings_store.update(**updates)

    fetched = settings_store.get()
    assert fetched is not None

    expected = {**_DEFAULTS, **expected_changes}
    for attr, value in expected.items():
        assert getattr(fetched, attr) == value, (
            f"{attr}: expected {value}, got {getattr(fetched, attr)}"
        )


def test_update_without_row_raises(settings_store: SettingsStore) -> None:
    """update should raise if no settings row exists."""
    with pytest.raises(RuntimeError):
        settings_store.update(max_number_of_login_attempts=10)
