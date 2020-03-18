from unittest.mock import patch
import pytest

from opentrons.deck_calibration import endpoints

CREATE_SESSION_PATCH = "opentrons.server.endpoints." \
                       "deck_calibration.dc.create_session"
DISPATCH_PATCH = "opentrons.server.endpoints.deck_calibration.dc.dispatch"


@pytest.mark.parametrize(argnames=["body", "args"],
                         argvalues=[
                             [None, False],
                             [{}, False],
                             [{"force": None}, False],
                             [{"force": True}, True],
                         ])
async def test_start_call(async_client, hardware, body, args):
    with patch(CREATE_SESSION_PATCH) as p:
        await async_client.post('/calibration/deck/start', json=body)
        p.assert_called_once_with(args, hardware)


async def test_start_response(async_client):
    with patch(CREATE_SESSION_PATCH) as p:
        async def mock_create_session(*args, **kwargs):
            return endpoints.CreateSessionResult(token="my token",
                                                 pipette={"left": 3})

        p.side_effect = mock_create_session
        response = await async_client.post('/calibration/deck/start')

        assert response.status == 201
        assert await response.json() == {"token": "my token",
                                         "pipette": {"left": 3}}


@pytest.mark.parametrize(argnames=["exception_to_raise", "expected_status"],
                         argvalues=[
                             [endpoints.SessionForbidden("forbidden"), 403],
                             [endpoints.SessionInProgress("in prog’"), 409],
                         ])
async def test_start_error_response(async_client, exception_to_raise,
                                    expected_status):
    with patch(CREATE_SESSION_PATCH) as p:
        async def mock_create_session(*args, **kwargs):
            raise exception_to_raise

        p.side_effect = mock_create_session
        response = await async_client.post('/calibration/deck/start')

        assert response.status == expected_status
        assert await response.json() == {"message": str(exception_to_raise)}


@pytest.mark.parametrize(argnames=["body", "args"],
                         argvalues=[
                             [{"token": "123",
                               "command": "hi"},
                              {"token": "123",
                               "command": "hi",
                               "command_data": {}}
                              ],
                             [{"token": "321",
                               "command": "bye",
                               "arg1": 2,
                               "arg2": "whatever"},
                              {"token": "321",
                               "command": "bye",
                               "command_data": {
                                   "arg1": 2,
                                   "arg2": "whatever"
                               }}
                              ],
                         ])
async def test_dispatch_call(async_client, body, args):
    with patch(DISPATCH_PATCH) as p:
        await async_client.post('/calibration/deck', json=body)
        p.assert_called_once_with(**args)


@pytest.mark.parametrize(argnames=["success", "message", "expected_status"],
                         argvalues=[
                             [True, "hooray", 200],
                             [False, "booray", 400],
                         ])
async def test_dispatch_call_response(async_client,
                                      success,
                                      message,
                                      expected_status):
    with patch(DISPATCH_PATCH) as p:
        async def mock_dispatch(*args, **kwargs):
            return endpoints.CommandResult(success=success, message=message)

        p.side_effect = mock_dispatch
        response = await async_client.post('/calibration/deck',
                                           json={"token": "123",
                                                 "command": "321"})

        assert response.status == expected_status
        assert await response.json() == {"message": message}


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
async def test_dispatch_error_response(async_client,
                                       exception_to_raise,
                                       expected_status):
    with patch(DISPATCH_PATCH) as p:
        async def mock_dispatch(*args, **kwargs):
            raise exception_to_raise

        p.side_effect = mock_dispatch
        response = await async_client.post('/calibration/deck',
                                           json={
                                               "token": "123",
                                               "command": "321"
                                           })

        assert response.status == expected_status


@pytest.mark.parametrize(argnames=["body"],
                         argvalues=[
                             [{}],
                             [{"token": "boo"}],
                             [{"command": "boo"}],
                             [{"boo": "boo"}],
                         ])
async def test_dispatch_validation_error(async_client, body):
    response = await async_client.post('/calibration/deck', json=body)
    assert response.status == 400
