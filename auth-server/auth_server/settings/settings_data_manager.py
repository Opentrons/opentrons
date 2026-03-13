from typing import Annotated

import fastapi

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .models import PatchSettingsRequestData, SettingsResponseData

_DEFAULT_SETTINGS = SettingsResponseData.model_construct(accessControlEnabled=False)


class SettingsDataManager:
    """Manages the current authorization and authentication settings."""

    def __init__(self) -> None:
        self._settings = _DEFAULT_SETTINGS

    def get(self) -> SettingsResponseData:
        """Get the current settings."""
        return self._settings

    def patch(self, patch: PatchSettingsRequestData) -> SettingsResponseData:
        """Update the settings."""
        print(patch)
        new_settings = self._settings.model_copy(
            update=patch.model_dump(exclude_none=True)
        )
        print(new_settings)
        self._settings = new_settings
        return self.get()

    def reset(self) -> SettingsResponseData:
        """Reset all settings to their defaults."""
        new_settings = _DEFAULT_SETTINGS.model_copy()
        # accessControlEnabled is special and is excluded from the reset.
        new_settings.accessControlEnabled = self._settings.accessControlEnabled
        self._settings = new_settings
        return self.get()


_accessor = AppStateAccessor[SettingsDataManager]("settings_data_manager")


def install_settings_data_manager(
    app_state: AppState, settings_data_manager: SettingsDataManager
) -> None:
    """Place the server's singleton SettingsStore in server state, for later retrieval by get_settings_store()."""
    _accessor.set_on(app_state, settings_data_manager)


def get_settings_data_manager(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> SettingsDataManager:
    """Return the server's singleton SettingsStore."""
    settings_data_manager = _accessor.get_from(app_state)
    if settings_data_manager is None:
        settings_data_manager = SettingsDataManager()
        _accessor.set_on(app_state, settings_data_manager)
    return settings_data_manager
