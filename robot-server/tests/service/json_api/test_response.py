from pytest import raises
from pydantic import ValidationError

from robot_server.service.json_api.response import (
    ResponseDataModel,
    ResponseModel,
    MultiResponseModel,
)
from tests.service.helpers import ItemResponseModel


def test_attributes_as_dict():
    MyResponse = ResponseModel[ResponseDataModel]
    obj_to_validate = {
        "data": {"id": "123"},
    }
    my_response_object = MyResponse(**obj_to_validate)
    assert my_response_object.dict() == {
        "links": None,
        "data": {
            "id": "123",
        },
    }


def test_attributes_as_item_model():
    ItemResponse = ResponseModel[ItemResponseModel]
    obj_to_validate = {
        "links": None,
        "data": {"id": "123", "name": "apple", "quantity": 10, "price": 1.20},
    }
    my_response_obj = ItemResponse(**obj_to_validate)
    assert my_response_obj.dict() == {
        "links": None,
        "data": {
            "id": "123",
            "name": "apple",
            "quantity": 10,
            "price": 1.20,
        },
    }


def test_list_item_model():
    ItemResponse = MultiResponseModel[ItemResponseModel]
    obj_to_validate = {
        "links": None,
        "data": [
            {"id": "123", "name": "apple", "quantity": 10, "price": 1.20},
            {"id": "321", "name": "banana", "quantity": 20, "price": 2.34},
        ],
    }
    my_response_obj = ItemResponse(**obj_to_validate)
    assert my_response_obj.dict() == {
        "links": None,
        "data": [
            {
                "id": "123",
                "name": "apple",
                "quantity": 10,
                "price": 1.20,
            },
            {
                "id": "321",
                "name": "banana",
                "quantity": 20,
                "price": 2.34,
            },
        ],
    }


def test_attributes_as_item_model_empty_dict():
    ItemResponse = ResponseModel[ItemResponseModel]
    obj_to_validate = {
        "data": {
            "id": "123",
        }
    }
    with raises(ValidationError) as e:
        ItemResponse(**obj_to_validate)

    assert e.value.errors() == [
        {
            "loc": ("data", "name"),
            "msg": "field required",
            "type": "value_error.missing",
        },
        {
            "loc": ("data", "quantity"),
            "msg": "field required",
            "type": "value_error.missing",
        },
        {
            "loc": ("data", "price"),
            "msg": "field required",
            "type": "value_error.missing",
        },
    ]


def test_response_constructed_with_resource_object():
    ItemResponse = ResponseModel[ItemResponseModel]
    item = ItemResponseModel(id="abc123", name="pear", price=1.2, quantity=10)
    data = item.dict()

    assert ItemResponse(data=data).dict() == {
        "links": None,
        "data": {
            "id": "abc123",
            "name": "pear",
            "price": 1.2,
            "quantity": 10,
        },
    }


def test_response_constructed_with_resource_object_list():
    ItemResponse = MultiResponseModel[ItemResponseModel]
    items = [
        ItemResponseModel(id="1", name="apple", price=1.5, quantity=3),
        ItemResponseModel(id="2", name="pear", price=1.2, quantity=10),
        ItemResponseModel(id="3", name="orange", price=2.2, quantity=5),
    ]
    response = ItemResponse(data=items)
    assert response.dict() == {
        "links": None,
        "data": [
            {
                "id": "1",
                "name": "apple",
                "price": 1.5,
                "quantity": 3,
            },
            {
                "id": "2",
                "name": "pear",
                "price": 1.2,
                "quantity": 10,
            },
            {
                "id": "3",
                "name": "orange",
                "price": 2.2,
                "quantity": 5,
            },
        ],
    }
