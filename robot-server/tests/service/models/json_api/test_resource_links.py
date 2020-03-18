from pytest import raises

from pydantic import BaseModel, ValidationError
from robot_server.service.models.json_api.resource_links import ResourceLinks


class ThingWithLink(BaseModel):
    links: ResourceLinks


def test_follows_structure():
    structure_to_validate = {
        'links': {
            'self': '/items/1',
        }
    }
    validated = ThingWithLink(**structure_to_validate)
    assert validated.dict() == structure_to_validate


def test_must_be_self_key_with_string_value():
    invalid_structure_to_validate = {
        'invalid': {
            'key': 'value',
        }
    }
    with raises(ValidationError) as e:
        ThingWithLink(**invalid_structure_to_validate)
    assert e.value.errors() == [
        {
            'loc': ('links',),
            'msg': 'field required',
            'type': 'value_error.missing'
        }
    ]
