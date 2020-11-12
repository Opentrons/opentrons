"""Tests for the ProtocolEngine class."""
from datetime import datetime, timezone, timedelta
from math import isclose
from mock import AsyncMock, MagicMock  # type: ignore[attr-defined]
from typing import cast

from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.protocol_engine import ProtocolEngine
from opentrons.protocol_engine.command_models import (
    MoveToWellRequest,
    MoveToWellResult,
    RunningCommand,
    CompletedCommand
)


class CloseToNow:
    """Matcher for any datetime that is close to now."""

    def __init__(self) -> None:
        """Initialize a CloseToNow matcher."""
        self._now = datetime.now(tz=timezone.utc)

    def __eq__(self, other: object) -> bool:
        """Check if a target object is a datetime that is close to now."""
        return (
            isinstance(other, datetime) and
            isclose(self._now.timestamp(), other.timestamp(), rel_tol=5)
        )

    def __repr__(self) -> str:
        """Represent the matcher as a string."""
        return f"<datetime close to {self._now}>"


async def test_create_engine_initializes_state_with_deck_geometry(
    mock_hardware: MagicMock,
    standard_deck_def: DeckDefinitionV2,
) -> None:
    """It should load deck geometry data into the store on create."""
    engine = ProtocolEngine.create(hardware=mock_hardware)

    assert engine.state_store.geometry.get_deck_definition() == \
        standard_deck_def


async def test_execute_command_creates_command(
    engine: ProtocolEngine,
    mock_state_store: MagicMock
) -> None:
    """It should create a command in the state store when executing."""
    req = MoveToWellRequest(pipetteId="123", labwareId="abc", wellName="A1")

    await engine.execute_command(req, command_id="unique-id")
    mock_state_store.handle_command.assert_any_call(
        RunningCommand(
            created_at=cast(datetime, CloseToNow()),
            started_at=cast(datetime, CloseToNow()),
            request=req
        ),
        command_id="unique-id"
    )


async def test_execute_command_calls_executor(
    engine: ProtocolEngine,
    mock_executor: AsyncMock,
) -> None:
    """It should create a command in the state store when executing."""
    req = MoveToWellRequest(pipetteId="123", labwareId="abc", wellName="A1")

    await engine.execute_command(req, command_id="unique-id")

    mock_executor.execute_command.assert_called_with(
        RunningCommand(
            created_at=cast(datetime, CloseToNow()),
            started_at=cast(datetime, CloseToNow()),
            request=req
        )
    )


async def test_execute_command_adds_result_to_state(
    engine: ProtocolEngine,
    mock_executor: AsyncMock,
    mock_state_store: MagicMock,
) -> None:
    """It should upsert the completed command into state."""
    req = MoveToWellRequest(pipetteId="123", labwareId="abc", wellName="A1")
    res = MoveToWellResult()
    later = datetime.now(tz=timezone.utc) + timedelta(seconds=42)
    completed_cmd = CompletedCommand(
        created_at=cast(datetime, CloseToNow()),
        started_at=cast(datetime, CloseToNow()),
        completed_at=later,
        request=req,
        result=res,
    )

    mock_executor.execute_command.return_value = completed_cmd

    result = await engine.execute_command(req, command_id="unique-id",)

    assert result == completed_cmd
    mock_state_store.handle_command.assert_called_with(
        completed_cmd,
        command_id="unique-id",
    )
