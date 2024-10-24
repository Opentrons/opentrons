"""Well view tests."""
from datetime import datetime
from opentrons.protocol_engine.types import (
    LoadedVolumeInfo,
    ProbedHeightInfo,
    ProbedVolumeInfo,
)
import pytest
from opentrons.protocol_engine.state.wells import WellState, WellView


@pytest.fixture
def subject() -> WellView:
    """Get a well view test subject."""
    loaded_volume_info = LoadedVolumeInfo(
        volume=30.0, last_loaded=datetime.now(), operations_since_load=0
    )
    probed_height_info = ProbedHeightInfo(height=5.5, last_probed=datetime.now())
    probed_volume_info = ProbedVolumeInfo(
        volume=25.0, last_probed=datetime.now(), operations_since_probe=0
    )
    state = WellState(
        loaded_volumes={"labware_id_1": {"well_name": loaded_volume_info}},
        probed_heights={"labware_id_2": {"well_name": probed_height_info}},
        probed_volumes={"labware_id_2": {"well_name": probed_volume_info}},
    )

    return WellView(state)


def test_get_well_liquid_info(subject: WellView) -> None:
    """Should return a tuple of well infos."""
    lvi, phi, pvi = subject.get_well_liquid_info(
        labware_id="labware_id_1", well_name="well_name"
    )
    assert lvi is not None
    assert phi is None
    assert pvi is None
    assert lvi.volume == 30.0

    lvi, phi, pvi = subject.get_well_liquid_info(
        labware_id="labware_id_2", well_name="well_name"
    )
    assert lvi is None
    assert phi is not None
    assert pvi is not None
    assert phi.height == 5.5
    assert pvi.volume == 25.0


def test_get_all(subject: WellView) -> None:
    """Should return a list of well summaries."""
    summaries = subject.get_all()

    assert len(summaries) == 2, f"{summaries}"
    assert summaries[0].loaded_volume == 30.0
    assert summaries[1].probed_height == 5.5
    assert summaries[1].probed_volume == 25.0
