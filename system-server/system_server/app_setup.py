"""Main FastAPI application."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Any

from system_server._version import version
from system_server.settings import get_settings
from system_server.router import router

from server_utils.logging import log_init

log = logging.getLogger(__name__)


app = FastAPI(
    title="Opentrons System Server HTTP API Spec",
    description=(
        "This OpenAPI spec describes the HTTP API of the Opentrons System Server."
    ),
    version=version,
    openapi_url="/system/openapi.json",
    docs_url="/system/docs",
    redoc_url="/system/redoc",
)

# cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=("*"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# main router
app.include_router(router=router)


@app.on_event("startup")
async def on_startup() -> None:
    """Handle app startup."""
    # Load settings and (throw away the result) so that we detect errors early
    # on in startup, instead of the first time someone happens to use a setting.
    log.info("IM THE SYSTEM SERVER")
    settings = get_settings()
    log_init(settings.log_level)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Handle app shutdown."""
    # Placeholder for actual shutdown processes
    shutdown_results: List[Any] = []
    log.info("shutdown")

    shutdown_errors = [r for r in shutdown_results if isinstance(r, BaseException)]

    for e in shutdown_errors:
        log.warning("Error during shutdown", exc_info=e)
