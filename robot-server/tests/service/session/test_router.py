import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

import typing

from pydantic.main import BaseModel

from robot_server.service.dependencies import get_session_manager
from robot_server.service.session.command_execution import CommandExecutor, \
    Command
from robot_server.service.session.command_execution.command import \
    CommandResult, CompletedCommand, CommandContent, CommandMeta, CommandStatus
from robot_server.service.session.errors import SessionCreationException, \
    UnsupportedCommandException, CommandExecutionException
from robot_server.service.session.models import CalibrationCommand, \
    EmptyModel, SessionType, JogPosition
from robot_server.service.session.session_types import NullSession, \
    SessionMetaData


@pytest.fixture
def mock_session_meta():
    return SessionMetaData(identifier="some_id",
                           created_at=datetime(2000, 1, 1, 0, 0, 0))


@pytest.fixture
def session_response(mock_session_meta):
    return {
        'attributes': {
            'details': {
            },
            'sessionType': 'null',
            'createdAt': mock_session_meta.created_at.isoformat(),
            'createParams': None,
        },
        'type': 'Session',
        'id': mock_session_meta.identifier
    }


@pytest.fixture
def command_id():
    return "123"


@pytest.fixture
def command_created_at():
    return datetime(2000, 1, 1)


@pytest.fixture
def patch_create_command(command_id, command_created_at):
    with patch("robot_server.service.session.router.create_command") as p:
        p.side_effect = lambda c, n: Command(
            content=CommandContent(c, n),
            meta=CommandMeta(command_id, command_created_at))
        yield p


@pytest.fixture
def mock_command_executor():
    mock = MagicMock(spec=CommandExecutor)

    async def func(command):
        return CompletedCommand(content=command.content,
                                meta=command.meta,
                                result=CommandResult(
                                    status=CommandStatus.executed,
                                    started_at=datetime(2019, 1, 1),
                                    completed_at=datetime(2020, 1, 1))
                                )

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
    session = await manager.add(SessionType.null, SessionMetaData())

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
            'detail': "Please attach pipettes before proceeding",
            'status': '403',
            'title': 'Action Forbidden'}
        ]}
    assert response.status_code == 403


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
            'commandExecute': {
                'href': f'/sessions/{mock_session_meta.identifier}/commands/execute',  # noqa: E501
            },
            'self': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
            'sessions': {
                'href': '/sessions'
            },
            'sessionById': {
                'href': '/sessions/{sessionId}'
            }
        }
    }
    assert response.status_code == 201
    # Clean up
    get_session_manager()._sessions = {}


def test_delete_session_not_found(api_client):
    response = api_client.delete("/sessions/check")
    assert response.json() == {
        'errors': [{
            'detail': "Resource type 'session' with id 'check' was not found",
            'links': {
                'self': {'href': '/sessions'},
                'sessionById': {'href': '/sessions/{sessionId}'}
            },
            'status': '404',
            'title': 'Resource Not Found'
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
            'self': {
                'href': '/sessions',
            },
            'sessionById': {
                'href': '/sessions/{sessionId}'
            },
        }
    }
    assert response.status_code == 200


def test_get_session_not_found(api_client):
    response = api_client.get("/sessions/1234")
    assert response.json() == {
        'errors': [{
            'detail': "Resource type 'session' with id '1234' was not found",
            'links': {
                'self': {'href': '/sessions'},
                'sessionById': {'href': '/sessions/{sessionId}'}
            },
            'status': '404',
            'title': 'Resource Not Found'
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
            'commandExecute': {
                'href': f'/sessions/{mock_session_meta.identifier}/commands/execute',  # noqa: e5011
            },
            'self': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
            'sessions': {
                'href': '/sessions'
            },
            'sessionById': {
                'href': '/sessions/{sessionId}'
            }
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
            'detail': f"Resource type 'session' with id '{mock_session_meta.identifier}' was not found",  # noqa: e5011
            'links': {
                'self': {'href': '/sessions'},
                'sessionById': {'href': '/sessions/{sessionId}'}
            },
            'status': '404',
            'title': 'Resource Not Found'
        }]
    }
    assert response.status_code == 404


def test_execute_command(api_client,
                         session_manager_with_session,
                         mock_session_meta,
                         mock_command_executor,
                         command_id,
                         command_created_at,
                         patch_create_command):
    response = api_client.post(
        f"/sessions/{mock_session_meta.identifier}/commands/execute",
        json=command("calibration.jog",
                     JogPosition(vector=(1, 2, 3,))))

    mock_command_executor.execute.assert_called_once_with(
        Command(
            content=CommandContent(
                name=CalibrationCommand.jog,
                data=JogPosition(vector=(1, 2, 3,))
            ),
            meta=CommandMeta(identifier=command_id,
                             created_at=command_created_at)
        )
    )

    assert response.json() == {
        'data': {
            'attributes': {
                'command': 'calibration.jog',
                'data': {'vector': [1.0, 2.0, 3.0]},
                'status': 'executed',
                'createdAt': '2000-01-01T00:00:00',
                'startedAt': '2019-01-01T00:00:00',
                'completedAt': '2020-01-01T00:00:00',
            },
            'type': 'SessionCommand',
            'id': command_id,
        },
        'links': {
            'commandExecute': {
                'href': f'/sessions/{mock_session_meta.identifier}/commands/execute',  # noqa: e501
            },
            'self': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
            'sessions': {
                'href': '/sessions'
            },
            'sessionById': {
                'href': '/sessions/{sessionId}'
            },
        }
    }
    assert response.status_code == 200


def test_execute_command_no_body(api_client,
                                 session_manager_with_session,
                                 mock_session_meta,
                                 patch_create_command,
                                 command_id,
                                 command_created_at,
                                 mock_command_executor):
    """Test that a command with empty body can be accepted"""
    response = api_client.post(
        f"/sessions/{mock_session_meta.identifier}/commands/execute",
        json=command("calibration.loadLabware", None)
    )

    mock_command_executor.execute.assert_called_once_with(
        Command(
            content=CommandContent(
                name=CalibrationCommand.load_labware,
                data=EmptyModel()),
            meta=CommandMeta(command_id, command_created_at)
        )
    )

    assert response.json() == {
        'data': {
            'attributes': {
                'command': 'calibration.loadLabware',
                'data': {},
                'status': 'executed',
                'createdAt': '2000-01-01T00:00:00',
                'startedAt': '2019-01-01T00:00:00',
                'completedAt': '2020-01-01T00:00:00',
            },
            'type': 'SessionCommand',
            'id': command_id
        },
        'links': {
            'commandExecute': {
                'href': f'/sessions/{mock_session_meta.identifier}/commands/execute',  # noqa: e501
            },
            'self': {
                'href': f'/sessions/{mock_session_meta.identifier}',
            },
            'sessions': {
                'href': '/sessions'
            },
            'sessionById': {
                'href': '/sessions/{sessionId}'
            },
        }
    }
    assert response.status_code == 200


@pytest.mark.parametrize(argnames="exception,expected_status",
                         argvalues=[
                             [UnsupportedCommandException, 403],
                             [CommandExecutionException, 403],
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
                'title': 'Action Forbidden'
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
    session_manager_with_session._active.active_id = None

    response = api_client.post(
        f"/sessions/{mock_session_meta.identifier}/commands/execute",
        json=command("jog",
                     JogPosition(vector=(1, 2, 3,)))
    )

    assert response.json() == {
        'errors': [
            {
                'title': 'Action Forbidden',
                'status': '403',
                'detail': f"Session '{mock_session_meta.identifier}'"
                         f" is not active. Only the active session can "
                         f"execute commands"
            }
        ]
    }
    assert response.status_code == 403
