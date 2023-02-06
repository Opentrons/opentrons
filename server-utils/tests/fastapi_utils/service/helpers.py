from pydantic import BaseModel

from server_utils.fastapi_utils.service.json_api import DeprecatedResponseDataModel
from server_utils.fastapi_utils.service.json_api.request import RequestModel


class ItemModel(BaseModel):
    name: str
    quantity: int
    price: float


class ItemResponseModel(DeprecatedResponseDataModel, ItemModel):
    pass


ItemRequest = RequestModel[ItemModel]
