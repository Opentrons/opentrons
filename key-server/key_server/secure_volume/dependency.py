"""FastAPI dependencies for the secure volume."""

from typing import Annotated

import fastapi

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .manager.caam import CAAMSecureVolume
from .manager.dev import DevSecureVolume
from .manager.interface import SecureVolumeManager
from key_server.config.dependency import get_config
from key_server.config.models import ResolvedConfig
from key_server.settings.store import SettingsStore, get_settings_store

_accessor = AppStateAccessor[SecureVolumeManager]("secure_volume_manager")


def build_secure_volume_manager(
    settings: SettingsStore, config: ResolvedConfig
) -> SecureVolumeManager:
    """Build the appropriate secure volume manager based on the server config."""
    if config.secure_storage_implementation == "caam":
        return CAAMSecureVolume(
            image_mount_point=config.image_mount_point,
            base_directory=config.base_directory,
            volume_size_mb=config.secure_volume_size_mb,
        )
    else:
        return DevSecureVolume(config.image_mount_point)


def install_secure_volume_manager(
    app_state: AppState, secure_volume_manager: SecureVolumeManager
) -> None:
    """Place the server's singleton SecureVolumeManager in server state, for later retrieval by get_secure_volume_manager()."""
    _accessor.set_on(app_state, secure_volume_manager)


async def get_secure_volume_manager(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    config: Annotated[ResolvedConfig, fastapi.Depends(get_config)],
) -> SecureVolumeManager:
    """Return the server's singleton SecureVolumeManager."""
    secure_volume_manager = _accessor.get_from(app_state)
    if secure_volume_manager is None:
        secure_volume_manager = build_secure_volume_manager(
            await get_settings_store(app_state), get_config(app_state)
        )
        _accessor.set_on(app_state, secure_volume_manager)
    return secure_volume_manager
