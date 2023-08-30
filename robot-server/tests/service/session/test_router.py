import pytest
from mock import AsyncMock, MagicMock
from datetime import datetime
from decoy import matchers

from robot_server.service.dependencies import get_session_manager
from robot_server.service.errors import RobotServerError
from robot_server.service.session.errors import (
    SessionCreationException,
    UnsupportedCommandException,
    CommandExecutionException,
)
from robot_server.service.session.manager import SessionManager
from robot_server.service.session.models.command import (
    SimpleCommandRequest,
    SimpleCommandResponse,
    CommandStatus,
)
from robot_server.service.session.models.common import EmptyModel
from robot_server.service.session.models.command_definitions import ProtocolCommand
from robot_server.service.session import router
from robot_server.service.session.session_types import BaseSession
from robot_server.robot.calibration.deck.models import DeckCalibrationSessionStatus
from robot_server.robot.calibration.helper_classes import AttachedPipette


@pytest.fixture
def mock_session_manager():
    return AsyncMock(spec=SessionManager)


@pytest.fixture
def mock_session():
    session = AsyncMock(spec=BaseSession)
    session.meta.identifier = "some id"
    session.meta.created_at = datetime(2020, 1, 1)
    session.meta.create_params = None
    session.get_response_model.return_value = {
        "id": session.meta.identifier,
        "createdAt": session.meta.created_at,
        "createParams": session.meta.create_params,
        "details": DeckCalibrationSessionStatus(
            instrument=AttachedPipette(),
            currentStep="current-step",
            labware=[],
            supportedCommands=[],
        ),
    }
    return session


@pytest.fixture
def sessions_api_client(mock_session_manager, api_client):
    """Test api client that overrides get_session_manager dependency."""

    async def get():
        return mock_session_manager

    api_client.app.dependency_overrides[get_session_manager] = get
    yield api_client
    del api_client.app.dependency_overrides[get_session_manager]


def test_get_session(mock_session_manager):
    """It gets the session from session manager"""
    session_id = "sess"
    mock_session = MagicMock()
    mock_session_manager.get_by_id.return_value = mock_session

    session = router.get_session(mock_session_manager, session_id)

    mock_session_manager.get_by_id.called_once_with(session_id)

    assert session is mock_session


def test_get_session_not_found(mock_session_manager):
    """It raises an exception if session is not found"""
    session_id = "sess"
    mock_session_manager.get_by_id.return_value = None

    with pytest.raises(RobotServerError):
        router.get_session(mock_session_manager, session_id)


def test_sessions_create_error(sessions_api_client, mock_session_manager):
    """It raises an error if session manager raises an exception."""

    async def raiser(*args, **kwargs):
        raise SessionCreationException("Please attach pipettes before proceeding")

    mock_session_manager.add.side_effect = raiser

    response = sessions_api_client.post(
        "/sessions", json={"data": {"sessionType": "deckCalibration"}}
    )
    assert response.json() == {
        "errors": [
            {
                "id": "UncategorizedError",
                "detail": "Please attach pipettes before proceeding",
                "title": "Action Forbidden",
                "errorCode": "4000",
            }
        ]
    }
    assert response.status_code == 403


def test_sessions_create(sessions_api_client, mock_session_manager, mock_session):
    """It creates a session."""
    mock_session_manager.add.return_value = mock_session

    response = sessions_api_client.post(
        "/sessions",
        json={"data": {"sessionType": "deckCalibration", "createParams": {}}},
    )
    assert response.json() == {
        "data": {
            "details": {
                "instrument": {
                    "model": None,
                    "name": None,
                    "tipLength": None,
                    "mount": None,
                    "serial": None,
                    "defaultTipracks": None,
                },
                "currentStep": "current-step",
                "labware": [],
                "supportedCommands": [],
            },
            "sessionType": "deckCalibration",
            "createdAt": mock_session.meta.created_at.isoformat(),
            "createParams": None,
            "id": mock_session.meta.identifier,
        },
        "links": {
            "commandExecute": {
                "href": f"/sessions/{mock_session.meta.identifier}/commands/execute",
                "meta": None,
            },
            "self": {
                "href": f"/sessions/{mock_session.meta.identifier}",
                "meta": None,
            },
            "sessions": {
                "href": "/sessions",
                "meta": None,
            },
            "sessionById": {
                "href": "/sessions/{sessionId}",
                "meta": None,
            },
        },
    }
    assert response.status_code == 201


def test_sessions_delete_not_found(sessions_api_client, mock_session_manager):
    """It fails when session is not found"""
    mock_session_manager.get_by_id.return_value = None

    response = sessions_api_client.delete("/sessions/check")
    assert response.json() == {
        "errors": [
            {
                "id": "UncategorizedError",
                "title": "Resource Not Found",
                "detail": "Resource type 'session' with id 'check' was not found",
                "errorCode": "4000",
            }
        ],
        "links": {
            "self": {"href": "/sessions"},
            "sessionById": {"href": "/sessions/{sessionId}"},
        },
    }
    assert response.status_code == 404


def test_sessions_delete(sessions_api_client, mock_session_manager, mock_session):
    """It deletes a found session."""
    mock_session_manager.get_by_id.return_value = mock_session

    response = sessions_api_client.delete(f"/sessions/{mock_session.meta.identifier}")

    mock_session_manager.remove.assert_called_once_with(mock_session.meta.identifier)
    assert response.json() == {
        "data": {
            "details": matchers.Anything(),
            "sessionType": "deckCalibration",
            "createdAt": mock_session.meta.created_at.isoformat(),
            "createParams": None,
            "id": mock_session.meta.identifier,
        },
        "links": {
            "self": {
                "href": "/sessions",
                "meta": None,
            },
            "sessionById": {
                "href": "/sessions/{sessionId}",
                "meta": None,
            },
        },
    }
    assert response.status_code == 200


def test_sessions_get_not_found(mock_session_manager, sessions_api_client):
    """It returns an error when session is not found."""
    mock_session_manager.get_by_id.return_value = None

    response = sessions_api_client.get("/sessions/1234")
    assert response.json() == {
        "errors": [
            {
                "id": "UncategorizedError",
                "detail": "Resource type 'session' with id '1234' was not found",
                "title": "Resource Not Found",
                "errorCode": "4000",
            }
        ],
        "links": {
            "self": {"href": "/sessions"},
            "sessionById": {"href": "/sessions/{sessionId}"},
        },
    }
    assert response.status_code == 404


def test_sessions_get(sessions_api_client, mock_session_manager, mock_session):
    """It returns the found session."""
    mock_session_manager.get_by_id.return_value = mock_session

    response = sessions_api_client.get(f"/sessions/{mock_session.meta.identifier}")
    assert response.json() == {
        "data": {
            "details": matchers.Anything(),
            "sessionType": "deckCalibration",
            "createdAt": mock_session.meta.created_at.isoformat(),
            "createParams": None,
            "id": mock_session.meta.identifier,
        },
        "links": {
            "commandExecute": {
                "href": f"/sessions/{mock_session.meta.identifier}/commands/execute",
                "meta": None,
            },
            "self": {
                "href": f"/sessions/{mock_session.meta.identifier}",
                "meta": None,
            },
            "sessions": {
                "href": "/sessions",
                "meta": None,
            },
            "sessionById": {
                "href": "/sessions/{sessionId}",
                "meta": None,
            },
        },
    }
    assert response.status_code == 200


def test_sessions_get_all_no_sessions(sessions_api_client, mock_session_manager):
    """It returns a response when there are no sessions."""
    mock_session_manager.get.return_value = []

    response = sessions_api_client.get("/sessions")
    assert response.json() == {"data": [], "links": None}
    assert response.status_code == 200


def test_sessions_get_all(sessions_api_client, mock_session_manager, mock_session):
    """It returns the sessions."""
    mock_session_manager.get.return_value = [mock_session]

    response = sessions_api_client.get("/sessions")
    assert response.json() == {
        "data": [
            {
                "details": matchers.Anything(),
                "sessionType": "deckCalibration",
                "createdAt": mock_session.meta.created_at.isoformat(),
                "createParams": None,
                "id": mock_session.meta.identifier,
            }
        ],
        "links": None,
    }
    assert response.status_code == 200


def test_sessions_execute_command_no_session(sessions_api_client, mock_session_manager):
    """It rejects command if there's no session"""
    mock_session_manager.get_by_id.return_value = None

    response = sessions_api_client.post(
        "/sessions/1234/commands/execute",
        json={"data": {"command": "protocol.pause", "data": {}}},
    )
    mock_session_manager.get_by_id.assert_called_once_with("1234")
    assert response.json() == {
        "errors": [
            {
                "id": "UncategorizedError",
                "title": "Resource Not Found",
                "detail": "Resource type 'session' with id '1234' was not found",
                "errorCode": "4000",
            }
        ],
        "links": {
            "self": {"href": "/sessions"},
            "sessionById": {"href": "/sessions/{sessionId}"},
        },
    }
    assert response.status_code == 404


def test_sessions_execute_command(
    sessions_api_client, mock_session_manager, mock_session
):
    """It accepts the session command"""
    mock_session_manager.get_by_id.return_value = mock_session
    mock_session.execute_command.return_value = SimpleCommandResponse(
        id="44",
        command=ProtocolCommand.pause,
        data=EmptyModel(),
        createdAt=datetime(2020, 1, 2),
        startedAt=datetime(2020, 1, 3),
        completedAt=datetime(2020, 1, 4),
        status=CommandStatus.executed,
    )

    response = sessions_api_client.post(
        f"/sessions/{mock_session.meta.identifier}/commands/execute",
        json={"data": {"command": "protocol.pause", "data": {}}},
    )

    mock_session.execute_command.assert_called_once_with(
        SimpleCommandRequest(command=ProtocolCommand.pause, data=EmptyModel())
    )

    assert response.json() == {
        "data": {
            "command": "protocol.pause",
            "data": {},
            "status": "executed",
            "createdAt": "2020-01-02T00:00:00",
            "startedAt": "2020-01-03T00:00:00",
            "completedAt": "2020-01-04T00:00:00",
            "result": None,
            "id": "44",
        },
        "links": {
            "commandExecute": {
                "href": f"/sessions/{mock_session.meta.identifier}/commands/execute",
                "meta": None,
            },
            "self": {
                "href": f"/sessions/{mock_session.meta.identifier}",
                "meta": None,
            },
            "sessions": {
                "href": "/sessions",
                "meta": None,
            },
            "sessionById": {
                "href": "/sessions/{sessionId}",
                "meta": None,
            },
        },
    }
    assert response.status_code == 200


@pytest.mark.parametrize(
    argnames="exception,expected_status",
    argvalues=[
        [UnsupportedCommandException, 403],
        [CommandExecutionException, 403],
    ],
)
def test_execute_command_error(
    sessions_api_client, mock_session_manager, mock_session, exception, expected_status
):
    """Test that we handle executor errors correctly"""
    mock_session_manager.get_by_id.return_value = mock_session

    async def raiser(*args, **kwargs):
        raise exception("Cannot do it")

    mock_session.execute_command.side_effect = raiser

    response = sessions_api_client.post(
        f"/sessions/{mock_session.meta.identifier}/commands/execute",
        json={"data": {"command": "protocol.pause", "data": {}}},
    )

    assert response.json() == {
        "errors": [
            {
                "detail": "Cannot do it",
                "title": "Action Forbidden",
                "id": "UncategorizedError",
                "errorCode": "4000",
            }
        ]
    }
    assert response.status_code == expected_status


def test_execute_command_session_inactive(
    sessions_api_client,
    mock_session_manager,
    mock_session,
):
    """Test that only the active session can execute commands"""
    mock_session_manager.get_by_id.return_value = mock_session
    mock_session_manager.is_active.return_value = False

    response = sessions_api_client.post(
        f"/sessions/{mock_session.meta.identifier}/commands/execute",
        json={"data": {"command": "protocol.pause", "data": {}}},
    )

    mock_session_manager.is_active.assert_called_once_with(mock_session.meta.identifier)
    assert response.json() == {
        "errors": [
            {
                "id": "UncategorizedError",
                "title": "Action Forbidden",
                "detail": f"Session '{mock_session.meta.identifier}'"
                f" is not active. Only the active session can "
                f"execute commands",
                "errorCode": "4000",
            }
        ]
    }
    assert response.status_code == 403
