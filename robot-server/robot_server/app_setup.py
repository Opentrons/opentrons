"""Main FastAPI application."""

import contextlib
from pathlib import Path
from typing import AsyncGenerator, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html
from fastapi.responses import HTMLResponse

from opentrons import __version__
from server_utils.audit import constants as log_constants
from server_utils.audit.audit_server import (
    SubmitAuditLogMessageData,
)
from server_utils.audit.fastapi import (
    audit_logger_middleware,
    build_audit_client,
    get_audit_client,
    install_audit_client,
)
from server_utils.auth.resource_server.fastapi import (
    build_authentication_checker,
    get_authentication_checker,
    install_authentication_checker,
)
from server_utils.fastapi_utils.app_state import AppState
from server_utils.fastapi_utils.server_timing_middleware import server_timing_middleware

from .access_control.settings.store import get_access_control_setting_store
from .errors.exception_handlers import exception_handlers
from .hardware import (
    FrontButtonLightBlinker,
    clean_up_hardware,
    start_initializing_hardware,
)
from .persistence.fastapi_dependencies import (
    clean_up_persistence,
    get_active_persistence_directory,
    get_sql_engine,
    initialize_images_directory,
    start_initializing_persistence,
)
from .protocols.dependencies import (
    get_protocol_directory,
    get_protocol_reader,
    get_protocol_store,
)
from .router import router
from .runs.dependencies import (
    get_run_store,
    mark_light_control_startup_finished,
    set_up_run_process_pyro_provider,
    start_light_control_task,
)
from .service.logging import initialize_logging
from .service.notifications import (
    initialize_pe_publisher_notifier,
    set_up_notification_client,
)
from .service.pyro_utils.pyro_resource import start_initializing_pyro_resource
from .service.task_runner import set_up_task_runner
from .settings import RobotServerSettings, get_settings

_REDOC_CDN_URL = "https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js"


@contextlib.asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """The server's startup and shutdown logic.

    Entering this context manager sets up our custom global objects
    so they'll be ready when we process requests.

    Exiting this context manager cleans everything up.
    """
    async with contextlib.AsyncExitStack() as exit_stack:
        settings = get_settings()
        persistence_directory = _get_persistence_directory(settings)

        initialize_logging()

        await exit_stack.enter_async_context(set_up_task_runner(app.state))

        blinker = FrontButtonLightBlinker()
        exit_stack.push_async_callback(blinker.clean_up)
        # Always make an empty Robot Server Pyro Resource, and populate if appropriate
        pyro_task = start_initializing_pyro_resource(app_state=app.state)

        start_initializing_hardware(
            app_state=app.state,
            pyro_task=pyro_task,
            callbacks=[
                # Flex light control:
                (start_light_control_task, True),
                (mark_light_control_startup_finished, False),
                # OT-2 light control:
                (
                    lambda _app_state, hw_api, _hw_store: blinker.start_blinking(
                        hw_api
                    ),
                    True,
                ),
                (
                    lambda _app_state,
                    _hw_api,
                    _hw_store: blinker.mark_hardware_init_complete(),
                    False,
                ),
            ],
        )
        exit_stack.push_async_callback(clean_up_hardware, app.state)

        await initialize_images_directory(
            app_state=app.state, images_directory_root=settings.images_directory
        )

        start_initializing_persistence(
            app_state=app.state,
            persistence_directory_root=persistence_directory,
            done_callbacks=[_report_unsigned_runs],
        )
        exit_stack.push_async_callback(clean_up_persistence, app.state)

        authentication_checker = await exit_stack.enter_async_context(
            build_authentication_checker(
                auth_server_uds=settings.auth_server_uds,
                auth_server_url=settings.auth_server_url,
            )
        )
        install_authentication_checker(app.state, authentication_checker)

        audit_client = await exit_stack.enter_async_context(
            build_audit_client(
                audit_server_uds=settings.audit_server_uds,
                audit_server_url=settings.audit_server_url,
            )
        )
        install_audit_client(app.state, audit_client)

        exit_stack.enter_context(set_up_notification_client(app.state))
        initialize_pe_publisher_notifier(app.state)

        # Start the run process pyro provider so a process is ready when a run starts
        await exit_stack.enter_async_context(
            set_up_run_process_pyro_provider(
                app.state, await authentication_checker.access_control_status()
            )
        )

        yield  # Start handling HTTP requests.


app = FastAPI(
    title="Opentrons HTTP API Spec",
    description=(
        "This OpenAPI spec describes the HTTP API for Opentrons "
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
    # redoc_url is replaced by our own /redoc router, below.
    redoc_url=None,
    lifespan=_lifespan,
)


# This is a workaround for a broken /redoc page in versions of FastAPI <0.115.3.
# The page loads Redoc from a CDN, and the problem is that the default CDN URL
# uses a fragile version tag.
# https://github.com/Redocly/redoc/issues/2743
# https://github.com/fastapi/fastapi/pull/9700
@app.get("/redoc", include_in_schema=False)
async def redoc_html() -> HTMLResponse:  # noqa: D103
    if app.openapi_url is None:
        raise RuntimeError(
            "Couldn't get OpenAPI URL from FastAPI."
            + " This is probably some kind of misconfiguration."
        )
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=app.title,
        redoc_js_url=_REDOC_CDN_URL,
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=("*"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(audit_logger_middleware)
app.middleware("http")(server_timing_middleware())

# main router
router.install_on_app(app)


def _get_persistence_directory(settings: RobotServerSettings) -> Optional[Path]:
    if settings.persistence_directory == "automatically_make_temporary":
        return None
    else:
        return settings.persistence_directory


async def _report_unsigned_runs(
    app_state: AppState,
) -> None:
    """If access control enabled and run signoff required, log any unsigned runs."""
    access_control_status = await get_authentication_checker(
        app_state
    ).access_control_status()
    if not access_control_status:
        return

    sql_engine = await get_sql_engine(app_state)
    access_control_settings_store = await get_access_control_setting_store(sql_engine)
    if not access_control_settings_store.get_all().requireSignoffForProtocolLog:
        return

    run_store = await get_run_store(app_state, sql_engine)
    unsigned_runs = [run for run in run_store.get_all() if run.signed_by is None]

    if not unsigned_runs:
        return

    persistence_directory = await get_active_persistence_directory(app_state)
    protocol_directory = await get_protocol_directory(app_state, persistence_directory)
    protocol_store = await get_protocol_store(
        app_state, sql_engine, protocol_directory, get_protocol_reader()
    )

    message = f"{len(unsigned_runs)} unsigned runs found in run history:"
    for unsigned_run in unsigned_runs:
        if unsigned_run.protocol_id is None:
            message += f" run with no protocol created at {unsigned_run.created_at};"
        else:
            protocol = protocol_store.get(protocol_id=unsigned_run.protocol_id)
            message += (
                f" run for {protocol.source.main_file.name} ({protocol.source.content_hash})"
                f" created at {unsigned_run.created_at};"
            )

    audit_client = get_audit_client(app_state)
    await audit_client.submit_log_message(
        SubmitAuditLogMessageData(
            action=log_constants.ACTION_UNSIGNED_RUNS_WARNING,
            accountName=log_constants.ACCOUNT_NAME_SYSTEM,
            legalName=log_constants.LEGAL_NAME_SYSTEM,
            message=message,
            reason=None,
        )
    )
