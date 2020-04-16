import logging

from opentrons import __version__
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.responses import Response, JSONResponse
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from .logging import initialize_logging
from .models import V1BasicResponse
from .errors import V1HandlerError, \
    transform_http_exception_to_json_api_errors, \
    transform_validation_error_to_json_api_errors, consolidate_fastapi_response
from .dependencies import get_rpc_server
from robot_server import API_VERSION

from .routers import item, routes

# Tag applied to legacy api endpoints
V1_TAG = "v1"

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


app.include_router(router=routes,
                   tags=[V1_TAG],
                   responses={
                       HTTP_422_UNPROCESSABLE_ENTITY: {
                           "model": V1BasicResponse
                       }
                   })

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
    """App shutdown handler"""
    s = await get_rpc_server()
    await s.on_shutdown()


RESPONSE_HEADERS = {
    'X-Opentrons-Media-Type': f'opentrons.robot-server.{API_VERSION}'
}


@app.middleware("http")
async def response_headers(request: Request, call_next) -> Response:
    """Middleware to add various response headers."""
    response: Response = await call_next(request)
    response.headers.update(RESPONSE_HEADERS)
    return response


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
    """Custom handling of fastapi request validation errors"""
    log.error(f'{request.method} {request.url.path} : {str(exception)}')

    if route_has_tag(request, V1_TAG):
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

    if route_has_tag(request, V1_TAG):
        response = V1BasicResponse(message=exception.detail).dict()
    else:
        response = transform_http_exception_to_json_api_errors(
            exception
        ).dict(exclude_unset=True)

    return JSONResponse(
        status_code=exception.status_code,
        content=response,
    )


def route_has_tag(request: Request, tag: str) -> bool:
    """Check if router handling the request has the tag."""
    router = request.scope.get('router')
    if router:
        for route in router.routes:
            if route.endpoint == request.scope.get('endpoint'):
                return tag in route.tags

    return False
