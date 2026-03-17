import pytest
from decoy import Decoy

from auth_server.settings.models import (
    PatchSettingsRequestData,
    SettingsResponseData,
)
from auth_server.settings.settings_data_manager import (
    SettingsDataManager,
)
from auth_server.settings.store import SettingsStore


@pytest.fixture()
def mock_store(decoy: Decoy) -> SettingsStore:
    """Get a mock SettingsStore."""
    return decoy.mock(cls=SettingsStore)


@pytest.fixture()
def manager(mock_store: SettingsStore) -> SettingsDataManager:
    """Provide a SettingsDataManager backed by a mock store."""
    return SettingsDataManager(settings_store=mock_store)


def test_patch_settings(
    decoy: Decoy, mock_store: SettingsStore, manager: SettingsDataManager
) -> None:
    manager.patch(
        PatchSettingsRequestData(
            accessControlEnabled=True,
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
        )
    )
    decoy.verify(
        mock_store.update(
            PatchSettingsRequestData(
                accessControlEnabled=True,
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
            ),
        )
    )
    manager.patch(
        PatchSettingsRequestData(
            accessControlEnabled=True,
            max_number_of_login_attempts=15,
        )
    )
    decoy.verify(
        mock_store.update(
            PatchSettingsRequestData(
                accessControlEnabled=True,
                max_number_of_login_attempts=15,
            ),
        )
    )


def test_reset_settings(
    decoy: Decoy, mock_store: SettingsStore, manager: SettingsDataManager
) -> None:
    manager.reset()
    decoy.verify(mock_store.reset())


def test_get_settings(
    decoy: Decoy, mock_store: SettingsStore, manager: SettingsDataManager
) -> None:
    decoy.when(mock_store.get()).then_return(
        SettingsResponseData.model_construct(accessControlEnabled=True)
    )
    result = manager.get()
    decoy.verify(mock_store.get())
    assert result == SettingsResponseData.model_construct(accessControlEnabled=True)
