"""Test move-to-coordinates commands."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.types import DeckPoint

from opentrons.protocol_engine.commands.move_to_coordinates import (
    MoveToCoordinatesParams,
    MoveToCoordinatesResult,
    MoveToCoordinatesImplementation,
)


async def test_move_to_coordinates_implementation(decoy: Decoy) -> None:
    """A MoveRelative command should have an execution implementation."""
    subject = MoveToCoordinatesImplementation()
    data = MoveToCoordinatesParams(
        pipetteId="pipette-id",
        coordinates=DeckPoint(x=1.11, y=2.22, z=3.33),
        minimumZHeight=1000,
        forceDirect=True,
    )

    with pytest.raises(NotImplementedError):
        assert await subject.execute(data) == MoveToCoordinatesResult()
