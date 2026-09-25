"""JSON API models for server request and response handling."""

from .request import RequestDataT, RequestModel
from .resource_links import ResourceLink, ResourceLinkKey, ResourceLinks
from .response import (
    BaseResponseBody,
    Body,
    DeprecatedMultiResponseModel,
    DeprecatedResponseDataModel,
    DeprecatedResponseModel,
    EmptyBody,
    MultiBody,
    MultiBodyMeta,
    PydanticResponse,
    ResourceModel,
    SimpleBody,
    SimpleEmptyBody,
    SimpleMultiBody,
)

__all__ = [
    # request models
    "RequestModel",
    "RequestDataT",
    # response models
    "PydanticResponse",
    # response body models
    "BaseResponseBody",
    "Body",
    "SimpleBody",
    "EmptyBody",
    "SimpleEmptyBody",
    "MultiBody",
    "SimpleMultiBody",
    "MultiBodyMeta",
    # resource data models
    "ResourceModel",
    # response links models
    "ResourceLink",
    "ResourceLinks",
    "ResourceLinkKey",
    # deprecated interfaces
    "DeprecatedResponseDataModel",
    "DeprecatedResponseModel",
    "DeprecatedMultiResponseModel",
]
