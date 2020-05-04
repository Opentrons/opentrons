from pydantic import BaseModel


class Item(BaseModel):
    name: str
    quantity: int
    price: float
