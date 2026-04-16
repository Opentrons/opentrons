import tempfile
from pathlib import Path
from typing import Annotated

import fastapi

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from .models import ResolvedConfig, calculate_config

_accessor = AppStateAccessor[ResolvedConfig]("config")


def get_config(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> ResolvedConfig:
    """Get the resolved configuration, possibly resolving it."""
    config = _accessor.get_from(app_state)
    if config is None:
        config = resolve_config()
        _accessor.set_on(app_state, config)
    return config


def resolve_config() -> ResolvedConfig:
    """Resolve config, possibly creating directories."""
    base_config = calculate_config()
    if base_config.secure_storage_implementation == "caam":
        if base_config.base_directory == "automatically_make_temporary":
            raise RuntimeError(
                "CAAM secure volume cannot mount to a temporary directory"
            )
        if base_config.image_mount_point == "automatically_make_temporary":
            raise RuntimeError(
                "CAAM secure volume cannot mount to a temporary directory"
            )
    if base_config.base_directory == "automatically_make_temporary":
        base_dir = Path(tempfile.mkdtemp())
    else:
        base_dir = base_config.base_directory
    if base_config.image_mount_point == "automatically_make_temporary":
        image_mount = Path(tempfile.mkdtemp())
    else:
        image_mount = base_config.image_mount_point
    if base_config.tls_directory == "automatically_make_temporary":
        tls_base_dir = Path(tempfile.mkdtemp())
    else:
        tls_base_dir = base_config.tls_directory
    return ResolvedConfig(
        secure_storage_implementation=base_config.secure_storage_implementation,
        base_directory=base_dir,
        image_mount_point=image_mount,
        secure_volume_size_mb=base_config.secure_volume_size_mb,
        tls_directory=tls_base_dir,
        tls_server_integration=base_config.tls_server_integration,
        mitmproxy_touch_path=(
            base_config.mitmproxy_touch_path
            if base_config.tls_server_integration == "dev-mitmproxy"
            else None
        ),
        cert_password_length_words=base_config.cert_password_length_words,
        cert_password_rotation_time_s=base_config.cert_password_rotation_time_s,
    )


def install_config(app_state: AppState, config: ResolvedConfig) -> None:
    """Put the configuration in the app state."""
    _accessor.set_on(app_state, config)
