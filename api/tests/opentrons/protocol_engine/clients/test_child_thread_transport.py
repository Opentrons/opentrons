"""Tests for am ChildThreadTransport."""

import pytest
from asyncio import AbstractEventLoop
from datetime import datetime
from decoy import Decoy, matchers
from functools import partial


from opentrons.protocol_engine import ProtocolEngine, commands
from opentrons.protocol_engine.errors import ProtocolEngineError
from opentrons.protocol_engine.clients.transports import ChildThreadTransport


@pytest.fixture
def decoy() -> Decoy:
    """Create a Decoy state container for this test suite."""
    return Decoy()


@pytest.fixture
async def engine(decoy: Decoy) -> ProtocolEngine:
    """Get a stubbed out ProtocolEngine."""
    return decoy.create_decoy(spec=ProtocolEngine)


@pytest.fixture
def subject(
    engine: ProtocolEngine,
    loop: AbstractEventLoop,
) -> ChildThreadTransport:
    """Get a ChildThreadTransport test subject."""
    return ChildThreadTransport(engine=engine, loop=loop)


async def test_execute_command(
    decoy: Decoy,
    loop: AbstractEventLoop,
    engine: ProtocolEngine,
    subject: ChildThreadTransport,
) -> None:
    """It should execute a command synchronously in a child thread."""
    cmd_request = commands.MoveToWellRequest(
        pipetteId="pipette-id",
        labwareId="labware-id",
        wellName="A1"
    )
    cmd_result = commands.MoveToWellResult()

    decoy.when(
        await engine.execute_command(request=cmd_request, command_id="cmd-id")
    ).then_return(
        commands.CompletedCommand(
            request=cmd_request,
            result=cmd_result,
            created_at=matchers.IsA(datetime),
            started_at=matchers.IsA(datetime),
            completed_at=matchers.IsA(datetime),
        )
    )

    task = partial(subject.execute_command, request=cmd_request, command_id="cmd-id")
    result = await loop.run_in_executor(None, task)

    assert result == cmd_result


async def test_execute_command_failure(
    decoy: Decoy,
    loop: AbstractEventLoop,
    engine: ProtocolEngine,
    subject: ChildThreadTransport,
) -> None:
    """It should execute a load labware command."""
    cmd_request = commands.MoveToWellRequest(
        pipetteId="pipette-id",
        labwareId="labware-id",
        wellName="A1"
    )

    decoy.when(
        await engine.execute_command(request=cmd_request, command_id="cmd-id")
    ).then_return(
        commands.FailedCommand(
            error=ProtocolEngineError("oh no"),
            request=cmd_request,
            created_at=matchers.IsA(datetime),
            started_at=matchers.IsA(datetime),
            failed_at=matchers.IsA(datetime),
        )
    )

    task = partial(subject.execute_command, request=cmd_request, command_id="cmd-id")

    with pytest.raises(ProtocolEngineError, match="oh no"):
        await loop.run_in_executor(None, task)
