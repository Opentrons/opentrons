from typing import List
from typing_extensions import Literal

from opentrons.app.models.json_api.factory import JsonApiModel
from opentrons.app.models.json_api.request import RequestModel, RequestDataModel
from opentrons.app.models.json_api.response import ResponseModel, ResponseDataModel
from tests.opentrons.app.helpers import ItemModel

def test_json_api_model():
    ItemRequest, ItemResponse = JsonApiModel('item', ItemModel)
    assert ItemRequest == RequestModel[RequestDataModel[Literal['item'], ItemModel]]
    assert ItemResponse == ResponseModel[ResponseDataModel[Literal['item'], ItemModel]]

def test_json_api_model__list_response():
    ItemRequest, ItemResponse = JsonApiModel('item', ItemModel, list_response=True)
    assert ItemRequest == RequestModel[RequestDataModel[Literal['item'], ItemModel]]
    assert ItemResponse == ResponseModel[List[ResponseDataModel[Literal['item'], ItemModel]]]