import uuid
from unittest.mock import patch
import pytest
import typing

from opentrons.deck_calibration import endpoints

CREATE_SESSION_PATCH = "robot_server.service.routers." \
                       "deck_calibration.dc.create_session"
DISPATCH_PATCH = "robot_server.service.routers.deck_calibration.dc.dispatch"


@pytest.fixture
def test_token() -> str:
    return str(uuid.uuid1())


@pytest.fixture
def test_pipette_response() -> typing.Dict:
    return {
        "mount": "right",
        "model": "model"
    }


@pytest.mark.parametrize(argnames=["body", "args"],
                         argvalues=[
                             [None, False],
                             [{}, False],
                             [{"force": False}, False],
                             [{"force": True}, True],
                         ])
def test_start_call(api_client, hardware, body, args,
                    test_token, test_pipette_response):
    with patch(CREATE_SESSION_PATCH) as p:
        async def mock_create_session(*args, **kwargs):
            return endpoints.CreateSessionResult(token=test_token,
                                                 pipette=test_pipette_response)

        p.side_effect = mock_create_session
        api_client.post('/calibration/deck/start', json=body)
        p.assert_called_once_with(args, hardware)


def test_start_response(api_client, test_token, test_pipette_response):
    with patch(CREATE_SESSION_PATCH) as p:
        async def mock_create_session(*args, **kwargs):
            return endpoints.CreateSessionResult(token=test_token,
                                                 pipette=test_pipette_response)

        p.side_effect = mock_create_session
        response = api_client.post('/calibration/deck/start')

        assert response.status_code == 201
        assert response.json() == {"token": test_token,
                                   "pipette": test_pipette_response}


@pytest.mark.parametrize(argnames=["exception_to_raise", "expected_status"],
                         argvalues=[
                             [endpoints.SessionForbidden("forbidden"), 403],
                             [endpoints.SessionInProgress("in prog’"), 409],
                         ])
def test_start_error_response(api_client, exception_to_raise,
                              expected_status, test_token):
    with patch(CREATE_SESSION_PATCH) as p:
        async def mock_create_session(*args, **kwargs):
            raise exception_to_raise

        p.side_effect = mock_create_session
        response = api_client.post('/calibration/deck/start')

        assert response.status_code == expected_status
        assert response.json() == {"message": str(exception_to_raise)}


@pytest.mark.parametrize(argnames=["body", "args"],
                         argvalues=[
                             [{"token": "f0000000-0000-0000-0001-000000000000",
                               "command": "attach tip"},
                              {"token": "f0000000-0000-0000-0001-000000000000",
                               "command": "attach tip",
                               "command_data": {}}
                              ],
                             [{"token": "f0000000-0000-0000-0000-000000000000",
                               "command": "attach tip",
                               "tipLength": 0.1,
                               "point": "safeZ",
                               "axis": "x",
                               "direction": -1,
                               "step": 0.1
                               },
                              {"token": "f0000000-0000-0000-0000-000000000000",
                               "command": "attach tip",
                               "command_data": {
                                   "tipLength": 0.1,
                                   "point": "safeZ",
                                   "axis": "x",
                                   "direction": -1,
                                   "step": 0.1
                               }}
                              ],
                         ])
def test_dispatch_call(api_client, body, args):
    with patch(DISPATCH_PATCH) as p:
        api_client.post('/calibration/deck', json=body)
        p.assert_called_once_with(**args)


@pytest.mark.parametrize(argnames=["success", "message", "expected_status"],
                         argvalues=[
                             [True, "hooray", 200],
                             [False, "booray", 400],
                         ])
def test_dispatch_call_response(api_client,
                                test_token,
                                success,
                                message,
                                expected_status):
    with patch(DISPATCH_PATCH) as p:
        async def mock_dispatch(*args, **kwargs):
            return endpoints.CommandResult(success=success, message=message)

        p.side_effect = mock_dispatch
        response = api_client.post('/calibration/deck',
                                   json={"token": test_token,
                                         "command": "jog"})

        assert response.status_code == expected_status
        assert response.json() == {"message": message}


@pytest.mark.parametrize(argnames=["exception_to_raise",
                                   "expected_status"],
                         argvalues=[
                             [endpoints.NoSessionInProgress("nosession"),
                              418
                              ],
                             [endpoints.SessionForbidden("cant do it"),
                              403
                              ],
                             [AssertionError("assertion"),
                              400
                              ],
                             [KeyError("Some Error"),
                              500,
                              ],
                         ])
def test_dispatch_error_response(api_client,
                                 test_token,
                                 exception_to_raise,
                                 expected_status):
    with patch(DISPATCH_PATCH) as p:
        async def mock_dispatch(*args, **kwargs):
            raise exception_to_raise

        p.side_effect = mock_dispatch
        response = api_client.post('/calibration/deck',
                                   json={
                                       "token": test_token,
                                       "command": "attach tip"
                                   })

        assert response.status_code == expected_status


@pytest.mark.parametrize(argnames=["body"],
                         argvalues=[
                             [{}],
                             [{
                                 "token": '00000000-0000-0000'
                                          '-0001-000000000000'
                             }],
                             [{"command": "boo"}],
                             [{
                                 "token": 'not a uuid',
                                 "command": "attach tip"
                             }],
                             [{"boo": "boo"}],
                         ])
def test_dispatch_validation_error(api_client, body):
    response = api_client.post('/calibration/deck', json=body)
    assert response.status_code == 422
