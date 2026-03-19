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
from key_server.config import get_config
from key_server.settings.store import SettingsStore, get_settings_store

_accessor = AppStateAccessor[SecureVolumeManager]("secure_volume_manager")


def build_secure_volume_manager(settings: SettingsStore) -> SecureVolumeManager:
    """Build the appropriate secure volume manager based on the server config."""
    if get_config().secure_storage_implementation == "caam":
        base_directory = get_config().base_directory
        if base_directory == "automatically_make_temporary":
            raise RuntimeError(
                "CAAM secure volume cannot mount to a temporary directory"
            )
        image_mount_point = get_config().image_mount_point
        if image_mount_point == "automatically_make_temporary":
            raise RuntimeError(
                "CAAM secure volume cannot mount to a temporary directory"
            )

        return CAAMSecureVolume(
            image_mount_point=image_mount_point,
            base_directory=base_directory,
            volume_size_mb=get_config().secure_volume_size_mb,
        )
    else:
        return DevSecureVolume()


def install_secure_volume_manager(
    app_state: AppState, secure_volume_manager: SecureVolumeManager
) -> None:
    """Place the server's singleton SecureVolumeNaager in server state, for later retrieval by get_secure_volume_manager()."""
    _accessor.set_on(app_state, secure_volume_manager)


async def get_secure_volume_manager(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> SecureVolumeManager:
    """Return the server's singleton SecureVolumeManager."""
    secure_volume_manager = _accessor.get_from(app_state)
    if secure_volume_manager is None:
        secure_volume_manager = build_secure_volume_manager(
            await get_settings_store(app_state)
        )
        _accessor.set_on(app_state, secure_volume_manager)
    return secure_volume_manager
