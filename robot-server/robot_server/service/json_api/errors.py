from typing import Optional, List, Dict
from pydantic import BaseModel, Field

from .resource_links import ResourceLinks


class ErrorSource(BaseModel):
    pointer: Optional[str] = \
        Field(None,
              description="a JSON Pointer [RFC6901] to the associated"
                          " entity in the request document.")
    parameter: Optional[str] = \
        Field(None,
              description="a string indicating which URI query parameter"
                          " caused the error.")


class Error(BaseModel):
    """https://jsonapi.org/format/#error-objects"""
    id: Optional[str] = \
        Field(None,
              description="a unique identifier for this particular"
                          " occurrence of the problem.")
    links: Optional[ResourceLinks] = \
        Field(None,
              description="a link that leads to further details about"
                          " this particular occurrence of the problem.")
    status: Optional[str] = \
        Field(None,
              description="the HTTP status code applicable to this problem,"
                          " expressed as a string value.")
    title: Optional[str] = \
        Field(None,
              description="a short, human-readable summary of the problem"
                          " that SHOULD NOT change from occurrence"
                          " to occurrence of the problem, except for"
                          " purposes of localization.")
    detail: Optional[str] = \
        Field(None,
              description="a human-readable explanation specific to this"
                          " occurrence of the problem. Like title, this"
                          " field’s value can be localized.")
    source: Optional[ErrorSource] = \
        Field(None,
              description="an object containing references to the source of"
                          " the error, optionally including pointer"
                          " or parameter fields.")
    meta: Optional[Dict] = \
        Field(None,
              description="a meta object containing non-standard"
                          " meta-information about the error.")


class ErrorResponse(BaseModel):
    errors: List[Error] = \
        Field(...,
              description="a list containing one of more error objects.")
