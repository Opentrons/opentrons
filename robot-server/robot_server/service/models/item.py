from pydantic import BaseModel
from dataclasses import dataclass
from uuid import uuid4


@dataclass
class ItemData:
    name: str
    quantity: int
    price: float
    id: str = str(uuid4().hex)


class Item(BaseModel):
    name: str
    quantity: int
    price: float
