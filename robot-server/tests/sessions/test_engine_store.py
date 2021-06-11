"""Tests for the EngineStore interface."""
import pytest
from mock import MagicMock

from opentrons.protocol_engine import ProtocolEngine
from robot_server.sessions.engine_store import (
    EngineStore,
    EngineConflictError,
    EngineMissingError,
)


@pytest.fixture
def subject() -> EngineStore:
    """Get a EngineStore test subject."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    return EngineStore(hardware_api=MagicMock())


async def test_create_engine(subject: EngineStore) -> None:
    """It should create an engine."""
    result = await subject.create()

    assert result == subject.engine
    assert isinstance(result, ProtocolEngine)
    assert isinstance(subject.engine, ProtocolEngine)


async def test_raise_if_engine_already_exists(subject: EngineStore) -> None:
    """It should not create more than one engine / runner pair."""
    await subject.create()

    with pytest.raises(EngineConflictError):
        await subject.create()


def test_raise_if_engine_does_not_exist(subject: EngineStore) -> None:
    """It should raise if no engine exists when requested."""
    with pytest.raises(EngineMissingError):
        subject.engine


async def test_clear_engine(subject: EngineStore) -> None:
    """It should clear a stored engine entry."""
    await subject.create()
    subject.clear()

    with pytest.raises(EngineMissingError):
        subject.engine


async def test_clear_engine_noop(subject: EngineStore) -> None:
    """It should noop if clear called and no stored engine entry."""
    subject.clear()
