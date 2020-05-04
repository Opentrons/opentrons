from uuid import uuid4

from fastapi import APIRouter, HTTPException
from starlette.status import HTTP_400_BAD_REQUEST, \
    HTTP_422_UNPROCESSABLE_ENTITY
from pydantic import ValidationError

from robot_server.service.models.item import Item
from robot_server.service.models.json_api.factory import \
    generate_json_api_models
from robot_server.service.models.json_api.request import RequestDataModel
from robot_server.service.models.json_api.response import ResponseDataModel
from robot_server.service.models.json_api.errors import ErrorResponse

router = APIRouter()

ItemRequest, ItemResponse = generate_json_api_models(Item)


@router.get("/items/{item_id}",
            description="Get an individual item by its ID",
            summary="Get an individual item",
            response_model=ItemResponse,
            response_model_exclude_unset=True,
            responses={
                HTTP_422_UNPROCESSABLE_ENTITY: {"model": ErrorResponse},
            })
async def get_item(item_id: str) -> ItemResponse:    # type: ignore
    try:
        # NOTE(isk: 3/10/20): mock DB / robot response
        item = Item(name="apple", quantity=10, price=1.20)
        data = ResponseDataModel.create(resource_id=item_id, attributes=item)
        return ItemResponse(data=data, links={"self": f'/items/{item_id}'})
    except ValidationError as e:
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e
        )


@router.post("/items",
             description="Create an item",
             summary="Create an item via post route",
             response_model=ItemResponse,
             response_model_exclude_unset=True,
             responses={
                 HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
                 HTTP_422_UNPROCESSABLE_ENTITY: {"model": ErrorResponse},
             })
async def create_item(
    item_request: ItemRequest
) -> ItemResponse:
    try:
        # NOTE(isk: 3/10/20): mock DB / robot response
        item = item_request.data.attributes
        data = ResponseDataModel.create(
            resource_id=str(uuid4()),
            attributes=item
        )
        return ItemResponse(data=data, links={"self": f'/items/{data.id}'})
    except ValidationError as e:
        raise HTTPException(
                status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                detail=e
        )
    except Exception as e:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=e)
