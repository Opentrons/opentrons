"""Test aspirate-in-place commands."""
from decoy import Decoy

from opentrons.protocol_engine.execution import PipettingHandler

from opentrons.protocol_engine.commands.aspirate_in_place import (
    AspirateInPlaceParams,
    AspirateInPlaceResult,
    AspirateInPlaceImplementation,
)


async def test_aspirate_in_place_implementation(
    decoy: Decoy,
    pipetting: PipettingHandler,
) -> None:
    """It should aspirate in place."""
    subject = AspirateInPlaceImplementation(pipetting=pipetting)

    data = AspirateInPlaceParams(
        pipetteId="pipette-id-abc",
        volume=123,
        flowRate=456,
    )

    decoy.when(
        await pipetting.dispense_in_place(
            pipette_id="pipette-id-abc",
            volume=123,
            flow_rate=456,
        )
    ).then_return(42)

    result = await subject.execute(data)

    assert result == AspirateInPlaceResult(volume=42)
