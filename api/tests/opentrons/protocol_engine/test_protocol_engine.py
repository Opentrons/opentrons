"""Tests for the ProtocolEngine class."""
import pytest
from datetime import datetime, timezone, timedelta
from math import isclose
from mock import AsyncMock, MagicMock  # type: ignore[attr-defined]
from typing import cast

from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_engine.execution import CommandExecutor
from opentrons.protocol_engine.resources import IdGenerator

from opentrons.protocol_engine.command_models import (
    MoveToWellRequest,
    MoveToWellResult,
    RunningCommand,
    CompletedCommand
)


class CloseToNow():
    def __init__(self):
        self._now = datetime.now(tz=timezone.utc)

    def __eq__(self, other):
        return (
            isinstance(other, datetime) and
            isclose(self._now.timestamp(), other.timestamp(), rel_tol=5)
        )

    def __repr__(self):
        return f"<datetime close to {self._now}>"


@pytest.fixture
def mock_executor():
    return AsyncMock(spec=CommandExecutor)


@pytest.fixture
def mock_id_generator():
    return MagicMock(spec=IdGenerator)


@pytest.fixture
def engine(mock_hardware, mock_state_store, mock_executor, mock_id_generator):
    mock_id_generator.generate_id.return_value = "unique-id"

    return ProtocolEngine(
        hardware=mock_hardware,
        state_store=mock_state_store,
        executor=mock_executor,
        id_generator=mock_id_generator
    )


async def test_execute_command_creates_command(engine, mock_state_store):
    """It should create a command in the state store when executing."""
    req = MoveToWellRequest(pipetteId="123", labwareId="abc", wellId="A1")

    await engine.execute_command(req)
    mock_state_store.handle_command.assert_any_call(
        RunningCommand(
            uid="unique-id",
            createdAt=cast(datetime, CloseToNow()),
            startedAt=cast(datetime, CloseToNow()),
            request=req
        ),
    )


async def test_execute_command_calls_executor(
    engine,
    mock_executor,
    mock_state_store
):
    """It should create a command in the state store when executing."""
    req = MoveToWellRequest(pipetteId="123", labwareId="abc", wellId="A1")

    await engine.execute_command(req)

    mock_executor.execute_command.assert_called_with(
        RunningCommand(
            uid="unique-id",
            createdAt=cast(datetime, CloseToNow()),
            startedAt=cast(datetime, CloseToNow()),
            request=req
        ),
        state=mock_state_store.state
    )


async def test_execute_command_adds_result_to_state(
    engine,
    mock_executor,
    mock_state_store
):
    """It should create a command in the state store when executing."""
    req = MoveToWellRequest(pipetteId="123", labwareId="abc", wellId="A1")
    res = MoveToWellResult()
    later = datetime.now(tz=timezone.utc) + timedelta(seconds=42)
    completed_cmd = CompletedCommand(
        uid="unique-id",
        createdAt=cast(datetime, CloseToNow()),
        startedAt=cast(datetime, CloseToNow()),
        completedAt=later,
        request=req,
        result=res,
    )

    mock_executor.execute_command.return_value = completed_cmd

    result = await engine.execute_command(req)

    assert result == completed_cmd
    mock_state_store.handle_command.assert_called_with(
        completed_cmd
    )
