"""State test fixtures."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.state.labware import LabwareView
from opentrons.protocol_engine.state.pipettes import PipetteView
from opentrons.protocol_engine.state.geometry import GeometryView


@pytest.fixture
def labware_view(decoy: Decoy) -> LabwareView:
    """Get a mock in the shape of a LabwareView."""
    return decoy.create_decoy(spec=LabwareView)


@pytest.fixture
def pipette_view(decoy: Decoy) -> PipetteView:
    """Get a mock in the shape of a PipetteView."""
    return decoy.create_decoy(spec=PipetteView)


@pytest.fixture
def geometry_view(decoy: Decoy) -> GeometryView:
    """Get a mock in the shape of a GeometryView."""
    return decoy.create_decoy(spec=GeometryView)
