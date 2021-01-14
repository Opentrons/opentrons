"""State test fixtures."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.state.labware import LabwareStore
from opentrons.protocol_engine.state.pipettes import PipetteStore
from opentrons.protocol_engine.state.geometry import GeometryStore


@pytest.fixture
def mock_labware_store(decoy: Decoy) -> LabwareStore:
    """Get a mock in the shape of a LabwareStore."""
    return decoy.create_decoy(spec=LabwareStore)


@pytest.fixture
def mock_pipette_store(decoy: Decoy) -> PipetteStore:
    """Get a mock in the shape of a PipetteStore."""
    return decoy.create_decoy(spec=PipetteStore)


@pytest.fixture
def mock_geometry_store(decoy: Decoy) -> GeometryStore:
    """Get a mock in the shape of a GeometryStore."""
    return decoy.create_decoy(spec=GeometryStore)
