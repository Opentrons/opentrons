"""Main FastAPI application."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Any

from system_server._version import version
from system_server.settings import get_settings
from system_server.persistence import get_sql_engine, get_persistence_directory
from system_server.router import router
from system_server.errors import exception_handlers

log = logging.getLogger(__name__)


app = FastAPI(
    title="Opentrons System Server HTTP API Spec",
    description=(
        "This OpenAPI spec describes the HTTP API of the Opentrons " "System Server."
    ),
    version=version,
    exception_handlers=exception_handlers,
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
    get_settings()

    # Initialize the persistent directory & sql database on startup to ensure
    # both are loaded when any requests need them
    persistence_directory = await get_persistence_directory(app.state)
    await get_sql_engine(app.state, persistence_directory)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Handle app shutdown."""
    # Placeholder for actual shutdown processes
    shutdown_results: List[Any] = []
    log.info("shutdown")

    shutdown_errors = [r for r in shutdown_results if isinstance(r, BaseException)]

    for e in shutdown_errors:
        log.warning("Error during shutdown", exc_info=e)
