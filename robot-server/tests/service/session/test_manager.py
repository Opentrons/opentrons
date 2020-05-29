from unittest.mock import patch, MagicMock
import pytest

from opentrons.calibration.check.models import SessionType

from robot_server.service.session.manager import SessionManager
from robot_server.service.session.models import create_identifier


@pytest.fixture
def manager(hardware):
    return SessionManager(hardware)


@pytest.fixture
def mock_session_create():
    """Patch of Session.create"""
    with patch("robot_server.service.session.manager.Session.create") as m:
        yield m


def test_add_calls_session_create(manager, mock_session_create):
    manager.add(SessionType.null)
    mock_session_create.assert_called_once_with(manager._session_common)


def test_add_no_class_doesnt_call_create(manager, mock_session_create):
    # Patch the type to class dict
    with patch("robot_server.service.session.manager.SessionTypeToClass",
               new={}):
        manager.add(SessionType.null)
        mock_session_create.assert_not_called()


def test_add_stores_session(manager):
    session = manager.add(SessionType.null)
    assert manager._sessions[session.identifier] == session


def test_remove_removes(manager):
    session = manager.add(SessionType.null)
    assert manager.remove(session.identifier) is session
    assert session.identifier not in manager._sessions


def test_remove_calls_cleanup(manager):
    session = manager.add(SessionType.null)
    session.clean_up = MagicMock()
    manager.remove(session.identifier)
    session.clean_up.assert_called_once()


def test_remove_active_session(manager):
    session = manager.add(SessionType.null)
    manager._active_session_id = session.identifier
    manager.remove(session.identifier)
    assert manager._active_session_id is None


def test_remove_inactive_session(manager):
    active_session = manager.add(SessionType.null)
    manager._active_session_id = active_session.identifier
    session = manager.add(SessionType.null)
    manager.remove(session.identifier)
    assert manager._active_session_id is active_session.identifier


def test_remove_unknown_session(manager):
    assert manager.remove(create_identifier()) is None


def test_get_by_id_not_found(manager):
    assert manager.get_by_id(create_identifier()) is None


def test_get_by_type(manager):
    sessions = tuple(manager.add(SessionType.null) for _ in range(5))
    assert manager.get_by_type(SessionType.null) == sessions
    assert manager.get_by_type(SessionType.calibration_check) == tuple()


def test_get_active(manager):
    session = manager.add(SessionType.null)
    manager._active_session_id = session.identifier
    assert manager.get_active() is session


def test_get_active_no_active(manager):
    manager._active_session_id = None
    assert manager.get_active() is None


def test_is_active(manager):
    session = manager.add(SessionType.null)
    manager._active_session_id = session.identifier
    assert manager.is_active(session.identifier) is True


def test_is_active_not_active(manager):
    assert manager.is_active(create_identifier()) is False


def test_activate(manager):
    session = manager.add(SessionType.null)
    assert manager.activate(session.identifier) is session
    assert manager._active_session_id == session.identifier


def test_activate_unknown_session(manager):
    assert manager.activate(create_identifier()) is None
    assert manager._active_session_id is None


def test_deactivate(manager):
    session = manager.add(SessionType.null)
    manager._active_session_id = session.identifier
    assert manager.deactivate(session.identifier) is session
    assert manager._active_session_id is None


def test_deactivate_unknown_session(manager):
    session = manager.add(SessionType.null)
    manager._active_session_id = session.identifier
    assert manager.deactivate(create_identifier()) is None
    assert manager._active_session_id is session.identifier


def test_deactivate_non_active(manager):
    manager._active_session_id = None
    assert manager.deactivate(create_identifier()) is None
