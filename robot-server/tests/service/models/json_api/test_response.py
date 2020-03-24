from pytest import raises
from pydantic import BaseModel, ValidationError

from robot_server.service.models.json_api.response import json_api_response
from robot_server.service.models.json_api import ResourceTypes
from tests.service.helpers import ItemModel, ItemData


ITEM_TYPE = ResourceTypes.item


def test_attributes_as_dict():
    MyResponse = json_api_response(ITEM_TYPE, dict)
    obj_to_validate = {
        'data': {'id': '123', 'type': 'item', 'attributes': {}},
    }
    my_response_object = MyResponse(**obj_to_validate)
    assert my_response_object.dict() == {
        'meta': None,
        'links': None,
        'data': {
            'id': '123',
            'type': 'item',
            'attributes': {},
        }
    }


def test_missing_attributes_dict():
    MyResponse = json_api_response(ITEM_TYPE, dict)
    obj_to_validate = {
        'data': {'id': '123', 'type': 'item'}
    }
    my_response_object = MyResponse(**obj_to_validate)
    assert my_response_object.dict() == {
        'meta': None,
        'links': None,
        'data': {
            'id': '123',
            'type': 'item',
            'attributes': {},
        }
    }


def test_missing_attributes_empty_model():
    class EmptyModel(BaseModel):
        pass

    MyResponse = json_api_response(ITEM_TYPE, EmptyModel)
    obj_to_validate = {
        'data': {'id': '123', 'type': 'item'}
    }
    my_response_object = MyResponse(**obj_to_validate)
    assert my_response_object.dict() == {
        'meta': None,
        'links': None,
        'data': {
            'id': '123',
            'type': 'item',
            'attributes': {},
        }
    }
    assert isinstance(my_response_object.data.attributes, EmptyModel)


def test_attributes_as_item_model():
    ItemResponse = json_api_response(ITEM_TYPE, ItemModel)
    obj_to_validate = {
        'meta': None,
        'links': None,
        'data': {
            'id': '123',
            'type': 'item',
            'attributes': {
                'name': 'apple',
                'quantity': 10,
                'price': 1.20
            }
        }
    }
    my_response_obj = ItemResponse(**obj_to_validate)
    assert my_response_obj.dict() == {
        'meta': None,
        'links': None,
        'data': {
            'id': '123',
            'type': 'item',
            'attributes': {
                'name': 'apple',
                'quantity': 10,
                'price': 1.20,
            }
        }
    }


def test_list_item_model():
    ItemResponse = json_api_response(ITEM_TYPE, ItemModel, use_list=True)
    obj_to_validate = {
        'meta': None,
        'links': None,
        'data': [
            {
                'id': '123',
                'type': 'item',
                'attributes': {
                    'name': 'apple',
                    'quantity': 10,
                    'price': 1.20
                },
            },
            {
                'id': '321',
                'type': 'item',
                'attributes': {
                    'name': 'banana',
                    'quantity': 20,
                    'price': 2.34
                },
            },
        ],
    }
    my_response_obj = ItemResponse(**obj_to_validate)
    assert my_response_obj.dict() == {
        'meta': None,
        'links': None,
        'data': [
            {
                'id': '123',
                'type': 'item',
                'attributes': {
                    'name': 'apple',
                    'quantity': 10,
                    'price': 1.20,
                },
            },
            {
                'id': '321',
                'type': 'item',
                'attributes': {
                    'name': 'banana',
                    'quantity': 20,
                    'price': 2.34,
                },
            },
        ],
    }


def test_type_invalid_string():
    MyResponse = json_api_response(ITEM_TYPE, dict)
    obj_to_validate = {
        'data': {'id': '123', 'type': 'not_an_item', 'attributes': {}}
    }
    with raises(ValidationError) as e:
        MyResponse(**obj_to_validate)

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
    ItemResponse = json_api_response(ITEM_TYPE, ItemModel)
    obj_to_validate = {
        'data': {'id': '123', 'type': 'item', 'attributes': None}
    }
    with raises(ValidationError) as e:
        ItemResponse(**obj_to_validate)

    assert e.value.errors() == [
        {
            'loc': ('data', 'attributes'),
            'msg': 'none is not an allowed value',
            'type': 'type_error.none.not_allowed',
        },
    ]


def test_attributes_as_item_model__empty_dict():
    ItemResponse = json_api_response(ITEM_TYPE, ItemModel)
    obj_to_validate = {
        'data': {
            'id': '123',
            'type': 'item',
            'attributes': {}
        }
    }
    with raises(ValidationError) as e:
        ItemResponse(**obj_to_validate)

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
        },
    ]


def test_resource_object_constructor():
    ItemResponse = json_api_response(ITEM_TYPE, ItemModel)
    item = ItemModel(name='pear', price=1.2, quantity=10)
    document = ItemResponse.resource_object(
        id='abc123',
        attributes=item
    ).dict()

    assert document == {
        'id': 'abc123',
        'type': 'item',
        'attributes': {
            'name': 'pear',
            'price': 1.2,
            'quantity': 10,
        }
    }


def test_resource_object_constructor__no_attributes():
    IdentifierResponse = json_api_response(ITEM_TYPE, dict)
    document = IdentifierResponse.resource_object(id='abc123').dict()

    assert document == {
        'id': 'abc123',
        'type': 'item',
        'attributes': {},
    }


def test_resource_object_constructor__with_list_response():
    ItemResponse = json_api_response(ITEM_TYPE, ItemModel, use_list=True)
    item = ItemModel(name='pear', price=1.2, quantity=10)
    document = ItemResponse.resource_object(
        id='abc123',
        attributes=item
    ).dict()

    assert document == {
        'id': 'abc123',
        'type': 'item',
        'attributes': {
            'name': 'pear',
            'price': 1.2,
            'quantity': 10,
        }
    }


def test_response_constructed_with_resource_object():
    ItemResponse = json_api_response(ITEM_TYPE, ItemModel)
    item = ItemModel(name='pear', price=1.2, quantity=10)
    data = ItemResponse.resource_object(
        id='abc123',
        attributes=item
    ).dict()

    assert ItemResponse(data=data).dict() == {
        'meta': None,
        'links': None,
        "data": {
            'id': 'abc123',
            "type": 'item',
            "attributes": {
                'name': 'pear',
                'price': 1.2,
                'quantity': 10,
            },
        }
    }


def test_response_constructed_with_resource_object__list():
    ItemResponse = json_api_response(ITEM_TYPE, ItemModel, use_list=True)
    items = [
        ItemData(id=1, name='apple', price=1.5, quantity=3),
        ItemData(id=2, name='pear', price=1.2, quantity=10),
        ItemData(id=3, name='orange', price=2.2, quantity=5)
    ]
    response = ItemResponse(
        data=[
            ItemResponse.resource_object(id=item.id, attributes=vars(item))
            for item in items
        ]
    )
    assert response.dict() == {
        'meta': None,
        'links': None,
        'data': [
            {
                'id': '1',
                'type': 'item',
                'attributes': {
                    'name': 'apple',
                    'price': 1.5,
                    'quantity': 3,
                },
            },
            {
                'id': '2',
                'type': 'item',
                'attributes': {
                    'name': 'pear',
                    'price': 1.2,
                    'quantity': 10,
                },
            },
            {
                'id': '3',
                'type': 'item',
                'attributes': {
                    'name': 'orange',
                    'price': 2.2,
                    'quantity': 5,
                },
            },
        ]
    }
