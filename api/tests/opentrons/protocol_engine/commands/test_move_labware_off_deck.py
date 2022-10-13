"""Test the ``moveLabwareOffDeck`` command."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.execution import RunControlHandler
from opentrons.protocol_engine.state import StateView
from opentrons.protocol_engine.errors.exceptions import LabwareNotLoadedError

from opentrons.protocol_engine.commands.move_labware_off_deck import (
    MoveLabwareOffDeckParams,
    MoveLabwareOffDeckResult,
    MoveLabwareOffDeckImplementation,
)


async def test_move_labware_off_deck_implementation(
    decoy: Decoy,
    run_control: RunControlHandler,
    state_view: StateView,
) -> None:
    """It should pause the run."""
    subject = MoveLabwareOffDeckImplementation(
        state_view=state_view, run_control=run_control
    )
    data = MoveLabwareOffDeckParams(
        labwareId="my-cool-labware-id",
    )
    result = await subject.execute(data)

    decoy.verify(await run_control.wait_for_resume(), times=1)
    assert result == MoveLabwareOffDeckResult()


async def test_move_labware_off_deck_raises(
    decoy: Decoy,
    run_control: RunControlHandler,
    state_view: StateView,
) -> None:
    """It should raise an error when specified labware is not found."""
    subject = MoveLabwareOffDeckImplementation(
        state_view=state_view, run_control=run_control
    )
    data = MoveLabwareOffDeckParams(
        labwareId="my-cool-labware-id",
    )
    decoy.when(state_view.labware.get(labware_id="my-cool-labware-id")).then_raise(
        LabwareNotLoadedError("Woops!")
    )

    with pytest.raises(LabwareNotLoadedError):
        await subject.execute(data)
