"""Test get tip presence commands."""
from decoy import Decoy
import pytest

from opentrons.protocol_engine.execution import TipHandler
from opentrons.protocol_engine.types import TipPresenceStatus

from opentrons.protocol_engine.commands.get_tip_presence import (
    GetTipPresenceParams,
    GetTipPresenceResult,
    GetTipPresenceImplementation,
)


@pytest.mark.parametrize(
    "status",
    [
        TipPresenceStatus.PRESENT,
        TipPresenceStatus.ABSENT,
        TipPresenceStatus.UNKNOWN,
    ],
)
async def test_get_tip_presence_implementation(
    decoy: Decoy,
    tip_handler: TipHandler,
    status: TipPresenceStatus,
) -> None:
    """A GetTipPresence command should have an execution implementation."""
    subject = GetTipPresenceImplementation(tip_handler=tip_handler)
    data = GetTipPresenceParams(
        pipetteId="pipette-id",
    )

    decoy.when(
        await tip_handler.get_tip_presence(
            pipette_id="pipette-id",
        )
    ).then_return(status)

    result = await subject.execute(data)

    assert result == GetTipPresenceResult(status=status)
