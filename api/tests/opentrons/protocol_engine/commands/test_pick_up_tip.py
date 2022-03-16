"""Test pick up tip commands."""
from decoy import Decoy

from opentrons.protocol_engine import WellLocation, WellOffset
from opentrons.protocol_engine.execution import PipettingHandler

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

    result = await subject.execute(data)

    assert result == PickUpTipResult()

    decoy.verify(
        await pipetting.pick_up_tip(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        )
    )
