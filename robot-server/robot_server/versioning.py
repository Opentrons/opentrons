"""HTTP API versioning logic, utilities, and dependencies."""
from fastapi import Header, Request, Response, status
from typing import Union
from typing_extensions import Literal, Final

from robot_server.errors import ErrorDetails

API_VERSION: Final[int] = 2
"""The current version of the HTTP API used by the server.

This value will be incremented any time the schema of a request or response
is changed. The value is separate from the overall application version.
"""

MIN_API_VERSION: Final[int] = 2
"""The minimum HTTP API version supported by the server.

Incrementing this value would be considered a breaking change to the overall
application, and would result in a major version bump of the software.
"""

API_VERSION_HEADER: Final[str] = "Opentrons-Version"
"""Custom header to specify which HTTP API version is being requested or served.

Mandatory in requests and response. Can be used by the server and clients to
negotiate and migrate requests and responses to a version both parties understand.
"""

MIN_API_VERSION_HEADER: Final[str] = "Opentrons-Min-Version"
"""Header to specify the server's minumum supported HTTP API version.

Mandatory in all responses, not used in requests.
"""

LATEST_API_VERSION_HEADER_VALUE: Literal["*"] = "*"
"""Version head value meaning 'give me the latest avilable version'"""


class OutdatedApiVersionResponse(ErrorDetails):
    """An error returned when you request an outdated HTTP API version."""

    id: Literal["OutdatedAPIVersion"] = "OutdatedAPIVersion"
    title: str = "Requested HTTP API version no longer supported"


async def check_version_header(
    request: Request,
    response: Response,
    opentrons_version: Union[int, Literal["*"]] = Header(
        ...,
        description=(
            "The HTTP API version to use for this request. Must be "
            f"'{MIN_API_VERSION}' or higher. To use the latest "
            f"version unconditionally, specify '{LATEST_API_VERSION_HEADER_VALUE}'"
        ),
    ),
) -> None:
    """Get the Opentrons-Version headers and set them in state and response headers.

    This function hooks into FastAPI via `fastapi.depends`, and should be used
    as a router or application level dependency.
    """
    if opentrons_version == LATEST_API_VERSION_HEADER_VALUE:
        api_version = API_VERSION
    else:
        api_version = min(API_VERSION, int(opentrons_version))

    if api_version < MIN_API_VERSION:
        error_detail = (
            f"The requested API version '{api_version}' is not supported."
            f" '{API_VERSION_HEADER}' must be at least '{MIN_API_VERSION}'."
            f" Please upgrade your Opentrons App or other HTTP API client."
        )
        raise OutdatedApiVersionResponse(detail=error_detail).as_error(
            status.HTTP_400_BAD_REQUEST
        )

    request.state.api_version = api_version
    response.headers[API_VERSION_HEADER] = f"{api_version}"
    response.headers[MIN_API_VERSION_HEADER] = f"{MIN_API_VERSION}"


async def set_version_response_headers(request: Request, response: Response) -> None:
    """Set Opentrons-Version headers on the response, without checking the request.

    This function hooks into FastAPI via `fastapi.depends`, and should be used
    as a router or application level dependency.
    """
    api_version = getattr(request.state, "api_version", API_VERSION)

    response.headers[API_VERSION_HEADER] = f"{api_version}"
    response.headers[MIN_API_VERSION_HEADER] = f"{MIN_API_VERSION}"
