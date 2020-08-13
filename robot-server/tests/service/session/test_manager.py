import asyncio
from unittest.mock import patch, MagicMock
import pytest

from robot_server.service.errors import RobotServerError
from robot_server.service.session.errors import SessionCreationException, \
    SessionException
from robot_server.service.session.manager import SessionMetaData, BaseSession
from robot_server.service.session.models import create_identifier, SessionType
from robot_server.service.session.session_types import DefaultSession


async def side_effect(*args, **kwargs):
    return MagicMock()


@pytest.fixture
async def session(session_manager, loop) -> BaseSession:
    """An added session"""
    return await session_manager.add(session_type=SessionType.null,
                                     session_meta_data=SessionMetaData())


@pytest.fixture
def mock_session_create():
    """Patch of Session.create"""
    with patch("robot_server.service.session.manager.BaseSession.create") as m:
        m.side_effect = side_effect
        yield m


async def test_add_calls_session_create(session_manager,
                                        mock_session_create,
                                        session):
    mock_session_create.assert_called_once()
    assert mock_session_create.call_args[1]['configuration'] == \
           session_manager._session_common
    assert isinstance(mock_session_create.call_args[1]['instance_meta'],
                      SessionMetaData)


async def test_add_no_class_doesnt_call_create(session_manager,
                                               mock_session_create):
    # Patch the type to class dict
    with patch("robot_server.service.session.manager.SessionTypeToClass",
               new={}):
        with pytest.raises(SessionCreationException):
            await session_manager.add(SessionType.null, SessionMetaData())
        mock_session_create.assert_not_called()


async def test_add_stores_session(session_manager, session):
    assert session_manager._sessions[session.meta.identifier] == session


async def test_add_activates_session(session_manager, session):
    """Test that adding a session also makes that new session active"""
    assert session_manager._active.active_id == session.meta.identifier


async def test_remove_removes(session_manager, session):
    assert await session_manager.remove(session.meta.identifier) is session
    assert session.meta.identifier not in session_manager._sessions


async def test_remove_calls_cleanup(session_manager):
    session = await session_manager.add(SessionType.null, SessionMetaData())
    session.clean_up = MagicMock(side_effect=side_effect)
    await session_manager.remove(session.meta.identifier)
    session.clean_up.assert_called_once()


async def test_remove_active_session(session_manager, session):
    session_manager._active.active_id = session.meta.identifier
    await session_manager.remove(session.meta.identifier)
    assert session_manager._active.active_id is \
           session_manager._active.default_id


async def test_remove_inactive_session(session_manager, session):
    active_session = await session_manager.add(SessionType.null,
                                               SessionMetaData())
    await session_manager.remove(session.meta.identifier)
    assert session_manager._active.active_id is active_session.meta.identifier


async def test_remove_unknown_session(session_manager):
    assert await session_manager.remove(create_identifier()) is None


def test_get_by_id_not_found(session_manager):
    assert session_manager.get_by_id(create_identifier()) is None


async def test_get_by_type(session_manager):
    sessions = await asyncio.gather(
        *[session_manager.add(SessionType.null, SessionMetaData()) for _ in range(5)]  # noqa: e501
    )
    assert session_manager.get(SessionType.null) == tuple(sessions)
    assert session_manager.get(SessionType.calibration_check) == tuple()


async def test_get_active(session_manager, session):
    session_manager._active.active_id = session.meta.identifier
    assert session_manager.get_active() is session


def test_get_active_no_active_returns_default(session_manager):
    session_manager._active.active_id = None
    assert session_manager.get_active() is \
           session_manager._sessions[DefaultSession.DEFAULT_ID]


async def test_is_active(session_manager, session):
    session_manager._active.active_id = session.meta.identifier
    assert session_manager.is_active(session.meta.identifier) is True


def test_is_active_not_active(session_manager):
    assert session_manager.is_active(create_identifier()) is False


async def test_activate(session_manager, session):
    assert session_manager.activate(session.meta.identifier) is session
    assert session_manager._active.active_id == session.meta.identifier


def test_activate_unknown_session(session_manager):
    assert session_manager.activate(create_identifier()) is None
    assert session_manager._active.active_id is \
           session_manager._active.default_id


async def test_deactivate(session_manager, session):
    session_manager._active.active_id = session.meta.identifier
    assert session_manager.deactivate(session.meta.identifier) is session
    assert session_manager._active.active_id is \
           session_manager._active.default_id


async def test_deactivate_unknown_session(session_manager, session):
    session_manager._active.active_id = session.meta.identifier
    assert session_manager.deactivate(create_identifier()) is None
    assert session_manager._active.active_id is session.meta.identifier


def test_deactivate_non_active(session_manager):
    session_manager._active.active_id = None
    assert session_manager.deactivate(create_identifier()) is None


class TestDefaultSession:

    def test_always_present(self, session_manager):
        assert session_manager.get_by_id(DefaultSession.DEFAULT_ID) is not None

    def test_default_is_active(self, session_manager):
        """Test that default is active if no other session is active"""
        assert session_manager.is_active(DefaultSession.DEFAULT_ID) is True

    async def test_add_fails(self, session_manager):
        with pytest.raises(RobotServerError):
            await session_manager.add(session_type=SessionType.default,
                                      session_meta_data=SessionMetaData())

    async def test_remove_fails(self, session_manager):
        with pytest.raises(SessionException):
            await session_manager.remove(DefaultSession.DEFAULT_ID)
