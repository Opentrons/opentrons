"""The server's ASGI app object."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from server_utils import systemd_utils

from key_server.secure_volume.dependency import (
    build_secure_volume_manager,
    install_secure_volume_manager,
)
from key_server.settings.router import router as settings_router
from key_server.settings.store import SettingsStore, install_settings_store


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings_store = SettingsStore()
    install_settings_store(app.state, settings_store)
    secure_volume_manager = build_secure_volume_manager(settings_store)
    install_secure_volume_manager(app.state, secure_volume_manager)
    await secure_volume_manager.mount()
    systemd_utils.notify_up()
    try:
        yield
    finally:
        await secure_volume_manager.unmount()


app = FastAPI(
    title="Opentrons Key Server",
    openapi_url=None,
    docs_url=None,
    redoc_url=None,
    lifespan=_lifespan,
)

app.include_router(settings_router)
