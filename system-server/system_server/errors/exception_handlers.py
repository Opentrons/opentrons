"""App exception handlers."""
import logging
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from traceback import format_exception
from typing import Any, Callable, Coroutine, Dict, Type, Union

from .error_responses import ApiError

log = logging.getLogger(__name__)


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
    )


async def handle_unexpected_error(request: Request, error: Exception) -> JSONResponse:
    """Map an unhandled Exception to an API response."""
    log.error(f"Error: {error}")
    stacktrace = "".join(
        format_exception(type(error), error, error.__traceback__, limit=-5)
    ).strip()

    response = ApiError(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"stacktrace": stacktrace},
    )

    return await handle_api_error(
        request,
        response,
    )


exception_handlers: Dict[
    Union[int, Type[Exception]],
    Callable[[Request, Any], Coroutine[Any, Any, Response]],
] = {
    Exception: handle_unexpected_error,
}
