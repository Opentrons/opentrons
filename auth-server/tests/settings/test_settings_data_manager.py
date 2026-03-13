import pytest
from decoy import Decoy

from auth_server.settings.models import PatchSettingsRequestData
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


# ── create_settings ─────────────────────────────────────────────────────


def test_patch_settings(
    decoy: Decoy, mock_store: SettingsStore, manager: SettingsDataManager
) -> None:
    manager.patch(
        PatchSettingsRequestData(
            accessControlEnabled=True,
        )
    )
    decoy.verify(
        mock_store.update(
            username="username",
            settings=PatchSettingsRequestData(accessControlEnabled=True),
        )
    )


def test_create_will_not_duplicate_settings(
    decoy: Decoy, mock_store: SettingsStore, manager: SettingsDataManager
) -> None:
    manager.patch(
        PatchSettingsRequestData(
            accessControlEnabled=True,
        )
    )
    decoy.verify(
        mock_store.update(
            username="username",
            settings=PatchSettingsRequestData(accessControlEnabled=True),
        ),
        times=0,
    )
