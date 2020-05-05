from pydantic import BaseModel

from robot_server.service.models.json_api.request import json_api_request


class ItemModel(BaseModel):
    name: str
    quantity: int
    price: float


ItemRequest = json_api_request(ItemModel)
