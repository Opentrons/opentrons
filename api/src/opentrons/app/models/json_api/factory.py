from typing import Any, Tuple

from .request import JsonApiRequest, RequestModel
from .response import JsonApiResponse, ResponseModel

# TODO(isk: 2/7/20): This might be totally unnessary depending on the resources
# Explore infering type from the request itself
def format_json_request(type, data):
    data_id = data.get("id")
    return {
        "data": {
            "id": data_id,
            "type": type,
            "attributes": data
        },
        "links": {
            "self": f'/{type}s/{data_id}'
        }
    }

# HTTP/1.1 200 OK
# Content-Type: application/vnd.api+json

# {
#   "links": {
#     "self": "http://example.com/articles"
#   },
#   "data": [{
#     "type": "articles",
#     "id": "1",
#     "attributes": {
#       "title": "JSON:API paints my bikeshed!"
#     }
#   }, {
#     "type": "articles",
#     "id": "2",
#     "attributes": {
#       "title": "Rails is Omakase"
#     }
#   }]
# }

# POST /photos HTTP/1.1
# Content-Type: application/vnd.api+json
# Accept: application/vnd.api+json

# {
#   "data": {
#     "type": "photos",
#     "id": "550e8400-e29b-41d4-a716-446655440000",
#     "attributes": {
#       "title": "Ember Hamster",
#       "src": "http://example.com/images/productivity.png"
#     }
#   }
# }

# HTTP/1.1 201 Created
# Location: http://example.com/photos/550e8400-e29b-41d4-a716-446655440000
# Content-Type: application/vnd.api+json

# {
#   "data": {
#     "type": "photos",
#     "id": "550e8400-e29b-41d4-a716-446655440000",
#     "attributes": {
#       "title": "Ember Hamster",
#       "src": "http://example.com/images/productivity.png"
#     },
#     "links": {
#       "self": "http://example.com/photos/550e8400-e29b-41d4-a716-446655440000"
#     }
#   }
# }

# PATCH /articles/1 HTTP/1.1
# Content-Type: application/vnd.api+json
# Accept: application/vnd.api+json

# {
#   "data": {
#     "type": "articles",
#     "id": "1",
#     "attributes": {
#       "title": "To TDD or Not"
#     }
#   }
# }
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