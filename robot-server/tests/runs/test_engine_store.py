"""Tests for the EngineStore interface."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_runner import ProtocolRunner

from robot_server.runs.engine_store import (
    EngineStore,
    EngineMissingError,
    EngineConflictError,
)


@pytest.fixture
def subject(decoy: Decoy) -> EngineStore:
    """Get a EngineStore test subject."""
    # TODO(mc, 2021-06-11): to make these test more effective and valuable, we
    # should pass in some sort of actual, valid HardwareAPI instead of a mock
    hardware_api = decoy.mock(cls=HardwareAPI)
    return EngineStore(hardware_api=hardware_api)


async def test_create_engine(subject: EngineStore) -> None:
    """It should create an engine for a run."""
    result = await subject.create(run_id="run-id")

    assert isinstance(subject.runner, ProtocolRunner)
    assert isinstance(subject.engine, ProtocolEngine)
    assert result is subject.engine.state_view
    assert result is subject.get_state("run-id")


async def test_archives_state_if_engine_already_exists(subject: EngineStore) -> None:
    """It should not create more than one engine / runner pair."""
    state_1 = await subject.create(run_id="run-id-1")
    state_2 = await subject.create(run_id="run-id-2")

    assert state_2 is subject.engine.state_view
    assert state_1 is subject.get_state("run-id-1")


async def test_cannot_create_engine_if_active(subject: EngineStore) -> None:
    """It should not create a new engine if the existing one is active."""
    await subject.create(run_id="run-id-1")
    subject.runner.play()

    with pytest.raises(EngineConflictError):
        await subject.create(run_id="run-id-2")


def test_raise_if_engine_does_not_exist(subject: EngineStore) -> None:
    """It should raise if no engine exists when requested."""
    with pytest.raises(EngineMissingError):
        subject.engine

    with pytest.raises(EngineMissingError):
        subject.runner


async def test_clear_engine(subject: EngineStore) -> None:
    """It should clear a stored engine entry."""
    await subject.create(run_id="run-id")
    await subject.runner.run()
    await subject.clear()

    with pytest.raises(EngineMissingError):
        subject.engine

    with pytest.raises(EngineMissingError):
        subject.runner


async def test_clear_engine_noop(subject: EngineStore) -> None:
    """It should noop if clear called and no stored engine entry."""
    await subject.clear()


async def test_clear_engine_not_stopped_or_idle(subject: EngineStore) -> None:
    """It should raise a conflict if the engine is not stopped."""
    await subject.create(run_id="run-id")
    subject.runner.play()

    with pytest.raises(EngineConflictError):
        await subject.clear()


async def test_clear_idle_engine(subject: EngineStore) -> None:
    """It should successfully clear engine if idle (not started)."""
    await subject.create(run_id="run-id")
    assert subject.engine is not None
    assert subject.runner is not None

    await subject.clear()

    # TODO: test engine finish is called
    with pytest.raises(EngineMissingError):
        subject.engine
    with pytest.raises(EngineMissingError, match="Runner not yet created."):
        subject.runner


async def test_get_default_engine(subject: EngineStore) -> None:
    """It should create and retrieve a default ProtocolEngine."""
    result = await subject.get_default_engine()
    repeated_result = await subject.get_default_engine()

    assert isinstance(result, ProtocolEngine)
    assert repeated_result is result


async def test_get_default_engine_conflict(subject: EngineStore) -> None:
    """It should not allow a default engine if another engine is active."""
    await subject.create(run_id="run-id")

    with pytest.raises(EngineConflictError):
        await subject.get_default_engine()
