"""Tests for the InstrumentContext public interface."""
import pytest
from decoy import Decoy

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, Labware, Well
from opentrons.protocol_api.core.common import LabwareCore, WellCore


@pytest.fixture
def mock_labware_core(decoy: Decoy) -> LabwareCore:
    """Get a mock labware implementation core."""
    return decoy.mock(cls=LabwareCore)


@pytest.fixture
def api_version() -> APIVersion:
    """Get the API version to test at."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def subject(mock_labware_core: LabwareCore, api_version: APIVersion) -> Labware:
    """Get a Labware test subject with its dependencies mocked out."""
    return Labware(implementation=mock_labware_core, api_version=api_version)


@pytest.mark.parametrize("api_version", [APIVersion(2, 0), APIVersion(2, 1)])
def test_api_version(api_version: APIVersion, subject: Labware) -> None:
    """It should have an api_version property."""
    assert subject.api_version == api_version


def test_is_tiprack(
    decoy: Decoy, mock_labware_core: LabwareCore, subject: Labware
) -> None:
    """It should report if it's a tip rack."""
    decoy.when(mock_labware_core.is_tip_rack()).then_return(True)
    assert subject.is_tiprack is True

    decoy.when(mock_labware_core.is_tip_rack()).then_return(False)
    assert subject.is_tiprack is False


def test_wells(decoy: Decoy, mock_labware_core: LabwareCore, subject: Labware) -> None:
    """It should return a list of wells."""
    mock_well_core_1 = decoy.mock(cls=WellCore)
    mock_well_core_2 = decoy.mock(cls=WellCore)

    decoy.when(mock_labware_core.get_wells()).then_return(
        [mock_well_core_1, mock_well_core_2]
    )
    decoy.when(mock_well_core_1.get_name()).then_return("Z42")
    decoy.when(mock_well_core_1.get_max_volume()).then_return(100)
    decoy.when(mock_well_core_2.get_name()).then_return("X1")
    decoy.when(mock_well_core_1.get_max_volume()).then_return(1000)

    result = subject.wells()

    assert len(result) == 2
    assert isinstance(result[0], Well)
    assert result[0].well_name == "Z42"
    assert isinstance(result[1], Well)
    assert result[1].well_name == "X1"
