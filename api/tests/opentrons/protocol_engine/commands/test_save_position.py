"""Test save position command."""
from decoy import Decoy

from opentrons.protocol_engine.types import DeckPoint
from opentrons.protocol_engine.execution import MovementHandler, SavedPositionData

from opentrons.protocol_engine.commands.save_position import (
    SavePositionParams,
    SavePositionResult,
    SavePositionImplementation,
)


async def test_save_position_implementation(
    decoy: Decoy,
    movement: MovementHandler,
) -> None:
    """A SavePosition command should have an execution implementation."""
    subject = SavePositionImplementation(movement=movement)
    params = SavePositionParams(
        pipetteId="abc",
        positionId="123",
    )
    decoy.when(
        await movement.save_position(
            pipette_id="abc",
            position_id="123",
        )
    ).then_return(
        SavedPositionData(positionId="123", position=DeckPoint(x=1, y=2, z=3))
    )

    result = await subject.execute(params)
    assert result == SavePositionResult(
        positionId="123",
        position=DeckPoint(x=1, y=2, z=3),
    )
