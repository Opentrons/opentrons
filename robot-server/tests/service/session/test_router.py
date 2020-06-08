import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

import typing

from opentrons.calibration.check.models import SessionType, JogPosition
from pydantic.main import BaseModel

from robot_server.service.dependencies import get_session_manager
from robot_server.service.session.command_execution import CommandExecutor, \
    Command
from robot_server.service.session.errors import SessionCreationException, \
    UnsupportedCommandException, CommandExecutionException
from robot_server.service.session.models import CommandName, EmptyModel
from robot_server.service.session.session_types import NullSession, \
    SessionMetaData


@pytest.fixture
def mock_session_meta():
    return SessionMetaData(identifier="some_id",
                           name="session name",
                           description="session description",
                           created_at=datetime(2000, 1, 1, 0, 0, 0))


@pytest.fixture
def session_response(mock_session_meta):
    return {
        'attributes': {
            'details': {
            },
            'sessionType': 'null',
        },
        'type': 'Session',
        'id': mock_session_meta.identifier
    }


@pytest.fixture
def command_id():
    return "123"


@pytest.fixture
def mock_command_executor(command_id):
    mock = MagicMock(spec=CommandExecutor)

    async def func(command, data):
        ret_val = Command(name=command,
                          data=data)
        ret_val._created_at = datetime(2020, 1, 1)
        ret_val._id = command_id
        return ret_val

    mock.execute.side_effect = func
    return mock


@pytest.fixture
def mock_session(mock_session_meta, mock_command_executor):
    session = NullSession(configuration=MagicMock(),
                          instance_meta=mock_session_meta)

    session._command_executor = mock_command_executor

    async def func(*args, **kwargs):
        pass

    session.clean_up = MagicMock(side_effect=func)
    return session


@pytest.fixture
def patch_create_session(mock_session):
    r = "robot_server.service.session.session_types.BaseSession.create"
    with patch(r) as p:
        async def mock_build(*args, **kwargs):
            return mock_session
        p.side_effect = mock_build
        yield p


@pytest.fixture
@pytest.mark.asyncio
async def session_manager_with_session(loop, patch_create_session):
    manager = get_session_manager()
    session = await manager.add(SessionType.null)

    yield manager

    await manager.remove(session.meta.identifier)


def test_create_session_error(api_client,
                              patch_create_session):
    async def raiser(*args, **kwargs):
        raise SessionCreationException(
            "Please attach pipettes before proceeding"
        )

    patch_create_session.side_effect = raiser

    response = api_client.post("/sessions", json={
        "data": {
            "type": "Session",
            "attributes": {
                "sessionType": "null"
            }
        }
    })
    assert response.json() == {
        'errors': [{
            'detail': "Failed to create session of type 'null': Please "
                      "attach pipettes before proceeding.",
            'status': '400',
            'title': 'Creation Failed'}
        ]}
    assert response.status_code == 400


def test_create_session(api_client,
                        patch_create_session,
                        mock_session_meta,
                        session_response):
    response = api_client.post("/sessions", json={
        "data": {
            "type": "Session",
            "attributes": {
                "sessionType": "null"
            }
        }
    })
    assert response.json() == {
        'data': session_response,
        'links': {
            'POST': {
                'href': f'/sessions/{mock_session_meta.identifier}/commands/execute',  # noqa: E501
            },
            'GET': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
            'DELETE': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
        }
    }
    assert response.status_code == 201
    # Clean up
    get_session_manager()._sessions = {}


def test_delete_session_not_found(api_client):
    response = api_client.delete("/sessions/check")
    assert response.json() == {
        'errors': [{
            'detail': "Cannot find session with id 'check'.",
            'links': {'POST': '/sessions'},
            'status': '404',
            'title': 'No session'
        }]
    }
    assert response.status_code == 404


def test_delete_session(api_client,
                        session_manager_with_session,
                        mock_session,
                        mock_session_meta,
                        session_response):
    response = api_client.delete(f"/sessions/{mock_session_meta.identifier}")
    # mock_session.clean_up.assert_called_once()
    assert response.json() == {
        'data': session_response,
        'links': {
            'POST': {
                'href': '/sessions',
            },
        }
    }
    assert response.status_code == 200


def test_get_session_not_found(api_client):
    response = api_client.get("/sessions/1234")
    assert response.json() == {
        'errors': [{
            'detail': "Cannot find session with id '1234'.",
            'links': {'POST': '/sessions'},
            'status': '404',
            'title': 'No session'
        }]
    }
    assert response.status_code == 404


def test_get_session(api_client,
                     mock_session_meta,
                     session_manager_with_session,
                     session_response):
    response = api_client.get(f"/sessions/{mock_session_meta.identifier}")
    assert response.json() == {
        'data': session_response,
        'links': {
            'POST': {
                'href': f'/sessions/{mock_session_meta.identifier}/commands/execute',  # noqa: e5011
            },
            'GET': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
            'DELETE': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
        }
    }
    assert response.status_code == 200


def test_get_sessions_no_sessions(api_client):
    response = api_client.get("/sessions")
    assert response.json() == {
        'data': [],
    }
    assert response.status_code == 200


def test_get_sessions(api_client,
                      session_manager_with_session,
                      session_response):
    response = api_client.get("/sessions")
    assert response.json() == {
        'data': [session_response],
    }
    assert response.status_code == 200


def command(command_type: str, body: typing.Optional[BaseModel]):
    """Helper to create command"""
    return {
        "data": {
            "type": "SessionCommand",
            "attributes": {
                "command": command_type,
                "data": body.dict(exclude_unset=True) if body else {}
            }
        }
    }


def test_execute_command_no_session(api_client, mock_session_meta):
    """Test that command is rejected if there's no session"""
    response = api_client.post(
        f"/sessions/{mock_session_meta.identifier}/commands/execute",
        json=command("jog",
                     JogPosition(vector=(1, 2, 3,))))
    assert response.json() == {
        'errors': [{
            'detail': f"Cannot find session with id '{mock_session_meta.identifier}'.",  # noqa: e501
            'links': {'POST': '/sessions'},
            'status': '404',
            'title': 'No session'
        }]
    }
    assert response.status_code == 404


def test_execute_command(api_client,
                         session_manager_with_session,
                         mock_session_meta,
                         mock_command_executor,
                         command_id):
    response = api_client.post(
        f"/sessions/{mock_session_meta.identifier}/commands/execute",
        json=command("jog",
                     JogPosition(vector=(1, 2, 3,))))

    mock_command_executor.execute.assert_called_once_with(
        command=CommandName.jog,
        data=JogPosition(vector=(1, 2, 3,)))

    assert response.json() == {
        'data': {
            'attributes': {
                'command': 'jog',
                'data': {'vector': [1.0, 2.0, 3.0]},
                'status': 'executed'
            },
            'type': 'SessionCommand',
            'id': command_id,
        },
        'links': {
            'POST': {
                'href': f'/sessions/{mock_session_meta.identifier}/commands/execute',  # noqa: e501
            },
            'GET': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
            'DELETE': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
        }
    }
    assert response.status_code == 200


def test_execute_command_no_body(api_client,
                                 session_manager_with_session,
                                 mock_session_meta,
                                 command_id,
                                 mock_command_executor):
    """Test that a command with empty body can be accepted"""
    response = api_client.post(
        f"/sessions/{mock_session_meta.identifier}/commands/execute",
        json=command("loadLabware", None)
    )

    mock_command_executor.execute.assert_called_once_with(
        command=CommandName.load_labware,
        data=EmptyModel()
    )

    assert response.json() == {
        'data': {
            'attributes': {
                'command': 'loadLabware',
                'data': {},
                'status': 'executed'
            },
            'type': 'SessionCommand',
            'id': command_id
        },
        'links': {
            'POST': {
                'href': f'/sessions/{mock_session_meta.identifier}/commands/execute',  # noqa: e501
            },
            'GET': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
            'DELETE': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
        }
    }
    assert response.status_code == 200


@pytest.mark.parametrize(argnames="exception,expected_status",
                         argvalues=[
                             [UnsupportedCommandException, 400],
                             [CommandExecutionException, 400],
                         ])
def test_execute_command_error(api_client,
                               session_manager_with_session,
                               mock_session_meta,
                               mock_command_executor,
                               exception,
                               expected_status):
    """Test that we handle executor errors correctly"""
    async def raiser(*args, **kwargs):
        raise exception("Cannot do it")

    mock_command_executor.execute.side_effect = raiser

    response = api_client.post(
        f"/sessions/{mock_session_meta.identifier}/commands/execute",
        json=command("jog",
                     JogPosition(vector=(1, 2, 3,)))
    )

    assert response.json() == {
        'errors': [
            {
                'detail': 'Cannot do it',
                'status': f'{expected_status}',
                'title': 'Command execution error'
            }
        ]
    }
    assert response.status_code == expected_status


def test_execute_command_session_inactive(
        api_client,
        session_manager_with_session,
        mock_session_meta,
        mock_command_executor):
    """Test that only the active session can execute commands"""
    session_manager_with_session._active_session_id = None

    response = api_client.post(
        f"/sessions/{mock_session_meta.identifier}/commands/execute",
        json=command("jog",
                     JogPosition(vector=(1, 2, 3,)))
    )

    assert response.json() == {
        'errors': [
            {
                'detail': 'Only the active session can execute commands',
                'status': '403',
                'title': f"Session '{mock_session_meta.identifier}'"
                         f" is not active"
            }
        ]
    }
    assert response.status_code == 403
