"""Tests for command state and base implementation class."""
from datetime import datetime
from pydantic import BaseModel
from mock import AsyncMock  # type: ignore[attr-defined]

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.commands.command import (
    PendingCommand,
    RunningCommand,
    CompletedCommand,
    FailedCommand,
    CommandImplementation,
    CommandHandlers,
)


class ReqModel(BaseModel):
    """Command request model."""

    foo: str
    bar: int


class ResModel(BaseModel):
    """Command result model."""

    baz: bool


class ExampleImpl(CommandImplementation[ReqModel, ResModel]):
    """Example command implementation."""

    async def execute(self, handlers: CommandHandlers) -> ResModel:
        """Execute the command."""
        return ResModel(baz=True)


def test_pending_command(
    now: datetime,
    later: datetime,
) -> None:
    """A command should be able to be pending."""
    request = ReqModel(foo="hello", bar=0)

    cmd = PendingCommand[ReqModel, ResModel](
        request=request,
        created_at=now,
    )

    assert cmd.request == request
    assert cmd.created_at == now
    assert cmd.to_running(started_at=later) == RunningCommand(
        request=request,
        created_at=now,
        started_at=later,
    )


def test_running_command(
    now: datetime,
    later: datetime,
    even_later: datetime,
) -> None:
    """A command should be able to be running."""
    request = ReqModel(foo="hello", bar=0)
    result = ResModel(baz=True)
    error = errors.ProtocolEngineError("oh no!")

    cmd = RunningCommand[ReqModel, ResModel](
        request=request,
        created_at=now,
        started_at=later,
    )

    assert cmd.request == request
    assert cmd.created_at == now
    assert cmd.started_at == later

    assert cmd.to_completed(
        result=result,
        completed_at=even_later,
    ) == CompletedCommand(
        request=request,
        result=result,
        created_at=now,
        started_at=later,
        completed_at=even_later,
    )

    assert cmd.to_failed(
        error=error,
        failed_at=even_later,
    ) == FailedCommand(
        request=request,
        error=error,
        created_at=now,
        started_at=later,
        failed_at=even_later,
    )


def test_completed_command(
    now: datetime,
    later: datetime,
    even_later: datetime,
) -> None:
    """A command should be able to be completed."""
    request = ReqModel(foo="hello", bar=0)
    result = ResModel(baz=True)

    cmd = CompletedCommand[ReqModel, ResModel](
        request=request,
        result=result,
        created_at=now,
        started_at=later,
        completed_at=even_later,
    )

    assert cmd.request == request
    assert cmd.result == result
    assert cmd.created_at == now
    assert cmd.started_at == later
    assert cmd.completed_at == even_later


def test_failed_command(
    now: datetime,
    later: datetime,
    even_later: datetime,
) -> None:
    """A command should be able to be failed."""
    request = ReqModel(foo="hello", bar=0)
    error = errors.ProtocolEngineError("oh no!")

    cmd = FailedCommand[ReqModel](
        request=request,
        error=error,
        created_at=now,
        started_at=later,
        failed_at=even_later,
    )

    assert cmd.request == request
    assert cmd.error == error
    assert cmd.created_at == now
    assert cmd.started_at == later
    assert cmd.failed_at == even_later


async def test_command_implementation(
    later: datetime,
    mock_handlers: AsyncMock,
) -> None:
    """A command implementation should create pending command and execute."""
    request = ReqModel(foo="hello", bar=0)
    impl = ExampleImpl(request)

    assert impl.create_command(later) == PendingCommand(
        request=request,
        created_at=later,
    )

    result = await impl.execute(mock_handlers)

    assert result == ResModel(baz=True)
