"""FastAPI dependencies for TLS certificates."""

from logging import getLogger
from typing import Annotated

import fastapi

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .manager import TLSManager
from key_server.config.dependency import get_config
from key_server.config.models import ResolvedConfig
from key_server.secure_volume.dependency import get_secure_volume_manager
from key_server.secure_volume.manager.interface import SecureVolumeManager

LOG = getLogger(__name__)

_accessor = AppStateAccessor[TLSManager]("tls_manager")


async def build_tls_manager(
    secure_volume_manager: SecureVolumeManager, config: ResolvedConfig
) -> TLSManager:
    """Build the TLS manager to control TLS certificates."""
    secure_dir = secure_volume_manager.path
    return await TLSManager.create(
        ca_cert_dir=config.tls_directory,
        ca_key_dir=secure_dir / "ca_keys",
        tls_ee_dir=config.tls_directory,
        terminator_reload=config.tls_server_integration,
        cert_password_length_words=config.cert_password_length_words,
        cert_password_rotation_time_s=config.cert_password_rotation_time_s,
    )


def install_tls_manager(app_state: AppState, tls_manager: TLSManager) -> None:
    """Place the sever's singleton TLSManager in server state, for later retrieval by get_tls_manager()."""
    _accessor.set_on(app_state, tls_manager)


async def get_tls_manager(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    secure_volume: Annotated[
        SecureVolumeManager, fastapi.Depends(get_secure_volume_manager)
    ],
    config: Annotated[ResolvedConfig, fastapi.Depends(get_config)],
) -> TLSManager:
    """Return the server's singleton TLSManager."""
    tls_manager = _accessor.get_from(app_state)
    if tls_manager is None:
        tls_manager = await build_tls_manager(secure_volume, config)
        _accessor.set_on(app_state, tls_manager)
    return tls_manager
