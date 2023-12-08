"""Test save position command."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.types import DeckPoint
from opentrons.protocol_engine.execution import GantryMover
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.types import Point

from opentrons.protocol_engine.commands.save_position import (
    SavePositionParams,
    SavePositionResult,
    SavePositionImplementation,
)


@pytest.fixture
def mock_model_utils(decoy: Decoy) -> ModelUtils:
    """Get a mock ModelUtils."""
    return decoy.mock(cls=ModelUtils)


@pytest.fixture
def mock_gantry_mover(decoy: Decoy) -> GantryMover:
    """Get a mock GantryMover."""
    return decoy.mock(cls=GantryMover)


async def test_save_position_implementation(
    decoy: Decoy,
    mock_model_utils: ModelUtils,
    mock_gantry_mover: GantryMover,
) -> None:
    """A SavePosition command should have an execution implementation."""
    subject = SavePositionImplementation(
        model_utils=mock_model_utils, gantry_mover=mock_gantry_mover
    )
    params = SavePositionParams(pipetteId="abc", positionId="123", failOnNotHomed=True)

    decoy.when(mock_model_utils.ensure_id("123")).then_return("456")

    decoy.when(
        await mock_gantry_mover.get_position(pipette_id="abc", fail_on_not_homed=True)
    ).then_return(Point(x=1, y=2, z=3))

    result = await subject.execute(params)

    assert result == SavePositionResult(
        positionId="456",
        position=DeckPoint(x=1, y=2, z=3),
    )
