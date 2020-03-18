from pydantic import BaseModel
from dataclasses import dataclass
from uuid import uuid4

from robot_server.service.models.json_api.request import json_api_request


@dataclass
class ItemData:
    name: str
    quantity: int
    price: float
    id: str = str(uuid4().hex)


class ItemModel(BaseModel):
    name: str
    quantity: int
    price: float


item_type_name = 'item'
ItemRequest = json_api_request(item_type_name, ItemModel)
