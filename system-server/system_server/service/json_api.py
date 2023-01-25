"""Largely imports and reexports from robot_server's json_api."""

from robot_server.service.json_api import (  # type: ignore[import]
    RequestModel as RequestModel,
    PydanticResponse as PydanticResponse,
    BaseResponseBody as BaseResponseBody,
    Body as Body,
    SimpleBody as SimpleBody,
    EmptyBody as EmptyBody,
    SimpleEmptyBody as SimpleEmptyBody,
    MultiBody as MultiBody,
    SimpleMultiBody as SimpleMultiBody,
    MultiBodyMeta as MultiBodyMeta,
    ResourceModel as ResourceModel,
    DeprecatedResponseDataModel as DeprecatedResponseDataModel,
    DeprecatedResponseModel as DeprecatedResponseModel,
    DeprecatedMultiResponseModel as DeprecatedMultiResponseModel,
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
    "MultiBodyMeta",
    # resource data models
    "ResourceModel",
    # deprecated interfaces
    "DeprecatedResponseDataModel",
    "DeprecatedResponseModel",
    "DeprecatedMultiResponseModel",
]
