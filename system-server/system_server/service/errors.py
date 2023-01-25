"""This file defines base error types for the system server."""
from dataclasses import dataclass, asdict
from enum import Enum
from typing import Any, Dict, Optional
from starlette import status as status_codes

# To reduce the duplication of code between these two servers, we import the
# robot server's error data models as a base.
from robot_server.errors import ApiError, ErrorSource, ErrorDetails, ErrorBody  # type: ignore[import]
from robot_server.service.json_api import ResourceLinks  # type: ignore[import]


@dataclass(frozen=True)
class ErrorCreateDef:
    """Dataclass template for errors."""

    status_code: int
    title: str
    format_string: str


class ErrorDef(ErrorCreateDef, Enum):
    """An enumeration of ErrorCreateDef Error definitions for use by RobotServerError."""

    def __init__(self, e: Any) -> None:
        super().__init__(**(asdict(e)))


class SystemServerError(ApiError):  # type: ignore[misc]
    """A BaseSystemServerError that uses an ErrorDef enum.

    .. deprecated::
        Use `robot_server.errors.ErrorDetails(...).as_error(status_code)` instead.
    """

    def __init__(
        self,
        definition: ErrorCreateDef,
        error_id: str = "UncategorizedError",
        links: Optional[ResourceLinks] = None,
        source: Optional[ErrorSource] = None,
        meta: Optional[Dict[str, Any]] = None,
        *fmt_args: object,
        **fmt_kw_args: object
    ) -> None:
        """Constructor.

        :param definition: The ErrorDef enum defining error
        :param error_id: optional error id
        :param links: optional links
        :param meta: optional metadata about error
        :param fmt_args: format_string args
        :param fmt_kw_args: format_string kw_args
        """
        content = ErrorBody(
            errors=(
                ErrorDetails(
                    id=error_id,
                    title=definition.title,
                    detail=definition.format_string.format(*fmt_args, **fmt_kw_args),
                    source=source,
                    meta=meta,
                ),
            ),
            links=links,
        ).dict(exclude_none=True)

        super().__init__(
            status_code=definition.status_code,
            content=content,
        )


class CommonErrorDef(ErrorDef):
    """Generic common defined errors."""

    INTERNAL_SERVER_ERROR = ErrorCreateDef(
        status_code=status_codes.HTTP_500_INTERNAL_SERVER_ERROR,
        title="Internal Server Error",
        format_string="{error}",
    )
    NOT_IMPLEMENTED = ErrorCreateDef(
        status_code=status_codes.HTTP_501_NOT_IMPLEMENTED,
        title="Not implemented",
        format_string="Method not implemented. {error}",
    )
    RESOURCE_NOT_FOUND = ErrorCreateDef(
        status_code=status_codes.HTTP_404_NOT_FOUND,
        title="Resource Not Found",
        format_string="Resource type '{resource}' with id '{id}' was not found",
    )
    ACTION_FORBIDDEN = ErrorCreateDef(
        status_code=status_codes.HTTP_403_FORBIDDEN,
        title="Action Forbidden",
        format_string="{reason}",
    )
    RESOURCE_ALREADY_EXISTS = ErrorCreateDef(
        status_code=status_codes.HTTP_403_FORBIDDEN,
        title="Resource Exists",
        format_string="A '{resource}' with id '{id}' already exists",
    )
