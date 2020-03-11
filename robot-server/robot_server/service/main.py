from opentrons import __version__
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
# https://github.com/encode/starlette/blob/master/starlette/status.py
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from .routers import health, networking, control, settings, deck_calibration, item
from .models.json_api.errors import ErrorResponse, transform_to_json_api_errors

app = FastAPI(
    title="Opentrons OT-2 HTTP API Spec",
    description="This OpenAPI spec describes the HTTP API of the Opentrons "
                "OT-2. It may be retrieved from a robot on port 31950 at "
                "/openapi. Some schemas used in requests and responses use "
                "the `x-patternProperties` key to mean the JSON Schema "
                "`patternProperties` behavior.",
    version=__version__
)

@app.exception_handler(RequestValidationError)
async def custom_request_validation_exception_handler(request, exception) -> JSONResponse:
    errors = transform_to_json_api_errors(HTTP_422_UNPROCESSABLE_ENTITY, exception)
    return JSONResponse(
        status_code=HTTP_422_UNPROCESSABLE_ENTITY,
        content=errors,
     )

@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request, exception) -> JSONResponse:
    errors = transform_to_json_api_errors(exception.status_code, exception)
    return JSONResponse(
        status_code=exception.status_code,
        content=errors,
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
app.include_router(router=item.router,
                   tags=["item"])
