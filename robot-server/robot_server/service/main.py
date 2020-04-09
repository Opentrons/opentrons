import logging
from opentrons import __version__
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from starlette.responses import JSONResponse
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from .logging import initialize_logging
from .routers import health, networking, control, settings, deck_calibration, \
    modules, pipettes, motors, camera, logs, rpc, item
from .models import V1BasicResponse
from .exceptions import V1HandlerError
from .dependencies import get_rpc_server
from typing import List, Dict, Any

log = logging.getLogger(__name__)


app = FastAPI(
    title="Opentrons OT-2 HTTP API Spec",
    description="This OpenAPI spec describes the HTTP API of the Opentrons "
                "OT-2. It may be retrieved from a robot on port 31950 at "
                "/openapi. Some schemas used in requests and responses use "
                "the `x-patternProperties` key to mean the JSON Schema "
                "`patternProperties` behavior.",
    version=__version__
)


app.include_router(router=health.router,
                   tags=["Health"])
app.include_router(router=networking.router,
                   tags=["Networking"])
app.include_router(router=control.router,
                   tags=["Control"])
app.include_router(router=settings.router,
                   tags=["Settings"])
app.include_router(router=deck_calibration.router,
                   tags=["Deck Calibration"])
app.include_router(router=modules.router,
                   tags=["Modules"])
app.include_router(router=pipettes.router,
                   tags=["Pipettes"])
app.include_router(router=motors.router,
                   tags=["Motors"])
app.include_router(router=camera.router,
                   tags=["Camera"])
app.include_router(router=logs.router,
                   tags=["Logs"])
app.include_router(router=rpc.router,
                   tags=["RPC"])
# TODO(isk: 3/18/20): this is an example route, remove item route and model
# once response work is implemented in new route handlers
app.include_router(router=item.router,
                   tags=["Item"])


@app.on_event("startup")
async def on_startup():
    """App startup handler"""
    initialize_logging()


@app.on_event("shutdown")
async def on_shutdown():
    """App shutfown handler"""
    s = await get_rpc_server()
    await s.on_shutdown()


@app.exception_handler(V1HandlerError)
async def v1_exception_handler(request: Request, exc: V1HandlerError):
    return JSONResponse(
        status_code=exc.status_code,
        content=V1BasicResponse(message=exc.message).dict()
    )


def consolidate_fastapi_response(
        all_exceptions: List[Dict[str, Any]]) -> str:
    """
    Consolidate the default fastAPI response so it can be returned as a string.
    Default schema of fastAPI exception response is:
    {
        'loc': ('body',
                '<outer_scope1>',
                '<outer_scope2>',
                '<inner_param>'),
        'msg': '<the_error_message>',
        'type': '<expected_type>'
    }
    In order to create a meaningful V1-style response, we consolidate the
    above response into a string of shape:
    '<outer_scope1>.<outer_scope2>.<inner_param>: <the_error_message>'
    """

    # Pick just the error message while discarding v2 response items
    def error_to_str(error: dict) -> str:
        err_node = ".".join(str(loc) for loc in error['loc'] if loc != 'body')
        res = ": ".join([err_node, error["msg"]])
        return res

    all_errs = ". ".join(error_to_str(exc) for exc in all_exceptions)
    return all_errs


@app.exception_handler(RequestValidationError)
async def custom_request_validation_exception_handler(
    request: Request,
    exception: RequestValidationError
) -> JSONResponse:
    """Custom handling of fastapi request validation errors"""
    log.error(f'{request.method} {request.url.path} : {str(exception)}')

    response = consolidate_fastapi_response(exception.errors())
    return JSONResponse(
        status_code=HTTP_422_UNPROCESSABLE_ENTITY,
        content=V1BasicResponse(message=response).dict(),
    )


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(
    request: Request,
    exception: StarletteHTTPException
) -> JSONResponse:
    """Custom handling of http exception"""
    log.error(f'{request.method} {request.url.path} : '
              f'{exception.status_code}, {exception.detail}')

    return JSONResponse(
        status_code=exception.status_code,
        content=V1BasicResponse(message=exception.detail).dict(),
    )
