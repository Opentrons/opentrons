from pytest import raises
from pydantic import ValidationError
from typing import Any, Dict

from robot_server.service.json_api.request import RequestModel
from tests.service.helpers import ItemModel


def test_attributes_as_dict():
    DictRequest = RequestModel[dict]
    obj_to_validate = {"data": {"some_data": 1}}
    my_request_obj = DictRequest.parse_obj(obj_to_validate)
    assert my_request_obj.dict() == {"data": {"some_data": 1}}


def test_attributes_as_item_model():
    ItemRequest = RequestModel[ItemModel]
    obj_to_validate = {"data": {"name": "apple", "quantity": 10, "price": 1.20}}
    my_request_obj = ItemRequest.parse_obj(obj_to_validate)
    assert my_request_obj.dict() == obj_to_validate


def test_attributes_as_item_model_empty_dict():
    ItemRequest = RequestModel[ItemModel]
    obj_to_validate: Dict[str, Any] = {"data": {}}
    with raises(ValidationError) as e:
        ItemRequest.parse_obj(obj_to_validate)

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


def test_attributes_required():
    MyRequest = RequestModel[dict]
    obj_to_validate = {"data": None}
    with raises(ValidationError) as e:
        MyRequest.parse_obj(obj_to_validate)

    assert e.value.errors() == [
        {
            "loc": ("data",),
            "msg": "none is not an allowed value",
            "type": "type_error.none.not_allowed",
        },
    ]


def test_data_required():
    MyRequest = RequestModel[dict]
    obj_to_validate = {"data": None}
    with raises(ValidationError) as e:
        MyRequest.parse_obj(obj_to_validate)

    assert e.value.errors() == [
        {
            "loc": ("data",),
            "msg": "none is not an allowed value",
            "type": "type_error.none.not_allowed",
        },
    ]


def test_request_with_id():
    MyRequest = RequestModel[dict]
    obj_to_validate = {
        "data": {"type": "item", "attributes": {}, "id": "abc123"},
    }
    my_request_obj = MyRequest.parse_obj(obj_to_validate)
    assert my_request_obj.dict() == {
        "data": {"type": "item", "attributes": {}, "id": "abc123"},
    }
