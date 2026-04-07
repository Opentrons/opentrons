"""FastAPI dependencies for TLS certificates."""

from logging import getLogger
from typing import Annotated
import fastapi
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)
import tempfile

from .manager import TLSManager

from key_server.config import get_config
from key_server.secure_volume.interface import SecureVolumeManager
from key_server.secure_volume.dependency import get_secure_volume_manager

LOG = getLogger(__name__)

_accessor = AppStateAccessor[TLSManager]("tls_manager")


async def build_tls_manager(secure_volume_manager: SecureVolumeManager) -> TLSManager:
    tls_base = get_config().tls_directory
    if tls_base == "automatically_make_temporary":
        tls_base_dir = get_config().base_directory / "tls"
        LOG.info(
            f"TLS certs will be temporarily in {tls_base_dir} inside the base directory"
        )
    else:
        tls_base_dir = tls_base
        LOG.info(f"TLS certs will be in permanent directory {tls_base_dir}")
    secure_dir = secure_volume_manager.path
    return await TLSManager.create(
        tls_base_dir,
        secure_dir / "ca_keys",
        tls_base_dir,
    )


def install_tls_manager(app_state: AppState, tls_manager: TLSManager) -> None:
    """Place the sever's singleton TLSManager in server state, for later retrieval by get_tls_manager()."""
    _accessor.set_on(app_state, tls_manager)


async def get_tls_manager(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    secure_volume: Annotated[
        SecureVolumeManager, fastapi.Depends(get_secure_volume_manager)
    ],
) -> TLSManager:
    """Return the server's singleton TLSManager."""
    tls_manager = _accessor.get_from(app_state)
    if tls_manager is None:
        tls_manager = await build_tls_manager(secure_volume)
        _accessor.set_on(app_state, tls_manager)
    return tls_manager
