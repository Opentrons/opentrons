from pydantic import BaseModel
from opentrons.app.models.json_api.request import JsonApiRequest
from dataclasses import dataclass
from uuid import uuid4

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
ItemRequest = JsonApiRequest(item_type_name, ItemModel)