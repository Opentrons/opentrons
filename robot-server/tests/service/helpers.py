from pydantic import BaseModel

from server_utils.fastapi_utils.models.json_api import (
    DeprecatedResponseDataModel,
    RequestModel,
)


class ItemModel(BaseModel):
    name: str
    quantity: int
    price: float


class ItemResponseModel(DeprecatedResponseDataModel, ItemModel):
    pass


ItemRequest = RequestModel[ItemModel]
