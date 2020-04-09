from opentrons import __version__
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from starlette.responses import JSONResponse
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
# https://github.com/encode/starlette/blob/master/starlette/status.py
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from .routers import health, networking, control, settings, deck_calibration, \
    modules, pipettes, motors, camera, logs, rpc, item
from .models import V1BasicResponse
from .exceptions import V1HandlerError
from .dependencies import get_rpc_server
from typing import List, Dict, Any

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
                   tags=["health"])
app.include_router(router=networking.router,
                   tags=["networking"])
app.include_router(router=control.router,
                   tags=["control"])
app.include_router(router=settings.router,
                   tags=["settings"])
app.include_router(router=deck_calibration.router,
                   tags=["deckCalibration"])
app.include_router(router=modules.router,
                   tags=["modules"])
app.include_router(router=pipettes.router,
                   tags=["pipettes"])
app.include_router(router=motors.router,
                   tags=["motors"])
app.include_router(router=camera.router,
                   tags=["camera"])
app.include_router(router=logs.router,
                   tags=["logs"])
app.include_router(router=rpc.router,
                   tags=["rpc"])
# TODO(isk: 3/18/20): this is an example route, remove item route and model
# once response work is implemented in new route handlers
app.include_router(router=item.router,
                   tags=["item"])


@app.on_event("shutdown")
async def on_shutdown():
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
    return JSONResponse(
        status_code=exception.status_code,
        content=V1BasicResponse(message=exception.detail).dict(),
     )
