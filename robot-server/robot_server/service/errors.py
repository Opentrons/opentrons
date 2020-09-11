from dataclasses import dataclass, asdict
from enum import Enum
from typing import List, Dict, Any, Optional

from pydantic import ValidationError
from starlette.exceptions import HTTPException
from starlette import status as status_codes

from robot_server.service.json_api.errors import ErrorResponse, Error, \
    ErrorSource, ResourceLinks


class V1HandlerError(Exception):
    """An exception raised in order to produce a V1BasicResponse response"""
    def __init__(self, status_code, message):
        self.status_code = status_code
        self.message = message


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
    RobotServerErrorDefined"""
    def __init__(self, e) -> None:
        super().__init__(**(asdict(e)))


class RobotServerError(BaseRobotServerError):
    """A BaseRobotServerError that uses an ErrorDef enum"""
    def __init__(self,
                 definition: ErrorDef,
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


def build_unhandled_exception_response(exception: Exception) \
        -> ErrorResponse:
    error = Error(
        status=str(status_codes.HTTP_500_INTERNAL_SERVER_ERROR),
        detail=f'Unhandled exception: {type(exception)}',
        title='Internal Server Error'
    )
    return ErrorResponse(errors=[error])


def transform_http_exception_to_json_api_errors(exception: HTTPException) \
        -> ErrorResponse:
    """
    Object marshalling for http exceptions (these errors come back differently
    than validation errors). e.g. invalid json in request body.
    """
    request_error = Error(
        status=str(exception.status_code),
        detail=exception.detail,
        title='Bad Request'
    )
    return ErrorResponse(errors=[request_error])


def transform_validation_error_to_json_api_errors(
    status_code: int,
    exception: ValidationError
) -> ErrorResponse:
    """
    Object marshalling for validation errors.  format pydantic validation
    errors to expected json:api response shape.
    """
    def transform_error(error):
        return Error(
            status=str(status_code),
            detail=error.get('msg'),
            source=ErrorSource(pointer='/' + '/'.join(
                str(node) for node in error['loc'])),
            title=error.get('type')
        )

    return ErrorResponse(
        errors=[transform_error(error) for error in exception.errors()]
    )


def consolidate_fastapi_response(all_exceptions: List[Dict[str, Any]]) -> str:
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
