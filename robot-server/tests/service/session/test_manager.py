import asyncio
from mock import patch, AsyncMock
import pytest

from robot_server.service.session.errors import SessionCreationException
from robot_server.service.session.manager import SessionMetaData, BaseSession
from robot_server.service.session.models.common import create_identifier
from robot_server.service.session.models.session import SessionType


@pytest.fixture
async def session(session_manager, loop) -> BaseSession:
    """An added session"""
    return await session_manager.add(session_type=SessionType.live_protocol,
                                     session_meta_data=SessionMetaData())


@pytest.fixture
def mock_session_create():
    """Patch of Session.create"""
    with patch("robot_server.service.session."
               "manager.LiveProtocolSession.create") as m:
        m.return_value = AsyncMock()
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
            await session_manager.add(SessionType.live_protocol,
                                      SessionMetaData())
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
    session = await session_manager.add(SessionType.live_protocol,
                                        SessionMetaData())
    session.clean_up = AsyncMock()
    await session_manager.remove(session.meta.identifier)
    session.clean_up.assert_called_once()


async def test_remove_active_session(session_manager, session):
    session_manager._active.active_id = session.meta.identifier
    await session_manager.remove(session.meta.identifier)
    assert session_manager._active.active_id is None


async def test_remove_inactive_session(session_manager, session):
    active_session = await session_manager.add(SessionType.live_protocol,
                                               SessionMetaData())
    await session_manager.remove(session.meta.identifier)
    assert session_manager._active.active_id is active_session.meta.identifier


async def test_remove_unknown_session(session_manager):
    assert await session_manager.remove(create_identifier()) is None


def test_get_by_id_not_found(session_manager):
    assert session_manager.get_by_id(create_identifier()) is None


async def test_get_by_type(session_manager):
    sessions = await asyncio.gather(
        *[session_manager.add(SessionType.live_protocol, SessionMetaData()) for _ in range(5)]  # noqa: E501
    )
    assert session_manager.get(SessionType.live_protocol) == tuple(sessions)
    assert session_manager.get(SessionType.calibration_check) == tuple()


async def test_get_active(session_manager, session):
    session_manager._active.active_id = session.meta.identifier
    assert session_manager.get_active() is session


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
    assert session_manager._active.active_id is None


async def test_deactivate(session_manager, session):
    session_manager._active.active_id = session.meta.identifier
    assert session_manager.deactivate(session.meta.identifier) is session
    assert session_manager._active.active_id is None


async def test_deactivate_unknown_session(session_manager, session):
    session_manager._active.active_id = session.meta.identifier
    assert session_manager.deactivate(create_identifier()) is None
    assert session_manager._active.active_id is session.meta.identifier


def test_deactivate_non_active(session_manager):
    session_manager._active.active_id = None
    assert session_manager.deactivate(create_identifier()) is None
