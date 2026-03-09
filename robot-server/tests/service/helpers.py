from pydantic import BaseModel

from robot_server.service.json_api import DeprecatedResponseDataModel
from robot_server.service.json_api.request import RequestModel


class ItemModel(BaseModel):
    name: str
    quantity: int
    price: float


class ItemResponseModel(DeprecatedResponseDataModel, ItemModel):
    pass


ItemRequest = RequestModel[ItemModel]
