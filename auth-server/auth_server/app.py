"""The server's ASGI app object."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from server_utils import systemd_utils

_log = logging.getLogger(__name__)


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    systemd_utils.notify_up()
    yield


app = FastAPI(lifespan=_lifespan)


# todo(mm, 2026-01-15): Remove this placeholder when this server has any real endpoint.
@app.get("/auth/hello")
def get_hello() -> str:  # noqa: D103
    return "Hello, world."
