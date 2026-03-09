"""Add server performance metrics to HTTP responses.

This uses the standard Server-Timing response header, so the metrics will show up in
browser dev tools.
https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing
"""


import logging
import time
from typing import Awaitable, Callable

from fastapi import Request, Response


# These are inserted into the HTTP response header raw, so they should be short and
# avoid special characters.
#
# Chrome devtools uses the description as a label in the timing bar graph,
# adjacent to things like "Waiting for server response" and "Content download".
_METRIC_NAME = "opentrons-asgi"
_METRIC_DESC = "Time in Python (roughly)"


_log = logging.getLogger(__name__)


_CallNextType = Callable[[Request], Awaitable[Response]]


def server_timing_middleware(
    clock: Callable[[], float] = time.perf_counter
) -> Callable[[Request, _CallNextType], Awaitable[Response]]:
    """Return a function that can be used as a FastAPI middleware.

    Usage example:

        app = fastapi.FastAPI()
        ...

        app.middleware("http")(server_timing_middleware())


    The `clock` param should return the current time in seconds.
    """

    async def middleware_function(
        request: Request, call_next: _CallNextType
    ) -> Response:
        time_before = clock()
        response = await call_next(request)
        time_after = clock()
        duration_ms = round((time_after - time_before) * 1000)

        _log.debug(f"{request.url}: {duration_ms} ms")

        response.headers["Server-Timing"] = _update_server_timing_header(
            preexisting_header_value=response.headers.get("Server-Timing", None),
            name=_METRIC_NAME,
            desc=_METRIC_DESC,
            dur=duration_ms,
        )

        return response

    return middleware_function


def _update_server_timing_header(
    preexisting_header_value: str | None, name: str, dur: float, desc: str
) -> str:
    new_metric = f'{name};dur={dur};desc="{desc}"'
    if preexisting_header_value is None:
        return new_metric
    else:
        return f"{preexisting_header_value},{new_metric}"
