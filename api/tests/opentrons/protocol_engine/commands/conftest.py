import pytest
from decoy import Decoy

from opentrons.protocol_engine.execution import CommandHandlers


@pytest.fixture
def command_handlers(decoy: Decoy) -> CommandHandlers:
    """Get a mock in the shape of a CommandHandlers container."""
    return decoy.create_decoy(spec=CommandHandlers)
