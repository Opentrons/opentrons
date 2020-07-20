import pytest
from unittest.mock import MagicMock
from datetime import datetime, timezone
from opentrons.system import time


@pytest.fixture
def mock_system_time():
    return datetime(2020, 8, 14, 21, 44, 16, tzinfo=timezone.utc)


@pytest.fixture
def response_links():
    return {
        "GET": {
            "href": "/system/time",
            "meta": None
        },
        "PUT": {
            "href": "/system/time",
            "meta": None
        }
    }


def test_raise_system_synchronized_error(api_client, mock_system_time):
    async def mock_set_system_time(*args, **kwargs):
        return mock_system_time, "Cannot set system time; " \
                               "already synchronized with NTP or RTC"

    time.set_system_time = MagicMock(side_effect=mock_set_system_time)

    response = api_client.put("/system/time", json={
        "data": {
            "id": "time",
            "type": "SystemTimeAttributes",
            "attributes": {"systemTime": mock_system_time.isoformat()}
        }
    })
    assert response.json() == {'errors': [{
        'detail': 'Cannot set system time; already synchronized with NTP '
                  'or RTC',
        'status': '403',
        'title': 'Action Forbidden'}]}
    assert response.status_code == 403


def test_raise_system_exception(api_client, mock_system_time):
    async def mock_set_system_time(*args, **kwargs):
        return mock_system_time, "Something went wrong."

    time.set_system_time = MagicMock(side_effect=mock_set_system_time)

    response = api_client.put("/system/time", json={
        "data": {
            "id": "time",
            "type": "SystemTimeAttributes",
            "attributes": {"systemTime": mock_system_time.isoformat()}
        }
    })
    assert response.json() == {'errors': [{
        'detail': 'Something went wrong.',
        'status': '500',
        'title': 'Internal Server Error'}]}
    assert response.status_code == 500


def test_get_system_time(api_client, mock_system_time, response_links):
    async def mock_get_system_time(*args, **kwargs):
        return mock_system_time
    time.get_system_time = MagicMock(side_effect=mock_get_system_time)

    response = api_client.get("/system/time")
    assert response.json() == {
        'data': {
            'attributes': {'systemTime': mock_system_time.isoformat()},
            'id': 'time',
            'type': 'SystemTimeAttributes'},
        'links': response_links,
        'meta': None
    }
    assert response.status_code == 200


def test_set_with_missing_field(api_client, mock_system_time):

    response = api_client.put("/system/time")
    assert response.json() == {
        'errors': [{
            'detail': 'field required',
            'source': {'pointer': '/body/new_time'},
            'status': '422',
            'title': 'value_error.missing'}]}
    assert response.status_code == 422


def test_set_system_time(api_client, mock_system_time, response_links):
    async def mock_set_system_time(*args, **kwargs):
        return mock_system_time, ""

    time.set_system_time = MagicMock(side_effect=mock_set_system_time)

    # Correct request
    response = api_client.put("/system/time",
                              json={
                                  'data': {
                                      'attributes': {
                                          'systemTime':
                                              mock_system_time.isoformat()},
                                      'id': 'time',
                                      'type': 'SystemTimeAttributes'},
                              })
    assert response.json() == {
        'data': {
            'attributes': {'systemTime': mock_system_time.isoformat()},
            'id': 'time',
            'type': 'SystemTimeAttributes'},
        'links': response_links,
        'meta': None
    }
    assert response.status_code == 200
