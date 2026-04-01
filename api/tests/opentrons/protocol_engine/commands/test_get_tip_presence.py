"""Test get tip presence commands."""

import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.get_tip_presence import (
    GetTipPresenceImplementation,
    GetTipPresenceParams,
    GetTipPresenceResult,
)
from opentrons.protocol_engine.execution import TipHandler
from opentrons.protocol_engine.types import TipPresenceStatus


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

    assert result == SuccessData(
        public=GetTipPresenceResult(status=status),
    )
