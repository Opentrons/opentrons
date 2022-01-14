from .request import RequestModel
from .resource_links import ResourceLink, ResourceLinks, ResourceLinkKey
from .response import (
    BaseResponseBody,
    Body,
    SimpleBody,
    EmptyBody,
    SimpleEmptyBody,
    MultiBody,
    SimpleMultiBody,
    DeprecatedResponseModel,
    DeprecatedMultiResponseModel,
    DeprecatedResponseDataModel,
    ResourceModel,
    PydanticResponse,
)


__all__ = [
    # request body model
    "RequestModel",
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
