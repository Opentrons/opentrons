"""Main FastAPI application."""


from functools import partial
import logging

from opentrons import __version__
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response
from starlette.requests import Request
from starlette.middleware.base import RequestResponseEndpoint

from notify_server.clients import publisher as notify_server_publisher
from notify_server.settings import Settings as NotifyServerSettings

from .service.dependencies import (
    get_rpc_server,
    get_protocol_manager,
    get_session_manager,
)

from .errors import exception_handlers
from .router import router
from .service import initialize_logging
from . import lifetime_dependencies
from . import constants
from . import slow_initializing
from . import hardware_initialization

# Our global ASGI app object. Our ASGI server (currently Uvicorn) finds this and
# sends web requests to it.
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
)

# exception handlers
# TODO(mc, 2021-05-10): after upgrade to FastAPI > 0.61.2, we can pass these
# to FastAPI's `exception_handlers` arg instead. Current version has bug, see:
# https://github.com/tiangolo/fastapi/pull/1924
for exc_cls, handler in exception_handlers.items():
    app.add_exception_handler(exc_cls, handler)

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

@app.middleware("http")
async def _api_version_response_header(
    request: Request,
    call_next: RequestResponseEndpoint,
) -> Response:
    """Attach Opentrons-Version headers to responses."""
    # Attach the version the request state. Optional dependency
    #  check_version_header will override this value if check passes.
    request.state.api_version = constants.API_VERSION

    response: Response = await call_next(request)

    # Put the api version in the response header
    response.headers[constants.API_VERSION_HEADER] = str(request.state.api_version)
    response.headers[constants.MIN_API_VERSION_HEADER] = str(constants.MIN_API_VERSION)
    return response

app.on_event("startup")(initialize_logging)
lifetime_dependencies.install_startup_shutdown_handlers(app)

__all__ = ["app"]
