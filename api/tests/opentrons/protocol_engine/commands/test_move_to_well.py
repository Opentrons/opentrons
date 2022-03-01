"""Test move to well commands."""
from decoy import Decoy

from opentrons.protocol_engine import WellLocation, WellOffset
from opentrons.protocol_engine.execution import MovementHandler

from opentrons.protocol_engine.commands.move_to_well import (
    MoveToWellParams,
    MoveToWellResult,
    MoveToWellImplementation,
)


async def test_move_to_well_implementation(
    decoy: Decoy,
    movement: MovementHandler,
) -> None:
    """A MoveToWell command should have an execution implementation."""
    subject = MoveToWellImplementation(movement=movement)

    data = MoveToWellParams(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
        wellLocation=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
    )

    result = await subject.execute(data)

    assert result == MoveToWellResult()
    decoy.verify(
        await movement.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
            well_location=WellLocation(offset=WellOffset(x=1, y=2, z=3)),
        )
    )
