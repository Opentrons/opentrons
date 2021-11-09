"""HTTP request and response models.

These models exist to ensure the /runs API is mapped to a reasonable
OpenAPI Spec. Given the large number of classes and unions involved,
the request and response models need to be ordered carefully.

Mostly, this involves making sure we have responses that are `Union`s
of `ResponseModel`s rather than `ResponseModel`s of `Union`s.
"""
from typing import Union

from robot_server.service.json_api import RequestModel, ResponseModel


from .run_models import (
    BasicRunCreateData,
    ProtocolRunCreateData,
    BasicRun,
    ProtocolRun,
)


CreateRunRequest = Union[
    RequestModel[BasicRunCreateData],
    RequestModel[ProtocolRunCreateData],
]

RunResponse = Union[
    ResponseModel[BasicRun],
    ResponseModel[ProtocolRun],
]
