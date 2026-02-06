"""The server's ASGI app object."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from server_utils import systemd_utils

from auth_server.oauth2.fastapi_dependencies import init_oauth2_backend
from auth_server.oauth2.router import router as oauth2_router
from auth_server.users.router import router as users_router

_log = logging.getLogger(__name__)


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    init_oauth2_backend(app.state)
    systemd_utils.notify_up()
    yield


app = FastAPI(
    title="Opentrons Auth Server",
    lifespan=_lifespan,
)

app.include_router(oauth2_router)
app.include_router(users_router)
