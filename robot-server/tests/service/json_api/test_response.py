from pytest import raises
from pydantic import BaseModel, ValidationError

from robot_server.service.json_api.response import (
    ResponseDataModel, ResponseModel, MultiResponseModel)
from tests.service.helpers import ItemModel


def test_attributes_as_dict():
    MyResponse = ResponseModel[dict, dict]
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
    MyResponse = ResponseModel[dict, dict]
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

    MyResponse = ResponseModel[EmptyModel, dict]
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
    ItemResponse = ResponseModel[ItemModel, dict]
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
    ItemResponse = MultiResponseModel[ItemModel, dict]
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


def test_attributes_required():
    ItemResponse = ResponseModel[ResponseDataModel[ItemModel], dict]
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
    ItemResponse = ResponseModel[ItemModel, dict]
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


def test_resource_data_model_create():
    item = ItemModel(name='pear', price=1.2, quantity=10)
    document = ResponseDataModel.create(
        resource_id='abc123',
        attributes=item
    ).dict()

    assert document == {
        'id': 'abc123',
        'type': 'ItemModel',
        'attributes': {
            'name': 'pear',
            'price': 1.2,
            'quantity': 10,
        }
    }


def test_resource_data_model_create_no_attributes():
    document = ResponseDataModel.create(
        resource_id='abc123', attributes={}).dict()

    assert document == {
        'id': 'abc123',
        'type': 'dict',
        'attributes': {},
    }


def test_response_constructed_with_resource_object():
    ItemResponse = ResponseModel[ItemModel, dict]
    item = ItemModel(name='pear', price=1.2, quantity=10)
    data = ResponseDataModel.create(
            resource_id='abc123',
            attributes=item
    ).dict()

    assert ItemResponse(data=data).dict() == {
        'meta': None,
        'links': None,
        "data": {
            'id': 'abc123',
            "type": 'ItemModel',
            "attributes": {
                'name': 'pear',
                'price': 1.2,
                'quantity': 10,
            },
        }
    }


def test_response_constructed_with_resource_object_list():
    ItemResponse = MultiResponseModel[ItemModel, dict]
    items = (
        (1, ItemModel(name='apple', price=1.5, quantity=3)),
        (2, ItemModel(name='pear', price=1.2, quantity=10)),
        (3, ItemModel(name='orange', price=2.2, quantity=5))
    )
    response = ItemResponse(
        data=[
            ResponseDataModel.create(resource_id=str(item[0]),
                                     attributes=item[1])
            for item in items
        ]
    )
    assert response.dict() == {
        'meta': None,
        'links': None,
        'data': [
            {
                'id': '1',
                'type': 'ItemModel',
                'attributes': {
                    'name': 'apple',
                    'price': 1.5,
                    'quantity': 3,
                },
            },
            {
                'id': '2',
                'type': 'ItemModel',
                'attributes': {
                    'name': 'pear',
                    'price': 1.2,
                    'quantity': 10,
                },
            },
            {
                'id': '3',
                'type': 'ItemModel',
                'attributes': {
                    'name': 'orange',
                    'price': 2.2,
                    'quantity': 5,
                },
            },
        ]
    }
