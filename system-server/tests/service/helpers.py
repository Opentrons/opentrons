from pydantic import BaseModel

from system_server.service.json_api import DeprecatedResponseDataModel, RequestModel


class ItemModel(BaseModel):
    name: str
    quantity: int
    price: float


class ItemResponseModel(DeprecatedResponseDataModel, ItemModel):  # type: ignore[misc]
    pass


ItemRequest = RequestModel[ItemModel]
