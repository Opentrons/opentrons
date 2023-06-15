"""Test drop tip in place commands."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.execution import TipHandler

from opentrons.protocol_engine.commands.drop_tip_in_place import (
    DropTipInPlaceParams,
    DropTipInPlaceResult,
    DropTipInPlaceImplementation,
)


@pytest.fixture
def mock_tip_handler(decoy: Decoy) -> TipHandler:
    """Get a mock TipHandler."""
    return decoy.mock(cls=TipHandler)


async def test_drop_tip_implementation(
    decoy: Decoy,
    mock_tip_handler: TipHandler,
) -> None:
    """A DropTip command should have an execution implementation."""
    subject = DropTipInPlaceImplementation(tip_handler=mock_tip_handler)

    params = DropTipInPlaceParams(pipetteId="abc", homeAfter=False)

    result = await subject.execute(params)

    assert result == DropTipInPlaceResult()

    decoy.verify(
        await mock_tip_handler.drop_tip(pipette_id="abc", home_after=False),
        times=1,
    )
