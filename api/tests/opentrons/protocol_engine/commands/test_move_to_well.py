"""Test move to well commands."""
from decoy import Decoy

from opentrons.protocol_engine.execution import CommandHandlers
from opentrons.protocol_engine.commands.move_to_well import (
    MoveToWellData,
    MoveToWellResult,
    MoveToWellImplementation,
)


async def test_move_to_well_implementation(
    decoy: Decoy,
    command_handlers: CommandHandlers,
) -> None:
    """A MoveToWellRequest should have an execution implementation."""
    data = MoveToWellData(
        pipetteId="abc",
        labwareId="123",
        wellName="A3",
    )

    subject = MoveToWellImplementation(data)
    result = await subject.execute(command_handlers)

    assert result == MoveToWellResult()
    decoy.verify(
        await command_handlers.movement.move_to_well(
            pipette_id="abc",
            labware_id="123",
            well_name="A3",
        )
    )
