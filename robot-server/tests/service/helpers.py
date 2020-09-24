from pydantic import BaseModel

from robot_server.service.json_api.request import (
    RequestModel, RequestDataModel)


class ItemModel(BaseModel):
    name: str
    quantity: int
    price: float


ItemRequest = RequestModel[RequestDataModel[ItemModel]]
