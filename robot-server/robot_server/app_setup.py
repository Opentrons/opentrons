"""Main FastAPI application."""
import asyncio
import logging
from typing import Optional, AsyncGenerator
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from opentrons import __version__

from .errors.exception_handlers import exception_handlers
from .hardware import (
    fbl_init,
    fbl_mark_hardware_init_complete,
    fbl_mark_persistence_init_complete,
    start_initializing_hardware,
    clean_up_hardware,
    fbl_start_blinking,
    fbl_clean_up,
)
from .persistence.fastapi_dependencies import (
    start_initializing_persistence,
    clean_up_persistence,
)
from .router import router
from .service.logging import initialize_logging
from .service.task_runner import (
    initialize_task_runner,
    clean_up_task_runner,
)
from .settings import get_settings
from .runs.dependencies import (
    start_light_control_task,
    mark_light_control_startup_finished,
)

from .service.notifications import (
    initialize_notifications,
    clean_up_notification_client,
)

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan event handler for FastAPI."""
    try:
        await on_startup()
        yield
    finally:
        await on_shutdown()


async def on_startup() -> None:
    """Handle app startup."""
    settings = get_settings()

    if settings.persistence_directory == "automatically_make_temporary":
        persistence_directory: Optional[Path] = None
    else:
        persistence_directory = settings.persistence_directory

    initialize_logging()
    initialize_task_runner(app_state=app.state)
    fbl_init(app_state=app.state)
    start_initializing_hardware(
        app_state=app.state,
        callbacks=[
            # Flex light control:
            (start_light_control_task, True),
            (mark_light_control_startup_finished, False),
            # OT-2 light control:
            (fbl_start_blinking, True),
            (fbl_mark_hardware_init_complete, False),
        ],
    )
    start_initializing_persistence(
        app_state=app.state,
        persistence_directory_root=persistence_directory,
        done_callbacks=[
            # For OT-2 light control only. The Flex status bar isn't handled here
            # because it's currently tied to hardware and run status, not to
            # initialization of the persistence layer.
            fbl_mark_persistence_init_complete
        ],
    )
    initialize_notifications(
        app_state=app.state,
    )


async def on_shutdown() -> None:
    """Handle app shutdown."""
    # FIXME(mm, 2024-01-31): Cleaning up everything concurrently like this is prone to
    # race conditions, e.g if we clean up hardware before we clean up the background
    # task that's blinking the front button light (which uses the hardware).
    # Startup and shutdown should be in FILO order.
    shutdown_results = await asyncio.gather(
        fbl_clean_up(app.state),
        clean_up_hardware(app.state),
        clean_up_persistence(app.state),
        clean_up_task_runner(app.state),
        clean_up_notification_client(app.state),
        return_exceptions=True,
    )

    shutdown_errors = [r for r in shutdown_results if isinstance(r, BaseException)]

    for e in shutdown_errors:
        log.warning("Error during shutdown", exc_info=e)


app = FastAPI(
    title="Opentrons HTTP API Spec",
    description=(
        "This OpenAPI spec describes the HTTP API of the Opentrons "
        "robots. It may be retrieved from a robot on port 31950 at "
        "/openapi. Some schemas used in requests and responses use "
        "the `x-patternProperties` key to mean the JSON Schema "
        "`patternProperties` behavior."
    ),
    version=__version__,
    exception_handlers=exception_handlers,
    # Disable documentation hosting via Swagger UI, normally at /docs.
    # We instead focus on the docs hosted by ReDoc, at /redoc.
    docs_url=None,
    lifespan=lifespan,
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
