"""Tests for the EngineStore interface."""
# TODO(mc, 2021-06-28): these factory smoke tests are becoming duplicated
# with test logic in `api`. Try to rework the EngineStore / tests into more
# of a collaborator
import pytest
from decoy import Decoy
from datetime import datetime
from pathlib import Path

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_runner import ProtocolRunner

from robot_server.protocols import ProtocolResource, ProtocolFileType
from robot_server.sessions.engine_store import (
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
    result = await subject.create(protocol=None)

    assert isinstance(result.runner, ProtocolRunner)
    assert isinstance(result.engine, ProtocolEngine)
    assert result.engine is subject.engine
    assert result.runner is subject.runner


async def test_create_engine_for_json_protocol(
    subject: EngineStore,
    json_protocol_file: Path,
) -> None:
    """It should create a JSON protocol runner.

    This test is functioning as an integration / smoke test. Ensuring that
    the protocol was loaded correctly is / should be covered in unit tests
    elsewhere.
    """
    protocol = ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.JSON,
        created_at=datetime.now(),
        files=[json_protocol_file],
    )

    result = await subject.create(protocol=protocol)

    # 10 PE commands: 1x load pipette, 3x add definition, 3x load labware, 3x command
    assert len(result.engine.state_view.commands.get_all()) == 10


async def test_create_engine_for_python_protocol(
    subject: EngineStore,
    python_protocol_file: Path,
) -> None:
    """It should create a Python protocol runner.

    This test is functioning as an integration / smoke test. Ensuring that
    the protocol was loaded correctly is / should be covered in unit tests
    elsewhere.
    """
    protocol = ProtocolResource(
        protocol_id="protocol-id",
        protocol_type=ProtocolFileType.PYTHON,
        created_at=datetime.now(),
        files=[python_protocol_file],
    )

    result = await subject.create(protocol=protocol)
    result.runner.play()
    await result.runner.join()

    assert len(result.engine.state_view.commands.get_all()) == 1


async def test_raise_if_engine_already_exists(subject: EngineStore) -> None:
    """It should not create more than one engine / runner pair."""
    await subject.create(protocol=None)

    with pytest.raises(EngineConflictError):
        await subject.create(protocol=None)


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
    await subject.create(protocol=None)
    subject.clear()

    with pytest.raises(EngineMissingError):
        subject.engine

    with pytest.raises(EngineMissingError):
        subject.runner


async def test_clear_engine_noop(subject: EngineStore) -> None:
    """It should noop if clear called and no stored engine entry."""
    subject.clear()
