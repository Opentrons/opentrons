from pytest import raises

from pydantic import ValidationError

from robot_server.service.models.json_api.request import json_api_request
from robot_server.service.models.json_api import ResourceTypes
from tests.service.helpers import ItemModel


ITEM_TYPE = ResourceTypes.item


def test_attributes_as_dict():
    DictRequest = json_api_request(ITEM_TYPE, dict)
    obj_to_validate = {
        'data': {'type': 'item', 'attributes': {}}
    }
    my_request_obj = DictRequest(**obj_to_validate)
    assert my_request_obj.dict() == {
        'data': {
            'type': 'item',
            'attributes': {},
            'id': None,
        }
    }


def test_attributes_as_item_model():
    ItemRequest = json_api_request(ITEM_TYPE, ItemModel)
    obj_to_validate = {
        'data': {
            'type': 'item',
            'attributes': {
                'name': 'apple',
                'quantity': 10,
                'price': 1.20
            },
            'id': None,
        }
    }
    my_request_obj = ItemRequest(**obj_to_validate)
    assert my_request_obj.dict() == obj_to_validate


def test_attributes_as_item_model__empty_dict():
    ItemRequest = json_api_request(ITEM_TYPE, ItemModel)
    obj_to_validate = {
        'data': {
            'type': 'item',
            'attributes': {}
        }
    }
    with raises(ValidationError) as e:
        ItemRequest(**obj_to_validate)

    assert e.value.errors() == [
        {
            'loc': ('data', 'attributes', 'name'),
            'msg': 'field required',
            'type': 'value_error.missing'
        }, {
            'loc': ('data', 'attributes', 'quantity'),
            'msg': 'field required',
            'type': 'value_error.missing'
        }, {
            'loc': ('data', 'attributes', 'price'),
            'msg': 'field required',
            'type': 'value_error.missing'
        }
    ]


def test_type_invalid_string():
    MyRequest = json_api_request(ITEM_TYPE, dict)
    obj_to_validate = {
        'data': {'type': 'not_an_item', 'attributes': {}}
    }
    with raises(ValidationError) as e:
        MyRequest(**obj_to_validate)

    assert e.value.errors() == [
        {
            'loc': ('data', 'type'),
            'msg': "value is not a valid enumeration member;"
                   " permitted: 'item'",
            'type': 'type_error.enum',
            'ctx': {'enum_values': [ITEM_TYPE]},
        },
    ]


def test_attributes_required():
    MyRequest = json_api_request(ITEM_TYPE, dict)
    obj_to_validate = {
        'data': {'type': 'item', 'attributes': None}
    }
    with raises(ValidationError) as e:
        MyRequest(**obj_to_validate)

    assert e.value.errors() == [
        {
            'loc': ('data', 'attributes'),
            'msg': 'none is not an allowed value',
            'type': 'type_error.none.not_allowed'
        },
    ]


def test_data_required():
    MyRequest = json_api_request(ITEM_TYPE, dict)
    obj_to_validate = {
        'data': None
    }
    with raises(ValidationError) as e:
        MyRequest(**obj_to_validate)

    assert e.value.errors() == [
        {
            'loc': ('data',),
            'msg': 'none is not an allowed value',
            'type': 'type_error.none.not_allowed'
        },
    ]


def test_request_with_id():
    MyRequest = json_api_request(ITEM_TYPE, dict)
    obj_to_validate = {
        'data': {
            'type': 'item',
            'attributes': {},
            'id': 'abc123'
        },
    }
    my_request_obj = MyRequest(**obj_to_validate)
    assert my_request_obj.dict() == {
        'data': {
            'type': 'item',
            'attributes': {},
            'id': 'abc123'
        },
    }
