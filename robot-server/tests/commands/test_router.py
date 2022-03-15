"""Tests for robot_server.commands.router."""
import pytest
from datetime import datetime
from decoy import Decoy

from opentrons.protocol_engine import ProtocolEngine, commands as pe_commands

from robot_server.service.json_api import RequestModel
from robot_server.errors import ApiError
from robot_server.runs import EngineStore, EngineConflictError
from robot_server.commands.router import create_command


@pytest.fixture()
def protocol_engine(decoy: Decoy) -> ProtocolEngine:
    """Get a mocked out ProtocolEngine."""
    return decoy.mock(cls=ProtocolEngine)


@pytest.fixture()
def engine_store(decoy: Decoy) -> EngineStore:
    """Get a mocked out EngineStore."""
    return decoy.mock(cls=EngineStore)


async def test_create_command(
    decoy: Decoy,
    engine_store: EngineStore,
    protocol_engine: ProtocolEngine,
) -> None:
    """It should be able to create a command."""
    command_create = pe_commands.HomeCreate(params=pe_commands.HomeParams())
    queued_command = pe_commands.Home(
        id="abc123",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.QUEUED,
        params=pe_commands.HomeParams(),
        result=None,
    )

    def _stub_queued_command_state(*_a: object, **_k: object) -> pe_commands.Command:
        decoy.when(protocol_engine.state_view.commands.get("abc123")).then_return(
            queued_command
        )
        return queued_command

    decoy.when(await engine_store.get_default_engine()).then_return(protocol_engine)

    decoy.when(protocol_engine.add_command(command_create)).then_do(
        _stub_queued_command_state
    )

    result = await create_command(
        RequestModel(data=command_create),
        waitUntilComplete=False,
        timeout=42,
        engine_store=engine_store,
    )

    assert result.content.data == queued_command
    assert result.status_code == 201
    decoy.verify(await protocol_engine.wait_for_command("abc123"), times=0)


async def test_create_command_wait_for_complete(
    decoy: Decoy,
    engine_store: EngineStore,
    protocol_engine: ProtocolEngine,
) -> None:
    """It should be able to create a command."""
    command_create = pe_commands.HomeCreate(params=pe_commands.HomeParams())
    queued_command = pe_commands.Home(
        id="abc123",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.QUEUED,
        params=pe_commands.HomeParams(),
        result=None,
    )
    completed_command = pe_commands.Home(
        id="abc123",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        completedAt=datetime(year=2022, month=2, day=2),
        status=pe_commands.CommandStatus.SUCCEEDED,
        params=pe_commands.HomeParams(),
        result=None,
    )

    def _stub_queued_command_state(*_a: object, **_k: object) -> pe_commands.Command:
        decoy.when(protocol_engine.state_view.commands.get("abc123")).then_return(
            queued_command
        )
        return queued_command

    def _stub_completed_command_state(*_a: object, **_k: object) -> None:
        decoy.when(protocol_engine.state_view.commands.get("abc123")).then_return(
            completed_command
        )

    decoy.when(await engine_store.get_default_engine()).then_return(protocol_engine)

    decoy.when(protocol_engine.add_command(command_create)).then_do(
        _stub_queued_command_state
    )

    decoy.when(await protocol_engine.wait_for_command("abc123")).then_do(
        _stub_completed_command_state
    )

    result = await create_command(
        RequestModel(data=command_create),
        waitUntilComplete=True,
        timeout=42,
        engine_store=engine_store,
    )

    assert result.content.data == completed_command
    assert result.status_code == 201


async def test_create_command_conflixt(decoy: Decoy, engine_store: EngineStore) -> None:
    """It should raise a conflict if there is an active engine in place."""
    home_create = pe_commands.HomeCreate(params=pe_commands.HomeParams())

    decoy.when(await engine_store.get_default_engine()).then_raise(
        EngineConflictError("oh no")
    )

    with pytest.raises(ApiError) as exc_info:
        await create_command(
            RequestModel(data=home_create),
            waitUntilComplete=True,
            timeout=42,
            engine_store=engine_store,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunActive"
