"""Test move relative commands."""
from decoy import Decoy

from opentrons.protocol_engine.types import MovementAxis
from opentrons.protocol_engine.execution import MovementHandler

from opentrons.protocol_engine.commands.move_relative import (
    MoveRelativeParams,
    MoveRelativeResult,
    MoveRelativeImplementation,
)


async def test_move_relative_implementation(
    decoy: Decoy,
    movement: MovementHandler,
) -> None:
    """A MoveRelative command should have an execution implementation."""
    subject = MoveRelativeImplementation(movement=movement)

    data = MoveRelativeParams(
        pipetteId="pipette-id",
        axis=MovementAxis.X,
        distance=42.0,
    )

    result = await subject.execute(data)

    assert result == MoveRelativeResult()
    decoy.verify(
        await movement.move_relative(
            pipette_id="pipette-id",
            axis=MovementAxis.X,
            distance=42.0,
        )
    )
