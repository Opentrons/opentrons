"""Test pick up tip commands."""
from decoy import Decoy

from opentrons.protocol_engine import WellLocation, WellOffset, DeckPoint
from opentrons.protocol_engine.execution import PipettingHandler
from opentrons.protocol_engine.execution.pipetting import VolumePointResult

from opentrons.protocol_engine.commands.pick_up_tip import (
    PickUpTipParams,
    PickUpTipResult,
    PickUpTipImplementation,
)


async def test_pick_up_tip_implementation(
    decoy: Decoy,
    pipetting: PipettingHandler,
) -> None:
    """A PickUpTip command should have an execution implementation."""
    subject = PickUpTipImplementation(pipetting=pipetting)

    data = PickUpTipParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
    )

    decoy.when(
        await pipetting.pick_up_tip(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        )
    ).then_return(VolumePointResult(volume=45.6, position=DeckPoint(x=7, y=8, z=9)))

    result = await subject.execute(data)

    assert result == PickUpTipResult(tipVolume=45.6, position=DeckPoint(x=7, y=8, z=9))

