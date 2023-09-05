"""Test dispense-in-place commands."""
from decoy import Decoy

from opentrons.protocol_engine.execution import PipettingHandler

from opentrons.protocol_engine.commands.dispense_in_place import (
    DispenseInPlaceParams,
    DispenseInPlaceResult,
    DispenseInPlaceImplementation,
)


async def test_dispense_in_place_implementation(
    decoy: Decoy,
    pipetting: PipettingHandler,
) -> None:
    """It should dispense in place."""
    subject = DispenseInPlaceImplementation(pipetting=pipetting)

    data = DispenseInPlaceParams(
        pipetteId="pipette-id-abc",
        volume=123,
        flowRate=456,
    )

    decoy.when(
        await pipetting.dispense_in_place(
            pipette_id="pipette-id-abc", volume=123, flow_rate=456, push_out=None
        )
    ).then_return(42)

    result = await subject.execute(data)

    assert result == DispenseInPlaceResult(volume=42)
