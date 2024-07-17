"""Well view tests."""
from datetime import datetime
from opentrons.protocol_engine.types import LiquidHeightInfo
import pytest
from opentrons.protocol_engine.state.wells import WellState, WellView


@pytest.fixture
def subject() -> WellView:
    """Get a well view test subject."""
    labware_id = "labware-id"
    well_name = "well-name"
    height_info = LiquidHeightInfo(height=0.5, last_measured=datetime.now())
    state = WellState(measured_liquid_heights={labware_id: {well_name: height_info}})

    return WellView(state)


def test_get_all(subject: WellView) -> None:
    """Should return a list of well heights."""
    assert subject.get_all()[0].height == 0.5


def test_get_last_measured_liquid_height(subject: WellView) -> None:
    """Should return the height of a single well correctly for valid wells."""
    labware_id = "labware-id"
    well_name = "well-name"

    invalid_labware_id = "invalid-labware-id"
    invalid_well_name = "invalid-well-name"

    assert (
        subject.get_last_measured_liquid_height(invalid_labware_id, invalid_well_name)
        is None
    )
    assert subject.get_last_measured_liquid_height(labware_id, well_name) == 0.5


def test_has_measured_liquid_height(subject: WellView) -> None:
    """Should return True for measured wells and False for ones that have no measurements."""
    labware_id = "labware-id"
    well_name = "well-name"

    invalid_labware_id = "invalid-labware-id"
    invalid_well_name = "invalid-well-name"

    assert (
        subject.has_measured_liquid_height(invalid_labware_id, invalid_well_name)
        is False
    )
    assert subject.has_measured_liquid_height(labware_id, well_name) is True
