"""Test dispense commands."""
from decoy import Decoy

from opentrons.protocol_engine import CommandHandlers, WellLocation, WellOrigin
from opentrons.protocol_engine.commands.dispense import (
    DispenseData,
    DispenseResult,
    DispenseImplementation,
)


async def test_dispense_implementation(
    decoy: Decoy,
    command_handlers: CommandHandlers,
) -> None:
    """A PickUpTipRequest should have an execution implementation."""
    location = WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1))

    data = DispenseData(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=location,
        volume=50,
    )

    decoy.when(
        await command_handlers.pipetting.dispense(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=location,
            volume=50,
        )
    ).then_return(42)

    subject = DispenseImplementation(data)
    result = await subject.execute(command_handlers)

    assert result == DispenseResult(volume=42)
