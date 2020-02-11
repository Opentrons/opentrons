import inspect

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError

from opentrons.app.models.item import Item, ItemData
from opentrons.app.models.json_api.factory import JsonApiModel, format_json_request
from opentrons.app.models.json_api.errors import ErrorResponse
# https://github.com/encode/starlette/blob/master/starlette/status.py
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_422_UNPROCESSABLE_ENTITY

from opentrons.app.models.json_api.response import JsonApiResponse
from opentrons.app.models.json_api.request import JsonApiRequest

router = APIRouter()

ITEM_TYPE_NAME = "item"
ItemResponse = JsonApiResponse(ITEM_TYPE_NAME, Item)

@router.get("/items/{item_id}",
            description="Get an individual item by it's ID",
            summary="Get an individual item",
            response_model=ItemResponse,
            responses={
                HTTP_422_UNPROCESSABLE_ENTITY: { "model": ErrorResponse },
            })
async def get_item(item_id: int) -> ItemResponse:
    try:
        data = { "id": item_id, "name": "apple", "quantity": "10", "price": 1.20 }
        request = format_json_request(ITEM_TYPE_NAME, data)
        return ItemResponse(**request)
    except ValidationError as e:
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail=e)

@router.post("/items",
            description="Create an item",
            summary="Create an item via post route",
            response_model=ItemResponse,
            responses={
                HTTP_400_BAD_REQUEST: { "model": ErrorResponse },
                HTTP_422_UNPROCESSABLE_ENTITY: { "model": ErrorResponse },
            })
async def create_item(attributes: Item) -> ItemResponse:
    try:
        item_data = ItemData(**attributes.dict())
        request = format_json_request(ITEM_TYPE_NAME, vars(item_data))
        return ItemResponse(**request)
    except ValidationError as e:
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail=e)
    except Exception as e:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=e)