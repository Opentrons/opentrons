from pathlib import Path
from typing import Generator

import pytest

from auth_server.persistence.database import create_schema, sql_engine_ctx
from auth_server.settings.store import SettingsStore


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
    settings_store.insert(
        access_control_enabled=True,
        max_number_of_login_attempts=10,
        password_reset_time_in_days=30,
        idle_lockout_in_minutes=300,
        require_admin_creds_when_updating_robot_software=True,
        require_admin_creds_when_sending_protocol_to_robot=True,
        require_admin_creds_for_signoff_protocol=False,
        require_signoff_for_protocol_log=True,
        require_reason_for_interaction=True,
        min_length_of_reason_for_interaction=10,
        require_logs_to_be_saved_in_app=True,
        delete_over_max_on_disk_protocols=True,
        password_complexity_minimum_length=8,
        password_complexity_special_characters=True,
    )
    fetched = settings_store.get()
    assert fetched is not None
    assert fetched.access_control_enabled
    assert fetched.max_number_of_login_attempts == 10
    assert fetched.password_reset_time_in_days == 30
    assert fetched.idle_lockout_in_minutes == 300
    assert fetched.require_admin_creds_when_updating_robot_software
    assert fetched.require_admin_creds_when_sending_protocol_to_robot
    assert fetched.require_admin_creds_for_signoff_protocol is False
    assert fetched.require_signoff_for_protocol_log
    assert fetched.require_reason_for_interaction
    assert fetched.min_length_of_reason_for_interaction == 10
    assert fetched.require_logs_to_be_saved_in_app
    assert fetched.delete_over_max_on_disk_protocols
    assert fetched.password_complexity_minimum_length == 8
    assert fetched.password_complexity_special_characters
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
    settings_store.insert(
        access_control_enabled=True,
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
        password_complexity_minimum_length=8,
        password_complexity_special_characters=True,
    )
    settings_store.reset()
    fetched = settings_store.get()
    assert fetched is None


def test_update_single_field(settings_store: SettingsStore) -> None:
    """update should only change the specified field."""
    settings_store.insert(
        access_control_enabled=False,
        max_number_of_login_attempts=5,
        password_reset_time_in_days=None,
        password_complexity_minimum_length=None,
        password_complexity_special_characters=None,
        idle_lockout_in_minutes=3,
        require_admin_creds_when_updating_robot_software=True,
        require_admin_creds_when_sending_protocol_to_robot=True,
        require_admin_creds_for_signoff_protocol=False,
        require_signoff_for_protocol_log=True,
        require_reason_for_interaction=True,
        min_length_of_reason_for_interaction=None,
        require_logs_to_be_saved_in_app=True,
        delete_over_max_on_disk_protocols=True,
    )
    settings_store.update(max_number_of_login_attempts=10)
    fetched = settings_store.get()
    assert fetched is not None
    assert fetched.max_number_of_login_attempts == 10
    # Everything else unchanged
    assert fetched.access_control_enabled is False
    assert fetched.idle_lockout_in_minutes == 3
    assert fetched.require_admin_creds_when_updating_robot_software is True


def test_update_multiple_fields(settings_store: SettingsStore) -> None:
    """update should change all specified fields at once."""
    settings_store.insert(
        access_control_enabled=False,
        max_number_of_login_attempts=5,
        password_reset_time_in_days=None,
        password_complexity_minimum_length=None,
        password_complexity_special_characters=None,
        idle_lockout_in_minutes=3,
        require_admin_creds_when_updating_robot_software=True,
        require_admin_creds_when_sending_protocol_to_robot=True,
        require_admin_creds_for_signoff_protocol=False,
        require_signoff_for_protocol_log=True,
        require_reason_for_interaction=True,
        min_length_of_reason_for_interaction=None,
        require_logs_to_be_saved_in_app=True,
        delete_over_max_on_disk_protocols=True,
    )
    settings_store.update(
        access_control_enabled=True,
        idle_lockout_in_minutes=30,
        password_reset_time_in_days=90,
    )
    fetched = settings_store.get()
    assert fetched is not None
    assert fetched.access_control_enabled is True
    assert fetched.idle_lockout_in_minutes == 30
    assert fetched.password_reset_time_in_days == 90
    # Unchanged fields
    assert fetched.max_number_of_login_attempts == 5
    assert fetched.require_admin_creds_for_signoff_protocol is False


def test_update_without_row_raises(settings_store: SettingsStore) -> None:
    """update should raise if no settings row exists."""
    with pytest.raises(RuntimeError):
        settings_store.update(max_number_of_login_attempts=10)
