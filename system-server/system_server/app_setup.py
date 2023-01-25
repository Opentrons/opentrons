"""Main FastAPI application."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Any
from robot_server.errors.exception_handlers import exception_handlers  # type: ignore[import]

from .router import router

from opentrons import __version__

log = logging.getLogger(__name__)

app = FastAPI(
    title="Opentrons OT-2 HTTP API Spec",
    description=(
        "This OpenAPI spec describes the HTTP API of the Opentrons " "System Server."
    ),
    version=__version__,
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
    log.info("System server app is starting up")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Handle app shutdown."""
    # Placeholder for actual shutdown processes
    shutdown_results: List[Any] = []

    shutdown_errors = [r for r in shutdown_results if isinstance(r, BaseException)]

    for e in shutdown_errors:
        log.warning("Error during shutdown", exc_info=e)
