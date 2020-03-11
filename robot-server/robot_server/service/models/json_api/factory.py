from typing import Type, Any, Tuple

from .request import JsonApiRequest, RequestModel
from .response import JsonApiResponse, ResponseModel


def generate_json_api_models(
    type_string: str,
    attributes_model: Any,
    *,
    list_response: bool = False
) -> Tuple[Type[RequestModel], Type[ResponseModel]]:
    return (
        JsonApiRequest(type_string, attributes_model),
        JsonApiResponse(type_string, attributes_model, use_list=list_response),
    )
