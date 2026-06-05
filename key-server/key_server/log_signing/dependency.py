"""FastAPI dependencies for the log signing key."""

from typing import Annotated

import fastapi

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .manager import SigningKeyManager
from key_server.secure_volume.dependency import get_secure_volume_manager
from key_server.secure_volume.manager.interface import SecureVolumeManager

_accessor = AppStateAccessor[SigningKeyManager]("signing_key_manager")


def build_signing_key_manager(
    secure_volume_manager: SecureVolumeManager,
) -> SigningKeyManager:
    """Build the signing key manager."""
    secure_dir = secure_volume_manager.path
    return SigningKeyManager(key_dir=secure_dir / "signing_keys")


def install_signing_key_manager(
    app_state: AppState, signing_key_manager: SigningKeyManager
) -> None:
    """Place the server's singleton SigningKeyManager in server state."""
    _accessor.set_on(app_state, signing_key_manager)


def get_signing_key_manager(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    secure_volume: Annotated[
        SecureVolumeManager, fastapi.Depends(get_secure_volume_manager)
    ],
) -> SigningKeyManager:
    """Get (or create) the robot signing key."""
    signing_key_manager = _accessor.get_from(app_state)
    if signing_key_manager is None:
        signing_key_manager = build_signing_key_manager(secure_volume)
        install_signing_key_manager(app_state, signing_key_manager)
    return signing_key_manager
