"""The server's ASGI app object."""

from contextlib import AsyncExitStack, asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from server_utils import systemd_utils

from audit_server.log_ingest.router import router as ingest_router


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    async with AsyncExitStack():
        systemd_utils.notify_up()
        yield


app = FastAPI(
    title="Opentrons Audit Server",
    openapi_url=None,
    docs_url=None,
    redoc_url=None,
    lifespan=_lifespan,
)

app.include_router(ingest_router)
