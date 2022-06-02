"""Test blow-out command."""
from decoy import Decoy

from opentrons.protocol_engine.execution import PipettingHandler
from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset
from opentrons.protocol_engine.commands import BlowOutCreate, BlowOutResult, BlowOutImplementation, BlowOutParams


async def test_blow_out_implementation(
    decoy: Decoy,
    pipetting: PipettingHandler
) -> None:
    """A PickUpTipCreate should have an execution implementation."""
    subject = BlowOutImplementation(pipetting=pipetting)

    location = WellLocation(origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1))

    data = BlowOutParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=location,
        volume=50,
    )

    result = await subject.execute(data)

    assert result == BlowOutResult(volume=42, pipetteId="abc", labwareId="123", wellName="A3")
