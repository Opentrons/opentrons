from opentrons import __version__
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from starlette.responses import JSONResponse
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
# https://github.com/encode/starlette/blob/master/starlette/status.py
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from .routers import health, networking, control, settings, deck_calibration, \
    modules, pipettes, motors, camera, item
from .models.json_api.errors import \
    transform_validation_error_to_json_api_errors, \
    transform_http_exception_to_json_api_errors
from .models import V1BasicResponse
from .exceptions import V1HandlerError


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
# TODO(isk: 3/18/20): this is an example route, remove item route and model
# once response work is implemented in new route handlers
app.include_router(router=item.router,
                   tags=["item"])


@app.exception_handler(V1HandlerError)
async def v1_exception_handler(request: Request, exc: V1HandlerError):
    return JSONResponse(
        status_code=exc.status_code,
        content=V1BasicResponse(message=exc.message).dict()
    )


@app.exception_handler(RequestValidationError)
async def custom_request_validation_exception_handler(
    request: Request,
    exception: RequestValidationError
) -> JSONResponse:
    errors = transform_validation_error_to_json_api_errors(
        HTTP_422_UNPROCESSABLE_ENTITY, exception
    ).dict(exclude_unset=True)
    return JSONResponse(
        status_code=HTTP_422_UNPROCESSABLE_ENTITY,
        content=errors,
     )


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(
    request: Request,
    exception: StarletteHTTPException
) -> JSONResponse:
    errors = transform_http_exception_to_json_api_errors(
        exception
    ).dict(exclude_unset=True)
    return JSONResponse(
        status_code=exception.status_code,
        content=errors,
     )
