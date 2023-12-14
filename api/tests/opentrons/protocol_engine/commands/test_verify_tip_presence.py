"""Test verify tip presence commands."""
from decoy import Decoy

from opentrons.protocol_engine.execution import TipHandler
from opentrons.protocol_engine.types import TipPresenceStatus

from opentrons.protocol_engine.commands.verify_tip_presence import (
    VerifyTipPresenceParams,
    VerifyTipPresenceResult,
    VerifyTipPresenceImplementation,
)


async def test_verify_tip_presence_implementation(
    decoy: Decoy,
    tip_handler: TipHandler,
) -> None:
    """A VerifyTipPresence command should have an execution implementation."""
    subject = VerifyTipPresenceImplementation(tip_handler=tip_handler)
    data = VerifyTipPresenceParams(
        pipetteId="pipette-id",
        expectedState=TipPresenceStatus.PRESENT,
    )

    decoy.when(
        await tip_handler.verify_tip_presence(
            pipette_id="pipette-id",
            expected=TipPresenceStatus.PRESENT,
        )
    ).then_return(None)

    result = await subject.execute(data)

    assert isinstance(result, VerifyTipPresenceResult)
