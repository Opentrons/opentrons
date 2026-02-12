from pydantic import BaseModel, ValidationError
from pytest import raises

from server_utils.fastapi_utils.models.json_api.resource_links import ResourceLinks


class ThingWithLink(BaseModel):
    links: ResourceLinks


def test_follows_structure() -> None:
    structure_to_validate = {
        "links": {
            "self": {"href": "/items/1", "meta": None},
        }
    }
    validated = ThingWithLink.model_validate(structure_to_validate)
    assert validated.model_dump() == structure_to_validate


def test_must_be_self_key_with_string_value() -> None:
    invalid_structure_to_validate = {
        "invalid": {
            "key": "value",
        }
    }
    with raises(ValidationError) as e:
        ThingWithLink.model_validate(invalid_structure_to_validate)
    assert e.value.errors() == [
        {
            "loc": ("links",),
            "msg": "Field required",
            "type": "missing",
            "input": {"invalid": {"key": "value"}},
            "url": "https://errors.pydantic.dev/2.11/v/missing",
        }
    ]
