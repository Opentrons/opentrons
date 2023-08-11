"""Main FastAPI application."""
import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from opentrons import __version__

from .errors import exception_handlers
from .hardware import start_initializing_hardware, clean_up_hardware
from .persistence import start_initializing_persistence, clean_up_persistence
from .router import router
from .service import initialize_logging
from .service.task_runner import (
    initialize_task_runner,
    clean_up_task_runner,
)
from .settings import get_settings
from .runs.dependencies import (
    start_light_control_task,
    mark_light_control_startup_finished,
)

log = logging.getLogger(__name__)


app = FastAPI(
    title="Opentrons OT-2 HTTP API Spec",
    description=(
        "This OpenAPI spec describes the HTTP API of the Opentrons "
        "OT-2. It may be retrieved from a robot on port 31950 at "
        "/openapi. Some schemas used in requests and responses use "
        "the `x-patternProperties` key to mean the JSON Schema "
        "`patternProperties` behavior."
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
    settings = get_settings()

    initialize_logging()
    initialize_task_runner(app_state=app.state)
    start_initializing_hardware(
        app_state=app.state,
        callbacks=[
            (start_light_control_task, True),
            (mark_light_control_startup_finished, False),
        ],
    )
    start_initializing_persistence(
        app_state=app.state,
        persistence_directory=(
            None
            if settings.persistence_directory == "automatically_make_temporary"
            else settings.persistence_directory
        ),
    )


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Handle app shutdown."""
    shutdown_results = await asyncio.gather(
        clean_up_hardware(app.state),
        clean_up_persistence(app.state),
        clean_up_task_runner(app.state),
        return_exceptions=True,
    )

    shutdown_errors = [r for r in shutdown_results if isinstance(r, BaseException)]

    for e in shutdown_errors:
        log.warning("Error during shutdown", exc_info=e)
