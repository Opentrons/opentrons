from http import HTTPStatus


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
