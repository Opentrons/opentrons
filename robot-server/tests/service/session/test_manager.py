import asyncio
from unittest.mock import patch, MagicMock
import pytest

from robot_server.service.session.errors import SessionCreationException
from robot_server.service.session.manager import SessionManager, \
    SessionMetaData
from robot_server.service.session.models import create_identifier, SessionType


async def side_effect(*args, **kwargs):
    return MagicMock()


@pytest.fixture
def manager(hardware):
    return SessionManager(hardware)


@pytest.fixture
def mock_session_create():
    """Patch of Session.create"""
    with patch("robot_server.service.session.manager.BaseSession.create") as m:
        m.side_effect = side_effect
        yield m


async def test_add_calls_session_create(manager, mock_session_create):
    await manager.add(SessionType.null)
    mock_session_create.assert_called_once()
    assert mock_session_create.call_args[1]['configuration'] == \
        manager._session_common
    assert isinstance(mock_session_create.call_args[1]['instance_meta'],
                      SessionMetaData)


async def test_add_no_class_doesnt_call_create(manager, mock_session_create):
    # Patch the type to class dict
    with patch("robot_server.service.session.manager.SessionTypeToClass",
               new={}):
        with pytest.raises(SessionCreationException):
            await manager.add(SessionType.null)
        mock_session_create.assert_not_called()


async def test_add_stores_session(manager):
    session = await manager.add(SessionType.null)
    assert manager._sessions[session.meta.identifier] == session


async def test_add_activates_session(manager):
    """Test that adding a session also makes that new session active"""
    session = await manager.add(SessionType.null)
    assert manager._active_session_id == session.meta.identifier


async def test_remove_removes(manager):
    session = await manager.add(SessionType.null)
    assert await manager.remove(session.meta.identifier) is session
    assert session.meta.identifier not in manager._sessions


async def test_remove_calls_cleanup(manager):
    session = await manager.add(SessionType.null)
    session.clean_up = MagicMock(side_effect=side_effect)
    await manager.remove(session.meta.identifier)
    session.clean_up.assert_called_once()


async def test_remove_active_session(manager):
    session = await manager.add(SessionType.null)
    manager._active_session_id = session.meta.identifier
    await manager.remove(session.meta.identifier)
    assert manager._active_session_id is None


async def test_remove_inactive_session(manager):
    session = await manager.add(SessionType.null)
    active_session = await manager.add(SessionType.null)
    await manager.remove(session.meta.identifier)
    assert manager._active_session_id is active_session.meta.identifier


async def test_remove_unknown_session(manager):
    assert await manager.remove(create_identifier()) is None


def test_get_by_id_not_found(manager):
    assert manager.get_by_id(create_identifier()) is None


async def test_get_by_type(manager):
    sessions = await asyncio.gather(
        *[manager.add(SessionType.null) for _ in range(5)]
    )
    assert manager.get(SessionType.null) == tuple(sessions)
    assert manager.get(SessionType.calibration_check) == tuple()


async def test_get_active(manager):
    session = await manager.add(SessionType.null)
    manager._active_session_id = session.meta.identifier
    assert manager.get_active() is session


def test_get_active_no_active(manager):
    manager._active_session_id = None
    assert manager.get_active() is None


async def test_is_active(manager):
    session = await manager.add(SessionType.null)
    manager._active_session_id = session.meta.identifier
    assert manager.is_active(session.meta.identifier) is True


def test_is_active_not_active(manager):
    assert manager.is_active(create_identifier()) is False


async def test_activate(manager):
    session = await manager.add(SessionType.null)
    assert manager.activate(session.meta.identifier) is session
    assert manager._active_session_id == session.meta.identifier


def test_activate_unknown_session(manager):
    assert manager.activate(create_identifier()) is None
    assert manager._active_session_id is None


async def test_deactivate(manager):
    session = await manager.add(SessionType.null)
    manager._active_session_id = session.meta.identifier
    assert manager.deactivate(session.meta.identifier) is session
    assert manager._active_session_id is None


async def test_deactivate_unknown_session(manager):
    session = await manager.add(SessionType.null)
    manager._active_session_id = session.meta.identifier
    assert manager.deactivate(create_identifier()) is None
    assert manager._active_session_id is session.meta.identifier


def test_deactivate_non_active(manager):
    manager._active_session_id = None
    assert manager.deactivate(create_identifier()) is None


class TestDefaultSession:

    def test_always_present(self, manager):
        assert manager.get_by_id("default") is not None

    def test_default_is_active(self, manager):
        """Test that default is active if no other session is active"""
        assert manager.is_active("default") is True

    def test_add_fails(self, manager):
        with pytest.raises(SessionCreationException):
            manager.add(session_type=SessionType.default)
