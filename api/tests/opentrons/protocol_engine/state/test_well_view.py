"""Well view tests."""
from datetime import datetime
from opentrons.protocol_engine.types import (
    LoadedVolumeInfo,
    ProbedHeightInfo,
    ProbedVolumeInfo,
    LoadedVolumeSummary,
    ProbedHeightSummary,
    ProbedVolumeSummary,
)
import pytest
from opentrons.protocol_engine.state.wells import WellState, WellView


@pytest.fixture
def subject() -> WellView:
    """Get a well view test subject."""
    labware_id = "labware-id"
    well_name = "well-name"
    loaded_volume_info = LoadedVolumeInfo(
        volume=30.0, last_loaded=datetime.now(), operations_since_load=0
    )
    probed_height_info = ProbedHeightInfo(height=5.5, last_probed=datetime.now())
    probed_volume_info = ProbedVolumeInfo(
        volume=25.0, last_probed=datetime.now(), operations_since_probe=0
    )
    state = WellState(
        loaded_volumes={labware_id: {well_name: loaded_volume_info}},
        probed_heights={labware_id: {well_name: probed_height_info}},
        probed_volumes={labware_id: {well_name: probed_volume_info}},
    )

    return WellView(state)


def test_get_all(subject: WellView) -> None:
    """Should return a list of well summaries."""
    all_summaries = subject.get_all()

    assert len(all_summaries) == 3
    assert isinstance(all_summaries[0], LoadedVolumeSummary)
    assert all_summaries[0].volume == 30.0
    assert isinstance(all_summaries[1], ProbedHeightSummary)
    assert all_summaries[1].height == 5.5
    assert isinstance(all_summaries[2], ProbedVolumeSummary)
    assert all_summaries[2].volume == 25.0


def test_get_well_liquid_info(subject: WellView) -> None:
    """Should return a tuple of well infos."""
    labware_id = "labware-id"
    well_name = "well-name"
    lvi, phi, pvi = subject.get_well_liquid_info(
        labware_id=labware_id, well_name=well_name
    )

    assert lvi is not None
    assert phi is not None
    assert pvi is not None
    assert lvi.volume == 30.0
    assert phi.height == 5.5
    assert pvi.volume == 25.0
