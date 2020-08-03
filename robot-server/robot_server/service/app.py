import logging
import traceback

from opentrons import __version__
from fastapi import FastAPI, APIRouter, Depends
from fastapi.exceptions import RequestValidationError
from starlette.responses import Response, JSONResponse
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from .logging import initialize_logging
from robot_server.service.legacy.models import V1BasicResponse
from .errors import V1HandlerError, \
    transform_http_exception_to_json_api_errors, \
    transform_validation_error_to_json_api_errors, \
    consolidate_fastapi_response, RobotServerError, ErrorResponse, \
    build_unhandled_exception_response
from .dependencies import get_rpc_server, get_protocol_manager, api_wrapper, \
        verify_hardware, get_session_manager
from robot_server import constants
from robot_server.service.legacy.routers import legacy_routes
from robot_server.service.access.router import router as access_router
from robot_server.service.session.router import router as session_router
from robot_server.service.labware.router import router as labware_router
from robot_server.service.protocol.router import router as protocol_router


log = logging.getLogger(__name__)


app = FastAPI(
    title="Opentrons OT-2 HTTP API Spec",
    description="This OpenAPI spec describes the HTTP API of the Opentrons "
                "OT-2. It may be retrieved from a robot on port 31950 at "
                "/openapi. Some schemas used in requests and responses use "
                "the `x-patternProperties` key to mean the JSON Schema "
                "`patternProperties` behavior.",
    version=__version__,
)

# Legacy routes
app.include_router(router=legacy_routes,
                   tags=[constants.V1_TAG],
                   responses={
                       HTTP_422_UNPROCESSABLE_ENTITY: {
                           "model": V1BasicResponse
                       }
                   })

# New v2 routes
routes = APIRouter()
routes.include_router(router=session_router,
                      tags=["Session Management"],
                      dependencies=[Depends(verify_hardware)])
routes.include_router(router=access_router,
                      tags=["Access Control"])
routes.include_router(router=labware_router,
                      tags=["Labware Calibration Management"])
routes.include_router(router=protocol_router,
                      tags=["Protocol Management"])

app.include_router(router=routes,
                   responses={
                       HTTP_422_UNPROCESSABLE_ENTITY: {
                           "model": ErrorResponse
                       }
                   })


@app.on_event("startup")
async def on_startup():
    """App startup handler"""
    initialize_logging()
    # Initialize api
    api_wrapper.async_initialize()


@app.on_event("shutdown")
async def on_shutdown():
    """App shutdown handler"""
    s = await get_rpc_server()
    await s.on_shutdown()
    # Remove all sessions
    await get_session_manager().remove_all()
    # Remove all uploaded protocols
    get_protocol_manager().remove_all()


@app.middleware("http")
async def api_version_check(request: Request, call_next) -> Response:
    """Middleware to perform version check."""
    try:
        # Get the maximum version accepted by client
        api_version = int(request.headers.get(constants.API_VERSION_HEADER,
                                              constants.API_VERSION))
        # We use the server version if api_version is too big
        api_version = min(constants.API_VERSION, api_version)
    except ValueError:
        # Wasn't an integer, just use server version.
        api_version = constants.API_VERSION
    # Attach the api version to request's state dict.
    request.state.api_version = api_version

    response: Response = await call_next(request)
    # Put the api version in the response header
    response.headers[constants.API_VERSION_HEADER] = str(api_version)
    return response


@app.exception_handler(RobotServerError)
async def robot_server_exception_handler(request: Request,
                                         exc: RobotServerError) \
        -> JSONResponse:
    """Catch robot server exceptions"""
    if not exc.error.status:
        exc.error.status = str(exc.status_code)
    log.error(f"RobotServerError: {exc.error}")
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(errors=[exc.error]).dict(exclude_unset=True)
    )


@app.exception_handler(V1HandlerError)
async def v1_exception_handler(request: Request, exc: V1HandlerError) \
        -> JSONResponse:
    """Catch legacy errors"""
    log.error(f"V1HandlerError: {exc.status_code}: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content=V1BasicResponse(message=exc.message).dict()
    )


@app.exception_handler(RequestValidationError)
async def custom_request_validation_exception_handler(
    request: Request,
    exception: RequestValidationError
) -> JSONResponse:
    """Custom handling of fastapi request validation errors"""
    log.error(f'{request.method} {request.url.path} : {str(exception)}')

    if route_has_tag(request, constants.V1_TAG):
        response = V1BasicResponse(
            message=consolidate_fastapi_response(exception.errors())
        ).dict()
    else:
        response = transform_validation_error_to_json_api_errors(
            HTTP_422_UNPROCESSABLE_ENTITY, exception
        ).dict(exclude_unset=True)

    return JSONResponse(
        status_code=HTTP_422_UNPROCESSABLE_ENTITY,
        content=response
    )


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(
    request: Request,
    exception: StarletteHTTPException
) -> JSONResponse:
    """Custom handling of http exception"""
    log.error(f'{request.method} {request.url.path} : '
              f'{exception.status_code}, {exception.detail}')

    if route_has_tag(request, constants.V1_TAG):
        response = V1BasicResponse(message=exception.detail).dict()
    else:
        response = transform_http_exception_to_json_api_errors(
            exception
        ).dict(exclude_unset=True)

    return JSONResponse(
        status_code=exception.status_code,
        content=response,
    )


@app.exception_handler(Exception)
async def unexpected_exception_handler(request: Request, exc: Exception) \
          -> JSONResponse:
    """ Log unhandled errors (reraise always)"""
    log.error(f'Unhandled exception: {traceback.format_exc()}')
    return JSONResponse(
        status_code=500,
        content=build_unhandled_exception_response(exc).dict(
            exclude_unset=True),
    )


def route_has_tag(request: Request, tag: str) -> bool:
    """Check if router handling the request has the tag."""
    router = request.scope.get('router')
    if router:
        for route in router.routes:
            if route.endpoint == request.scope.get('endpoint'):
                return tag in route.tags

    return False
