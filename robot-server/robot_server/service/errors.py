# TODO(mc, 2021-05-10): delete this file; these models have been moved to
# robot_server/errors/error_responses.py and robot_server/errors/global_errors.py
from dataclasses import dataclass, asdict
from enum import Enum
from typing import Dict, Optional
from starlette import status as status_codes

from robot_server.service.json_api.errors import Error, ErrorSource, ResourceLinks


class BaseRobotServerError(Exception):
    def __init__(self, status_code: int, error: Error):
        self.status_code = status_code
        self.error = error


@dataclass(frozen=True)
class ErrorCreateDef:
    status_code: int
    title: str
    format_string: str


class ErrorDef(ErrorCreateDef, Enum):
    """An enumeration of ErrorCreateDef Error definitions for use by
    RobotServerError"""
    def __init__(self, e) -> None:
        super().__init__(**(asdict(e)))


class RobotServerError(BaseRobotServerError):
    """A BaseRobotServerError that uses an ErrorDef enum"""
    def __init__(self,
                 definition: ErrorCreateDef,
                 error_id: str = None,
                 links: Optional[ResourceLinks] = None,
                 source: Optional[ErrorSource] = None,
                 meta: Optional[Dict] = None,
                 *fmt_args, **fmt_kw_args):
        """
        Constructor.

        :param definition: The ErrorDef enum defining error
        :param error_id: optional error id
        :param links: optional links
        :param source: optional source of error
        :param meta: optional metadata about error
        :param fmt_args: format_string args
        :param fmt_kw_args: format_string kw_args
        """
        super().__init__(
            definition.status_code,
            Error(
                id=error_id,
                links=links,
                status=str(definition.status_code),
                title=definition.title,
                detail=definition.format_string.format(*fmt_args,
                                                       **fmt_kw_args),
                source=source,
                meta=meta
            ))


class CommonErrorDef(ErrorDef):
    """Generic common defined errors"""
    INTERNAL_SERVER_ERROR = ErrorCreateDef(
        status_code=status_codes.HTTP_500_INTERNAL_SERVER_ERROR,
        title='Internal Server Error',
        format_string='{error}'
    )
    NOT_IMPLEMENTED = ErrorCreateDef(
        status_code=status_codes.HTTP_501_NOT_IMPLEMENTED,
        title='Not implemented',
        format_string='Method not implemented. {error}')
    RESOURCE_NOT_FOUND = ErrorCreateDef(
        status_code=status_codes.HTTP_404_NOT_FOUND,
        title='Resource Not Found',
        format_string="Resource type '{resource}' with id '{id}' was not found"
    )
    ACTION_FORBIDDEN = ErrorCreateDef(
        status_code=status_codes.HTTP_403_FORBIDDEN,
        title='Action Forbidden',
        format_string='{reason}'
    )
    RESOURCE_ALREADY_EXISTS = ErrorCreateDef(
        status_code=status_codes.HTTP_403_FORBIDDEN,
        title='Resource Exists',
        format_string="A '{resource}' with id '{id}' already exists"
    )
