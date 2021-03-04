"""Tests for the Protocol Context's synchronous engine adapter.

Since Python protocol execution happens off the main thread, these tests call
the subject's methods in a synchronous context in a child thread to ensure:

- In the Protocol execution thread, calls are synchronous and block until
    command execution is complete.
- In the main thread, the Protocol Engine does its work in the main event
    loop, without blocking.
"""
import pytest
from asyncio import AbstractEventLoop
from datetime import datetime
from decoy import Decoy, matchers
from functools import partial

from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import DeckSlotName
from opentrons.protocol_engine import ProtocolEngine, DeckSlotLocation, commands
from opentrons.protocol_engine.errors import ProtocolEngineError
from opentrons.protocols.implementations.engine import SyncProtocolEngine


UUID_MATCHER = matchers.StringMatching(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
)


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
    loop: AbstractEventLoop,
    engine: ProtocolEngine,
) -> SyncProtocolEngine:
    """Get a SyncProtocolEngine test subject."""
    return SyncProtocolEngine(loop=loop, engine=engine)


@pytest.fixture
async def stubbed_load_labware_result(
    decoy: Decoy,
    engine: ProtocolEngine,
    minimal_labware_def: LabwareDefinition
) -> commands.LoadLabwareResult:
    """Set up the protocol engine with default stubbed response for load labware."""
    request = commands.LoadLabwareRequest(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_5),
        loadName="some_labware",
        namespace="opentrons",
        version=1,
    )

    result = commands.LoadLabwareResult(
        labwareId="abc123",
        definition=minimal_labware_def,
        calibration=(1, 2, 3),
    )

    decoy.when(
        await engine.execute_command(request=request, command_id=UUID_MATCHER)
    ).then_return(
        commands.CompletedCommand(
            request=request,
            result=result,
            created_at=matchers.IsA(datetime),
            started_at=matchers.IsA(datetime),
            completed_at=matchers.IsA(datetime),
        )
    )

    return result


async def test_load_labware(
    loop: AbstractEventLoop,
    stubbed_load_labware_result: commands.LoadLabwareResult,
    subject: SyncProtocolEngine,
):
    """It should execute a load labware command."""
    task = partial(
        subject.load_labware,
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_5),
        load_name="some_labware",
        namespace="opentrons",
        version=1,
    )

    result = await loop.run_in_executor(None, task)

    assert result == stubbed_load_labware_result


async def test_load_labware_failure(
    loop: AbstractEventLoop,
    decoy: Decoy,
    engine: ProtocolEngine,
    subject: SyncProtocolEngine,
):
    """It should execute a load labware command."""
    decoy.when(
        await engine.execute_command(
            request=matchers.IsA(commands.LoadLabwareRequest),
            command_id=UUID_MATCHER,
        )
    ).then_return(
        commands.FailedCommand(
            error=ProtocolEngineError("oh no"),
            request=matchers.IsA(commands.LoadLabwareRequest),
            created_at=matchers.IsA(datetime),
            started_at=matchers.IsA(datetime),
            failed_at=matchers.IsA(datetime),
        )
    )

    task = partial(
        subject.load_labware,
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_5),
        load_name="some_labware",
        namespace="opentrons",
        version=1,
    )

    with pytest.raises(ProtocolEngineError, match="oh no"):
        await loop.run_in_executor(None, task)
