from typing import Any, Tuple

from .request import JsonApiRequest, RequestModel
from .response import JsonApiResponse, ResponseModel

def JsonApiModel(
    type_string: str,
    attributes_model: Any,
    *,
    list_response: bool = False
) -> Tuple[RequestModel, ResponseModel]:
    return (
        JsonApiRequest(type_string, attributes_model),
        JsonApiResponse(type_string, attributes_model, use_list=list_response),
    )