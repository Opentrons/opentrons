import pytest
from decoy import Decoy

from robot_server.runs.run_store import (
    RunStore
)
from robot_server.service.legacy.reset_options_manager import ResetOptionsManager

from opentrons.config import reset as reset_util

@pytest.fixture
def mock_run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore."""
    return decoy.mock(cls=RunStore)

@pytest.fixture
def subject(decoy: Decoy) -> ResetOptionsManager:
    return ResetOptionsManager(run_store=mock_run_store)

def test_get_reset_options(subject: ResetOptionsManager):
    """Should get a list of reset options."""
    pass