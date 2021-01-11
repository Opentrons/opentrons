"""Execution test fixtures."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.execution.movement import MovementHandler


@pytest.fixture
def mock_movement_handler(decoy: Decoy) -> MovementHandler:
    """Get a mock in the shape of a MovementHandler."""
    return decoy.create_decoy(spec=MovementHandler)
