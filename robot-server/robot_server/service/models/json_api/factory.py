from typing import Type, Any, Tuple

from .request import json_api_request, RequestModel
from .response import json_api_response, ResponseModel


def generate_json_api_models(
    attributes_model: Any,
    *,
    list_response: bool = False
) -> Tuple[Type[RequestModel], Type[ResponseModel]]:
    return (
        json_api_request(attributes_model),
        json_api_response(
            attributes_model, use_list=list_response
        ),
    )
