"""Test pause command."""
from decoy import Decoy

from opentrons.protocol_engine.execution import RunControlHandler

from opentrons.protocol_engine.commands.pause import (
    PauseParams,
    PauseResult,
    PauseImplementation,
)


async def test_pause_implementation(
    decoy: Decoy, run_control: RunControlHandler
) -> None:
    """It should dispatch a PauseAction to the store and await resume."""
    subject = PauseImplementation(run_control=run_control)

    data = PauseParams(message="hello world")

    result = await subject.execute(data)

    assert result == PauseResult()
    decoy.verify(await run_control.pause(), times=1)
