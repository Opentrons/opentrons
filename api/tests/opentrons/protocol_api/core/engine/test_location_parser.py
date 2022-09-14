"""Tests for opentrons.protocol_api.core.engine.location_parser."""

import pytest
from decoy import Decoy

from opentrons.types import Location, Point
from opentrons.protocol_api import Well, Labware
from opentrons.protocol_api.core.engine import location_parser as subject, LabwareCore
from opentrons.protocol_engine.types import WellLocation


@pytest.fixture
def mock_labware_core(decoy: Decoy) -> LabwareCore:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=LabwareCore)


def test_resolve_move_to_well_args(decoy: Decoy, mock_labware_core: LabwareCore) -> None:
    """It should resolve move to well arguments from a location."""
    mock_location = decoy.mock(cls=Location)
    mock_labware = decoy.mock(cls=Labware)
    mock_well = decoy.mock(cls=Well)

    decoy.when(mock_location.labware.get_parent_labware_and_well()).then_return((mock_labware, mock_well))
    decoy.when(mock_labware._implementation).then_return(mock_labware_core)

    decoy.when(mock_labware_core.labware_id).then_return("123")
    decoy.when(mock_well.well_name).then_return("abc")

    result = subject.resolve_move_to_well_args(mock_location)
    assert result == ("123", "abc", WellLocation())
