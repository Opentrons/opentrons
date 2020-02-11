from starlette.testclient import TestClient
from opentrons.app.main import app
from opentrons.app.models.item import ItemData
from opentrons.app.models.json_api.errors import Error
from starlette.status import HTTP_200_OK, HTTP_422_UNPROCESSABLE_ENTITY

client = TestClient(app)

# TODO(isk: 2/7/20): Add factories and add/refactor setup

def test_get_item():
    item_id = "1"
    response = client.get(f'items/{item_id}')
    assert response.status_code == HTTP_200_OK
    assert response.json() == {
      "data": {
        "id": item_id,
        "type": 'item',
        "attributes": {
          "name": "apple",
          "quantity": 10,
          "price": 1.20
        }
      }
    }

def test_create_item():
    data = { "name": "apple", "quantity": 10, "price": 1.20 }
    item = ItemData(**data)
    response = client.post(
        "/items",
        json=vars(item)
    )
    assert response.status_code == HTTP_200_OK
    assert response.json() == {
      "meta": None,
      "links": None,
      "data": {
        "id": item.id,
        "type": 'item',
        "attributes": {
          "name": item.name,
          "quantity": item.quantity,
          "price": item.price
        }
      }
    }

def test_create_item_with_attribute_validation_error():
    response = client.post(
        "/items",
        json={ "quantity": "10", "price": 1.20 }
    )
    assert response.status_code == HTTP_422_UNPROCESSABLE_ENTITY
    assert response.json() == {
      'errors': [{
          'id': None,
          'links': None,
          'status': str(HTTP_422_UNPROCESSABLE_ENTITY),
          'code': None,
          'title': 'value_error.missing',
          'detail': 'field required',
          'source': {
            'pointer': '/body/attributes/name',
            'parameter': None
          },
          'meta': None
      }]
    }