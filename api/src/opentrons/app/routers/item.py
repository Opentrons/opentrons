import inspect

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError

from opentrons.app.models.item import Item, ItemData
from opentrons.app.models.json_api.factory import JsonApiModel
from opentrons.app.models.json_api.errors import ErrorResponse
# https://github.com/encode/starlette/blob/master/starlette/status.py
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_422_UNPROCESSABLE_ENTITY

router = APIRouter()

ITEM_TYPE_NAME = "item"
ItemRequest, ItemResponse = JsonApiModel(ITEM_TYPE_NAME, Item)

@router.get("/items/{item_id}",
            description="Get an individual item by it's ID",
            summary="Get an individual item",
            response_model=ItemResponse,
            responses={
                HTTP_422_UNPROCESSABLE_ENTITY: { "model": ErrorResponse },
            })
async def get_item(item_id: int) -> ItemResponse:
    try:
        # NOTE(isk: 3/10/20): mock DB / robot response
        item = Item(name="apple", quantity=10, price=1.20)
        data = ItemResponse.resource_object(id=item_id, attributes=item)
        return ItemResponse(data=data, links={"self": f'/items/{item_id}'})
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
async def create_item(item_request: ItemRequest) -> ItemResponse:
    try:
        attributes = item_request.attributes().dict()
        # NOTE(isk: 3/10/20): mock DB / robot response
        item = ItemData(**attributes)
        data = ItemResponse.resource_object(id=item.id, attributes=vars(item))
        return ItemResponse(data=data, links={"self": f'/items/{item.id}'})
    except ValidationError as e:
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail=e)
    except Exception as e:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=e)