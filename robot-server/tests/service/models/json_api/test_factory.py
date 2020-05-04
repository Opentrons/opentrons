from typing import List

from robot_server.service.models.json_api.factory import \
    generate_json_api_models
from robot_server.service.models.json_api.request import RequestModel, \
    RequestDataModel
from robot_server.service.models.json_api.response import ResponseModel, \
    ResponseDataModel
from tests.service.helpers import ItemModel


def test_json_api_model():
    ItemRequest, ItemResponse = generate_json_api_models(ItemModel)
    assert ItemRequest == RequestModel[
        RequestDataModel[ItemModel]
    ]
    assert ItemResponse == ResponseModel[
        ResponseDataModel[ItemModel], dict
    ]


def test_json_api_model__list_response():
    ItemRequest, ItemResponse = generate_json_api_models(
        ItemModel,
        list_response=True
    )
    assert ItemRequest == RequestModel[
        RequestDataModel[ItemModel]
    ]
    assert ItemResponse == ResponseModel[
        List[ResponseDataModel[ItemModel]], dict
    ]
