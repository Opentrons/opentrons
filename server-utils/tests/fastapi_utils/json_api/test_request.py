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
    assert my_request_obj.model_dump() == {
        "data": {"some_data": 1},
        "userNotes": None,
    }


def test_attributes_as_item_model() -> None:
    """Test that the attributes are as an item model."""
    ItemRequest = RequestModel[ItemModel]
    obj_to_validate = {"data": {"name": "apple", "quantity": 10, "price": 1.20}}
    my_request_obj = ItemRequest.model_validate(obj_to_validate)
    assert my_request_obj.model_dump() == {
        **obj_to_validate,
        "userNotes": None,
    }


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
    assert my_request_obj.model_dump() == {
        "data": {"type": "item", "attributes": {}, "id": "abc123"},
        "userNotes": None,
    }


def test_user_notes_omitted_from_payload() -> None:
    """`userNotes` is optional; payloads without it validate."""
    ItemRequest = RequestModel[ItemModel]
    payload = {"data": {"name": "apple", "quantity": 10, "price": 1.20}}
    assert "userNotes" not in payload

    obj = ItemRequest.model_validate(payload)

    assert obj.userNotes is None
    assert obj.model_dump() == {
        **payload,
        "userNotes": None,
    }


def test_user_notes_explicit_null_accepted() -> None:
    """Explicit JSON null for `userNotes` is valid."""
    ItemRequest = RequestModel[ItemModel]
    payload: Dict[str, Any] = {
        "data": {"name": "apple", "quantity": 10, "price": 1.20},
        "userNotes": None,
    }

    obj = ItemRequest.model_validate(payload)

    assert obj.userNotes is None


def test_user_notes_passed_when_provided() -> None:
    """When supplied, `userNotes` is parsed as a string."""
    ItemRequest = RequestModel[ItemModel]
    payload = {
        "data": {"name": "apple", "quantity": 10, "price": 1.20},
        "userNotes": "audit note",
    }

    obj = ItemRequest.model_validate(payload)

    assert obj.userNotes == "audit note"


def test_supplied_user_notes() -> None:
    """`supplied_user_notes()` returns a stripped string or None."""
    ItemRequest = RequestModel[ItemModel]
    assert (
        ItemRequest(
            data=ItemModel(name="a", quantity=1, price=1.0), userNotes="audit note"
        ).supplied_user_notes()
        == "audit note"
    )
    assert (
        ItemRequest(
            data=ItemModel(name="a", quantity=1, price=1.0), userNotes=None
        ).supplied_user_notes()
        is None
    )
    assert (
        ItemRequest(
            data=ItemModel(name="a", quantity=1, price=1.0), userNotes="  \t  "
        ).supplied_user_notes()
        is None
    )
    assert (
        ItemRequest(
            data=ItemModel(name="a", quantity=1, price=1.0), userNotes="  trimmed  "
        ).supplied_user_notes()
        == "trimmed"
    )


def test_supplied_user_notes_ignores_user_notes_inside_data() -> None:
    """``userNotes`` must be a sibling of ``data``; a nested field is not read."""
    ItemRequest = RequestModel[ItemModel]
    assert (
        ItemRequest(
            data=ItemModel(name="a", quantity=1, price=1.0),
            userNotes="audit note",
        ).supplied_user_notes()
        == "audit note"
    )
    # Pydantic ignores unknown fields on ItemModel; simulate wrong client shape via dump+validate
    wrong_shape = {
        "data": {"name": "a", "quantity": 1, "price": 1.0, "userNotes": "nested"}
    }
    assert ItemRequest.model_validate(wrong_shape).supplied_user_notes() is None
