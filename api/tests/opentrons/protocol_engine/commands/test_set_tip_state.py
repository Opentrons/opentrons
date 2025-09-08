"""Test setTipState command."""
import pytest

from decoy import Decoy


from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.set_tip_state import (
    SetTipStateParams,
    SetTipStateResult,
    SetTipStateImplementation,
)
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.types import TipRackWellState


@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Get a mock StateView."""
    return decoy.mock(cls=StateView)


async def test_set_tip_state(decoy: Decoy, mock_state_view: StateView) -> None:
    """A setTipState should have an execution implementation."""
    subject = SetTipStateImplementation(state_view=mock_state_view)

    params = SetTipStateParams(
        labwareId="labware-id",
        wellNames=["well-1", "well-2"],
        tipWellState=TipRackWellState.USED,
    )

    result = await subject.execute(params)

    assert result == SuccessData(
        public=SetTipStateResult(),
        state_update=update_types.StateUpdate(
            tips_state=update_types.TipsStateUpdate(
                tip_state=TipRackWellState.USED,
                labware_id="labware-id",
                well_names=["well-1", "well-2"],
            )
        ),
    )
