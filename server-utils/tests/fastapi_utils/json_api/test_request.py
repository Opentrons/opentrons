"""Test the request models."""

from typing import Any, Dict

from pydantic import BaseModel, ValidationError
from pytest import raises

from server_utils.fastapi_utils.models.json_api import RequestModel


class ItemModel(BaseModel):
    """An item model."""

    name: str
    quantity: int
    price: float


def test_attributes_as_dict() -> None:
    """Test that the attributes are as a dict."""
    DictRequest = RequestModel[dict]  # type: ignore[type-arg]
    obj_to_validate = {"data": {"some_data": 1}}
    my_request_obj = DictRequest.model_validate(obj_to_validate)
    assert my_request_obj.model_dump() == {"data": {"some_data": 1}}


def test_attributes_as_item_model() -> None:
    """Test that the attributes are as an item model."""
    ItemRequest = RequestModel[ItemModel]
    obj_to_validate = {"data": {"name": "apple", "quantity": 10, "price": 1.20}}
    my_request_obj = ItemRequest.model_validate(obj_to_validate)
    assert my_request_obj.model_dump() == obj_to_validate


def test_attributes_as_item_model_empty_dict() -> None:
    """Test that the attributes are as an item model with an empty dict."""
    ItemRequest = RequestModel[ItemModel]
    obj_to_validate: Dict[str, Any] = {"data": {}}
    with raises(ValidationError) as e:
        ItemRequest.model_validate(obj_to_validate)

    assert e.value.errors() == [
        {
            "loc": ("data", "name"),
            "msg": "Field required",
            "type": "missing",
            "input": {},
            "url": "https://errors.pydantic.dev/2.12/v/missing",
        },
        {
            "loc": ("data", "quantity"),
            "msg": "Field required",
            "type": "missing",
            "input": {},
            "url": "https://errors.pydantic.dev/2.12/v/missing",
        },
        {
            "loc": ("data", "price"),
            "msg": "Field required",
            "type": "missing",
            "input": {},
            "url": "https://errors.pydantic.dev/2.12/v/missing",
        },
    ]


def test_attributes_required() -> None:
    """Test that the attributes are required."""
    MyRequest = RequestModel[dict]  # type: ignore[type-arg]
    obj_to_validate = {"data": None}
    with raises(ValidationError) as e:
        MyRequest.model_validate(obj_to_validate)

    assert e.value.errors() == [
        {
            "loc": ("data",),
            "msg": "Input should be a valid dictionary",
            "input": None,
            "url": "https://errors.pydantic.dev/2.12/v/dict_type",
            "type": "dict_type",
        },
    ]


def test_data_required() -> None:
    """Test that the data is required."""
    MyRequest = RequestModel[dict]  # type: ignore[type-arg]
    obj_to_validate = {"data": None}
    with raises(ValidationError) as e:
        MyRequest.model_validate(obj_to_validate)

    assert e.value.errors() == [
        {
            "loc": ("data",),
            "msg": "Input should be a valid dictionary",
            "input": None,
            "url": "https://errors.pydantic.dev/2.12/v/dict_type",
            "type": "dict_type",
        },
    ]


def test_request_with_id() -> None:
    """Test that the request with an id is validated correctly."""
    MyRequest = RequestModel[dict]  # type: ignore[type-arg]
    obj_to_validate = {
        "data": {"type": "item", "attributes": {}, "id": "abc123"},
    }
    my_request_obj = MyRequest.model_validate(obj_to_validate)
    assert my_request_obj.model_dump() == obj_to_validate


def test_legacy_user_notes_field_is_ignored() -> None:
    """Top-level ``userNotes`` in JSON bodies is no longer read; use the header instead."""
    ItemRequest = RequestModel[ItemModel]
    payload = {
        "data": {"name": "apple", "quantity": 10, "price": 1.20},
        "userNotes": "audit note",
    }

    obj = ItemRequest.model_validate(payload)

    assert obj.model_dump() == {"data": payload["data"]}
