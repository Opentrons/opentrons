"""Test aspirate commands."""
from decoy import Decoy

from opentrons.protocol_engine import CommandHandlers, WellLocation, WellOrigin
from opentrons.protocol_engine.commands.aspirate import (
    AspirateData,
    AspirateResult,
    AspirateImplementation,
)


async def test_aspirate_implementation(
    decoy: Decoy,
    command_handlers: CommandHandlers,
) -> None:
    """An Aspirate should have an execution implementation."""
    location = WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1))

    data = AspirateData(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=location,
        volume=50,
    )

    decoy.when(
        await command_handlers.pipetting.aspirate(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=location,
            volume=50,
        )
    ).then_return(42)

    subject = AspirateImplementation(data)
    result = await subject.execute(command_handlers)

    assert result == AspirateResult(volume=42)
