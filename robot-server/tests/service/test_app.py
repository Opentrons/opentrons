import pytest
from http import HTTPStatus

from robot_server.constants import API_VERSION_HEADER, API_VERSION


def test_unhandled_exception_handler(api_client_no_errors):
    resp = api_client_no_errors.get('/alwaysRaise')
    text = resp.json()
    expected = {
        'errors': [
            {'title': 'Internal Server Error',
             'status': '500',
             'detail': "Unhandled exception: <class 'RuntimeError'>"}
        ]
    }
    assert text == expected
    assert resp.status_code == HTTPStatus.INTERNAL_SERVER_ERROR


def test_custom_http_exception_handler(api_client):

    expected = {
        'message': HTTPStatus.METHOD_NOT_ALLOWED.phrase
    }
    resp = api_client.post('/health')

    text = resp.json()
    assert resp.status_code == HTTPStatus.METHOD_NOT_ALLOWED
    assert text == expected


def test_custom_request_validation_exception_handler(api_client):

    expected = {
        "message": "operation.command: value is not a valid enumeration "
                   "member; permitted: 'jog', 'move', 'save xy', 'attach tip',"
                   " 'detach tip', 'save z', 'save transform', 'release'. "
                   "operation.point: value is not a valid enumeration member;"
                   " permitted: '1', '2', '3', 'safeZ', 'attachTip'"
    }
    resp = api_client.post('/calibration/deck',
                           json={
                               "token": "1fdec5cc-234a-11ea-b24d-f2189817b27e",
                               "command": 123,  # Invalid command
                               "tipLength": 0,
                               "point": "true",  # Invalid point
                               "axis": "x",
                               "direction": 1,
                               "step": 0}
                           )
    text = resp.json()
    assert resp.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
    assert text == expected


@pytest.mark.parametrize(
    argnames=["headers", "expected_version"],
    argvalues=[
        [
            {API_VERSION_HEADER: str(API_VERSION)},
            API_VERSION,
        ],
        [
            {API_VERSION_HEADER: str(API_VERSION + 3)},
            API_VERSION,
        ],
        [
            {API_VERSION_HEADER: str(API_VERSION - 1)},
            API_VERSION - 1,
        ],
        [
            {},
            API_VERSION,
        ],
        [
            {API_VERSION_HEADER: "not a number"},
            API_VERSION,
        ],
    ])
def test_api_versioning(api_client, headers, expected_version):
    resp = api_client.get('/openapi', headers=headers)
    assert resp.headers.get(API_VERSION_HEADER) == str(expected_version)
