"""Main FastAPI application."""
import contextlib
from typing import AsyncGenerator, Optional
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@contextlib.asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """The server's startup and shutdown logic.

    Entering this context manager sets up our custom global objects
    so they'll be ready when we process requests.

    Exiting this context manager cleans everything up.
    """
    async with contextlib.AsyncExitStack() as exit_stack:
        settings = get_settings()

        if settings.persistence_directory == "automatically_make_temporary":
            persistence_directory: Optional[Path] = None
        else:
            persistence_directory = settings.persistence_directory

        initialize_logging()

        initialize_task_runner(app_state=app.state)
        exit_stack.push_async_callback(clean_up_task_runner, app.state)

        fbl_init(app_state=app.state)
        exit_stack.push_async_callback(fbl_clean_up, app.state)

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
        exit_stack.push_async_callback(clean_up_hardware, app.state)

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
        exit_stack.push_async_callback(clean_up_persistence, app.state)

        initialize_notifications(app.state)
        exit_stack.callback(clean_up_notification_client, app.state)

        yield  # Start handling HTTP requests.


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
    # Disable documentation hosting via Swagger UI, normally at /docs.
    # We instead focus on the docs hosted by ReDoc, at /redoc.
    docs_url=None,
    lifespan=_lifespan,
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
