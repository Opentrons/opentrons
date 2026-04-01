"""Test pause command."""

from decoy import Decoy

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.wait_for_resume import (
    WaitForResumeCreate,
    WaitForResumeImplementation,
    WaitForResumeParams,
    WaitForResumeResult,
)
from opentrons.protocol_engine.execution import RunControlHandler


async def test_wait_for_resume_implementation(
    decoy: Decoy,
    run_control: RunControlHandler,
) -> None:
    """It should wait a resume from the RunControlHandler."""
    subject = WaitForResumeImplementation(run_control=run_control)

    data = WaitForResumeParams(message="hello world")

    result = await subject.execute(data)

    assert result == SuccessData(public=WaitForResumeResult())
    decoy.verify(await run_control.wait_for_resume(), times=1)


def test_wait_for_resume_accepts_pause_command_type() -> None:
    """It should accept commandType=pause for backwards compatibility."""
    result = WaitForResumeCreate(commandType="pause", params=WaitForResumeParams())
    assert result.commandType == "pause"
