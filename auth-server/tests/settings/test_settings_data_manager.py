import pytest
from decoy import Decoy

from auth_server.settings.models import (
    PatchSettingsRequestData,
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
            maxNumberOfLoginAttempts=10,
            passwordResetTimeInDays=30,
            idleLockoutInMinutes=300,
            requireAdminCredsWhenUpdatingRobotSoftware=True,
            requireAdminCredsWhenSendingProtocolToRobot=True,
            requireAdminCredsForSignoffProtocol=False,
            requireSignoffForProtocolLog=True,
            requireReasonForInteraction=True,
            minLengthOfReasonForInteraction=10,
            requireLogsToBeSavedInApp=True,
            deleteOverMaxOnDiskProtocols=True,
        )
    )
    decoy.verify(
        mock_store.upsert_many(
            {
                "accessControlEnabled": "true",
                "maxNumberOfLoginAttempts": "10",
                "passwordResetTimeInDays": "30",
                "idleLockoutInMinutes": "300",
                "requireAdminCredsWhenUpdatingRobotSoftware": "true",
                "requireAdminCredsWhenSendingProtocolToRobot": "true",
                "requireAdminCredsForSignoffProtocol": "false",
                "requireSignoffForProtocolLog": "true",
                "requireReasonForInteraction": "true",
                "requireLogsToBeSavedInApp": "true",
                "deleteOverMaxOnDiskProtocols": "true",
                "minLengthOfReasonForInteraction": "10",
            }
        )
    )


def test_patch_settings_with_none_values(
    decoy: Decoy, mock_store: SettingsStore, manager: SettingsDataManager
) -> None:
    """Test that patch settings with none values adds default values for the fields that are not provided."""
    manager.patch(
        PatchSettingsRequestData(
            accessControlEnabled=True,
            maxNumberOfLoginAttempts=15,
        )
    )
    decoy.verify(
        mock_store.upsert_many(
            {
                "accessControlEnabled": "true",
                "maxNumberOfLoginAttempts": "15",
            }
        )
    )


def test_reset_settings(
    decoy: Decoy, mock_store: SettingsStore, manager: SettingsDataManager
) -> None:
    manager.reset()
    decoy.verify(mock_store.delete_all())


def test_get_settings(
    decoy: Decoy, mock_store: SettingsStore, manager: SettingsDataManager
) -> None:
    manager.get()
    decoy.verify(mock_store.get_all())
