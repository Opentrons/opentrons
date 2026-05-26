"""App exception handlers."""

from logging import getLogger
from typing import Any, Callable, Coroutine, Dict, Optional, Sequence, Type, Union

from fastapi import Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from starlette.exceptions import HTTPException as StarletteHTTPException

from opentrons_shared_data.errors import EnumeratedError, ErrorCodes, PythonException
from opentrons_shared_data.errors.exceptions import (
    FirmwareUpdateRequiredError as HWFirmwareUpdateRequired,
)
from server_utils.auth.resource_server.authorization_checker import (
    MissingUserNotesError,
)
from server_utils.auth.resource_server.fastapi import (
    AuthorizationError,
    handle_authorization_error,
)
from server_utils.fastapi_utils.documented_interaction import USER_NOTES_HEADER

from .error_responses import (
    ApiError,
    BaseErrorBody,
    ErrorSource,
    LegacyErrorResponse,
    MultiErrorResponse,
)
from .global_errors import (
    BadRequest,
    FirmwareUpdateRequired,
    InvalidRequest,
    UnexpectedError,
)
from robot_server.constants import V1_TAG
from robot_server.versioning import (
    API_VERSION,
    API_VERSION_HEADER,
    MIN_API_VERSION,
    MIN_API_VERSION_HEADER,
)

log = getLogger(__name__)


def _route_is_legacy(request: Request) -> bool:
    """Check if router handling the request is a legacy v1 endpoint."""
    router = request.scope.get("router")
    endpoint = request.scope.get("endpoint")

    if router:
        for route in router.routes:
            if isinstance(route, APIRoute) and route.endpoint == endpoint:
                return V1_TAG in route.tags

    return False


def _format_validation_source(
    parts: Sequence[Union[str, int]],
) -> Optional[ErrorSource]:
    """Format a validation location from FastAPI into an ErrorSource."""
    try:
        if parts[0] == "body":
            # ["body", "field"] > { "pointer": "/field" }
            return ErrorSource(pointer=f"/{'/'.join(str(p) for p in parts[1::])}")
        elif parts[0] == "query":
            # ["query", "param"] > { parameter: "param" }
            return ErrorSource(parameter=str(parts[1]))
        elif parts[0] == "header":
            # ["header", "name"] > { header: "name" }
            return ErrorSource(header=str(parts[1]))
    except KeyError:
        pass

    return None


async def handle_api_error(request: Request, error: ApiError) -> JSONResponse:
    """Map an API error to its response."""
    log.warning(
        f"Error response: {error.status_code} - "
        f"{error.content.get('id', 'LegacyError')} - "
        f"{error.content.get('detail', error.content.get('message', ''))}"
    )

    return JSONResponse(
        status_code=error.status_code,
        content=error.content,
        headers={
            MIN_API_VERSION_HEADER: f"{MIN_API_VERSION}",
            API_VERSION_HEADER: f"{API_VERSION}",
        },
    )


async def handle_framework_error(
    request: Request,
    error: StarletteHTTPException,
) -> JSONResponse:
    """Map an HTTP exception from the framework to an API response."""
    if _route_is_legacy(request):
        response: BaseErrorBody = LegacyErrorResponse(
            message=error.detail, errorCode=ErrorCodes.GENERAL_ERROR.value.code
        )
    else:
        response = BadRequest(detail=error.detail)

    return await handle_api_error(request, response.as_error(error.status_code))


async def handle_validation_error(
    request: Request,
    error: RequestValidationError,
) -> JSONResponse:
    """Map a validation error from the framework to an API response."""
    validation_errors = error.errors()

    if _route_is_legacy(request):
        message = "; ".join(
            f"{'.'.join([str(v) for v in val_error['loc']])}: {val_error['msg']}"
            for val_error in validation_errors
        )
        response: BaseErrorBody = LegacyErrorResponse(
            message=message, errorCode=ErrorCodes.GENERAL_ERROR.value.code
        )
    else:
        response = MultiErrorResponse(
            errors=[
                InvalidRequest(
                    detail=val_error["msg"],
                    source=_format_validation_source(val_error["loc"]),
                )
                for val_error in validation_errors
            ]
        )

    return await handle_api_error(
        request,
        response.as_error(status.HTTP_422_UNPROCESSABLE_ENTITY),
    )


async def handle_unexpected_error(
    request: Request, error: BaseException
) -> JSONResponse:
    """Map an unhandled Exception to an API response."""
    if isinstance(error, EnumeratedError):
        enumerated: EnumeratedError = error
    else:
        enumerated = PythonException(error)

    if _route_is_legacy(request):
        response: BaseErrorBody = LegacyErrorResponse.from_exc(enumerated)
    else:
        response = UnexpectedError.from_exc(enumerated)

    return await handle_api_error(
        request,
        response.as_error(status.HTTP_500_INTERNAL_SERVER_ERROR),
    )


async def handle_firmware_upgrade_required_error(
    request: Request, error: HWFirmwareUpdateRequired
) -> JSONResponse:
    """Map a FirmwareUpdateRequired error from hardware to an API response."""
    if _route_is_legacy(request):
        response: BaseErrorBody = LegacyErrorResponse.from_exc(error)
    else:
        response = FirmwareUpdateRequired.from_exc(error)
    return await handle_api_error(
        request, response.as_error(status.HTTP_503_SERVICE_UNAVAILABLE)
    )


# Normalize to async to appease FastAPI's `exception_handlers` arg.
async def _handle_authorization_error_async(
    request: Request, error: AuthorizationError
) -> Response:
    return handle_authorization_error(request, error)


async def handle_missing_user_notes(
    request: Request, error: MissingUserNotesError
) -> JSONResponse:
    """Map missing audit notes to a 422 validation-style response."""
    response = InvalidRequest(
        detail=str(error),
        source=ErrorSource(header=USER_NOTES_HEADER),
    )
    return await handle_api_error(
        request, response.as_error(status.HTTP_422_UNPROCESSABLE_ENTITY)
    )


exception_handlers: Dict[
    Union[int, Type[Exception]],
    Callable[[Request, Any], Coroutine[Any, Any, Response]],
] = {
    ApiError: handle_api_error,
    StarletteHTTPException: handle_framework_error,
    RequestValidationError: handle_validation_error,
    HWFirmwareUpdateRequired: handle_firmware_upgrade_required_error,
    AuthorizationError: _handle_authorization_error_async,
    MissingUserNotesError: handle_missing_user_notes,
    Exception: handle_unexpected_error,
}
