from http import HTTPStatus
from typing import List, Dict, Any

from pydantic import ValidationError
from starlette.exceptions import HTTPException

from robot_server.service.json_api.errors import ErrorResponse, Error, \
    ErrorSource


class V1HandlerError(Exception):
    """An exception raised in order to produce a V1BasicResponse response"""
    def __init__(self, status_code, message):
        self.status_code = status_code
        self.message = message


class RobotServerError(Exception):
    def __init__(self, status_code: int, error: Error):
        self.status_code = status_code
        self.error = error


def build_unhandled_exception_response(exception: Exception) \
    -> ErrorResponse:
    error = Error(
        status=str(HTTPStatus.INTERNAL_SERVER_ERROR.value),
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
