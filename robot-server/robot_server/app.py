"""Main FastAPI application."""
import logging

from opentrons import __version__
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response, JSONResponse
from starlette.requests import Request
from starlette.middleware.base import RequestResponseEndpoint

from .service.dependencies import (
    check_version_header,
    get_rpc_server,
    get_protocol_manager,
    get_hardware_wrapper,
    get_session_manager,
)

from .errors import exception_handlers
from .router import router
from .service import initialize_logging
from .service.errors import BaseRobotServerError
from .service.json_api.errors import ErrorResponse
from . import constants

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
app.include_router(
    router=router,
    dependencies=[Depends(check_version_header)],
)


@app.on_event("startup")
async def on_startup() -> None:
    """Handle app startup."""
    initialize_logging()
    # Initialize api
    (await get_hardware_wrapper()).async_initialize()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Handle app shutdown."""
    s = await get_rpc_server()
    await s.on_shutdown()
    # Remove all sessions
    await (await get_session_manager()).remove_all()
    # Remove all uploaded protocols
    (await get_protocol_manager()).remove_all()


@app.middleware("http")
async def api_version_response_header(
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


# TODO(mc, 2021-05-10): remove this when we no longer raise `BaseRobotServerError`
@app.exception_handler(BaseRobotServerError)
async def robot_server_exception_handler(
    request: Request,
    exc: BaseRobotServerError,
) -> JSONResponse:
    """Catch robot server exceptions."""
    if not exc.error.status:
        exc.error.status = str(exc.status_code)
    log.error(f"RobotServerError: {exc.error}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(errors=[exc.error]).dict(
            exclude_unset=True, exclude_none=True
        ),
    )


def route_has_tag(request: Request, tag: str) -> bool:
    """Check if router handling the request has the tag."""
    router = request.scope.get("router")
    if router:
        for route in router.routes:
            if route.endpoint == request.scope.get("endpoint"):
                return tag in route.tags

    return False
