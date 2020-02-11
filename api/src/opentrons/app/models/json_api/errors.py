from typing import Optional, List
from pydantic import BaseModel, ValidationError
# https://github.com/encode/starlette/blob/master/starlette/status.py
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from .filter import filter_none
from .resource_links import ResourceLinks


class ErrorSource(BaseModel):
    pointer: Optional[str]
    parameter: Optional[str]


class Error(BaseModel):
    """https://jsonapi.org/format/#error-objects"""
    id: Optional[str]
    links: Optional[ResourceLinks]
    status: Optional[str]
    code: Optional[str]
    title: Optional[str]
    detail: Optional[str]
    source: Optional[ErrorSource]
    meta: Optional[dict]


class ErrorResponse(BaseModel):
    errors: List[Error]

def transform_to_json_api_errors(status_code, exception) -> dict:
    def transform_error(error):
        return {
            'status': status_code,
            'detail': error.get('msg'),
            'title': error.get('type'),
            'source': {
                'pointer': '/' + '/'.join(error['loc']),
            },
        }
    error_response = ErrorResponse(
        errors=[transform_error(error) for error in exception.errors()]
    )
    return filter_none(error_response.dict())