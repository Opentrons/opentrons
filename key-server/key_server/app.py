"""The server's ASGI app object."""

from contextlib import AsyncExitStack, asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from server_utils import systemd_utils

from key_server.config.dependency import install_config, resolve_config
from key_server.log_signing.dependency import (
    build_signing_key_manager,
    install_signing_key_manager,
)
from key_server.log_signing.router import router as log_signing_router
from key_server.secure_volume.dependency import (
    build_secure_volume_manager,
    install_secure_volume_manager,
)
from key_server.settings.router import router as settings_router
from key_server.settings.store import SettingsStore, install_settings_store
from key_server.tls.dependency import (
    build_tls_manager,
    install_tls_manager,
)
from key_server.tls.router import router as tls_router


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async with AsyncExitStack() as exit_stack:
        config = resolve_config()
        install_config(app.state, config)
        settings_store = SettingsStore()
        install_settings_store(app.state, settings_store)
        secure_volume_manager = build_secure_volume_manager(settings_store, config)
        install_secure_volume_manager(app.state, secure_volume_manager)
        await secure_volume_manager.mount()
        exit_stack.push_async_callback(secure_volume_manager.unmount)
        tls_manager = await build_tls_manager(secure_volume_manager, config)
        install_tls_manager(app.state, tls_manager)
        exit_stack.push_async_callback(tls_manager.teardown)
        signing_key_manager = build_signing_key_manager(secure_volume_manager)
        install_signing_key_manager(app.state, signing_key_manager)
        systemd_utils.notify_up()
        yield


app = FastAPI(
    title="Opentrons Key Server",
    openapi_url=None,
    docs_url=None,
    redoc_url=None,
    lifespan=_lifespan,
)

app.include_router(settings_router)
app.include_router(tls_router)
app.include_router(log_signing_router)
