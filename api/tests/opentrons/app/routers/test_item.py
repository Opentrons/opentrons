from starlette.testclient import TestClient
from opentrons.app.main import app
from opentrons.app.models.item import ItemData
from opentrons.app.models.json_api.errors import Error
from starlette.status import HTTP_200_OK, HTTP_422_UNPROCESSABLE_ENTITY

client = TestClient(app)

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
                "price": 1.2
            },
        },
        "links": {
            "self": f'/items/{item_id}',
        }
    }

def test_create_item():
    data = { "name": "apple", "quantity": 10, "price": 1.20 }
    item = ItemData(**data)
    response = client.post(
        "/items",
        json={"data": { "type": "item", "attributes": vars(item) }}
    )
    assert response.status_code == HTTP_200_OK
    assert response.json() == {
        "data": {
            "id": item.id,
            "type": 'item',
            "attributes": {
                "name": item.name,
                "quantity": item.quantity,
                "price": item.price
            },
        },
        "links": {
            "self": f'/items/{item.id}',
        }
    }

def test_create_item_with_attribute_validation_error():
    response = client.post(
        "/items",
        json={
            "data": {
                "type": "item",
                "attributes": {}
            }
        }
    )
    assert response.status_code == HTTP_422_UNPROCESSABLE_ENTITY
    assert response.json() == {
      'errors': [{
          'status': str(HTTP_422_UNPROCESSABLE_ENTITY),
          'title': 'value_error.missing',
          'detail': 'field required',
          'source': {
            'pointer': '/body/item_request/data/attributes/name',
          }
      },
      {
          'status': str(HTTP_422_UNPROCESSABLE_ENTITY),
          'title': 'value_error.missing',
          'detail': 'field required',
          'source': {
            'pointer': '/body/item_request/data/attributes/quantity',
          }
      },
      {
          'status': str(HTTP_422_UNPROCESSABLE_ENTITY),
          'title': 'value_error.missing',
          'detail': 'field required',
          'source': {
            'pointer': '/body/item_request/data/attributes/price',
          }
      }]
    }
