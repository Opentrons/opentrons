from typing import Annotated

import fastapi

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .models import PatchSettingsRequestData, SettingsResponseData

_DEFAULT_SETTINGS = SettingsResponseData.model_construct(accessControlEnabled=False)


class SettingsStore:
    """Stores and retrieves the current authorization and authentication settings."""

    def __init__(self) -> None:
        self._settings = _DEFAULT_SETTINGS

    def get(self) -> SettingsResponseData:
        """Get the current settings."""
        return self._settings

    def patch(self, patch: PatchSettingsRequestData) -> SettingsResponseData:
        """Update the settings."""
        new_settings = self._settings.model_copy()

        # Pydantic will already have validated that `patch.accessControlEnabled` is
        # `True | None`, not `False`, so this is a one-way latch.
        if patch.accessControlEnabled is not None:
            new_settings.accessControlEnabled = patch.accessControlEnabled

        self._settings = new_settings
        return self.get()

    def reset(self) -> SettingsResponseData:
        """Reset all settings to their defaults."""
        self._settings = _DEFAULT_SETTINGS
        return self.get()


_accessor = AppStateAccessor[SettingsStore]("settings_store")


async def get_settings_store(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> SettingsStore:
    """Return the server's singleton SettingsStore."""
    settings_store = _accessor.get_from(app_state)
    if settings_store is None:
        settings_store = SettingsStore()
        _accessor.set_on(app_state, settings_store)
    return settings_store
