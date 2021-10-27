"""Tests for the EngineStore interface."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_runner import ProtocolRunner

from robot_server.runs.engine_store import (
    EngineStore,
    EngineConflictError,
    EngineMissingError,
)


@pytest.fixture
def subject(decoy: Decoy) -> EngineStore:
    """Get a EngineStore test subject."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=HardwareAPI)
    return EngineStore(hardware_api=hardware_api)


async def test_create_engine(subject: EngineStore) -> None:
    """It should create an engine."""
    result = await subject.create()

    assert isinstance(result.runner, ProtocolRunner)
    assert isinstance(result.engine, ProtocolEngine)
    assert result.engine is subject.engine
    assert result.runner is subject.runner


async def test_raise_if_engine_already_exists(subject: EngineStore) -> None:
    """It should not create more than one engine / runner pair."""
    await subject.create()

    with pytest.raises(EngineConflictError):
        await subject.create()


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
async def test_cannot_persist_multiple_engines(subject: EngineStore) -> None:
    """It should protect against engine creation race conditions."""
    # TODO(mc, 2021-06-14): figure out how to write a test that actually
    # fails in practice when race condition is able to be hit
    raise NotImplementedError("Test not yet implemented")


def test_raise_if_engine_does_not_exist(subject: EngineStore) -> None:
    """It should raise if no engine exists when requested."""
    with pytest.raises(EngineMissingError):
        subject.engine

    with pytest.raises(EngineMissingError):
        subject.runner


async def test_clear_engine(subject: EngineStore) -> None:
    """It should clear a stored engine entry."""
    await subject.create()
    subject.clear()

    with pytest.raises(EngineMissingError):
        subject.engine

    with pytest.raises(EngineMissingError):
        subject.runner


async def test_clear_engine_noop(subject: EngineStore) -> None:
    """It should noop if clear called and no stored engine entry."""
    subject.clear()
